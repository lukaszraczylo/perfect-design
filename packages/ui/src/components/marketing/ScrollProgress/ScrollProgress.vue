<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRequireAccessibleName } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { clampNumber } from '../shared/motion'
import { oneOf } from '../shared/pick'
import {
  SCROLL_PROGRESS_POSITIONS,
  SCROLL_PROGRESS_SIZES,
  SCROLL_PROGRESS_TONES,
  SCROLL_PROGRESS_VARIANTS,
  scrollProgressBarVariants,
  scrollProgressVariants,
  type ScrollProgressPosition,
  type ScrollProgressSize,
  type ScrollProgressTone,
  type ScrollProgressVariant,
} from './variants'

export interface ScrollProgressProps extends BaseProps {
  /** Pin to the top or bottom edge of the viewport. */
  position?: ScrollProgressPosition
  /** Look: `bar` (flush strip, default), `rounded` (rounded fill ends) or `inset` (rounded track floating away from the edge). Unknown values fall back to `bar`. */
  variant?: ScrollProgressVariant
  /** Thickness: `sm` (2px), `md` (4px) or `lg` (6px). Unknown values fall back to `md`. */
  size?: ScrollProgressSize
  /** Fill colour: `primary`, `neutral` (foreground), `success` or `info`. Unknown values fall back to `primary`. */
  tone?: ScrollProgressTone
  /** Accessible name of the progress bar. */
  label?: string
  /** Track the scroll position of this element (or the first element matching this CSS selector) instead of the page. A selector that matches nothing falls back to the page. */
  target?: string | HTMLElement | null
}

const props = withDefaults(defineProps<ScrollProgressProps>(), { position: 'top', variant: 'bar', size: 'md', tone: 'primary', label: 'Reading progress', target: undefined })

const progress = ref(0)
const root = ref<HTMLElement | null>(null)
useRequireAccessibleName('ScrollProgress', () => root.value, 'Keep the default `label`, or set `label`, `aria-label` or `aria-labelledby`; a progress bar without a name is announced as an unlabelled "progress bar".')

let source: HTMLElement | null = null

function resolveTarget(): HTMLElement | null {
  const t = props.target
  if (typeof t === 'string') return t ? document.querySelector<HTMLElement>(t) : null
  return t ?? null
}

function measure() {
  const el = source
  const doc = document.documentElement
  const range = el ? el.scrollHeight - el.clientHeight : doc.scrollHeight - doc.clientHeight
  const offset = el ? el.scrollTop : window.scrollY || doc.scrollTop
  // No scrollable range (short page, or jsdom): 0 rather than NaN/Infinity.
  progress.value = range > 0 ? clampNumber(offset / range, 0, 1, 0) : 0
}

function detach() {
  ;(source ?? window).removeEventListener('scroll', measure)
}
function attach() {
  detach()
  source = resolveTarget()
  ;(source ?? window).addEventListener('scroll', measure, { passive: true })
  measure()
}

onMounted(() => {
  attach()
  window.addEventListener('resize', measure, { passive: true })
})
watch(() => props.target, () => {
  if (root.value) attach()
})
onBeforeUnmount(() => {
  detach()
  window.removeEventListener('resize', measure)
})

const percent = computed(() => Math.round(progress.value * 100))
const position = computed(() => oneOf(props.position, SCROLL_PROGRESS_POSITIONS, 'top'))
const variant = computed(() => oneOf(props.variant, SCROLL_PROGRESS_VARIANTS, 'bar'))
const size = computed(() => oneOf(props.size, SCROLL_PROGRESS_SIZES, 'md'))
const tone = computed(() => oneOf(props.tone, SCROLL_PROGRESS_TONES, 'primary'))
const classes = computed(() => cn(scrollProgressVariants({ variant: variant.value, size: size.value, position: position.value }), props.class))
const barClass = computed(() => scrollProgressBarVariants({ tone: tone.value, variant: variant.value }))
</script>

<template>
  <div
    ref="root"
    data-slot="scroll-progress"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percent"
    :aria-valuetext="`${percent}%`"
    :aria-label="label"
    :data-position="position"
    :data-variant="variant"
    :data-size="size"
    :data-tone="tone"
    :class="classes"
  >
    <div
      data-slot="scroll-progress-bar"
      :class="barClass"
      :style="{ transform: `scaleX(${progress})` }"
    />
  </div>
</template>
