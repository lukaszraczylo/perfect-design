<script setup lang="ts">
import { computed } from 'vue'
import { VisuallyHidden as RekaVisuallyHidden, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

export interface VisuallyHiddenProps extends BaseProps {
  as?: PrimitiveProps['as']
  /** Render the single child instead of a wrapper element (reka-ui asChild). */
  asChild?: boolean
}

const props = withDefaults(defineProps<VisuallyHiddenProps>(), { as: 'span' })
const classes = computed(() => cn(props.class))
</script>

<template>
  <RekaVisuallyHidden data-slot="visually-hidden" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </RekaVisuallyHidden>
</template>
