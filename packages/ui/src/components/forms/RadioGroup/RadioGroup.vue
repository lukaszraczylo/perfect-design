<script setup lang="ts">
import { computed, provide, ref, type HTMLAttributes } from 'vue'
import { RadioGroupRoot } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useFieldControl } from '../Field/useFieldContext'
import { useRequireGroupName } from '../CheckboxCard/contract-helpers'
import type { ChoiceLabelPosition, ChoiceTone } from '../Checkbox/tones'
import { RADIO_GROUP_KEY } from './context'
import type { RadioGroupSize } from './variants'

export interface RadioGroupProps {
  /** Selected item value. Omit for uncontrolled use. */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  /** Marks the group invalid (aria-invalid). */
  invalid?: boolean
  orientation?: 'vertical' | 'horizontal'
  /** Size of every radio (and its label text). An item `size` wins. */
  size?: RadioGroupSize
  /** Colour of the checked state of every radio. An item `tone` wins. */
  tone?: ChoiceTone
  /** Side of the label in reading order for every item: `end` (default) or `start`. An item `labelPosition` wins. */
  labelPosition?: ChoiceLabelPosition
  /** Form field name (renders hidden inputs inside a `<form>`). */
  name?: string
  /** Loop arrow-key focus from last to first item. */
  loop?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  orientation: 'vertical',
  size: undefined,
  tone: undefined,
  labelPosition: undefined,
  loop: true,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })
const root = ref<{ $el: HTMLElement } | null>(null)
useRequireGroupName('RadioGroup', () => root.value?.$el, 'Wrap it in `Field` with a `label` or in `Fieldset` with a legend, or set `aria-label` / `aria-labelledby` on the group.')
const orientation = computed(() => (props.orientation === 'horizontal' ? 'horizontal' : 'vertical'))
provide(RADIO_GROUP_KEY, { size: computed(() => props.size), tone: computed(() => props.tone), labelPosition: computed(() => props.labelPosition), disabled: computed(() => control.disabled.value) })
const classes = computed(() =>
  cn(orientation.value === 'horizontal' ? 'flex flex-wrap items-center gap-x-5 gap-y-2' : 'grid gap-2.5', props.class),
)
</script>

<template>
  <RadioGroupRoot
    ref="root"
    data-slot="radio-group"
    :id="control.id.value"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="control.disabled.value"
    :required="control.required.value || undefined"
    :orientation="orientation"
    :name="name"
    :loop="loop"
    :aria-labelledby="control.labelledBy()"
    :aria-invalid="control.ariaInvalid.value"
    :aria-describedby="control.describedBy.value"
    :class="classes"
    @update:model-value="(v) => emit('update:modelValue', String(v))"
  >
    <slot />
  </RadioGroupRoot>
</template>
