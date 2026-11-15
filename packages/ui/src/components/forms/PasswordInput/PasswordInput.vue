<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { faEye, faEyeSlash } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import { useNativeValidation } from '../Field/useNativeValidation'
import { fieldAddonButton } from '../Field/field-styles'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { passwordInputVariants } from './variants'

export interface PasswordInputProps {
  modelValue?: string | null
  /** Whether the password is shown as plain text. Supports `v-model:visible`; uncontrolled when omitted. */
  visible?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  /** Surface treatment of the input. */
  variant?: FieldVariant
  /** Height and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. */
  shape?: FieldShape
  /** Status colour plus an icon left of the toggle (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Native autocomplete token. Use `new-password` on sign-up / change-password forms. */
  autocomplete?: string
  /** Accessible name of the toggle. The name stays the same in both states; `aria-pressed` carries the state. */
  showLabel?: string
  /** Kept for compatibility. The toggle name no longer changes with the state (a name change plus `aria-pressed` reads as a double state). */
  hideLabel?: string
  /** Described-by text of the toggle, read when it receives focus. */
  revealWarning?: string
  /** Classes for the inner <input> (the `class` prop styles the wrapper). */
  inputClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<PasswordInputProps>(), {
  visible: undefined,
  variant: 'outline',
  size: 'md',
  shape: 'rounded',
  status: 'default',
  autocomplete: 'current-password',
  showLabel: 'Show password',
  hideLabel: 'Hide password',
  revealWarning: 'Shows the password as plain text on screen.',
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:visible': [value: boolean]
}>()
const attrs = useAttrs()

const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const model = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => {
    model.value = v ?? ''
  },
)

const shown = ref(!!props.visible)
watch(
  () => props.visible,
  (v) => {
    shown.value = !!v
  },
)

const uid = useId()
const inputId = computed(() => (typeof attrs.id === 'string' && attrs.id) || control.id.value || `password-${uid}`)
const warningId = computed(() => `${inputId.value}-reveal-warning`)

const inputEl = ref<HTMLInputElement | null>(null)
useNativeValidation(inputEl)
const toggleEl = ref<HTMLButtonElement | null>(null)
useRequireAccessibleName('PasswordInput', () => inputEl.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')
useRequireAccessibleName('PasswordInput', () => toggleEl.value, 'The show/hide toggle has no name: leave `showLabel` unset for the default or give it a non-empty string.')

const statusId = computed(() => `${inputId.value}-status`)
/** The status icon sits left of the toggle, so the text needs more end padding. */
const inputClasses = computed(() =>
  cn(
    passwordInputVariants({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: status.value }),
    status.value !== 'default' && 'pe-16 pointer-coarse:pe-20',
    props.inputClass,
  ),
)
/** The caller's attributes win, except that the status id is appended to `aria-describedby`. */
function inputAttrs() {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, status.value === 'success' || status.value === 'warning' ? statusId.value : ''].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  model.value = v
  emit('update:modelValue', v)
}

function toggle() {
  if (control.disabled.value) return
  shown.value = !shown.value
  emit('update:visible', shown.value)
}
</script>

<template>
  <div data-slot="password-input" :class="cn('relative w-full', props.class)">
    <input
      ref="inputEl"
      data-slot="password-input-field"
      :type="shown ? 'text' : 'password'"
      :id="inputId"
      :value="model"
      :autocomplete="autocomplete"
      :disabled="control.disabled.value"
      :readonly="readonly"
      :required="control.required.value || undefined"
      :aria-invalid="control.ariaInvalid.value"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
      :class="inputClasses"
      v-bind="inputAttrs()"
      @input="onInput"
    />
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" class="end-9 pointer-coarse:end-12" />
    <button
      ref="toggleEl"
      type="button"
      data-slot="password-input-toggle"
      :disabled="control.disabled.value"
      :aria-pressed="shown ? 'true' : 'false'"
      :aria-label="showLabel"
      :aria-describedby="warningId"
      :aria-controls="inputId"
      :class="fieldAddonButton"
      @click="toggle"
    >
      <Icon :icon="shown ? faEyeSlash : faEye" size="sm" />
    </button>
    <span :id="warningId" data-slot="password-input-warning" class="sr-only">{{ revealWarning }}</span>
  </div>
</template>
