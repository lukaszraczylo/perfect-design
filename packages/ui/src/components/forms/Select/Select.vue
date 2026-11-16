<script setup lang="ts">
import { SelectRoot } from 'reka-ui'
import { computed } from 'vue'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'

export interface SelectProps {
  /** Selected value. Omit for uncontrolled use. Item values must be non-empty strings. */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Controlled open state (`v-model:open`). */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  disabled?: boolean
  required?: boolean
  /** Form field name (renders a hidden native select for form submission). */
  name?: string
}

const props = withDefaults(defineProps<SelectProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  open: undefined,
  defaultOpen: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'update:open': [value: boolean] }>()

const control = useFieldControl({ required: () => props.required })
const required = computed(() => control.required.value)

useRequiredParts('Select', [
  { part: 'SelectTrigger', hint: 'Compose Select > SelectTrigger (with SelectValue) + SelectContent (with SelectItem).' },
  { part: 'SelectValue', hint: 'Put `<SelectValue placeholder="..." />` inside SelectTrigger so the chosen item is shown.' },
  { part: 'SelectContent', hint: 'Compose Select > SelectTrigger (with SelectValue) + SelectContent (with SelectItem).' },
])
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :open="open"
    :default-open="defaultOpen"
    :disabled="disabled"
    :required="required"
    :name="name"
    @update:model-value="(v) => emit('update:modelValue', String(v))"
    @update:open="(v) => emit('update:open', v)"
  >
    <slot />
    <RequiredPartsProbe owner="Select" />
  </SelectRoot>
</template>
