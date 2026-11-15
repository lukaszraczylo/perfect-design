<script setup lang="ts">
import { provide } from 'vue'
import { TooltipProvider as RekaProvider, type TooltipProviderProps } from 'reka-ui'
import { TOOLTIP_PROVIDER_KEY } from './context'

const props = withDefaults(defineProps<TooltipProviderProps>(), { delayDuration: 400 })
provide(TOOLTIP_PROVIDER_KEY, true)
</script>

<template>
  <RekaProvider v-bind="props">
    <slot />
  </RekaProvider>
</template>
