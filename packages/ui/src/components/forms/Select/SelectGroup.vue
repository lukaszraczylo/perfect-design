<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectGroup } from 'reka-ui'

export interface SelectGroupProps {
  class?: HTMLAttributes['class']
}

defineProps<SelectGroupProps>()
</script>

<template>
  <SelectGroup data-slot="select-group" :class="$props.class">
    <slot />
  </SelectGroup>
</template>
