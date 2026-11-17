<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { allIntegers, extent, formatCompact, formatNumber, niceTicks, r2 } from '../_chart/chartMath'
import {
  barFill, barRadius, chartHeight, dimension, edgeAnchor, estimateTextWidth, fitText, hasValues, labelGutter, labelStep, LABEL_GAP, LABEL_SAFETY, normalizeSeries, plural, scaleSafe, truncateLabel,
  type BarGap, type BarRounded, type ChartSeries, type ChartSize,
} from '../_chart/chartKit'
import { toneClasses } from '../_chart/tones'
import { checkCategorySeries, useChartContract } from '../_chart/chartContract'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartLegend from '../_chart/ChartLegend.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'

export type BarChartSeries = ChartSeries

export interface BarChartProps extends BaseProps {
  /** Category labels (one per group of bars). */
  labels: string[]
  series: BarChartSeries[]
  /** `grouped` puts the series side by side, `stacked` stacks them. Without it, `stacked` decides. */
  variant?: 'grouped' | 'stacked'
  orientation?: 'vertical' | 'horizontal'
  /** Stack series on top of each other (positives up/right, negatives down/left). Same as `variant="stacked"`. */
  stacked?: boolean
  /** Bar corner radius. `auto` is 2 for grouped bars and square for stacked segments. */
  rounded?: 'auto' | BarRounded
  /** Space between the bars of neighbouring categories: `sm` is wide bars, `lg` is narrow bars. */
  gap?: BarGap
  /** Chart height when `height` is not set: 160 / 240 / 320. */
  size?: ChartSize
  /** Print the value at the end of each bar (the category total for stacked bars). Labels that do not fit are left out. */
  showValues?: boolean
  /** Gridline style. Without it, `showGrid` decides (`value` when on). */
  grid?: 'none' | 'value' | 'dashed' | 'full'
  showGrid?: boolean
  showAxis?: boolean
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

const props = withDefaults(defineProps<BarChartProps>(), {
  orientation: 'vertical',
  stacked: false,
  rounded: 'auto',
  gap: 'md',
  size: 'md',
  showValues: false,
  showGrid: true,
  showAxis: true,
  integerTicks: 'auto',
  showLegend: 'auto',
  emptyText: 'No data',
  width: 480,
})

defineOptions({ inheritAttrs: false })
const { explicitName, labelledby, rootAttrs } = useChartContract('BarChart', props, () => checkCategorySeries('BarChart', props.labels, props.series), [() => props.labels, () => props.series])

const FONT = 12 // px of axis text (text-xs); label width estimates use the same size
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const H = computed(() => chartHeight(props.size, props.height))
const isStacked = computed(() => (props.variant === 'stacked' ? true : props.variant === 'grouped' ? false : props.stacked))
const gridMode = computed<'none' | 'value' | 'dashed' | 'full'>(() => {
  const g = props.grid
  if (g === 'none' || g === 'value' || g === 'dashed' || g === 'full') return g
  return props.showGrid ? 'value' : 'none'
})
const horizontal = computed(() => props.orientation === 'horizontal')
const norm = computed(() => normalizeSeries(props.labels, props.series))
const empty = computed(() => norm.value.count === 0 || !hasValues(norm.value))
const fmtTip = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const fmtAxis = (n: number) => (props.valueFormatter ?? formatCompact)(n)

interface Cell {
  si: number
  ci: number
  v: number | null
  from: number
  to: number
}

/** Bars in value space: grouped bars start at 0, stacked bars start at the running total of their sign. */
const cells = computed<Cell[]>(() => {
  const { count, series } = norm.value
  const out: Cell[] = []
  for (let ci = 0; ci < count; ci++) {
    let pos = 0
    let neg = 0
    series.forEach((s, si) => {
      const v = s.data[ci]!
      if (v === null) return out.push({ si, ci, v: null, from: 0, to: 0 })
      if (!isStacked.value) return out.push({ si, ci, v, from: 0, to: v })
      const acc = v >= 0 ? pos : neg
      const to = acc + v
      if (!Number.isFinite(to)) return out.push({ si, ci, v: null, from: 0, to: 0 })
      if (v >= 0) pos = to
      else neg = to
      out.push({ si, ci, v, from: acc, to })
    })
  }
  return out
})

const ticks = computed(() => {
  const ext = extent(cells.value.flatMap((c) => (c.v === null ? [] : [c.from, c.to])))
  const lo = Math.min(0, ext ? ext[0] : 0)
  const hi = Math.max(0, ext ? ext[1] : 0)
  const whole = props.integerTicks === 'auto' ? allIntegers(cells.value.flatMap((c) => (c.v === null ? [] : [c.from, c.to]))) : !!props.integerTicks
  return niceTicks(lo, hi, horizontal.value ? 5 : 6, whole)
})

// The drawing is always laid out left to right (axis on the left); `text-anchor: end` follows `direction`, so the svg pins it to ltr.
const maxCatChars = 14
/**
 * Horizontal bars: category labels sit in a left gutter that is as wide as the widest label (by `estimateTextWidth`), but at most
 * 40% of the chart. A label wider than that is cut with an ellipsis (its full text stays in the `<title>` and the data table),
 * so the gutter always holds what is drawn.
 */
const rowLabels = computed(() => {
  const budget = Math.max(0, W.value * 0.4 - LABEL_GAP - LABEL_SAFETY)
  return norm.value.categories.map((c) => fitText(truncateLabel(c, maxCatChars), budget, FONT))
})
const layout = computed(() => {
  const w = W.value
  const h = H.value
  const pad = 8
  let left = 4
  let bottom = 4
  const top = props.showAxis ? 8 : 4
  // Horizontal bars centre the last value tick on the right end of the plot, so its label needs half its width of room there.
  const right = props.showAxis ? (horizontal.value ? Math.max(8, Math.ceil(estimateTextWidth(fmtAxis(ticks.value[ticks.value.length - 1]!), FONT) / 2) + LABEL_SAFETY) : 8) : 4
  if (props.showAxis) {
    if (horizontal.value) {
      left = labelGutter(Math.max(0, ...rowLabels.value.map((t) => estimateTextWidth(t, FONT))))
      bottom = 20
    } else {
      left = Math.max(...ticks.value.map((t) => estimateTextWidth(fmtAxis(t), FONT))) + pad
      bottom = 22
    }
  }
  const x0 = Math.min(left, w * 0.6)
  const x1 = Math.max(x0 + 1, w - right)
  const y0 = top
  const y1 = Math.max(y0 + 1, h - bottom)
  return { x0, x1, y0, y1 }
})

interface ValueTag {
  si: number
  ci: number
  text: string
  /** Value-space position of the bar end the label sits at. */
  tip: number
  /** 1 past the positive end, -1 past the negative end. */
  dir: 1 | -1
}

/** Value labels: one per bar, or one per category total when stacked. */
const valueTags = computed<ValueTag[]>(() => {
  if (!props.showValues) return []
  const out: ValueTag[] = []
  if (!isStacked.value) {
    for (const c of cells.value) if (c.v !== null) out.push({ si: c.si, ci: c.ci, text: fmtAxis(c.v), tip: c.v, dir: c.v >= 0 ? 1 : -1 })
    return out
  }
  for (let ci = 0; ci < norm.value.count; ci++) {
    const col = cells.value.filter((c) => c.ci === ci && c.v !== null)
    if (col.length === 0) continue
    const sum = col.reduce((a, c) => a + c.v!, 0)
    const tip = sum >= 0 ? Math.max(0, ...col.map((c) => c.to)) : Math.min(0, ...col.map((c) => c.to))
    out.push({ si: 0, ci, text: fmtAxis(sum), tip, dir: sum >= 0 ? 1 : -1 })
  }
  return out
})

/** Room reserved at each end of the value scale for the labels that sit past the bar ends. */
const valuePad = computed(() => {
  const tags = valueTags.value
  if (tags.length === 0) return { lo: 0, hi: 0 }
  const room = horizontal.value ? Math.max(...tags.map((t) => estimateTextWidth(t.text, FONT))) + 8 : 16
  return { lo: tags.some((t) => t.dir < 0) ? room : 0, hi: tags.some((t) => t.dir > 0) ? room : 0 }
})

const scale = computed(() => {
  const t = ticks.value
  const { x0, x1, y0, y1 } = layout.value
  const { lo, hi } = valuePad.value
  const d0 = t[0]!
  const d1 = t[t.length - 1]!
  return horizontal.value ? scaleSafe(d0, d1, x0 + lo, x1 - hi) : scaleSafe(d0, d1, y1 - lo, y0 + hi)
})

const band = computed(() => {
  const { x0, x1, y0, y1 } = layout.value
  return (horizontal.value ? y1 - y0 : x1 - x0) / Math.max(1, norm.value.count)
})

interface Rect {
  key: string
  si: number
  ci: number
  na: boolean
  x: number
  y: number
  w: number
  h: number
  rx: number
  tone: string
  title: string
}

const rects = computed<Rect[]>(() => {
  const { series, categories } = norm.value
  const { x0, x1, y0, y1 } = layout.value
  const inner = band.value * barFill(props.gap)
  const groups = isStacked.value ? 1 : Math.max(1, series.length)
  const size = inner / groups
  const sc = scale.value
  return cells.value.map((c) => {
    const s = series[c.si]!
    const start = (horizontal.value ? y0 : x0) + c.ci * band.value + (band.value - inner) / 2 + (isStacked.value ? 0 : c.si * size)
    const na = c.v === null
    const a = sc(Math.min(c.from, c.to))
    const b = sc(Math.max(c.from, c.to))
    const lo = Math.min(a, b)
    const len = Math.abs(b - a)
    let x: number, y: number, w: number, h: number
    if (horizontal.value) [x, y, w, h] = na ? [x0, start, x1 - x0, size] : [lo, start, len, size]
    else [x, y, w, h] = na ? [start, y0, size, y1 - y0] : [start, lo, size, len]
    const value = na ? 'n/a' : fmtTip(c.v!)
    return {
      key: `${c.si}-${c.ci}`, si: c.si, ci: c.ci, na, x: r2(x), y: r2(y), w: r2(w), h: r2(h), rx: r2(barRadius(props.rounded, isStacked.value, w, h)),
      tone: toneClasses[s.tone].fill,
      title: `${categories[c.ci]}, ${s.name}: ${value}`,
    }
  })
})

const gridLines = computed(() => {
  const { x0, x1, y0, y1 } = layout.value
  const sc = scale.value
  return ticks.value.map((t) => {
    const p = r2(sc(t))
    return horizontal.value
      ? { t, line: { x1: p, x2: p, y1: y0, y2: y1 }, text: { x: p, y: r2(y1 + 14), anchor: 'middle' }, label: fmtAxis(t) }
      : { t, line: { x1: x0, x2: x1, y1: p, y2: p }, text: { x: r2(x0 - 6), y: p, anchor: 'end' }, label: fmtAxis(t) }
  })
})

/** Separators between category bands (`grid="full"`), thinned beyond 60 categories. */
const bandLines = computed(() => {
  if (gridMode.value !== 'full') return []
  const { x0, x1, y0, y1 } = layout.value
  const n = norm.value.count
  const every = Math.max(1, Math.ceil(n / 60))
  const out: { i: number; x1: number; x2: number; y1: number; y2: number }[] = []
  for (let i = 0; i <= n; i += every) {
    const p = r2((horizontal.value ? y0 : x0) + i * band.value)
    out.push(horizontal.value ? { i, x1: x0, x2: x1, y1: p, y2: p } : { i, x1: p, x2: p, y1: y0, y2: y1 })
  }
  return out
})

const valueLabels = computed(() => {
  const { x0, y0 } = layout.value
  const inner = band.value * barFill(props.gap)
  const groups = isStacked.value ? 1 : Math.max(1, norm.value.series.length)
  const size = inner / groups
  const room = groups === 1 ? band.value : size
  const sc = scale.value
  const out: { key: string; x: number; y: number; anchor: string; text: string }[] = []
  for (const t of valueTags.value) {
    if (horizontal.value ? room < FONT : estimateTextWidth(t.text, FONT) > room) continue
    const mid = (horizontal.value ? y0 : x0) + t.ci * band.value + (band.value - inner) / 2 + (isStacked.value ? 0 : t.si * size) + size / 2
    const p = sc(t.tip)
    out.push(
      horizontal.value
        ? { key: `${t.si}-${t.ci}`, x: r2(p + t.dir * 4), y: r2(mid), anchor: t.dir > 0 ? 'start' : 'end', text: t.text }
        : { key: `${t.si}-${t.ci}`, x: r2(mid), y: r2(p - t.dir * 8), anchor: 'middle', text: t.text },
    )
  }
  return out
})

const zeroLine = computed(() => {
  const { x0, x1, y0, y1 } = layout.value
  const p = r2(scale.value(0))
  return horizontal.value ? { x1: p, x2: p, y1: y0, y2: y1 } : { x1: x0, x2: x1, y1: p, y2: p }
})

const catLabels = computed(() => {
  const { categories, count } = norm.value
  const { x0, y0, y1 } = layout.value
  const step = horizontal.value
    ? labelStep(band.value, FONT)
    : labelStep(band.value, Math.min(80, Math.max(0, ...categories.map((c) => estimateTextWidth(c, FONT)))) + 4)
  const maxChars = horizontal.value ? maxCatChars : Math.max(3, Math.floor((band.value * step) / (FONT * 0.58)))
  const out: { ci: number; x: number; y: number; anchor: string; text: string; full: string | null }[] = []
  for (let ci = 0; ci < count; ci += step) {
    const full = categories[ci]!
    const text = horizontal.value ? rowLabels.value[ci]! : truncateLabel(full, maxChars)
    const mid = (horizontal.value ? y0 : x0) + (ci + 0.5) * band.value
    out.push({
      ci,
      x: r2(horizontal.value ? x0 - LABEL_GAP : mid),
      y: r2(horizontal.value ? mid : y1 + 14),
      anchor: horizontal.value ? 'end' : edgeAnchor(mid, text, W.value, FONT),
      text,
      full: text === full ? null : full,
    })
  }
  return out
})

const summary = computed(() => {
  const { count, series } = norm.value
  const ext = extent(series.flatMap((s) => s.data))!
  return `Bar chart: ${plural(count, 'category', 'categories')}, ${plural(series.length, 'series', 'series')}, values from ${fmtTip(ext[0])} to ${fmtTip(ext[1])}`
})
const legendItems = computed(() => norm.value.series.map((s) => ({ name: s.name, bg: toneClasses[s.tone].bg })))
const tableCaption = computed(() => `${explicitName.value || 'Bar chart'}: data`)
const legendVisible = computed(() => (props.showLegend === 'auto' ? norm.value.series.length > 1 : !!props.showLegend))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="bar-chart"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="bar-chart-empty">{{ emptyText }}</span>
  </div>
  <div v-else ref="rootEl" v-bind="rootAttrs" data-slot="bar-chart" :class="cn('flex w-full flex-col gap-2', $props.class)">
    <svg
      data-slot="bar-chart-svg"
      role="img"
      :aria-label="explicitName || summary"
      :aria-labelledby="labelledby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full [direction:ltr]"
    >
      <g v-if="gridMode !== 'none'" data-slot="bar-chart-grid" :data-grid="gridMode === 'value' ? undefined : gridMode">
        <line
          v-for="g in gridLines"
          :key="g.t"
          :x1="g.line.x1" :x2="g.line.x2" :y1="g.line.y1" :y2="g.line.y2"
          class="stroke-border"
          stroke-width="1"
          :stroke-dasharray="gridMode === 'dashed' ? '3 4' : undefined"
        />
        <line
          v-for="b in bandLines"
          :key="`b${b.i}`"
          data-slot="bar-chart-grid-band"
          :x1="b.x1" :x2="b.x2" :y1="b.y1" :y2="b.y2"
          class="stroke-border"
          stroke-width="1"
        />
      </g>
      <g v-if="showAxis" data-slot="bar-chart-axis" class="fill-muted-foreground text-xs tabular-nums">
        <text
          v-for="g in gridLines"
          :key="g.t"
          data-slot="bar-chart-tick"
          :x="g.text.x" :y="g.text.y" :text-anchor="g.text.anchor" dominant-baseline="middle"
        >{{ g.label }}</text>
        <text
          v-for="l in catLabels"
          :key="`c${l.ci}`"
          data-slot="bar-chart-category"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        >{{ l.text }}<title v-if="l.full">{{ l.full }}</title></text>
      </g>
      <g data-slot="bar-chart-bars">
        <rect
          v-for="r in rects"
          :key="r.key"
          :data-slot="r.na ? 'bar-chart-bar-empty' : 'bar-chart-bar'"
          :data-series="r.si"
          :data-index="r.ci"
          :x="r.x" :y="r.y" :width="r.w" :height="r.h"
          :rx="r.rx"
          :class="r.na ? 'fill-transparent' : r.tone"
        ><title>{{ r.title }}</title></rect>
      </g>
      <g v-if="valueLabels.length" data-slot="bar-chart-values" class="fill-foreground text-xs tabular-nums">
        <text
          v-for="l in valueLabels"
          :key="l.key"
          data-slot="bar-chart-value"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        >{{ l.text }}</text>
      </g>
      <line
        v-if="showAxis"
        data-slot="bar-chart-baseline"
        :x1="zeroLine.x1" :x2="zeroLine.x2" :y1="zeroLine.y1" :y2="zeroLine.y2"
        class="stroke-muted-foreground"
        stroke-width="1"
      />
    </svg>
    <ChartLegend v-if="legendVisible" :items="legendItems" data-slot="bar-chart-legend" />
    <ChartDataTable :caption="tableCaption" :categories="norm.categories" :series="norm.series" :format="fmtTip" />
  </div>
</template>
