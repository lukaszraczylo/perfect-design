<script setup lang="ts">
import { PopoverClose as RekaClose, type PopoverCloseProps } from 'reka-ui'

const props = defineProps<PopoverCloseProps>()
</script>

<template>
  <RekaClose data-slot="popover-close" v-bind="props">
    <slot />
  </RekaClose>
</template>
