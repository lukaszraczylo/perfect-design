<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useCarouselContext } from './context'
import { carouselContentVariants } from './variants'

export interface CarouselContentProps extends BaseProps {
  /** Accessible name of the scrolling track. */
  label?: string
}

const props = withDefaults(defineProps<CarouselContentProps>(), { label: 'Slides' })
const ctx = useCarouselContext('CarouselContent')
useRegisterPart('Carousel', 'CarouselContent')
const el = useTemplateRef<HTMLElement>('el')

onMounted(() => (ctx.contentEl.value = el.value))
onBeforeUnmount(() => (ctx.contentEl.value = null))

const classes = computed(() => cn(carouselContentVariants({ orientation: ctx.orientation.value }), props.class))
</script>

<template>
  <div
    ref="el"
    data-slot="carousel-content"
    tabindex="0"
    role="group"
    :aria-label="label"
    :aria-live="ctx.live.value"
    :aria-atomic="false"
    :data-orientation="ctx.orientation.value"
    :class="classes"
    @scroll.passive="ctx.onScroll"
  >
    <slot />
  </div>
</template>
