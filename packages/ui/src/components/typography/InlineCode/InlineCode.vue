<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  inlineCodeSizes,
  inlineCodeTones,
  inlineCodeVariantNames,
  inlineCodeVariants,
  type InlineCodeSize,
  type InlineCodeTone,
  type InlineCodeVariant,
} from './variants'

export interface InlineCodeProps extends BaseProps {
  /** `default` (muted chip), `outline` (hairline border) or `plain` (monospace text only). Unknown values fall back to `default`. */
  variant?: InlineCodeVariant
  /** Font size: `xs`, `sm` (default), `md` or `lg`. Unknown values fall back to `sm`. */
  size?: InlineCodeSize
  /** `neutral` (default) or `primary` / `success` / `danger` / `info`: tints the chip, the outline or the text depending on `variant`. Unknown values fall back to `neutral`. */
  tone?: InlineCodeTone
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<InlineCodeProps>(), { variant: 'default', size: 'sm', tone: 'neutral', as: 'code' })

const variant = computed<InlineCodeVariant>(() => (inlineCodeVariantNames.includes(props.variant) ? props.variant : 'default'))
const size = computed<InlineCodeSize>(() => (inlineCodeSizes.includes(props.size) ? props.size : 'sm'))
const tone = computed<InlineCodeTone>(() => (inlineCodeTones.includes(props.tone) ? props.tone : 'neutral'))
const classes = computed(() => cn(inlineCodeVariants({ variant: variant.value, size: size.value, tone: tone.value }), props.class))
</script>

<template>
  <Primitive data-slot="inline-code" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
