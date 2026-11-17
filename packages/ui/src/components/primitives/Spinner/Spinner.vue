<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { SPINNER_VARIANTS, type SpinnerVariant } from './variants'

export interface SpinnerProps extends BaseProps {
  /** Accessible label announced to screen readers. */
  label?: string
  /** Purely visual (aria-hidden, no role). Use when the surrounding element already announces the busy state. */
  decorative?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Shape of the indeterminate animation: `ring` (default), `dots`, `bars`, `pulse` or `orbit`. Unknown values fall back to `ring`. */
  variant?: SpinnerVariant
}

const props = withDefaults(defineProps<SpinnerProps>(), { label: 'Loading', size: 'md', variant: 'ring' })

const SIZES = { xs: 'size-3', sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' } as const
const variant = computed<SpinnerVariant>(() => (SPINNER_VARIANTS.includes(props.variant) ? props.variant : 'ring'))
// Tailwind only emits literal class strings, so each staggered delay is spelled out.
const DOT_DELAYS = ['', '[animation-delay:150ms]', '[animation-delay:300ms]'] as const
const BAR_DELAYS = ['', '[animation-delay:120ms]', '[animation-delay:240ms]', '[animation-delay:360ms]'] as const
const BAR_X = [3, 8, 13, 18] as const
const DOT_X = [5, 12, 19] as const
// Gentle opacity pulse instead of movement under reduced motion; `fill-box` scales and rotates each shape around its own centre.
const PART = 'origin-center [transform-box:fill-box] motion-reduce:animate-pulse'
const classes = computed(() =>
  cn(
    'inline-block text-current',
    variant.value === 'ring' && 'animate-spin motion-reduce:animate-pulse',
    SIZES[props.size] ?? SIZES.md,
    props.class,
  ),
)
</script>

<template>
  <svg
    data-slot="spinner"
    :data-variant="variant === 'ring' ? undefined : variant"
    :role="decorative ? undefined : 'progressbar'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative ? 'true' : undefined"
    focusable="false"
    :class="classes"
    viewBox="0 0 24 24"
    fill="none"
  >
    <template v-if="variant === 'dots'">
      <circle v-for="(x, i) in DOT_X" :key="x" :cx="x" cy="12" r="2.5" fill="currentColor" :class="cn(PART, 'animate-ds-dot', DOT_DELAYS[i])" />
    </template>
    <template v-else-if="variant === 'bars'">
      <rect v-for="(x, i) in BAR_X" :key="x" :x="x" y="3" width="3" height="18" rx="1.5" fill="currentColor" :class="cn(PART, 'animate-ds-bar', BAR_DELAYS[i])" />
    </template>
    <template v-else-if="variant === 'pulse'">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" :class="cn(PART, 'animate-ds-ping motion-reduce:animate-none motion-reduce:opacity-30')" />
    </template>
    <template v-else-if="variant === 'orbit'">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="28 72" :class="cn(PART, 'animate-spin')" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="40 60" :class="cn(PART, 'animate-ds-spin-reverse')" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </template>
  </svg>
</template>
