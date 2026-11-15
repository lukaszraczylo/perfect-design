<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { PopoverTrigger as RekaTrigger, type PopoverTriggerProps } from 'reka-ui'
import { useCheckedTrigger } from '../triggerCheck'

const props = defineProps<PopoverTriggerProps>()
const trigger = useTemplateRef('trigger')
useCheckedTrigger('PopoverTrigger', () => trigger.value, 'Give an icon-only trigger an `aria-label`, or add visible text.')
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="popover-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
