<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import TooltipProvider from './TooltipProvider.vue'
import Tooltip from './Tooltip.vue'
import TooltipTrigger from './TooltipTrigger.vue'
import TooltipContent from './TooltipContent.vue'
import type { TooltipSize, TooltipVariant } from './variants'

export interface SimpleTooltipProps {
  /** Tooltip text. Use the `content` slot for rich content. */
  content?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Hover delay in ms before opening. */
  delayDuration?: number
  /** Never show the tooltip. */
  disabled?: boolean
  /** Bubble look: `dark` (inverted, default) or `light` (popover surface). */
  variant?: TooltipVariant
  /** Bubble size: `sm`, `md` (default) or `lg`. */
  size?: TooltipSize
  /** Show the arrow that points at the trigger. */
  showArrow?: boolean
  /** Classes for the tooltip bubble. */
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<SimpleTooltipProps>(), { side: 'top', align: 'center', delayDuration: 400, showArrow: true })
</script>

<template>
  <TooltipProvider :delay-duration="props.delayDuration">
    <Tooltip :disabled="props.disabled || (!props.content && !$slots.content)">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipContent :side="props.side" :align="props.align" :variant="props.variant" :size="props.size" :show-arrow="props.showArrow" :class="props.class">
        <slot name="content">{{ props.content }}</slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
