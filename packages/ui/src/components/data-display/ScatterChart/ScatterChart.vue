<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { clamp, extent, formatCompact, formatNumber, linePath, r2, type Point } from '../_chart/chartMath'
import { dimension, estimateTextWidth, labelStep, markerPath, oneOf, plural, scaleSafe, seriesMarker, truncateLabel, MARKER_SHAPES, type MarkerShape } from '../_chart/chartKit'
import { toneClasses, type ChartTone } from '../_chart/tones'
import { clampCentre, FORCED_CANVAS_STROKE, FORCED_FILL, FORCED_STROKE, overlaps, textBox, useChartFrame, type LabelBox } from '../_chart/chartFrame'
import ChartCaption from '../_chart/ChartCaption.vue'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartMarkerLegend from '../_chart/ChartMarkerLegend.vue'
import ChartPlaceholder from '../_chart/ChartPlaceholder.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { axisTicks, linearRegression, normalizePoints, trendSegment, describeRegression, bubbleRadius, type ScatterPoint } from './scatterMath'
import {
  BUBBLE_RADIUS, SCATTER_GRIDS, SCATTER_HEIGHTS, SCATTER_RADIUS, SCATTER_SIZES, SCATTER_VARIANTS, scatterChartVariants,
  type ScatterChartSize, type ScatterChartVariant, type ScatterGrid,
} from './variants'

export type { ScatterPoint } from './scatterMath'

export interface ScatterChartProps extends BaseProps {
  /** Points `{ x, y, size?, label?, series? }`. Points with the same `series` name form one series. Non-finite coordinates are skipped. */
  points: ScatterPoint[]
  /** `scatter` plots markers, `bubble` scales each marker's area with `size`, `connected` also joins the points of a series in the order given. */
  variant?: ScatterChartVariant
  /** Marker shape. `series` gives each series its own shape (circle, square, diamond, triangle), so series differ by more than colour. */
  markerShape?: MarkerShape | 'series'
  /** Height of the plot (200 / 280 / 360), marker radius and bubble range. */
  size?: ScatterChartSize
  /** Gridlines: `horizontal` at each y tick, `vertical` at each x tick, `full` both, `dashed` both dashed, `none`. */
  grid?: ScatterGrid
  /** Title of the x axis, printed under the plot. */
  xTitle?: string
  /** Title of the y axis, printed along the plot, rotated. */
  yTitle?: string
  /** Draw the least squares line of each series (dotted). Needs two points with different x. */
  trend?: boolean
  /** Print the label of each point (or `x, y` without one) next to it. Labels that would overlap are left out; none are drawn beyond 60 points. */
  showValues?: boolean
  /** Axis ticks and tick labels. */
  showAxis?: boolean
  /** `'auto'` shows the legend when there is more than one series. */
  showLegend?: boolean | 'auto'
  /** Tone per series name, e.g. `{ Errors: 'danger' }`. Other series cycle chart-1..5. */
  tones?: Record<string, ChartTone>
  /** Formats y ticks, sizes and tooltips. Defaults to compact (axis) / grouped (tooltip) numbers. */
  valueFormatter?: (n: number) => string
  /** Formats x ticks and x values. Defaults like `valueFormatter`. */
  xFormatter?: (n: number) => string
  /** Accessible name of the chart image. Without it `title` names the chart. */
  label?: string
  /** Visible heading above the plot. */
  title?: string
  /** Visible description under the title. The image is described by it. */
  description?: string
  /** Shown when there is nothing to plot. */
  emptyText?: string
  /** Show a busy placeholder instead of the chart. */
  loading?: boolean
  /** Message of the loading placeholder. */
  loadingText?: string
  /** ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px). */
  width?: number
  /** ViewBox height. Overrides `size`. */
  height?: number
}

const props = withDefaults(defineProps<ScatterChartProps>(), {
  variant: 'scatter',
  markerShape: 'series',
  size: 'md',
  grid: 'full',
  trend: false,
  showValues: false,
  showAxis: true,
  showLegend: 'auto',
  emptyText: 'No data',
  loading: false,
  loadingText: 'Loading chart',
  width: 480,
})

defineOptions({ inheritAttrs: false })

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
function checkPoints() {
  if (!Array.isArray(props.points)) {
    violation('ScatterChart', 'requires-points', 'requires `points`, an array of `{ x, y }` objects, e.g. `[{ x: 3, y: 12 }]`. An empty array shows the empty state.')
    return
  }
  props.points.forEach((p: unknown, i: number) => {
    if (!isRecord(p) || typeof p.x !== 'number' || typeof p.y !== 'number') {
      violation('ScatterChart', 'point-shape', `point ${i + 1} needs numeric \`x\` and \`y\`: \`{ x: 3, y: 12 }\`.`)
    }
  })
}
const { explicitName, labelledby, rootAttrs, ids, hasTitle, hasDescription, describedby } = useChartFrame('ScatterChart', props, checkPoints, [() => props.points])

const FONT = 12
const DASHES = ['', '6 4', '2 4', '8 3 2 3', '1 5'] as const
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const sizeKey = computed(() => oneOf<ScatterChartSize>(props.size, SCATTER_SIZES, 'md'))
const H = computed(() => dimension(props.height, SCATTER_HEIGHTS[sizeKey.value]))
const variant = computed(() => oneOf<ScatterChartVariant>(props.variant, SCATTER_VARIANTS, 'scatter'))
const gridMode = computed(() => oneOf<ScatterGrid>(props.grid, SCATTER_GRIDS, 'full'))
const perSeriesShape = computed(() => !(MARKER_SHAPES as readonly string[]).includes(props.markerShape))
const shapeFor = (si: number): MarkerShape => (perSeriesShape.value ? seriesMarker(si) : (props.markerShape as MarkerShape))

const norm = computed(() => normalizePoints(props.points, props.tones))
const empty = computed(() => norm.value.count === 0)
const fmtY = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const fmtYAxis = (n: number) => (props.valueFormatter ?? formatCompact)(n)
const fmtX = (n: number) => (props.xFormatter ?? props.valueFormatter ?? formatNumber)(n)
const fmtXAxis = (n: number) => (props.xFormatter ?? props.valueFormatter ?? formatCompact)(n)

const allPoints = computed(() => norm.value.series.flatMap((s) => s.points))
const maxSize = computed(() => Math.max(0, ...allPoints.value.map((p) => p.size ?? 0)))
const radius = computed<[number, number]>(() => (variant.value === 'bubble' ? BUBBLE_RADIUS[sizeKey.value] : [SCATTER_RADIUS[sizeKey.value], SCATTER_RADIUS[sizeKey.value]]))

const margins = computed(() => {
  const w = W.value
  const h = H.value
  const axis = props.showAxis
  const yTicks = yTicksFor(h)
  const widest = Math.max(...yTicks.map((t) => estimateTextWidth(fmtYAxis(t), FONT)))
  const left = Math.min((axis ? widest + 10 : 6) + (props.yTitle ? 16 : 0), w * 0.4)
  const bottom = (axis ? 24 : 6) + (props.xTitle ? 16 : 0)
  const x0 = left
  const x1 = Math.max(x0 + 1, w - 14)
  const y0 = 10
  const y1 = Math.max(y0 + 1, h - bottom)
  return { x0, x1, y0, y1 }
})

function yTicksFor(h: number): number[] {
  const ext = extent(allPoints.value.map((p) => p.y))
  return ext ? axisTicks(ext[0], ext[1], clamp(Math.floor((h - 50) / 40), 2, 7)) : [0, 1]
}
const yTicks = computed(() => yTicksFor(H.value))
const xTicks = computed(() => {
  const ext = extent(allPoints.value.map((p) => p.x))
  const plotW = margins.value.x1 - margins.value.x0
  return ext ? axisTicks(ext[0], ext[1], clamp(Math.floor(plotW / 72), 2, 8)) : [0, 1]
})

/** Room kept between the plot edge and the outermost marker so markers are not cut off. */
const inset = computed(() => Math.min(radius.value[1] + 2, (margins.value.x1 - margins.value.x0) / 6, (margins.value.y1 - margins.value.y0) / 6))
const sx = computed(() => scaleSafe(xTicks.value[0]!, xTicks.value[xTicks.value.length - 1]!, margins.value.x0 + inset.value, margins.value.x1 - inset.value))
const sy = computed(() => scaleSafe(yTicks.value[0]!, yTicks.value[yTicks.value.length - 1]!, margins.value.y1 - inset.value, margins.value.y0 + inset.value))

interface Mark {
  key: string
  si: number
  x: number
  y: number
  r: number
  shape: MarkerShape
  d: string
  tone: string
  title: string
}
const marks = computed<Mark[]>(() => {
  const [rMin, rMax] = radius.value
  const bubble = variant.value === 'bubble'
  const out: Mark[] = []
  norm.value.series.forEach((s, si) => {
    const shape = shapeFor(si)
    for (const p of s.points) {
      const r = bubble ? bubbleRadius(p.size, maxSize.value, rMin, rMax) : rMin
      const x = r2(sx.value(p.x))
      const y = r2(sy.value(p.y))
      const name = `${p.label ? `${p.label}, ` : ''}${s.name}`
      out.push({
        key: `${si}-${p.index}`, si, x, y, r: r2(r), shape,
        d: shape === 'circle' ? '' : markerPath(shape, x, y, r),
        tone: toneClasses[s.tone].fill,
        title: `${name}: x ${fmtX(p.x)}, y ${fmtY(p.y)}${p.size !== null ? `, size ${fmtY(p.size)}` : ''}`,
      })
    }
  })
  // Big bubbles first, so small ones stay visible on top of them.
  return bubble ? out.sort((a, b) => b.r - a.r) : out
})

const lines = computed(() =>
  variant.value !== 'connected'
    ? []
    : norm.value.series
        .map((s, si) => {
          const pts: Point[] = s.points.map((p) => ({ x: sx.value(p.x), y: sy.value(p.y) }))
          return { si, d: pts.length > 1 ? linePath(pts) : '', dash: DASHES[si % DASHES.length]!, stroke: toneClasses[s.tone].stroke }
        })
        .filter((l) => l.d),
)

const trends = computed(() => {
  if (!props.trend) return []
  const yt = yTicks.value
  const out: { si: number; name: string; x1: number; y1: number; x2: number; y2: number; stroke: string; text: string }[] = []
  norm.value.series.forEach((s, si) => {
    const reg = linearRegression(s.points)
    if (!reg) return
    const xs = s.points.map((p) => p.x)
    const seg = trendSegment(reg, Math.min(...xs), Math.max(...xs), yt[0]!, yt[yt.length - 1]!)
    if (!seg) return
    out.push({
      si, name: s.name, x1: r2(sx.value(seg[0])), y1: r2(sy.value(seg[1])), x2: r2(sx.value(seg[2])), y2: r2(sy.value(seg[3])),
      stroke: toneClasses[s.tone].stroke, text: describeRegression(reg, formatNumber),
    })
  })
  return out
})

const xLabels = computed(() => {
  const ticks = xTicks.value
  const labels = ticks.map(fmtXAxis)
  const px = ticks.map((t) => sx.value(t))
  let minGap = Infinity
  for (let i = 1; i < px.length; i++) minGap = Math.min(minGap, px[i]! - px[i - 1]!)
  const longest = Math.max(...labels.map((l) => estimateTextWidth(l, FONT))) + 8
  const step = labelStep(Number.isFinite(minGap) ? minGap : longest, longest)
  const { y1 } = margins.value
  const out: { t: number; x: number; y: number; text: string }[] = []
  ticks.forEach((t, i) => {
    if (i % step !== 0) return
    const w = estimateTextWidth(labels[i]!, FONT)
    out.push({ t, x: r2(clampCentre(px[i]!, w, W.value)), y: r2(y1 + 14), text: labels[i]! })
  })
  return out
})
const yLabels = computed(() => yTicks.value.map((t) => ({ t, y: r2(sy.value(t)), text: fmtYAxis(t) })))

const zeroLines = computed(() => {
  const xt = xTicks.value
  const yt = yTicks.value
  return {
    x: xt[0]! < 0 && xt[xt.length - 1]! > 0 ? r2(sx.value(0)) : null,
    y: yt[0]! < 0 && yt[yt.length - 1]! > 0 ? r2(sy.value(0)) : null,
  }
})
const showH = computed(() => ['horizontal', 'full', 'dashed'].includes(gridMode.value))
const showV = computed(() => ['vertical', 'full', 'dashed'].includes(gridMode.value))

const VALUE_LIMIT = 60
const valueLabels = computed(() => {
  if (!props.showValues || allPoints.value.length > VALUE_LIMIT) return []
  const out: { key: string; x: number; y: number; anchor: 'start' | 'end'; text: string }[] = []
  const placed: LabelBox[] = []
  const w = W.value
  norm.value.series.forEach((s, si) => {
    for (const p of s.points) {
      const m = marks.value.find((k) => k.key === `${si}-${p.index}`)!
      const text = truncateLabel(p.label || `${fmtX(p.x)}, ${fmtY(p.y)}`, 24)
      const tw = estimateTextWidth(text, FONT)
      const right = m.x + m.r + 4
      const anchor: 'start' | 'end' = right + tw > w - 2 ? 'end' : 'start'
      const x = anchor === 'start' ? right : m.x - m.r - 4
      const box = textBox(x, m.y, tw, FONT, anchor)
      if (box.x0 < 0 || box.y0 < 0 || placed.some((b) => overlaps(b, box))) continue
      placed.push(box)
      out.push({ key: m.key, x: r2(x), y: m.y, anchor, text })
    }
  })
  return out
})

const xTitleText = computed(() => truncateLabel(props.xTitle ?? '', Math.max(3, Math.floor((margins.value.x1 - margins.value.x0) / (FONT * 0.58)))))
const yTitleText = computed(() => truncateLabel(props.yTitle ?? '', Math.max(3, Math.floor((margins.value.y1 - margins.value.y0) / (FONT * 0.58)))))

const kind = computed(() => (variant.value === 'bubble' ? 'Bubble chart' : variant.value === 'connected' ? 'Connected scatter chart' : 'Scatter chart'))
const summary = computed(() => {
  const n = norm.value
  const xs = extent(allPoints.value.map((p) => p.x))!
  const ys = extent(allPoints.value.map((p) => p.y))!
  const parts = [
    `${kind.value}: ${plural(n.count, 'point')}`,
    plural(n.series.length, 'series', 'series'),
    `x from ${fmtX(xs[0])} to ${fmtX(xs[1])}`,
    `y from ${fmtY(ys[0])} to ${fmtY(ys[1])}`,
  ]
  if (n.skipped) parts.push(`${plural(n.skipped, 'point')} skipped`)
  const trendText = trends.value.map((t) => `${n.series.length > 1 ? `${t.name}: ` : ''}${t.text}`).join('; ')
  return `${parts.join(', ')}${trendText ? `. Linear trend ${trendText}` : ''}`
})

const legendVisible = computed(() => (props.showLegend === 'auto' ? norm.value.series.length > 1 : !!props.showLegend))
const legendItems = computed(() => [
  ...norm.value.series.map((s, si) => ({ name: s.name, shape: shapeFor(si), fill: toneClasses[s.tone].fill })),
  ...(trends.value.length ? [{ name: 'Linear trend', stroke: 'stroke-muted-foreground', dash: '1 5' }] : []),
])

const tableSeries = computed(() => {
  const rows = norm.value.series.flatMap((s) => s.points.map((p) => ({ s, p })))
  const multi = norm.value.series.length > 1
  const cols = [
    { name: 'X', data: rows.map((r) => r.p.x) as (number | null)[] },
    { name: 'Y', data: rows.map((r) => r.p.y) as (number | null)[] },
  ]
  if (norm.value.hasSize) cols.push({ name: 'Size', data: rows.map((r) => r.p.size) })
  return {
    categories: rows.map((r) => `${multi ? `${r.s.name}: ` : ''}${r.p.label || `Point ${r.p.index + 1}`}`),
    series: cols,
    formats: [fmtX, fmtY, fmtY],
  }
})
const tableCaption = computed(() => `${explicitName.value || kind.value}: data`)
const imageName = computed(() => explicitName.value || summary.value)
const rootClass = computed(() => cn(scatterChartVariants({ size: sizeKey.value }), props.class))
</script>

<template>
  <ChartPlaceholder
    v-if="loading"
    v-bind="rootAttrs"
    data-slot="scatter-chart"
    kind="loading"
    :text="loadingText"
    :user-class="$props.class"
  />
  <ChartPlaceholder
    v-else-if="empty"
    v-bind="rootAttrs"
    data-slot="scatter-chart"
    kind="empty"
    :text="emptyText"
    :name="explicitName"
    :labelledby="labelledby"
    :user-class="$props.class"
  />
  <figure v-else ref="rootEl" v-bind="rootAttrs" data-slot="scatter-chart" :data-variant="variant" :class="rootClass">
    <ChartCaption data-slot="scatter-chart" :title="hasTitle ? title : undefined" :description="hasDescription ? description : undefined" :description-id="ids.description" />
    <svg
      data-slot="scatter-chart-svg"
      role="img"
      :aria-label="imageName"
      :aria-labelledby="labelledby"
      :aria-describedby="describedby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <g v-if="gridMode !== 'none'" data-slot="scatter-chart-grid" :data-grid="gridMode === 'full' ? undefined : gridMode">
        <template v-if="showH">
          <line
            v-for="g in yLabels"
            :key="`h${g.t}`"
            data-slot="scatter-chart-grid-horizontal"
            :x1="margins.x0" :x2="margins.x1" :y1="g.y" :y2="g.y"
            class="stroke-border"
            stroke-width="1"
            :stroke-dasharray="gridMode === 'dashed' ? '3 4' : undefined"
          />
        </template>
        <template v-if="showV">
          <line
            v-for="t in xTicks"
            :key="`v${t}`"
            data-slot="scatter-chart-grid-vertical"
            :x1="r2(sx(t))" :x2="r2(sx(t))" :y1="margins.y0" :y2="margins.y1"
            class="stroke-border"
            stroke-width="1"
            :stroke-dasharray="gridMode === 'dashed' ? '3 4' : undefined"
          />
        </template>
      </g>
      <g v-if="showAxis" data-slot="scatter-chart-axis" class="fill-muted-foreground text-xs tabular-nums">
        <text
          v-for="g in yLabels"
          :key="`y${g.t}`"
          data-slot="scatter-chart-tick-y"
          :x="r2(margins.x0 - 6)" :y="g.y" text-anchor="end" dominant-baseline="middle"
        >{{ g.text }}</text>
        <text
          v-for="l in xLabels"
          :key="`x${l.t}`"
          data-slot="scatter-chart-tick-x"
          :x="l.x" :y="l.y" text-anchor="middle" dominant-baseline="middle"
        >{{ l.text }}</text>
      </g>
      <g v-if="showAxis" data-slot="scatter-chart-axis-lines" class="stroke-muted-foreground" stroke-width="1" fill="none">
        <line :x1="margins.x0" :x2="margins.x1" :y1="margins.y1" :y2="margins.y1" />
        <line :x1="margins.x0" :x2="margins.x0" :y1="margins.y0" :y2="margins.y1" />
        <line v-if="zeroLines.x !== null" data-slot="scatter-chart-zero-x" :x1="zeroLines.x" :x2="zeroLines.x" :y1="margins.y0" :y2="margins.y1" />
        <line v-if="zeroLines.y !== null" data-slot="scatter-chart-zero-y" :x1="margins.x0" :x2="margins.x1" :y1="zeroLines.y" :y2="zeroLines.y" />
      </g>
      <g v-if="xTitle || yTitle" data-slot="scatter-chart-titles" class="fill-muted-foreground text-xs font-medium">
        <text v-if="xTitle" data-slot="scatter-chart-title-x" :x="r2((margins.x0 + margins.x1) / 2)" :y="H - 6" text-anchor="middle">{{ xTitleText }}<title v-if="xTitleText !== xTitle">{{ xTitle }}</title></text>
        <text
          v-if="yTitle"
          data-slot="scatter-chart-title-y"
          :x="12" :y="r2((margins.y0 + margins.y1) / 2)"
          :transform="`rotate(-90 12 ${r2((margins.y0 + margins.y1) / 2)})`"
          text-anchor="middle"
        >{{ yTitleText }}<title v-if="yTitleText !== yTitle">{{ yTitle }}</title></text>
      </g>
      <g v-if="lines.length" data-slot="scatter-chart-lines" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path
          v-for="ln in lines"
          :key="ln.si"
          data-slot="scatter-chart-line"
          :data-series="ln.si"
          :d="ln.d"
          :stroke-dasharray="ln.dash || undefined"
          :class="[ln.stroke, FORCED_STROKE]"
        />
      </g>
      <g v-if="trends.length" data-slot="scatter-chart-trends" fill="none" stroke-width="1.5" stroke-linecap="round">
        <line
          v-for="t in trends"
          :key="t.si"
          data-slot="scatter-chart-trend"
          :data-series="t.si"
          :x1="t.x1" :x2="t.x2" :y1="t.y1" :y2="t.y2"
          stroke-dasharray="1 5"
          :class="[t.stroke, FORCED_STROKE]"
        ><title>{{ `${t.name}: ${t.text}` }}</title></line>
      </g>
      <g data-slot="scatter-chart-points">
        <template v-for="m in marks" :key="m.key">
          <circle
            v-if="m.shape === 'circle'"
            data-slot="scatter-chart-point"
            :data-series="m.si"
            :cx="m.x" :cy="m.y" :r="m.r"
            :fill-opacity="variant === 'bubble' ? 0.7 : undefined"
            stroke-width="1.5"
            :class="[m.tone, 'stroke-background', FORCED_FILL, FORCED_CANVAS_STROKE]"
          ><title>{{ m.title }}</title></circle>
          <path
            v-else
            data-slot="scatter-chart-point"
            :data-series="m.si"
            :data-marker="m.shape"
            :d="m.d"
            :fill-opacity="variant === 'bubble' ? 0.7 : undefined"
            stroke-width="1.5"
            stroke-linejoin="round"
            :class="[m.tone, 'stroke-background', FORCED_FILL, FORCED_CANVAS_STROKE]"
          ><title>{{ m.title }}</title></path>
        </template>
      </g>
      <g v-if="valueLabels.length" data-slot="scatter-chart-values" class="fill-foreground text-xs tabular-nums">
        <text
          v-for="l in valueLabels"
          :key="l.key"
          data-slot="scatter-chart-value"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        >{{ l.text }}</text>
      </g>
    </svg>
    <ChartMarkerLegend v-if="legendVisible" data-slot="scatter-chart-legend" :items="legendItems" />
    <span :id="ids.summary" data-slot="scatter-chart-summary" class="sr-only">{{ summary }}</span>
    <ChartDataTable category-header="Point" :caption="tableCaption" :categories="tableSeries.categories" :series="tableSeries.series" :format="fmtY" :formats="tableSeries.formats" />
  </figure>
</template>
