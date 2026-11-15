<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { AlertDialogAction as RekaAction, useForwardProps, type AlertDialogActionProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { buttonVariants, type ButtonSize, type ButtonVariant } from '../../primitives/Button'
import { useAlertDialogTone } from './context'

const props = withDefaults(
  defineProps<AlertDialogActionProps & { class?: HTMLAttributes['class']; variant?: ButtonVariant; size?: ButtonSize }>(),
  { variant: undefined, size: 'md' },
)
// An explicit `variant` wins; otherwise a `danger` AlertDialogContent makes the action destructive.
const tone = useAlertDialogTone()
const variantKey = computed<ButtonVariant>(() => props.variant ?? (tone === 'danger' ? 'destructive' : 'default'))
const delegated = computed(() => {
  const { class: _c, variant: _v, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaAction data-slot="alert-dialog-action" v-bind="forwarded" :class="cn(buttonVariants({ variant: variantKey, size }), props.class)">
    <slot />
  </RekaAction>
</template>
