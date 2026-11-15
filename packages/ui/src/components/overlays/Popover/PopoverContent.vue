<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  PopoverArrow as RekaArrow,
  PopoverContent as RekaContent,
  PopoverPortal as RekaPortal,
  useForwardPropsEmits,
  type PopoverContentEmits,
  type PopoverContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { popoverArrowVariants, popoverContentVariants, popoverSizes, popoverVariantNames, type PopoverSize, type PopoverVariant } from './variants'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentProps & { class?: HTMLAttributes['class']; size?: PopoverSize; variant?: PopoverVariant; showArrow?: boolean }>(), {
  align: 'center',
  side: 'bottom',
  sideOffset: 6,
  collisionPadding: 8,
  size: 'md',
  variant: 'neutral',
  showArrow: false,
})
const emits = defineEmits<PopoverContentEmits>()

const delegated = computed(() => {
  const { class: _c, size: _s, variant: _v, showArrow: _a, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const sizeKey = computed<PopoverSize>(() => (popoverSizes.includes(props.size) ? props.size : 'md'))
const variantKey = computed<PopoverVariant>(() => (popoverVariantNames.includes(props.variant) ? props.variant : 'neutral'))
</script>

<template>
  <RekaPortal>
    <RekaContent
      data-slot="popover-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :data-variant="variantKey === 'neutral' ? undefined : variantKey"
      :class="cn(popoverContentVariants({ size: sizeKey, variant: variantKey }), props.class)"
    >
      <slot />
      <RekaArrow v-if="showArrow" data-slot="popover-arrow" aria-hidden="true" :class="popoverArrowVariants({ variant: variantKey })" />
    </RekaContent>
  </RekaPortal>
</template>
