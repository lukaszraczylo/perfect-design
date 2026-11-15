<script setup lang="ts">
import { cn } from '../../../lib/cn'

/**
 * Internal inline state of a chart that has nothing to draw: `empty` (a labelled image holding the message) or
 * `loading` (a polite status region that is marked busy). Not part of the public API.
 */
defineProps<{
  dataSlot: string
  kind: 'empty' | 'loading'
  text: string
  /** Accessible name of the empty image; falls back to the message. */
  name?: string
  labelledby?: string
  /** The consumer's `class`, merged last so it wins. */
  userClass?: unknown
}>()
</script>

<template>
  <div
    v-if="kind === 'empty'"
    :data-slot="dataSlot"
    role="img"
    :aria-label="name || text"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full items-center justify-center rounded-md border border-dashed px-3 text-center text-sm text-muted-foreground', userClass as never)"
  >
    <span :data-slot="`${dataSlot}-empty`">{{ text }}</span>
  </div>
  <div
    v-else
    :data-slot="dataSlot"
    role="status"
    aria-busy="true"
    data-state="loading"
    :class="cn('flex min-h-32 w-full items-center justify-center rounded-md border border-dashed px-3 text-center text-sm text-muted-foreground', userClass as never)"
  >
    <span :data-slot="`${dataSlot}-loading`">{{ text }}</span>
  </div>
</template>
