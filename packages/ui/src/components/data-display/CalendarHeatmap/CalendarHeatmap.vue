<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { formatNumber, isFiniteNumber, r2 } from '../_chart/chartMath'
import { estimateTextWidth, oneOf, plural } from '../_chart/chartKit'
import { toneClasses, type ChartTone } from '../_chart/tones'
import { useChartContract } from '../_chart/chartContract'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { useConfigLabels } from '../../layout/ConfigProvider/config'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import { WEEKDAYS, formatDay, longDay, parseDay, weekdayRow, type WeekStart } from './calendarDates'
import {
  MAX_DAYS, NO_DATA_CLASS, aggregate, buildGrid, calendarLevel, levelFill, monthLabels, monthTotals, normalizeLevels, resolveRange,
  type CalendarEntry,
} from './calendarMath'
import {
  CALENDAR_FIT_MAX_CELL, CALENDAR_FIT_MIN_CELL, CALENDAR_GAPS, CALENDAR_SHAPES, CALENDAR_SIZES, CELL_GAP, CELL_SIZE, calendarHeatmapVariants,
  type CalendarHeatmapGap, type CalendarHeatmapShape, type CalendarHeatmapSize,
} from './variants'

export interface CalendarHeatmapProps extends BaseProps {
  /** One entry per day: `{ date: 'YYYY-MM-DD', value }`. Entries of the same day are summed. */
  data: CalendarEntry[]
  /** First day shown, `YYYY-MM-DD`. Without it the range starts at the earliest day in `data`. */
  start?: string
  /** Last day shown, `YYYY-MM-DD`. Without it the range ends at the latest day in `data`. */
  end?: string
  /** First row of the week: `sun` (default) or `mon`. */
  weekStart?: WeekStart
  /** Cell size: `sm` 10px, `md` 12px, `lg` 16px. */
  size?: CalendarHeatmapSize
  /** Cell shape: rounded `square` (default) or `circle`. */
  shape?: CalendarHeatmapShape
  /** Space between cells: `sm` 1px, `md` 2px, `lg` 4px. */
  gap?: CalendarHeatmapGap
  /** Number of intensity steps above zero, 3 to 7. */
  levels?: number
  /** Colour token of the intensity ramp. */
  tone?: ChartTone
  /** Value of the faintest step's lower edge. Without it the domain starts at 0. */
  min?: number
  /** Value of the strongest step. Without it the largest value in the range. */
  max?: number
  /** The grid stretches to the width of its container instead of the fixed `size`: cells grow (8 to 40px) so the weeks fill the row, while month, weekday and legend text stay 12px. Below 8px the grid scrolls. */
  fit?: boolean
  /** Draw the Less ... More legend. */
  showLegend?: boolean
  /** Text of the legend ends. Wins over the `ConfigProvider` labels `heatmap.less` and `heatmap.more`; the English words are the default. */
  legendLabels?: { less?: string; more?: string }
  /** Draw month names above the weeks. */
  showMonthLabels?: boolean
  /** Draw Mon, Wed and Fri beside the rows. */
  showWeekdayLabels?: boolean
  /** Custom tooltip text per day: receives the `YYYY-MM-DD` date and its value (`null` without data). */
  cellTitle?: (date: string, value: number | null) => string
  /** Accessible name. Required unless `title`, `aria-label` or `aria-labelledby` is given. */
  label?: string
  /** Visible heading text above the chart (also the accessible name when `label` is not set). */
  title?: string
  /** Visible supporting text under the title. */
  description?: string
  /** Shown when there is nothing to draw (no data and no `start` / `end`). */
  emptyText?: string
}

const props = withDefaults(defineProps<CalendarHeatmapProps>(), {
  weekStart: 'sun',
  size: 'md',
  shape: 'square',
  gap: 'md',
  fit: false,
  levels: 5,
  tone: 'chart-1',
  showLegend: true,
  showMonthLabels: true,
  showWeekdayLabels: true,
  emptyText: 'No data',
})

defineOptions({ inheritAttrs: false })

const checkProps = () => {
  if (!Array.isArray(props.data)) {
    violation('CalendarHeatmap', 'requires-data', 'requires `data`, an array of `{ date: "2025-03-03", value: 4 }` objects. An empty array with `start` and `end` shows empty days.')
  }
  for (const key of ['start', 'end'] as const) {
    const v = props[key]
    if (v !== undefined && v !== null && parseDay(v) === null) {
      violation('CalendarHeatmap', `invalid-${key}`, `\`${key}\` must be a real date written \`YYYY-MM-DD\` (got ${JSON.stringify(v)}), e.g. \`${key}="2025-03-03"\`.`)
    }
  }
}
const nameSource = {
  get label() {
    return props.label || props.title
  },
}
const { explicitName, labelledby, rootAttrs } = useChartContract('CalendarHeatmap', nameSource, checkProps, [() => props.data, () => props.start, () => props.end])

const FONT = 12
const sizeKey = computed(() => oneOf<CalendarHeatmapSize>(props.size, CALENDAR_SIZES, 'md'))
const shapeKey = computed(() => oneOf<CalendarHeatmapShape>(props.shape, CALENDAR_SHAPES, 'square'))
const gapKey = computed(() => oneOf<CalendarHeatmapGap>(props.gap, CALENDAR_GAPS, 'md'))
const weekStart = computed<WeekStart>(() => (props.weekStart === 'mon' ? 'mon' : 'sun'))
const toneKey = computed<ChartTone>(() => (props.tone && props.tone in toneClasses ? props.tone : 'chart-1'))
const levels = computed(() => normalizeLevels(props.levels))

const agg = computed(() => aggregate(props.data))
const range = computed(() => resolveRange(agg.value.min, agg.value.max, props.start, props.end))
const grid = computed(() => (range.value ? buildGrid(range.value, agg.value.days, weekStart.value) : null))
const empty = computed(() => grid.value === null)

const domain = computed(() => {
  let top = 0
  for (const c of grid.value?.cells ?? []) if (c.value !== null && c.value > top) top = c.value
  return { lo: isFiniteNumber(props.min) ? props.min : 0, hi: isFiniteNumber(props.max) ? props.max : top }
})

const fmt = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })
const num = (n: number) => (isFiniteNumber(n) ? fmt.format(n === 0 ? 0 : n) : formatNumber(n))

const scrollEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(scrollEl)
const labels = useConfigLabels('heatmap', { less: 'Less', more: 'More' })
const legendText = computed(() => ({
  less: props.legendLabels?.less?.trim() ? props.legendLabels.less : labels.value.less,
  more: props.legendLabels?.more?.trim() ? props.legendLabels.more : labels.value.more,
}))

const base = computed(() => {
  const gap = CELL_GAP[gapKey.value]
  const left = props.showWeekdayLabels ? 30 : 0
  let cell = CELL_SIZE[sizeKey.value]
  const columns = grid.value?.columns ?? 0
  if (props.fit && measured.value > 0 && columns > 0) {
    // 2px of room on the right matches the `W` margin below, so the SVG is never wider than its container.
    const fitted = Math.floor(((measured.value - left - 2 + gap) / columns - gap) * 100) / 100
    cell = Math.min(CALENDAR_FIT_MAX_CELL, Math.max(CALENDAR_FIT_MIN_CELL, fitted))
  }
  return { cell, gap, step: cell + gap, left, top: props.showMonthLabels ? 18 : 0 }
})

const monthTexts = computed(() => {
  if (!props.showMonthLabels || !grid.value) return []
  const { left, step } = base.value
  const labels = monthLabels(grid.value.cells)
  const kept: { x: number; text: string; partial: boolean; width: number }[] = []
  labels.forEach((m, i) => {
    const x = left + m.col * step
    const room = i + 1 < labels.length ? left + labels[i + 1]!.col * step - x : Infinity
    // The year is added when the label has room for it before the next month's label.
    const text = (yearWanted: boolean) => (yearWanted && room >= estimateTextWidth(`${m.name} ${m.year}`, FONT) + 4 ? `${m.name} ${m.year}` : m.name)
    const prev = kept[kept.length - 1]
    if (prev && x - prev.x < prev.width + 4) {
      // A cut-off first month gives way to the next one; any other clash drops the later label.
      if (kept.length === 1 && prev.partial) {
        const t = text(true)
        kept[0] = { x, text: t, partial: false, width: estimateTextWidth(t, FONT) }
      }
      return
    }
    const t = text(m.yearHint)
    kept.push({ x, text: t, partial: m.partial, width: estimateTextWidth(t, FONT) })
  })
  return kept
})

const layout = computed(() => {
  const { cell, gap, step, left, top } = base.value
  const columns = grid.value?.columns ?? 0
  const gridW = columns * step - gap
  const gridH = 7 * step - gap
  const legendTop = top + gridH + 8
  // The legend keeps the `size` cell in `fit` mode: stretched swatches would make it wider than the weeks.
  const lcell = props.fit ? CELL_SIZE[sizeKey.value] : cell
  const lstep = lcell + gap
  const legendH = Math.max(lcell, FONT)
  const lessW = estimateTextWidth(legendText.value.less, FONT) + 6
  const legendRight = left + lessW + (levels.value + 1) * lstep + estimateTextWidth(legendText.value.more, FONT) + 2
  const monthRight = Math.max(0, ...monthTexts.value.map((m) => m.x + m.width))
  const W = Math.ceil(Math.max(left + gridW + 2, monthRight + 2, props.showLegend ? legendRight : 0))
  const H = Math.ceil(top + gridH + (props.showLegend ? 8 + legendH : 0) + 2)
  return { cell, gap, step, left, top, gridW, gridH, legendTop, legendH, lessW, lcell, lstep, W, H }
})

const fills = computed(() => Array.from({ length: levels.value + 1 }, (_, i) => levelFill(toneKey.value, i, levels.value)))

interface DayShape { key: number; x: number; y: number; cls: string; title: string; date: string }
const days = computed<DayShape[]>(() => {
  const g = grid.value
  if (!g) return []
  const { left, top, step } = layout.value
  const { lo, hi } = domain.value
  return g.cells.map((c) => {
    const date = formatDay(c.day)
    const level = calendarLevel(c.value, lo, hi, levels.value)
    return {
      key: c.day,
      date,
      x: left + c.col * step,
      y: top + c.row * step,
      cls: c.value === null ? NO_DATA_CLASS : fills.value[level]!,
      title: props.cellTitle ? props.cellTitle(date, c.value) : `${longDay(c.day)}: ${c.value === null ? 'no data' : num(c.value)}`,
    }
  })
})

const weekdayTexts = computed(() => {
  if (!props.showWeekdayLabels) return []
  const { left, top, step, cell } = layout.value
  return [1, 3, 5].map((wd) => ({ text: WEEKDAYS[wd]!, x: left - 6, y: r2(top + weekdayRow(wd, weekStart.value) * step + cell / 2) }))
})

const legendCells = computed(() => {
  const { left, legendTop, lessW, lstep } = layout.value
  return fills.value.map((cls, i) => ({ cls, x: left + lessW + i * lstep, y: legendTop, key: i }))
})

const months = computed(() => (grid.value ? monthTotals(grid.value.cells) : []))
const totals = computed(() => months.value.reduce((a, m) => ({ total: a.total + m.total, active: a.active + m.active }), { total: 0, active: 0 }))
const summary = computed(() => {
  const r = range.value
  if (!r) return 'Calendar heatmap'
  return `Calendar heatmap: ${plural(r.end - r.start + 1, 'day')} from ${formatDay(r.start)} to ${formatDay(r.end)}, ${num(totals.value.total)} in total on ${plural(totals.value.active, 'active day')}`
})
const name = computed(() => explicitName.value || summary.value)
const messages = computed(() => {
  const out: string[] = []
  if (agg.value.invalid > 0) out.push(`${plural(agg.value.invalid, 'entry', 'entries')} with an invalid date or value ${agg.value.invalid === 1 ? 'was' : 'were'} skipped.`)
  if (range.value?.capped) out.push(`Showing the last ${MAX_DAYS} days of the range.`)
  return out
})
const rootClass = computed(() => calendarHeatmapVariants({ size: sizeKey.value, shape: shapeKey.value, gap: gapKey.value }))
const radius = computed(() => (sizeKey.value === 'sm' ? 1.5 : 2))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="calendar-heatmap"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-24 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="calendar-heatmap-empty">{{ emptyText }}</span>
  </div>
  <div v-else v-bind="rootAttrs" data-slot="calendar-heatmap" :data-shape="shapeKey" :data-gap="gapKey" :data-week-start="weekStart" :data-fit="fit ? '' : undefined" :class="cn(rootClass, $props.class)">
    <div v-if="title || description" data-slot="calendar-heatmap-header" class="flex min-w-0 flex-col gap-0.5">
      <p v-if="title" data-slot="calendar-heatmap-title" class="text-sm font-medium text-foreground">{{ title }}</p>
      <p v-if="description" data-slot="calendar-heatmap-description" class="text-xs text-muted-foreground">{{ description }}</p>
    </div>
    <div
      ref="scrollEl"
      data-slot="calendar-heatmap-scroll"
      role="region"
      tabindex="0"
      :aria-label="name"
      :class="cn(fit ? 'w-full' : 'w-fit', 'max-w-full min-w-0 overflow-x-auto focus-visible:ring-inset', focusRing)"
    >
      <svg
        data-slot="calendar-heatmap-svg"
        role="img"
        :aria-label="name"
        :aria-labelledby="labelledby"
        :viewBox="`0 0 ${layout.W} ${layout.H}`"
        :width="layout.W"
        :height="layout.H"
        class="max-w-none shrink-0"
      >
        <g v-if="monthTexts.length" data-slot="calendar-heatmap-months" class="fill-muted-foreground text-xs">
          <text v-for="(m, i) in monthTexts" :key="i" data-slot="calendar-heatmap-month" :x="m.x" y="8" dominant-baseline="middle">{{ m.text }}</text>
        </g>
        <g v-if="weekdayTexts.length" data-slot="calendar-heatmap-weekdays" class="fill-muted-foreground text-xs">
          <text v-for="d in weekdayTexts" :key="d.text" data-slot="calendar-heatmap-weekday" :x="d.x" :y="d.y" text-anchor="end" dominant-baseline="middle">{{ d.text }}</text>
        </g>
        <g data-slot="calendar-heatmap-days" stroke-width="1">
          <template v-for="d in days" :key="d.key">
            <circle v-if="shapeKey === 'circle'" data-slot="calendar-heatmap-day" :data-date="d.date" :cx="d.x + layout.cell / 2" :cy="d.y + layout.cell / 2" :r="layout.cell / 2" :class="d.cls"><title>{{ d.title }}</title></circle>
            <rect v-else data-slot="calendar-heatmap-day" :data-date="d.date" :x="d.x" :y="d.y" :width="layout.cell" :height="layout.cell" :rx="radius" :class="d.cls"><title>{{ d.title }}</title></rect>
          </template>
        </g>
        <g v-if="showLegend" data-slot="calendar-heatmap-legend" stroke-width="1">
          <text data-slot="calendar-heatmap-legend-text" :x="layout.left" :y="layout.legendTop + layout.legendH / 2" dominant-baseline="middle" class="fill-muted-foreground text-xs">{{ legendText.less }}</text>
          <template v-for="c in legendCells" :key="c.key">
            <circle v-if="shapeKey === 'circle'" data-slot="calendar-heatmap-legend-swatch" :cx="c.x + layout.lcell / 2" :cy="c.y + layout.legendH / 2" :r="layout.lcell / 2" :class="c.cls" />
            <rect v-else data-slot="calendar-heatmap-legend-swatch" :x="c.x" :y="c.y + (layout.legendH - layout.lcell) / 2" :width="layout.lcell" :height="layout.lcell" :rx="radius" :class="c.cls" />
          </template>
          <text data-slot="calendar-heatmap-legend-text" :x="layout.left + layout.lessW + legendCells.length * layout.lstep + 2" :y="layout.legendTop + layout.legendH / 2" dominant-baseline="middle" class="fill-muted-foreground text-xs">{{ legendText.more }}</text>
        </g>
      </svg>
    </div>
    <p v-for="(msg, i) in messages" :key="i" data-slot="calendar-heatmap-message" class="text-xs text-muted-foreground">{{ msg }}</p>
    <ChartDataTable
      :caption="`${explicitName || 'Calendar heatmap'}: data by month`"
      category-header="Month"
      :categories="months.map((m) => m.label)"
      :series="[
        { name: 'Total', data: months.map((m) => m.total) },
        { name: 'Active days', data: months.map((m) => m.active) },
        { name: 'Busiest day', data: months.map((m) => m.busiest) },
        { name: 'Days without data', data: months.map((m) => m.noData) },
      ]"
      :format="num"
    />
  </div>
</template>
