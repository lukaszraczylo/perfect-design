<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { DropdownMenuTrigger as RekaTrigger, type DropdownMenuTriggerProps } from 'reka-ui'
import { useCheckedTrigger } from '../triggerCheck'

const props = defineProps<DropdownMenuTriggerProps>()
const trigger = useTemplateRef('trigger')
useCheckedTrigger('DropdownMenuTrigger', () => trigger.value, 'Give an icon-only trigger an `aria-label`, or add visible text.')
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="dropdown-menu-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
