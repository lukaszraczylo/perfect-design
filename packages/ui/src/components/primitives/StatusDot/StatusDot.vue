<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  STATUS_DOT_SIZES,
  STATUS_DOT_TONES,
  STATUS_DOT_VARIANTS,
  statusDotHaloVariants,
  statusDotVariants,
  type StatusDotSize,
  type StatusDotTone,
  type StatusDotVariant,
} from './variants'

export interface StatusDotProps extends BaseProps {
  tone?: StatusDotTone
  /** Diameter: `xs` 4px, `sm` 6px, `md` 8px, `lg` 10px, `xl` 12px. */
  size?: StatusDotSize
  /** Look: `solid` (filled), `ring` (filled with an outline), `outline` (hollow) or `soft` (tinted fill with a border). */
  variant?: StatusDotVariant
  /** Adds an animated halo (animate-ping). Disabled automatically for users who prefer reduced motion. */
  pulse?: boolean
  /** Accessible name. When set the dot becomes `role="img"` with this name; otherwise it is decorative (`aria-hidden`). Colour is never the only signal, so name it or place it next to text. */
  label?: string
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<StatusDotProps>(), { tone: 'neutral', size: 'md', variant: 'solid', as: 'span' })

const tone = computed<StatusDotTone>(() => (STATUS_DOT_TONES.includes(props.tone) ? props.tone : 'neutral'))
const size = computed<StatusDotSize>(() => (STATUS_DOT_SIZES.includes(props.size) ? props.size : 'md'))
const variant = computed<StatusDotVariant>(() => (STATUS_DOT_VARIANTS.includes(props.variant) ? props.variant : 'solid'))

const classes = computed(() => cn(statusDotVariants({ variant: variant.value, tone: tone.value, size: size.value }), props.class))
const haloClasses = computed(() => statusDotHaloVariants({ variant: variant.value }))
</script>

<template>
  <Primitive
    data-slot="status-dot"
    :as="as"
    :class="classes"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    :data-pulse="pulse ? '' : undefined"
  >
    <span v-if="pulse" data-slot="status-dot-halo" aria-hidden="true" :class="haloClasses" />
  </Primitive>
</template>
