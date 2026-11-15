<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

export interface CardTitleProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardTitleProps>(), { as: 'h3' })
const classes = computed(() => cn('leading-none font-semibold', props.class))
</script>

<template>
  <Primitive data-slot="card-title" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
