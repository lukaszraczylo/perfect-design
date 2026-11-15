<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectValue } from 'reka-ui'
import { useRegisterPart } from '../../../lib/contract'

export interface SelectValueProps {
  /** Text shown while no value is selected. */
  placeholder?: string
  class?: HTMLAttributes['class']
}

defineProps<SelectValueProps>()
useRegisterPart('Select', 'SelectValue')
</script>

<template>
  <SelectValue data-slot="select-value" :placeholder="placeholder" :class="$props.class">
    <slot />
  </SelectValue>
</template>
