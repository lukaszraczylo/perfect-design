<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import {
  infiniteScrollErrorVariants,
  infiniteScrollFooterVariants,
  infiniteScrollSizes,
  infiniteScrollSpinnerVariants,
  infiniteScrollVariantNames,
  type InfiniteScrollSize,
  type InfiniteScrollVariant,
} from './variants'

export interface InfiniteScrollProps extends BaseProps {
  /** A page is being fetched: shows the `loading` slot and blocks further `load` events. Set it synchronously in your `@load` handler. */
  loading?: boolean
  /** Nothing left to fetch: shows the `end` slot and stops observing. */
  finished?: boolean
  /** Last fetch failed: shows the `error` slot (with a retry button) and stops auto-loading. A string is shown as the message. */
  error?: boolean | string
  /** Pause loading without changing what is shown. */
  disabled?: boolean
  /** Scroll container: an element, or a CSS selector resolved after mount. `null` / not found = the viewport. */
  root?: HTMLElement | string | null
  /** IntersectionObserver `rootMargin`: how early (e.g. `200px` = 200px before the end) `load` fires. Invalid values fall back to the scroll-listener path. */
  rootMargin?: string
  /** Footer density: `default` (py-4, stacked error) or `compact` (py-2, error on one row). Unknown values fall back to `default`. */
  variant?: InfiniteScrollVariant
  /** Footer text and spinner size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: InfiniteScrollSize
}

const props = withDefaults(defineProps<InfiniteScrollProps>(), {
  loading: false,
  finished: false,
  error: false,
  disabled: false,
  root: null,
  rootMargin: '200px',
  variant: 'default',
  size: 'md',
})

const emit = defineEmits<{
  /** Sentinel reached (or retry pressed): fetch the next page. */
  load: []
  /** The retry button was pressed (`load` is emitted right after). */
  retry: []
}>()

defineSlots<{
  default?: () => unknown
  loading?: () => unknown
  end?: () => unknown
  error?: (props: { retry: () => void; error: boolean | string }) => unknown
}>()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let removeFallback: (() => void) | null = null
let latched = false
let alive = false

const variant = computed<InfiniteScrollVariant>(() => (infiniteScrollVariantNames.includes(props.variant) ? props.variant : 'default'))
const size = computed<InfiniteScrollSize>(() => (infiniteScrollSizes.includes(props.size) ? props.size : 'md'))
const footer = computed(() => infiniteScrollFooterVariants({ variant: variant.value, size: size.value }))
const loadingClasses = computed(() => cn('flex items-center justify-center gap-2 text-muted-foreground', footer.value))
const endClasses = computed(() => cn('text-center text-muted-foreground', footer.value))
const errorClasses = computed(() => cn(infiniteScrollErrorVariants({ variant: variant.value }), footer.value))
const spinnerClasses = computed(() => infiniteScrollSpinnerVariants({ size: size.value }))

const canLoad = computed(() => !props.loading && !props.finished && !props.disabled && !props.error)
const state = computed(() => (props.loading ? 'loading' : props.error ? 'error' : props.finished ? 'finished' : 'idle'))
const message = computed(() => (typeof props.error === 'string' && props.error ? props.error : 'Something went wrong.'))

/** Dedupe: one `load` per tick, and none until `loading` has gone true -> false (when the parent uses it). */
function release() {
  void nextTick(() => {
    if (!props.loading) latched = false
  })
}

function trigger() {
  if (!alive || latched || !canLoad.value) return
  latched = true
  emit('load')
  release()
}

function retry() {
  if (latched || props.loading || props.disabled) return
  latched = true
  emit('retry')
  emit('load')
  release()
}

function resolveRoot(): HTMLElement | null {
  const r = props.root
  if (typeof r === 'string') {
    try {
      return r ? document.querySelector<HTMLElement>(r) : null
    } catch {
      return null
    }
  }
  return r ?? null
}

/** Bottom component of a CSS-like margin string (px or %); anything unparsable counts as 0. */
function bottomMargin(margin: string, height: number): number {
  const parts = margin.trim().split(/\s+/)
  const raw = parts[2] ?? parts[0] ?? ''
  const m = /^(-?\d*\.?\d+)(px|%)?$/.exec(raw)
  if (!m) return 0
  return m[2] === '%' ? (Number(m[1]) / 100) * height : Number(m[1])
}

function check(rootEl: HTMLElement | null) {
  const el = sentinel.value
  if (!el) return
  const bottom = rootEl ? rootEl.getBoundingClientRect().bottom : window.innerHeight
  const height = rootEl ? rootEl.getBoundingClientRect().height : window.innerHeight
  if (el.getBoundingClientRect().top <= bottom + bottomMargin(props.rootMargin, height)) trigger()
}

function disconnect() {
  observer?.disconnect()
  observer = null
  removeFallback?.()
  removeFallback = null
}

function connect() {
  disconnect()
  const el = sentinel.value
  if (!alive || !el || !canLoad.value || typeof window === 'undefined') return
  const rootEl = resolveRoot()
  if (typeof IntersectionObserver === 'function') {
    try {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) trigger()
        },
        { root: rootEl, rootMargin: props.rootMargin },
      )
      io.observe(el)
      observer = io
      return
    } catch {
      /* invalid rootMargin / root: use the scroll fallback */
    }
  }
  const target: HTMLElement | Window = rootEl ?? window
  const onScroll = () => check(rootEl)
  target.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  removeFallback = () => {
    target.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
  check(rootEl)
}


// A selector that matches nothing silently falls back to the viewport, so a scroll container that is not found is a mistake.
function checkRoot() {
  const r = props.root
  if (typeof r !== 'string' || !r) return
  if (!resolveRoot()) {
    violation('InfiniteScroll', 'root-not-found', `has \`root\` "${r}" but no element in the page matches it, so it would watch the viewport instead. Pass an existing scroll container (element or valid selector), or leave \`root\` unset.`)
  }
}

const vnode = getCurrentInstance()?.vnode
onMounted(() => {
  alive = true
  connect()
})
onMounted(async () => {
  await nextTick()
  checkRoot()
  // Without a `load` listener nothing ever fetches the next page: the component would sit there doing nothing.
  if (!props.finished && !vnode?.props?.onLoad) {
    violation('InfiniteScroll', 'requires-load-listener', 'requires an `@load` handler that fetches the next page (set `loading` while it runs). Without it nothing is ever loaded.')
  }
})

watch(
  () => [props.loading, props.finished, props.error, props.disabled, props.root, props.rootMargin] as const,
  () => {
    if (!props.loading) latched = false
    connect()
  },
)

onBeforeUnmount(() => {
  alive = false
  disconnect()
})

defineExpose({
  /** Re-check the sentinel now (e.g. after content changed size). */
  check: connect,
})
</script>

<template>
  <div data-slot="infinite-scroll" :data-state="state" :data-variant="variant === 'default' ? undefined : variant" :aria-busy="loading ? 'true' : undefined" :class="cn('relative', props.class)">
    <slot />
    <div data-slot="infinite-scroll-status" role="status" aria-live="polite">
      <div v-if="loading" data-slot="infinite-scroll-loading" :class="loadingClasses">
        <slot name="loading">
          <span aria-hidden="true" :class="spinnerClasses" />
          <span>Loading…</span>
        </slot>
      </div>
      <div v-else-if="finished && !error" data-slot="infinite-scroll-end" :class="endClasses">
        <slot name="end">No more results.</slot>
      </div>
    </div>
    <div v-if="error && !loading" data-slot="infinite-scroll-error" role="alert" :class="errorClasses">
      <slot name="error" :retry="retry" :error="error">
        <span>{{ message }}</span>
        <button
          type="button"
          data-slot="infinite-scroll-retry"
          :class="cn('min-h-6 rounded-md border border-input bg-background px-3 py-1 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground pointer-coarse:min-h-11 disabled:pointer-events-none disabled:opacity-50', focusRing)"
          :disabled="disabled"
          @click="retry"
        >
          Try again
        </button>
      </slot>
    </div>
    <div ref="sentinel" data-slot="infinite-scroll-sentinel" aria-hidden="true" class="pointer-events-none h-px w-full" />
  </div>
</template>
