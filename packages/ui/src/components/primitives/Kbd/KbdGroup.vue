<script setup lang="ts">
import { computed, h, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Kbd from './Kbd.vue'
import { flattenVNodes } from './flatten'
import {
  KBD_GAPS,
  KBD_SIZES,
  KBD_VARIANTS,
  kbdGroupVariants,
  kbdSeparatorVariants,
  type KbdGroupGap,
  type KbdSize,
  type KbdVariant,
} from './variants'

export interface KbdGroupProps extends BaseProps {
  /** Shortcut keys rendered as `Kbd` chips, e.g. `['Ctrl', 'K']`. Alternative to the default slot. */
  keys?: string[]
  /** Text drawn between keys (`+`, `then`...). Empty = no separator. */
  separator?: string
  /** Size applied to chips generated from `keys` and to the separator text. */
  size?: KbdSize
  /** Surface applied to chips generated from `keys`. */
  variant?: KbdVariant
  /** Space between chips and separators: `none`, `sm`, `md` or `lg`. */
  gap?: KbdGroupGap
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<KbdGroupProps>(), { keys: () => [], separator: '', size: 'md', variant: 'default', gap: 'md', as: 'span' })
const slots = useSlots()
const size = computed<KbdSize>(() => (KBD_SIZES.includes(props.size) ? props.size : 'md'))
const variant = computed<KbdVariant>(() => (KBD_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const gap = computed<KbdGroupGap>(() => (KBD_GAPS.includes(props.gap) ? props.gap : 'md'))
const classes = computed(() => cn(kbdGroupVariants({ gap: gap.value }), props.class))

/** Keys from the `keys` prop followed by slot children, joined by the separator. */
const Content = () => {
  const nodes = [...props.keys.map((key) => h(Kbd, { size: size.value, variant: variant.value }, () => key)), ...flattenVNodes(slots.default?.())]
  if (!props.separator) return nodes
  return nodes.flatMap((node, i) =>
    i === 0
      ? [node]
      : [h('span', { 'data-slot': 'kbd-separator', 'aria-hidden': 'true', class: kbdSeparatorVariants({ size: size.value }) }, props.separator), node],
  )
}
</script>

<template>
  <Primitive data-slot="kbd-group" :as="as" :class="classes"><Content /></Primitive>
</template>
