<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { AlertDialogCancel as RekaCancel, useForwardProps, type AlertDialogCancelProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { buttonVariants, type ButtonSize, type ButtonVariant } from '../../primitives/Button'

const props = withDefaults(
  defineProps<AlertDialogCancelProps & { class?: HTMLAttributes['class']; variant?: ButtonVariant; size?: ButtonSize }>(),
  { variant: 'outline', size: 'md' },
)
const delegated = computed(() => {
  const { class: _c, variant: _v, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaCancel data-slot="alert-dialog-cancel" v-bind="forwarded" :class="cn(buttonVariants({ variant, size }), props.class)">
    <slot />
  </RekaCancel>
</template>
