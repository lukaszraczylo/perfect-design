<script setup lang="ts">
import { computed, provide } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { LIST_GAPS, LIST_SIZES, LIST_SIZE_KEY, LIST_VARIANTS, LIST_VARIANT_KEY, listGaps, listVariants, type ListGap, type ListSize, type ListVariant } from './variants'

export interface ListProps extends BaseProps {
  /** Element to render. Use `ol` for ordered lists. */
  as?: PrimitiveProps['as']
  asChild?: boolean
  /**
   * `plain`, `divided`, `card`, `interactive` (all rows clickable) or `with-avatar`.
   * When omitted the legacy `divided` prop decides (dividers by default). Unknown values behave as omitted.
   */
  variant?: ListVariant
  /** Row padding and text size: `sm`, `md` (default) or `lg`. Unknown values behave as `md`. */
  size?: ListSize
  /** Space between rows: `none`, `sm`, `md` or `lg`. Applies to `plain` and `card` lists (card rows default to `md`); divided variants ignore it. */
  gap?: ListGap
  /** Draw dividers between items (used when `variant` is not set). */
  divided?: boolean
  /** Draw a rounded border around the whole list. */
  bordered?: boolean
}

// role="list" below restores list semantics that Safari drops when list-style is none.
const props = withDefaults(defineProps<ListProps>(), { as: 'ul', variant: undefined, size: 'md', gap: undefined, divided: true })
const explicit = computed(() => (props.variant && LIST_VARIANTS.includes(props.variant) ? props.variant : undefined))
const effective = computed<ListVariant>(() => explicit.value ?? (props.divided ? 'divided' : 'plain'))
const size = computed<ListSize>(() => (LIST_SIZES.includes(props.size) ? props.size : 'md'))
const gapClass = computed(() => (props.gap && LIST_GAPS.includes(props.gap) && (effective.value === 'plain' || effective.value === 'card') ? listGaps[props.gap] : undefined))
provide(LIST_VARIANT_KEY, explicit)
provide(LIST_SIZE_KEY, size)
const classes = computed(() => cn(listVariants({ variant: effective.value }), gapClass.value, props.bordered && 'overflow-hidden rounded-lg border', props.class))
</script>

<template>
  <Primitive data-slot="list" role="list" :data-variant="explicit" :data-size="size === 'md' ? undefined : size" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
