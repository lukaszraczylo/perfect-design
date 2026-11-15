<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  badgeDotVariants,
  badgeVariants,
  type BadgeRounded,
  type BadgeSize,
  type BadgeTone,
  type BadgeVariant,
} from './variants'

export interface BadgeProps extends BaseProps {
  /** Look. `soft`, `solid` and `outline` combine with `tone`; the others have fixed colours. */
  variant?: BadgeVariant
  /** Semantic colour for the `soft`, `solid` and `outline` variants. Ignored by the fixed-colour variants. */
  tone?: BadgeTone
  size?: BadgeSize
  /** Corner radius: `default` (rounded-md), `full` (pill) or `none`. */
  rounded?: BadgeRounded
  /** Shows a small status dot (current text colour) before the content. Not rendered with `asChild`. */
  dot?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<BadgeProps>(), { variant: 'default', size: 'md', rounded: 'default', as: 'span' })

const VARIANTS: readonly BadgeVariant[] = ['default', 'secondary', 'outline', 'destructive', 'success', 'warning', 'info', 'soft', 'solid']
const TONES: readonly BadgeTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
const SIZES: readonly BadgeSize[] = ['sm', 'md', 'lg']
const ROUNDED: readonly BadgeRounded[] = ['default', 'full', 'none']

const variant = computed<BadgeVariant>(() => (VARIANTS.includes(props.variant) ? props.variant : 'default'))
const tone = computed<BadgeTone | undefined>(() => {
  if (props.tone && TONES.includes(props.tone)) return props.tone
  return undefined
})
const size = computed<BadgeSize>(() => (SIZES.includes(props.size) ? props.size : 'md'))
const rounded = computed<BadgeRounded>(() => (ROUNDED.includes(props.rounded) ? props.rounded : 'default'))

const classes = computed(() =>
  cn(badgeVariants({ variant: variant.value, tone: tone.value, size: size.value, rounded: rounded.value }), props.class),
)
const dotClasses = computed(() => badgeDotVariants({ size: size.value }))
</script>

<template>
  <Primitive data-slot="badge" :as="as" :as-child="asChild" :class="classes">
    <slot v-if="asChild" />
    <template v-else>
      <span v-if="dot" data-slot="badge-dot" aria-hidden="true" :class="dotClasses" />
      <slot />
    </template>
  </Primitive>
</template>
