<script setup lang="ts">
import { computed } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faArrowDown, faArrowUp, faMinus } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { trackSurface } from '../../../lib/styles'
import type { BaseProps, Tone } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import Card from '../Card/Card.vue'
import type { CardVariant } from '../Card/variants'
import Sparkline from '../Sparkline/Sparkline.vue'
import { useMountedCheck } from '../_shared/contract'
import { formatNumber, isFiniteNumber } from '../_chart/chartMath'
import { KPI_TILE_LAYOUTS, KPI_TILE_SIZES, kpiProgressFill, kpiSparklineTone, kpiTileVariants, type KpiTileLayout, type KpiTileSize, type KpiTileSurface } from './variants'

export type KpiTrend = 'up' | 'down' | 'flat'

export interface KpiTileProps extends BaseProps {
  label: string
  /** Headline value. Numbers are formatted (1,234.57); non-finite numbers and null show `–`. */
  value?: string | number | null
  /** Delta text, e.g. `+12%`. Numbers are formatted with a sign. */
  delta?: string | number
  /** Direction of the change; drives the arrow icon. */
  trend?: KpiTrend
  /** Which trend direction is GOOD: `up` (revenue), `down` (latency, cost) or `none` (neutral colouring). */
  goodWhen?: 'up' | 'down' | 'none'
  /** Supporting text under the value, e.g. "vs last 7 days". */
  hint?: string
  icon?: IconDefinition
  /** Show a skeleton instead of the value. */
  loading?: boolean
  /**
   * Card surface (`default`, `outline`, `elevated`, `interactive`, ...) or `inverted` (high-contrast foreground surface).
   */
  variant?: CardVariant | KpiTileSurface
  /** `compact` tightens padding and the value size for dense dashboards; `lg` gives the tile more room and a larger value. Unknown values behave like `default`. */
  size?: KpiTileSize
  /** `stacked` (default) column; `split` label at the start and value at the end of one row, the rest below; `centered` centres every row. Unknown values behave like `stacked`. */
  layout?: KpiTileLayout
  /** Colour of the progress bar and the sparkline. */
  tone?: Tone
  /** Values for a mini trend line under the delta (or use the `sparkline` slot). */
  sparkline?: number[]
  /** `area` (default) fills under the trend line; `line` draws the line only. Unknown values behave like `area`. */
  sparklineVariant?: 'area' | 'line'
  /** Percentage (0-100, clamped) shown as a progress bar; non-finite values hide it. */
  progress?: number | null
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<KpiTileProps>(), { trend: 'flat', goodWhen: 'up', variant: 'default', size: 'default', layout: 'stacked', tone: 'primary', progress: null, sparklineVariant: 'area' })

useMountedCheck(() => requireText('KpiTile', 'label', props.label, 'It names the metric, e.g. `label="Requests"`.'))

const display = computed(() => {
  const v = props.value
  if (v === null || v === undefined) return '–'
  if (typeof v === 'number') return formatNumber(v)
  return v
})
const deltaText = computed(() => {
  const d = props.delta
  if (d === undefined || d === null || d === '') return ''
  if (typeof d === 'number') return isFiniteNumber(d) ? `${d > 0 ? '+' : ''}${formatNumber(d)}` : '–'
  return d
})
const trendIcon = computed(() => ({ up: faArrowUp, down: faArrowDown, flat: faMinus })[props.trend] ?? faMinus)
const sentiment = computed<'good' | 'bad' | 'neutral'>(() => {
  if (props.trend === 'flat' || props.goodWhen === 'none') return 'neutral'
  if (props.trend !== 'up' && props.trend !== 'down') return 'neutral'
  return props.trend === props.goodWhen ? 'good' : 'bad'
})
const inverted = computed(() => props.variant === 'inverted')
const size = computed<KpiTileSize>(() => (KPI_TILE_SIZES.includes(props.size) ? props.size : 'default'))
const layout = computed<KpiTileLayout>(() => (KPI_TILE_LAYOUTS.includes(props.layout) ? props.layout : 'stacked'))
const compact = computed(() => size.value === 'compact')
const split = computed(() => layout.value === 'split')
const centered = computed(() => layout.value === 'centered')
const fullRow = computed(() => (split.value ? 'col-span-full' : undefined))
const surface = computed<'default' | KpiTileSurface>(() => (props.variant === 'inverted' ? 'inverted' : 'default'))
// The former `accent` (edge stripe) surface is gone: a stale value renders the plain default card.
const cardVariant = computed(() => (props.variant === 'inverted' || (props.variant as string) === 'accent' ? 'default' : props.variant))
const mutedText = computed(() => (inverted.value ? 'text-background/70' : 'text-muted-foreground'))
// On the inverted surface the status colours fail contrast, so the delta uses the surface text colour (arrow and sr-only word carry the meaning).
const deltaClass = computed(() => (inverted.value ? 'text-background' : { good: 'text-success', bad: 'text-destructive', neutral: mutedText.value }[sentiment.value]))
const progressValue = computed(() => (typeof props.progress === 'number' && Number.isFinite(props.progress) ? Math.min(100, Math.max(0, props.progress)) : null))
const progressFill = computed(() => (inverted.value ? 'bg-background' : (kpiProgressFill[props.tone] ?? kpiProgressFill.primary)))
const sparkVariant = computed(() => (props.sparklineVariant === 'line' ? 'line' : 'area'))
const sparkTone = computed(() => kpiSparklineTone[props.tone] ?? 'primary')
// The tone colours are tuned for the card surface; on the foreground surface the trend uses the surface text colour.
const sparkInvertedClass = '[&_[data-slot=sparkline-line]]:stroke-background [&_[data-slot=sparkline-area]]:fill-background/20 [&_[data-slot=sparkline-dot]]:fill-background [&_[data-slot=sparkline-last]]:fill-background'
const hasSparkline = computed(() => (Array.isArray(props.sparkline) && props.sparkline.length > 0))
const trendWord = computed(() => ({ up: 'Increase', down: 'Decrease', flat: 'No change' })[props.trend] ?? '')
const classes = computed(() => cn(kpiTileVariants({ size: size.value, layout: layout.value, variant: surface.value, tone: props.tone }), props.class))
</script>

<template>
  <Card
    data-slot="kpi-tile"
    :variant="cardVariant"
    :as="as"
    :as-child="asChild"
    :class="classes"
    :aria-busy="loading ? 'true' : undefined"
    :data-loading="loading ? '' : undefined"
    :data-tile-variant="surface === 'default' ? undefined : surface"
    :data-size="size === 'default' ? undefined : size"
    :data-layout="layout === 'stacked' ? undefined : layout"
  >
    <div :class="cn('flex items-center gap-2', centered ? 'justify-center' : 'justify-between', compact ? 'text-xs' : 'text-sm', mutedText)">
      <span data-slot="kpi-tile-label" class="font-medium">{{ label }}</span>
      <span v-if="$slots.icon || icon" data-slot="kpi-tile-icon" class="shrink-0">
        <slot name="icon"><Icon v-if="icon" :icon="icon" /></slot>
      </span>
    </div>

    <template v-if="loading">
      <span class="sr-only" role="status">Loading</span>
      <div data-slot="kpi-tile-skeleton" aria-hidden="true" :class="cn('flex flex-col gap-2', fullRow, centered && 'items-center')">
        <div class="h-8 w-24 rounded bg-muted motion-safe:animate-pulse" />
        <div class="h-3 w-32 rounded bg-muted motion-safe:animate-pulse" />
      </div>
    </template>
    <template v-else>
      <div data-slot="kpi-tile-value" :class="cn(compact ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl', split && 'text-end', 'font-semibold tracking-tight tabular-nums', inverted ? 'text-background' : 'text-foreground')">
        <slot name="value">{{ display }}</slot>
      </div>
      <div v-if="deltaText || $slots.delta || hint || $slots.hint" :class="cn('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs', fullRow, centered && 'justify-center')">
        <span v-if="deltaText || $slots.delta" data-slot="kpi-tile-delta" :data-trend="trend" :data-sentiment="sentiment" :class="cn('inline-flex items-center gap-1 font-medium tabular-nums', deltaClass)">
          <Icon :icon="trendIcon" size="xs" />
          <span class="sr-only">{{ trendWord }}:</span>
          <slot name="delta">{{ deltaText }}</slot>
        </span>
        <span v-if="hint || $slots.hint" data-slot="kpi-tile-hint" :class="mutedText"><slot name="hint">{{ hint }}</slot></span>
      </div>
      <div v-if="hasSparkline || $slots.sparkline" data-slot="kpi-tile-sparkline" :class="cn(fullRow, centered && 'w-full')">
        <slot name="sparkline">
          <Sparkline :data="sparkline!" :tone="sparkTone" :width="240" :height="40" :variant="sparkVariant" :label="`${label} trend`" :class="cn('h-10 w-full', inverted && sparkInvertedClass)" />
        </slot>
      </div>
      <div
        v-if="progressValue !== null"
        data-slot="kpi-tile-progress"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="progressValue"
        :aria-label="`${label} progress`"
        :class="cn('h-1.5 w-full overflow-hidden rounded-full', fullRow, inverted ? 'bg-background/20' : trackSurface)"
      >
        <div data-slot="kpi-tile-progress-bar" :class="cn('h-full rounded-full transition-[width] motion-reduce:transition-none', progressFill)" :style="{ width: `${progressValue}%` }" />
      </div>
    </template>
  </Card>
</template>
