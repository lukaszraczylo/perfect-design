<script setup lang="ts">
import { inject, nextTick, onMounted, provide } from 'vue'
import { TooltipProvider as RekaProvider, TooltipRoot, useForwardPropsEmits, type TooltipRootEmits, type TooltipRootProps } from 'reka-ui'
import { violation } from '../../../lib/contract'
import { TOOLTIP_PROVIDER_KEY, TOOLTIP_ROOT_KEY } from './context'

const props = defineProps<TooltipRootProps>()
const emits = defineEmits<TooltipRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)

provide(TOOLTIP_ROOT_KEY, { disabled: () => !!props.disabled })
// reka-ui throws during setup without a provider, which would blank the page. Render with a fallback provider
// instead and report the missing one from `onMounted`, like every other contract check.
const hasProvider = inject(TOOLTIP_PROVIDER_KEY, false)
onMounted(async () => {
  await nextTick()
  if (!hasProvider) violation('Tooltip', 'requires-TooltipProvider', 'requires a TooltipProvider around it (mount one near the app root), or use SimpleTooltip, which brings its own.')
})
</script>

<template>
  <TooltipRoot v-if="hasProvider" data-slot="tooltip" v-bind="forwarded">
    <slot />
  </TooltipRoot>
  <RekaProvider v-else>
    <TooltipRoot data-slot="tooltip" v-bind="forwarded">
      <slot />
    </TooltipRoot>
  </RekaProvider>
</template>
