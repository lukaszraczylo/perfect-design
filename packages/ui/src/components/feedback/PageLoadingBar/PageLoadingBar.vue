<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { pick } from '../pick'
import {
  PAGE_LOADING_BAR_SIZES,
  PAGE_LOADING_BAR_TONES,
  pageLoadingBarFillVariants,
  pageLoadingBarVariants,
  type PageLoadingBarSize,
  type PageLoadingBarTone,
} from './variants'

export interface PageLoadingBarProps extends BaseProps {
  /** True while a navigation or page load is in flight. */
  active?: boolean
  /** Milliseconds to wait before showing, so fast navigations never flash. Default 150. */
  delay?: number
  /** Minimum milliseconds the bar stays visible once shown. Default 300. */
  minDuration?: number
  tone?: PageLoadingBarTone
  /** Thickness: xs 2px, sm 4px (default), md 6px. Unknown values fall back to sm. */
  size?: PageLoadingBarSize
  /** Accessible name. Default "Loading page". */
  label?: string
}

const props = withDefaults(defineProps<PageLoadingBarProps>(), {
  active: false,
  delay: 150,
  minDuration: 300,
  tone: 'primary',
  size: 'sm',
  label: 'Loading page',
})

type Phase = 'idle' | 'loading' | 'finishing' | 'fading'
const FINISH_HOLD_MS = 150
const FADE_MS = 300

const phase = ref<Phase>('idle')
let shownAt = 0
let timer: ReturnType<typeof setTimeout> | undefined

const ms = (value: unknown, fallback: number) => (Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback)

function clear() {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

function schedule(fn: () => void, wait: number) {
  clear()
  timer = setTimeout(() => {
    timer = undefined
    fn()
  }, wait)
}

function show() {
  shownAt = Date.now()
  phase.value = 'loading'
}

function finish() {
  phase.value = 'finishing'
  schedule(() => {
    phase.value = 'fading'
    schedule(() => (phase.value = 'idle'), FADE_MS)
  }, FINISH_HOLD_MS)
}

function start() {
  if (phase.value !== 'idle') {
    // Came back during the finish or fade: keep the bar and resume loading.
    clear()
    phase.value = 'loading'
    return
  }
  clear()
  const wait = ms(props.delay, 150)
  if (wait === 0) show()
  else schedule(show, wait)
}

function stop() {
  if (phase.value === 'idle') {
    clear() // still inside the delay: it never showed
    return
  }
  if (phase.value !== 'loading') return
  clear()
  const remaining = ms(props.minDuration, 300) - (Date.now() - shownAt)
  if (remaining > 0) schedule(finish, remaining)
  else finish()
}

// Timers start after mount so the server render and the first client render are both idle.
onMounted(() => {
  if (props.active) start()
})
watch(
  () => props.active,
  (active) => (active ? start() : stop()),
)
onBeforeUnmount(clear)

const visible = computed(() => phase.value !== 'idle')
const rootClasses = computed(() =>
  cn(
    pageLoadingBarVariants({ size: pick(props.size, PAGE_LOADING_BAR_SIZES, 'sm') }),
    !visible.value && 'invisible',
    phase.value === 'fading' && 'opacity-0 transition-opacity duration-300 motion-reduce:transition-none',
    props.class,
  ),
)
const fillClasses = computed(() =>
  cn(
    pageLoadingBarFillVariants({ tone: pick(props.tone, PAGE_LOADING_BAR_TONES, 'primary') }),
    'forced-colors:bg-[Highlight]',
    phase.value === 'loading' || phase.value === 'idle'
      ? 'absolute inset-y-0 animate-ds-sweep motion-reduce:start-0 motion-reduce:w-full motion-reduce:animate-none'
      : 'absolute inset-y-0 start-0 w-full',
  ),
)
</script>

<template>
  <div
    data-slot="page-loading-bar"
    :data-state="phase"
    :role="visible ? 'progressbar' : undefined"
    :aria-label="visible ? label : undefined"
    :aria-valuemin="visible ? 0 : undefined"
    :aria-valuemax="visible ? 100 : undefined"
    :aria-valuenow="phase === 'finishing' || phase === 'fading' ? 100 : undefined"
    :aria-hidden="visible ? undefined : 'true'"
    :class="rootClasses"
  >
    <div data-slot="page-loading-bar-fill" :class="fillClasses" />
  </div>
</template>
