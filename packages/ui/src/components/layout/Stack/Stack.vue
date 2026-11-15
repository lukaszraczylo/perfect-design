<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { gapClasses, lgGapClasses, lookup, mdGapClasses, smGapClasses, type Gap } from './gap'
import {
  stackCollapseClasses,
  stackPaddings,
  stackSurfaces,
  stackVariants,
  type StackAlign,
  type StackCollapse,
  type StackDirection,
  type StackJustify,
  type StackPadding,
  type StackVariant,
} from './variants'

export interface StackProps extends BaseProps {
  /** Main axis. `vertical` stacks children in a column, `horizontal` in a row. */
  direction?: StackDirection
  /** Space between children (spacing scale: 0-6, 8, 10, 12). Invalid values fall back to 4. */
  gap?: Gap
  /** Gap from the `sm` breakpoint up (responsive gap). Invalid values are ignored. */
  gapSm?: Gap
  /** Gap from the `md` breakpoint up (responsive gap). Invalid values are ignored. */
  gapMd?: Gap
  /** Gap from the `lg` breakpoint up (responsive gap). Invalid values are ignored. */
  gapLg?: Gap
  /** Cross-axis alignment (`align-items`). */
  align?: StackAlign
  /** Main-axis distribution (`justify-content`). */
  justify?: StackJustify
  /** Allow children to wrap onto new lines. */
  wrap?: boolean
  /** Horizontal stacks only: stay a column below this breakpoint and become a row from it up. Unknown values are ignored. */
  collapse?: StackCollapse
  /** Draw a border between children (`divide-y` for vertical, `divide-x` for horizontal). */
  divided?: boolean
  /** Surface: `plain` (default, none), `bordered`, `card` (bordered `bg-card` panel) or `muted` (filled panel). Surfaces add `p-4` unless `padding` is set. Unknown values fall back to `plain`. */
  variant?: StackVariant
  /** Inner padding: `auto` (default: none for `plain`, `p-4` for surfaces), `none`, `sm` (p-3), `md` (p-4) or `lg` (p-6). Unknown values fall back to `auto`. */
  padding?: StackPadding
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<StackProps>(), { direction: 'vertical', gap: 4, variant: 'plain', padding: 'auto', as: 'div' })

const variant = computed<StackVariant>(() => (stackSurfaces.includes(props.variant) ? props.variant : 'plain'))
const padding = computed<StackPadding>(() => (stackPaddings.includes(props.padding) ? props.padding : 'auto'))

const classes = computed(() =>
  cn(
    stackVariants({
      direction: props.direction,
      align: props.align,
      justify: props.justify,
      wrap: props.wrap,
      divided: props.divided,
      variant: variant.value,
      padding: padding.value,
    }),
    props.direction === 'horizontal' ? lookup(stackCollapseClasses, props.collapse) : undefined,
    lookup(gapClasses, props.gap) ?? gapClasses['4'],
    lookup(smGapClasses, props.gapSm),
    lookup(mdGapClasses, props.gapMd),
    lookup(lgGapClasses, props.gapLg),
    props.class,
  ),
)
</script>

<template>
  <Primitive data-slot="stack" :as="as" :as-child="asChild" :data-direction="direction" :class="classes">
    <slot />
  </Primitive>
</template>
