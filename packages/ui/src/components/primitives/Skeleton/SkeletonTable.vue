<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Skeleton from './Skeleton.vue'
import type { SkeletonAnimation } from './variants'

export interface SkeletonTableProps extends BaseProps {
  /** Body rows (1..50, default 5). */
  rows?: number
  /** Columns (1..12, default 4). */
  columns?: number
  /** Render a header row. Default true. */
  header?: boolean
  animation?: SkeletonAnimation
}

const props = withDefaults(defineProps<SkeletonTableProps>(), { rows: 5, columns: 4, header: true, animation: undefined })
const MAX_ROWS = 50
const MAX_COLUMNS = 12

function clamp(value: unknown, fallback: number, max: number): number {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback
}
const rowCount = computed(() => clamp(props.rows, 5, MAX_ROWS))
const columnCount = computed(() => clamp(props.columns, 4, MAX_COLUMNS))
const classes = computed(() => cn('flex w-full flex-col gap-3', props.class))
const rowStyle = computed(() => ({ gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))` }))
</script>

<template>
  <div data-slot="skeleton-table" aria-hidden="true" :class="classes">
    <div v-if="header" data-slot="skeleton-table-row" data-header class="grid gap-4 border-b border-border pb-3" :style="rowStyle">
      <Skeleton v-for="c in columnCount" :key="c" shape="text" class="h-3 w-2/3" :animation="animation" />
    </div>
    <div v-for="r in rowCount" :key="r" data-slot="skeleton-table-row" class="grid gap-4" :style="rowStyle">
      <Skeleton v-for="c in columnCount" :key="c" shape="text" :animation="animation" />
    </div>
  </div>
</template>
