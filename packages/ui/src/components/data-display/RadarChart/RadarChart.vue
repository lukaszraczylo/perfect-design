<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { clamp, extent, formatCompact, formatNumber, isFiniteNumber, r2 } from '../_chart/chartMath'
import { dimension, estimateTextWidth, markerPath, normalizeSeries, oneOf, plural, seriesMarker, type ChartSeries } from '../_chart/chartKit'
import { toneClasses } from '../_chart/tones'
import { FORCED_CANVAS_STROKE, FORCED_FILL, FORCED_STROKE, overlaps, textBox, useChartFrame, type LabelBox } from '../_chart/chartFrame'
import ChartCaption from '../_chart/ChartCaption.vue'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartMarkerLegend from '../_chart/ChartMarkerLegend.vue'
import ChartPlaceholder from '../_chart/ChartPlaceholder.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { axisDirection, labelAnchor, polygonPath, radarFraction, radarRadius, radarScale } from './radarMath'
import { wrapLabel } from '../_chart/chartText'
import {
  RADAR_HEIGHTS, RADAR_SHAPES, RADAR_SIZES, RADAR_VARIANTS, radarChartVariants,
  type RadarChartShape, type RadarChartSize, type RadarChartVariant, type RadarLevels,
} from './variants'

export type RadarChartSeries = ChartSeries

export interface RadarChartProps extends BaseProps {
  /** Names of the axes (at least 3), clockwise from the top. */
  axes: string[]
  /** One shape per entry: `{ name, data, tone? }`, with one value per axis in the order of `axes`. Missing or non-finite values sit at the centre and read "n/a". */
  series: RadarChartSeries[]
  /** `line` outlines each series, `area` adds a soft fill, `dots` draws only the markers. Every variant gives each series its own dash pattern or marker shape. */
  variant?: RadarChartVariant
  /** Shape of the rings and the axis web: straight segments (`polygon`) or circles. */
  shape?: RadarChartShape
  /** Number of rings, 3 to 6. */
  levels?: RadarLevels
  /** Height of the chart (220 / 300 / 380). The radar is as wide as the container allows and keeps its axis labels inside. */
  size?: RadarChartSize
  /** Value at the centre. Defaults to 0, or the lowest value when that is negative. */
  min?: number
  /** Value at the outer ring. Defaults to a round number that covers the data. */
  max?: number
  /** Print the value of each point next to it. Values that would overlap are left out; none are drawn beyond 48 points. */
  showValues?: boolean
  /** Print the value of each ring along the first axis. */
  showScale?: boolean
  /** `'auto'` shows the legend when there is more than one series. */
  showLegend?: boolean | 'auto'
  /** Formats ring labels, values and tooltips. Defaults to compact (rings) / grouped (tooltip) numbers. */
  valueFormatter?: (n: number) => string
  /** Accessible name of the chart image. Without it `title` names the chart. */
  label?: string
  /** Visible heading above the chart. */
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

const props = withDefaults(defineProps<RadarChartProps>(), {
  variant: 'line',
  shape: 'polygon',
  levels: 4,
  size: 'md',
  showValues: false,
  showScale: true,
  showLegend: 'auto',
  emptyText: 'No data',
  loading: false,
  loadingText: 'Loading chart',
  width: 480,
})

defineOptions({ inheritAttrs: false })

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
function checkRadar() {
  if (!Array.isArray(props.axes)) violation('RadarChart', 'requires-axes', 'requires `axes`, an array of at least 3 axis names, e.g. `["Speed", "Power", "Range"]`. An empty array shows the empty state.')
  else if (props.axes.length > 0 && props.axes.length < 3) violation('RadarChart', 'axes-count', `needs at least 3 \`axes\` to draw a shape, got ${props.axes.length}. Use BarChart for fewer categories.`)
  if (!Array.isArray(props.series)) {
    violation('RadarChart', 'requires-series', 'requires `series`, an array of `{ name, data }` objects with one value per axis. An empty array shows the empty state.')
    return
  }
  props.series.forEach((s: unknown, i: number) => {
    if (!isRecord(s) || !Array.isArray(s.data)) violation('RadarChart', 'series-shape', `series ${i + 1} needs a \`data\` array with one number per axis: \`{ name: "Team A", data: [3, 5, 4] }\`.`)
  })
}
const { explicitName, labelledby, rootAttrs, ids, hasTitle, hasDescription, describedby } = useChartFrame('RadarChart', props, checkRadar, [() => props.axes, () => props.series])

const FONT = 12
const DASHES = ['', '6 4', '2 4', '8 3 2 3', '1 5'] as const
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const sizeKey = computed(() => oneOf<RadarChartSize>(props.size, RADAR_SIZES, 'md'))
const H = computed(() => dimension(props.height, RADAR_HEIGHTS[sizeKey.value]))
const variant = computed(() => oneOf<RadarChartVariant>(props.variant, RADAR_VARIANTS, 'line'))
const shape = computed(() => oneOf<RadarChartShape>(props.shape, RADAR_SHAPES, 'polygon'))
const levels = computed(() => (isFiniteNumber(props.levels) ? clamp(Math.round(props.levels), 3, 6) : 4))

const axes = computed(() => (Array.isArray(props.axes) ? props.axes.map((a) => (a === null || a === undefined ? '' : String(a))) : []))
const n = computed(() => axes.value.length)
const series = computed(() => normalizeSeries(axes.value, props.series).series.map((s) => ({ ...s, data: s.data.slice(0, n.value) })))
const allValues = computed(() => series.value.flatMap((s) => s.data))
const empty = computed(() => n.value < 3 || series.value.length === 0 || extent(allValues.value) === null)
const fmtTip = (v: number) => (props.valueFormatter ?? formatNumber)(v)
const fmtRing = (v: number) => (props.valueFormatter ?? formatCompact)(v)

const scale = computed(() => radarScale(allValues.value, levels.value, props.min, props.max))

const LINE = 14
const GAP = 12
/** Ring labels sit just inside their ring so the outermost one never meets the top axis name. */
const RING_LABEL_DROP = 8
/** Clear space kept around a ring label when a value label is placed, so the two never touch. */
const RING_BOX_PAD = 3
const labelTexts = computed(() => {
  const maxChars = clamp(Math.floor((W.value * 0.2) / (FONT * 0.58)), 4, 14)
  return axes.value.map((a) => {
    const lines = wrapLabel(a, maxChars)
    return { full: a, lines, width: Math.max(...lines.map((l) => estimateTextWidth(l, FONT))), cut: lines.join(' ') !== a.trim() }
  })
})
const R = computed(() => radarRadius(W.value, H.value, labelTexts.value.map((l) => l.width), labelTexts.value.map((l) => l.lines.length * LINE), GAP, 6))
const cx = computed(() => r2(W.value / 2))
const cy = computed(() => r2(H.value / 2))
const dirs = computed(() => axes.value.map((_, i) => axisDirection(i, n.value)))

const rings = computed(() =>
  Array.from({ length: levels.value }, (_, k) => {
    const f = (k + 1) / levels.value
    const pts = dirs.value.map((d) => ({ x: cx.value + d.dx * R.value * f, y: cy.value + d.dy * R.value * f }))
    return {
      k, f, r: r2(R.value * f), d: polygonPath(pts),
      value: scale.value.min + (scale.value.max - scale.value.min) * f,
    }
  }),
)
const spokes = computed(() => dirs.value.map((d, i) => ({ i, x: r2(cx.value + d.dx * R.value), y: r2(cy.value + d.dy * R.value) })))
const axisLabels = computed(() =>
  dirs.value.map((d, i) => ({
    i,
    x: r2(cx.value + d.dx * (R.value + GAP)),
    y: r2(cy.value + d.dy * (R.value + GAP + ((labelTexts.value[i]!.lines.length - 1) * LINE) / 2)),
    anchor: labelAnchor(d.dx),
    lines: labelTexts.value[i]!.lines,
    full: labelTexts.value[i]!.cut ? labelTexts.value[i]!.full : null,
  })),
)
/** Ring labels are thinned when the rings are closer together than a line of text. */
const ringLabels = computed(() => {
  if (!props.showScale) return []
  const every = Math.max(1, Math.ceil(14 / (R.value / levels.value)))
  return rings.value
    .filter((r) => (levels.value - r.k - 1) % every === 0)
    .map((r) => ({ k: r.k, x: r2(cx.value + 4), y: r2(cy.value - r.r + RING_LABEL_DROP), text: fmtRing(r.value) }))
})

const dotsOnly = computed(() => variant.value === 'dots')
const markerR = computed(() => (dotsOnly.value ? 4.5 : 3))
const shapes = computed(() =>
  series.value.map((s, si) => {
    const pts = s.data.map((v, i) => {
      const f = v === null ? 0 : radarFraction(v, scale.value)
      const d = dirs.value[i]!
      return { x: r2(cx.value + d.dx * R.value * f), y: r2(cy.value + d.dy * R.value * f), v, f, i }
    })
    const marker = seriesMarker(si)
    return {
      si,
      name: s.name,
      tone: toneClasses[s.tone],
      dash: DASHES[si % DASHES.length]!,
      marker,
      d: dotsOnly.value ? '' : polygonPath(pts),
      dots: pts
        .filter((p) => p.v !== null)
        .map((p) => ({ ...p, path: marker === 'circle' ? '' : markerPath(marker, p.x, p.y, markerR.value), title: `${axes.value[p.i]}, ${s.name}: ${fmtTip(p.v!)}` })),
    }
  }),
)

const VALUE_LIMIT = 48
const valueLabels = computed(() => {
  if (!props.showValues || series.value.length * n.value > VALUE_LIMIT) return []
  const out: { key: string; x: number; y: number; anchor: 'start' | 'middle' | 'end'; text: string }[] = []
  // Axis names and ring values are already on the chart: values keep clear of them.
  const placed: LabelBox[] = [
    ...axisLabels.value.map((l) => textBox(l.x, l.y, labelTexts.value[l.i]!.width, l.lines.length * LINE, l.anchor)),
    ...ringLabels.value.map((l) => textBox(l.x - RING_BOX_PAD, l.y, estimateTextWidth(l.text, FONT) + 2 + 2 * RING_BOX_PAD, FONT + 2 * RING_BOX_PAD, 'start')),
  ]
  for (const sh of shapes.value) {
    for (const p of sh.dots) {
      const d = dirs.value[p.i]!
      const text = fmtRing(p.v!)
      const w = estimateTextWidth(text, FONT)
      // First just outside the point, then just inside it.
      const along = [10, -10].map((off) => ({ x: p.x + d.dx * off, y: p.y + d.dy * off, anchor: off > 0 ? labelAnchor(d.dx) : labelAnchor(-d.dx) }))
      // Last resort: beside the point, where ring labels (which sit right of the first axis) are not.
      const beside = [{ x: p.x - 6, y: p.y, anchor: 'end' as const }, { x: p.x + 6, y: p.y, anchor: 'start' as const }]
      const box = [...along, ...beside]
        .map((c) => ({ ...c, box: textBox(c.x, c.y, w, FONT, c.anchor) }))
        .find((c) => c.box.x0 >= 0 && c.box.x1 <= W.value && c.box.y0 >= 0 && c.box.y1 <= H.value && !placed.some((b) => overlaps(b, c.box)))
      if (!box) continue
      placed.push(box.box)
      out.push({ key: `${sh.si}-${p.i}`, x: r2(box.x), y: r2(box.y), anchor: box.anchor, text })
    }
  }
  return out
})

const summary = computed(() => {
  const ext = extent(allValues.value)!
  return `Radar chart: ${plural(n.value, 'axis', 'axes')}, ${plural(series.value.length, 'series', 'series')}, values from ${fmtTip(ext[0])} to ${fmtTip(ext[1])}, scale ${fmtTip(scale.value.min)} to ${fmtTip(scale.value.max)}`
})
const legendVisible = computed(() => (props.showLegend === 'auto' ? series.value.length > 1 : !!props.showLegend))
const legendItems = computed(() =>
  series.value.map((s, si) => ({
    name: s.name,
    shape: seriesMarker(si),
    fill: toneClasses[s.tone].fill,
    ...(dotsOnly.value ? {} : { stroke: toneClasses[s.tone].stroke, dash: DASHES[si % DASHES.length]! }),
  })),
)
const tableCaption = computed(() => `${explicitName.value || 'Radar chart'}: data`)
const imageName = computed(() => explicitName.value || summary.value)
const rootClass = computed(() => cn(radarChartVariants({ size: sizeKey.value }), props.class))
</script>

<template>
  <ChartPlaceholder v-if="loading" v-bind="rootAttrs" data-slot="radar-chart" kind="loading" :text="loadingText" :user-class="$props.class" />
  <ChartPlaceholder
    v-else-if="empty"
    v-bind="rootAttrs"
    data-slot="radar-chart"
    kind="empty"
    :text="emptyText"
    :name="explicitName"
    :labelledby="labelledby"
    :user-class="$props.class"
  />
  <figure v-else ref="rootEl" v-bind="rootAttrs" data-slot="radar-chart" :data-variant="variant" :data-shape="shape" :class="rootClass">
    <ChartCaption data-slot="radar-chart" :title="hasTitle ? title : undefined" :description="hasDescription ? description : undefined" :description-id="ids.description" />
    <svg
      data-slot="radar-chart-svg"
      role="img"
      :aria-label="imageName"
      :aria-labelledby="labelledby"
      :aria-describedby="describedby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <g data-slot="radar-chart-grid" fill="none" stroke-width="1" class="stroke-border">
        <template v-for="ring in rings" :key="ring.k">
          <circle v-if="shape === 'circle'" data-slot="radar-chart-ring" :cx="cx" :cy="cy" :r="ring.r" />
          <path v-else data-slot="radar-chart-ring" :d="ring.d" />
        </template>
        <line v-for="s in spokes" :key="s.i" data-slot="radar-chart-spoke" :x1="cx" :y1="cy" :x2="s.x" :y2="s.y" />
      </g>
      <g data-slot="radar-chart-axes" class="fill-foreground text-xs">
        <text
          v-for="l in axisLabels"
          :key="l.i"
          data-slot="radar-chart-axis"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        ><tspan
          v-for="(line, k) in l.lines"
          :key="k"
          :x="l.x"
          :y="r2(l.y + (k - (l.lines.length - 1) / 2) * LINE)"
        >{{ line }}</tspan><title v-if="l.full">{{ l.full }}</title></text>
      </g>
      <g
        v-if="ringLabels.length"
        data-slot="radar-chart-scale"
        class="fill-muted-foreground stroke-background text-xs tabular-nums"
        stroke-width="3"
        stroke-linejoin="round"
        paint-order="stroke"
      >
        <text v-for="l in ringLabels" :key="l.k" data-slot="radar-chart-ring-label" :x="l.x" :y="l.y" dominant-baseline="middle">{{ l.text }}</text>
      </g>
      <g v-for="sh in shapes" :key="sh.si" data-slot="radar-chart-series" :data-series="sh.si">
        <path
          v-if="sh.d && variant === 'area'"
          data-slot="radar-chart-area"
          :d="sh.d"
          stroke="none"
          :class="[sh.tone.fillSoft, 'forced-colors:fill-transparent']"
        />
        <path
          v-if="sh.d"
          data-slot="radar-chart-line"
          :d="sh.d"
          fill="none"
          stroke-width="2"
          stroke-linejoin="round"
          :stroke-dasharray="sh.dash || undefined"
          :class="[sh.tone.stroke, FORCED_STROKE]"
        />
        <template v-for="p in sh.dots" :key="p.i">
          <circle
            v-if="sh.marker === 'circle'"
            data-slot="radar-chart-dot"
            :cx="p.x" :cy="p.y" :r="markerR"
            stroke-width="1.5"
            :class="[sh.tone.fill, 'stroke-background', FORCED_FILL, FORCED_CANVAS_STROKE]"
          ><title>{{ p.title }}</title></circle>
          <path
            v-else
            data-slot="radar-chart-dot"
            :data-marker="sh.marker"
            :d="p.path"
            stroke-width="1.5"
            stroke-linejoin="round"
            :class="[sh.tone.fill, 'stroke-background', FORCED_FILL, FORCED_CANVAS_STROKE]"
          ><title>{{ p.title }}</title></path>
        </template>
      </g>
      <g v-if="valueLabels.length" data-slot="radar-chart-values" class="fill-foreground text-xs tabular-nums">
        <text
          v-for="l in valueLabels"
          :key="l.key"
          data-slot="radar-chart-value"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        >{{ l.text }}</text>
      </g>
    </svg>
    <ChartMarkerLegend v-if="legendVisible" data-slot="radar-chart-legend" :items="legendItems" />
    <span :id="ids.summary" data-slot="radar-chart-summary" class="sr-only">{{ summary }}</span>
    <ChartDataTable category-header="Axis" :caption="tableCaption" :categories="axes" :series="series" :format="fmtTip" />
  </figure>
</template>
