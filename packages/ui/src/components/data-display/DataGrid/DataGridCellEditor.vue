<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { cn } from '../../../lib/cn'
import type { DataGridColumnType, DataGridOption } from './types'

const props = defineProps<{
  type: DataGridColumnType
  /** The text being edited. For a select this is the string form of the chosen option value. */
  modelValue: string
  options?: DataGridOption[]
  /** Accessible name of the editor. */
  label: string
  /** Validation message. Sets aria-invalid and aria-describedby. */
  error?: string | null
  errorId?: string
  textClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Enter, Tab or blur. `event` is the key event, so the grid can keep focus in place when the value is rejected. */
  commit: [event: KeyboardEvent | FocusEvent]
  cancel: []
}>()

const el = ref<HTMLInputElement | HTMLSelectElement | null>(null)
onMounted(() => {
  el.value?.focus()
  if (el.value instanceof HTMLInputElement) el.value.select()
})

const invalid = computed(() => !!props.error)
const classes = computed(() =>
  cn(
    'h-full w-full min-w-0 rounded-sm border bg-background px-2 text-foreground outline-hidden',
    'focus-visible:ring-2 focus-visible:ring-ring forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-ring',
    invalid.value ? 'border-destructive' : 'border-input',
    props.textClass,
  ),
)

function onKeydown(event: KeyboardEvent) {
  // An IME candidate window uses Enter and Escape for itself.
  if (event.isComposing || event.keyCode === 229) return
  if (event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    emit('commit', event)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('cancel')
  } else if (event.key === 'Tab') {
    emit('commit', event)
  } else if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End' || event.key === 'PageUp' || event.key === 'PageDown') {
    // Caret and option keys belong to the editor, not to grid navigation.
    event.stopPropagation()
  } else if (event.key === ' ' || event.key === 'F2' || (event.key.toLowerCase() === 'c' && (event.ctrlKey || event.metaKey))) {
    event.stopPropagation()
  }
}
</script>

<template>
  <select
    v-if="type === 'select'"
    ref="el"
    data-slot="data-grid-editor"
    :value="modelValue"
    :class="classes"
    :aria-label="label"
    :aria-invalid="invalid ? 'true' : undefined"
    :aria-describedby="invalid ? errorId : undefined"
    @input="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    @keydown="onKeydown"
    @blur="emit('commit', $event)"
  >
    <option v-for="option in options ?? []" :key="String(option.value)" :value="String(option.value)">{{ option.label }}</option>
  </select>
  <input
    v-else
    ref="el"
    data-slot="data-grid-editor"
    type="text"
    :inputmode="type === 'number' ? 'decimal' : undefined"
    :value="modelValue"
    :class="classes"
    :aria-label="label"
    :aria-invalid="invalid ? 'true' : undefined"
    :aria-describedby="invalid ? errorId : undefined"
    autocomplete="off"
    spellcheck="false"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @keydown="onKeydown"
    @blur="emit('commit', $event)"
  />
</template>
