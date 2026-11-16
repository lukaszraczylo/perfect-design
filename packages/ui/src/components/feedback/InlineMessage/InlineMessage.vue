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
  /** Live-region behaviour: `polite` (role=status), `assertive` (role=alert) or `off` (no live region, for field hints). Default: `assertive` for the danger tone, else `polite`. */
  live?: InlineMessageLive
}

const LIVE_MODES = ['polite', 'assertive', 'off'] as const
export type InlineMessageLive = (typeof LIVE_MODES)[number]

const props = withDefaults(defineProps<InlineMessageProps>(), { tone: 'neutral', size: 'md', variant: 'plain', live: undefined })

const resolvedTone = computed(() => toTone(props.tone))
const resolvedSize = computed<InlineMessageSize>(() => pick(props.size, INLINE_MESSAGE_SIZES, 'md'))
const resolvedVariant = computed<InlineMessageVariant>(() => pick(props.variant, INLINE_MESSAGE_VARIANTS, 'plain'))
const resolvedIcon = computed(() => props.icon ?? toneIcons[resolvedTone.value])
const role = computed(() => {
  const live = props.live && (LIVE_MODES as readonly string[]).includes(props.live) ? props.live : resolvedTone.value === 'danger' ? 'assertive' : 'polite'
  return live === 'off' ? undefined : live === 'assertive' ? 'alert' : 'status'
})
const classes = computed(() => cn(inlineMessageVariants({ tone: resolvedTone.value, size: resolvedSize.value, variant: resolvedVariant.value }), props.class))
</script>

<template>
  <p
    data-slot="inline-message"
    :data-tone="resolvedTone"
    :data-variant="resolvedVariant === 'plain' ? undefined : resolvedVariant"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :role="role"
    :class="classes"
  >
    <Icon v-if="!hideIcon" data-slot="inline-message-icon" :icon="resolvedIcon" class="mt-0.5" />
    <span data-slot="inline-message-text" class="min-w-0 break-words"><slot /></span>
  </p>
</template>
