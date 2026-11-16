<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import { useRejectableModel } from '../Field/useControlledValue'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { FIELD_STATUS_PAD, normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { dateInputVariants } from './variants'

export type DateInputType = 'date' | 'time' | 'datetime-local' | 'month'
export type DateInputReason = 'min' | 'max'

export interface DateInputMessages {
  /** Shown when the value is before `min`. `{min}` is replaced with the limit. */
  min?: string
  /** Shown when the value is after `max`. `{max}` is replaced with the limit. */
  max?: string
}

export interface DateInputValidation {
  valid: boolean
  reason: DateInputReason | null
  message: string | null
  value: string
}

export interface DateInputProps {
  /** ISO string matching `type`: `2024-05-01`, `13:30`, `2024-05-01T13:30`, `2024-05`. Empty string = no value. */
  modelValue?: string | null
  type?: DateInputType
  /** Lowest allowed ISO value (same format as `type`). */
  min?: string
  /** Highest allowed ISO value (same format as `type`). */
  max?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid regardless of min/max. */
  invalid?: boolean
  /** Surface treatment. */
  variant?: FieldVariant
  /** Height and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. */
  shape?: FieldShape
  /** Status colour plus an icon left of the native picker button (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Custom out-of-range messages. */
  messages?: DateInputMessages
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<DateInputProps>(), { type: 'date', variant: 'outline', size: 'md', shape: 'rounded', status: 'default' })
const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** After every user change: `{ valid, reason, message, value }`. */
  validate: [result: DateInputValidation]
  /** Only when the value is outside min/max. */
  invalid: [result: DateInputValidation]
}>()

const attrs = useAttrs()
const inputEl = ref<HTMLInputElement | null>(null)
useRequireAccessibleName('DateInput', () => inputEl.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')
const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const model = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => (model.value = v ?? ''),
)
const settle = useRejectableModel(() => props.modelValue, model, '')

function check(value: string): DateInputValidation {
  // ISO date/time strings sort lexicographically, so plain string comparison is a correct range check.
  let reason: DateInputReason | null = null
  if (value) {
    if (props.min && value < props.min) reason = 'min'
    else if (props.max && value > props.max) reason = 'max'
  }
  let message: string | null = null
  if (reason === 'min') message = (props.messages?.min ?? 'Must be on or after {min}').replace('{min}', props.min!)
  if (reason === 'max') message = (props.messages?.max ?? 'Must be on or before {max}').replace('{max}', props.max!)
  return { valid: reason === null, reason, message, value }
}

const result = computed(() => check(model.value))
const uid = useId()
const messageId = `date-input-msg-${uid}`
const statusId = `date-input-${uid}-status`
const showMessage = computed(() => !!result.value.message)
const invalid = computed(() => control.invalid.value || !result.value.valid)
/** Own message id is appended to the Field's (or the caller's) aria-describedby; it is read at render time so attrs stay current. */
function inputAttrs() {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, showMessage.value ? messageId : '', status.value === 'success' || status.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  if (props.readonly || control.disabled.value) {
    el.value = model.value
    return
  }
  model.value = el.value
  emit('update:modelValue', el.value)
  settle()
  const r = check(el.value)
  emit('validate', r)
  if (!r.valid) emit('invalid', r)
}

const classes = computed(() =>
  cn(
    dateInputVariants({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: status.value }),
    // The native picker button sits at the end, the status icon goes after it.
    status.value !== 'default' && FIELD_STATUS_PAD,
    props.class,
  ),
)
</script>

<template>
  <div data-slot="date-input" class="w-full">
    <span class="relative block">
      <input
        ref="inputEl"
        data-slot="date-input-field"
        :type="type"
        :value="model"
        :min="min"
        :max="max"
        :id="control.id.value"
        :disabled="control.disabled.value"
        :readonly="readonly"
        :required="control.required.value || undefined"
        :aria-invalid="invalid ? 'true' : undefined"
        :class="classes"
        v-bind="inputAttrs()"
        @input="onInput"
      />
      <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" />
    </span>
    <!-- Always rendered: a live region that is inserted together with its text is not reliably announced. -->
    <p
      :id="messageId"
      data-slot="date-input-message"
      role="status"
      aria-live="polite"
      :class="showMessage ? 'mt-1 text-sm text-destructive' : 'sr-only'"
    >
      {{ result.message }}
    </p>
  </div>
</template>
