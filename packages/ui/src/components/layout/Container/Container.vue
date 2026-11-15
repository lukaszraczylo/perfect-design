<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  containerGutters,
  containerPaddingsY,
  containerSizes,
  containerVariants,
  type ContainerGutter,
  type ContainerPaddingY,
  type ContainerSize,
} from './variants'

export interface ContainerProps extends BaseProps {
  /** Max-width preset (Tailwind max-w-sm … max-w-7xl, `prose` = readable measure) or `full`. Unknown values fall back to `7xl`. */
  size?: ContainerSize
  /** Responsive horizontal padding (px-4 sm:px-6 lg:px-8). Ignored when `gutter` is set. */
  padded?: boolean
  /** Horizontal gutter preset (`none` | `sm` | `md` | `lg`). Replaces `padded` when valid; unknown values are ignored. */
  gutter?: ContainerGutter
  /** Vertical padding preset (`none` | `sm` | `md` | `lg`). Unset or unknown adds no vertical padding. */
  paddingY?: ContainerPaddingY
  /** Centre horizontally (mx-auto). */
  centered?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ContainerProps>(), { size: '7xl', padded: true, centered: true, as: 'div' })

const size = computed(() => (containerSizes.includes(props.size) ? props.size : '7xl'))
const gutter = computed(() => (props.gutter && containerGutters.includes(props.gutter) ? props.gutter : undefined))
const paddingY = computed(() => (props.paddingY && containerPaddingsY.includes(props.paddingY) ? props.paddingY : undefined))
const classes = computed(() =>
  cn(
    containerVariants({
      size: size.value,
      padded: gutter.value ? false : props.padded,
      gutter: gutter.value,
      paddingY: paddingY.value,
      centered: props.centered,
    }),
    props.class,
  ),
)
</script>

<template>
  <Primitive data-slot="container" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
