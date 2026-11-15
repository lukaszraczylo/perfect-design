<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { ToolbarButton as RekaToolbarButton, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { TOOLBAR_KEY } from './context'
import { TOOLBAR_SIZES, TOOLBAR_TONES, pickToolbar, toolbarButtonVariants, type ToolbarSize, type ToolbarTone } from './variants'

export interface ToolbarButtonProps extends BaseProps {
  /** Overrides the size of the bar for this button. */
  size?: ToolbarSize
  /** `neutral` (default) or `primary`, a solid fill for the one main action of the bar. */
  tone?: ToolbarTone
  /** Disabled buttons stay in the DOM and are skipped by roving focus. */
  disabled?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToolbarButtonProps>(), { size: undefined, tone: 'neutral', disabled: false, as: 'button' })

defineSlots<{
  /** Label, icon, or both. An icon-only button needs `aria-label`. */
  default?: () => unknown
}>()

const ctx = inject(TOOLBAR_KEY, null)
const root = ref<{ $el?: unknown } | null>(null)
const isControl = () => root.value?.$el instanceof Element && root.value.$el.matches('button,[role=button],a[href]')
useRequireAccessibleName(
  'ToolbarButton',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'An icon-only button needs `aria-label` (or `aria-labelledby`, or visible text), e.g. aria-label="Copy".',
  isControl,
)

const classes = computed(() =>
  cn(
    toolbarButtonVariants({
      variant: ctx?.variant.value,
      size: pickToolbar(props.size ?? ctx?.size.value, TOOLBAR_SIZES, 'md'),
      density: ctx?.density.value,
      orientation: ctx?.orientation.value,
      overflow: ctx?.overflow.value,
      tone: pickToolbar(props.tone, TOOLBAR_TONES, 'neutral'),
    }),
    props.class,
  ),
)
</script>

<template>
  <RekaToolbarButton ref="root" data-slot="toolbar-button" :disabled="disabled" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </RekaToolbarButton>
</template>
