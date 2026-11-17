<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { clamp, formatCompact, formatNumber, isFiniteNumber, r2 } from '../_chart/chartMath'
import { dimension, estimateTextWidth, markerPath, oneOf, plural, scaleSafe, truncateLabel } from '../_chart/chartKit'
import { toneClasses, type ChartTone } from '../_chart/tones'
import { useChartContract } from '../_chart/chartContract'
import ChartLegend from '../_chart/ChartLegend.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { hasText } from '../_shared/contract'
import { BULLET_METRICS, BULLET_SIZES, BULLET_VARIANTS, bulletChartVariants, type BulletChartSize, type BulletChartVariant } from './variants'
import { MAX_BULLETS, TRACK_FILL, bandFill, bandHatch, bulletDomain, normalizeBullets, type Bullet, type BulletDomain, type BulletInput } from './bulletData'

export interface BulletChartProps extends BaseProps {
  /** One entry per measure: `{ label, value, target?, ranges?, max?, tone?, unit? }`. Several bullets stack. */
  bullets: BulletInput[]
  /** `horizontal` stacks the measures as rows, `vertical` places them side by side as columns. */
  variant?: BulletChartVariant
  /** Thickness of the bands and spacing: `sm`, `md` or `lg`. */
  size?: BulletChartSize
  /** Colour token of the measure bar when a bullet has no `tone` of its own. */
  tone?: ChartTone
  /** Draw the target marker (a tick with a diamond cap). */
  showTarget?: boolean
  /** Print the value next to each measure. */
  showValues?: boolean
  /** Draw the scale (ticks and grid). Only with `sharedScale`; separate scales have no common axis. */
  showAxis?: boolean
  /** Print the upper bound of each range band next to the band. */
  showRangeLabels?: boolean
  /** Show a legend for the measure, the target and the ranges. */
  showLegend?: boolean
  /** All measures share one scale (comparable lengths). Off: each measure fills its own scale. */
  sharedScale?: boolean
  /** Formats axis ticks, values and range labels. Defaults to compact (axis) and grouped (values) numbers. */
  valueFormatter?: (n: number) => string
  /** Accessible name. Required unless `title`, `aria-label` or `aria-labelledby` is given. */
  label?: string
  /** Visible heading text above the chart (also the accessible name when `label` is not set). */
  title?: string
  /** Visible supporting text under the title. */
  description?: string
  /** Shown when there are no valid measures. */
  emptyText?: string
  /** ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px). */
  width?: number
  /** Total viewBox height. Without it the height follows `size` and the number of measures. */
  height?: number
}

const props = withDefaults(defineProps<BulletChartProps>(), {
  variant: 'horizontal',
  size: 'md',
  tone: 'chart-1',
  showTarget: true,
  showValues: true,
  showAxis: true,
  showRangeLabels: false,
  showLegend: false,
  sharedScale: true,
  emptyText: 'No data',
  width: 480,
})

defineOptions({ inheritAttrs: false })

const checkBullets = () => {
  if (!Array.isArray(props.bullets)) {
    violation('BulletChart', 'requires-bullets', 'requires `bullets`, an array of `{ label, value, target?, ranges? }` objects. An empty array shows the empty state.')
    return
  }
  props.bullets.forEach((b: unknown, i: number) => {
    if (typeof b !== 'object' || b === null || Array.isArray(b) || !hasText((b as { label?: unknown }).label)) {
      violation('BulletChart', 'bullet-label', `measure ${i + 1} needs a \`label\` text, e.g. \`{ label: "Orders shipped", value: 70 }\`. The table alternative names every measure.`)
    }
  })
}
const nameSource = {
  get label() {
    return props.label || props.title
  },
}
const { explicitName, labelledby, rootAttrs } = useChartContract('BulletChart', nameSource, checkBullets, [() => props.bullets])

const FONT = 12
const patternId = useId()
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W0 = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))

const sizeKey = computed(() => oneOf<BulletChartSize>(props.size, BULLET_SIZES, 'md'))
const variantKey = computed(() => oneOf<BulletChartVariant>(props.variant, BULLET_VARIANTS, 'horizontal'))
const vertical = computed(() => variantKey.value === 'vertical')
const metrics = computed(() => BULLET_METRICS[sizeKey.value])
const fallbackTone = computed<ChartTone>(() => (props.tone && props.tone in toneClasses ? props.tone : 'chart-1'))

const all = computed(() => normalizeBullets(props.bullets))
const bullets = computed(() => all.value.slice(0, MAX_BULLETS))
const empty = computed(() => bullets.value.length === 0)
const axisOn = computed(() => props.showAxis && props.sharedScale)

const fmtAxis = (n: number) => (props.valueFormatter ?? formatCompact)(n)
const fmtValue = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const withUnit = (n: number | null, unit: string) => (n === null ? 'n/a' : `${fmtValue(n)}${unit ? ` ${unit}` : ''}`)

interface RangeBand {
  key: string
  slot: string
  index: number
  x: number
  y: number
  w: number
  h: number
  cls: string
  hatch: 'dense' | 'sparse' | null
  title: string
}
interface RangeText { key: string; x: number; y: number; anchor: string; text: string }
interface Row {
  index: number
  label: string
  full: string | null
  labelPos: { x: number; y: number; anchor: string }
  bands: RangeBand[]
  rangeTexts: RangeText[]
  measure: { x: number; y: number; w: number; h: number; cls: string; title: string } | null
  overflow: string | null
  target: { x1: number; x2: number; y1: number; y2: number; cap: string; title: string } | null
  value: { x: number; y: number; anchor: string; text: string } | null
}

const geometry = computed(() => {
  const list = bullets.value
  const n = list.length
  const m = metrics.value
  const horiz = !vertical.value
  const shared = bulletDomain(list)
  const domainOf = (b: Bullet): BulletDomain => (props.sharedScale ? shared : bulletDomain([b]))
  const tag = (b: Bullet) => withUnit(b.value, b.unit)
  const valueTexts = list.map(tag)
  const extra = props.showRangeLabels ? 1 : 0
  const gapMain = (m.pitch - m.band) + extra * 14
  const W = W0.value

  // Dimensions that depend on the variant.
  let band = horiz ? m.band : Math.round(m.band * 1.1)
  let pitch = 0
  let top = 0
  let left = 0
  let right = 0
  let rowsEnd = 0
  let H = 0
  let contentW = W
  let axisGap = 0
  const labelMax = 18
  if (horiz) {
    const labelW = Math.min(Math.max(0, ...list.map((b) => estimateTextWidth(truncateLabel(b.label, labelMax), FONT))), W * 0.35) + 8
    const valueW = props.showValues ? Math.min(Math.max(0, ...valueTexts.map((t) => estimateTextWidth(t, FONT))), W * 0.3) + 16 : 0
    left = Math.round(labelW)
    right = Math.round(Math.max(valueW, axisOn.value ? 20 : 14))
    top = props.showTarget ? 8 : 3
    // Range labels sit just under the last band, so the axis labels drop one text line below them.
    axisGap = axisOn.value && extra ? 14 : 0
    const axisH = (axisOn.value ? 22 : 4) + axisGap
    pitch = m.pitch + extra * 14
    rowsEnd = top + n * pitch - (pitch - band)
    if (isFiniteNumber(props.height) && props.height > 0) {
      // A fixed height: thicker bands (up to twice the size) and rows spread over the room.
      const avail = props.height - top - axisH
      band = Math.max(6, Math.min(m.band * 2, (avail + gapMain) / n - gapMain))
      pitch = n > 1 ? Math.max(band + 2, (avail - band) / (n - 1)) : band + gapMain
      rowsEnd = top + (n - 1) * pitch + band
    }
    H = Math.round(rowsEnd + axisH)
  } else {
    const tickW = axisOn.value ? Math.max(...shared.ticks.map((t) => estimateTextWidth(fmtAxis(t), FONT))) + 12 : 4
    left = Math.round(tickW)
    right = 14
    top = props.showValues ? 22 : props.showTarget ? 10 : 6
    const bottom = 22
    const plotH = isFiniteNumber(props.height) && props.height > 0 ? Math.max(40, props.height - top - bottom) : m.plot
    const colPref = m.col + (props.showRangeLabels ? 28 : 0)
    pitch = Math.max(28, Math.min(colPref, (W - left - right) / n))
    contentW = Math.max(W, Math.ceil(left + n * pitch + right))
    band = Math.max(8, Math.min(band, pitch - 10))
    rowsEnd = top + plotH
    H = rowsEnd + bottom
  }
  const plotStart = horiz ? left : top
  const plotEnd = horiz ? W - right : rowsEnd

  const rows: Row[] = list.map((b, i) => {
    const dom = domainOf(b)
    const sc = horiz ? scaleSafe(dom.lo, dom.hi, plotStart, plotEnd) : scaleSafe(dom.lo, dom.hi, plotEnd, plotStart)
    const at = (v: number) => sc(clamp(v, dom.lo, dom.hi))
    // Cross axis: where the band sits.
    const c0 = horiz ? top + i * pitch : left + (i + 0.5) * pitch - band / 2
    const cc = c0 + band / 2
    const box = (a: number, z: number, start: number, thick: number) => {
      const pa = at(a)
      const pz = at(z)
      const lo = Math.min(pa, pz)
      const len = Math.abs(pz - pa)
      return horiz ? { x: r2(lo), y: r2(start), w: r2(len), h: r2(thick) } : { x: r2(start), y: r2(lo), w: r2(thick), h: r2(len) }
    }
    // Range bands (or one neutral track when the measure has no ranges).
    const bands: RangeBand[] = []
    const rangeTexts: RangeText[] = []
    if (b.ranges.length === 0) {
      bands.push({ key: 'track', slot: 'bullet-chart-track', index: -1, ...box(dom.lo, dom.hi, c0, band), cls: TRACK_FILL, hatch: null, title: `${b.label}: scale from ${fmtValue(dom.lo)} to ${fmtValue(dom.hi)}` })
    } else {
      let prev = dom.lo
      let lastLabel = -Infinity
      b.ranges.forEach((r, k) => {
        const upper = clamp(r, dom.lo, dom.hi)
        if (upper <= prev) return
        bands.push({ key: `r${k}`, slot: 'bullet-chart-range', index: k, ...box(prev, upper, c0, band), cls: bandFill(k, b.ranges.length), hatch: bandHatch(k, b.ranges.length), title: `${b.label}: range ${k + 1} of ${b.ranges.length}, up to ${fmtValue(r)}` })
        if (props.showRangeLabels) {
          const text = fmtAxis(r)
          const p = at(r)
          const room = horiz ? estimateTextWidth(text, FONT) + 4 : 12
          if (Math.abs(p - lastLabel) >= room) {
            lastLabel = p
            rangeTexts.push(
              horiz
                ? { key: `t${k}`, x: r2(p), y: r2(c0 + band + 10), anchor: 'end', text }
                : { key: `t${k}`, x: r2(cc + band / 2 + 4), y: r2(p), anchor: 'start', text },
            )
          }
        }
        prev = upper
      })
    }
    const toneKey = b.tone ?? fallbackTone.value
    // Measure bar.
    const thick = Math.max(4, Math.round(band / 3))
    let measure: Row['measure'] = null
    let overflow: string | null = null
    if (b.value !== null) {
      const m0 = box(0, b.value, cc - thick / 2, thick)
      measure = { ...m0, cls: toneClasses[toneKey].fill, title: `${b.label}: ${tag(b)}` }
      if (b.value > dom.hi) {
        const p = r2(sc(dom.hi))
        overflow = horiz ? `M${p + 1},${r2(cc - 4)} L${p + 6},${r2(cc)} L${p + 1},${r2(cc + 4)} Z` : `M${r2(cc - 4)},${p - 1} L${r2(cc)},${p - 6} L${r2(cc + 4)},${p - 1} Z`
      }
    }
    // Target marker: a tick plus a diamond cap (a shape, not only a colour).
    let target: Row['target'] = null
    if (props.showTarget && b.target !== null) {
      const p = r2(at(b.target))
      const half = band * 0.4
      const capAt = cc - half - 3
      target = horiz
        ? { x1: p, x2: p, y1: r2(cc - half), y2: r2(cc + half), cap: markerPath('diamond', p, capAt, 3), title: `${b.label} target: ${fmtValue(b.target)}` }
        : { x1: r2(cc - half), x2: r2(cc + half), y1: p, y2: p, cap: markerPath('diamond', capAt, p, 3), title: `${b.label} target: ${fmtValue(b.target)}` }
    }
    // Text: measure name and value.
    const maxChars = horiz ? labelMax : Math.max(3, Math.floor((pitch - 4) / (FONT * 0.58)))
    const shortLabel = truncateLabel(b.label, maxChars)
    const labelPos = horiz ? { x: r2(left - 8), y: r2(cc), anchor: 'end' } : { x: r2(cc), y: r2(rowsEnd + 14), anchor: 'middle' }
    let value: Row['value'] = null
    if (props.showValues) {
      value = horiz
        ? { x: r2(plotEnd + 12), y: r2(cc), anchor: 'start', text: valueTexts[i]! }
        : { x: r2(cc), y: r2(top - 10), anchor: 'middle', text: truncateLabel(valueTexts[i]!, Math.max(3, Math.floor((pitch + 8) / (FONT * 0.58)))) }
    }
    return { index: i, label: shortLabel, full: shortLabel === b.label ? null : b.label, labelPos, bands, rangeTexts, measure, overflow, target, value }
  })

  // Axis: ticks of the shared scale.
  const ticks = axisOn.value
    ? shared.ticks.map((t) => {
        const sc = horiz ? scaleSafe(shared.lo, shared.hi, plotStart, plotEnd) : scaleSafe(shared.lo, shared.hi, plotEnd, plotStart)
        const p = r2(sc(clamp(t, shared.lo, shared.hi)))
        return horiz
          ? { key: t, line: { x1: p, x2: p, y1: top, y2: r2(rowsEnd) }, text: { x: p, y: r2(rowsEnd + 14 + axisGap), anchor: 'middle' }, label: fmtAxis(t) }
          : { key: t, line: { x1: left, x2: r2(left + n * pitch), y1: p, y2: p }, text: { x: r2(left - 6), y: p, anchor: 'end' }, label: fmtAxis(t) }
      })
    : []
  return { W: contentW, H: Math.round(H), rows, ticks, scroll: contentW > W, band }
})

const summary = computed(() => `Bullet chart: ${plural(bullets.value.length, 'measure')}`)
const name = computed(() => explicitName.value || summary.value)
const legendItems = computed(() => [
  { name: 'Measure', bg: toneClasses[bullets.value[0]?.tone ?? fallbackTone.value].bg },
  ...(props.showTarget && bullets.value.some((b) => b.target !== null) ? [{ name: 'Target', bg: 'bg-foreground', stroke: 'stroke-foreground', dash: '', marker: 'diamond' as const, fill: 'fill-foreground' }] : []),
  ...(bullets.value.some((b) => b.ranges.length > 0) ? [{ name: 'Ranges, darker is lower', bg: 'bg-muted-foreground/30' }] : []),
])
const messages = computed(() => {
  const out: string[] = []
  if (all.value.length > MAX_BULLETS) out.push(`Showing the first ${MAX_BULLETS} of ${all.value.length} measures.`)
  const bad = bullets.value.filter((b) => b.value === null).length
  if (bad > 0) out.push(`${plural(bad, 'measure')} without a valid value ${bad === 1 ? 'is' : 'are'} drawn without a bar.`)
  return out
})
const rangeText = (b: Bullet) => (b.ranges.length ? b.ranges.map((r) => `up to ${fmtValue(r)}`).join(', ') : 'none')
const rootClass = computed(() => bulletChartVariants({ size: sizeKey.value, variant: variantKey.value }))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="bullet-chart"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-24 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="bullet-chart-empty">{{ emptyText }}</span>
  </div>
  <div v-else ref="rootEl" v-bind="rootAttrs" data-slot="bullet-chart" :data-variant="variantKey" :data-size="sizeKey" :class="cn(rootClass, $props.class)">
    <div v-if="title || description" data-slot="bullet-chart-header" class="flex min-w-0 flex-col gap-0.5">
      <p v-if="title" data-slot="bullet-chart-title" class="text-sm font-medium text-foreground">{{ title }}</p>
      <p v-if="description" data-slot="bullet-chart-description" class="text-xs text-muted-foreground">{{ description }}</p>
    </div>
    <div
      data-slot="bullet-chart-scroll"
      :class="geometry.scroll ? ['overflow-x-auto', focusRing] : 'min-w-0'"
      :role="geometry.scroll ? 'region' : undefined"
      :tabindex="geometry.scroll ? 0 : undefined"
      :aria-label="geometry.scroll ? `${name}, scrollable` : undefined"
    >
      <svg
        data-slot="bullet-chart-svg"
        role="img"
        :aria-label="name"
        :aria-labelledby="labelledby"
        :viewBox="`0 0 ${geometry.W} ${geometry.H}`"
        :width="geometry.scroll ? geometry.W : undefined"
        :class="geometry.scroll ? 'h-auto max-w-none' : 'h-auto w-full'"
      >
        <defs>
          <pattern :id="`${patternId}-dense`" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke-width="1.5" class="stroke-muted-foreground/50" />
          </pattern>
          <pattern :id="`${patternId}-sparse`" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke-width="1.5" class="stroke-muted-foreground/50" />
          </pattern>
        </defs>
        <g v-if="geometry.ticks.length" data-slot="bullet-chart-grid">
          <line v-for="t in geometry.ticks" :key="t.key" :x1="t.line.x1" :x2="t.line.x2" :y1="t.line.y1" :y2="t.line.y2" class="stroke-border" stroke-width="1" />
        </g>
        <g v-for="row in geometry.rows" :key="row.index" data-slot="bullet-chart-row" :data-index="row.index">
          <g data-slot="bullet-chart-bands">
            <template v-for="b in row.bands" :key="b.key">
              <rect :data-slot="b.slot" :data-index="b.index" :x="b.x" :y="b.y" :width="b.w" :height="b.h" :class="[b.cls, 'stroke-border forced-colors:stroke-foreground']" stroke-width="1"><title>{{ b.title }}</title></rect>
              <rect v-if="b.hatch" data-slot="bullet-chart-hatch" :data-hatch="b.hatch" :x="b.x" :y="b.y" :width="b.w" :height="b.h" :fill="`url(#${patternId}-${b.hatch})`" aria-hidden="true" />
            </template>
          </g>
          <g v-if="row.rangeTexts.length" data-slot="bullet-chart-range-labels" class="fill-muted-foreground text-xs tabular-nums">
            <text v-for="t in row.rangeTexts" :key="t.key" data-slot="bullet-chart-range-label" :x="t.x" :y="t.y" :text-anchor="t.anchor" dominant-baseline="middle">{{ t.text }}</text>
          </g>
          <rect
            v-if="row.measure"
            data-slot="bullet-chart-measure"
            :x="row.measure.x" :y="row.measure.y" :width="row.measure.w" :height="row.measure.h"
            :class="[row.measure.cls, 'stroke-background forced-colors:stroke-foreground']"
            stroke-width="1"
          ><title>{{ row.measure.title }}</title></rect>
          <path v-if="row.overflow" data-slot="bullet-chart-overflow" :d="row.overflow" :class="row.measure?.cls"><title>Value is beyond the end of the scale</title></path>
          <g v-if="row.target" data-slot="bullet-chart-target">
            <line :x1="row.target.x1" :x2="row.target.x2" :y1="row.target.y1" :y2="row.target.y2" class="stroke-foreground" stroke-width="2" stroke-linecap="butt" />
            <path data-slot="bullet-chart-target-cap" :d="row.target.cap" class="fill-foreground stroke-background" stroke-width="1" />
            <title>{{ row.target.title }}</title>
          </g>
          <text data-slot="bullet-chart-label" :x="row.labelPos.x" :y="row.labelPos.y" :text-anchor="row.labelPos.anchor" dominant-baseline="middle" class="fill-foreground text-xs">{{ row.label }}<title v-if="row.full">{{ row.full }}</title></text>
          <text v-if="row.value" data-slot="bullet-chart-value" :x="row.value.x" :y="row.value.y" :text-anchor="row.value.anchor" dominant-baseline="middle" class="fill-foreground text-xs tabular-nums">{{ row.value.text }}</text>
        </g>
        <g v-if="geometry.ticks.length" data-slot="bullet-chart-axis" class="fill-muted-foreground text-xs tabular-nums">
          <text v-for="t in geometry.ticks" :key="t.key" data-slot="bullet-chart-tick" :x="t.text.x" :y="t.text.y" :text-anchor="t.text.anchor" dominant-baseline="middle">{{ t.label }}</text>
        </g>
      </svg>
    </div>
    <ChartLegend v-if="showLegend" :items="legendItems" data-slot="bullet-chart-legend" />
    <p v-for="(msg, i) in messages" :key="i" data-slot="bullet-chart-message" class="text-xs text-muted-foreground">{{ msg }}</p>
    <div data-slot="bullet-chart-table" class="sr-only">
      <table>
        <caption>{{ `${explicitName || 'Bullet chart'}: data` }}</caption>
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">Value</th>
            <th scope="col">Target</th>
            <th scope="col">Ranges</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b, i) in bullets" :key="i">
            <th scope="row">{{ b.label }}</th>
            <td>{{ withUnit(b.value, b.unit) }}</td>
            <td>{{ b.target === null ? 'none' : withUnit(b.target, b.unit) }}</td>
            <td>{{ rangeText(b) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
