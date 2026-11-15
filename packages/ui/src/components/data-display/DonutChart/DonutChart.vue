<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { clamp, formatCompact, formatNumber, isFiniteNumber } from '../_chart/chartMath'
import { oneOf, plural } from '../_chart/chartKit'
import { useChartContract } from '../_chart/chartContract'
import { seriesTone, toneClasses, type ChartTone } from '../_chart/tones'
import { donutChartVariants, donutFigureVariants, donutLegendVariants, type DonutLayout, type DonutSize, type DonutVariant } from './variants'

export interface DonutDatum {
  label: string
  value: number
  tone?: ChartTone
}

export interface DonutChartProps extends BaseProps {
  data: DonutDatum[]
  size?: DonutSize
  /** `full` is a ring, `half` a semicircle (opening downwards) with the centre text in its hollow. */
  variant?: DonutVariant
  /** Where the legend sits: `auto` beside the ring and wrapping below it when narrow, `inline` always beside it, `stacked` always below it. */
  layout?: DonutLayout
  /** Ring thickness in viewBox units (the ring is drawn in a 100×100 box). Clamped to 2–40. */
  thickness?: number
  showLegend?: boolean
  /** Small caption under the total in the centre. */
  centerText?: string
  /** Formats values in the centre, legend and tooltips. */
  valueFormatter?: (n: number) => string
  /** Accessible label; defaults to an auto-generated summary. */
  label?: string
  /** Shown when `data` is empty. */
  emptyText?: string
}

const props = withDefaults(defineProps<DonutChartProps>(), {
  size: 'md',
  variant: 'full',
  layout: 'auto',
  thickness: 14,
  showLegend: true,
  emptyText: 'No data',
})

defineSlots<{
  /** Replaces the centre content. */
  center?: (props: { total: number }) => unknown
}>()

defineOptions({ inheritAttrs: false })
const { explicitName, labelledby, rootAttrs } = useChartContract(
  'DonutChart',
  props,
  () => {
    if (!Array.isArray(props.data)) {
      violation('DonutChart', 'requires-data', 'requires `data`, an array of `{ label, value }` segments. An empty array shows the empty state.')
      return
    }
    props.data.forEach((d, i) => {
      const ok = typeof d === 'object' && d !== null && typeof d.label === 'string' && d.label.trim() !== '' && typeof d.value === 'number' && Number.isFinite(d.value)
      if (!ok) violation('DonutChart', 'data-shape', `segment ${i + 1} needs a non-empty string \`label\` and a finite number \`value\`: \`{ label: "Mobile", value: 40 }\`.`)
    })
  },
  [() => props.data],
)

const half = computed(() => props.variant === 'half')
const figureClass = computed(() => donutFigureVariants({ variant: half.value ? 'half' : 'full', size: oneOf<DonutSize>(props.size, ['sm', 'md', 'lg'], 'md') }))
const rootClass = computed(() => donutChartVariants({ layout: oneOf<DonutLayout>(props.layout, ['auto', 'inline', 'stacked'], 'auto') }))
const centerClass = computed(() =>
  half.value
    ? 'pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center'
    : 'pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center',
)
const legendClass = computed(() => donutLegendVariants({ layout: oneOf<DonutLayout>(props.layout, ['auto', 'inline', 'stacked'], 'auto') }))
/** The semicircle from the left end to the right end over the top; `pathLength` makes dash lengths percentages of it. */
const halfArc = computed(() => `M ${50 - R.value} 50 A ${R.value} ${R.value} 0 0 1 ${50 + R.value} 50`)

const items = computed(() => (Array.isArray(props.data) ? props.data : []).filter((d) => typeof d === 'object' && d !== null))
const fmt = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const fmtCenter = (n: number) => (props.valueFormatter ?? formatCompact)(n)

const R = computed(() => 50 - clamp(isFiniteNumber(props.thickness) ? props.thickness : 14, 2, 40) / 2)
const stroke = computed(() => clamp(isFiniteNumber(props.thickness) ? props.thickness : 14, 2, 40))
const circumference = computed(() => 2 * Math.PI * R.value)

const positive = (v: unknown): number => (isFiniteNumber(v) && v > 0 ? v : 0)

/** Sum of the positive finite values; capped at MAX_VALUE instead of overflowing to Infinity. */
const total = computed(() => {
  const t = items.value.reduce((acc, d) => acc + positive(d.value), 0)
  return isFiniteNumber(t) ? t : Number.MAX_VALUE
})

/** Shares are computed from values normalised by the largest one so 1e308-sized inputs cannot overflow. */
const shares = computed(() => {
  const vals = items.value.map((d) => positive(d.value))
  const max = Math.max(0, ...vals)
  if (max === 0) return vals.map(() => 0)
  const weights = vals.map((v) => v / max)
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / sum)
})

const segments = computed(() => {
  const C = circumference.value
  let acc = 0
  return items.value.map((d, i) => {
    const value = positive(d.value)
    const share = shares.value[i]!
    const percent = Math.round(share * 1000) / 10
    const seg = {
      label: String(d.label ?? ''),
      value,
      tone: toneClasses[seriesTone(i, d.tone)],
      len: Math.round(share * C * 1000) / 1000,
      offset: Math.round(acc * 1000) / 1000,
      arcLen: Math.round(share * 100000) / 1000,
      arcOffset: Math.round((acc / C) * 100000) / 1000,
      percent,
      title: `${d.label ?? ''}: ${fmt(value)} (${percent}%)`,
    }
    acc += share * C
    return seg
  })
})

const drawn = computed(() => segments.value.filter((s) => s.len > 0))
const centerCaption = computed(() => props.centerText ?? (total.value > 0 ? '' : props.emptyText))
const summary = computed(() => `Donut chart: ${plural(items.value.length, 'segment')}, total ${fmt(total.value)}`)
</script>

<template>
  <div
    v-if="items.length === 0"
    v-bind="rootAttrs"
    data-slot="donut-chart"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="donut-chart-empty">{{ emptyText }}</span>
  </div>
  <div v-else v-bind="rootAttrs" data-slot="donut-chart" :class="cn(rootClass, $props.class)">
    <div data-slot="donut-chart-figure" :class="figureClass">
      <svg data-slot="donut-chart-svg" role="img" :aria-label="explicitName || summary" :aria-labelledby="labelledby" :viewBox="half ? '0 0 100 50' : '0 0 100 100'" class="size-full">
        <template v-if="half">
          <path data-slot="donut-chart-track" :d="halfArc" pathLength="100" fill="none" :stroke-width="stroke" class="stroke-muted" />
          <path
            v-for="(s, i) in drawn"
            :key="i"
            data-slot="donut-chart-segment"
            :d="halfArc" pathLength="100" fill="none"
            :stroke-width="stroke"
            :stroke-dasharray="`${s.arcLen} ${Math.max(0, 100 - s.arcLen)}`"
            :stroke-dashoffset="-s.arcOffset"
            :class="s.tone.stroke"
          ><title>{{ s.title }}</title></path>
        </template>
        <circle
          v-else
          data-slot="donut-chart-track"
          cx="50" cy="50" :r="R" fill="none"
          :stroke-width="stroke"
          class="stroke-muted"
        />
        <g v-if="!half" transform="rotate(-90 50 50)">
          <circle
            v-for="(s, i) in drawn"
            :key="i"
            data-slot="donut-chart-segment"
            cx="50" cy="50" :r="R" fill="none"
            :stroke-width="stroke"
            :stroke-dasharray="`${s.len} ${Math.max(0, circumference - s.len)}`"
            :stroke-dashoffset="-s.offset"
            :class="s.tone.stroke"
          ><title>{{ s.title }}</title></circle>
        </g>
      </svg>
      <div data-slot="donut-chart-center" :class="centerClass">
        <slot name="center" :total="total">
          <span data-slot="donut-chart-total" class="text-lg font-semibold leading-tight tabular-nums">{{ fmtCenter(total) }}</span>
          <span v-if="centerCaption" data-slot="donut-chart-caption" class="text-xs text-muted-foreground">{{ centerCaption }}</span>
        </slot>
      </div>
    </div>
    <ul v-if="showLegend" data-slot="donut-chart-legend" :class="legendClass">
      <li v-for="(s, i) in segments" :key="i" data-slot="donut-chart-legend-item" class="flex items-center gap-2">
        <span :class="['size-2.5 shrink-0 rounded-full', s.tone.bg]" aria-hidden="true" />
        <span data-slot="donut-chart-legend-label" class="min-w-0 flex-1 truncate">{{ s.label }}</span>
        <span data-slot="donut-chart-legend-value" class="tabular-nums">{{ fmt(s.value) }}</span>
        <span data-slot="donut-chart-legend-percent" class="w-12 text-end tabular-nums text-muted-foreground">{{ s.percent }}%</span>
      </li>
    </ul>
  </div>
</template>
