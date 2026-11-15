<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import { useCarouselContext } from './context'

export interface CarouselPlayPauseProps extends BaseProps {
  /** Accessible name while autoplay is running. */
  pauseLabel?: string
  /** Accessible name while autoplay is paused by the user. */
  playLabel?: string
}

const props = withDefaults(defineProps<CarouselPlayPauseProps>(), { pauseLabel: 'Pause automatic slide show', playLabel: 'Start automatic slide show' })
const ctx = useCarouselContext('CarouselPlayPause')

const classes = computed(() => cn('absolute top-2 end-2 z-10 rounded-full', props.class))
</script>

<template>
  <Button
    v-if="ctx.autoplayAvailable.value"
    data-slot="carousel-play-pause"
    variant="outline"
    size="icon-sm"
    :aria-label="ctx.userPaused.value ? playLabel : pauseLabel"
    :data-state="ctx.userPaused.value ? 'paused' : 'playing'"
    :class="classes"
    @click="ctx.toggleAutoplay()"
  >
    <svg v-if="ctx.userPaused.value" data-slot="carousel-play-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" class="size-4">
      <path d="M8 5v14l11-7z" />
    </svg>
    <svg v-else data-slot="carousel-pause-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" class="size-4">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  </Button>
</template>
