<script setup lang="ts">
import { computed, nextTick, shallowRef, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { faXmark } from '../../../lib/icons'
import { floatingSurface, focusRing } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import Calendar from '../Calendar/Calendar.vue'
import { formatDateIntl, toSingle, type CalendarValue } from '../Calendar/dateMath'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { FIELD_STATUS_PAD, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { useFieldControl } from '../Field/useFieldContext'
import { useConfig, useConfigLabels } from '../../layout/ConfigProvider/config'
import DatePickerIcon from './DatePickerIcon.vue'
import { usePickerDropdown } from './usePickerDropdown'
import { usePickerTrigger, useRequirePickerName } from './usePickerTrigger'
import { DATE_PICKER_SIZES, datePickerVariants, type DatePickerSize } from './variants'

export interface DatePickerProps {
  /** v-model: the selected day (local midnight) or null. Invalid dates count as empty. Uncontrolled when omitted. */
  modelValue?: Date | null
  /** Text shown while empty. */
  placeholder?: string
  /** BCP 47 locale for the calendar and the displayed value. */
  locale?: string
  /** Intl.DateTimeFormat options for the displayed value. Bad options fall back to the default. */
  format?: Intl.DateTimeFormatOptions
  min?: Date
  max?: Date
  /** Return true to disable a day. */
  isDateDisabled?: (date: Date) => boolean
  /** First weekday, 0 (Sunday) - 6 (Saturday). Default from the locale. */
  weekStart?: number
  /** Show a clear button while a value is set. */
  clearable?: boolean
  disabled?: boolean
  /** Shows the value but cannot be opened or cleared. */
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  size?: DatePickerSize
  /** Trigger surface: `outline` (default), `filled`, `underline` or `ghost`. Unknown values fall back to `outline`. */
  variant?: FieldVariant
  /** Trigger corners: `rounded` (default), `pill` or `square`. */
  shape?: FieldShape
  /** `success`, `warning` or `error` colour the border and add an icon with hidden text; `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Hidden text of the success and warning icons. Defaults to the English text. */
  statusLabel?: string
  /** Controlled open state (v-model:open). Uncontrolled when omitted. */
  open?: boolean
  /** Which trigger edge the dropdown aligns to. */
  align?: 'start' | 'end'
  clearLabel?: string
  /** Visually hidden description added to the trigger while `required` (aria-required is not allowed on a button). */
  requiredLabel?: string
  /** aria-label of the dropdown dialog. */
  dialogLabel?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<DatePickerProps>(), {
  format: () => ({ dateStyle: 'medium' }),
  open: undefined,
  variant: 'outline',
  shape: 'rounded',
  status: 'default',
  align: 'start',
})
const emit = defineEmits<{
  'update:modelValue': [value: Date | null]
  'update:open': [value: boolean]
}>()

// Precedence: the prop, then a surrounding ConfigProvider (`datePicker.*`, `locale`, `size`), then the built-in default.
const config = useConfig()
const labels = useConfigLabels('datePicker', { placeholder: 'Pick a date', clear: 'Clear date', required: 'Required', dialog: 'Choose date' })
const placeholderText = computed(() => props.placeholder ?? labels.value.placeholder)
const clearText = computed(() => props.clearLabel ?? labels.value.clear)
const requiredText = computed(() => props.requiredLabel ?? labels.value.required)
const dialogText = computed(() => props.dialogLabel ?? labels.value.dialog)
const localeTag = computed(() => props.locale ?? config.value.locale)
const wantedSize = computed<DatePickerSize>(() => props.size ?? (DATE_PICKER_SIZES.includes(config.value.size as DatePickerSize) ? (config.value.size as DatePickerSize) : 'md'))

const control = useFieldControl({ invalid: () => props.invalid || props.status === 'error', disabled: () => props.disabled, required: () => props.required })
const contentId = useId()
const statusId = `${useId()}-status`
const status = computed(() => normalizeStatus(props.status))
const { valueId, requiredId, triggerAttrs } = usePickerTrigger({
  id: () => control.id.value,
  describedBy: () => [control.describedBy.value, status.value === 'success' || status.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined,
  required: () => control.required.value,
})

const inner = shallowRef<Date | null | undefined>(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (inner.value = v),
)
const value = computed(() => toSingle(inner.value))
const text = computed(() => (value.value ? formatDateIntl(value.value, localeTag.value, props.format) : ''))

const { rootRef, triggerRef, calendarRef, isOpen, setOpen, toggle, onKeydown, onFocusout } = usePickerDropdown({
  open: () => props.open,
  canOpen: () => !control.disabled.value && !props.readonly,
  onOpenChange: (v) => emit('update:open', v),
})
useRequirePickerName('DatePicker', () => triggerRef.value, valueId, () => ({ clearable: props.clearable, clearLabel: clearText.value, dialogLabel: dialogText.value }))

function commit(next: Date | null) {
  inner.value = next
  emit('update:modelValue', next)
}

function onPick(v: CalendarValue) {
  if (v instanceof Date) commit(v)
}

function clear() {
  commit(null)
  setOpen(false)
  void nextTick(() => triggerRef.value?.focus())
}

const showClear = computed(() => props.clearable && !!value.value && !control.disabled.value && !props.readonly)

const triggerClasses = computed(() =>
  cn(
    datePickerVariants({
      size: DATE_PICKER_SIZES.includes(wantedSize.value) ? wantedSize.value : 'md',
      variant: normalizeVariant(props.variant),
      shape: normalizeShape(props.shape),
      status: status.value,
    }),
    showClear.value ? 'pe-16' : status.value !== 'default' && FIELD_STATUS_PAD,
    props.class,
  ),
)
const contentClasses = computed(() => cn(floatingSurface, 'absolute top-full mt-1 w-full min-w-69 p-3 sm:w-max', props.align === 'end' ? 'end-0' : 'start-0'))
const CLEAR =
  'absolute end-9 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none ' +
  focusRing
</script>

<template>
  <div
    ref="rootRef"
    data-slot="date-picker"
    class="relative w-full"
    :data-state="isOpen ? 'open' : 'closed'"
    @keydown="onKeydown"
    @focusout="onFocusout"
  >
    <button
      ref="triggerRef"
      type="button"
      data-slot="date-picker-trigger"
      aria-haspopup="dialog"
      :class="triggerClasses"
      :disabled="control.disabled.value"
      :data-placeholder="text ? undefined : ''"
      :data-readonly="readonly || undefined"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="isOpen ? contentId : undefined"
      :aria-invalid="control.invalid.value ? 'true' : undefined"
      v-bind="triggerAttrs()"
      @click="toggle"
      @keydown.down.prevent="setOpen(true)"
    >
      <span :id="valueId" data-slot="date-picker-value" class="min-w-0 truncate">{{ text || placeholderText }}</span>
      <DatePickerIcon />
    </button>
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" />
    <span v-if="control.required.value" :id="requiredId" data-slot="date-picker-required" class="sr-only">{{ requiredText }}</span>
    <button
      v-if="showClear"
      type="button"
      data-slot="date-picker-clear"
      :aria-label="clearText"
      :class="CLEAR"
      @click="clear"
    >
      <Icon :icon="faXmark" size="sm" />
    </button>
    <div v-if="isOpen" :id="contentId" role="dialog" data-slot="date-picker-content" :aria-label="dialogText" :class="contentClasses">
      <Calendar
        ref="calendarRef"
        variant="ghost"
        mode="single"
        :size="wantedSize"
        :model-value="value"
        :min="min"
        :max="max"
        :is-date-disabled="isDateDisabled"
        :week-start="weekStart"
        :locale="localeTag"
        @update:model-value="onPick"
        @select="setOpen(false, true)"
      />
    </div>
  </div>
</template>
