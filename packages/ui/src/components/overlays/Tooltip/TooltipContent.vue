<script setup lang="ts">
import { computed, inject, nextTick, onMounted, type HTMLAttributes } from 'vue'
import {
  TooltipArrow as RekaArrow,
  TooltipContent as RekaContent,
  TooltipPortal as RekaPortal,
  useForwardPropsEmits,
  type TooltipContentEmits,
  type TooltipContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { TOOLTIP_ROOT_KEY } from './context'
import { tooltipArrowVariants, tooltipSizes, tooltipVariantNames, tooltipVariants, type TooltipSize, type TooltipVariant } from './variants'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TooltipContentProps & { class?: HTMLAttributes['class']; showArrow?: boolean; variant?: TooltipVariant; size?: TooltipSize }>(), {
  sideOffset: 6,
  collisionPadding: 8,
  showArrow: true,
  variant: 'dark',
  size: 'md',
})
const emits = defineEmits<TooltipContentEmits>()

const delegated = computed(() => {
  const { class: _c, showArrow: _a, variant: _v, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const root = inject(TOOLTIP_ROOT_KEY, null)
onMounted(async () => {
  await nextTick()
  if (!root) violation('TooltipContent', 'requires-Tooltip', 'requires a Tooltip around it. Wrap the TooltipTrigger and this content in <Tooltip>.')
})

const variantKey = computed<TooltipVariant>(() => (tooltipVariantNames.includes(props.variant) ? props.variant : 'dark'))
const sizeKey = computed<TooltipSize>(() => (tooltipSizes.includes(props.size) ? props.size : 'md'))
</script>

<template>
  <RekaPortal v-if="root">
    <RekaContent
      data-slot="tooltip-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(tooltipVariants({ variant: variantKey, size: sizeKey }), props.class)"
    >
      <slot />
      <RekaArrow v-if="showArrow" data-slot="tooltip-arrow" :class="tooltipArrowVariants({ variant: variantKey })" />
    </RekaContent>
  </RekaPortal>
</template>
