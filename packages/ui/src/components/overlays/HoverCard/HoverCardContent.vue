<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  HoverCardArrow as RekaArrow,
  HoverCardContent as RekaContent,
  HoverCardPortal as RekaPortal,
  useForwardProps,
  type HoverCardContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { hoverCardArrowVariants, hoverCardContentVariants, hoverCardSizes, hoverCardVariantNames, type HoverCardSize, type HoverCardVariant } from './variants'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<HoverCardContentProps & { class?: HTMLAttributes['class']; size?: HoverCardSize; variant?: HoverCardVariant; showArrow?: boolean }>(),
  {
    align: 'center',
    side: 'bottom',
    sideOffset: 6,
    collisionPadding: 8,
    size: 'md',
    variant: 'neutral',
    showArrow: false,
  },
)

const delegated = computed(() => {
  const { class: _c, size: _s, variant: _v, showArrow: _a, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)

const sizeKey = computed<HoverCardSize>(() => (hoverCardSizes.includes(props.size) ? props.size : 'md'))
const variantKey = computed<HoverCardVariant>(() => (hoverCardVariantNames.includes(props.variant) ? props.variant : 'neutral'))
</script>

<template>
  <RekaPortal>
    <RekaContent
      data-slot="hover-card-content"
      :data-variant="variantKey === 'neutral' ? undefined : variantKey"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(hoverCardContentVariants({ size: sizeKey, variant: variantKey }), props.class)"
    >
      <slot />
      <RekaArrow v-if="showArrow" data-slot="hover-card-arrow" aria-hidden="true" :class="hoverCardArrowVariants({ variant: variantKey })" />
    </RekaContent>
  </RekaPortal>
</template>
