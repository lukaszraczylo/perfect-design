<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { tableContextKey } from './context'
import { tableBodyCardsClasses } from './variants'

const props = defineProps<BaseProps>()
const ctx = inject(tableContextKey, null)
const cards = computed(() => ctx?.layout() === 'cards')
const classes = computed(() => cn(cards.value ? tableBodyCardsClasses : '[&_tr:last-child]:border-0', props.class))
</script>

<template>
  <tbody data-slot="table-body" :role="cards ? 'rowgroup' : undefined" :class="classes"><slot /></tbody>
</template>
