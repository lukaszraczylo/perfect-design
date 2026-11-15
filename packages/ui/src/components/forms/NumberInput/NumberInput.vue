<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { faMinus, faPlus } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { useAnnouncer } from '../TimeInput/announce'
import { numberInputVariants } from './variants'

export interface NumberInputProps {
  /** Current value; `null` means empty. */
  modelValue?: number | null
  min?: number
  max?: number
  /** Increment for the steppers and ArrowUp/ArrowDown. PageUp/PageDown move by 10 steps. */
  step?: number
  /** Fixed number of decimals. Values are rounded to it and displayed padded (`1.50`). Omit to keep what was typed. */
  precision?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  placeholder?: string
  /** Surface treatment of the whole control. */
  variant?: FieldVariant
  /** Height, stepper width and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. `pill` clips the steppers to the rounded ends. */
  shape?: FieldShape
  /** Status colour plus an icon left of the increment stepper (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Show the -/+ buttons. */
  showSteppers?: boolean
  decrementLabel?: string
  incrementLabel?: string
  /** Spoken (polite live region) when typed text is not a number and the previous value is restored. */
  invalidLabel?: string
  /** Spoken when min, max or precision changes the entered number: `Adjusted to 10`. */
  adjustedLabel?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<NumberInputProps>(), {
  step: 1,
  variant: 'outline',
  size: 'md',
  shape: 'rounded',
  status: 'default',
  showSteppers: true,
  decrementLabel: 'Decrease',
  incrementLabel: 'Increase',
  invalidLabel: 'Not a number, value restored',
  adjustedLabel: 'Adjusted to',
})
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const { message: liveText, announce } = useAnnouncer()
const attrs = useAttrs()
const inputEl = ref<HTMLInputElement | null>(null)
const decrementEl = ref<HTMLButtonElement | null>(null)
const incrementEl = ref<HTMLButtonElement | null>(null)
useRequireAccessibleName('NumberInput', () => inputEl.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')
useRequireAccessibleName('NumberInput', () => decrementEl.value, 'The decrement stepper has no name: leave `decrementLabel` unset for the default or give it a non-empty string, or set `showSteppers` to false.')
useRequireAccessibleName('NumberInput', () => incrementEl.value, 'The increment stepper has no name: leave `incrementLabel` unset for the default or give it a non-empty string, or set `showSteppers` to false.')
const kind = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || kind.value === 'error', disabled: () => props.disabled, required: () => props.required })

/** Number of decimal places in the plain or exponent representation of `n`. */
function decimals(n: number): number {
  const [mantissa = '', exp = '0'] = String(n).split('e')
  const frac = (mantissa.split('.')[1] ?? '').length
  return Math.max(0, frac - Number(exp))
}

/** Round to `d` decimals, float-safe (0.1 + 0.2 -> 0.3). */
function round(n: number, d: number): number {
  if (String(n).includes('e')) return Number(n.toFixed(Math.min(d, 100)))
  return Number(Math.round(Number(`${n}e${d}`)) + `e-${d}`)
}

function clamp(n: number): number {
  let v = n
  if (props.min !== undefined && v < props.min) v = props.min
  if (props.max !== undefined && v > props.max) v = props.max
  return v
}

function normalize(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function format(v: number | null): string {
  if (v === null) return ''
  return props.precision !== undefined ? v.toFixed(props.precision) : String(v)
}

/** Strict decimal parser: optional sign, digits, optional single separator. Returns null for anything else. */
function parse(text: string): number | null {
  const t = text.trim().replace(/\s+/g, '')
  const normalized = /^[+-]?\d*,\d+$/.test(t) ? t.replace(',', '.') : t
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

const value = ref<number | null>(normalize(props.modelValue))
const text = ref(format(value.value))
watch(
  () => props.modelValue,
  (v) => {
    value.value = normalize(v)
    text.value = format(value.value)
  },
)

const locked = computed(() => control.disabled.value || props.readonly)

/** Only typed or key-driven commits report clamping; stepper buttons announce the new value instead. */
let announceAdjust = true

function commitNumber(next: number | null) {
  if (next === null) {
    if (value.value !== null) emit('update:modelValue', null)
    value.value = null
    text.value = ''
    return
  }
  let n = clamp(next)
  if (props.precision !== undefined) n = clamp(round(n, props.precision))
  if (n !== next && announceAdjust) announce(`${props.adjustedLabel} ${format(n)}`)
  const changed = n !== value.value
  value.value = n
  text.value = format(n)
  if (changed) emit('update:modelValue', n)
}

/** Commit the draft text: empty -> null, valid -> clamped number, anything else -> revert. */
function commitText() {
  if (locked.value) {
    text.value = format(value.value)
    return
  }
  if (text.value.trim() === '') return commitNumber(null)
  const parsed = parse(text.value)
  if (parsed === null) {
    text.value = format(value.value)
    announce(props.invalidLabel)
    return
  }
  commitNumber(parsed)
}

function stepBy(multiplier: number) {
  if (locked.value) return
  const draft = text.value.trim()
  const base = draft === '' ? 0 : (parse(draft) ?? value.value ?? 0)
  const d = Math.max(decimals(base), decimals(props.step), props.precision ?? 0)
  commitNumber(round(base + multiplier * props.step, d))
}

/** Stepper buttons are outside the tab order and keep focus off the input, so speak the result. */
function onStepper(multiplier: number) {
  if (locked.value) return
  announceAdjust = false
  stepBy(multiplier)
  announceAdjust = true
  announce(text.value)
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  if (locked.value) el.value = text.value
  else text.value = el.value
}

function onKeydown(e: KeyboardEvent) {
  if (locked.value) return
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      return stepBy(1)
    case 'ArrowDown':
      e.preventDefault()
      return stepBy(-1)
    case 'PageUp':
      e.preventDefault()
      return stepBy(10)
    case 'PageDown':
      e.preventDefault()
      return stepBy(-10)
    case 'Home':
      if (props.min === undefined) return
      e.preventDefault()
      return commitNumber(props.min)
    case 'End':
      if (props.max === undefined) return
      e.preventDefault()
      return commitNumber(props.max)
    case 'Enter':
      return commitText()
  }
}

const atMin = computed(() => value.value !== null && props.min !== undefined && value.value <= props.min)
const atMax = computed(() => value.value !== null && props.max !== undefined && value.value >= props.max)

const size = computed(() => normalizeFieldSize(props.size))
const rootClasses = computed(() =>
  cn(numberInputVariants({ size: size.value, variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: kind.value }), props.class),
)
/** Stepper width, input text and padding per size. The `md` entries are empty: they are the base classes. */
const SIZE_BUTTON = { xs: 'w-7', sm: 'w-8', md: '', lg: 'w-11' } as const
const SIZE_INPUT = { xs: 'px-2 md:text-xs', sm: 'md:text-sm', md: '', lg: '' } as const
/** The status icon sits left of the increment stepper (or at the end without steppers). */
const SIZE_ICON = { xs: 'end-8 pointer-coarse:end-12', sm: 'end-9 pointer-coarse:end-12', md: 'end-10 pointer-coarse:end-12', lg: 'end-12' } as const
const statusClass = computed(() => (props.showSteppers ? SIZE_ICON[size.value] : undefined))
const buttonClasses = computed(
  () => cn('inline-flex w-9 shrink-0 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 pointer-coarse:w-11', SIZE_BUTTON[size.value]),
)
const inputClasses = computed(() =>
  cn(
    'min-w-0 flex-1 bg-transparent px-3 py-1 text-center text-md tabular-nums outline-none md:text-base placeholder:text-muted-foreground disabled:cursor-not-allowed',
    SIZE_INPUT[size.value],
    kind.value !== 'default' && (props.showSteppers ? 'pe-6' : 'pe-9'),
  ),
)
const statusId = `number-input-${useId()}-status`
/** The caller's attributes win, except that the status id is appended to `aria-describedby`. */
function inputAttrs() {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, kind.value === 'success' || kind.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
}
</script>

<template>
  <div
    data-slot="number-input"
    :data-invalid="control.invalid.value ? '' : undefined"
    :data-disabled="control.disabled.value ? '' : undefined"
    :class="rootClasses"
  >
    <button
      v-if="showSteppers"
      ref="decrementEl"
      data-slot="number-input-decrement"
      type="button"
      tabindex="-1"
      :aria-label="decrementLabel"
      :disabled="locked || atMin"
      :class="cn(buttonClasses, 'border-e border-input')"
      @click="onStepper(-1)"
    >
      <Icon :icon="faMinus" size="sm" />
    </button>
    <input
      ref="inputEl"
      data-slot="number-input-field"
      type="text"
      role="spinbutton"
      :inputmode="precision === 0 ? 'numeric' : 'decimal'"
      enterkeyhint="done"
      autocomplete="off"
      :id="control.id.value"
      :value="text"
      :placeholder="placeholder"
      :disabled="control.disabled.value"
      :readonly="readonly"
      :required="control.required.value || undefined"
      :aria-readonly="readonly ? 'true' : undefined"
      :aria-valuenow="value ?? undefined"
      :aria-valuetext="value === null ? undefined : format(value)"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-invalid="control.invalid.value ? 'true' : undefined"
      :class="inputClasses"
      v-bind="inputAttrs()"
      @input="onInput"
      @keydown="onKeydown"
      @blur="commitText"
    />
    <button
      v-if="showSteppers"
      ref="incrementEl"
      data-slot="number-input-increment"
      type="button"
      tabindex="-1"
      :aria-label="incrementLabel"
      :disabled="locked || atMax"
      :class="cn(buttonClasses, 'border-s border-input')"
      @click="onStepper(1)"
    >
      <Icon :icon="faPlus" size="sm" />
    </button>
    <FieldStatusIcon :status="kind" :id="statusId" :label="statusLabel" :class="statusClass" />
    <span data-slot="number-input-status" role="status" class="sr-only">{{ liveText }}</span>
  </div>
</template>
