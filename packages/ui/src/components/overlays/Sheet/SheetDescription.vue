<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { DialogDescription as RekaDescription, useForwardProps, type DialogDescriptionProps } from 'reka-ui'
import { cn } from '../../../lib/cn'

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaDescription data-slot="sheet-description" v-bind="forwarded" :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </RekaDescription>
</template>
