<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { faXmark } from '../../../lib/icons'
import { floatingSurface, focusRing } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import Calendar from '../Calendar/Calendar.vue'
import { compareDays, formatDateIntl, isSameDay, toRange, type CalendarRange, type CalendarValue } from '../Calendar/dateMath'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { FIELD_STATUS_PAD, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { useFieldControl } from '../Field/useFieldContext'
import DatePickerIcon from '../DatePicker/DatePickerIcon.vue'
import { usePickerDropdown } from '../DatePicker/usePickerDropdown'
import { usePickerTrigger, useRequirePickerName } from '../DatePicker/usePickerTrigger'
import { DATE_PICKER_SIZES, datePickerVariants, type DatePickerSize } from '../DatePicker/variants'

/** A shortcut shown beside the calendar: choosing it sets the range and closes the dropdown. */
export interface DateRangePreset {
  label: string
  range: CalendarRange
}

export interface DateRangePickerProps {
  /** v-model: `{ start, end }` (start <= end; a reversed value is normalised for display) or null. Wrong shapes count as empty. */
  modelValue?: CalendarRange | null
  /** Text shown while empty. */
  placeholder?: string
  /** BCP 47 locale for the calendar and the displayed value. */
  locale?: string
  /** Intl.DateTimeFormat options applied to both ends of the displayed value. */
  format?: Intl.DateTimeFormatOptions
  min?: Date
  max?: Date
  /** Return true to disable a day. */
  isDateDisabled?: (date: Date) => boolean
  /** First weekday, 0 (Sunday) - 6 (Saturday). Default from the locale. */
  weekStart?: number
  /** Months shown side by side in the dropdown: 1, 2 or 3. */
  numberOfMonths?: 1 | 2 | 3
  /** Shortcut ranges shown as a button list beside the calendar (above it on narrow screens). Entries with a blank label or an invalid range are not shown. */
  presets?: DateRangePreset[]
  /** Accessible name of the presets group. Translate it. */
  presetsLabel?: string
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
const props = withDefaults(defineProps<DateRangePickerProps>(), {
  placeholder: 'Pick a date range',
  format: () => ({ dateStyle: 'medium' }),
  numberOfMonths: 1,
  open: undefined,
  size: 'md',
  variant: 'outline',
  shape: 'rounded',
  status: 'default',
  align: 'start',
  clearLabel: 'Clear date range',
  requiredLabel: 'Required',
  dialogLabel: 'Choose date range',
  presets: undefined,
  presetsLabel: 'Presets',
})
const emit = defineEmits<{
  'update:modelValue': [value: CalendarRange | null]
  'update:open': [value: boolean]
}>()

const control = useFieldControl({ invalid: () => props.invalid || props.status === 'error', disabled: () => props.disabled, required: () => props.required })
const contentId = useId()
const statusId = `${useId()}-status`
const status = computed(() => normalizeStatus(props.status))
const { valueId, requiredId, triggerAttrs } = usePickerTrigger({
  id: () => control.id.value,
  describedBy: () => [control.describedBy.value, status.value === 'success' || status.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined,
  required: () => control.required.value,
})

const inner = shallowRef<unknown>(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (inner.value = v),
)
const value = computed(() => toRange(inner.value))
const text = computed(() => {
  const r = value.value
  if (!r) return ''
  const start = formatDateIntl(r.start, props.locale, props.format)
  return isSameDay(r.start, r.end) ? start : `${start} – ${formatDateIntl(r.end, props.locale, props.format)}`
})

const { rootRef, triggerRef, calendarRef, isOpen, setOpen, toggle, onKeydown, onFocusout } = usePickerDropdown({
  open: () => props.open,
  canOpen: () => !control.disabled.value && !props.readonly,
  onOpenChange: (v) => emit('update:open', v),
})
useRequirePickerName('DateRangePicker', () => triggerRef.value, valueId, () => props)

function commit(next: CalendarRange | null) {
  inner.value = next
  emit('update:modelValue', next)
}

/** The calendar only emits once both ends are chosen, so this is the moment to close. */
function onPick(v: CalendarValue) {
  const range = toRange(v)
  if (!range) return
  commit(range)
  setOpen(false, true)
}

const presetList = computed(() =>
  (Array.isArray(props.presets) ? props.presets : []).flatMap((p) => {
    const range = toRange(p?.range)
    const label = typeof p?.label === 'string' ? p.label.trim() : ''
    return range && label ? [{ label, range, disabled: presetOutOfBounds(range), pressed: !!value.value && isSameDay(value.value.start, range.start) && isSameDay(value.value.end, range.end) }] : []
  }),
)
function presetOutOfBounds(r: CalendarRange): boolean {
  const lo = props.min instanceof Date ? props.min : null
  const hi = props.max instanceof Date ? props.max : null
  return (!!lo && compareDays(r.start, lo) < 0) || (!!hi && compareDays(r.end, hi) > 0)
}
function pickPreset(r: CalendarRange) {
  commit(r)
  setOpen(false, true)
}
// A preset without a label or with a broken range would silently not appear.
onMounted(async () => {
  await nextTick()
  if (Array.isArray(props.presets) && props.presets.length > presetList.value.length) {
    violation('DateRangePicker', 'requires-preset', 'requires every entry of `presets` to have a non-empty `label` and a `range` with valid `start` and `end` dates.')
  }
})

function clear() {
  commit(null)
  setOpen(false)
  void nextTick(() => triggerRef.value?.focus())
}

const showClear = computed(() => props.clearable && !!value.value && !control.disabled.value && !props.readonly)

const triggerClasses = computed(() =>
  cn(
    datePickerVariants({
      size: DATE_PICKER_SIZES.includes(props.size) ? props.size : 'md',
      variant: normalizeVariant(props.variant),
      shape: normalizeShape(props.shape),
      status: status.value,
    }),
    showClear.value ? 'pe-16' : status.value !== 'default' && FIELD_STATUS_PAD,
    props.class,
  ),
)
const contentClasses = computed(() => cn(floatingSurface, 'absolute top-full mt-1 w-full min-w-69 p-3 sm:w-max', props.align === 'end' ? 'end-0' : 'start-0'))
const PRESET =
  'inline-flex h-8 shrink-0 items-center rounded-md px-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-pressed:bg-accent aria-pressed:font-medium aria-pressed:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 pointer-coarse:min-h-11 motion-reduce:transition-none forced-colors:aria-pressed:border-2 ' +
  focusRing
const CLEAR =
  'absolute end-9 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none ' +
  focusRing
</script>

<template>
  <div
    ref="rootRef"
    data-slot="date-range-picker"
    class="relative w-full"
    :data-state="isOpen ? 'open' : 'closed'"
    @keydown="onKeydown"
    @focusout="onFocusout"
  >
    <button
      ref="triggerRef"
      type="button"
      data-slot="date-range-picker-trigger"
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
      <span :id="valueId" data-slot="date-range-picker-value" class="min-w-0 truncate">{{ text || placeholder }}</span>
      <DatePickerIcon />
    </button>
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" />
    <span v-if="control.required.value" :id="requiredId" data-slot="date-range-picker-required" class="sr-only">{{ requiredLabel }}</span>
    <button
      v-if="showClear"
      type="button"
      data-slot="date-range-picker-clear"
      :aria-label="clearLabel"
      :class="CLEAR"
      @click="clear"
    >
      <Icon :icon="faXmark" size="sm" />
    </button>
    <div v-if="isOpen" :id="contentId" role="dialog" data-slot="date-range-picker-content" :aria-label="dialogLabel" :class="contentClasses">
      <div :class="presetList.length ? 'flex flex-col gap-3 sm:flex-row' : undefined">
      <div
        v-if="presetList.length"
        role="group"
        data-slot="date-range-picker-presets"
        :aria-label="presetsLabel"
        class="flex flex-wrap gap-1 sm:w-36 sm:flex-col sm:flex-nowrap sm:border-e sm:pe-3"
      >
        <button
          v-for="p in presetList"
          :key="p.label"
          type="button"
          data-slot="date-range-picker-preset"
          :class="PRESET"
          :aria-pressed="p.pressed ? 'true' : 'false'"
          :disabled="p.disabled"
          @click="pickPreset(p.range)"
        >
          {{ p.label }}
        </button>
      </div>
      <Calendar
        ref="calendarRef"
        variant="ghost"
        mode="range"
        :size="size"
        :model-value="value"
        :number-of-months="numberOfMonths"
        :min="min"
        :max="max"
        :is-date-disabled="isDateDisabled"
        :week-start="weekStart"
        :locale="locale"
        @update:model-value="onPick"
      />
      </div>
    </div>
  </div>
</template>
