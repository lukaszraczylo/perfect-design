<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs } from 'vue'
import { ProgressIndicator, ProgressRoot, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireOneOf } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import {
  progressIndicatorVariants,
  progressInsideValueVariants,
  progressSegmentVariants,
  progressVariants,
  type ProgressSize,
  type ProgressTone,
  type ProgressValuePosition,
} from './variants'

export interface ProgressProps extends BaseProps {
  /** Current value. `null` / `undefined` renders the indeterminate animation. Clamped to 0..max. */
  modelValue?: number | null
  /** Upper bound. Non-finite or <= 0 falls back to 100. */
  max?: number
  tone?: ProgressTone
  /** Track height: xs 2px, sm 4px, md 8px, lg 12px, xl 20px. Unknown values fall back to md. */
  size?: ProgressSize
  /** Accessible name (aria-label), default "Progress"; pass `aria-labelledby` to point at visible text instead. Also shown as text with `valuePosition="top"`. */
  label?: string
  /** Show the percentage as text (determinate only). Placement is set by `valuePosition`. */
  showValue?: boolean
  /** `end` beside the bar (default), `inside` inside the filled bar (use size lg/xl), `top` in a header row above the bar. */
  valuePosition?: ProgressValuePosition
  /** Deprecated, no visual effect: stripes need a gradient, which the design system does not use. */
  striped?: boolean
  /** Pulses the filled bar. Disabled under prefers-reduced-motion; ignored while indeterminate. */
  animated?: boolean
  /** Split the bar into N segments (2..50); each fills proportionally. Fewer than 2 renders a normal bar. */
  segments?: number
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<ProgressProps>(), {
  modelValue: undefined,
  max: 100,
  tone: 'primary',
  size: 'md',
  valuePosition: 'end',
  striped: false,
  animated: false,
  segments: 0,
})

const DEFAULT_MAX = 100
const SIZES: readonly ProgressSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const TONES: readonly ProgressTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
const MAX_SEGMENTS = 50

const safeMax = computed(() => (Number.isFinite(props.max) && props.max > 0 ? props.max : DEFAULT_MAX))

const safeValue = computed<number | null>(() => {
  const v = props.modelValue
  if (v === null || v === undefined) return null
  if (Number.isNaN(v) || v < 0) return 0
  return v > safeMax.value ? safeMax.value : v
})

const indeterminate = computed(() => safeValue.value === null)
const percent = computed(() => (safeValue.value === null ? 0 : (safeValue.value / safeMax.value) * 100))

const size = computed<ProgressSize>(() => (SIZES.includes(props.size) ? props.size : 'md'))
const tone = computed<ProgressTone>(() => (TONES.includes(props.tone) ? props.tone : 'primary'))

const segmentCount = computed(() => {
  const n = Math.floor(Number(props.segments))
  return Number.isFinite(n) && n >= 2 ? Math.min(n, MAX_SEGMENTS) : 0
})
const segmented = computed(() => segmentCount.value > 0)
/** Fill (0..100) of each segment: segments before the value are full, the current one is partial. */
const segmentFills = computed(() => {
  const n = segmentCount.value
  const step = 100 / n
  return Array.from({ length: n }, (_, i) => (indeterminate.value ? 100 : Math.min(100, Math.max(0, ((percent.value - i * step) / step) * 100))))
})

// `inside` needs a single filled bar; segmented bars fall back to the default placement.
const position = computed<ProgressValuePosition>(() => {
  const p = props.valuePosition === 'inside' || props.valuePosition === 'top' ? props.valuePosition : 'end'
  return p === 'inside' && segmented.value ? 'end' : p
})
const valueText = computed(() => `${Math.round(percent.value)}%`)
const showEnd = computed(() => props.showValue && !indeterminate.value && position.value === 'end')
const showInside = computed(() => props.showValue && !indeterminate.value && position.value === 'inside')
const showTopValue = computed(() => props.showValue && !indeterminate.value)
const showHeader = computed(() => position.value === 'top' && (!!props.label || showTopValue.value))

const rootClasses = computed(() =>
  cn('flex w-full items-center gap-3', position.value === 'top' && 'flex-col items-stretch gap-1.5', props.class),
)
const trackClasses = computed(() =>
  cn(progressVariants({ size: size.value }), segmented.value && 'flex gap-1 overflow-visible rounded-none bg-transparent'),
)
const segmentClasses = progressSegmentVariants()
const striped = computed(() => props.striped || props.animated)
const indicatorClasses = computed(() =>
  cn(
    progressIndicatorVariants({ tone: tone.value, striped: striped.value, animated: props.animated && !indeterminate.value }),
    showInside.value && progressInsideValueVariants({ tone: tone.value }),
    indeterminate.value
      ? 'w-2/5 animate-ds-indeterminate motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-50'
      : 'transition-[width] duration-300 motion-reduce:transition-none',
  ),
)
const segmentFillClasses = computed(() =>
  cn(
    progressIndicatorVariants({ tone: tone.value, striped: striped.value, animated: props.animated && !indeterminate.value }),
    indeterminate.value && 'animate-pulse opacity-40 motion-reduce:animate-none',
    !indeterminate.value && 'transition-[width] duration-300 motion-reduce:transition-none',
  ),
)
const attrs = useAttrs()
// The rendered fallback name "Progress" keeps the bar valid, but it does not say what is progressing: the caller must name it.
onMounted(async () => {
  await nextTick()
  requireOneOf(
    'Progress',
    { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] },
    'Say what is progressing, e.g. label="Uploading report.pdf".',
  )
})
// A progressbar always needs a name; an explicit aria-labelledby/aria-label from the consumer wins over the default.
const labelAttrs = computed(() =>
  props.label ? { 'aria-label': props.label } : attrs['aria-labelledby'] || attrs['aria-label'] ? {} : { 'aria-label': 'Progress' },
)
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    :as="as"
    :model-value="safeValue"
    :max="safeMax"
    :class="rootClasses"
    v-bind="labelAttrs"
  >
    <div v-if="showHeader" data-slot="progress-header" class="flex items-baseline justify-between gap-2 text-xs">
      <span v-if="label" data-slot="progress-label" class="font-medium text-foreground">{{ label }}</span>
      <span
        v-if="showTopValue"
        data-slot="progress-value"
        class="ms-auto shrink-0 font-medium tabular-nums text-muted-foreground"
      >{{ valueText }}</span>
    </div>
    <div data-slot="progress-track" :data-segments="segmented ? segmentCount : undefined" :class="trackClasses">
      <template v-if="segmented">
        <div v-for="(fill, i) in segmentFills" :key="i" data-slot="progress-segment" :class="segmentClasses">
          <div
            data-slot="progress-segment-fill"
            :class="segmentFillClasses"
            :style="{ width: `${fill}%`, ...(indeterminate ? { animationDelay: `${i * 120}ms` } : {}) }"
          />
        </div>
      </template>
      <ProgressIndicator
        v-else
        data-slot="progress-indicator"
        :class="indicatorClasses"
        :style="indeterminate ? undefined : { width: `${percent}%` }"
      >
        <span v-if="showInside" data-slot="progress-value">{{ valueText }}</span>
      </ProgressIndicator>
    </div>
    <span
      v-if="showEnd"
      data-slot="progress-value"
      class="min-w-8 shrink-0 text-end text-xs font-medium tabular-nums text-muted-foreground"
    >{{ valueText }}</span>
  </ProgressRoot>
</template>
