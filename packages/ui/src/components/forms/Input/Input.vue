<script setup lang="ts">
import { computed, ref, useAttrs, useId, useSlots, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import { useNativeValidation } from '../Field/useNativeValidation'
import { usePreserveFocus, useRejectableModel } from '../Field/useControlledValue'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { useInputGroupStatus } from '../InputGroup/context'
import { inputVariants } from './variants'

export interface InputProps {
  modelValue?: string | number | null
  type?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  /** Surface treatment. */
  variant?: FieldVariant
  /** Height and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. */
  shape?: FieldShape
  /** Status colour plus an icon (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<InputProps>(), { type: 'text', variant: 'outline', size: 'md', shape: 'rounded', status: 'default' })
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const group = useInputGroupStatus()
const ariaInvalid = computed(() => (group.invalid.value ? ('true' as const) : control.ariaInvalid.value))
const el = ref<HTMLInputElement | null>(null)
useNativeValidation(el)
useRequireAccessibleName('Input', () => el.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.', () => props.type !== 'hidden')

const model = ref<string | number>(props.modelValue ?? '')
watch(() => props.modelValue, (v) => (model.value = v ?? ''))
const settle = useRejectableModel(() => props.modelValue, model, '')

// Identifier-like types are not prose: no autocorrect, autocapitalise or spellcheck.
const identifier = computed(() => ['email', 'url', 'tel'].includes(props.type))
const slots = useSlots()
const attrs = useAttrs()
const statusId = `input-${useId()}-status`
const hasPrefix = computed(() => !!slots.prefix)
const hasSuffix = computed(() => !!slots.suffix)
/** The bare `<input>` is the root unless something has to be positioned around it. */
const wrapped = computed(() => status.value !== 'default' || hasPrefix.value || hasSuffix.value)
usePreserveFocus(el, wrapped)

const variant = computed(() => normalizeVariant(props.variant))
const shape = computed(() => normalizeShape(props.shape))
/** Underline fields sit flush with the edge, pill fields need more room for the curve. */
const edge = computed(() => (variant.value === 'underline' ? 'flush' : shape.value === 'pill' ? 'pill' : 'normal'))
const PLACE = {
  flush: { start: 'start-0', end: 'end-0', beforeSuffix: 'end-6', ps: 'ps-7', pe: 'pe-7', peBoth: 'pe-12' },
  normal: { start: 'start-3', end: 'end-3', beforeSuffix: 'end-10', ps: 'ps-9', pe: 'pe-9', peBoth: 'pe-16' },
  pill: { start: 'start-4', end: 'end-4', beforeSuffix: 'end-11', ps: 'ps-10', pe: 'pe-10', peBoth: 'pe-16' },
} as const
const place = computed(() => PLACE[edge.value])

const endPad = computed(() => {
  const icon = status.value !== 'default'
  return hasSuffix.value && icon ? place.value.peBoth : hasSuffix.value || icon ? place.value.pe : ''
})

const classes = computed(() =>
  cn(
    inputVariants({ size: normalizeFieldSize(props.size), variant: variant.value, shape: shape.value, status: status.value }),
    hasPrefix.value && place.value.ps,
    endPad.value,
    props.class,
  ),
)
/** The status icon sits at the inline end, left of a suffix when there is one. */
const statusClass = computed(() => (hasSuffix.value ? place.value.beforeSuffix : edge.value === 'normal' ? undefined : place.value.end))
/** Everything the `<input>` gets, shared by the bare and the wrapped render. The caller's attributes win, except that the status id is appended to `aria-describedby`. */
const fieldAttrs = computed(() => {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, status.value === 'success' || status.value === 'warning' ? statusId : '', group.describedBy.value].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
})

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  const next = props.type === 'number' && target.value !== '' && !Number.isNaN(target.valueAsNumber) ? target.valueAsNumber : target.value
  model.value = next
  emit('update:modelValue', next)
  settle()
}
</script>

<template>
  <span v-if="wrapped" data-slot="input-wrapper" class="relative block w-full">
    <span v-if="hasPrefix" data-slot="input-prefix" aria-hidden="true" :class="cn('pointer-events-none absolute inset-y-0 flex items-center text-muted-foreground [&_svg]:size-4', place.start)">
      <slot name="prefix" />
    </span>
    <input
      ref="el"
      data-slot="input"
      :type="type"
      :value="model"
      :id="control.id.value"
      :disabled="control.disabled.value"
      :readonly="readonly"
      :required="control.required.value || undefined"
      :aria-invalid="ariaInvalid"
      :autocapitalize="identifier ? 'none' : undefined"
      :autocorrect="identifier ? 'off' : undefined"
      :spellcheck="identifier ? false : undefined"
      :class="classes"
      v-bind="fieldAttrs"
      @input="onInput"
    />
    <span v-if="hasSuffix" data-slot="input-suffix" aria-hidden="true" :class="cn('pointer-events-none absolute inset-y-0 flex items-center text-muted-foreground [&_svg]:size-4', place.end)">
      <slot name="suffix" />
    </span>
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" :class="statusClass" />
  </span>
  <input
    v-else
    ref="el"
    data-slot="input"
    :type="type"
    :value="model"
    :id="control.id.value"
    :disabled="control.disabled.value"
    :readonly="readonly"
    :required="control.required.value || undefined"
    :aria-invalid="ariaInvalid"
    :autocapitalize="identifier ? 'none' : undefined"
    :autocorrect="identifier ? 'off' : undefined"
    :spellcheck="identifier ? false : undefined"
    :class="classes"
    v-bind="fieldAttrs"
    @input="onInput"
  />
</template>
