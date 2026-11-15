<script setup lang="ts">
import { DialogTrigger as RekaTrigger, type DialogTriggerProps } from 'reka-ui'

const props = defineProps<DialogTriggerProps>()
</script>

<template>
  <RekaTrigger data-slot="dialog-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
