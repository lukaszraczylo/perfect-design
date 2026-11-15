<script setup lang="ts">
import { computed } from 'vue'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport, type PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import ScrollBar from './ScrollBar.vue'
import type { ScrollBarSize, ScrollBarVariant } from './variants'

export interface ScrollAreaProps extends BaseProps {
  /** When the scrollbars are visible: on hover, while scrolling, only if overflowing, or always. */
  type?: 'hover' | 'scroll' | 'auto' | 'always'
  /** ms before scrollbars hide again (hover / scroll types). */
  scrollHideDelay?: number
  /** Render the vertical scrollbar. */
  vertical?: boolean
  /** Render the horizontal scrollbar. */
  horizontal?: boolean
  /** Scrollbar thickness: `sm` (6px), `md` (10px, default) or `lg` (16px). Unknown values fall back to md. */
  size?: ScrollBarSize
  /** Scrollbar look: `default` (faint thumb), `track` (visible track behind the thumb) or `solid` (high-contrast thumb). Unknown values fall back to default. */
  variant?: ScrollBarVariant
  /** Classes for the inner viewport element (e.g. `max-h-64`, padding). */
  viewportClass?: HTMLAttributes['class']
  /** Accessible name of the scrolling viewport. It is always a keyboard tab stop (reka-ui sets `tabindex="0"`); with a label it is also exposed as a named `region`. */
  label?: string
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<ScrollAreaProps>(), {
  type: 'hover',
  scrollHideDelay: 600,
  vertical: true,
  horizontal: false,
  size: 'md',
  variant: 'default',
  viewportClass: undefined,
  label: undefined,
})


const rootClasses = computed(() => cn('relative overflow-hidden', props.class))
const viewportClasses = computed(() =>
  cn(
    'size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:ring-inset',
    focusRing,
    props.viewportClass,
  ),
)
</script>

<template>
  <ScrollAreaRoot data-slot="scroll-area" :type="type" :scroll-hide-delay="scrollHideDelay" :as="as" :class="rootClasses">
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      :role="label ? 'region' : undefined"
      :aria-label="label || undefined"
      :class="viewportClasses"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar v-if="vertical" orientation="vertical" :size="size" :variant="variant" />
    <ScrollBar v-if="horizontal" orientation="horizontal" :size="size" :variant="variant" />
    <ScrollAreaCorner v-if="vertical && horizontal" data-slot="scroll-area-corner" />
  </ScrollAreaRoot>
</template>
