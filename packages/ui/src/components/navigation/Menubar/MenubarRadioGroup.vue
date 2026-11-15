<script setup lang="ts">
import { MenubarRadioGroup as RekaGroup, useForwardPropsEmits, type MenubarRadioGroupEmits, type MenubarRadioGroupProps } from 'reka-ui'

const props = defineProps<MenubarRadioGroupProps>()
const emits = defineEmits<MenubarRadioGroupEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RekaGroup data-slot="menubar-radio-group" v-bind="forwarded">
    <slot />
  </RekaGroup>
</template>
