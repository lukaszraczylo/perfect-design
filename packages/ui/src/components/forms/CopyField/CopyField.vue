<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, useId, type HTMLAttributes } from 'vue'
import { useClipboard } from '../../../lib/use-helpers'
import { faCheck, faCopy } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { FIELD_STATUS_PAD, normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { copyFieldButtonVariants, copyFieldVariants } from './variants'

export interface CopyFieldProps {
  /** Text shown in the read-only input and copied to the clipboard. */
  value?: string | null
  /** Alias of `value` so the field can be bound with `v-model`. It never emits (the input is read-only). */
  modelValue?: string | null
  /** Label of the copy button. */
  label?: string
  /** Label of the copy button while in the copied state. */
  copiedLabel?: string
  /** Message announced and shown when copying fails. */
  failedLabel?: string
  /** How long (ms) the copied state is shown. Read once when the component is created. */
  copiedDuring?: number
  /** Hide the value (password dots). The real value is still what gets copied. */
  mask?: boolean
  /** Show only the icon; the label stays available to assistive tech. */
  iconOnly?: boolean
  disabled?: boolean
  invalid?: boolean
  /** Surface treatment of the input and the joined button. */
  variant?: FieldVariant
  /** Height of the input and the button. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. `pill` rounds the start of the input and the end of the button. */
  shape?: FieldShape
  /** Status colour plus an icon at the end of the input (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Classes for the inner <input> (the `class` prop styles the wrapper). */
  inputClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<CopyFieldProps>(), {
  label: 'Copy',
  copiedLabel: 'Copied',
  failedLabel: 'Copy failed',
  copiedDuring: 2000,
  variant: 'outline',
  size: 'md',
  shape: 'rounded',
  status: 'default',
})
const emit = defineEmits<{
  copy: [value: string]
  'copy-error': [error: unknown]
}>()

const kind = computed(() => normalizeStatus(props.status))
const attrs = useAttrs()
const statusId = `copy-field-${useId()}-status`
const control = useFieldControl({ invalid: () => props.invalid || kind.value === 'error', disabled: () => props.disabled })

const text = computed(() => props.modelValue ?? props.value ?? '')
// `legacy` falls back to execCommand so copying also works on plain-http origins.
const { copy, copied } = useClipboard({ copiedDuring: Math.max(0, Number(props.copiedDuring) || 0), legacy: true })

const inputEl = ref<HTMLInputElement | null>(null)
const buttonEl = ref<HTMLButtonElement | null>(null)
useRequireAccessibleName('CopyField', () => inputEl.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')
useRequireAccessibleName('CopyField', () => buttonEl.value, 'The copy button has no text: leave `label` unset for the default or give it a non-empty string (`iconOnly` keeps it for assistive tech).')
const canCopy = computed(() => !control.disabled.value && text.value !== '')

// A failed copy is shown and announced like a successful one, then cleared so no stale message stays in browse mode.
const failed = ref(false)
let failTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(failTimer))

async function onCopy() {
  if (!canCopy.value) return
  const value = text.value
  clearTimeout(failTimer)
  if (await copy(value)) {
    failed.value = false
    emit('copy', value)
  } else {
    failed.value = true
    failTimer = setTimeout(() => (failed.value = false), Math.max(0, Number(props.copiedDuring) || 0))
    emit('copy-error', new Error('Copy to clipboard failed'))
  }
}
const status = computed(() => (copied.value ? props.copiedLabel : failed.value ? props.failedLabel : ''))

const look = computed(() => ({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: kind.value }))
const inputClasses = computed(() => cn(copyFieldVariants(look.value), kind.value !== 'default' && FIELD_STATUS_PAD, props.inputClass))
const buttonClasses = computed(() => cn(copyFieldButtonVariants(look.value), copied.value && 'text-success', failed.value && 'text-destructive'))
/** The caller's attributes win, except that the status id is appended to `aria-describedby`. */
function inputAttrs() {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, kind.value === 'success' || kind.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
}

defineExpose({ el: inputEl, copy: onCopy })
</script>

<template>
  <div
    data-slot="copy-field"
    :data-copied="copied ? '' : undefined"
    :data-failed="failed ? '' : undefined"
    :class="cn('flex w-full items-stretch', props.class)"
  >
    <!-- No box of its own by default; with a status it anchors the icon to the input, not to the button. -->
    <div :class="kind === 'default' ? 'contents' : 'relative flex min-w-0 flex-1'">
      <input
        ref="inputEl"
        data-slot="copy-field-input"
        :type="mask ? 'password' : 'text'"
        :id="control.id.value"
        :value="text"
        readonly
        :disabled="control.disabled.value"
        :aria-invalid="control.ariaInvalid.value"
        autocomplete="off"
        spellcheck="false"
        :class="inputClasses"
        v-bind="inputAttrs()"
        @focus="inputEl?.select()"
      />
      <FieldStatusIcon :status="kind" :id="statusId" :label="statusLabel" />
    </div>
    <button
      ref="buttonEl"
      type="button"
      data-slot="copy-field-button"
      :disabled="!canCopy"
      :class="buttonClasses"
      @click="onCopy"
    >
      <Icon :icon="copied ? faCheck : faCopy" size="sm" />
      <span :class="iconOnly && 'sr-only'">{{ copied ? copiedLabel : failed ? failedLabel : label }}</span>
    </button>
    <span data-slot="copy-field-status" role="status" aria-live="polite" class="sr-only">{{ status }}</span>
  </div>
</template>
