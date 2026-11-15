<script setup lang="ts">
import { computed, provide } from 'vue'
import { CollapsibleRoot, useForwardPropsEmits, type CollapsibleRootEmits, type CollapsibleRootProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { COLLAPSIBLE_SIZE_KEY } from './context'
import { COLLAPSIBLE_SIZES, COLLAPSIBLE_VARIANTS, collapsibleVariants, type CollapsibleSize, type CollapsibleVariant } from './variants'

export interface CollapsibleProps extends BaseProps {
  /** `plain` (default), `bordered` (rounded frame) or `filled` (muted surface). Unknown values fall back to `plain`. */
  variant?: CollapsibleVariant
  /** Padding of the framed variants and text size of the content: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: CollapsibleSize
}

const props = withDefaults(defineProps<CollapsibleRootProps & CollapsibleProps>(), { variant: 'plain', size: 'md' })
const variant = computed<CollapsibleVariant>(() => (COLLAPSIBLE_VARIANTS.includes(props.variant as CollapsibleVariant) ? (props.variant as CollapsibleVariant) : 'plain'))
const size = computed<CollapsibleSize>(() => (COLLAPSIBLE_SIZES.includes(props.size as CollapsibleSize) ? (props.size as CollapsibleSize) : 'md'))
provide(COLLAPSIBLE_SIZE_KEY, size)
useRequiredParts('Collapsible', [
  { part: 'CollapsibleTrigger', hint: 'Without a trigger the content cannot be toggled.' },
  { part: 'CollapsibleContent', hint: 'Without content there is nothing to reveal.' },
])
const emits = defineEmits<CollapsibleRootEmits>()
const delegated = computed(() => {
  const { class: _c, variant: _v, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <CollapsibleRoot v-slot="slotProps" data-slot="collapsible" :data-variant="variant" :data-size="size" v-bind="forwarded" :class="cn(collapsibleVariants({ variant, size }), props.class)">
    <RequiredPartsProbe owner="Collapsible" />
    <slot v-bind="slotProps" />
  </CollapsibleRoot>
</template>
