<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { clamp, formatCompact, formatNumber, r2 } from '../_chart/chartMath'
import { dimension, estimateTextWidth, fitText, labelStep, oneOf, truncateLabel } from '../_chart/chartKit'
import { toneClasses, type ChartTone } from '../_chart/tones'
import { FORCED_FILL, useChartFrame } from '../_chart/chartFrame'
import ChartCaption from '../_chart/ChartCaption.vue'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartPlaceholder from '../_chart/ChartPlaceholder.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { conversions, formatPercent, funnelGeometry, normalizeStages, stageFractions, type FunnelStageInput } from './funnelMath'
import {
  FUNNEL_GAPS, FUNNEL_GAP_PX, FUNNEL_ORIENTATIONS, FUNNEL_PLACEMENTS, FUNNEL_PLOT_HEIGHT, FUNNEL_ROW_HEIGHT, FUNNEL_SIZES, FUNNEL_VARIANTS, funnelChartVariants,
  type FunnelChartGap, type FunnelChartOrientation, type FunnelChartSize, type FunnelChartVariant, type FunnelLabelPlacement,
} from './variants'

export type { FunnelStageInput } from './funnelMath'

export interface FunnelChartProps extends BaseProps {
  /** Stages in order, `{ label, value, tone? }`. Values may rise from one stage to the next: the shapes follow the data. At most 50 stages are drawn. */
  stages: FunnelStageInput[]
  /** `funnel` joins the stages into one shape, `pyramid` is the same shape upside down (the first stage is the base), `bars` aligns the stages to the start and `steps` centres a rectangle per stage. */
  variant?: FunnelChartVariant
  /** `vertical` stacks the stages top to bottom, `horizontal` runs them from start to end with the labels underneath. */
  orientation?: FunnelChartOrientation
  /** Where the text goes: `beside` the shapes (a label column, or underneath when horizontal) or `inside` them. Text that does not fit inside moves beside its stage. */
  labelPlacement?: FunnelLabelPlacement
  /** Show the share of the previous stage (`62%`) next to each value. The first stage has none. Values of 0 or missing values read "n/a". */
  showConversion?: boolean
  /** Show the value of each stage. */
  showValues?: boolean
  /** Height of a stage (32 / 44 / 56) when vertical, height of the shapes (96 / 144 / 200) when horizontal. */
  size?: FunnelChartSize
  /** Space between stages: 2, 4 or 8 units. */
  gap?: FunnelChartGap
  /** Tone of the stages that set none. */
  tone?: ChartTone
  /** Formats values and tooltips. Defaults to compact (labels) / grouped (tooltip) numbers. */
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
  /** ViewBox height. Overrides the height derived from `size` and the number of stages. */
  height?: number
}

const props = withDefaults(defineProps<FunnelChartProps>(), {
  variant: 'funnel',
  orientation: 'vertical',
  labelPlacement: 'beside',
  showConversion: false,
  showValues: true,
  size: 'md',
  gap: 'md',
  tone: 'chart-1',
  emptyText: 'No data',
  loading: false,
  loadingText: 'Loading chart',
  width: 480,
})

defineOptions({ inheritAttrs: false })

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
function checkStages() {
  if (!Array.isArray(props.stages)) {
    violation('FunnelChart', 'requires-stages', 'requires `stages`, an array of `{ label, value }` objects, e.g. `[{ label: "Visited", value: 1200 }]`. An empty array shows the empty state.')
    return
  }
  props.stages.forEach((s: unknown, i: number) => {
    if (!isRecord(s) || typeof s.label !== 'string' || !s.label.trim() || typeof s.value !== 'number') {
      violation('FunnelChart', 'stage-shape', `stage ${i + 1} needs a \`label\` and a numeric \`value\`: \`{ label: "Visited", value: 1200 }\`.`)
    }
  })
}
const { explicitName, labelledby, rootAttrs, ids, hasTitle, hasDescription, describedby } = useChartFrame('FunnelChart', props, checkStages, [() => props.stages])

const FONT = 12
const PAD = 4
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const sizeKey = computed(() => oneOf<FunnelChartSize>(props.size, FUNNEL_SIZES, 'md'))
const variant = computed(() => oneOf<FunnelChartVariant>(props.variant, FUNNEL_VARIANTS, 'funnel'))
const orientation = computed(() => oneOf<FunnelChartOrientation>(props.orientation, FUNNEL_ORIENTATIONS, 'vertical'))
const placement = computed(() => oneOf<FunnelLabelPlacement>(props.labelPlacement, FUNNEL_PLACEMENTS, 'beside'))
const gapKey = computed(() => oneOf<FunnelChartGap>(props.gap, FUNNEL_GAPS, 'md'))
const vertical = computed(() => orientation.value === 'vertical')

const norm = computed(() => normalizeStages(props.stages))
const stages = computed(() => norm.value.stages)
const empty = computed(() => stages.value.length === 0)
const values = computed(() => stages.value.map((s) => s.value))
const fractions = computed(() => stageFractions(values.value))
const rates = computed(() => conversions(values.value))
const fmtTip = (n: number) => (props.valueFormatter ?? formatNumber)(n)
const fmtShort = (n: number) => (props.valueFormatter ?? formatCompact)(n)
const valueText = (i: number) => (values.value[i] === null ? 'n/a' : fmtShort(values.value[i]!))
const convText = (i: number) => formatPercent(rates.value.previous[i]!)

/** Text lines of stage `i`: label, then value and conversion. */
const lineTexts = computed(() =>
  stages.value.map((s, i) => ({
    label: s.label,
    value: props.showValues ? valueText(i) : '',
    conv: props.showConversion && i > 0 ? convText(i) : '',
  })),
)

const labelCol = computed(() => {
  if (!vertical.value || placement.value !== 'beside') return 0
  const widest = Math.max(
    0,
    ...lineTexts.value.map((l) => Math.max(estimateTextWidth(truncateLabel(l.label, 22), FONT), estimateTextWidth(`${l.value}  ${l.conv}`.trim(), FONT))),
  )
  return clamp(widest + 12, 64, W.value * 0.42)
})

const textLines = computed(() => 1 + (props.showValues ? 1 : 0) + (props.showConversion ? 1 : 0))
const textBand = computed(() => (vertical.value ? 0 : PAD + 14 * textLines.value + 2))
const rowH = computed(() => FUNNEL_ROW_HEIGHT[sizeKey.value])
const gapPx = computed(() => FUNNEL_GAP_PX[gapKey.value])
const H = computed(() => {
  const explicit = dimension(props.height, 0)
  if (explicit > 0) return explicit
  const n = stages.value.length
  return vertical.value ? PAD * 2 + n * rowH.value + (n - 1) * gapPx.value : PAD * 2 + FUNNEL_PLOT_HEIGHT[sizeKey.value] + textBand.value
})
const plot = computed(() => ({
  x0: PAD + labelCol.value,
  x1: Math.max(PAD + labelCol.value + 1, W.value - PAD),
  y0: PAD,
  y1: Math.max(PAD + 1, H.value - PAD - textBand.value),
}))
const geometry = computed(() => funnelGeometry(fractions.value, { variant: variant.value, orientation: orientation.value, ...plot.value, gap: gapPx.value }))

interface Txt {
  key: string
  kind: 'label' | 'value' | 'conv' | 'chip'
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  text: string
  full: string | null
  chip?: { x: number; y: number; w: number; h: number }
}

const CHIP_H = 18
const texts = computed<Txt[]>(() => {
  const out: Txt[] = []
  const w = W.value
  const slot = (plot.value.x1 - plot.value.x0) / Math.max(1, stages.value.length)
  const every = vertical.value ? 1 : labelStep(slot, 40)
  geometry.value.forEach((g, i) => {
    const line = lineTexts.value[i]!
    const cyg = (g.y0 + g.y1) / 2
    const cxg = (g.x0 + g.x1) / 2
    if (vertical.value) {
      const tall = g.innerH >= 30
      if (placement.value === 'beside') {
        // Same estimate as the column width above, so a label that sized the column is never cut by it.
        const label = fitText(truncateLabel(line.label, 22), labelCol.value - 10, FONT)
        const full = label === line.label ? null : line.label
        const yLabel = r2(line.value || line.conv ? (tall ? cyg - 7 : cyg) : cyg)
        out.push({ key: `l${i}`, kind: 'label', x: PAD, y: yLabel, anchor: 'start', text: label, full })
        if (tall) {
          if (line.value) out.push({ key: `v${i}`, kind: 'value', x: PAD, y: r2(cyg + 8), anchor: 'start', text: line.value, full: null })
          if (line.conv) out.push({ key: `c${i}`, kind: 'conv', x: r2(PAD + (line.value ? estimateTextWidth(line.value, FONT) + 8 : 0)), y: r2(cyg + 8), anchor: 'start', text: line.conv, full: null })
        }
        return
      }
      // The text of a stage, from the whole line down to the label alone: the first that fits is used.
      const options = [...new Set([[line.label, line.value, line.conv], [line.label, line.value], [line.label]].map((p) => p.filter(Boolean).join('  ')))]
      const inside = g.d && g.innerH >= CHIP_H + 2 ? options.find((o) => estimateTextWidth(o, FONT) + 12 <= g.innerW - 4) : undefined
      if (inside !== undefined) {
        const chipW = estimateTextWidth(inside, FONT) + 12
        out.push({ key: `t${i}`, kind: 'chip', x: r2(cxg), y: r2(cyg), anchor: 'middle', text: inside, full: null, chip: { x: r2(cxg - chipW / 2), y: r2(cyg - CHIP_H / 2), w: r2(chipW), h: CHIP_H } })
        return
      }
      // Does not fit inside: print it after the stage, as long as there is room for a few characters.
      const x = g.x1 + 6
      const room = w - PAD - x
      if (room >= 36) {
        const chars = Math.max(3, Math.floor(room / (FONT * 0.58)))
        if (g.innerH >= 30 && (line.value || line.conv)) {
          const rest = [line.value, line.conv].filter(Boolean).join('  ')
          out.push({ key: `l${i}`, kind: 'label', x: r2(x), y: r2(cyg - 7), anchor: 'start', text: truncateLabel(line.label, chars), full: line.label.length > chars ? line.label : null })
          out.push({ key: `v${i}`, kind: 'value', x: r2(x), y: r2(cyg + 8), anchor: 'start', text: truncateLabel(rest, chars), full: rest.length > chars ? rest : null })
        } else {
          const fits = options.find((o) => estimateTextWidth(o, FONT) <= room)
          const text = fits ?? truncateLabel(options[0]!, chars)
          out.push({ key: `t${i}`, kind: 'label', x: r2(x), y: r2(cyg), anchor: 'start', text, full: text === options[0] ? null : options[0]! })
        }
      }
      return
    }
    // Horizontal: the label sits under its column; value and conversion too, or inside the shape when they fit there.
    const colW = slot
    const baseY = plot.value.y1 + PAD + 8
    const hasRoom = colW >= 40
    if (i % every === 0) {
      const maxChars = Math.max(2, Math.floor(colW / (FONT * 0.58)))
      const label = truncateLabel(line.label, maxChars)
      out.push({ key: `l${i}`, kind: 'label', x: r2(cxg), y: r2(baseY), anchor: 'middle', text: label, full: label === line.label ? null : line.label })
    }
    if (hasRoom) {
      const whole = [line.value, line.conv].filter(Boolean).join('  ')
      const chipW = estimateTextWidth(whole, FONT) + 10
      if (placement.value === 'inside' && whole && g.d && chipW <= g.innerW - 2 && g.innerH >= CHIP_H + 2) {
        out.push({ key: `t${i}`, kind: 'chip', x: r2(cxg), y: r2(cyg), anchor: 'middle', text: whole, full: null, chip: { x: r2(cxg - chipW / 2), y: r2(cyg - CHIP_H / 2), w: r2(chipW), h: CHIP_H } })
      } else {
        let y = baseY + 14
        if (line.value) {
          out.push({ key: `v${i}`, kind: 'value', x: r2(cxg), y: r2(y), anchor: 'middle', text: truncateLabel(line.value, Math.max(2, Math.floor(colW / (FONT * 0.58)))), full: null })
          y += 14
        }
        if (line.conv) out.push({ key: `c${i}`, kind: 'conv', x: r2(cxg), y: r2(y), anchor: 'middle', text: line.conv, full: null })
      }
    }
  })
  return out
})

const shapes = computed(() =>
  geometry.value.map((g, i) => {
    const s = stages.value[i]!
    const rate = rates.value.previous[i]!
    return {
      i,
      d: g.d,
      tone: toneClasses[s.tone ?? (props.tone in toneClasses ? props.tone : 'chart-1')].fill,
      title: `${s.label}: ${s.value === null ? 'n/a' : fmtTip(s.value)}${i > 0 ? ` (${formatPercent(rate)} of previous stage)` : ''}`,
      empty: !g.d,
    }
  }),
)

const summary = computed(() => {
  const n = stages.value.length
  const first = stages.value[0]!
  const last = stages.value[n - 1]!
  const fv = (s: typeof first) => (s.value === null ? 'n/a' : fmtTip(s.value))
  const kind = variant.value === 'pyramid' ? 'Pyramid chart' : variant.value === 'bars' ? 'Funnel bar chart' : variant.value === 'steps' ? 'Funnel step chart' : 'Funnel chart'
  const cut = norm.value.total > n ? `, first ${n} of ${norm.value.total} stages drawn` : ''
  return `${kind}: ${n} ${n === 1 ? 'stage' : 'stages'}, from ${first.label} (${fv(first)}) to ${last.label} (${fv(last)})${cut}`
})

const table = computed(() => {
  const pct = (v: number) => `${v}%`
  return {
    categories: stages.value.map((s) => s.label),
    series: [
      { name: 'Value', data: values.value },
      { name: 'Percent of previous stage', data: rates.value.previous },
      { name: 'Percent of first stage', data: rates.value.first },
    ],
    formats: [fmtTip, pct, pct],
  }
})
const tableCaption = computed(() => `${explicitName.value || 'Funnel chart'}: data`)
const imageName = computed(() => explicitName.value || summary.value)
const rootClass = computed(() => cn(funnelChartVariants({ size: sizeKey.value }), props.class))
</script>

<template>
  <ChartPlaceholder v-if="loading" v-bind="rootAttrs" data-slot="funnel-chart" kind="loading" :text="loadingText" :user-class="$props.class" />
  <ChartPlaceholder
    v-else-if="empty"
    v-bind="rootAttrs"
    data-slot="funnel-chart"
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
    data-slot="funnel-chart"
    :data-variant="variant"
    :data-orientation="orientation"
    :class="rootClass"
  >
    <ChartCaption data-slot="funnel-chart" :title="hasTitle ? title : undefined" :description="hasDescription ? description : undefined" :description-id="ids.description" />
    <svg
      data-slot="funnel-chart-svg"
      role="img"
      :aria-label="imageName"
      :aria-labelledby="labelledby"
      :aria-describedby="describedby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <g data-slot="funnel-chart-stages">
        <template v-for="s in shapes" :key="s.i">
          <path
            v-if="s.d"
            data-slot="funnel-chart-stage"
            :data-index="s.i"
            :d="s.d"
            :class="[s.tone, FORCED_FILL]"
          ><title>{{ s.title }}</title></path>
        </template>
      </g>
      <g data-slot="funnel-chart-labels" class="text-xs tabular-nums">
        <template v-for="t in texts" :key="t.key">
          <rect
            v-if="t.chip"
            data-slot="funnel-chart-chip"
            :x="t.chip.x" :y="t.chip.y" :width="t.chip.w" :height="t.chip.h"
            rx="3"
            class="fill-background stroke-border"
            stroke-width="1"
          />
          <text
            :data-slot="`funnel-chart-${t.kind === 'chip' ? 'label' : t.kind}`"
            :x="t.x" :y="t.y" :text-anchor="t.anchor" dominant-baseline="middle"
            :class="t.kind === 'conv' ? 'fill-muted-foreground' : 'fill-foreground'"
          >{{ t.text }}<title v-if="t.full">{{ t.full }}</title></text>
        </template>
      </g>
    </svg>
    <span :id="ids.summary" data-slot="funnel-chart-summary" class="sr-only">{{ summary }}</span>
    <ChartDataTable category-header="Stage" :caption="tableCaption" :categories="table.categories" :series="table.series" :format="fmtTip" :formats="table.formats" />
  </figure>
</template>
