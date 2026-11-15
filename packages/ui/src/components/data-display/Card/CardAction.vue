<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

export interface CardActionProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardActionProps>(), { as: 'div' })
const classes = computed(() => cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', props.class))
</script>

<template>
  <Primitive data-slot="card-action" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
