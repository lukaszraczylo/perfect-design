<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref } from 'vue'
import { ToolbarToggleItem as RekaToolbarToggleItem, type PrimitiveProps } from 'reka-ui'
import { requireText, useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { TOOLBAR_KEY } from './context'
import { TOOLBAR_SIZES, pickToolbar, toolbarToggleItemVariants, type ToolbarSize } from './variants'

export interface ToolbarToggleItemProps extends BaseProps {
  /** Value reported to the group's v-model when this item is pressed. Unique in the group. */
  value: string
  /** Overrides the size of the bar for this item. */
  size?: ToolbarSize
  disabled?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToolbarToggleItemProps>(), { size: undefined, disabled: false, as: 'button' })

defineSlots<{
  /** Label, icon, or both. An icon-only item needs `aria-label`. */
  default?: () => unknown
}>()

const ctx = inject(TOOLBAR_KEY, null)
const root = ref<{ $el?: unknown } | null>(null)

onMounted(async () => {
  await nextTick()
  requireText('ToolbarToggleItem', 'value', props.value, 'It is the value reported to the group when the item is pressed.')
})
useRequireAccessibleName(
  'ToolbarToggleItem',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'An icon-only item needs `aria-label` (or `aria-labelledby`, or visible text), e.g. aria-label="Bold".',
  () => root.value?.$el instanceof Element && root.value.$el.matches('button,[role=button],[role=radio],a[href]'),
)

const classes = computed(() =>
  toolbarToggleItemVariants({
    variant: ctx?.variant.value,
    size: pickToolbar(props.size ?? ctx?.size.value, TOOLBAR_SIZES, 'md'),
    density: ctx?.density.value,
    orientation: ctx?.orientation.value,
    overflow: ctx?.overflow.value,
    class: props.class,
  }),
)
</script>

<template>
  <RekaToolbarToggleItem ref="root" data-slot="toolbar-toggle-item" :value="value" :disabled="disabled" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </RekaToolbarToggleItem>
</template>
