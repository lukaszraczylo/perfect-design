<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import {
  centeredColumnClasses,
  centeredIllustrationClasses,
  centeredIllustrationPositionClasses,
  centeredLayouts,
  centeredRootClasses,
  centeredSplitColumns,
  centeredWidthClasses,
  type CenteredLayoutIllustrationPosition,
  type CenteredLayoutLayout,
  type CenteredLayoutWidth,
} from './variants'

export interface CenteredLayoutProps extends BaseProps {
  /** Width of the inner column (`sm` … `4xl`; use `xl`+ for wide pages). Unknown values fall back to `md`. */
  width?: CenteredLayoutWidth
  /**
   * Page arrangement. `default`: plain centred column. `card`: the column becomes a card on a muted page (auth card).
   * `split`: with an `illustration` slot, a two-pane page (form + illustration from `lg`). Unknown values fall back to `default`.
   */
  layout?: CenteredLayoutLayout
  /** Split layout only: which side the illustration panel sits on from `lg` up. Unknown values fall back to `end`. */
  illustrationPosition?: CenteredLayoutIllustrationPosition
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<CenteredLayoutProps>(), { width: 'md', layout: 'default', illustrationPosition: 'end', as: 'div' })
const slots = useSlots()

const width = computed<CenteredLayoutWidth>(() =>
  Object.prototype.hasOwnProperty.call(centeredWidthClasses, props.width) ? props.width : 'md',
)
const layout = computed<CenteredLayoutLayout>(() => (centeredLayouts.includes(props.layout) ? props.layout : 'default'))

onMounted(async () => {
  await nextTick()
  if (layout.value === 'split' && !slots.illustration) {
    violation('CenteredLayout', 'requires-illustration', 'with `layout="split"` requires an `illustration` slot. Without it the page renders as the default layout.')
  }
})

/** Evaluated at render time so late-added slots are picked up. */
const hasIllustration = () => layout.value === 'split' && !!slots.illustration

const rootClasses = () =>
  cn(centeredRootClasses[layout.value], hasIllustration() && centeredSplitColumns, props.class)
const columnClasses = computed(() =>
  cn('flex w-full flex-col gap-6', centeredWidthClasses[width.value], centeredColumnClasses[layout.value]),
)
const illustrationClasses = computed(() =>
  cn(centeredIllustrationClasses, props.illustrationPosition === 'start' && centeredIllustrationPositionClasses.start),
)
</script>

<template>
  <Primitive
    data-slot="centered-layout"
    :as="as"
    :data-layout="layout === 'default' ? undefined : layout"
    :class="rootClasses()"
  >
    <div data-slot="centered-layout-column" :data-width="width" :class="columnClasses">
      <div v-if="$slots.logo" data-slot="centered-layout-logo" class="flex justify-center">
        <slot name="logo" />
      </div>
      <div v-if="$slots.header" data-slot="centered-layout-header" class="flex flex-col gap-1 text-center">
        <slot name="header" />
      </div>
      <slot />
      <div v-if="$slots.footer" data-slot="centered-layout-footer" class="text-center text-sm text-muted-foreground">
        <slot name="footer" />
      </div>
    </div>
    <div v-if="hasIllustration()" data-slot="centered-layout-illustration" :class="illustrationClasses">
      <slot name="illustration" />
    </div>
  </Primitive>
</template>
