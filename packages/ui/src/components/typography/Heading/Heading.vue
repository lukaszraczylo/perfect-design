<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { Eyebrow, type EyebrowTone } from '../Eyebrow'
import {
  headingAligns,
  headingDefaultSizes,
  headingDescriptionSizes,
  headingDescriptionVariants,
  headingGroupVariants,
  headingSizes,
  headingVariantNames,
  headingVariants,
  type HeadingAlign,
  type HeadingLevel,
  type HeadingSize,
  type HeadingTone,
  type HeadingVariant,
  type HeadingWeight,
} from './variants'

defineOptions({ inheritAttrs: false })

export interface HeadingProps extends BaseProps {
  /** Semantic level 1-6 (renders h1-h6). Invalid values fall back to 2. */
  level?: HeadingLevel | `${HeadingLevel}`
  /** Visual size, independent from `level`. Defaults to a size matching the level. */
  size?: HeadingSize
  weight?: HeadingWeight
  tone?: HeadingTone
  /** Decoration: plain, short accent bar underneath, or a full-width divider. */
  variant?: HeadingVariant
  /** Text alignment. In a group (eyebrow/description) it aligns all three lines. Not set by default. */
  align?: HeadingAlign
  /** Balance line lengths (`text-wrap: balance`). */
  balance?: boolean
  /** Small plain label above the heading. Use it only when it adds information the heading lacks. The `eyebrow` slot overrides it. */
  eyebrow?: string
  /** Colour of the eyebrow. */
  eyebrowTone?: EyebrowTone
  /** Supporting paragraph below the heading. The `description` slot overrides it. */
  description?: string
  /** Classes for the wrapper rendered when an eyebrow or description is present. */
  groupClass?: BaseProps['class']
  /** Element or component to render as; overrides the h1-h6 tag but keeps the styles. */
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<HeadingProps>(), {
  level: 2,
  weight: 'semibold',
  tone: 'default',
  variant: 'default',
  balance: false,
})
const slots = useSlots()

const safeLevel = computed<HeadingLevel>(() => {
  const n = Number(props.level)
  return Number.isInteger(n) && n >= 1 && n <= 6 ? (n as HeadingLevel) : 2
})

const tag = computed(() => props.as ?? `h${safeLevel.value}`)

const visualSize = computed<HeadingSize>(() =>
  props.size && headingSizes.includes(props.size) ? props.size : headingDefaultSizes[safeLevel.value],
)

const variant = computed<HeadingVariant>(() => (headingVariantNames.includes(props.variant) ? props.variant : 'default'))
const align = computed<HeadingAlign | undefined>(() => (props.align && headingAligns.includes(props.align) ? props.align : undefined))

const hasEyebrow = computed(() => Boolean(props.eyebrow) || Boolean(slots.eyebrow))
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description))
const grouped = computed(() => hasEyebrow.value || hasDescription.value)

const classes = computed(() =>
  cn(
    headingVariants({
      size: visualSize.value,
      weight: props.weight,
      tone: props.tone,
      balance: props.balance,
      variant: variant.value,
      align: align.value,
    }),
    props.class,
  ),
)
const groupClasses = computed(() => cn(headingGroupVariants({ align: align.value }), props.groupClass))
const descriptionClasses = computed(() => headingDescriptionVariants({ size: headingDescriptionSizes[visualSize.value] }))
</script>

<template>
  <div v-if="grouped" data-slot="heading-group" :class="groupClasses">
    <Eyebrow v-if="hasEyebrow" :tone="eyebrowTone"><slot name="eyebrow">{{ eyebrow }}</slot></Eyebrow>
    <Primitive v-bind="$attrs" data-slot="heading" :as="tag" :as-child="asChild" :class="classes">
      <slot />
    </Primitive>
    <p v-if="hasDescription" data-slot="heading-description" :class="descriptionClasses">
      <slot name="description">{{ description }}</slot>
    </p>
  </div>
  <Primitive v-else v-bind="$attrs" data-slot="heading" :as="tag" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
