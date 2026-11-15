<script setup lang="ts">
import { computed, inject } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { tableContextKey } from './context'
import {
  tableRowBorderlessClasses,
  tableRowCardsClasses,
  tableRowClasses,
  tableRowSelectedTones,
  tableRowStaticClasses,
  tableRowStripedClasses,
  tableRowStripedHoverClasses,
  type TableSelectedTone,
} from './variants'

export interface TableRowProps extends BaseProps {
  /**
   * Marks the row as selected (`data-state="selected"` + background). Does not add `aria-selected` (not valid on plain
   * table rows); pass `aria-selected` yourself for grid/treegrid tables: the `accent` tone styles it too.
   */
  selected?: boolean
  /** Selected-row emphasis for this row; defaults to the parent Table's `selectedTone`. */
  selectedTone?: TableSelectedTone
}

const props = withDefaults(defineProps<TableRowProps>(), { selectedTone: undefined })
const ctx = inject(tableContextKey, null)
useMountedCheck(() => {
  if (!ctx) violation('TableRow', 'requires-table', 'must be rendered inside a Table (it reads striping, hover and selection tone from it). Wrap the rows in `Table > TableBody`.')
})

const tone = computed<TableSelectedTone>(() => {
  const own = props.selectedTone
  if (own && own in tableRowSelectedTones) return own
  return ctx?.selectedTone() ?? 'muted'
})
const cards = computed(() => ctx?.layout() === 'cards')
const classes = computed(() =>
  cn(
    ctx && !ctx.hoverable() ? tableRowStaticClasses : tableRowClasses,
    ctx?.striped() && tableRowStripedClasses,
    ctx?.striped() && ctx.hoverable() && tableRowStripedHoverClasses,
    tableRowSelectedTones[tone.value],
    ctx?.variant() === 'borderless' && tableRowBorderlessClasses,
    cards.value && tableRowCardsClasses,
    props.class,
  ),
)
</script>

<template>
  <tr data-slot="table-row" :role="cards ? 'row' : undefined" :data-state="selected ? 'selected' : undefined" :class="classes"><slot /></tr>
</template>
