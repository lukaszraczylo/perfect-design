<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import {
  PROGRESS_RING_SHAPES,
  PROGRESS_RING_SIZES,
  PROGRESS_RING_VARIANTS,
  progressRingSizeScale,
  progressRingVariants,
  type ProgressRingShape,
  type ProgressRingSize,
  type ProgressRingTone,
  type ProgressRingVariant,
} from './variants'

export interface ProgressRingProps extends BaseProps {
  /** Current value. NaN and negatives become 0; values above `max` become `max`. */
  value?: number
  /** Upper bound. Non-finite or <= 0 falls back to 100. */
  max?: number
  /** Outer diameter: a number of px, or a preset (`xs` 40, `sm` 48, `md` 64, `lg` 96, `xl` 128). */
  size?: number | ProgressRingSize
  /** Ring thickness in px (capped at half of `size`). Defaults to 6, or to the thickness of the `size` preset. */
  strokeWidth?: number
  tone?: ProgressRingTone
  /** `default` draws the muted track; `bare` draws the arc alone. */
  variant?: ProgressRingVariant
  /** Line cap of the arc: `round` or `butt` (flat ends). */
  shape?: ProgressRingShape
  /** Accessible name of the meter. REQUIRED (or `aria-label` / `aria-labelledby`); the rendered fallback is "Progress". */
  label?: string
  /** Text for `aria-valuetext` (e.g. `42 of 100 GB`). Defaults to the rounded percent. */
  valueText?: string
}

const props = withDefaults(defineProps<ProgressRingProps>(), {
  value: 0,
  max: 100,
  size: 64,
  strokeWidth: undefined,
  tone: 'primary',
  variant: 'default',
  shape: 'round',
  label: undefined,
  valueText: undefined,
})

const attrs = useAttrs()
onMounted(async () => {
  await nextTick()
  requireOneOf(
    'ProgressRing',
    { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] },
    'Say what is progressing, e.g. label="Storage used".',
  )
})

defineSlots<{
  /** Centre content. Defaults to the rounded percentage. */
  label?: (props: { value: number; percent: number }) => unknown
}>()

const positive = (n: number, fallback: number) => (Number.isFinite(n) && n > 0 ? n : fallback)

const safeMax = computed(() => positive(props.max, 100))
const preset = computed(() => (typeof props.size === 'string' && PROGRESS_RING_SIZES.includes(props.size) ? progressRingSizeScale[props.size] : null))
// A numeric string ("96") counts as px; any other string that is not a preset falls back to 64.
const safeSize = computed(() => preset.value?.size ?? positive(Number(props.size), 64))
// An explicit strokeWidth wins; otherwise a size preset brings its own thickness and a numeric size keeps 6px.
const defaultStroke = computed(() => preset.value?.stroke ?? 6)
const safeStroke = computed(() => Math.min(positive(props.strokeWidth ?? defaultStroke.value, defaultStroke.value), safeSize.value / 2))
const variant = computed<ProgressRingVariant>(() => (PROGRESS_RING_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const shape = computed<ProgressRingShape>(() => (PROGRESS_RING_SHAPES.includes(props.shape) ? props.shape : 'round'))

const safeValue = computed(() => {
  const v = props.value
  if (Number.isNaN(v) || v < 0) return 0
  return v > safeMax.value ? safeMax.value : v
})
const fraction = computed(() => safeValue.value / safeMax.value)
const percent = computed(() => Math.round(fraction.value * 100))

const radius = computed(() => (safeSize.value - safeStroke.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - fraction.value))
const center = computed(() => safeSize.value / 2)

const textSize = computed(() => (safeSize.value >= 120 ? 'text-xl' : safeSize.value >= 80 ? 'text-base' : safeSize.value >= 48 ? 'text-xs' : 'text-2xs'))

const rootClasses = computed(() => cn('relative inline-flex shrink-0 items-center justify-center', props.class))
const arcClasses = computed(() =>
  cn(
    progressRingVariants({ tone: props.tone }),
    'transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none',
    fraction.value === 0 && 'opacity-0',
  ),
)
</script>

<template>
  <div
    data-slot="progress-ring"
    role="meter"
    :aria-label="label || (attrs['aria-labelledby'] || attrs['aria-label'] ? undefined : 'Progress')"
    :aria-valuenow="safeValue"
    aria-valuemin="0"
    :aria-valuemax="safeMax"
    :aria-valuetext="valueText || `${percent}%`"
    :class="rootClasses"
    :style="{ width: `${safeSize}px`, height: `${safeSize}px` }"
  >
    <svg
      data-slot="progress-ring-svg"
      aria-hidden="true"
      focusable="false"
      class="-rotate-90"
      :width="safeSize"
      :height="safeSize"
      :viewBox="`0 0 ${safeSize} ${safeSize}`"
    >
      <circle
        v-if="variant !== 'bare'"
        data-slot="progress-ring-track"
        class="fill-none stroke-muted"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="safeStroke"
      />
      <circle
        data-slot="progress-ring-value"
        :class="arcClasses"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="safeStroke"
        :stroke-linecap="shape"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>
    <span
      data-slot="progress-ring-label"
      :class="cn('absolute inset-0 flex items-center justify-center font-medium tabular-nums', textSize)"
    >
      <slot name="label" :value="safeValue" :percent="percent">{{ percent }}%</slot>
    </span>
  </div>
</template>
