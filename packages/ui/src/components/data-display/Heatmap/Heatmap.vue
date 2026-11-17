<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { extent, formatNumber, isFiniteNumber } from '../_chart/chartMath'
import { estimateTextWidth, labelStep, oneOf, plural } from '../_chart/chartKit'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { useMountedCheck } from '../_shared/contract'
import type { ChartTone } from '../_chart/tones'
import { heatClass, heatLevel, normalizeLevels } from './heatLevel'
import { heatmapCellVariants, heatmapFitGapClass, heatmapFitShapeClass, heatmapTableVariants, HEATMAP_FIT_MAX_CELL_PX, type HeatmapGap, type HeatmapShape, type HeatmapSize } from './variants'

export interface HeatmapProps extends BaseProps {
  /** Rows × columns. `null` / NaN / missing cells are "empty". Rows may be ragged. */
  values: (number | null)[][]
  rowLabels?: string[]
  colLabels?: string[]
  tone?: ChartTone
  /** Domain minimum (default: smallest value in the data). */
  min?: number
  /** Domain maximum (default: largest value in the data). */
  max?: number
  /** Number of intensity steps, 1–5. */
  levels?: number
  /** Cell size: `sm` size-3, `md` size-4, `lg` size-6. */
  size?: HeatmapSize
  /** Cell shape: rounded `square` (default) or `circle`. */
  shape?: HeatmapShape
  /** Space between cells: `sm` 1px, `md` 2px, `lg` 4px. */
  gap?: HeatmapGap
  /** Show the Less … More legend. */
  showLegend?: boolean
  /** Show every n-th column label visibly (the rest stay available to screen readers). With `fit` the step also grows on its own so labels never overlap. */
  colLabelStep?: number
  /** Cells stretch to the width of the container (square, up to 40px) instead of the fixed `size`. The first and last column labels always show; the ones between are thinned to fit. */
  fit?: boolean
  /** Accessible label (table caption); defaults to an auto-generated summary. */
  label?: string
  /** Shown when `values` has no cells. */
  emptyText?: string
  /** Custom tooltip text per cell. */
  cellTitle?: (value: number | null, rowLabel: string, colLabel: string) => string
}

const props = withDefaults(defineProps<HeatmapProps>(), {
  tone: 'chart-1',
  levels: 5,
  size: 'md',
  shape: 'square',
  gap: 'md',
  showLegend: true,
  colLabelStep: 1,
  fit: false,
  emptyText: 'No data',
})

const attrs = useAttrs()
useMountedCheck(
  () => {
    requireOneOf('Heatmap', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'The heatmap is a table region and needs a name, e.g. `label="Commits per weekday"`.')
    if (!Array.isArray(props.values) || props.values.some((r) => !Array.isArray(r))) {
      violation('Heatmap', 'requires-values', 'requires `values`, an array of rows where each row is an array of numbers (or null for an empty cell). An empty array shows the empty state.')
    }
  },
  [() => props.values],
)

const cellClass = computed(() => heatmapCellVariants({ shape: oneOf<HeatmapShape>(props.shape, ['square', 'circle'], 'square'), size: oneOf<HeatmapSize>(props.size, ['sm', 'md', 'lg'], 'md') }))
const tableClass = computed(() => [heatmapTableVariants({ gap: oneOf<HeatmapGap>(props.gap, ['sm', 'md', 'lg'], 'md') }), 'text-xs text-muted-foreground'])

const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const FIT_FONT = 12
const FIT_LABEL_GUTTER_PAD = 4
const FIT_GAP_PX = { sm: 1, md: 2, lg: 4 } as const
const gapKey = computed(() => oneOf<HeatmapGap>(props.gap, ['sm', 'md', 'lg'], 'md'))
const shapeKey = computed(() => oneOf<HeatmapShape>(props.shape, ['square', 'circle'], 'square'))

const legendCellClass = computed(() => (props.fit ? heatmapCellVariants({ shape: shapeKey.value, size: 'md' }) : cellClass.value))
const fitCellClass = computed(() => cn('block aspect-square w-full', heatmapFitShapeClass[shapeKey.value]))
const fitTableStyle = computed(() => ({
  gridTemplateColumns: `${hasRowLabels.value ? 'auto ' : ''}repeat(${cols.value}, minmax(0, ${HEATMAP_FIT_MAX_CELL_PX}px))`,
}))

const rows = computed<unknown[][]>(() => (Array.isArray(props.values) ? props.values : []).map((r) => (Array.isArray(r) ? r : [])))
const cols = computed(() => rows.value.reduce((m, r) => Math.max(m, r.length), 0))
const empty = computed(() => rows.value.length === 0 || cols.value === 0)
const levels = computed(() => normalizeLevels(props.levels))
const step = computed(() => (isFiniteNumber(props.colLabelStep) ? Math.max(1, Math.floor(props.colLabelStep)) : 1))

const hasColLabels = computed(() => Array.isArray(props.colLabels) && props.colLabels.length > 0)
const hasRowLabels = computed(() => Array.isArray(props.rowLabels) && props.rowLabels.length > 0)
const colName = (c: number) => String(props.colLabels?.[c] ?? '')
const rowName = (r: number) => String(props.rowLabels?.[r] ?? '')

/** Visible column-label step: the explicit step, raised in `fit` mode until the widest label fits its stretch of cells. */
const effectiveStep = computed(() => {
  if (!props.fit || !hasColLabels.value || measured.value <= 0) return step.value
  const rowGutter = hasRowLabels.value ? Math.max(0, ...Array.from({ length: rows.value.length }, (_, r) => estimateTextWidth(rowName(r), FIT_FONT))) + FIT_LABEL_GUTTER_PAD : 0
  const gap = FIT_GAP_PX[gapKey.value]
  const cell = Math.min(HEATMAP_FIT_MAX_CELL_PX, Math.max(1, (measured.value - rowGutter - gap * cols.value) / Math.max(1, cols.value)))
  const widest = Math.max(0, ...Array.from({ length: cols.value }, (_, c) => estimateTextWidth(colName(c), FIT_FONT))) + FIT_LABEL_GUTTER_PAD
  return Math.max(step.value, labelStep(cell + gap, widest))
})
/** Whether the label of 0-based column `c` is visible. The first and (in `fit` mode) the last always are; a step multiple too close to the last one yields to it. */
const labelShown = (c: number): boolean => {
  const s = effectiveStep.value
  if (!props.fit) return c % s === 0
  const last = cols.value - 1
  if (c === last || c === 0) return true
  return c % s === 0 && last - c >= s
}

const domain = computed(() => {
  const ext = extent(rows.value.flat())
  return {
    lo: isFiniteNumber(props.min) ? props.min : (ext?.[0] ?? 0),
    hi: isFiniteNumber(props.max) ? props.max : (ext?.[1] ?? 0),
  }
})

const grid = computed(() =>
  rows.value.map((row, r) => ({
    label: rowName(r),
    cells: Array.from({ length: cols.value }, (_, c) => {
      const raw = row[c]
      const value = isFiniteNumber(raw) ? raw : null
      const level = heatLevel(value, domain.value.lo, domain.value.hi, levels.value)
      const rl = rowName(r) || `Row ${r + 1}`
      const cl = colName(c) || `Column ${c + 1}`
      return {
        value,
        text: value === null ? 'no data' : formatNumber(value),
        cls: heatClass(props.tone, level, levels.value),
        title: props.cellTitle ? props.cellTitle(value, rowName(r), colName(c)) : `${rl}, ${cl}: ${value === null ? 'no data' : formatNumber(value)}`,
      }
    }),
  })),
)

const legend = computed(() => [heatClass(props.tone, 0, levels.value), ...Array.from({ length: levels.value }, (_, i) => heatClass(props.tone, i + 1, levels.value))])

const summary = computed(() => {
  const ext = extent(rows.value.flat())
  const base = `Heatmap: ${plural(rows.value.length, 'row')} by ${plural(cols.value, 'column')}`
  return ext ? `${base}, values from ${formatNumber(ext[0])} to ${formatNumber(ext[1])}` : `${base}, no values`
})
</script>

<template>
  <div
    v-if="empty"
    data-slot="heatmap"
    role="img"
    :aria-label="label || emptyText"
    :class="cn('flex min-h-24 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="heatmap-empty">{{ emptyText }}</span>
  </div>
  <div
    v-else
    ref="rootEl"
    data-slot="heatmap"
    role="region"
    tabindex="0"
    :aria-label="label || summary"
    :data-fit="fit ? '' : undefined"
    :class="cn('relative flex max-w-full min-w-0 flex-col gap-2 overflow-x-auto focus-visible:ring-inset', fit ? 'w-full' : 'w-fit', focusRing, $props.class)"
  >
    <table
      data-slot="heatmap-table"
      :role="fit ? 'table' : undefined"
      :class="fit ? ['grid w-full justify-start text-xs text-muted-foreground', heatmapFitGapClass[gapKey]] : tableClass"
      :style="fit ? fitTableStyle : undefined"
    >
      <caption class="sr-only">{{ label || summary }}</caption>
      <thead v-if="hasColLabels" :class="fit ? 'contents' : undefined" :role="fit ? 'rowgroup' : undefined">
        <tr :class="fit ? 'contents' : undefined" :role="fit ? 'row' : undefined">
          <td v-if="hasRowLabels" :role="fit ? 'presentation' : undefined" />
          <th
            v-for="c in cols"
            :key="c"
            data-slot="heatmap-col-label"
            scope="col"
            :role="fit ? 'columnheader' : undefined"
            :class="fit ? 'flex min-w-0 p-0 font-normal whitespace-nowrap' + (c === cols ? ' justify-end' : ' justify-start') : 'whitespace-nowrap p-0 text-start font-normal'"
          >
            <span :class="labelShown(c - 1) ? '' : 'sr-only'">{{ colName(c - 1) }}</span>
          </th>
        </tr>
      </thead>
      <tbody :class="fit ? 'contents' : undefined" :role="fit ? 'rowgroup' : undefined">
        <tr v-for="(row, r) in grid" :key="r" data-slot="heatmap-row" :class="fit ? 'contents' : undefined" :role="fit ? 'row' : undefined">
          <th v-if="hasRowLabels" data-slot="heatmap-row-label" scope="row" :role="fit ? 'rowheader' : undefined" :class="fit ? 'flex items-center justify-end pe-1 font-normal whitespace-nowrap' : 'whitespace-nowrap pe-1 text-end font-normal'">{{ row.label }}</th>
          <td v-for="(cell, c) in row.cells" :key="c" data-slot="heatmap-cell" :role="fit ? 'cell' : undefined" :data-empty="cell.value === null ? 'true' : undefined" class="p-0">
            <span class="sr-only">{{ cell.text }}</span>
            <span data-slot="heatmap-swatch" :title="cell.title" aria-hidden="true" :class="[fit ? fitCellClass : cellClass, cell.cls]" />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showLegend" data-slot="heatmap-legend" class="flex items-center gap-1 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
      <span>Less</span>
      <span v-for="(c, i) in legend" :key="i" data-slot="heatmap-legend-swatch" :class="[legendCellClass, c]" />
      <span>More</span>
    </div>
  </div>
</template>
