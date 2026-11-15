<script setup lang="ts">
import { computed } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { toneIcons, toTone, type FeedbackTone } from '../tones'
import { pick } from '../pick'
import { INLINE_MESSAGE_SIZES, INLINE_MESSAGE_VARIANTS, inlineMessageVariants, type InlineMessageSize, type InlineMessageVariant } from './variants'

export interface InlineMessageProps extends BaseProps {
  tone?: FeedbackTone
  /** Text and icon size: `sm`, `md` (default) or `lg`. */
  size?: InlineMessageSize
  /** `plain` (coloured text, default), `soft` (tinted box) or `outline` (bordered box). */
  variant?: InlineMessageVariant
  /** Replace the tone's default icon. */
  icon?: IconDefinition
  /** Hide the icon. */
  hideIcon?: boolean
}

const props = withDefaults(defineProps<InlineMessageProps>(), { tone: 'neutral', size: 'md', variant: 'plain' })

const resolvedTone = computed(() => toTone(props.tone))
const resolvedSize = computed<InlineMessageSize>(() => pick(props.size, INLINE_MESSAGE_SIZES, 'md'))
const resolvedVariant = computed<InlineMessageVariant>(() => pick(props.variant, INLINE_MESSAGE_VARIANTS, 'plain'))
const resolvedIcon = computed(() => props.icon ?? toneIcons[resolvedTone.value])
const classes = computed(() => cn(inlineMessageVariants({ tone: resolvedTone.value, size: resolvedSize.value, variant: resolvedVariant.value }), props.class))
</script>

<template>
  <p
    data-slot="inline-message"
    :data-tone="resolvedTone"
    :data-variant="resolvedVariant === 'plain' ? undefined : resolvedVariant"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :role="resolvedTone === 'danger' ? 'alert' : 'status'"
    :class="classes"
  >
    <Icon v-if="!hideIcon" data-slot="inline-message-icon" :icon="resolvedIcon" class="mt-0.5" />
    <span data-slot="inline-message-text" class="min-w-0 break-words"><slot /></span>
  </p>
</template>
