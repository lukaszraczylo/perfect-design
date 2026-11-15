<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { extent, formatNumber, isFiniteNumber } from '../_chart/chartMath'
import { oneOf, plural } from '../_chart/chartKit'
import { useMountedCheck } from '../_shared/contract'
import type { ChartTone } from '../_chart/tones'
import { heatClass, heatLevel, normalizeLevels } from './heatLevel'
import { heatmapCellVariants, heatmapTableVariants, type HeatmapGap, type HeatmapShape, type HeatmapSize } from './variants'

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
  /** Show every n-th column label visibly (the rest stay available to screen readers). */
  colLabelStep?: number
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

const rows = computed<unknown[][]>(() => (Array.isArray(props.values) ? props.values : []).map((r) => (Array.isArray(r) ? r : [])))
const cols = computed(() => rows.value.reduce((m, r) => Math.max(m, r.length), 0))
const empty = computed(() => rows.value.length === 0 || cols.value === 0)
const levels = computed(() => normalizeLevels(props.levels))
const step = computed(() => (isFiniteNumber(props.colLabelStep) ? Math.max(1, Math.floor(props.colLabelStep)) : 1))

const domain = computed(() => {
  const ext = extent(rows.value.flat())
  return {
    lo: isFiniteNumber(props.min) ? props.min : (ext?.[0] ?? 0),
    hi: isFiniteNumber(props.max) ? props.max : (ext?.[1] ?? 0),
  }
})

const hasColLabels = computed(() => Array.isArray(props.colLabels) && props.colLabels.length > 0)
const hasRowLabels = computed(() => Array.isArray(props.rowLabels) && props.rowLabels.length > 0)
const colName = (c: number) => String(props.colLabels?.[c] ?? '')
const rowName = (r: number) => String(props.rowLabels?.[r] ?? '')

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
    data-slot="heatmap"
    role="region"
    tabindex="0"
    :aria-label="label || summary"
    :class="cn('relative flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-x-auto focus-visible:ring-inset', focusRing, $props.class)"
  >
    <table data-slot="heatmap-table" :class="tableClass">
      <caption class="sr-only">{{ label || summary }}</caption>
      <thead v-if="hasColLabels">
        <tr>
          <td v-if="hasRowLabels" />
          <th
            v-for="c in cols"
            :key="c"
            data-slot="heatmap-col-label"
            scope="col"
            class="whitespace-nowrap p-0 text-start font-normal"
          >
            <span :class="(c - 1) % step === 0 ? '' : 'sr-only'">{{ colName(c - 1) }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, r) in grid" :key="r" data-slot="heatmap-row">
          <th v-if="hasRowLabels" data-slot="heatmap-row-label" scope="row" class="whitespace-nowrap pe-1 text-end font-normal">{{ row.label }}</th>
          <td v-for="(cell, c) in row.cells" :key="c" data-slot="heatmap-cell" :data-empty="cell.value === null ? 'true' : undefined" class="p-0">
            <span class="sr-only">{{ cell.text }}</span>
            <span data-slot="heatmap-swatch" :title="cell.title" aria-hidden="true" :class="[cellClass, cell.cls]" />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showLegend" data-slot="heatmap-legend" class="flex items-center gap-1 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
      <span>Less</span>
      <span v-for="(c, i) in legend" :key="i" data-slot="heatmap-legend-swatch" :class="[cellClass, c]" />
      <span>More</span>
    </div>
  </div>
</template>
