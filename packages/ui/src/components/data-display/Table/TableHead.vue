<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { tableContextKey } from './context'
import { tableHeadVariants, type TableAlign } from './variants'

export interface TableHeadProps extends BaseProps {
  align?: TableAlign
  /** `th` scope. Use `row` for row headers. */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
}

const props = withDefaults(defineProps<TableHeadProps>(), { align: 'left', scope: 'col' })
const ctx = inject(tableContextKey, null)
const cards = computed(() => ctx?.layout() === 'cards')
const classes = computed(() =>
  cn(tableHeadVariants({ align: props.align, density: ctx?.density(), size: ctx?.size(), variant: props.scope === 'row' ? 'default' : ctx?.variant(), layout: ctx?.layout() }), props.class),
)
const role = computed(() => (!cards.value ? undefined : props.scope === 'row' || props.scope === 'rowgroup' ? 'rowheader' : 'columnheader'))

const el = ref<HTMLElement | null>(null)
useMountedCheck(() => {
  const th = el.value
  if (!th) return
  if (th.parentElement?.tagName !== 'TR') {
    violation('TableHead', 'requires-table-row', 'must be rendered inside a TableRow. Use `TableHeader > TableRow > TableHead`.')
  } else if ((props.scope === 'col' || props.scope === 'colgroup') && !th.closest('thead')) {
    violation('TableHead', 'requires-table-header', 'with `scope="col"` must be inside TableHeader > TableRow. Use `scope="row"` for a row header inside TableBody.')
  }
})
</script>

<template>
  <th ref="el" data-slot="table-head" :role="role" :scope="scope" :class="classes"><slot /></th>
</template>
