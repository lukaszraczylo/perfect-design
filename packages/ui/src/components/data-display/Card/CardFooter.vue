<script setup lang="ts">
import { computed, inject } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { CARD_PART_PX, CARD_SIZE_KEY } from './context'

export interface CardFooterProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardFooterProps>(), { as: 'div' })
const size = inject(CARD_SIZE_KEY, undefined)
const px = computed(() => CARD_PART_PX[size?.value ?? 'md'])
const classes = computed(() => cn('flex items-center', px.value, props.class))
</script>

<template>
  <Primitive data-slot="card-footer" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
