<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useCarouselContext } from './context'
import { carouselDotsVariants } from './variants'

export interface CarouselDotsProps extends BaseProps {
  /** Accessible name of the dot group. */
  label?: string
  /** Builds each dot's accessible name from its 1-based position. */
  dotLabel?: (position: number, total: number) => string
}

const props = withDefaults(defineProps<CarouselDotsProps>(), { label: 'Choose slide' })
const ctx = useCarouselContext('CarouselDots')

const classes = computed(() => cn(carouselDotsVariants({ orientation: ctx.orientation.value }), props.class))
const nameOf = (i: number) => (props.dotLabel ? props.dotLabel(i + 1, ctx.count.value) : `Go to slide ${i + 1}`)
</script>

<template>
  <div v-if="ctx.count.value > 0" data-slot="carousel-dots" role="group" :aria-label="label" :class="classes">
    <template v-for="i in ctx.count.value" :key="i">
      <slot name="dot" :index="i - 1" :active="i - 1 === ctx.current.value" :select="() => ctx.goTo(i - 1)">
        <button
          type="button"
          data-slot="carousel-dot"
          :aria-label="nameOf(i - 1)"
          :aria-current="i - 1 === ctx.current.value ? 'true' : undefined"
          :data-active="i - 1 === ctx.current.value ? '' : undefined"
          class="group/dot flex size-6 items-center justify-center rounded-full outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 pointer-coarse:size-11"
          @click="ctx.goTo(i - 1)"
        >
          <span
            aria-hidden="true"
            class="size-2.5 rounded-full border-2 border-muted-foreground transition-colors motion-reduce:transition-none group-hover/dot:border-foreground group-data-[active]/dot:border-primary group-data-[active]/dot:bg-primary"
          />
        </button>
      </slot>
    </template>
  </div>
</template>
