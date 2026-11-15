<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { STAT_GROUP_GAPS, statGroupVariants, type StatGroupGap, type StatGroupLayout } from './variants'

export interface StatGroupProps extends BaseProps {
  /** Fixed column count at `lg` (1-6). `auto` fits as many 12rem+ tiles per row as possible. Ignored by `layout="inline"`. */
  columns?: 'auto' | 1 | 2 | 3 | 4 | 5 | 6
  /** `grid` separate tiles, `inline` wrapping flex row, `divided` one bordered surface with dividers. */
  layout?: StatGroupLayout
  /** Space between tiles: `none`, `sm` (0.5rem), `md` (1rem, default), `lg` (1.5rem). Ignored by `layout="divided"`, which keeps its hairline rules. */
  gap?: StatGroupGap
}

const props = withDefaults(defineProps<StatGroupProps>(), { columns: 'auto', layout: 'grid', gap: 'md' })

const COLUMNS = {
  auto: 'grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]',
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
} as const
const layout = computed<StatGroupLayout>(() => (props.layout === 'inline' || props.layout === 'divided' ? props.layout : 'grid'))
const gap = computed<StatGroupGap>(() => (STAT_GROUP_GAPS.includes(props.gap) ? props.gap : 'md'))
const classes = computed(() =>
  cn(statGroupVariants({ layout: layout.value, gap: gap.value }), layout.value !== 'inline' && (COLUMNS[props.columns] ?? COLUMNS.auto), props.class),
)
</script>

<template>
  <div data-slot="stat-group" role="group" :data-layout="layout === 'grid' ? undefined : layout" :data-gap="gap === 'md' ? undefined : gap" :class="classes">
    <slot />
  </div>
</template>
