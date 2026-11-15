<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { tableContextKey } from './context'
import { tableHeaderCardsClasses } from './variants'

const props = defineProps<BaseProps>()
const ctx = inject(tableContextKey, null)
const cards = computed(() => ctx?.layout() === 'cards')
const classes = computed(() => cn('[&_tr]:border-b', cards.value && tableHeaderCardsClasses, props.class))
</script>

<template>
  <thead data-slot="table-header" :role="cards ? 'rowgroup' : undefined" :class="classes"><slot /></thead>
</template>
