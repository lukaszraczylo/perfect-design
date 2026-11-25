<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { allIntegers, bandPath, isFiniteNumber, curveAreaPath, curvePath, extent, formatCompact, formatNumber, isolatedPoints, niceTicks, normalizeCurve, r2, runs, stackSeries, type Curve, type Point } from '../_chart/chartMath'
import {
  chartHeight, dimension, dropOverlappingLabels, edgeAnchor, estimateTextWidth, hasValues, labelStep, markerPath, normalizeSeries, plural, scaleSafe, seriesMarker, truncateLabel,
  MARKER_SHAPES, type ChartSeries, type ChartSize, type MarkerShape,
} from '../_chart/chartKit'
import { toneClasses, type ToneClasses } from '../_chart/tones'
import { checkCategorySeries, useChartContract } from '../_chart/chartContract'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartLegend from '../_chart/ChartLegend.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'

export type LineChartSeries = ChartSeries & {
  /** In a stacked chart, `false` draws this series as a plain line at its own values (a comparison, a total). */
  stack?: boolean
}

export interface LineChartProps extends BaseProps {
  /** X-axis category labels (one per point). */
  labels: string[]
  series: LineChartSeries[]
  /** `line` draws lines only, `area` adds a soft fill under each line. Without it, `area` decides. */
  variant?: 'line' | 'area'
  /** Soft fill under each line. Same as `variant="area"`. */
  area?: boolean
  /** With `variant="area"`, stacks the series: each band sits on the one before and the y axis fits the top band. Tooltips and the data table keep each series' own value. */
  stacked?: boolean
  /** How points are joined: straight segments, a monotone smooth curve (never overshoots the data) or steps that hold each value until the next point. */
  curve?: Curve
  /** Chart height when `height` is not set: 160 / 240 / 320. */
  size?: ChartSize
  /** `'auto'` shows dots when there are at most 60 points. */
  showDots?: boolean | 'auto'
  /** Marker shape. `series` gives each series its own shape (circle, square, diamond, triangle), a cue besides colour and dashes. */
  markerShape?: MarkerShape | 'series'
  /** Gridline style. Without it, `showGrid` decides (`horizontal` when on). `full` adds a vertical line per labelled x position. */
  grid?: 'none' | 'horizontal' | 'dashed' | 'full'
  showGrid?: boolean
  showAxis?: boolean
  /** Lower bound of the y axis. Without it the axis starts at the lowest tick below the data. Values below it are drawn on the bottom edge. */
  yMin?: number
  /** Upper bound of the y axis. Without it the axis ends at the highest tick above the data. Values above it are drawn on the top edge. */
  yMax?: number
  /** Axis ticks on whole numbers only. `'auto'` does this when every value is an integer (counts); `false` always allows fractional ticks. */
  integerTicks?: boolean | 'auto'
  /** `'auto'` shows the legend when there is more than one series. */
  showLegend?: boolean | 'auto'
  /** Formats axis ticks and tooltips. Defaults to compact (axis) / grouped (tooltip) numbers. */
  valueFormatter?: (n: number) => string
  /** Accessible label; defaults to an auto-generated summary. */
  label?: string
  /** Shown when there is nothing to plot. */
  emptyText?: string
  /** ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px). */
  width?: number
  /** ViewBox height. Overrides `size`. */
  height?: number
}

const props = withDefaults(defineProps<LineChartProps>(), {
  area: false,
  stacked: false,
  curve: 'linear',
  size: 'md',
  showDots: 'auto',
  markerShape: 'circle',
  showGrid: true,
  showAxis: true,
  integerTicks: 'auto',
  showLegend: 'auto',
  emptyText: 'No data',
  width: 480,
})

const AUTO_DOT_LIMIT = 60
defineOptions({ inheritAttrs: false })
const { explicitName, labelledby, rootAttrs } = useChartContract('LineChart', props, () => checkCategorySeries('LineChart', props.labels, props.series), [() => props.labels, () => props.series])

const FONT = 12 // px of axis text (text-xs); label width estimates use the same size
/** Dash pattern per series index, so lines differ by more than colour (WCAG 1.4.1). */
const DASHES = ['', '6 4', '2 4', '8 3 2 3', '1 5'] as const
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const H = computed(() => chartHeight(props.size, props.height))
const areaOn = computed(() => (props.variant === 'area' ? true : props.variant === 'line' ? false : props.area))
const stackedOn = computed(() => props.stacked && areaOn.value)
const curve = computed(() => normalizeCurve(props.curve))
const gridMode = computed<'none' | 'horizontal' | 'dashed' | 'full'>(() => {
  const g = props.grid
  if (g === 'none' || g === 'horizontal' || g === 'dashed' || g === 'full') return g
  return props.showGrid ? 'horizontal' : 'none'
})
const perSeriesMarkers = computed(() => props.markerShape === 'series')
const markerFor = (si: number): MarkerShape =>
  perSeriesMarkers.value ? seriesMarker(si) : (MARKER_SHAPES as readonly string[]).includes(props.markerShape) ? (props.markerShape as MarkerShape) : 'circle'
const norm = computed(() => normalizeSeries(props.labels, props.series))
const empty = computed(() => norm.value.count === 0 || !hasValues(norm.value))
const fmtTip = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const fmtAxis = (n: number) => (props.valueFormatter ?? formatCompact)(n)
const dotsOn = computed(() => (props.showDots === 'auto' ? norm.value.count <= AUTO_DOT_LIMIT : !!props.showDots))

/** Series that join the stack, aligned with `norm.series` (normalizeSeries keeps every object entry in order). */
const stackFlags = computed(() => (Array.isArray(props.series) ? props.series : []).filter((s) => typeof s === 'object' && s !== null).map((s) => s.stack !== false))
const bands = computed(() => {
  if (!stackedOn.value) return []
  const flags = stackFlags.value
  const stacked = stackSeries(norm.value.series.filter((_, i) => flags[i]))
  let k = 0
  return norm.value.series.map((_, i) => (flags[i] ? stacked[k++]! : null))
})

const ticks = computed(() => {
  const values = stackedOn.value
    ? bands.value.flatMap((b, i) => (b ? [...b.lower, ...b.upper] : norm.value.series[i]!.data))
    : norm.value.series.flatMap((s) => s.data)
  const ext = extent(values)
  if (!ext) return [0, 1]
  const lo = isFiniteNumber(props.yMin) ? props.yMin : ext[0]
  const hi = isFiniteNumber(props.yMax) ? props.yMax : ext[1]
  const whole = props.integerTicks === 'auto' ? allIntegers([...values, props.yMin, props.yMax]) : !!props.integerTicks
  return niceTicks(lo, hi, 5, whole)
})

const layout = computed(() => {
  const w = W.value
  const h = H.value
  const axis = props.showAxis
  const left = axis ? Math.min(Math.max(...ticks.value.map((t) => estimateTextWidth(fmtAxis(t), FONT))) + 8, w * 0.4) : 6
  const x0 = left
  const x1 = Math.max(x0 + 1, w - (axis ? 12 : 6))
  const y0 = axis ? 10 : 6
  const y1 = Math.max(y0 + 1, h - (axis ? 22 : 6))
  return { x0, x1, y0, y1, inset: axis ? Math.min(10, (x1 - x0) / 4) : 0 }
})

const sx = computed(() => {
  const { x0, x1, inset } = layout.value
  const n = norm.value.count
  return (i: number) => (n === 1 ? (x0 + x1) / 2 : x0 + inset + (i * (x1 - x0 - 2 * inset)) / (n - 1))
})
const sy = computed(() => {
  const t = ticks.value
  const { y0, y1 } = layout.value
  const scale = scaleSafe(t[0]!, t[t.length - 1]!, y1, y0)
  const lo = t[0]!
  const hi = t[t.length - 1]!
  return (v: number) => scale(Math.min(hi, Math.max(lo, v)))
})

interface Line {
  name: string
  dash: string
  tone: ToneClasses
  d: string
  area: string
  marker: MarkerShape
  dots: { x: number; y: number; d: string; title: string }[]
}

const lines = computed<Line[]>(() => {
  const { categories } = norm.value
  const { y1 } = layout.value
  const baseY = Math.min(y1, Math.max(layout.value.y0, sy.value(0)))
  return norm.value.series.map((s, si) => {
    const band = bands.value[si]
    const top: (Point | null)[] | null = band ? band.upper.map((v, i) => ({ x: sx.value(i), y: sy.value(v) })) : null
    const pts: (Point | null)[] = top ?? s.data.map((v, i) => (v === null ? null : { x: sx.value(i), y: sy.value(v) }))
    const hasSegment = runs(pts).some((r) => r.length > 1)
    const iso = new Set(isolatedPoints(pts))
    const marker = markerFor(si)
    const dots: Line['dots'] = []
    pts.forEach((p, i) => {
      if (p && s.data[i] !== null && (dotsOn.value || iso.has(p))) {
        dots.push({ x: r2(p.x), y: r2(p.y), d: marker === 'circle' ? '' : markerPath(marker, r2(p.x), r2(p.y), 3), title: `${categories[i]}, ${s.name}: ${fmtTip(s.data[i]!)}` })
      }
    })
    return {
      name: s.name,
      dash: DASHES[si % DASHES.length]!,
      tone: toneClasses[s.tone],
      d: hasSegment ? curvePath(pts, curve.value) : '',
      area: band ? bandPath(top as Point[], band.lower.map((v, i) => ({ x: sx.value(i), y: sy.value(v) })), curve.value) : stackedOn.value ? '' : areaOn.value ? curveAreaPath(pts, baseY, curve.value) : '',
      marker,
      dots,
    }
  })
})

const gridLines = computed(() => {
  const { x0, x1 } = layout.value
  return ticks.value.map((t) => ({ t, y: r2(sy.value(t)), x1: x0, x2: x1, label: fmtAxis(t) }))
})

const xLabels = computed(() => {
  const { categories, count } = norm.value
  const { x0, x1, y1 } = layout.value
  const slot = count > 1 ? (x1 - x0) / (count - 1) : x1 - x0
  const longest = Math.min(80, Math.max(0, ...categories.map((c) => estimateTextWidth(c, FONT)))) + 6
  const step = labelStep(slot, longest)
  const maxChars = Math.max(3, Math.floor((slot * step) / (FONT * 0.58)))
  const out: { i: number; x: number; y: number; anchor: string; text: string; full: string | null }[] = []
  for (let i = 0; i < count; i += step) {
    const full = categories[i]!
    const text = truncateLabel(full, maxChars)
    const x = r2(sx.value(i))
    out.push({ i, x, y: r2(y1 + 14), anchor: edgeAnchor(x, text, W.value, FONT), text, full: text === full ? null : full })
  }
  return dropOverlappingLabels(out, FONT)
})

/** Vertical gridlines (`grid="full"`) at the x positions that carry a visible label. */
const verticalLines = computed(() => {
  if (gridMode.value !== 'full') return []
  const { y0, y1 } = layout.value
  return xLabels.value.map((l) => ({ i: l.i, x: l.x, y1: y0, y2: y1 }))
})

const summary = computed(() => {
  const { count, series } = norm.value
  const ext = extent(series.flatMap((s) => s.data))!
  return `Line chart: ${plural(count, 'point')} per series, ${plural(series.length, 'series', 'series')}, values from ${fmtTip(ext[0])} to ${fmtTip(ext[1])}`
})
const legendItems = computed(() =>
  norm.value.series.map((s, i) => ({
    name: s.name,
    bg: toneClasses[s.tone].bg,
    stroke: toneClasses[s.tone].stroke,
    dash: DASHES[i % DASHES.length]!,
    ...(perSeriesMarkers.value && dotsOn.value ? { marker: markerFor(i), fill: toneClasses[s.tone].fill } : {}),
  })),
)
const tableCaption = computed(() => `${explicitName.value || 'Line chart'}: data`)
const legendVisible = computed(() => (props.showLegend === 'auto' ? norm.value.series.length > 1 : !!props.showLegend))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="line-chart"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="line-chart-empty">{{ emptyText }}</span>
  </div>
  <div v-else ref="rootEl" v-bind="rootAttrs" data-slot="line-chart" :class="cn('flex w-full flex-col gap-2', $props.class)">
    <svg
      data-slot="line-chart-svg"
      role="img"
      :aria-label="explicitName || summary"
      :aria-labelledby="labelledby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <g v-if="gridMode !== 'none'" data-slot="line-chart-grid" :data-grid="gridMode === 'horizontal' ? undefined : gridMode">
        <line
          v-for="g in gridLines"
          :key="g.t"
          :x1="g.x1" :x2="g.x2" :y1="g.y" :y2="g.y"
          class="stroke-border"
          stroke-width="1"
          :stroke-dasharray="gridMode === 'dashed' ? '3 4' : undefined"
        />
        <line
          v-for="v in verticalLines"
          :key="`v${v.i}`"
          data-slot="line-chart-grid-vertical"
          :x1="v.x" :x2="v.x" :y1="v.y1" :y2="v.y2"
          class="stroke-border"
          stroke-width="1"
        />
      </g>
      <g v-if="showAxis" data-slot="line-chart-axis" class="fill-muted-foreground text-xs tabular-nums">
        <text
          v-for="g in gridLines"
          :key="g.t"
          data-slot="line-chart-tick"
          :x="r2(g.x1 - 6)" :y="g.y" text-anchor="end" dominant-baseline="middle"
        >{{ g.label }}</text>
        <text
          v-for="l in xLabels"
          :key="`x${l.i}`"
          data-slot="line-chart-category"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        >{{ l.text }}<title v-if="l.full">{{ l.full }}</title></text>
      </g>
      <g v-for="(ln, si) in lines" :key="si" data-slot="line-chart-series" :data-series="si">
        <path v-if="ln.area" data-slot="line-chart-area" :d="ln.area" :class="[ln.tone.fillSoft, 'stroke-none']" />
        <path
          v-if="ln.d"
          data-slot="line-chart-line"
          :d="ln.d"
          fill="none"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-dasharray="ln.dash || undefined"
          :class="ln.tone.stroke"
        />
        <template v-for="(p, di) in ln.dots" :key="di">
          <circle
            v-if="ln.marker === 'circle'"
            data-slot="line-chart-dot"
            :cx="p.x" :cy="p.y" r="3"
            stroke-width="1.5"
            :class="[ln.tone.fill, 'stroke-background']"
          ><title>{{ p.title }}</title></circle>
          <path
            v-else
            data-slot="line-chart-dot"
            :data-marker="ln.marker"
            :d="p.d"
            stroke-width="1.5"
            stroke-linejoin="round"
            :class="[ln.tone.fill, 'stroke-background']"
          ><title>{{ p.title }}</title></path>
        </template>
      </g>
    </svg>
    <ChartLegend v-if="legendVisible" data-slot="line-chart-legend" :items="legendItems" />
    <ChartDataTable :caption="tableCaption" :categories="norm.categories" :series="norm.series" :format="fmtTip" />
  </div>
</template>
