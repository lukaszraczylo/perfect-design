<script setup lang="ts">
import { ContextMenuGroup as RekaGroup, type ContextMenuGroupProps } from 'reka-ui'

const props = defineProps<ContextMenuGroupProps>()
</script>

<template>
  <RekaGroup data-slot="context-menu-group" v-bind="props">
    <slot />
  </RekaGroup>
</template>
