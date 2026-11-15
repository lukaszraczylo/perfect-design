<script setup lang="ts">
import { ContextMenuRadioGroup as RekaGroup, useForwardPropsEmits, type ContextMenuRadioGroupEmits, type ContextMenuRadioGroupProps } from 'reka-ui'

const props = defineProps<ContextMenuRadioGroupProps>()
const emits = defineEmits<ContextMenuRadioGroupEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RekaGroup data-slot="context-menu-radio-group" v-bind="forwarded">
    <slot />
  </RekaGroup>
</template>
