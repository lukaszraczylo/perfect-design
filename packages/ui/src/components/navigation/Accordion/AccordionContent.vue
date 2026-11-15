<script setup lang="ts">
import { computed, inject } from 'vue'
import { AccordionContent as RekaContent, type AccordionContentProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { ACCORDION_OPTIONS_KEY } from './context'
import { accordionContentInnerVariants, accordionContentVariants } from './variants'

const props = defineProps<AccordionContentProps & BaseProps>()
useRegisterPart('AccordionItem', 'AccordionContent')
const options = inject(ACCORDION_OPTIONS_KEY, undefined)
const size = computed(() => options?.value.size)
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
</script>

<template>
  <RekaContent
    data-slot="accordion-content"
    v-bind="delegated"
    :class="cn(accordionContentVariants({ size }))"
  >
    <div :class="cn(accordionContentInnerVariants({ size }), props.class)"><slot /></div>
  </RekaContent>
</template>
