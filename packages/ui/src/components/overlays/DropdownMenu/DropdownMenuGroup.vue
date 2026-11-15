<script setup lang="ts">
import { DropdownMenuGroup as RekaGroup, type DropdownMenuGroupProps } from 'reka-ui'

const props = defineProps<DropdownMenuGroupProps>()
</script>

<template>
  <RekaGroup data-slot="dropdown-menu-group" v-bind="props">
    <slot />
  </RekaGroup>
</template>
