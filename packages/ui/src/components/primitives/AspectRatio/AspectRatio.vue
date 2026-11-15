<script setup lang="ts">
import { computed } from 'vue'
import { AspectRatio as RekaAspectRatio, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { aspectRatioVariants, type AspectRatioFit, type AspectRatioRounded, type AspectRatioVariant } from './variants'

export interface AspectRatioProps extends BaseProps {
  /** Width / height, e.g. `16 / 9` or `1`. Non-finite or <= 0 falls back to 16 / 9. */
  ratio?: number
  /** Corner radius, with the content clipped to it: `none` (default), `md`, `lg` or `full` (a circle for a square ratio). */
  rounded?: AspectRatioRounded
  /** Surface: `plain` (default), `bordered` (1px border) or `muted` (placeholder background). */
  variant?: AspectRatioVariant
  /** How a direct `img` or `video` child fills the box: `none` (default, left alone), `cover`, `contain` or `fill`. */
  fit?: AspectRatioFit
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const DEFAULT_RATIO = 16 / 9
const ROUNDED: readonly AspectRatioRounded[] = ['none', 'md', 'lg', 'full']
const VARIANTS: readonly AspectRatioVariant[] = ['plain', 'bordered', 'muted']
const FITS: readonly AspectRatioFit[] = ['none', 'cover', 'contain', 'fill']

const props = withDefaults(defineProps<AspectRatioProps>(), { ratio: DEFAULT_RATIO, rounded: 'none', variant: 'plain', fit: 'none' })

const safeRatio = computed(() => (Number.isFinite(props.ratio) && props.ratio > 0 ? props.ratio : DEFAULT_RATIO))
const classes = computed(() =>
  cn(
    aspectRatioVariants({
      rounded: ROUNDED.includes(props.rounded) ? props.rounded : 'none',
      variant: VARIANTS.includes(props.variant) ? props.variant : 'plain',
      fit: FITS.includes(props.fit) ? props.fit : 'none',
    }),
    props.class,
  ),
)
</script>

<template>
  <RekaAspectRatio data-slot="aspect-ratio" :ratio="safeRatio" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </RekaAspectRatio>
</template>
