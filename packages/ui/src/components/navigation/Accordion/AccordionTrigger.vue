<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { AccordionHeader, AccordionTrigger as RekaTrigger, type AccordionTriggerProps } from 'reka-ui'
import { faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRegisterPart, useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { ACCORDION_OPTIONS_KEY } from './context'
import { accordionTriggerVariants } from './variants'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<AccordionTriggerProps & BaseProps & { headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 }>(), { headingLevel: 3 })
useRegisterPart('AccordionItem', 'AccordionTrigger')
const trigger = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName('AccordionTrigger', () => trigger.value?.$el, 'Give the trigger visible text, or `aria-label` when it only shows an icon.')
const options = inject(ACCORDION_OPTIONS_KEY, undefined)
const iconStart = computed(() => options?.value.iconPosition === 'start')
const classes = computed(() => cn(accordionTriggerVariants({ size: options?.value.size, iconPosition: options?.value.iconPosition }), props.class))
const delegated = computed(() => {
  const { class: _c, headingLevel: _h, ...rest } = props
  return rest
})
/** Unknown levels fall back to the default `h3`. */
const heading = computed(() => (Number.isInteger(props.headingLevel) && props.headingLevel >= 1 && props.headingLevel <= 6 ? `h${props.headingLevel}` : 'h3'))
</script>

<template>
  <AccordionHeader data-slot="accordion-header" :as="heading" class="flex">
    <RekaTrigger
      ref="trigger"
      data-slot="accordion-trigger"
      v-bind="{ ...$attrs, ...delegated }"
      :class="classes"
    >
      <slot v-if="iconStart" name="icon"><Icon :icon="faChevronDown" class="text-muted-foreground motion-safe:transition-transform motion-safe:duration-200 group-data-[state=open]:rotate-180" /></slot>
      <slot />
      <slot v-if="!iconStart" name="icon"><Icon :icon="faChevronDown" class="text-muted-foreground motion-safe:transition-transform motion-safe:duration-200 group-data-[state=open]:rotate-180" /></slot>
    </RekaTrigger>
  </AccordionHeader>
</template>
