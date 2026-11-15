<script setup lang="ts">
import { computed, inject } from 'vue'
import { ToolbarToggleGroup as RekaToolbarToggleGroup, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { TOOLBAR_KEY } from './context'
import { toolbarToggleGroupVariants } from './variants'

export interface ToolbarToggleGroupProps extends BaseProps {
  /** `single` keeps at most one item pressed (string value); `multiple` any number (string[] value). */
  type?: 'single' | 'multiple'
  /** Pressed value(s) (v-model). Leave undefined for uncontrolled use. */
  modelValue?: string | string[]
  /** Initial value(s) when uncontrolled. */
  defaultValue?: string | string[]
  /** Disables every item of the group. */
  disabled?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToolbarToggleGroupProps>(), {
  type: 'single',
  modelValue: undefined,
  defaultValue: undefined,
  disabled: false,
})

defineEmits<{ 'update:modelValue': [value: string | string[] | undefined] }>()

defineSlots<{
  /** `ToolbarToggleItem`s. */
  default?: () => unknown
}>()

const ctx = inject(TOOLBAR_KEY, null)
const classes = computed(() => cn(toolbarToggleGroupVariants({ orientation: ctx?.orientation.value, gap: ctx?.gap.value }), props.class))
</script>

<template>
  <RekaToolbarToggleGroup
    data-slot="toolbar-toggle-group"
    :type="type"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="disabled"
    :as="as"
    :as-child="asChild"
    :class="classes"
    @update:model-value="$emit('update:modelValue', $event as string | string[] | undefined)"
  >
    <slot />
  </RekaToolbarToggleGroup>
</template>
