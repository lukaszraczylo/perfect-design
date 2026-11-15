<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { SelectLabel } from 'reka-ui'
import { cn } from '../../../lib/cn'

export interface SelectLabelProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SelectLabelProps>()
const classes = computed(() => cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', props.class))
</script>

<template>
  <SelectLabel data-slot="select-label" :class="classes">
    <slot />
  </SelectLabel>
</template>
