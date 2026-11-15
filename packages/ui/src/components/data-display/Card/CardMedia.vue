<script setup lang="ts">
import { computed, inject } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { CARD_LAYOUT_KEY } from './context'

export interface CardMediaProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardMediaProps>(), { as: 'div' })
const layout = inject(CARD_LAYOUT_KEY, undefined)
// In a horizontal Card the media takes a fixed share of the row; override the width with `class` (e.g. `sm:w-1/3`).
const classes = computed(() =>
  cn(
    'relative overflow-hidden bg-muted [&_img]:size-full [&_img]:object-cover',
    layout?.value === 'horizontal' && 'sm:w-2/5 sm:shrink-0',
    props.class,
  ),
)
</script>

<template>
  <Primitive data-slot="card-media" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
