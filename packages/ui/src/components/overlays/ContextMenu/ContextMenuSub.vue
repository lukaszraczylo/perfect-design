<script setup lang="ts">
import { ContextMenuSub as RekaSub, useForwardPropsEmits, type ContextMenuSubEmits, type ContextMenuSubProps } from 'reka-ui'

const props = defineProps<ContextMenuSubProps>()
const emits = defineEmits<ContextMenuSubEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RekaSub data-slot="context-menu-sub" v-bind="forwarded">
    <slot />
  </RekaSub>
</template>
