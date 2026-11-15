<script setup lang="ts">
import { DialogClose as RekaClose, type DialogCloseProps } from 'reka-ui'

const props = defineProps<DialogCloseProps>()
</script>

<template>
  <RekaClose data-slot="dialog-close" v-bind="props">
    <slot />
  </RekaClose>
</template>
