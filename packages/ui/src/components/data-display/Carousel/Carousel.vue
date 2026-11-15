<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, useAttrs, watch } from 'vue'
import { RequiredPartsProbe, requireOneOf, useRequiredParts } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import CarouselPlayPause from './CarouselPlayPause.vue'
import { carouselKey } from './context'
import type { CarouselOrientation } from './variants'

export interface CarouselProps extends BaseProps {
  /** Scroll direction. A vertical carousel needs a fixed height on `CarouselContent`. */
  orientation?: CarouselOrientation
  /** Wrap around: next on the last slide goes to the first and vice versa. */
  loop?: boolean
  /**
   * Advance automatically. Never runs under prefers-reduced-motion, stops while the pointer is over the carousel
   * or focus is inside it, and shows a pause/play button (WCAG 2.2.2) unless `pauseButton` is false.
   */
  autoplay?: boolean
  /** Autoplay delay in ms; non-finite or <= 0 falls back to 5000. */
  interval?: number
  /** Pause autoplay while the pointer is over the carousel (focus inside always pauses). */
  pauseOnHover?: boolean
  /** `aria-live` of the slide track: `auto` = off while autoplay is running, polite otherwise. */
  live?: 'auto' | 'off' | 'polite' | 'assertive'
  /** Accessible name of the carousel region (or pass `aria-label` / `aria-labelledby`). Required. */
  label?: string
  /** Render the built-in pause/play button while `autoplay` is on. Set false only when you place `CarouselPlayPause` yourself. */
  pauseButton?: boolean
}

const props = withDefaults(defineProps<CarouselProps>(), {
  orientation: 'horizontal',
  interval: 5000,
  pauseOnHover: true,
  live: 'auto',
  pauseButton: true,
})

const attrs = useAttrs()
useRequiredParts('Carousel', [
  { part: 'CarouselContent', hint: 'Compose Carousel > CarouselContent > CarouselItem.' },
  { part: 'CarouselItem', hint: 'Put at least one CarouselItem inside CarouselContent.' },
])
useMountedCheck(() =>
  requireOneOf('Carousel', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'Name it so several carousels on a page can be told apart, e.g. `label="Product photos"`.'),
)

/** Active slide index (v-model). Works uncontrolled too. */
const model = defineModel<number>({ default: 0 })

const REDUCED = '(prefers-reduced-motion: reduce)'
const DEFAULT_INTERVAL = 5000
const SETTLE_MS = 100

const slides = shallowRef<HTMLElement[]>([])
const contentEl = ref<HTMLElement | null>(null)
const reduced = ref(false)
const hovered = ref(false)
const focused = ref(false)
const userPaused = ref(false)

const count = computed(() => slides.value.length)
const orientation = computed<CarouselOrientation>(() => (props.orientation === 'vertical' ? 'vertical' : 'horizontal'))
const current = computed(() => {
  const n = count.value
  const v = Number.isFinite(model.value) ? Math.round(model.value) : 0
  return n === 0 ? Math.max(0, v) : Math.min(n - 1, Math.max(0, v))
})
const canPrev = computed(() => count.value > 1 && (props.loop || current.value > 0))
const canNext = computed(() => count.value > 1 && (props.loop || current.value < count.value - 1))
const paused = computed(() => (props.pauseOnHover && hovered.value) || focused.value)
const autoplayAvailable = computed(() => !!props.autoplay && !reduced.value && count.value > 1)
const running = computed(() => autoplayAvailable.value && canNext.value && !paused.value && !userPaused.value)
const toggleAutoplay = () => (userPaused.value = !userPaused.value)
const live = computed<'off' | 'polite' | 'assertive'>(() => {
  if (props.live === 'auto') return running.value ? 'off' : 'polite'
  return props.live === 'off' || props.live === 'assertive' ? props.live : 'polite'
})

function registerSlide(el: HTMLElement) {
  if (slides.value.includes(el)) return
  const next = [...slides.value, el]
  next.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
  slides.value = next
}
function unregisterSlide(el: HTMLElement) {
  slides.value = slides.value.filter((s) => s !== el)
}

function offsetOf(el: HTMLElement) {
  return orientation.value === 'horizontal' ? el.offsetLeft : el.offsetTop
}
function scrollPos(el: HTMLElement) {
  return orientation.value === 'horizontal' ? el.scrollLeft : el.scrollTop
}

function scrollToSlide(index: number, instant = false) {
  const el = contentEl.value
  const slide = slides.value[index]
  if (!el || !slide) return
  const pos = offsetOf(slide)
  if (Math.abs(pos - scrollPos(el)) < 1) return
  el.scrollTo({
    [orientation.value === 'horizontal' ? 'left' : 'top']: pos,
    behavior: instant || reduced.value ? 'auto' : 'smooth',
  })
}

function goTo(index: number) {
  const n = count.value
  if (n === 0 || !Number.isFinite(index)) return
  const i = Math.round(index)
  const target = props.loop ? ((i % n) + n) % n : Math.min(n - 1, Math.max(0, i))
  // A changed index is scrolled into view by the `current` watcher; an unchanged one is just re-snapped.
  if (target === current.value) scrollToSlide(target)
  else model.value = target
}
const next = () => canNext.value && goTo(current.value + 1)
const prev = () => canPrev.value && goTo(current.value - 1)

// Scroll position -> index. Debounced so smooth programmatic scrolls do not fight the model.
let settleTimer: ReturnType<typeof setTimeout> | undefined
let fromScroll = false

function nearest(): number {
  const el = contentEl.value
  if (!el || count.value === 0) return 0
  const horizontal = orientation.value === 'horizontal'
  const size = horizontal ? el.clientWidth : el.clientHeight
  const total = horizontal ? el.scrollWidth : el.scrollHeight
  const pos = scrollPos(el)
  if (total > size && pos + size >= total - 1) return count.value - 1
  let best = 0
  let bestDist = Infinity
  slides.value.forEach((s, i) => {
    const d = Math.abs(offsetOf(s) - pos)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}
function onScroll() {
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    settleTimer = undefined
    const idx = nearest()
    if (idx !== current.value) {
      fromScroll = true
      model.value = idx
    }
  }, SETTLE_MS)
}

watch(current, (i) => {
  if (fromScroll) {
    fromScroll = false
    return
  }
  scrollToSlide(i)
}, { flush: 'post' })

// Autoplay
let playTimer: ReturnType<typeof setTimeout> | undefined
function arm() {
  clearTimeout(playTimer)
  playTimer = undefined
  if (!running.value) return
  const ms = Number.isFinite(props.interval) && props.interval > 0 ? props.interval : DEFAULT_INTERVAL
  playTimer = setTimeout(() => {
    playTimer = undefined
    next()
  }, ms)
}
watch([running, current, () => props.interval], arm)

let mq: MediaQueryList | undefined
const onMq = (e: MediaQueryListEvent) => (reduced.value = e.matches)

onMounted(() => {
  mq = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED) : undefined
  reduced.value = !!mq?.matches
  mq?.addEventListener('change', onMq)
  if (current.value > 0) scrollToSlide(current.value, true)
  arm()
})
onBeforeUnmount(() => {
  clearTimeout(settleTimer)
  clearTimeout(playTimer)
  mq?.removeEventListener('change', onMq)
})

function isEditable(t: EventTarget | null) {
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
}
/** Keys typed on links, buttons and form fields inside a slide keep their own behaviour; arrows work on the track. */
function isInteractive(t: EventTarget | null) {
  return t instanceof HTMLElement && t !== contentEl.value && !!t.closest('a[href],button,input,select,textarea,summary,[contenteditable]')
}
function onKeydown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target) || isInteractive(e.target)) return
  const [back, forward] = orientation.value === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']
  if (e.key === back) prev()
  else if (e.key === forward) next()
  else if (e.key === 'Home') goTo(0)
  else if (e.key === 'End') goTo(count.value - 1)
  else return
  e.preventDefault()
}
function onFocusout(e: FocusEvent) {
  const root = e.currentTarget as HTMLElement
  if (!(e.relatedTarget instanceof Node) || !root.contains(e.relatedTarget)) focused.value = false
}

provide(carouselKey, {
  orientation,
  current,
  count,
  slides,
  contentEl,
  live,
  playing: running,
  autoplayAvailable,
  userPaused,
  toggleAutoplay,
  canPrev,
  canNext,
  prev,
  next,
  goTo,
  registerSlide,
  unregisterSlide,
  onScroll,
})

defineExpose({ goTo, next, prev, current, count })

const classes = computed(() => cn('relative', props.class))
</script>

<template>
  <div
    data-slot="carousel"
    role="region"
    aria-roledescription="carousel"
    :aria-label="label"
    :data-orientation="orientation"
    :data-playing="running ? '' : undefined"
    :class="classes"
    @keydown="onKeydown"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @focusin="focused = true"
    @focusout="onFocusout"
  >
    <RequiredPartsProbe owner="Carousel" />
    <CarouselPlayPause v-if="pauseButton && autoplayAvailable" />
    <slot :index="current" :count="count" :go-to="goTo" :next="next" :prev="prev" />
  </div>
</template>
