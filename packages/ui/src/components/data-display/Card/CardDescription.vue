<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

export interface CardDescriptionProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardDescriptionProps>(), { as: 'p' })
const classes = computed(() => cn('text-sm text-muted-foreground', props.class))
</script>

<template>
  <Primitive data-slot="card-description" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
