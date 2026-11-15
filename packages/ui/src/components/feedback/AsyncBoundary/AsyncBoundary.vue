<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import EmptyState from '../EmptyState/EmptyState.vue'
import ErrorState from '../ErrorState/ErrorState.vue'
import LoadingState from '../LoadingState/LoadingState.vue'
import type { LoadingStateVariant } from '../LoadingState/variants'
import { checkAfterMount } from '../requireContent'
import { pick } from '../pick'
import { describeError } from './describeError'
import {
  ASYNC_BOUNDARY_SIZES,
  ASYNC_BOUNDARY_STATES,
  ASYNC_BOUNDARY_VARIANTS,
  asyncBoundaryContentVariants,
  asyncBoundaryVariants,
  type AsyncBoundarySize,
  type AsyncBoundaryState,
  type AsyncBoundaryVariant,
} from './variants'

export interface AsyncBoundaryProps extends BaseProps {
  /**
   * The state to show: `idle`, `loading`, `error`, `empty` or `success` (the default slot). When set it wins over `promise`.
   * Unknown values fall back to `success`.
   */
  state?: AsyncBoundaryState
  /**
   * A promise to follow instead of `state`: pending is `loading`, rejected is `error`, fulfilled is `success` (or `empty`, see `isEmpty`).
   * `null` means "not started" (`idle`). Swapping the promise ignores the old one, even if it settles later.
   */
  promise?: PromiseLike<unknown> | null
  /** What went wrong: a string, an Error, `{ message }` or anything else. Shown as plain text, shortened when long. Overrides a rejection reason. */
  error?: unknown
  /** `default` (no surface), `card` (bordered surface) or `compact` (single-row error, dense empty state, inline loader). */
  variant?: AsyncBoundaryVariant
  /** Scale of the built-in loading, error and empty states: `sm`, `md` (default) or `lg`. */
  size?: AsyncBoundarySize
  /** Milliseconds to wait before the loading state appears. A load that finishes sooner never shows it. 0 shows it at once. */
  delay?: number
  /** Milliseconds the loading state stays once it has appeared, so it does not flash. 0 removes it as soon as the load ends. */
  minDuration?: number
  /** Text of the built-in loading state; also announced when a custom `loading` slot is used. */
  loadingLabel?: string
  /** Skeleton or spinner look of the built-in loading state (the `variant` of LoadingState). */
  loadingVariant?: LoadingStateVariant
  /** Heading of the built-in error state. */
  errorTitle?: string
  /** Your own wording for the built-in error state. The real error then moves into its collapsible technical details. */
  errorMessage?: string
  /** Show the retry button of the built-in error state. Needs an `@retry` handler. */
  retryable?: boolean
  retryLabel?: string
  /** Heading of the built-in empty state. */
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: IconDefinition
  /** Decides whether a fulfilled promise value counts as empty. Default: null, undefined, an empty array, string, Set or Map. */
  isEmpty?: (value: unknown) => boolean
  /** Announced politely when loading ends with content. An empty string turns the announcement off. */
  successLabel?: string
}

const props = withDefaults(defineProps<AsyncBoundaryProps>(), {
  state: undefined,
  promise: undefined,
  error: undefined,
  variant: 'default',
  size: 'md',
  delay: 0,
  minDuration: 0,
  loadingLabel: 'Loading…',
  loadingVariant: 'spinner',
  errorTitle: undefined,
  errorMessage: undefined,
  retryable: true,
  retryLabel: 'Try again',
  emptyTitle: 'Nothing to show',
  emptyDescription: undefined,
  emptyIcon: undefined,
  isEmpty: undefined,
  successLabel: 'Loaded.',
})
const emit = defineEmits<{ retry: [] }>()
const slots = useSlots()
const instance = getCurrentInstance()

// Contract: a boundary with nothing to show on success is a mistake, and a retry button that does nothing hides one.
checkAfterMount(() => {
  if (!slots.default) {
    violation('AsyncBoundary', 'requires-default-slot', 'requires the default slot: the content to show once loading succeeds.')
  }
  if (props.retryable && !slots.error && typeof instance?.vnode.props?.onRetry !== 'function') {
    violation('AsyncBoundary', 'requires-retry-handler', 'requires an `@retry` handler (or `:retryable="false"`, or an `error` slot): the retry button would do nothing.')
  }
})

type Display = AsyncBoundaryState | 'waiting'
type Settled = { status: 'pending' } | { status: 'fulfilled'; value: unknown } | { status: 'rejected'; reason: unknown }

const MAX_MS = 60_000
const ms = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.min(value, MAX_MS) : 0)

// 1. Follow the promise. A token ties every callback to the promise that created it, so a swapped or unmounted one is ignored.
const settled = ref<Settled | null>(null)
let token = 0
function follow(p: unknown) {
  const mine = ++token
  if (p === null || p === undefined || typeof (p as PromiseLike<unknown>).then !== 'function') {
    settled.value = null
    return
  }
  settled.value = { status: 'pending' }
  Promise.resolve(p as PromiseLike<unknown>).then(
    (value) => {
      if (mine === token) settled.value = { status: 'fulfilled', value }
    },
    (reason) => {
      if (mine === token) settled.value = { status: 'rejected', reason }
    },
  )
}
// The getter returns a box, not the promise: Vue would attach its own error handler to a promise returned from a watcher getter and report every rejection.
watch(() => ({ promise: props.promise }), (box) => follow(box.promise), { immediate: true })

const looksEmpty = (value: unknown): boolean => {
  if (props.isEmpty) {
    try {
      return !!props.isEmpty(value)
    } catch {
      return false
    }
  }
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Set || value instanceof Map) return value.size === 0
  return false
}

// 2. The state that is wanted now.
const target = computed<AsyncBoundaryState>(() => {
  if (props.state !== undefined && props.state !== null) return pick(props.state, ASYNC_BOUNDARY_STATES, 'success')
  if (props.promise === null) return 'idle'
  const s = settled.value
  if (!s) return 'success'
  if (s.status === 'pending') return 'loading'
  if (s.status === 'rejected') return 'error'
  return looksEmpty(s.value) ? 'empty' : 'success'
})
const data = computed(() => (settled.value?.status === 'fulfilled' ? settled.value.value : undefined))

// 3. The state that is shown. It follows `target`, delayed so a quick load never flashes and a shown loader stays a minimum time.
const initial = (): Display => (target.value === 'loading' && ms(props.delay) > 0 ? 'waiting' : target.value)
const display = ref<Display>(initial())
let timer: ReturnType<typeof setTimeout> | undefined
let shownAt = 0
const stopTimer = () => {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}
const showLoader = () => {
  display.value = 'loading'
  shownAt = Date.now()
}
function followTarget(t: AsyncBoundaryState) {
  stopTimer()
  if (t === 'loading') {
    if (display.value === 'loading') return
    const wait = ms(props.delay)
    if (wait === 0) return showLoader()
    // Keep finished content on screen while we wait; anything else shows nothing until the loader is due.
    if (display.value !== 'success' && display.value !== 'empty') display.value = 'waiting'
    timer = setTimeout(() => {
      timer = undefined
      showLoader()
    }, wait)
    return
  }
  if (display.value === 'loading') {
    const remaining = ms(props.minDuration) - (Date.now() - shownAt)
    if (remaining > 0) {
      timer = setTimeout(() => {
        timer = undefined
        display.value = target.value
      }, remaining)
      return
    }
  }
  display.value = t
}
watch(target, followTarget)
onMounted(() => {
  if (display.value === 'loading') shownAt = Date.now()
  else if (display.value === 'waiting') {
    timer = setTimeout(() => {
      timer = undefined
      showLoader()
    }, ms(props.delay))
  }
})
onBeforeUnmount(() => {
  stopTimer()
  token++ // a promise that settles after unmount is ignored
})

// 4. What a person hears. LoadingState and ErrorState announce themselves; this polite region covers the rest.
const errorSource = computed(() => (props.error !== undefined && props.error !== null ? props.error : settled.value?.status === 'rejected' ? settled.value.reason : undefined))
const errorText = computed(() => describeError(errorSource.value))
const shownMessage = computed(() => props.errorMessage?.trim() || errorText.value || 'The content could not be loaded.')
const shownDetails = computed(() => (props.errorMessage?.trim() && errorText.value ? errorText.value : undefined))
const announcement = ref('')
watch(display, (now, before) => {
  const finished = before === 'loading' || before === 'waiting'
  if (now === 'loading') announcement.value = slots.loading ? props.loadingLabel : ''
  else if (now === 'error') announcement.value = slots.error ? `${props.errorTitle || 'Something went wrong'}. ${shownMessage.value}` : ''
  else if (now === 'success') announcement.value = finished ? props.successLabel : ''
  else if (now === 'empty') announcement.value = finished && props.successLabel ? props.emptyTitle : ''
  else announcement.value = ''
})

const resolvedVariant = computed<AsyncBoundaryVariant>(() => pick(props.variant, ASYNC_BOUNDARY_VARIANTS, 'default'))
const resolvedSize = computed<AsyncBoundarySize>(() => pick(props.size, ASYNC_BOUNDARY_SIZES, 'md'))
const compact = computed(() => resolvedVariant.value === 'compact')
const busy = computed(() => target.value === 'loading' || display.value === 'loading' || display.value === 'waiting')
const classes = computed(() => cn(asyncBoundaryVariants({ variant: resolvedVariant.value, size: resolvedSize.value }), props.class))
const contentClasses = computed(() => asyncBoundaryContentVariants({ variant: resolvedVariant.value }))
</script>

<template>
  <div
    data-slot="async-boundary"
    :data-state="display"
    :data-variant="resolvedVariant === 'default' ? undefined : resolvedVariant"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :aria-busy="busy ? 'true' : undefined"
    :class="classes"
  >
    <div data-slot="async-boundary-status" role="status" class="sr-only">{{ announcement }}</div>
    <template v-if="display === 'loading'">
      <slot name="loading">
        <LoadingState
          :label="loadingLabel"
          :variant="loadingVariant"
          :size="resolvedSize"
          :layout="compact ? 'inline' : 'stacked'"
        />
      </slot>
    </template>
    <template v-else-if="display === 'error'">
      <slot name="error" :error="errorSource" :message="shownMessage" :retry="() => emit('retry')">
        <ErrorState
          :title="errorTitle"
          :message="shownMessage"
          :details="shownDetails"
          :variant="compact ? 'inline' : 'default'"
          :size="resolvedSize"
          :retryable="retryable"
          :retry-label="retryLabel"
          @retry="emit('retry')"
        />
      </slot>
    </template>
    <template v-else-if="display === 'empty'">
      <slot name="empty" :data="data">
        <EmptyState
          :title="emptyTitle"
          :description="emptyDescription"
          :icon="emptyIcon"
          :variant="compact ? 'compact' : 'default'"
          :size="resolvedSize"
        >
          <template v-if="$slots['empty-action']" #action><slot name="empty-action" /></template>
        </EmptyState>
      </slot>
    </template>
    <slot v-else-if="display === 'idle'" name="idle" />
    <div v-else-if="display === 'success'" data-slot="async-boundary-content" :class="contentClasses">
      <slot :data="data" />
    </div>
  </div>
</template>
