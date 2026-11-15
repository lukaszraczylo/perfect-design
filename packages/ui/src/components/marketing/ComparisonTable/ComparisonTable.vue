<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs, useSlots } from 'vue'
import { requireOneOf, requireText } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Badge from '../../primitives/Badge/Badge.vue'
import ComparisonCell from './ComparisonCell.vue'
import {
  comparisonTableCellVariants,
  comparisonTableVariants,
  resolveComparisonTableSize,
  resolveComparisonTableVariant,
  type ComparisonTableSize,
  type ComparisonTableVariant,
} from './variants'

/** `true` = check, `false` = cross, text/number = shown as-is, `null`/`undefined`/empty = dash. */
export type ComparisonValue = boolean | string | number | null | undefined

export interface ComparisonColumn {
  /** Stable key (defaults to the index). */
  key?: string
  title: string
  subtitle?: string
  /** Small badge in the header, e.g. "Most popular". */
  badge?: string
  /** Emphasise this column (tinted background in header and cells). */
  highlighted?: boolean
}

export interface ComparisonFeature {
  label: string
  description?: string
  /** One value per column, in column order. Missing entries render as a dash. */
  values: ComparisonValue[]
}

/** A heading row that starts a new group of features. */
export interface ComparisonGroup {
  group: string
}

export type ComparisonRow = ComparisonFeature | ComparisonGroup

export interface ComparisonTableProps extends BaseProps {
  columns?: ComparisonColumn[]
  rows?: ComparisonRow[]
  /** Surface style. Unknown values fall back to `default`. */
  variant?: ComparisonTableVariant
  /** Cell density. Unknown values fall back to `md`. */
  size?: ComparisonTableSize
  /** Accessible name of the table and its scroll region. */
  caption?: string
  /** Keep the header row visible while the table scrolls vertically (give the root a max height, e.g. `class="max-h-96"`). */
  stickyHeader?: boolean
  /** Keep the feature-name column visible while the table scrolls horizontally. On by default; pass `false` to let it scroll with the rest. */
  stickyFirstColumn?: boolean
  /** Text of the top-left header cell. */
  cornerLabel?: string
  /** Screen-reader text for a check. */
  includedLabel?: string
  /** Screen-reader text for a cross. */
  excludedLabel?: string
  /** Screen-reader text for an empty cell. */
  unavailableLabel?: string
}

const props = withDefaults(defineProps<ComparisonTableProps>(), {
  columns: () => [],
  rows: () => [],
  variant: 'default',
  size: 'md',
  stickyHeader: false,
  stickyFirstColumn: true,
  cornerLabel: 'Features',
  includedLabel: 'Included',
  excludedLabel: 'Not included',
  unavailableLabel: 'Not available',
})

const attrs = useAttrs()
const slots = useSlots()

defineSlots<{
  corner?: () => unknown
  'column-header'?: (props: { column: ComparisonColumn; index: number }) => unknown
  'column-footer'?: (props: { column: ComparisonColumn; index: number }) => unknown
  cell?: (props: { value: ComparisonValue; row: ComparisonFeature; column: ComparisonColumn; rowIndex: number; columnIndex: number }) => unknown
  'row-label'?: (props: { row: ComparisonFeature }) => unknown
}>()

interface Section {
  group?: string
  rows: { row: ComparisonFeature; values: ComparisonValue[]; index: number }[]
}

/** Fallback so the table is never unnamed in production; the contract below still reports the missing name. */
const captionText = () => (props.caption?.trim() ? props.caption : null) || (attrs['aria-label'] || attrs['aria-labelledby'] ? undefined : 'Comparison table')

onMounted(async () => {
  await nextTick()
  requireOneOf('ComparisonTable', { caption: props.caption, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'Name the table, for example `caption="Plan comparison"`, so screen reader users can tell tables apart.')
  if (slots['column-header']) return
  const bad = columns.value.findIndex((c) => typeof c.title !== 'string' || c.title.trim() === '')
  if (bad !== -1) requireText('ComparisonTable', `columns[${bad}].title`, undefined, 'Its column header would be empty. Fill the `column-header` slot instead if the header is custom.')
})

const variant = computed(() => resolveComparisonTableVariant(props.variant))
const size = computed(() => resolveComparisonTableSize(props.size))
const columns = computed(() => props.columns.filter((c) => !!c && typeof c === 'object'))
const colspan = computed(() => columns.value.length + 1)

const sections = computed<Section[]>(() => {
  const out: Section[] = []
  let current: Section | undefined
  let index = 0
  for (const r of props.rows) {
    if (!r || typeof r !== 'object') continue
    if ('group' in r) {
      if (typeof r.group !== 'string') continue
      current = { group: r.group, rows: [] }
      out.push(current)
    } else if (typeof r.label === 'string') {
      if (!current) {
        current = { rows: [] }
        out.push(current)
      }
      current.rows.push({ row: r, values: Array.isArray(r.values) ? r.values : [], index: index++ })
    }
  }
  return out
})

const classes = computed(() => cn(comparisonTableVariants({ variant: variant.value }), focusRing, props.class))
const cell = computed(() => comparisonTableCellVariants({ size: size.value, variant: variant.value }))
/** Opaque so a sticky header never shows rows scrolling underneath it. */
const headTint = 'bg-accent text-accent-foreground'

const cornerSticky = computed(() =>
  cn(
    (props.stickyHeader || props.stickyFirstColumn) && 'sticky bg-background',
    props.stickyHeader && 'top-0',
    props.stickyFirstColumn && 'start-0',
    props.stickyHeader && props.stickyFirstColumn ? 'z-20' : (props.stickyHeader || props.stickyFirstColumn) && 'z-10',
  ),
)

function headClasses(highlighted: boolean | undefined) {
  return cn(
    cell.value,
    'text-start font-semibold',
    props.stickyHeader && 'sticky top-0 z-10 bg-background',
    highlighted && headTint,
  )
}
function cellClasses(highlighted: boolean | undefined, striped: boolean) {
  return cn(cell.value, 'text-center', striped && 'bg-muted/40', highlighted && 'bg-primary/5')
}
</script>

<template>
  <div
    data-slot="comparison-table"
    role="region"
    tabindex="0"
    :aria-label="captionText()"
    :data-variant="variant"
    :data-size="size"
    :data-sticky-header="stickyHeader ? '' : undefined"
    :class="classes"
  >
    <table data-slot="comparison-table-table" class="w-full min-w-xl border-collapse text-start">
      <caption v-if="captionText()" class="sr-only">{{ captionText() }}</caption>
      <thead data-slot="comparison-table-head">
        <tr>
          <th
            scope="col"
            data-slot="comparison-table-corner"
            :class="cn(cell, 'text-start font-medium text-muted-foreground', cornerSticky)"
          >
            <slot name="corner">{{ cornerLabel }}</slot>
          </th>
          <th
            v-for="(col, ci) in columns"
            :key="col.key ?? ci"
            scope="col"
            data-slot="comparison-table-column"
            :data-highlighted="col.highlighted ? '' : undefined"
            :class="cn(headClasses(col.highlighted), 'text-center')"
          >
            <slot name="column-header" :column="col" :index="ci">
              <Badge v-if="col.badge" data-slot="comparison-table-badge" class="mb-1">{{ col.badge }}</Badge>
              <span class="block">{{ col.title }}</span>
              <span v-if="col.subtitle" class="block text-xs font-normal text-muted-foreground">{{ col.subtitle }}</span>
            </slot>
          </th>
        </tr>
      </thead>
      <tbody v-for="(section, si) in sections" :key="si" data-slot="comparison-table-section">
        <tr v-if="section.group !== undefined" data-slot="comparison-table-group" class="border-t">
          <th
            scope="rowgroup"
            :colspan="colspan"
            :class="cn(cell, 'bg-muted text-start text-sm font-semibold text-muted-foreground')"
          >
            {{ section.group }}
          </th>
        </tr>
        <tr v-for="r in section.rows" :key="r.index" data-slot="comparison-table-row" class="border-t">
          <th
            scope="row"
            data-slot="comparison-table-row-header"
            :class="cn(cell, 'text-start font-medium', stickyFirstColumn && 'sticky start-0 z-1 bg-background')"
          >
            <slot name="row-label" :row="r.row">
              {{ r.row.label }}
              <span v-if="r.row.description" class="block text-xs font-normal text-muted-foreground">{{ r.row.description }}</span>
            </slot>
          </th>
          <td
            v-for="(col, ci) in columns"
            :key="col.key ?? ci"
            data-slot="comparison-table-cell"
            :data-highlighted="col.highlighted ? '' : undefined"
            :class="cellClasses(col.highlighted, variant === 'striped' && r.index % 2 === 1)"
          >
            <slot name="cell" :value="r.values[ci]" :row="r.row" :column="col" :row-index="r.index" :column-index="ci">
              <ComparisonCell
                :value="r.values[ci]"
                :included-label="includedLabel"
                :excluded-label="excludedLabel"
                :unavailable-label="unavailableLabel"
              />
            </slot>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="$slots['column-footer']" data-slot="comparison-table-foot">
        <tr class="border-t">
          <td :class="cell" />
          <td v-for="(col, ci) in columns" :key="col.key ?? ci" :data-highlighted="col.highlighted ? '' : undefined" :class="cellClasses(col.highlighted, false)">
            <slot name="column-footer" :column="col" :index="ci" />
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
