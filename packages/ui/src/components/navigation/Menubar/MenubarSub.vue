<script setup lang="ts">
import { MenubarSub as RekaSub, useForwardPropsEmits, type MenubarSubEmits, type MenubarSubProps } from 'reka-ui'

const props = defineProps<MenubarSubProps>()
const emits = defineEmits<MenubarSubEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <RekaSub data-slot="menubar-sub" v-bind="forwarded">
    <slot />
  </RekaSub>
</template>
