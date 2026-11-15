<script setup lang="ts">
import { computed, nextTick, onMounted, ref, type HTMLAttributes } from 'vue'
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import type { IconDefinition } from '../../../lib/icons-tools'
import { accessibleName, violation } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import { checkOptionValues, useRequireGroupName } from '../CheckboxCard/contract-helpers'
import { normalizeSegmentedOrientation, normalizeSegmentedSize, segmentedControlItemVariants, segmentedControlVariants, type SegmentedOrientation, type SegmentedSize, type SegmentedTone, type SegmentedVariant } from './variants'

export interface SegmentedControlOption {
  value: string
  label: string
  disabled?: boolean
  /** Optional FontAwesome icon shown before the label. */
  icon?: IconDefinition
}

export interface SegmentedControlProps {
  /** Selected option value. Omit for uncontrolled use. */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  options?: SegmentedControlOption[]
  size?: SegmentedSize
  /** `pill` (default) tray with a raised chip, `underline` rule with a marker, `outline` bordered, `filled` solid selection. */
  variant?: SegmentedVariant
  /** Colour of the selected segment. `default` keeps the neutral look of the variant. */
  tone?: SegmentedTone
  /** `vertical` stacks the segments in a column and switches the arrow keys to Up and Down. */
  orientation?: SegmentedOrientation
  /** Stretch to the container width with equally sized options. */
  fullWidth?: boolean
  disabled?: boolean
  /** Marks the group invalid (aria-invalid). */
  invalid?: boolean
  /** Form field name (renders hidden inputs inside a `<form>`). */
  name?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<SegmentedControlProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  options: () => [],
  size: 'md',
  variant: 'pill',
  tone: 'default',
  orientation: 'horizontal',
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled })

const root = ref<{ $el: HTMLElement } | null>(null)
useRequireGroupName('SegmentedControl', () => root.value?.$el, 'Wrap it in `Field` with a `label` or in `Fieldset` with a legend, or set `aria-label` / `aria-labelledby`.')
onMounted(async () => {
  checkOptionValues('SegmentedControl', 'option', (Array.isArray(props.options) ? props.options : []).map((o) => o?.value))
  await nextTick()
  if (!root.value) return
  const unnamed = [...root.value.$el.querySelectorAll('[data-slot=segmented-control-item]')].filter((item) => !accessibleName(item))
  if (unnamed.length) {
    const values = unnamed.map((item) => `"${item.getAttribute('value')}"`).join(', ')
    violation('SegmentedControl', 'requires-option-label', `requires a text \`label\` on every option, but ${values} has none. Icon-only options still need a label; with the \`option\` slot, include text (VisuallyHidden is fine) in it.`)
  }
})

const ICON_SIZES = { sm: 'xs', md: 'sm', lg: 'md' } as const
const iconSize = computed(() => ICON_SIZES[normalizeSegmentedSize(props.size)])
const orientation = computed(() => normalizeSegmentedOrientation(props.orientation))

const rootClasses = computed(() => segmentedControlVariants({ variant: props.variant, orientation: props.orientation, fullWidth: props.fullWidth, class: props.class }))
const itemClasses = computed(() =>
  segmentedControlItemVariants({ variant: props.variant, tone: props.tone, orientation: props.orientation, fullWidth: props.fullWidth, size: props.size }),
)
</script>

<template>
  <RadioGroupRoot
    ref="root"
    data-slot="segmented-control"
    :id="control.id.value"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="control.disabled.value"
    :name="name"
    :orientation="orientation"
    :aria-labelledby="control.labelledBy()"
    :aria-invalid="control.ariaInvalid.value"
    :aria-describedby="control.describedBy.value"
    :class="rootClasses"
    @update:model-value="(v) => emit('update:modelValue', String(v))"
  >
    <RadioGroupItem
      v-for="o in options"
      :key="o.value"
      data-slot="segmented-control-item"
      :value="o.value"
      :disabled="o.disabled"
      :class="itemClasses"
    >
      <slot name="option" :option="o">
        <Icon v-if="o.icon" :icon="o.icon" :size="iconSize" />
        <span>{{ o.label }}</span>
      </slot>
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
