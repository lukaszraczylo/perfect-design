<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { tableContextKey } from './context'
import { tableCellVariants, type TableAlign } from './variants'

export interface TableCellProps extends BaseProps {
  align?: TableAlign
  /** Right-aligns and uses tabular figures. An explicit `align` still wins. */
  numeric?: boolean
  /** Vertical alignment inside the row: `middle` (default), `top` (for rows with multi-line neighbours) or `bottom`. */
  valign?: 'top' | 'middle' | 'bottom'
  /**
   * Column name shown before the value when the parent `Table` uses `layout="cards"` below the `sm` breakpoint. It is
   * visual only (`aria-hidden`): the column header already names the cell for assistive technology.
   */
  label?: string
}

const props = defineProps<TableCellProps>()
const ctx = inject(tableContextKey, null)
const cards = computed(() => ctx?.layout() === 'cards')
const labelled = computed(() => cards.value && !!props.label)
const classes = computed(() =>
  cn(
    tableCellVariants({
      align: props.align ?? (props.numeric ? 'right' : 'left'),
      numeric: !!props.numeric,
      valign: props.valign,
      density: ctx?.density(),
      size: ctx?.size(),
      layout: ctx?.layout(),
    }),
    props.class,
  ),
)
</script>

<template>
  <td data-slot="table-cell" :role="cards ? 'cell' : undefined" :class="classes">
    <template v-if="labelled">
      <span data-slot="table-cell-label" aria-hidden="true" class="hidden shrink-0 text-start font-medium text-muted-foreground max-sm:inline">{{ label }}</span>
      <span data-slot="table-cell-value" class="min-w-0 break-words max-sm:flex-1 max-sm:text-end"><slot /></span>
    </template>
    <slot v-else />
  </td>
</template>
