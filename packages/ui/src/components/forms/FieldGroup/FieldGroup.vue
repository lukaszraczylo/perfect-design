<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'

export interface FieldGroupProps {
  /** `vertical` stacks fields; `horizontal` lays them out in a wrapping row. Ignored when `columns` > 1. */
  orientation?: 'vertical' | 'horizontal'
  /** Responsive grid with 1-3 columns (collapses to one column on small screens). Invalid values fall back to 1. */
  columns?: 1 | 2 | 3
  /** Space between fields: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  gap?: 'sm' | 'md' | 'lg'
  /** Accessible name. When set the wrapper gets `role="group"` and `aria-label`. Use `Fieldset` when the group needs a visible legend. */
  label?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<FieldGroupProps>(), { orientation: 'vertical', columns: 1, gap: 'md' })

const GAPS = {
  sm: { grid: 'gap-x-3 gap-y-3', row: 'gap-2', stack: 'gap-3' },
  md: { grid: 'gap-x-4 gap-y-5', row: 'gap-4', stack: 'gap-5' },
  lg: { grid: 'gap-x-6 gap-y-8', row: 'gap-6', stack: 'gap-8' },
} as const

const GRID = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
} as const

const gapKey = computed<keyof typeof GAPS>(() => (Object.hasOwn(GAPS, props.gap) ? props.gap : 'md'))

const layout = computed(() => {
  const gap = GAPS[gapKey.value]
  const cols = Number(props.columns)
  if (cols === 2 || cols === 3) return `grid grid-cols-1 items-start ${gap.grid} ${GRID[cols]}`
  return props.orientation === 'horizontal' ? `flex flex-row flex-wrap items-start ${gap.row} *:min-w-0 *:grow *:basis-48` : `flex flex-col ${gap.stack}`
})
const classes = computed(() => cn('w-full', layout.value, props.class))
</script>

<template>
  <div
    data-slot="field-group"
    :data-orientation="orientation"
    :data-gap="gapKey"
    :role="label ? 'group' : undefined"
    :aria-label="label || undefined"
    :class="classes"
  >
    <slot />
  </div>
</template>
