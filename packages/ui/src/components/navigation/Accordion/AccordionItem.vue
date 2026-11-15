<script setup lang="ts">
import { computed, inject } from 'vue'
import { AccordionItem as RekaItem, useForwardProps, type AccordionItemProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useEntry } from '../contract'
import { ACCORDION_OPTIONS_KEY } from './context'
import { accordionItemVariants } from './variants'

const props = defineProps<AccordionItemProps & BaseProps>()
useEntry('Accordion', 'item', () => props.value)
useRequiredParts('AccordionItem', [
  { part: 'AccordionTrigger', hint: 'Without a trigger the item cannot be opened.' },
  { part: 'AccordionContent', hint: 'Without content the item has nothing to reveal.' },
])
const options = inject(ACCORDION_OPTIONS_KEY, undefined)
const classes = computed(() => cn(accordionItemVariants({ variant: options?.value.variant }), props.class))
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaItem data-slot="accordion-item" v-bind="forwarded" :class="classes">
    <RequiredPartsProbe owner="AccordionItem" />
    <slot />
  </RekaItem>
</template>
