<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import { useAnnouncer, useFieldLabelId } from '../TimeInput/announce'
import { EDITABLE_SIZES, EDITABLE_VARIANTS, editableVariants, type EditableSize, type EditableVariant } from './variants'

export interface EditableProps {
  modelValue?: string | null
  /** Shown (muted) in preview mode and as the control placeholder while the value is empty. */
  placeholder?: string
  /**
   * What commits the draft. `both` (default): Enter and blur. `enter`: Enter only (blur cancels).
   * `blur`: blur only (Enter is ignored; blur commits). Escape always cancels.
   */
  submitMode?: 'both' | 'enter' | 'blur'
  /** How the preview enters edit mode. Enter, Space and F2 always work on the focused preview. */
  activationMode?: 'click' | 'dblclick' | 'focus'
  /** Edit with a `<textarea>`. Enter inserts a newline; Shift/Ctrl/Cmd+Enter commits (when submitMode allows Enter). */
  multiline?: boolean
  /** Rows of the textarea. */
  rows?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  size?: EditableSize
  /** Look before editing: `plain` (default, reads as text until hovered), `outline`, `filled` or `underline`. */
  variant?: EditableVariant
  /** Accessible name of the editing control and the preview button. */
  ariaLabel?: string
  /** Spoken after a commit (polite live region). */
  savedLabel?: string
  /** Spoken after the draft is discarded. */
  cancelledLabel?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<EditableProps>(), {
  submitMode: 'both',
  activationMode: 'click',
  rows: 3,
  size: 'md',
  variant: 'plain',
  savedLabel: 'Saved',
  cancelledLabel: 'Changes discarded',
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Draft committed (also fired when the value is unchanged). */
  submit: [value: string]
  /** Draft discarded; payload is the unchanged value. */
  cancel: [value: string]
  /** Edit mode entered. */
  edit: []
}>()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const value = ref(props.modelValue ?? '')
watch(() => props.modelValue, (v) => (value.value = v ?? ''))

const editing = ref(false)
const draft = ref('')
const field = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const preview = ref<HTMLElement | null>(null)
const labelId = useFieldLabelId(() => control.id.value, preview)
// A name is required: the editing control has none of its own, and the preview would only read its current text.
// Registered after `useFieldLabelId`: the Field label id must be set before the name is checked.
onMounted(async () => {
  await nextTick()
  if (props.ariaLabel?.trim() || labelId.value) return
  violation('Editable', 'requires-accessible-name', 'needs an accessible name. Set `ariaLabel` or wrap it in `Field` with a `label`.')
})
const { message: status, announce } = useAnnouncer()
let suppressFocusEdit = false
const locked = computed(() => control.disabled.value || props.readonly)

let alive = true
onBeforeUnmount(() => (alive = false))

function edit() {
  if (locked.value || editing.value) return
  draft.value = value.value
  editing.value = true
  emit('edit')
  void nextTick(() => {
    if (!alive) return
    field.value?.focus()
    field.value?.select()
  })
}

/** After a keyboard commit/cancel the input unmounts; give focus back to the preview (in `focus` mode without re-entering edit mode). */
function restoreFocus() {
  void nextTick(() => {
    if (!alive || !preview.value) return
    suppressFocusEdit = true
    preview.value.focus()
    suppressFocusEdit = false
  })
}

function onPreviewFocus() {
  if (props.activationMode === 'focus' && !suppressFocusEdit) edit()
}

function submit(refocus = false) {
  if (!editing.value) return
  editing.value = false
  const next = draft.value
  if (next !== value.value) {
    value.value = next
    emit('update:modelValue', next)
  }
  emit('submit', next)
  announce(`${props.savedLabel}${next ? `: ${next}` : ''}`)
  if (refocus) restoreFocus()
}

function cancel(refocus = false) {
  if (!editing.value) return
  editing.value = false
  emit('cancel', value.value)
  announce(props.cancelledLabel)
  if (refocus) restoreFocus()
}

function onFieldKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    return cancel(true)
  }
  if (e.key !== 'Enter' || e.isComposing || props.submitMode === 'blur') return
  if (props.multiline && !(e.shiftKey || e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  submit(true)
}

function onBlur() {
  if (props.submitMode === 'enter') cancel()
  else submit()
}

function onPreviewKeydown(e: KeyboardEvent) {
  if (e.key === 'F2' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    edit()
  }
}

defineExpose({ edit, submit, cancel, editing })

const fieldAttrs = computed(() => ({
  id: control.id.value,
  placeholder: props.placeholder,
  'aria-label': props.ariaLabel,
  autocomplete: 'off',
  'aria-describedby': control.describedBy.value,
  'aria-invalid': control.invalid.value ? ('true' as const) : undefined,
  required: control.required.value || undefined,
}))
const isEmpty = computed(() => value.value === '')
/** Name of the preview button: the control's purpose plus the visible text (contains the visible text, WCAG 2.5.3). */
const previewLabel = computed(() => {
  if (!props.ariaLabel || locked.value) return undefined
  const shown = isEmpty.value ? props.placeholder : value.value
  return shown ? `${props.ariaLabel}: ${shown}` : props.ariaLabel
})
const previewLabelledby = computed(() => (!props.ariaLabel && labelId.value && control.id.value && !locked.value ? `${labelId.value} ${control.id.value}` : undefined))
const look = computed(() => ({
  size: EDITABLE_SIZES.includes(props.size) ? props.size : ('md' as const),
  variant: EDITABLE_VARIANTS.includes(props.variant) ? props.variant : ('plain' as const),
}))
const rootClasses = computed(() => cn('block w-full min-w-0', props.class))
</script>

<template>
  <div data-slot="editable" :data-editing="editing ? '' : undefined" :data-disabled="control.disabled.value ? '' : undefined" :class="rootClasses">
    <textarea
      v-if="editing && multiline"
      ref="field"
      data-slot="editable-input"
      v-bind="fieldAttrs"
      :value="draft"
      :rows="rows"
      :class="cn(editableVariants({ ...look, state: 'editing' }), 'resize-y')"
      @input="draft = ($event.target as HTMLTextAreaElement).value"
      @keydown="onFieldKeydown"
      @blur="onBlur"
    />
    <input
      v-else-if="editing"
      ref="field"
      data-slot="editable-input"
      type="text"
      enterkeyhint="done"
      v-bind="fieldAttrs"
      :value="draft"
      :class="editableVariants({ ...look, state: 'editing' })"
      @input="draft = ($event.target as HTMLInputElement).value"
      @keydown="onFieldKeydown"
      @blur="onBlur"
    />
    <span
      v-else
      ref="preview"
      data-slot="editable-preview"
      :id="control.id.value"
      :aria-describedby="control.describedBy.value"
      :role="locked ? undefined : 'button'"
      :tabindex="locked ? undefined : 0"
      :aria-label="previewLabel"
      :aria-labelledby="previewLabelledby"
      :aria-disabled="control.disabled.value ? 'true' : undefined"
      :data-readonly="readonly ? '' : undefined"
      :data-empty="isEmpty ? '' : undefined"
      :class="editableVariants({ ...look, state: 'preview' })"
      @click="activationMode === 'click' && edit()"
      @dblclick="activationMode === 'dblclick' && edit()"
      @focus="onPreviewFocus"
      @keydown="onPreviewKeydown"
    >{{ isEmpty ? placeholder : value }}</span>
    <span data-slot="editable-status" role="status" class="sr-only">{{ status }}</span>
  </div>
</template>
