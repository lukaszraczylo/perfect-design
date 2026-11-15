<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { KBD_SIZES, KBD_VARIANTS, kbdVariants, type KbdSize, type KbdVariant } from './variants'

export interface KbdProps extends BaseProps {
  /** Surface: `default` (muted fill), `outline`, `ghost` (no border or fill) or `solid` (inverted). */
  variant?: KbdVariant
  /** Chip height: `xs` 16px, `sm` 20px, `md` 24px, `lg` 28px. */
  size?: KbdSize
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<KbdProps>(), { variant: 'default', size: 'md', as: 'kbd' })
const variant = computed<KbdVariant>(() => (KBD_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<KbdSize>(() => (KBD_SIZES.includes(props.size) ? props.size : 'md'))
const classes = computed(() => cn(kbdVariants({ variant: variant.value, size: size.value }), props.class))
</script>

<template>
  <Primitive data-slot="kbd" :as="as" :class="classes">
    <slot />
  </Primitive>
</template>
