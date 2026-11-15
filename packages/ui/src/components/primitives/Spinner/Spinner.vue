<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

export interface SpinnerProps extends BaseProps {
  /** Accessible label announced to screen readers. */
  label?: string
  /** Purely visual (aria-hidden, no role). Use when the surrounding element already announces the busy state. */
  decorative?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<SpinnerProps>(), { label: 'Loading', size: 'md' })

const SIZES = { xs: 'size-3', sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' } as const
const classes = computed(() =>
  cn('inline-block animate-spin text-current motion-reduce:animate-pulse', SIZES[props.size] ?? SIZES.md, props.class),
)
</script>

<template>
  <svg
    data-slot="spinner"
    :role="decorative ? undefined : 'progressbar'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative ? 'true' : undefined"
    focusable="false"
    :class="classes"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
  </svg>
</template>
