<script setup lang="ts">
import Stack, { type StackProps } from './Stack.vue'

export type VStackProps = Omit<StackProps, 'direction'>

const props = withDefaults(defineProps<VStackProps>(), { gap: 4, as: 'div' })
</script>

<template>
  <Stack data-slot="v-stack" v-bind="props" direction="vertical">
    <slot />
  </Stack>
</template>
