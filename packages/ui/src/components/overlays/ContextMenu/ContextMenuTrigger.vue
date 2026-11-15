<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { ContextMenuTrigger as RekaTrigger, type ContextMenuTriggerProps } from 'reka-ui'
import { useCheckedTrigger } from '../triggerCheck'

const props = defineProps<ContextMenuTriggerProps>()
const trigger = useTemplateRef('trigger')
// The trigger is the area that listens for the right click, so an icon-only area needs a name for assistive tech to find it.
useCheckedTrigger('ContextMenuTrigger', () => trigger.value, 'Give an area without text an `aria-label`, or add visible text.')
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="context-menu-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
