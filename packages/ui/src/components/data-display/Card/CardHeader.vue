<script setup lang="ts">
import { computed, inject } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { CARD_PART_PX, CARD_SIZE_KEY } from './context'

export interface CardHeaderProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardHeaderProps>(), { as: 'div' })
const size = inject(CARD_SIZE_KEY, undefined)
const px = computed(() => CARD_PART_PX[size?.value ?? 'md'])
const classes = computed(() => cn('@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5', px.value, 'has-data-[slot=card-action]:grid-cols-[1fr_auto]', props.class))
</script>

<template>
  <Primitive data-slot="card-header" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
