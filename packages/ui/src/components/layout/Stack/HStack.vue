<script setup lang="ts">
import Stack, { type StackProps } from './Stack.vue'

export type HStackProps = Omit<StackProps, 'direction'>

const props = withDefaults(defineProps<HStackProps>(), { align: 'center', gap: 4, as: 'div' })
</script>

<template>
  <Stack data-slot="h-stack" v-bind="props" direction="horizontal">
    <slot />
  </Stack>
</template>
