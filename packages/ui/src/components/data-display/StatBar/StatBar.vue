<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { trackSurface } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { clamp, isFiniteNumber } from '../_chart/chartMath'
import { useMountedCheck } from '../_shared/contract'

export type StatBarTone = 'auto' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export interface StatBarProps extends BaseProps {
  /** Accessible name and visible caption, e.g. "Requests / day". */
  label: string
  value: number
  /** Value that fills the bar completely. Must be > 0. */
  max?: number
  /** Text shown on the right (and used as aria-valuetext). Defaults to the percentage. */
  valueText?: string
  /** `auto` switches to warning/danger above `warnAt` / `dangerAt` (ratios 0..1). */
  tone?: StatBarTone
  warnAt?: number
  dangerAt?: number
  /** Bar thickness: `sm` 6px, `md` 10px (default), `lg` 16px. Unknown values fall back to `md`. */
  size?: 'sm' | 'md' | 'lg'
  /** `stacked` (default): caption row above the bar. `inline`: label, bar and value on one row. Unknown values fall back to `stacked`. */
  layout?: 'stacked' | 'inline'
  /** Track and fill ends: `rounded` (default, pill) or `square`. Unknown values fall back to `rounded`. */
  shape?: 'rounded' | 'square'
  /** Hide the caption row (the bar keeps its accessible name). */
  hideLabel?: boolean
}

const props = withDefaults(defineProps<StatBarProps>(), {
  max: 100,
  tone: 'primary',
  warnAt: 0.75,
  dangerAt: 0.9,
  size: 'md',
  layout: 'stacked',
  shape: 'rounded',
})

useMountedCheck(
  () => {
    requireText('StatBar', 'label', props.label, 'It is the caption and the accessible name of the meter, e.g. `label="Storage"`.')
    if (!isFiniteNumber(props.value)) violation('StatBar', 'requires-value', `requires a finite number \`value\` (got ${String(props.value)}). Show a skeleton or hide the bar while the number is loading.`)
    if (!isFiniteNumber(props.max) || props.max <= 0) violation('StatBar', 'requires-max', `needs \`max\` to be a finite number above 0 (got ${String(props.max)}), otherwise the bar is always empty.`)
  },
  [() => props.value, () => props.max],
)

const ratio = computed(() => {
  if (!isFiniteNumber(props.value) || !isFiniteNumber(props.max) || props.max <= 0) return 0
  return clamp(props.value / props.max, 0, 1)
})
const percent = computed(() => Math.round(ratio.value * 100))
const text = computed(() => props.valueText ?? `${percent.value}%`)

const FILL = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
} as const
const fillClass = computed(() => {
  if (props.tone !== 'auto') return FILL[props.tone] ?? FILL.primary
  if (ratio.value >= props.dangerAt) return FILL.danger
  if (ratio.value >= props.warnAt) return FILL.warning
  return FILL.primary
})
const SIZE = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' } as const
const size = computed<keyof typeof SIZE>(() => (Object.keys(SIZE).includes(props.size) ? props.size : 'md'))
const inline = computed(() => props.layout === 'inline' && !props.hideLabel)
const square = computed(() => props.shape === 'square')
const classes = computed(() => cn(inline.value ? 'flex flex-row items-center gap-3' : 'flex flex-col gap-1.5', props.class))
</script>

<template>
  <div data-slot="stat-bar" :data-layout="inline ? 'inline' : undefined" :data-shape="square ? 'square' : undefined" :class="classes">
    <div v-if="!hideLabel" :class="inline ? 'contents text-sm' : 'flex items-baseline justify-between gap-2 text-sm'">
      <span data-slot="stat-bar-label" :class="inline ? 'shrink-0 text-sm text-muted-foreground' : 'text-muted-foreground'">{{ label }}</span>
      <span data-slot="stat-bar-value" :class="inline ? 'order-2 shrink-0 text-sm font-medium tabular-nums text-foreground' : 'font-medium tabular-nums text-foreground'">{{ text }}</span>
    </div>
    <div
      data-slot="stat-bar-track"
      role="meter"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent"
      :aria-valuetext="text"
      :class="cn('w-full overflow-hidden', square ? 'rounded-none' : 'rounded-full', trackSurface, SIZE[size], inline && 'order-1 min-w-0 flex-1')"
    >
      <div data-slot="stat-bar-fill" :class="cn('h-full', square ? 'rounded-none' : 'rounded-full', 'motion-safe:transition-[width]', fillClass)" :style="{ width: `${ratio * 100}%` }" />
    </div>
  </div>
</template>
