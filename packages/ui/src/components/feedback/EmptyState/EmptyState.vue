<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkAfterMount } from '../requireContent'
import { pick } from '../pick'
import {
  emptyStateActionVariants,
  emptyStateDescriptionVariants,
  emptyStateIconVariants,
  emptyStateIllustrationVariants,
  emptyStateTitleVariants,
  emptyStateVariants,
  EMPTY_STATE_LAYOUTS,
  EMPTY_STATE_SIZES,
  EMPTY_STATE_TONES,
  EMPTY_STATE_VARIANTS,
  type EmptyStateLayout,
  type EmptyStateSize,
  type EmptyStateTone,
  type EmptyStateVariant,
} from './variants'

export interface EmptyStateProps extends BaseProps {
  /** FontAwesome icon shown in a muted circle. Use the `icon` slot for custom artwork. */
  icon?: IconDefinition
  title?: string
  description?: string
  size?: EmptyStateSize
  /**
   * Layout: `default` (centred), `card` (bordered surface), `bordered-dashed` (dashed drop-zone style border),
   * `compact` (dense, for popovers/small panels) or `inline` (single row: icon, text, action).
   */
  variant?: EmptyStateVariant
  /** `center` (default) or `start` (icon, text and action aligned to the start edge; for panels and forms). Ignored by `inline`, which is already a start-aligned row. */
  layout?: EmptyStateLayout
  /** Tint of the icon bubble: `neutral` (default), `info`, `success`, `warning` or `danger`. The title still says what is empty. */
  tone?: EmptyStateTone
  /** Heading element for the title. Use `p` or `div` when a heading would break the document outline. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p' | 'div'
}

const props = withDefaults(defineProps<EmptyStateProps>(), { size: 'md', variant: 'default', layout: 'center', tone: 'neutral', titleAs: 'h3' })

const slots = useSlots()
// An empty state without a title is a blank box: it must say what is empty.
checkAfterMount(() => {
  if (slots.title) return
  requireText('EmptyState', 'title', props.title, 'Say what is empty, for example "No invoices yet". The `title` slot also works.')
})

const resolvedSize = computed<EmptyStateSize>(() => pick(props.size, EMPTY_STATE_SIZES, 'md'))
const resolvedVariant = computed<EmptyStateVariant>(() => pick(props.variant, EMPTY_STATE_VARIANTS, 'default'))
const resolvedLayout = computed<EmptyStateLayout>(() => pick(props.layout, EMPTY_STATE_LAYOUTS, 'center'))
const resolvedTone = computed<EmptyStateTone>(() => pick(props.tone, EMPTY_STATE_TONES, 'neutral'))
const titleTag = computed(() => (['h2', 'h3', 'h4', 'p', 'div'] as const).includes(props.titleAs) ? props.titleAs : 'h3')
const classes = computed(() => cn(emptyStateVariants({ size: resolvedSize.value, variant: resolvedVariant.value, layout: resolvedLayout.value }), props.class))
</script>

<template>
  <div
    data-slot="empty-state"
    :data-size="resolvedSize"
    :data-variant="resolvedVariant === 'default' ? undefined : resolvedVariant"
    :data-layout="resolvedLayout === 'center' ? undefined : resolvedLayout"
    :data-tone="resolvedTone === 'neutral' ? undefined : resolvedTone"
    :class="classes"
  >
    <div v-if="$slots.illustration" data-slot="empty-state-illustration" :class="emptyStateIllustrationVariants({ variant: resolvedVariant })">
      <slot name="illustration" />
    </div>
    <div v-if="icon || $slots.icon" data-slot="empty-state-icon" :class="emptyStateIconVariants({ size: resolvedSize, variant: resolvedVariant, tone: resolvedTone })">
      <slot name="icon"><Icon v-if="icon" :icon="icon" /></slot>
    </div>
    <component
      :is="titleTag"
      v-if="title || $slots.title"
      data-slot="empty-state-title"
      :class="cn(emptyStateTitleVariants({ size: resolvedSize, variant: resolvedVariant }), 'break-words')"
    >
      <slot name="title">{{ title }}</slot>
    </component>
    <p v-if="description || $slots.description" data-slot="empty-state-description" :class="emptyStateDescriptionVariants({ variant: resolvedVariant })">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.action" data-slot="empty-state-action" :class="emptyStateActionVariants({ variant: resolvedVariant, layout: resolvedLayout })">
      <slot name="action" />
    </div>
  </div>
</template>
