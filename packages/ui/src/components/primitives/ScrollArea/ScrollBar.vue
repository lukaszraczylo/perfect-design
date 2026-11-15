<script setup lang="ts">
import { computed } from 'vue'
import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { scrollBarVariants, scrollThumbVariants, type ScrollBarSize, type ScrollBarVariant } from './variants'

export interface ScrollBarProps extends BaseProps {
  orientation?: 'vertical' | 'horizontal'
  /** Keep the bar mounted even when there is nothing to scroll. */
  forceMount?: boolean
  /** Thickness of the bar: `sm` (6px), `md` (10px, default) or `lg` (16px). Unknown values fall back to md. */
  size?: ScrollBarSize
  /** Look: `default` (faint thumb), `track` (visible track behind the thumb) or `solid` (high-contrast thumb). Unknown values fall back to default. */
  variant?: ScrollBarVariant
}

const props = withDefaults(defineProps<ScrollBarProps>(), { orientation: 'vertical', forceMount: undefined, size: 'md', variant: 'default' })

const SIZES: readonly ScrollBarSize[] = ['sm', 'md', 'lg']
const VARIANTS: readonly ScrollBarVariant[] = ['default', 'track', 'solid']
const size = computed<ScrollBarSize>(() => (SIZES.includes(props.size) ? props.size : 'md'))
const variant = computed<ScrollBarVariant>(() => (VARIANTS.includes(props.variant) ? props.variant : 'default'))

const classes = computed(() =>
  cn(scrollBarVariants({ orientation: props.orientation === 'horizontal' ? 'horizontal' : 'vertical', size: size.value, variant: variant.value }), props.class),
)
const thumbClasses = computed(() => cn(scrollThumbVariants({ variant: variant.value })))
</script>

<template>
  <ScrollAreaScrollbar data-slot="scroll-area-scrollbar" :orientation="orientation" :force-mount="forceMount" :class="classes">
    <ScrollAreaThumb data-slot="scroll-area-thumb" :class="thumbClasses" />
  </ScrollAreaScrollbar>
</template>
