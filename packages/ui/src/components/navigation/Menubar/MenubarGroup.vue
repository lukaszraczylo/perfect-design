<script setup lang="ts">
import { MenubarGroup as RekaGroup, type MenubarGroupProps } from 'reka-ui'

const props = defineProps<MenubarGroupProps>()
</script>

<template>
  <RekaGroup data-slot="menubar-group" v-bind="props">
    <slot />
  </RekaGroup>
</template>
