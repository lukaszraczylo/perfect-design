<script setup lang="ts">
import { computed, provide } from 'vue'
import { AccordionRoot, useForwardPropsEmits, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { duplicates, isBlank, useEntryRegistry } from '../contract'
import { ACCORDION_OPTIONS_KEY } from './context'
import {
  ACCORDION_ICON_POSITIONS,
  ACCORDION_SIZES,
  ACCORDION_VARIANTS,
  accordionVariants,
  type AccordionIconPosition,
  type AccordionSize,
  type AccordionVariant,
} from './variants'

export interface AccordionProps extends BaseProps {
  /** `single` keeps one item open; `multiple` allows several. */
  type?: 'single' | 'multiple'
  /** Controlled open item(s) (v-model): a string for `single`, a string[] for `multiple`. */
  modelValue?: string | string[]
  /** Initially open item(s) when uncontrolled. */
  defaultValue?: string | string[]
  /** In `single` mode, allow closing the open item by clicking its trigger. */
  collapsible?: boolean
  disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
  dir?: 'ltr' | 'rtl'
  /** `flush` (default), `bordered`, `separated` or `filled`. Unknown values fall back to `flush`. */
  variant?: AccordionVariant
  /** Trigger and content size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: AccordionSize
  /** Where the chevron (or `icon` slot) sits: `end` (default) or `start`. Unknown values fall back to `end`. */
  iconPosition?: AccordionIconPosition
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<AccordionProps>(), { type: 'single', collapsible: true, orientation: 'vertical', variant: 'flush', size: 'md', iconPosition: 'end' })
const emits = defineEmits<{ 'update:modelValue': [value: string | string[] | undefined] }>()

const variant = computed<AccordionVariant>(() => (ACCORDION_VARIANTS.includes(props.variant as AccordionVariant) ? (props.variant as AccordionVariant) : 'flush'))
const size = computed<AccordionSize>(() => (ACCORDION_SIZES.includes(props.size as AccordionSize) ? (props.size as AccordionSize) : 'md'))
const iconPosition = computed<AccordionIconPosition>(() => (ACCORDION_ICON_POSITIONS.includes(props.iconPosition as AccordionIconPosition) ? (props.iconPosition as AccordionIconPosition) : 'end'))
provide(ACCORDION_OPTIONS_KEY, computed(() => ({ variant: variant.value, size: size.value, iconPosition: iconPosition.value })))

useEntryRegistry('Accordion', (entries) => {
  const values = entries.filter((e) => e.kind === 'item').map((e) => e.value())
  if (values.some(isBlank)) violation('Accordion', 'requires-value', 'requires a non-empty `value` on every AccordionItem. The value identifies the open item.')
  const dup = duplicates(values)
  if (dup.length) violation('Accordion', 'unique-value', `requires a unique \`value\` on every AccordionItem (duplicate: ${dup.map((v) => `"${v}"`).join(', ')}). Items with the same value open together.`)
})

const delegated = computed(() => {
  const { class: _c, type, variant: _v, size: _s, iconPosition: _i, ...rest } = props
  return { ...rest, type: type === 'multiple' ? 'multiple' : 'single' } as Record<string, unknown>
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <AccordionRoot data-slot="accordion" :data-variant="variant" :data-size="size" :data-icon-position="iconPosition" v-bind="forwarded as any" :class="cn(accordionVariants({ variant }), props.class)">
    <slot />
  </AccordionRoot>
</template>
