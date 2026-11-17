<script setup lang="ts">
import { computed, provide } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { LIST_GAPS, LIST_MARKERS, LIST_MARKER_KEY, LIST_SIZES, LIST_SIZE_KEY, LIST_VARIANTS, LIST_VARIANT_KEY, listGaps, listMarkerClasses, listVariants, type ListGap, type ListMarker, type ListSize, type ListVariant } from './variants'

export interface ListProps extends BaseProps {
  /** Element to render. Defaults to `ul`, or `ol` when `marker` is `decimal`. */
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
  /**
   * `none` (default), `disc` or `decimal`: real list markers for hand-authored bulleted or numbered text.
   * A marked list is a plain block, so `variant`, `divided` and `gap` do not apply. Unknown values behave as `none`.
   */
  marker?: ListMarker
  /** Draw a rounded border around the whole list. */
  bordered?: boolean
}

// role="list" below restores list semantics that Safari drops when list-style is none.
const props = withDefaults(defineProps<ListProps>(), { as: undefined, marker: 'none', variant: undefined, size: 'md', gap: undefined, divided: true })
const explicit = computed(() => (props.variant && LIST_VARIANTS.includes(props.variant) ? props.variant : undefined))
const effective = computed<ListVariant>(() => explicit.value ?? (props.divided ? 'divided' : 'plain'))
const size = computed<ListSize>(() => (LIST_SIZES.includes(props.size) ? props.size : 'md'))
const gapClass = computed(() => (props.gap && LIST_GAPS.includes(props.gap) && (effective.value === 'plain' || effective.value === 'card') ? listGaps[props.gap] : undefined))
const marker = computed<ListMarker>(() => (LIST_MARKERS.includes(props.marker) ? props.marker : 'none'))
const tag = computed(() => props.as ?? (marker.value === 'decimal' ? 'ol' : 'ul'))
provide(LIST_MARKER_KEY, marker)
provide(LIST_VARIANT_KEY, explicit)
provide(LIST_SIZE_KEY, size)
const classes = computed(() =>
  marker.value !== 'none'
    ? cn(listMarkerClasses[marker.value], props.bordered && 'overflow-hidden rounded-lg border', props.class)
    : cn(listVariants({ variant: effective.value }), gapClass.value, props.bordered && 'overflow-hidden rounded-lg border', props.class),
)
</script>

<template>
  <Primitive data-slot="list" role="list" :data-variant="explicit" :data-marker="marker === 'none' ? undefined : marker" :data-size="size === 'md' ? undefined : size" :as="tag" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
