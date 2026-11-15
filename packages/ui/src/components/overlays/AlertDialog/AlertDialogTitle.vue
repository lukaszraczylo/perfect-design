<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { AlertDialogTitle as RekaTitle, useForwardProps, type AlertDialogTitleProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'

useRegisterPart('AlertDialogContent', 'AlertDialogTitle')
const props = defineProps<AlertDialogTitleProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaTitle data-slot="alert-dialog-title" v-bind="forwarded" :class="cn('text-lg font-semibold', props.class)">
    <slot />
  </RekaTitle>
</template>
