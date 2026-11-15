<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { tableContextKey } from './context'
import { tableFooterCardsClasses } from './variants'

const props = defineProps<BaseProps>()
const ctx = inject(tableContextKey, null)
const cards = computed(() => ctx?.layout() === 'cards')
const classes = computed(() => cn('border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0', cards.value && tableFooterCardsClasses, props.class))
</script>

<template>
  <tfoot data-slot="table-footer" :role="cards ? 'rowgroup' : undefined" :class="classes"><slot /></tfoot>
</template>
