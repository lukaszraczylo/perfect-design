<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import { faChevronLeft } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { useCarouselContext } from './context'

export interface CarouselPreviousProps extends BaseProps {
  /** Accessible name. */
  label?: string
}

const props = withDefaults(defineProps<CarouselPreviousProps>(), { label: 'Previous slide' })
const ctx = useCarouselContext('CarouselPrevious')

const classes = computed(() =>
  cn(
    'absolute z-10 rounded-full',
    ctx.orientation.value === 'horizontal' ? 'top-1/2 start-2 -translate-y-1/2' : 'top-2 left-1/2 -translate-x-1/2',
    props.class,
  ),
)
</script>

<template>
  <Button
    data-slot="carousel-previous"
    variant="outline"
    size="icon-sm"
    :aria-label="label"
    :disabled="!ctx.canPrev.value"
    :class="classes"
    @click="ctx.prev()"
  >
    <slot><Icon :icon="faChevronLeft" :class="ctx.orientation.value === 'vertical' ? 'rotate-90' : 'rtl:rotate-180'" /></slot>
  </Button>
</template>
