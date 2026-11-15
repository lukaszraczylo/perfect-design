<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { HoverCardTrigger as RekaTrigger, type HoverCardTriggerProps } from 'reka-ui'
import { useCheckedTrigger } from '../triggerCheck'

const props = defineProps<HoverCardTriggerProps>()
const trigger = useTemplateRef('trigger')
// The card opens on hover and on keyboard focus, so the trigger must be a working link (with `href`) or another focusable element.
useCheckedTrigger('HoverCardTrigger', () => trigger.value, 'Give the trigger link text or an `aria-label`.', { focusable: true })
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="hover-card-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
