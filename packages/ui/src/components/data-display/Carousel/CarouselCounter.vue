<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useCarouselContext } from './context'

export interface CarouselCounterProps extends BaseProps {}

const props = defineProps<CarouselCounterProps>()
const ctx = useCarouselContext('CarouselCounter')

const classes = computed(() => cn('text-sm text-muted-foreground tabular-nums', props.class))
</script>

<template>
  <p v-if="ctx.count.value > 0" data-slot="carousel-counter" :class="classes">
    <slot :index="ctx.current.value" :count="ctx.count.value">{{ ctx.current.value + 1 }} / {{ ctx.count.value }}</slot>
  </p>
</template>
