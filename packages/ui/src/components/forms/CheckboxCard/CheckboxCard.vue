<script setup lang="ts">
import { computed, inject, type HTMLAttributes } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { useFieldControl } from '../Field/useFieldContext'
import SelectableCardShell from './SelectableCardShell.vue'
import { CHECKBOX_CARD_GROUP_KEY } from './context'
import { useGroupedCardValue } from './contract-helpers'
import { useControllable } from './use-controllable'
import type { CardLayout, CardSize, CardTone, CardVariant } from './variants'

export interface CheckboxCardProps {
  /** Checked state (v-model). Omit for uncontrolled use. Ignored when inside a `CheckboxCardGroup` and `value` is set. */
  modelValue?: boolean
  /** Initial state when uncontrolled. */
  defaultValue?: boolean
  /** Value used by a surrounding `CheckboxCardGroup`, and submitted with the form. */
  value?: string
  /** Title text. Use the `title` slot for rich content. */
  title?: string
  /** Description text. Use the `description` slot for rich content. */
  description?: string
  /** Optional icon shown before the text. Use the `icon` slot for anything else. */
  icon?: IconDefinition
  variant?: CardVariant
  size?: CardSize
  /** Colour of the checked state. Inherits the group tone when unset. */
  tone?: CardTone
  /** `stacked` puts the icon above the text and the indicator in the top end corner. Inherits the group layout when unset. */
  layout?: CardLayout
  disabled?: boolean
  required?: boolean
  /** Marks the card invalid (aria-invalid + destructive border). */
  invalid?: boolean
  /** Form field name. */
  name?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<CheckboxCardProps>(), {
  modelValue: undefined,
  defaultValue: false,
  value: undefined,
  title: undefined,
  description: undefined,
  icon: undefined,
  variant: undefined,
  size: undefined,
  tone: undefined,
  layout: undefined,
  name: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const group = inject(CHECKBOX_CARD_GROUP_KEY, null)
useGroupedCardValue('CheckboxCard', 'CheckboxCardGroup', group, () => props.value)
const grouped = computed(() => !!group && props.value !== undefined)
const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })
const own = useControllable<boolean>(
  () => (props.modelValue === undefined ? undefined : !!props.modelValue),
  !!props.defaultValue,
  (v) => emit('update:modelValue', v),
)

const checked = computed(() => (grouped.value ? group!.values.value.includes(props.value!) : !!own.value.value))
const disabled = computed(() => control.disabled.value || !!group?.disabled.value)
const invalid = computed(() => control.invalid.value || !!group?.invalid.value)
// In a group a required Field means "at least one checked": every card is required only while none is.
const nativeRequired = computed(() => (group ? !!props.required || (group.required.value && !group.values.value.length) : control.required.value))

function onChange(next: boolean) {
  if (disabled.value) return
  if (grouped.value) {
    group!.toggle(props.value!, next)
    emit('update:modelValue', next)
  } else own.set(next)
}
</script>

<template>
  <SelectableCardShell
    slot-name="checkbox-card"
    type="checkbox"
    :checked="checked"
    :variant="variant ?? group?.variant.value"
    :size="size ?? group?.size.value"
    :tone="tone ?? group?.tone.value"
    :layout="layout ?? group?.layout.value"
    :title="title"
    :description="description"
    :icon="icon"
    :value="value"
    :name="name ?? group?.name.value"
    :disabled="disabled"
    :invalid="invalid"
    :required="nativeRequired"
    :id="group ? undefined : control.id.value"
    :described-by="group ? undefined : control.describedBy.value"
    :class="props.class"
    v-bind="$attrs"
    @change="onChange"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" :checked="checked" /></template>
    <template v-if="$slots.title" #title><slot name="title" :checked="checked" /></template>
    <template v-if="$slots.description" #description><slot name="description" :checked="checked" /></template>
    <slot :checked="checked" />
  </SelectableCardShell>
</template>
