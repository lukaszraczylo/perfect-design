<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ToolbarLink as RekaToolbarLink, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { TOOLBAR_KEY } from './context'
import { TOOLBAR_SIZES, pickToolbar, toolbarLinkVariants, type ToolbarSize } from './variants'

export interface ToolbarLinkProps extends BaseProps {
  /** Overrides the size of the bar for this link. */
  size?: ToolbarSize
  /** Element to render. Use a RouterLink (with `asChild` on a plain `a` inside it) for client-side navigation. */
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToolbarLinkProps>(), { size: undefined, as: 'a' })

defineSlots<{
  /** Link text. */
  default?: () => unknown
}>()

const ctx = inject(TOOLBAR_KEY, null)
const root = ref<{ $el?: unknown } | null>(null)
useRequireAccessibleName(
  'ToolbarLink',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'Give the link visible text, or `aria-label` when it only shows an icon.',
  () => root.value?.$el instanceof Element && root.value.$el.matches('a[href],[role=link],button'),
)

const classes = computed(() =>
  cn(
    toolbarLinkVariants({
      variant: ctx?.variant.value,
      size: pickToolbar(props.size ?? ctx?.size.value, TOOLBAR_SIZES, 'md'),
      density: ctx?.density.value,
      orientation: ctx?.orientation.value,
      overflow: ctx?.overflow.value,
    }),
    props.class,
  ),
)
</script>

<template>
  <RekaToolbarLink ref="root" data-slot="toolbar-link" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </RekaToolbarLink>
</template>
