<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { extent, formatCompact, formatNumber, niceTicks, r2 } from '../_chart/chartMath'
import { barFill, dimension, estimateTextWidth, labelStep, oneOf, plural, scaleSafe, truncateLabel } from '../_chart/chartKit'
import { wrapLabel } from '../_chart/chartText'
import { toneClasses, type ChartTone } from '../_chart/tones'
import { FORCED_FILL, FORCED_STROKE, useChartFrame } from '../_chart/chartFrame'
import ChartCaption from '../_chart/ChartCaption.vue'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartPlaceholder from '../_chart/ChartPlaceholder.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { KIND_LABEL, WATERFALL_TYPES, barWord, computeBars, signed, type WaterfallItemInput, type WaterfallKind } from './waterfallMath'
import {
  WATERFALL_GAPS, WATERFALL_ORIENTATIONS, WATERFALL_ROW_HEIGHT, WATERFALL_SIZES, WATERFALL_VARIANTS, waterfallChartVariants,
  type WaterfallChartGap, type WaterfallChartOrientation, type WaterfallChartSize, type WaterfallChartVariant,
} from './variants'
import { CHART_HEIGHTS } from '../_chart/chartKit'

export type { WaterfallItemInput } from './waterfallMath'

export interface WaterfallChartProps extends BaseProps {
  /** Bars in order: `{ label, value?, type? }`. The first item is the start by default, the others are changes; `subtotal` and `total` show the running total. */
  items: WaterfallItemInput[]
  /** `bars` floats a bar between the old and the new level, `steps` draws a staircase of the running total, `lollipop` a stem with a head at the new level. */
  variant?: WaterfallChartVariant
  /** `vertical` puts the bars side by side, `horizontal` stacks them as rows. */
  orientation?: WaterfallChartOrientation
  /** Draw a thin line from the end of one bar to the start of the next, at the running total. */
  connectors?: boolean
  /** Chart height when `height` is not set: 160 / 240 / 320 when vertical, the height of a row (24 / 32 / 40) when horizontal. */
  size?: WaterfallChartSize
  /** Space between bars: `sm` is wide bars, `lg` is narrow bars. */
  gap?: WaterfallChartGap
  /** Print the change (`+12`, `−5`) or the total at the end of each bar. Labels that do not fit are left out. */
  showValues?: boolean
  showGrid?: boolean
  showAxis?: boolean
  /** `'auto'` shows the legend when the chart has more than one kind of bar. */
  showLegend?: boolean | 'auto'
  /** Tone of increases. Decreases are marked as well by a hatch (bars), a dashed line (steps) or a hollow head (lollipop), and by the minus sign. */
  positiveTone?: ChartTone
  /** Tone of decreases. */
  negativeTone?: ChartTone
  /** Tone of the start, subtotal and total bars. */
  totalTone?: ChartTone
  /** Formats axis ticks, values and tooltips. Defaults to compact (axis) / grouped (tooltip) numbers. */
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

const props = withDefaults(defineProps<WaterfallChartProps>(), {
  variant: 'bars',
  orientation: 'vertical',
  connectors: true,
  size: 'md',
  gap: 'md',
  showValues: false,
  showGrid: true,
  showAxis: true,
  showLegend: 'auto',
  positiveTone: 'success',
  negativeTone: 'danger',
  totalTone: 'primary',
  emptyText: 'No data',
  loading: false,
  loadingText: 'Loading chart',
  width: 480,
})

defineOptions({ inheritAttrs: false })

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
function checkItems() {
  if (!Array.isArray(props.items)) {
    violation('WaterfallChart', 'requires-items', 'requires `items`, an array of `{ label, value }` objects, e.g. `[{ label: "Opening", value: 120 }, { label: "Sales", value: 30 }]`. An empty array shows the empty state.')
    return
  }
  props.items.forEach((it: unknown, i: number) => {
    if (!isRecord(it) || typeof it.label !== 'string' || !it.label.trim()) {
      violation('WaterfallChart', 'item-shape', `item ${i + 1} needs a \`label\`: \`{ label: "Sales", value: 30 }\`.`)
      return
    }
    if (it.type !== undefined && !WATERFALL_TYPES.includes(it.type as never)) {
      violation('WaterfallChart', 'item-type', `item ${i + 1} has the unknown type "${String(it.type)}"; use start, delta, subtotal or total.`)
      return
    }
    const type = it.type ?? (i === 0 ? 'start' : 'delta')
    if ((type === 'start' || type === 'delta') && typeof it.value !== 'number') {
      violation('WaterfallChart', 'item-value', `item ${i + 1} ("${it.label}") needs a numeric \`value\`; only \`subtotal\` and \`total\` items may leave it out.`)
    }
  })
}
const { explicitName, labelledby, rootAttrs, ids, hasTitle, hasDescription, describedby } = useChartFrame('WaterfallChart', props, checkItems, [() => props.items])

const FONT = 12
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const sizeKey = computed(() => oneOf<WaterfallChartSize>(props.size, WATERFALL_SIZES, 'md'))
const variant = computed(() => oneOf<WaterfallChartVariant>(props.variant, WATERFALL_VARIANTS, 'bars'))
const orientation = computed(() => oneOf<WaterfallChartOrientation>(props.orientation, WATERFALL_ORIENTATIONS, 'vertical'))
const gapKey = computed(() => oneOf<WaterfallChartGap>(props.gap, WATERFALL_GAPS, 'md'))
const horizontal = computed(() => orientation.value === 'horizontal')
const tone = (t: ChartTone | undefined, fallback: ChartTone) => toneClasses[t && t in toneClasses ? t : fallback]
const tones = computed<Record<WaterfallKind, (typeof toneClasses)[ChartTone]>>(() => ({
  increase: tone(props.positiveTone, 'success'),
  decrease: tone(props.negativeTone, 'danger'),
  total: tone(props.totalTone, 'primary'),
}))

const bars = computed(() => computeBars(props.items))
const empty = computed(() => bars.value.length === 0)
const fmtTip = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const fmtAxis = (n: number) => (props.valueFormatter ?? formatCompact)(n)
const MAX_HORIZONTAL = 960
const H = computed(() => {
  const explicit = dimension(props.height, 0)
  if (explicit > 0) return explicit
  if (!horizontal.value) return CHART_HEIGHTS[sizeKey.value]
  return Math.min(MAX_HORIZONTAL, 28 + bars.value.length * WATERFALL_ROW_HEIGHT[sizeKey.value])
})

const ticks = computed(() => {
  const ext = extent(bars.value.flatMap((b) => [b.from, b.to]))
  return niceTicks(Math.min(0, ext ? ext[0] : 0), Math.max(0, ext ? ext[1] : 0), horizontal.value ? 5 : 6)
})

const MAX_CAT_CHARS = 14
const ROTATE_DEG = 45
const ROTATE_SIN = Math.sin((ROTATE_DEG * Math.PI) / 180)
const LINE = 14
/** Horizontal extent of the plot; it does not depend on the height, so the category labels can be wrapped from it. */
const extentX = computed(() => {
  const w = W.value
  const axis = props.showAxis
  let left = 4
  if (axis) {
    left = horizontal.value
      ? Math.min(Math.max(0, ...bars.value.map((b) => estimateTextWidth(truncateLabel(b.label, MAX_CAT_CHARS), FONT))), w * 0.4) + 8
      : Math.max(...ticks.value.map((t) => estimateTextWidth(fmtAxis(t), FONT))) + 8
  }
  // The last tick label of a horizontal chart is centred on the end of the plot, so it needs half its width there.
  const right = axis ? (horizontal.value ? Math.max(8, estimateTextWidth(fmtAxis(ticks.value[ticks.value.length - 1]!), FONT) / 2 + 2) : 8) : 4
  const x0 = Math.min(left, w * 0.6)
  return { x0, x1: Math.max(x0 + 1, w - right) }
})

/** Category labels: wrapped onto two lines when the bars are narrow (vertical), turned 45 degrees when even a single word is wider than its bar, thinned only when the turned labels would still touch. */
const catWrap = computed(() => {
  const labels = bars.value.map((b) => b.label)
  if (horizontal.value) return { step: labelStep((H.value - 28) / Math.max(1, labels.length), FONT + 2), lines: labels.map((l) => [truncateLabel(l, MAX_CAT_CHARS)]), labels, rotated: false, rotatedPx: 0 }
  const slot = (extentX.value.x1 - extentX.value.x0) / Math.max(1, labels.length)
  const longestWord = Math.max(0, ...labels.map((l) => Math.max(0, ...l.trim().split(/\s+/).map((w) => estimateTextWidth(truncateLabel(w, MAX_CAT_CHARS), FONT)))))
  if (props.showAxis && longestWord > slot - 2) {
    const full = labels.map((l) => truncateLabel(l.trim(), MAX_CAT_CHARS))
    const widest = Math.max(0, ...full.map((l) => estimateTextWidth(l, FONT)))
    return { step: labelStep(slot, FONT + 4), lines: full.map((l) => [l]), labels, rotated: true, rotatedPx: Math.ceil(widest * ROTATE_SIN) }
  }
  const step = slot >= 30 ? 1 : labelStep(slot, 30)
  const maxChars = Math.max(3, Math.floor((slot * step) / (FONT * 0.58)))
  return { step, lines: labels.map((l) => wrapLabel(l, maxChars)), labels, rotated: false, rotatedPx: 0 }
})
const catRows = computed(() => (props.showAxis && !horizontal.value ? Math.max(1, ...catWrap.value.lines.filter((_, i) => i % catWrap.value.step === 0).map((l) => l.length)) : 1))

const layout = computed(() => {
  const axis = props.showAxis
  const bottom = axis ? (horizontal.value ? 20 : catWrap.value.rotated ? 14 + catWrap.value.rotatedPx : 8 + LINE * catRows.value) : 4
  return { x0: extentX.value.x0, x1: extentX.value.x1, y0: axis ? 8 : 4, y1: Math.max(9, H.value - bottom) }
})

/** Which ends of the value axis carry a value label, and how much room they need. */
const valueText = (b: (typeof bars.value)[number]) => (b.missing ? 'n/a' : b.type === 'delta' ? signed(b.delta!, fmtAxis) : fmtAxis(b.to))
const sidesUp = (b: (typeof bars.value)[number]) => (b.type === 'delta' ? b.to >= b.from : b.to >= 0)
const valuePad = computed(() => {
  if (!props.showValues) return { lo: 0, hi: 0 }
  const room = horizontal.value ? Math.max(...bars.value.map((b) => estimateTextWidth(valueText(b), FONT))) + 8 : 16
  return { lo: bars.value.some((b) => !sidesUp(b)) ? room : 0, hi: bars.value.some(sidesUp) ? room : 0 }
})
const sc = computed(() => {
  const t = ticks.value
  const { x0, x1, y0, y1 } = layout.value
  const { lo, hi } = valuePad.value
  return horizontal.value ? scaleSafe(t[0]!, t[t.length - 1]!, x0 + lo, x1 - hi) : scaleSafe(t[0]!, t[t.length - 1]!, y1 - lo, y0 + hi)
})
const band = computed(() => {
  const { x0, x1, y0, y1 } = layout.value
  return (horizontal.value ? y1 - y0 : x1 - x0) / Math.max(1, bars.value.length)
})

/** (category position, value) to pixels. */
const pt = (c: number, v: number): [number, number] => (horizontal.value ? [r2(sc.value(v)), r2(c)] : [r2(c), r2(sc.value(v))])

interface Drawn {
  index: number
  kind: WaterfallKind
  type: string
  missing: boolean
  title: string
  /** Edges of the mark along the category axis. */
  c0: number
  c1: number
  cm: number
  rect: { x: number; y: number; w: number; h: number }
  tread: string
  riser: string
  stem: string
  head: { x: number; y: number }
}

const drawn = computed<Drawn[]>(() => {
  const catStart = horizontal.value ? layout.value.y0 : layout.value.x0
  const barW = band.value * barFill(gapKey.value)
  return bars.value.map((b) => {
    const c0 = catStart + b.index * band.value + (band.value - barW) / 2
    const c1 = c0 + barW
    const cm = (c0 + c1) / 2
    const a = sc.value(b.from)
    const z = sc.value(b.to)
    const lo = Math.min(a, z)
    const len = Math.max(Math.abs(z - a), 1)
    const rect = horizontal.value ? { x: r2(lo), y: r2(c0), w: r2(len), h: r2(barW) } : { x: r2(c0), y: r2(lo), w: r2(barW), h: r2(len) }
    const [t0x, t0y] = pt(c0, b.to)
    const [t1x, t1y] = pt(c1, b.to)
    const [r0x, r0y] = pt(c0, b.from)
    const [hx, hy] = pt(cm, b.to)
    const [s0x, s0y] = pt(cm, b.from)
    const word = barWord(b)
    const what = b.missing ? 'n/a' : b.type === 'delta' ? signed(b.delta!, fmtTip) : fmtTip(b.to)
    return {
      index: b.index, kind: b.kind, type: b.type, missing: b.missing,
      title: `${b.label}, ${word}: ${what}${b.type === 'delta' ? ` (total ${fmtTip(b.to)})` : ''}`,
      c0, c1, cm, rect,
      tread: `M${t0x},${t0y} L${t1x},${t1y}`,
      riser: `M${r0x},${r0y} L${t0x},${t0y}`,
      stem: `M${s0x},${s0y} L${hx},${hy}`,
      head: { x: hx, y: hy },
    }
  })
})
const headR = computed(() => Math.max(3.5, Math.min(6, band.value * 0.25)))

/** Connectors: from the end of a mark to the start of the next one, at the running total after the first. */
const connectors = computed(() => {
  if (!props.connectors) return []
  const out: { i: number; d: string; level: number }[] = []
  for (let i = 0; i < drawn.value.length - 1; i++) {
    const a = drawn.value[i]!
    const b = drawn.value[i + 1]!
    const level = bars.value[i]!.to
    const e0 = variant.value === 'lollipop' ? a.cm + headR.value : a.c1
    const e1 = variant.value === 'lollipop' ? b.cm - headR.value : b.c0
    if (!(e1 > e0)) continue
    const [x0, y0] = pt(e0, level)
    const [x1, y1] = pt(e1, level)
    out.push({ i, d: `M${x0},${y0} L${x1},${y1}`, level })
  }
  return out
})

const gridLines = computed(() => {
  const { x0, x1, y0, y1 } = layout.value
  return ticks.value.map((t) => {
    const p = r2(sc.value(t))
    return horizontal.value
      ? { t, line: { x1: p, x2: p, y1: y0, y2: y1 }, text: { x: p, y: r2(y1 + 14), anchor: 'middle' }, label: fmtAxis(t) }
      : { t, line: { x1: x0, x2: x1, y1: p, y2: p }, text: { x: r2(x0 - 6), y: p, anchor: 'end' }, label: fmtAxis(t) }
  })
})
const zero = computed(() => {
  const { x0, x1, y0, y1 } = layout.value
  const p = r2(sc.value(0))
  return horizontal.value ? { x1: p, x2: p, y1: y0, y2: y1 } : { x1: x0, x2: x1, y1: p, y2: p }
})

const catLabels = computed(() => {
  const { x0, y0, y1 } = layout.value
  const { step, lines, labels, rotated } = catWrap.value
  const out: { i: number; x: number; y: number; anchor: string; rotate: string | undefined; lines: { text: string; y: number }[]; full: string | null }[] = []
  for (let i = 0; i < labels.length; i += step) {
    const mid = (horizontal.value ? y0 : x0) + (i + 0.5) * band.value
    const own = lines[i]!
    const x = r2(horizontal.value ? x0 - 6 : rotated ? mid + 4 : mid)
    const y = horizontal.value ? mid : y1 + (rotated ? 10 : 14)
    out.push({
      i, x, y: r2(y), anchor: horizontal.value || rotated ? 'end' : 'middle',
      rotate: rotated ? `rotate(-${ROTATE_DEG} ${r2(x)} ${r2(y)})` : undefined,
      lines: own.map((text, k) => ({ text, y: r2(y + k * LINE) })),
      full: own.join(' ') === labels[i]!.trim() ? null : labels[i]!,
    })
  }
  return out
})

const valueLabels = computed(() => {
  if (!props.showValues) return []
  const out: { i: number; x: number; y: number; anchor: string; text: string }[] = []
  for (const b of bars.value) {
    const text = valueText(b)
    if (horizontal.value ? band.value < FONT : estimateTextWidth(text, FONT) > band.value) continue
    const d = drawn.value[b.index]!
    const up = sidesUp(b)
    const level = up ? Math.max(b.from, b.to) : Math.min(b.from, b.to)
    const p = sc.value(level)
    out.push(
      horizontal.value
        ? { i: b.index, x: r2(p + (up ? 4 : -4)), y: r2(d.cm), anchor: up ? 'start' : 'end', text }
        : { i: b.index, x: r2(d.cm), y: r2(p + (up ? -8 : 10)), anchor: 'middle', text },
    )
  }
  return out
})

const counts = computed(() => ({
  increase: bars.value.filter((b) => b.kind === 'increase' && b.type === 'delta').length,
  decrease: bars.value.filter((b) => b.kind === 'decrease').length,
  total: bars.value.filter((b) => b.kind === 'total').length,
}))
const summary = computed(() => {
  const list = bars.value
  const first = list[0]!
  const last = list[list.length - 1]!
  const c = counts.value
  const kinds = [c.increase ? plural(c.increase, 'increase') : '', c.decrease ? plural(c.decrease, 'decrease') : ''].filter(Boolean).join(', ')
  return `Waterfall chart: ${plural(list.length, 'bar')}, from ${fmtTip(first.type === 'delta' ? first.from : first.to)} to ${fmtTip(last.to)}${kinds ? `, ${kinds}` : ''}`
})
const legendItems = computed(() => {
  const c = counts.value
  const out: { kind: WaterfallKind; name: string }[] = []
  if (c.increase) out.push({ kind: 'increase', name: KIND_LABEL.increase })
  if (c.decrease) out.push({ kind: 'decrease', name: KIND_LABEL.decrease })
  if (c.total) out.push({ kind: 'total', name: KIND_LABEL.total })
  return out
})
const legendVisible = computed(() => (props.showLegend === 'auto' ? legendItems.value.length > 1 : !!props.showLegend))

const table = computed(() => ({
  categories: bars.value.map((b) => `${b.label} (${barWord(b)})`),
  series: [
    { name: 'Change', data: bars.value.map((b) => b.delta) },
    { name: 'Running total', data: bars.value.map((b) => (b.missing ? null : b.to)) },
  ],
  formats: [(n: number) => signed(n, fmtTip), fmtTip],
}))
const tableCaption = computed(() => `${explicitName.value || 'Waterfall chart'}: data`)
const imageName = computed(() => explicitName.value || summary.value)
const rootClass = computed(() => cn(waterfallChartVariants({ size: sizeKey.value }), props.class))
const patternFill = computed(() => `url(#${ids.pattern})`)
</script>

<template>
  <ChartPlaceholder v-if="loading" v-bind="rootAttrs" data-slot="waterfall-chart" kind="loading" :text="loadingText" :user-class="$props.class" />
  <ChartPlaceholder
    v-else-if="empty"
    v-bind="rootAttrs"
    data-slot="waterfall-chart"
    kind="empty"
    :text="emptyText"
    :name="explicitName"
    :labelledby="labelledby"
    :user-class="$props.class"
  />
  <figure
    v-else
    ref="rootEl"
    v-bind="rootAttrs"
    data-slot="waterfall-chart"
    :data-variant="variant"
    :data-orientation="orientation"
    :class="rootClass"
  >
    <ChartCaption data-slot="waterfall-chart" :title="hasTitle ? title : undefined" :description="hasDescription ? description : undefined" :description-id="ids.description" />
    <svg
      data-slot="waterfall-chart-svg"
      role="img"
      :aria-label="imageName"
      :aria-labelledby="labelledby"
      :aria-describedby="describedby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <defs v-if="variant === 'bars' && counts.decrease">
        <pattern :id="ids.pattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" :class="tones.decrease.fillSoft" />
          <line x1="0" y1="0" x2="0" y2="6" stroke-width="3" :class="[tones.decrease.stroke, FORCED_STROKE]" />
        </pattern>
      </defs>
      <g v-if="showGrid" data-slot="waterfall-chart-grid">
        <line
          v-for="g in gridLines"
          :key="g.t"
          :x1="g.line.x1" :x2="g.line.x2" :y1="g.line.y1" :y2="g.line.y2"
          class="stroke-border"
          stroke-width="1"
        />
      </g>
      <g v-if="showAxis" data-slot="waterfall-chart-axis" class="fill-muted-foreground text-xs tabular-nums">
        <text
          v-for="g in gridLines"
          :key="g.t"
          data-slot="waterfall-chart-tick"
          :x="g.text.x" :y="g.text.y" :text-anchor="g.text.anchor" dominant-baseline="middle"
        >{{ g.label }}</text>
        <text
          v-for="l in catLabels"
          :key="`c${l.i}`"
          data-slot="waterfall-chart-category"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle" :transform="l.rotate"
        ><tspan v-for="(line, k) in l.lines" :key="k" :x="l.x" :y="line.y">{{ line.text }}</tspan><title v-if="l.full">{{ l.full }}</title></text>
      </g>
      <g v-if="connectors.length" data-slot="waterfall-chart-connectors" class="stroke-muted-foreground" stroke-width="1" stroke-dasharray="2 2" fill="none">
        <path v-for="c in connectors" :key="c.i" data-slot="waterfall-chart-connector" :d="c.d" />
      </g>
      <g data-slot="waterfall-chart-marks">
        <template v-for="d in drawn" :key="d.index">
          <template v-if="variant === 'bars'">
            <rect
              v-if="d.kind === 'decrease'"
              data-slot="waterfall-chart-bar"
              :data-index="d.index" :data-kind="d.kind" :data-type="d.type"
              :x="d.rect.x" :y="d.rect.y" :width="d.rect.w" :height="d.rect.h"
              :fill="patternFill"
              stroke-width="1.5"
              :class="[tones.decrease.stroke, FORCED_STROKE]"
            ><title>{{ d.title }}</title></rect>
            <rect
              v-else
              data-slot="waterfall-chart-bar"
              :data-index="d.index" :data-kind="d.kind" :data-type="d.type"
              :x="d.rect.x" :y="d.rect.y" :width="d.rect.w" :height="d.rect.h"
              :class="[tones[d.kind].fill, FORCED_FILL]"
            ><title>{{ d.title }}</title></rect>
          </template>
          <g v-else-if="variant === 'steps'" data-slot="waterfall-chart-step" :data-index="d.index" :data-kind="d.kind" :data-type="d.type" fill="none" :class="[tones[d.kind].stroke, FORCED_STROKE]">
            <path data-slot="waterfall-chart-riser" :d="d.riser" stroke-width="1.5" :stroke-dasharray="d.kind === 'decrease' ? '4 3' : undefined" />
            <path data-slot="waterfall-chart-tread" :d="d.tread" stroke-width="4" :stroke-dasharray="d.kind === 'decrease' ? '6 3' : undefined"><title>{{ d.title }}</title></path>
          </g>
          <g v-else data-slot="waterfall-chart-lollipop" :data-index="d.index" :data-kind="d.kind" :data-type="d.type">
            <path data-slot="waterfall-chart-stem" :d="d.stem" fill="none" stroke-width="2" :class="[tones[d.kind].stroke, FORCED_STROKE]" />
            <circle
              v-if="d.kind === 'increase'"
              data-slot="waterfall-chart-head"
              :cx="d.head.x" :cy="d.head.y" :r="headR"
              :class="[tones.increase.fill, FORCED_FILL]"
            ><title>{{ d.title }}</title></circle>
            <circle
              v-else-if="d.kind === 'decrease'"
              data-slot="waterfall-chart-head"
              :cx="d.head.x" :cy="d.head.y" :r="headR - 1"
              stroke-width="2.5"
              :class="['fill-background', tones.decrease.stroke, FORCED_STROKE]"
            ><title>{{ d.title }}</title></circle>
            <rect
              v-else
              data-slot="waterfall-chart-head"
              :x="d.head.x - headR" :y="d.head.y - headR" :width="headR * 2" :height="headR * 2"
              :class="[tones.total.fill, FORCED_FILL]"
            ><title>{{ d.title }}</title></rect>
          </g>
        </template>
      </g>
      <g v-if="valueLabels.length" data-slot="waterfall-chart-values" class="fill-foreground text-xs tabular-nums">
        <text
          v-for="l in valueLabels"
          :key="l.i"
          data-slot="waterfall-chart-value"
          :x="l.x" :y="l.y" :text-anchor="l.anchor" dominant-baseline="middle"
        >{{ l.text }}</text>
      </g>
      <line
        v-if="showAxis"
        data-slot="waterfall-chart-baseline"
        :x1="zero.x1" :x2="zero.x2" :y1="zero.y1" :y2="zero.y2"
        class="stroke-muted-foreground"
        stroke-width="1"
      />
    </svg>
    <ul v-if="legendVisible" data-slot="waterfall-chart-legend" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li v-for="item in legendItems" :key="item.kind" data-slot="waterfall-chart-legend-item" :data-kind="item.kind" class="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 12 12" class="size-3 shrink-0 overflow-hidden" aria-hidden="true" focusable="false">
          <template v-if="variant === 'bars'">
            <template v-if="item.kind === 'decrease'">
              <rect x="0.75" y="0.75" width="10.5" height="10.5" stroke-width="1.5" :class="[tones.decrease.fillSoft, tones.decrease.stroke, FORCED_STROKE]" />
              <path d="M0 12 L12 0 M0 6 L6 0 M6 12 L12 6" stroke-width="1.5" fill="none" :class="[tones.decrease.stroke, FORCED_STROKE]" />
            </template>
            <rect v-else x="0" y="0" width="12" height="12" :class="[tones[item.kind].fill, FORCED_FILL]" />
          </template>
          <template v-else-if="variant === 'steps'">
            <line x1="0" x2="12" y1="6" y2="6" :stroke-width="item.kind === 'total' ? 4 : 3" :stroke-dasharray="item.kind === 'decrease' ? '4 2' : undefined" :class="[tones[item.kind].stroke, FORCED_STROKE]" />
          </template>
          <template v-else>
            <circle v-if="item.kind === 'increase'" cx="6" cy="6" r="4.5" :class="[tones.increase.fill, FORCED_FILL]" />
            <circle v-else-if="item.kind === 'decrease'" cx="6" cy="6" r="3.5" stroke-width="2.5" :class="['fill-background', tones.decrease.stroke, FORCED_STROKE]" />
            <rect v-else x="1.5" y="1.5" width="9" height="9" :class="[tones.total.fill, FORCED_FILL]" />
          </template>
        </svg>
        <span>{{ item.name }}</span>
      </li>
    </ul>
    <span :id="ids.summary" data-slot="waterfall-chart-summary" class="sr-only">{{ summary }}</span>
    <ChartDataTable category-header="Bar" :caption="tableCaption" :categories="table.categories" :series="table.series" :format="fmtTip" :formats="table.formats" />
  </figure>
</template>
