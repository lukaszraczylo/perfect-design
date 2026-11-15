<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useCarouselContext } from './context'
import { carouselItemVariants } from './variants'

export interface CarouselItemProps extends BaseProps {}

const props = defineProps<CarouselItemProps>()
const ctx = useCarouselContext('CarouselItem')
useRegisterPart('Carousel', 'CarouselItem')
const el = useTemplateRef<HTMLElement>('el')

onMounted(() => el.value && ctx.registerSlide(el.value))
onBeforeUnmount(() => el.value && ctx.unregisterSlide(el.value))

const index = computed(() => (el.value ? ctx.slides.value.indexOf(el.value) : -1))
const label = computed(() => (index.value >= 0 ? `${index.value + 1} of ${ctx.count.value}` : undefined))
const active = computed(() => index.value === ctx.current.value)
const classes = computed(() => cn(carouselItemVariants({ orientation: ctx.orientation.value }), props.class))
</script>

<template>
  <div
    ref="el"
    data-slot="carousel-item"
    role="group"
    aria-roledescription="slide"
    :aria-label="label"
    :data-active="active ? '' : undefined"
    :class="classes"
  >
    <slot />
  </div>
</template>
