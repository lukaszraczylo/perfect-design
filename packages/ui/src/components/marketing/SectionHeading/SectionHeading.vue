<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { requireText } from '../../../lib/contract'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { headingTag, oneOf } from '../shared/pick'
import {
  sectionHeadingActionsVariants,
  sectionHeadingAlignNames,
  sectionHeadingDescriptionVariants,
  sectionHeadingEyebrowNames,
  sectionHeadingEyebrowVariants,
  sectionHeadingSizeNames,
  sectionHeadingTitleVariants,
  sectionHeadingVariants,
  type SectionHeadingAlign,
  type SectionHeadingEyebrowStyle,
  type SectionHeadingSize,
} from './variants'

export interface SectionHeadingProps extends BaseProps {
  eyebrow?: string
  title?: string
  description?: string
  /** Text alignment; center/right also position the block. Unknown values fall back to `left`. */
  align?: SectionHeadingAlign
  /** Max width of the block and type scale (`sm` | `md` | `lg` | `full`). Unknown values fall back to `md`. */
  size?: SectionHeadingSize
  /** Eyebrow look: plain accent text (default) or a bordered badge. Unknown values fall back to `text`. */
  eyebrowStyle?: SectionHeadingEyebrowStyle
  /** Short accent rule between the title and the description. */
  divider?: boolean
  /** Heading element level 1-6. Invalid values fall back to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<SectionHeadingProps>(), {
  align: 'left',
  size: 'md',
  eyebrowStyle: 'text',
  divider: false,
  level: 2,
  as: 'div',
})

const slots = useSlots()
onMounted(async () => {
  await nextTick()
  if (!slots.title) requireText('SectionHeading', 'title', props.title, 'Without it the section has no heading. Fill the `title` slot for custom markup.')
})

const tag = computed(() => headingTag(props.level, 'h2'))
const align = computed(() => oneOf(props.align, sectionHeadingAlignNames, 'left'))
const size = computed(() => oneOf(props.size, sectionHeadingSizeNames, 'md'))
const eyebrowStyle = computed(() => oneOf(props.eyebrowStyle, sectionHeadingEyebrowNames, 'text'))
const classes = computed(() => cn(sectionHeadingVariants({ align: align.value, size: size.value }), props.class))
</script>

<template>
  <Primitive data-slot="section-heading" :as="as" :data-align="align" :data-size="size" :class="classes">
    <p
      v-if="eyebrow || $slots.eyebrow"
      data-slot="section-heading-eyebrow"
      :data-style="eyebrowStyle"
      :class="cn(sectionHeadingEyebrowVariants({ style: eyebrowStyle }))"
    >
      <slot name="eyebrow">{{ eyebrow }}</slot>
    </p>
    <component
      :is="tag"
      v-if="title || $slots.title"
      data-slot="section-heading-title"
      :class="cn(sectionHeadingTitleVariants({ size }))"
    >
      <slot name="title">{{ title }}</slot>
    </component>
    <span v-if="divider" data-slot="section-heading-divider" aria-hidden="true" class="my-1 block h-0.5 w-12 bg-primary" />
    <p v-if="description || $slots.description" data-slot="section-heading-description" :class="cn(sectionHeadingDescriptionVariants({ size }))">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.default || $slots.actions" data-slot="section-heading-actions" :class="cn(sectionHeadingActionsVariants({ align }))">
      <slot name="actions" />
      <slot />
    </div>
  </Primitive>
</template>
