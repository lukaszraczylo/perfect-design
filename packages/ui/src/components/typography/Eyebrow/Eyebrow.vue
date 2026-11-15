<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  eyebrowDotClasses,
  eyebrowRuleClasses,
  eyebrowSizes,
  eyebrowTones,
  eyebrowVariantNames,
  eyebrowVariants,
  type EyebrowSize,
  type EyebrowTone,
  type EyebrowVariant,
} from './variants'

export interface EyebrowProps extends BaseProps {
  /** Text colour: `primary` (default), `muted` or `foreground`. Unknown values fall back to `primary`. */
  tone?: EyebrowTone
  /** Text size: `xs`, `sm` (default) or `md`. Unknown values fall back to `sm`. */
  size?: EyebrowSize
  /** `plain` (default), `rule` (decorative hairline after the text) or `dot` (decorative dot before it). Ignored with `asChild`. Unknown values fall back to `plain`. */
  variant?: EyebrowVariant
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<EyebrowProps>(), { tone: 'primary', size: 'sm', variant: 'plain', as: 'p' })

const tone = computed<EyebrowTone>(() => (eyebrowTones.includes(props.tone) ? props.tone : 'primary'))
const size = computed<EyebrowSize>(() => (eyebrowSizes.includes(props.size) ? props.size : 'sm'))
const variant = computed<EyebrowVariant>(() => (eyebrowVariantNames.includes(props.variant) ? props.variant : 'plain'))
/** The decoration needs extra markup, so `asChild` (which renders only the child) always behaves like `plain`. */
const decorated = computed(() => !props.asChild && variant.value !== 'plain')
const classes = computed(() =>
  cn(eyebrowVariants({ tone: tone.value, size: size.value, variant: props.asChild ? 'plain' : variant.value }), props.class),
)
</script>

<template>
  <Primitive data-slot="eyebrow" :as="as" :as-child="asChild" :data-variant="decorated ? variant : undefined" :class="classes">
    <template v-if="decorated">
      <span v-if="variant === 'dot'" data-slot="eyebrow-dot" aria-hidden="true" :class="eyebrowDotClasses" />
      <span data-slot="eyebrow-label" class="min-w-0"><slot /></span>
      <span v-if="variant === 'rule'" data-slot="eyebrow-rule" aria-hidden="true" :class="eyebrowRuleClasses" />
    </template>
    <slot v-else />
  </Primitive>
</template>
