<script setup lang="ts">
import { DropdownMenuSub as RekaSub, useForwardPropsEmits, type DropdownMenuSubEmits, type DropdownMenuSubProps } from 'reka-ui'

const props = defineProps<DropdownMenuSubProps>()
const emits = defineEmits<DropdownMenuSubEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RekaSub data-slot="dropdown-menu-sub" v-bind="forwarded">
    <slot />
  </RekaSub>
</template>
