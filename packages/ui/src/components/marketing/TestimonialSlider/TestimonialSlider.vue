<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { faAngleLeft, faAngleRight } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { buttonVariants } from '../../primitives/Button/variants'
import { checkItems, ItemsChecked } from '../shared/itemsContract'
import { pickColumns, prefersReducedMotion } from '../shared/motion'
import Testimonial from '../Testimonial/Testimonial.vue'
import { testimonialProblem } from '../Testimonial/contract'
import { resolveTestimonialShape, resolveTestimonialSize, resolveTestimonialTone, resolveTestimonialVariant, type TestimonialShape, type TestimonialSize, type TestimonialTone, type TestimonialVariant } from '../Testimonial/variants'
import type { TestimonialItem } from '../TestimonialGrid/TestimonialGrid.vue'
import { resolveTestimonialSliderAlign, testimonialSlideVariants, testimonialSliderControlsVariants, testimonialSliderTrackVariants, type TestimonialSliderAlign, type TestimonialSliderPerView } from './variants'

export interface TestimonialSliderProps extends BaseProps {
  /** Convenience data source; for custom slides use the default slot (give each slide `snap-start shrink-0 basis-full`). */
  items?: TestimonialItem[]
  /** Variant of every generated Testimonial. Unknown values fall back to `card`. */
  variant?: TestimonialVariant
  /** Slides visible at once on large screens (1, 2 or 3). Always 1 on mobile. Invalid values fall back to 1. */
  perView?: TestimonialSliderPerView
  /** Quote and padding scale of every generated Testimonial: `sm`, `md` (default) or `lg`. */
  size?: TestimonialSize
  /** Surface of every generated Testimonial: `default`, `muted`, `primary` or `inverted`. */
  tone?: TestimonialTone
  /** Corners of every generated Testimonial: `rounded` (default) or `square`. */
  shape?: TestimonialShape
  /** Where the previous/next buttons sit: `start`, `center` or `end` (default). Unknown values fall back to `end`. */
  align?: TestimonialSliderAlign
  /** Show previous/next buttons. */
  controls?: boolean
  /** Accessible name of the carousel region. */
  label?: string
  /** Label of the previous button. */
  prevLabel?: string
  /** Label of the next button. */
  nextLabel?: string
  /** Accessible name of the scrollable track (the group of slides). */
  slidesLabel?: string
  /** Name of each generated slide; `{n}` and `{total}` are replaced. */
  slideLabel?: string
  /** Text announced (polite live region) once scrolling settles on a different slide; `{n}` and `{total}` are replaced. */
  statusLabel?: string
}

const props = withDefaults(defineProps<TestimonialSliderProps>(), {
  items: () => [],
  variant: 'card',
  perView: 1,
  size: 'md',
  tone: 'default',
  shape: 'rounded',
  align: 'end',
  controls: true,
  label: 'Testimonials',
  prevLabel: 'Previous testimonial',
  nextLabel: 'Next testimonial',
  slidesLabel: 'Slides',
  slideLabel: '{n} of {total}',
  statusLabel: 'Slide {n} of {total}',
})

const slots = useSlots()
onMounted(async () => {
  await nextTick()
  requireText('TestimonialSlider', 'label', props.label, 'It names the carousel region; the default is "Testimonials".')
  if (props.controls) {
    requireText('TestimonialSlider', 'prevLabel', props.prevLabel, 'It names the previous button.')
    requireText('TestimonialSlider', 'nextLabel', props.nextLabel, 'It names the next button.')
  }
  if (!slots.default) checkItems('TestimonialSlider', 'items', props.items, (item) => testimonialProblem(item))
})

const track = ref<HTMLElement | null>(null)
const canPrev = ref(false)
const canNext = ref(false)
const status = ref('')
let resizeObserver: ResizeObserver | null = null
let settleTimer: number | undefined
let settled = 0
const fill = (template: string, n: number, total: number) => template.replace('{n}', String(n)).replace('{total}', String(total))
const isRtl = () => !!track.value && getComputedStyle(track.value).direction === 'rtl'

const view = computed(() => pickColumns(props.perView, [1, 2, 3] as const, 1))
const variant = computed(() => resolveTestimonialVariant(props.variant))
const size = computed(() => resolveTestimonialSize(props.size))
const tone = computed(() => resolveTestimonialTone(props.tone))
const shape = computed(() => resolveTestimonialShape(props.shape))
const align = computed(() => resolveTestimonialSliderAlign(props.align))
const controlsClass = computed(() => testimonialSliderControlsVariants({ align: align.value }))
const slideClass = computed(() => testimonialSlideVariants({ perView: view.value }))
const trackClass = computed(() => cn(testimonialSliderTrackVariants(), focusRing, 'rounded-lg'))
const classes = computed(() => cn('relative flex flex-col gap-4', props.class))
const buttonClass = cn(buttonVariants({ variant: 'outline', size: 'icon', rounded: 'full' }))
const total = computed(() => props.items.length)

function measure() {
  const el = track.value
  if (!el) return
  // Math.abs: scrollLeft is negative in RTL. The start edge is always 0.
  const offset = Math.abs(el.scrollLeft)
  canPrev.value = offset > 1
  canNext.value = offset + el.clientWidth < el.scrollWidth - 1
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(settle, 150)
}

/** Index of the slide whose leading edge is nearest the track's leading edge. */
function currentIndex(el: HTMLElement): number {
  const rtl = isRtl()
  const box = el.getBoundingClientRect()
  const edge = rtl ? box.right : box.left
  let best = 0
  let bestDistance = Infinity
  Array.from(el.children).forEach((child, i) => {
    const rect = child.getBoundingClientRect()
    const distance = Math.abs((rtl ? rect.right : rect.left) - edge)
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  })
  return best
}

/** Runs once scrolling has stopped (`scrollend`, or a short debounce): announce only when the slide actually changed. */
function settle() {
  const w = typeof window === 'undefined' ? undefined : window
  w?.clearTimeout(settleTimer)
  const el = track.value
  if (!el) return
  const count = el.children.length
  const index = currentIndex(el)
  if (index !== settled && count > 0) status.value = fill(props.statusLabel, index + 1, count)
  settled = index
}

function page(direction: -1 | 1) {
  const el = track.value
  if (typeof el?.scrollBy !== 'function') return
  // "Next" is visually to the right in LTR and to the left in RTL.
  const sign = isRtl() ? -direction : direction
  el.scrollBy({ left: sign * el.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/** Arrow keys scroll the track itself (never keys pressed inside a nested control); they always follow the visual direction. */
function onKeydown(e: KeyboardEvent) {
  if (e.target !== track.value) return
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  const el = track.value
  if (typeof el?.scrollBy !== 'function') return
  el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * el.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

onMounted(() => {
  measure()
  settled = track.value ? currentIndex(track.value) : 0
  if (typeof ResizeObserver !== 'undefined' && track.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(track.value)
  }
})
onBeforeUnmount(() => {
  window.clearTimeout(settleTimer)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <section data-slot="testimonial-slider" role="region" aria-roledescription="carousel" :aria-label="label" :data-per-view="view" :data-variant="variant" :data-size="size" :data-tone="tone" :data-shape="shape" :data-align="align" :class="classes">
    <div
      ref="track"
      data-slot="testimonial-slider-track"
      role="group"
      :aria-label="slidesLabel"
      tabindex="0"
      aria-live="off"
      :class="trackClass"
      @scroll.passive="measure"
      @scrollend="settle"
      @keydown="onKeydown"
    >
      <slot>
        <div
          v-for="(item, i) in items"
          :key="`${i}-${item.author ?? ''}`"
          data-slot="testimonial-slider-slide"
          role="group"
          aria-roledescription="slide"
          :aria-label="fill(slideLabel, i + 1, total)"
          :class="slideClass"
        >
          <ItemsChecked><Testimonial v-bind="item" :variant="variant" :size="size" :tone="tone" :shape="shape" class="h-full" /></ItemsChecked>
        </div>
      </slot>
    </div>
    <p data-slot="testimonial-slider-status" role="status" aria-live="polite" class="sr-only">{{ status }}</p>
    <div v-if="controls" data-slot="testimonial-slider-controls" :class="controlsClass">
      <button type="button" data-slot="testimonial-slider-prev" :aria-label="prevLabel" :aria-disabled="canPrev ? undefined : 'true'" :class="buttonClass" @click="canPrev && page(-1)">
        <Icon :icon="faAngleLeft" class="rtl:-scale-x-100" />
      </button>
      <button type="button" data-slot="testimonial-slider-next" :aria-label="nextLabel" :aria-disabled="canNext ? undefined : 'true'" :class="buttonClass" @click="canNext && page(1)">
        <Icon :icon="faAngleRight" class="rtl:-scale-x-100" />
      </button>
    </div>
  </section>
</template>
