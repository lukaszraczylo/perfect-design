<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { gapClasses, lookup, type Gap } from '../Stack/gap'
import {
  splitDividerClasses,
  splitRatioClasses,
  splitRatioTemplates,
  splitReverseClasses,
  splitReverseDividerClasses,
  splitStickyClasses,
  type SplitRatio,
  type SplitStackBelow,
  type SplitSticky,
} from './variants'

export interface SplitLayoutProps extends BaseProps {
  /** Column split once side by side. `a:b` ratios are start:end (`1:1`, `1:2`, `2:1`, `1:3`, `3:1`; `equal` = `1:1`, `1/3` = `1:2`, `2/3` = `2:1`). `fixed-start` / `fixed-end` pin one pane to `fixedWidth`. Unknown values fall back to `equal`. */
  ratio?: SplitRatio
  /** CSS length of the fixed pane (e.g. `18rem`, `320px`). Only used by `fixed-start` / `fixed-end`. Empty values fall back to `16rem`. */
  fixedWidth?: string
  /** Breakpoint below which the panes stack vertically. Unknown values fall back to `md`. */
  stackBelow?: SplitStackBelow
  /** Gap between panes (spacing scale 0-6, 8, 10, 12). Invalid values fall back to 0. */
  gap?: Gap
  /** Draw a border between the two panes. */
  divider?: boolean
  /** Pin one pane to the top while the other scrolls (applies once side by side, i.e. from the `stackBelow` breakpoint). Unknown values are ignored. */
  sticky?: SplitSticky
  /** CSS length: distance from the top of the scroll container for the sticky pane (e.g. `4rem` under a sticky header). Empty values fall back to `1rem`. */
  stickyOffset?: string
  /** While stacked (below `stackBelow`) show the end pane first. Only visual order changes; DOM / tab order stays start, end. */
  reverseOnMobile?: boolean
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<SplitLayoutProps>(), {
  ratio: 'equal',
  fixedWidth: '16rem',
  stackBelow: 'md',
  gap: 0,
  divider: false,
  stickyOffset: '1rem',
  reverseOnMobile: false,
  as: 'div',
})

const stackBelow = computed<SplitStackBelow>(() => (props.stackBelow === 'lg' ? 'lg' : 'md'))
const ratio = computed<SplitRatio>(() =>
  Object.prototype.hasOwnProperty.call(splitRatioClasses.md, props.ratio) ? props.ratio : 'equal',
)
const isFixed = computed(() => ratio.value === 'fixed-start' || ratio.value === 'fixed-end')

const classes = computed(() =>
  cn('grid grid-cols-1', splitRatioClasses[stackBelow.value][ratio.value], lookup(gapClasses, props.gap) ?? gapClasses['0'], props.class),
)
const sticky = computed<SplitSticky | undefined>(() => (props.sticky === 'start' || props.sticky === 'end' ? props.sticky : undefined))
const startClasses = computed(() => cn('min-w-0', sticky.value === 'start' && splitStickyClasses[stackBelow.value]))
const endClasses = computed(() =>
  cn(
    'min-w-0',
    props.divider && (props.reverseOnMobile ? splitReverseDividerClasses : splitDividerClasses)[stackBelow.value],
    props.reverseOnMobile && splitReverseClasses[stackBelow.value],
    sticky.value === 'end' && splitStickyClasses[stackBelow.value],
  ),
)
const style = computed(() => {
  const vars: Record<string, string> = {}
  const template = splitRatioTemplates[ratio.value]
  if (template) vars['--split-cols'] = template
  if (isFixed.value) vars['--split-fixed'] = props.fixedWidth?.trim() || '16rem'
  if (sticky.value) vars['--split-sticky-top'] = props.stickyOffset?.trim() || '1rem'
  return Object.keys(vars).length ? vars : undefined
})
</script>

<template>
  <Primitive
    data-slot="split-layout"
    :as="as"
    :data-ratio="ratio"
    :data-divider="divider ? '' : undefined"
    :data-sticky="sticky"
    :data-reverse-mobile="reverseOnMobile ? '' : undefined"
    :class="classes"
    :style="style"
  >
    <div data-slot="split-layout-start" :class="startClasses">
      <slot name="start" />
    </div>
    <div data-slot="split-layout-end" :class="endClasses">
      <slot name="end" />
    </div>
  </Primitive>
</template>
