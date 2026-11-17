<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { pick } from '../pick'
import {
  TYPING_DOT_SIZES,
  TYPING_INDICATOR_SIZES,
  TYPING_INDICATOR_VARIANTS,
  typingIndicatorVariants,
  type TypingIndicatorSize,
  type TypingIndicatorVariant,
} from './variants'

export interface TypingIndicatorProps extends BaseProps {
  /** Announced politely once and kept as visually hidden text, for example "Mira is typing". Empty falls back to `Typing`. */
  label?: string
  /** `sm` or `md` (default). Unknown values fall back to `md`. */
  size?: TypingIndicatorSize
  /** `bubble` (default, a muted chip) or `plain` (dots only). Unknown values fall back to `bubble`. */
  variant?: TypingIndicatorVariant
  /** Dots only, hidden from assistive tech and without a status role. Use when a parent already announces the state. */
  decorative?: boolean
}

const props = withDefaults(defineProps<TypingIndicatorProps>(), { label: 'Typing', size: 'md', variant: 'bubble', decorative: false })

const DELAYS = ['', '[animation-delay:200ms]', '[animation-delay:400ms]'] as const
const size = computed(() => pick(props.size, TYPING_INDICATOR_SIZES, 'md'))
const variant = computed(() => pick(props.variant, TYPING_INDICATOR_VARIANTS, 'bubble'))
const text = computed(() => (typeof props.label === 'string' && props.label.trim() ? props.label : 'Typing'))
const classes = computed(() => cn(typingIndicatorVariants({ variant: variant.value, size: size.value }), props.class))
// Static, slightly faded dots under reduced motion: nothing moves.
const dot = computed(() => cn('shrink-0 rounded-full bg-current animate-ds-dot motion-reduce:animate-none motion-reduce:opacity-60', TYPING_DOT_SIZES[size.value]))
</script>

<template>
  <div
    data-slot="typing-indicator"
    :data-variant="variant === 'bubble' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :role="decorative ? undefined : 'status'"
    :aria-hidden="decorative ? 'true' : undefined"
    :class="classes"
  >
    <span v-if="!decorative" data-slot="typing-indicator-label" class="sr-only">{{ text }}</span>
    <span aria-hidden="true" data-slot="typing-indicator-dots" class="inline-flex items-center gap-[inherit]">
      <span v-for="(delay, i) in DELAYS" :key="i" data-slot="typing-indicator-dot" :class="cn(dot, delay)" />
    </span>
  </div>
</template>
