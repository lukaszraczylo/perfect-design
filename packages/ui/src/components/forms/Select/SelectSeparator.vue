<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { SelectSeparator } from 'reka-ui'
import { cn } from '../../../lib/cn'

export interface SelectSeparatorProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SelectSeparatorProps>()
const classes = computed(() => cn('pointer-events-none -mx-1 my-1 h-px bg-border', props.class))
</script>

<template>
  <SelectSeparator data-slot="select-separator" :class="classes" />
</template>
