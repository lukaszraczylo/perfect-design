<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ToggleGroupItem as RekaToggleGroupItem, type PrimitiveProps } from 'reka-ui'
import { requireText, useRequireAccessibleName, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useToggleGroupContext } from './context'
import { toggleGroupItemVariants, type ToggleGroupShape, type ToggleGroupSize, type ToggleGroupTone, type ToggleGroupVariant } from './variants'

export interface ToggleGroupItemProps extends BaseProps {
  /** Value reported to the group's v-model when this item is pressed. */
  value: string
  disabled?: boolean
  /** Overrides the group's variant for this item. */
  variant?: ToggleGroupVariant
  /** Overrides the group's size for this item. */
  size?: ToggleGroupSize
  /** Overrides the group's corner shape for this item. */
  shape?: ToggleGroupShape
  /** Overrides the group's pressed colour for this item. */
  tone?: ToggleGroupTone
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToggleGroupItemProps>(), {
  disabled: false,
  variant: undefined,
  size: undefined,
  shape: undefined,
  tone: undefined,
  as: 'button',
})

defineSlots<{
  /** Item content. Receives the pressed state. */
  default?: (props: { pressed: boolean }) => unknown
}>()

const ctx = useToggleGroupContext()
const root = ref<{ $el?: unknown } | null>(null)
const claim = ctx?.claim?.(props.value)
onBeforeUnmount(() => claim?.release())

onMounted(async () => {
  await nextTick()
  requireText('ToggleGroupItem', 'value', props.value, 'It is the value reported to the group when the item is pressed.')
  if (claim && claim.count > 1 && props.value.trim() !== '') {
    violation('ToggleGroupItem', 'unique-value', `value "${props.value}" is used by more than one item in the group. Give every item its own value.`)
  }
})
// An icon-only item has no text to name it. Skipped for elements that do not take a name from content.
useRequireAccessibleName(
  'ToggleGroupItem',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'An icon-only item needs `aria-label` (or `aria-labelledby`, or visible text), e.g. aria-label="Align left".',
  () => root.value?.$el instanceof Element && root.value.$el.matches('button,[role=button],[role=radio],a[href]'),
)

const classes = computed(() =>
  toggleGroupItemVariants({
    variant: props.variant ?? ctx?.variant.value,
    size: props.size ?? ctx?.size.value,
    orientation: ctx?.orientation.value,
    fullWidth: ctx?.fullWidth?.value,
    shape: props.shape ?? ctx?.shape?.value,
    tone: props.tone ?? ctx?.tone?.value,
    gap: ctx?.gap?.value,
    class: props.class,
  }),
)
</script>

<template>
  <RekaToggleGroupItem
    ref="root"
    v-slot="{ modelValue: pressed }"
    data-slot="toggle-group-item"
    :value="value"
    :disabled="disabled"
    :as="as"
    :as-child="asChild"
    :class="classes"
  >
    <slot :pressed="!!pressed" />
  </RekaToggleGroupItem>
</template>
