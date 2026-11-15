<script setup lang="ts">
import { computed, provide } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { descriptionListDensityKey, descriptionListKey } from './context'
import {
  DESCRIPTION_LIST_DENSITIES,
  DESCRIPTION_LIST_SIZES,
  DESCRIPTION_LIST_VARIANTS,
  descriptionGridColumns,
  descriptionListVariants,
  type DescriptionListColumns,
  type DescriptionListDensity,
  type DescriptionListSize,
  type DescriptionListVariant,
} from './variants'

export interface DescriptionListProps extends BaseProps {
  /**
   * `stacked` (default) keeps term and value in their own block; `inline` puts term left and value right on one row;
   * `grid` lays items out in responsive columns; `striped` gives alternate items a background inside a framed list.
   */
  variant?: DescriptionListVariant
  /** `stacked` puts the term above the definition; `horizontal` puts them side by side from the `sm` breakpoint. */
  orientation?: 'horizontal' | 'stacked'
  /** Type scale of terms and values: `sm` (12px), `md` (14px, default) or `lg` (16px). Unknown values behave as `md`. */
  size?: DescriptionListSize
  /** Space between items: `compact`, `default` or `comfortable`. Applies to row gaps and to divided or striped item padding. */
  density?: DescriptionListDensity
  /** Draw a divider between items. Ignored by `grid`. */
  divided?: boolean
  /** Column count for `variant="grid"` (responsive: 1 on mobile). */
  columns?: DescriptionListColumns
}

const props = withDefaults(defineProps<DescriptionListProps>(), { variant: 'stacked', orientation: 'stacked', size: 'md', density: 'default', divided: false, columns: 3 })

const variant = computed<DescriptionListVariant>(() => (DESCRIPTION_LIST_VARIANTS.includes(props.variant) ? props.variant : 'stacked'))
const size = computed<DescriptionListSize>(() => (DESCRIPTION_LIST_SIZES.includes(props.size) ? props.size : 'md'))
const density = computed<DescriptionListDensity>(() => (DESCRIPTION_LIST_DENSITIES.includes(props.density) ? props.density : 'default'))
provide(descriptionListKey, () => variant.value)
provide(descriptionListDensityKey, () => density.value)

const classes = computed(() =>
  cn(
    descriptionListVariants({ variant: variant.value, divided: props.divided && variant.value !== 'grid', size: size.value, density: density.value }),
    variant.value === 'grid' && (descriptionGridColumns[props.columns] ?? descriptionGridColumns[3]),
    props.class,
  ),
)
</script>

<template>
  <dl
    data-slot="description-list"
    :data-variant="variant"
    :data-orientation="orientation === 'horizontal' ? 'horizontal' : 'stacked'"
    :data-divided="divided ? 'true' : 'false'"
    :data-size="size === 'md' ? undefined : size"
    :data-density="density === 'default' ? undefined : density"
    :class="classes"
  >
    <slot />
  </dl>
</template>
