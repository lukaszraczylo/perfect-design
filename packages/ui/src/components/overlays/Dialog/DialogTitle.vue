<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { DialogTitle as RekaTitle, useForwardProps, type DialogTitleProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'

useRegisterPart('DialogContent', 'DialogTitle')
const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaTitle data-slot="dialog-title" v-bind="forwarded" :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </RekaTitle>
</template>
