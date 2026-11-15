<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { lookup } from '../Stack/gap'
import {
  spacerHeightClasses,
  spacerLgHeightClasses,
  spacerLgWidthClasses,
  spacerMdHeightClasses,
  spacerMdWidthClasses,
  spacerWidthClasses,
  type SpacerSize,
} from './variants'

export interface SpacerProps extends BaseProps {
  /** Fixed size from the spacing scale (0-6, 8, 10, 12, 14, 16, 20, 24). Omit (or pass an invalid value) for a flexible `flex-1` spacer. */
  size?: SpacerSize
  /** Size from the `md` breakpoint up (mobile-first: `size` is the smallest screen). Ignored without a valid `size`; invalid values are ignored. */
  sizeMd?: SpacerSize
  /** Size from the `lg` breakpoint up. Ignored without a valid `size`; invalid values are ignored. */
  sizeLg?: SpacerSize
  /** Axis a fixed `size` applies to: `vertical` sets a height, `horizontal` a width. */
  axis?: 'vertical' | 'horizontal'
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<SpacerProps>(), { axis: 'vertical', as: 'div' })

const classes = computed(() => {
  const horizontal = props.axis === 'horizontal'
  const fixed = lookup(horizontal ? spacerWidthClasses : spacerHeightClasses, props.size)
  return cn(
    fixed
      ? [
          'shrink-0',
          fixed,
          lookup(horizontal ? spacerMdWidthClasses : spacerMdHeightClasses, props.sizeMd),
          lookup(horizontal ? spacerLgWidthClasses : spacerLgHeightClasses, props.sizeLg),
        ]
      : 'flex-1',
    props.class,
  )
})
</script>

<template>
  <Primitive data-slot="spacer" :as="as" aria-hidden="true" :class="classes" />
</template>
