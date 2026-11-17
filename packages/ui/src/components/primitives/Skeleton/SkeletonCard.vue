<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Skeleton from './Skeleton.vue'
import type { SkeletonAnimation } from './variants'

export interface SkeletonCardProps extends BaseProps {
  /** Show the media block (image or cover) above the text. Default true. */
  media?: boolean
  /** Body lines under the title (0..20, default 3). */
  lines?: number
  animation?: SkeletonAnimation
}

const props = withDefaults(defineProps<SkeletonCardProps>(), { media: true, lines: 3, animation: undefined })
const bodyLines = computed(() => {
  const n = Math.floor(Number(props.lines))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 20) : 0
})
const classes = computed(() => cn('flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4', props.class))
</script>

<template>
  <div data-slot="skeleton-card" aria-hidden="true" :class="classes">
    <Skeleton v-if="media" data-slot="skeleton-card-media" shape="rounded" class="h-32" :animation="animation" />
    <Skeleton data-slot="skeleton-card-title" shape="text" class="h-5 w-2/3" :animation="animation" />
    <Skeleton v-if="bodyLines" data-slot="skeleton-card-body" shape="lines" :lines="bodyLines" :animation="animation" />
  </div>
</template>
