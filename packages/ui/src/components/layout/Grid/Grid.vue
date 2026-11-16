<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { gapClasses, gapXClasses, gapYClasses, lgGapClasses, lookup, mdGapClasses, smGapClasses, type Gap } from '../Stack/gap'
import { lgGapXClasses, lgGapYClasses, mdGapXClasses, mdGapYClasses, smGapXClasses, smGapYClasses } from './gapAxes'
import {
  autoColsClasses,
  autoGridTemplate,
  colsClasses,
  gridLayouts,
  gridVariantNames,
  gridVariants,
  lgColsClasses,
  mdColsClasses,
  resolveMinItemWidth,
  smColsClasses,
  xlColsClasses,
  type GridCols,
  type GridLayout,
  type GridVariant,
} from './variants'

export interface GridProps extends BaseProps {
  /** Base column count (1-12). Invalid values fall back to 1. */
  cols?: GridCols
  /** Column count from the `sm` breakpoint up (1-12). Invalid values are ignored. */
  sm?: GridCols
  /** Column count from the `md` breakpoint up (1-12). Invalid values are ignored. */
  md?: GridCols
  /** Column count from the `lg` breakpoint up (1-12). Invalid values are ignored. */
  lg?: GridCols
  /** Column count from the `xl` breakpoint up (1-12). Invalid values are ignored. */
  xl?: GridCols
  /** Gap on both axes (spacing scale 0-6, 8, 10, 12). Invalid values fall back to 4. */
  gap?: Gap
  /** Column gap; overrides `gap` horizontally. */
  gapX?: Gap
  /** Row gap; overrides `gap` vertically. */
  gapY?: Gap
  /** Gap from the `sm` breakpoint up (responsive gap). Invalid values are ignored. */
  gapSm?: Gap
  /** Gap from the `md` breakpoint up (responsive gap). Invalid values are ignored. */
  gapMd?: Gap
  /** Gap from the `lg` breakpoint up (responsive gap). Invalid values are ignored. */
  gapLg?: Gap
  /**
   * Auto-fit mode: as many columns as fit, each at least this wide (`grid-template-columns: repeat(auto-fit, minmax(<w>, 1fr))`).
   * A number means px; a string must be a CSS length (`16rem`, `240px`, `20ch`, `30%`). Replaces the base `cols`; invalid values are ignored.
   */
  minItemWidth?: string | number
  /** With `minItemWidth`: use `auto-fill` (keeps empty tracks) instead of `auto-fit` (collapses them). */
  autoFill?: boolean
  /** How each direct child (cell) is drawn: `plain` (default), `bordered` (hairline border, p-4) or `card` (bordered `bg-card` cell). Unknown values fall back to `plain`. */
  variant?: GridVariant
  /** Emphasis: `uniform` (default), `lead` (first item spans the full row) or `feature` (from `md` up the first item spans 2 columns and 2 rows). Unknown values fall back to `uniform`. */
  layout?: GridLayout
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<GridProps>(), { cols: 1, gap: 4, variant: 'plain', layout: 'uniform', as: 'div' })

const minWidth = computed(() => resolveMinItemWidth(props.minItemWidth))

const variant = computed<GridVariant>(() => (gridVariantNames.includes(props.variant) ? props.variant : 'plain'))
const layout = computed<GridLayout>(() => (gridLayouts.includes(props.layout) ? props.layout : 'uniform'))

const classes = computed(() =>
  cn(
    gridVariants({ variant: variant.value, layout: layout.value }),
    minWidth.value ? autoColsClasses[props.autoFill ? 'fill' : 'fit'] : (lookup(colsClasses, props.cols) ?? colsClasses['1']),
    lookup(smColsClasses, props.sm),
    lookup(mdColsClasses, props.md),
    lookup(lgColsClasses, props.lg),
    lookup(xlColsClasses, props.xl),
    lookup(gapClasses, props.gap) ?? gapClasses['4'],
    lookup(smGapClasses, props.gapSm),
    lookup(mdGapClasses, props.gapMd),
    lookup(lgGapClasses, props.gapLg),
    lookup(gapXClasses, props.gapX),
    lookup(gapYClasses, props.gapY),
    // The axis gaps beat `gap` and the responsive gaps at every breakpoint that sets one.
    props.gapSm !== undefined && lookup(smGapClasses, props.gapSm) && lookup(smGapXClasses, props.gapX),
    props.gapSm !== undefined && lookup(smGapClasses, props.gapSm) && lookup(smGapYClasses, props.gapY),
    props.gapMd !== undefined && lookup(mdGapClasses, props.gapMd) && lookup(mdGapXClasses, props.gapX),
    props.gapMd !== undefined && lookup(mdGapClasses, props.gapMd) && lookup(mdGapYClasses, props.gapY),
    props.gapLg !== undefined && lookup(lgGapClasses, props.gapLg) && lookup(lgGapXClasses, props.gapX),
    props.gapLg !== undefined && lookup(lgGapClasses, props.gapLg) && lookup(lgGapYClasses, props.gapY),
    props.class,
  ),
)
const style = computed(() =>
  minWidth.value ? { '--grid-min': minWidth.value, '--grid-template': autoGridTemplate(minWidth.value, !!props.autoFill) } : undefined,
)
</script>

<template>
  <Primitive
    data-slot="grid"
    :as="as"
    :as-child="asChild"
    :data-auto="minWidth ? (autoFill ? 'fill' : 'fit') : undefined"
    :class="classes"
    :style="style"
  >
    <slot />
  </Primitive>
</template>
