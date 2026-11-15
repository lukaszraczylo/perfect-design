<script setup lang="ts">
import { computed, inject } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { CARD_SIZE_KEY } from './context'

export interface CardBodyProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardBodyProps>(), { as: 'div' })
// Content column for horizontal cards (the card itself has no vertical padding there).
const size = inject(CARD_SIZE_KEY, undefined)
const BODY = { sm: 'gap-3 py-4', md: 'gap-4 py-6', lg: 'gap-5 py-8' } as const
const classes = computed(() => cn('flex min-w-0 flex-1 flex-col', BODY[size?.value ?? 'md'], props.class))
</script>

<template>
  <Primitive data-slot="card-body" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
