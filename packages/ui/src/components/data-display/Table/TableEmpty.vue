<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { tableContextKey } from './context'

export interface TableEmptyProps extends BaseProps {
  /** Number of columns the message spans. */
  colspan?: number
}

const props = withDefaults(defineProps<TableEmptyProps>(), { colspan: 1 })
const ctx = inject(tableContextKey, null)
const cards = computed(() => ctx?.layout() === 'cards')
const span = computed(() => (Number.isFinite(props.colspan) && props.colspan >= 1 ? Math.floor(props.colspan) : 1))
const SIZE = { sm: 'text-xs', md: '', lg: 'text-base' } as const
const classes = computed(() => cn('h-24 p-3 text-center text-sm text-muted-foreground', SIZE[ctx?.size() ?? 'md'], props.class))
</script>

<template>
  <tr data-slot="table-empty" :role="cards ? 'row' : undefined" class="border-b border-border">
    <td data-slot="table-empty-cell" :role="cards ? 'cell' : undefined" :colspan="span" :class="classes"><slot>No results</slot></td>
  </tr>
</template>
