<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { AlertDialogDescription as RekaDescription, useForwardProps, type AlertDialogDescriptionProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'

useRegisterPart('AlertDialogContent', 'AlertDialogDescription')
const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaDescription data-slot="alert-dialog-description" v-bind="forwarded" :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </RekaDescription>
</template>
