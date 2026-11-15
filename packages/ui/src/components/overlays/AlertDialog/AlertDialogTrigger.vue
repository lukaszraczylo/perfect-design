<script setup lang="ts">
import { AlertDialogTrigger as RekaTrigger, type AlertDialogTriggerProps } from 'reka-ui'

const props = defineProps<AlertDialogTriggerProps>()
</script>

<template>
  <RekaTrigger data-slot="alert-dialog-trigger" v-bind="props">
    <slot />
  </RekaTrigger>
</template>
