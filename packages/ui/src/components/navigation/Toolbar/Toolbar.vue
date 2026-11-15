<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { ToolbarRoot, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { TOOLBAR_KEY } from './context'
import {
  TOOLBAR_DENSITIES,
  TOOLBAR_GAPS,
  TOOLBAR_ORIENTATIONS,
  TOOLBAR_OVERFLOWS,
  TOOLBAR_SIZES,
  TOOLBAR_VARIANTS,
  pickToolbar,
  toolbarVariants,
  type ToolbarDensity,
  type ToolbarGap,
  type ToolbarOrientation,
  type ToolbarOverflow,
  type ToolbarSize,
  type ToolbarVariant,
} from './variants'

export interface ToolbarProps extends BaseProps {
  /** Look of the bar: `plain` (default), `outline`, `filled` or `floating`. Unknown values fall back to `plain`. */
  variant?: ToolbarVariant
  /** Height of the items: `sm` (32px), `md` (36px, default) or `lg` (44px). Unknown values fall back to `md`. */
  size?: ToolbarSize
  /** Padding of the bar and of its items: `compact`, `default` or `spacious`. Unknown values fall back to `default`. */
  density?: ToolbarDensity
  /** Direction the items run in; also decides which arrow keys move focus. */
  orientation?: ToolbarOrientation
  /** Space between items: `none`, `sm` (default) or `md`. */
  gap?: ToolbarGap
  /** When items do not fit: `wrap` (default) onto more lines, or `scroll` inside the bar. */
  overflow?: ToolbarOverflow
  /** Reading direction; in `rtl` the horizontal arrow keys swap. */
  dir?: 'ltr' | 'rtl'
  /** Wrap keyboard focus from the last item to the first and back. */
  loop?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToolbarProps>(), {
  variant: 'plain',
  size: 'md',
  density: 'default',
  orientation: 'horizontal',
  gap: 'sm',
  overflow: 'wrap',
  dir: undefined,
  loop: true,
})

defineSlots<{
  /** `ToolbarButton`, `ToolbarToggleGroup`, `ToolbarLink` and `ToolbarSeparator`. */
  default?: () => unknown
}>()

// Unknown values fall back to the defaults instead of rendering unstyled markup.
const variant = computed(() => pickToolbar(props.variant, TOOLBAR_VARIANTS, 'plain'))
const size = computed(() => pickToolbar(props.size, TOOLBAR_SIZES, 'md'))
const density = computed(() => pickToolbar(props.density, TOOLBAR_DENSITIES, 'default'))
const orientation = computed(() => pickToolbar(props.orientation, TOOLBAR_ORIENTATIONS, 'horizontal'))
const gap = computed(() => pickToolbar(props.gap, TOOLBAR_GAPS, 'sm'))
const overflow = computed(() => pickToolbar(props.overflow, TOOLBAR_OVERFLOWS, 'wrap'))

provide(TOOLBAR_KEY, { variant, size, density, orientation, gap, overflow })

const root = ref<{ $el?: unknown } | null>(null)
useRequireAccessibleName(
  'Toolbar',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'Add `aria-label` (or `aria-labelledby`) to Toolbar, for example `<Toolbar aria-label="Text formatting">`.',
)

const classes = computed(() =>
  cn(
    toolbarVariants({
      variant: variant.value,
      orientation: orientation.value,
      density: density.value,
      gap: gap.value,
      overflow: overflow.value,
    }),
    props.class,
  ),
)
</script>

<template>
  <ToolbarRoot
    ref="root"
    data-slot="toolbar"
    :orientation="orientation"
    :dir="dir"
    :loop="loop"
    :as="as"
    :as-child="asChild"
    :data-variant="variant"
    :data-size="size"
    :data-density="density"
    :data-gap="gap"
    :data-overflow="overflow"
    :class="classes"
  >
    <slot />
  </ToolbarRoot>
</template>
