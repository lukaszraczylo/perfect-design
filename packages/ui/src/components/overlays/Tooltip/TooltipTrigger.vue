<script setup lang="ts">
import { inject, nextTick, onMounted, useTemplateRef } from 'vue'
import { TooltipTrigger as RekaTrigger, type TooltipTriggerProps } from 'reka-ui'
import { violation } from '../../../lib/contract'
import { useCheckedTrigger } from '../triggerCheck'
import { TOOLTIP_ROOT_KEY } from './context'

const props = defineProps<TooltipTriggerProps>()
const root = inject(TOOLTIP_ROOT_KEY, null)
const trigger = useTemplateRef('trigger')
onMounted(async () => {
  await nextTick()
  if (!root) violation('TooltipTrigger', 'requires-Tooltip', 'requires a Tooltip around it. Wrap the trigger and its TooltipContent in <Tooltip>.')
})
// A tooltip opens on hover and keyboard focus: a span or div trigger is invisible to keyboard users.
useCheckedTrigger('TooltipTrigger', () => trigger.value, 'Wrap a single focusable element (a button or a link) and give an icon-only one an `aria-label`.', {
  focusable: true,
  when: () => !!root && !root.disabled(),
})
</script>

<template>
  <RekaTrigger v-if="root" ref="trigger" data-slot="tooltip-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
