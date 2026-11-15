<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, useId } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { tableContextKey } from './context'
import { tableCaptionCardsClasses } from './variants'

export interface TableCaptionProps extends BaseProps {
  /** Visually hide the caption but keep it for assistive tech (`sr-only`). */
  hidden?: boolean
}

const props = defineProps<TableCaptionProps>()
const id = useId()
const ctx = inject(tableContextKey, null)
onMounted(() => ctx?.setCaptionId(id))
onBeforeUnmount(() => ctx?.setCaptionId(undefined))
const classes = computed(() => cn('mt-3 text-sm text-muted-foreground', ctx?.layout() === 'cards' && tableCaptionCardsClasses, props.hidden && 'sr-only', props.class))
</script>

<template>
  <caption :id="id" data-slot="table-caption" :class="classes"><slot /></caption>
</template>
