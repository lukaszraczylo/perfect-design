<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, shallowRef, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName, violation } from '../../../lib/contract'
import { faCircleExclamation, faXmark } from '../../../lib/icons'
import { floatingSurface, focusRing } from '../../../lib/styles'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import Calendar from '../Calendar/Calendar.vue'
import { compareDays, createDate, formatISODate, toRange, type CalendarRange, type CalendarValue } from '../Calendar/dateMath'
import DateInput from '../DateInput/DateInput.vue'
import PickerFormInput from '../DatePicker/PickerFormInput.vue'
import { useConfig } from '../../layout/ConfigProvider/config'
import { usePickerDropdown } from '../DatePicker/usePickerDropdown'
import { usePickerTrigger, useRequirePickerName } from '../DatePicker/usePickerTrigger'
import { DATE_PICKER_SIZES, type DatePickerSize } from '../DatePicker/variants'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { FIELD_STATUS_PAD, normalizeFieldSize, normalizeShape, normalizeStatus, type FieldShape, type FieldStatus } from '../Field/field-variants'
import { useFieldControl } from '../Field/useFieldContext'
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue'
import { useFieldLabelId } from '../TimeInput/announce'
import TimeInput from '../TimeInput/TimeInput.vue'
import {
  dayToDate,
  draftToInstant,
  instantToDraft,
  isValidTimeZone,
  normalizeTimeZone,
  parseRange,
  resolvePreset,
  toInstant,
  toIso,
  TIME_RANGE_PRESET_IDS,
  TIME_RANGE_PRESET_LABELS,
  validateRange,
  wallParts,
  zoneFormat,
  DEFAULT_FORMAT,
  type TimeRangePresetId,
  type TimeRangeReason,
  type TimeRangeValue,
} from './timeRange'
import { normalizeTimeRangeVariant, timeRangePickerVariants, timeRangeTriggerVariants, type TimeRangeVariant } from './variants'

/** Texts of the validation errors. `{min}` and `{max}` are replaced with the formatted limit. */
export interface TimeRangeMessages {
  /** One end is missing or not a valid date and time. */
  incomplete?: string
  /** The start is after the end. */
  order?: string
  /** The start is before `min`. */
  min?: string
  /** The end is after `max`. */
  max?: string
}

export interface TimeRangeValidation {
  valid: boolean
  reason: TimeRangeReason | null
  message: string | null
  /** The ends as UTC ISO strings, or null while an end is incomplete. */
  from: string | null
  to: string | null
}

/** Payload of `select`: how the range was chosen and the range itself. */
export interface TimeRangeSelection {
  preset: TimeRangePresetId
  value: TimeRangeValue
}

export interface TimeRangePickerProps {
  /** v-model: `{ from, to }` as ISO 8601 strings (emitted as UTC, `2024-05-01T10:00:00.000Z`), or null. A string without an offset is read as UTC. An end that is not a valid date makes the whole value count as empty. */
  modelValue?: TimeRangeValue | null
  /** The current time used to resolve relative presets and to bound them by `min`/`max`: a `Date`, a millisecond number or an ISO string. Defaults to the clock at the moment of selection. */
  now?: Date | string | number
  /** IANA zone the times are shown and typed in (`Europe/Warsaw`). The value itself is always UTC. Default: the provider's `timeZone`, else `UTC`. Unknown names fall back to `UTC`. */
  timeZone?: string
  /** Earliest allowed instant (inclusive). Swapped with `max` when reversed. */
  min?: Date | string | number
  /** Latest allowed instant (inclusive). */
  max?: Date | string | number
  /** Ids of the shortcuts to show, in order. Default: all of them. `custom` shows the from/to fields. Unknown ids are ignored (and reported in strict mode). */
  presets?: TimeRangePresetId[]
  /** Visible text per preset id, to translate or reword. */
  presetLabels?: Partial<Record<TimeRangePresetId, string>>
  /** BCP 47 locale for the displayed value and the calendar. Default: the provider's `locale`, else `en`. */
  locale?: string
  /** Form field name. Adds hidden inputs `name[from]` and `name[to]` that submit UTC ISO instants with a native form. A required, empty picker blocks the submit. */
  name?: string
  /** Intl.DateTimeFormat options of the displayed value (the zone is always `timeZone`). */
  format?: Intl.DateTimeFormatOptions
  /** Layout: `popover` (trigger and dropdown), `inline` (bordered panel), `segmented` (row of presets, custom range below). Unknown values fall back to `popover`. */
  variant?: TimeRangeVariant
  /** Height of the trigger and the fields. */
  size?: DatePickerSize
  /** Corners of the trigger (`popover`) and the fields. */
  shape?: FieldShape
  /** `success`, `warning` or `error` colour the control and add an icon. An invalid range sets `error` by itself and shows its message as text. */
  status?: FieldStatus
  /** Hidden text of the success and warning icons. Defaults to the English text. */
  statusLabel?: string
  /** Which trigger edge the dropdown aligns to (`popover`). */
  align?: 'start' | 'end'
  /** Show the calendar beside the from/to fields (`popover` and `inline`). */
  showCalendar?: boolean
  /** Show the 12-hour clock with an AM/PM segment in the time fields. The value stays 24 hour. */
  hour12?: boolean
  /** Texts of the validation errors. */
  messages?: TimeRangeMessages
  /** Show a clear button while a range is set (`popover` only). */
  clearable?: boolean
  disabled?: boolean
  /** Shows the range; nothing can be chosen, typed or cleared. */
  readonly?: boolean
  required?: boolean
  /** Marks the control invalid (`aria-invalid`) regardless of the range. */
  invalid?: boolean
  /** Controlled open state of the dropdown (v-model:open). Uncontrolled when omitted. */
  open?: boolean
  /** Text shown while no range is set. */
  placeholder?: string
  /** Accessible name of the presets group. Translate it. */
  presetsLabel?: string
  /** Legend of the start fields; part of the names `From date` and `From time`. */
  fromLabel?: string
  /** Legend of the end fields. */
  toLabel?: string
  /** Appended to the legend to name the date input: `From date`. */
  dateLabel?: string
  /** Appended to the legend to name the time input: `From time`. */
  timeLabel?: string
  /** Text of the button that applies the custom range. */
  applyLabel?: string
  /** Visible note about the zone in the custom range. `{zone}` is replaced with the zone name. */
  zoneLabel?: string
  clearLabel?: string
  /** Visually hidden description added while `required` (`aria-required` is not allowed on a button or a group). */
  requiredLabel?: string
  /** aria-label of the dropdown dialog. */
  dialogLabel?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<TimeRangePickerProps>(), {
  modelValue: undefined,
  now: undefined,
  timeZone: undefined,
  locale: undefined,
  name: undefined,
  min: undefined,
  max: undefined,
  presets: undefined,
  presetLabels: undefined,
  format: undefined,
  variant: 'popover',
  size: 'md',
  shape: 'rounded',
  status: 'default',
  align: 'start',
  showCalendar: true,
  open: undefined,
  messages: undefined,
  placeholder: 'Pick a time range',
  presetsLabel: 'Presets',
  fromLabel: 'From',
  toLabel: 'To',
  dateLabel: 'date',
  timeLabel: 'time',
  applyLabel: 'Apply',
  zoneLabel: 'Times are in {zone}',
  clearLabel: 'Clear time range',
  requiredLabel: 'Required',
  dialogLabel: 'Choose time range',
})
const emit = defineEmits<{
  'update:modelValue': [value: TimeRangeValue | null]
  'update:open': [value: boolean]
  /** A preset was chosen or the custom range was applied. */
  select: [selection: TimeRangeSelection]
  /** The custom range was edited or applied: its validity. */
  validate: [result: TimeRangeValidation]
  /** Only when the custom range is not valid. */
  invalid: [result: TimeRangeValidation]
}>()

const attrs = useAttrs()
const variant = computed(() => normalizeTimeRangeVariant(props.variant))
const isPopover = computed(() => variant.value === 'popover')
const config = useConfig()
const zoneInput = computed(() => props.timeZone ?? config.value.timeZone ?? 'UTC')
const zone = computed(() => normalizeTimeZone(zoneInput.value))
const localeTag = computed(() => props.locale ?? config.value.locale ?? 'en')
const instance = getCurrentInstance()
const isControlled = () => {
  const vnodeProps = instance?.vnode.props ?? {}
  return 'modelValue' in vnodeProps || 'model-value' in vnodeProps
}
const fieldSize = computed(() => normalizeFieldSize(props.size))
const shape = computed(() => normalizeShape(props.shape))

// --- the value -----------------------------------------------------------------------------------------------------------------
const inner = shallowRef<unknown>(props.modelValue)
const keyOf = (v: unknown) => {
  const r = parseRange(v)
  return r ? `${r.from}|${r.to}` : null
}
let committed: string | null = keyOf(props.modelValue)
const range = computed(() => parseRange(inner.value))
const bounds = computed(() => {
  const lo = toInstant(props.min)
  const hi = toInstant(props.max)
  return lo !== null && hi !== null && lo > hi ? { min: hi, max: lo } : { min: lo, max: hi }
})
const fmtStart = computed(() => zoneFormat(localeTag.value, zone.value, props.format))
const END_FORMAT: Intl.DateTimeFormatOptions = { ...DEFAULT_FORMAT, timeZoneName: 'short' }
const fmtEnd = computed(() => zoneFormat(localeTag.value, zone.value, props.format ?? END_FORMAT, END_FORMAT))
const text = computed(() => (range.value ? `${fmtStart.value.format(range.value.from)} – ${fmtEnd.value.format(range.value.to)}` : ''))

function messageFor(reason: TimeRangeReason | null): string {
  if (!reason) return ''
  const own = props.messages?.[reason]
  const fallback = { incomplete: 'Enter a start and an end', order: 'The start must not be after the end', min: 'Must not start before {min}', max: 'Must not end after {max}' }[reason]
  const template = typeof own === 'string' && own.trim() ? own : fallback
  const limit = (ms: number | null) => (ms === null ? '' : fmtEnd.value.format(ms))
  return template.replace(/\{min\}/g, () => limit(bounds.value.min)).replace(/\{max\}/g, () => limit(bounds.value.max))
}

const valueReason = computed(() => (range.value ? validateRange(range.value.from, range.value.to, bounds.value.min, bounds.value.max) : null))
const status = computed<FieldStatus>(() => (valueReason.value ? 'error' : normalizeStatus(props.status)))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })
const locked = computed(() => control.disabled.value || !!props.readonly)

// --- the presets ---------------------------------------------------------------------------------------------------------------
const clock = ref<number | null>(null)
const known = new Set<string>(TIME_RANGE_PRESET_IDS)
const ids = computed<TimeRangePresetId[]>(() => {
  const list = Array.isArray(props.presets) ? props.presets : [...TIME_RANGE_PRESET_IDS]
  return [...new Set(list.filter((id): id is TimeRangePresetId => known.has(id)))]
})
const customEnabled = computed(() => ids.value.includes('custom'))
// A range that is already set when the picker mounts shows its custom fields: it may not be a preset.
const activeId = ref<TimeRangePresetId | null>(range.value && customEnabled.value ? 'custom' : null)
const nowMs = () => toInstant(props.now) ?? Date.now()
const outOfBounds = (r: { from: number; to: number }) => (bounds.value.min !== null && r.from < bounds.value.min) || (bounds.value.max !== null && r.to > bounds.value.max)
const presetItems = computed(() => {
  const now = toInstant(props.now) ?? clock.value
  return ids.value.map((id) => {
    const r = id === 'custom' || now === null ? null : resolvePreset(id, now, zone.value)
    const out = !!r && outOfBounds(r)
    const own = props.presetLabels?.[id]
    return { id, label: typeof own === 'string' && own.trim() ? own.trim() : TIME_RANGE_PRESET_LABELS[id], disabled: out, pressed: activeId.value === id }
  })
})

// --- the custom range (a draft in the zone's wall clock) -------------------------------------------------------------------------
const draft = reactive({ fromDate: '', fromTime: '', toDate: '', toTime: '' })
const attempted = ref(false)
const calMonth = ref<Date>(createDate(1970, 0, 1))
const paneVisible = computed(() => customEnabled.value && activeId.value === 'custom' && (!isPopover.value || isOpen.value))

// Instants the draft started from: an end whose date and time were not edited keeps its instant exactly (seconds, milliseconds,
// and the second occurrence of a repeated fall-back hour are not representable in the HH:mm fields).
const origin = { from: null as number | null, to: null as number | null, fromKey: '', toKey: '' }
const draftKey = (date: string, time: string) => `${date}T${time}`

function syncDraft() {
  const r = range.value
  const a = r ? instantToDraft(r.from, zone.value) : { date: '', time: '' }
  const b = r ? instantToDraft(r.to, zone.value) : { date: '', time: '' }
  Object.assign(draft, { fromDate: a.date, fromTime: a.time, toDate: b.date, toTime: b.time })
  Object.assign(origin, { from: r ? r.from : null, to: r ? r.to : null, fromKey: draftKey(a.date, a.time), toKey: draftKey(b.date, b.time) })
  attempted.value = false
  const p = wallParts(r ? r.from : nowMs(), zone.value)
  calMonth.value = createDate(p.year, p.month - 1, 1)
}
const draftFrom = computed(() => (origin.from !== null && draftKey(draft.fromDate, draft.fromTime) === origin.fromKey ? origin.from : draftToInstant(draft.fromDate, draft.fromTime, zone.value)))
const draftTo = computed(() => (origin.to !== null && draftKey(draft.toDate, draft.toTime) === origin.toKey ? origin.to : draftToInstant(draft.toDate, draft.toTime, zone.value)))
const draftReason = computed(() => {
  const r = validateRange(draftFrom.value, draftTo.value, bounds.value.min, bounds.value.max)
  return r === 'incomplete' && !attempted.value ? null : r
})
function result(reason: TimeRangeReason | null): TimeRangeValidation {
  return { valid: reason === null, reason, message: reason ? messageFor(reason) : null, from: draftFrom.value === null ? null : toIso(draftFrom.value), to: draftTo.value === null ? null : toIso(draftTo.value) }
}
function report() {
  const reason = validateRange(draftFrom.value, draftTo.value, bounds.value.min, bounds.value.max)
  emit('validate', result(reason))
  if (draftReason.value) emit('invalid', result(draftReason.value))
}
function setDraft(key: keyof typeof draft, value: unknown) {
  draft[key] = typeof value === 'string' ? value : ''
  report()
}
const dayOf = (iso: number | null) => {
  if (iso === null) return undefined
  const p = wallParts(iso, zone.value)
  return createDate(p.year, p.month - 1, p.day)
}
const calBounds = computed(() => ({ min: dayOf(bounds.value.min), max: dayOf(bounds.value.max) }))
const calValue = computed<CalendarRange | null>(() => {
  const a = dayToDate(draft.fromDate)
  const b = dayToDate(draft.toDate)
  if (!a || !b) return null
  return compareDays(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a }
})
function onCalendarPick(v: CalendarValue) {
  const r = toRange(v)
  if (!r) return
  draft.fromDate = formatISODate(r.start)
  draft.toDate = formatISODate(r.end)
  if (!draft.fromTime) draft.fromTime = '00:00'
  if (!draft.toTime) draft.toTime = '23:59'
  report()
}

// --- committing ----------------------------------------------------------------------------------------------------------------
function commit(from: number, to: number, preset: TimeRangePresetId) {
  const value: TimeRangeValue = { from: toIso(from), to: toIso(to) }
  inner.value = value
  committed = keyOf(value)
  activeId.value = preset
  syncDraft()
  emit('update:modelValue', value)
  emit('select', { preset, value })
  revertIfIgnored()
}

// A controlled parent that ignores the update keeps the old prop: show that, not our optimistic value.
function revertIfIgnored() {
  if (!isControlled()) return
  void nextTick(() => {
    if (keyOf(props.modelValue) === keyOf(inner.value)) return
    inner.value = props.modelValue
    committed = keyOf(props.modelValue)
    activeId.value = parseRange(props.modelValue) && customEnabled.value ? 'custom' : null
  })
}

function choose(id: TimeRangePresetId) {
  if (locked.value) return
  if (id === 'custom') {
    activeId.value = 'custom'
    syncDraft()
    void nextTick(() => panelRef.value?.querySelector<HTMLElement>('[data-slot=date-input-field]')?.focus())
    return
  }
  const now = nowMs()
  clock.value = now
  const r = resolvePreset(id, now, zone.value)
  if (!r || outOfBounds(r)) return
  commit(r.from, r.to, id)
  setOpen(false, true)
}

function apply() {
  if (locked.value) return
  attempted.value = true
  const reason = validateRange(draftFrom.value, draftTo.value, bounds.value.min, bounds.value.max)
  emit('validate', result(reason))
  if (reason) {
    emit('invalid', result(reason))
    return
  }
  commit(draftFrom.value!, draftTo.value!, 'custom')
  setOpen(false, true)
}
function onPaneKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && e.target instanceof Element && e.target.closest('[data-slot=date-input-field],[data-slot=time-input]')) {
    e.preventDefault()
    apply()
  }
}

function clear() {
  inner.value = null
  committed = null
  activeId.value = null
  syncDraft()
  emit('update:modelValue', null)
  revertIfIgnored()
  setOpen(false)
  void nextTick(() => triggerRef.value?.focus())
}
const showClear = computed(() => isPopover.value && !!props.clearable && !!range.value && !locked.value)

watch(
  () => props.modelValue,
  (v) => {
    // A parent that passes a fresh but equal object on every render must not reset the draft.
    if (keyOf(v) === keyOf(inner.value) && !!v === !!inner.value) return
    inner.value = v
    if (keyOf(v) !== committed) {
      activeId.value = parseRange(v) && customEnabled.value ? 'custom' : null
      committed = keyOf(v)
    }
  },
)
watch([() => keyOf(inner.value), zone], syncDraft)
syncDraft()

// --- dropdown, names and contract ------------------------------------------------------------------------------------------------
const panelRef = ref<HTMLElement | null>(null)
const contentId = useId()
const messageId = `${useId()}-message`
const statusId = `${useId()}-status`
const valueMessageShown = computed(() => !!valueReason.value && !paneVisible.value)
const { valueId, requiredId, triggerAttrs } = usePickerTrigger({
  id: () => control.id.value,
  describedBy: () => describedBy(control.describedBy.value),
  required: () => control.required.value,
})
function describedBy(base: string | undefined): string | undefined {
  return [base, valueMessageShown.value ? messageId : '', status.value === 'success' || status.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined
}

const { rootRef, triggerRef, calendarRef, isOpen, setOpen, toggle, onKeydown, onFocusout } = usePickerDropdown({
  open: () => props.open,
  canOpen: () => isPopover.value && !locked.value,
  onOpenChange: (v) => emit('update:open', v),
})
useRequirePickerName('TimeRangePicker', () => triggerRef.value, valueId, () => props)
watch(isOpen, (open) => {
  if (!open) return
  clock.value = Date.now()
  syncDraft()
})
// The dropdown moves focus to the pressed preset (or the first enabled one) when it opens.
calendarRef.value = {
  focus: () => (panelRef.value?.querySelector<HTMLElement>('[data-slot=time-range-picker-preset][aria-pressed=true]:not(:disabled)') ?? panelRef.value?.querySelector<HTMLElement>('button:not(:disabled)'))?.focus(),
}

const labelId = useFieldLabelId(() => control.id.value, rootRef)
useRequireAccessibleName('TimeRangePicker', () => rootRef.value, 'Wrap it in `Field` with a `label`, or set `aria-label` / `aria-labelledby`.', () => !isPopover.value)
function groupAttrs() {
  const named = attrs['aria-label'] || attrs['aria-labelledby']
  return { ...attrs, role: 'group', 'aria-labelledby': named ? (attrs['aria-labelledby'] as string | undefined) : labelId.value, 'aria-describedby': [describedBy((attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value), control.required.value ? requiredId : ''].filter(Boolean).join(' ') || undefined }
}
onMounted(async () => {
  clock.value = Date.now()
  await nextTick()
  const hint = 'It names a control; leave it unset for the default.'
  requireText('TimeRangePicker', 'presetsLabel', props.presetsLabel, hint)
  requireText('TimeRangePicker', 'fromLabel', props.fromLabel, hint)
  requireText('TimeRangePicker', 'toLabel', props.toLabel, hint)
  requireText('TimeRangePicker', 'applyLabel', props.applyLabel, hint)
  if (!isValidTimeZone(zoneInput.value)) {
    violation('TimeRangePicker', 'requires-valid-time-zone', `requires \`timeZone\` to be an IANA zone name such as "UTC" or "Europe/Warsaw", but got ${JSON.stringify(String(zoneInput.value).slice(0, 40))}. It shows UTC until fixed.`)
  }
  if (Array.isArray(props.presets) && props.presets.some((id) => !known.has(id))) {
    violation('TimeRangePicker', 'requires-preset', `requires every entry of \`presets\` to be one of ${TIME_RANGE_PRESET_IDS.join(', ')}.`)
  }
})

// --- classes -------------------------------------------------------------------------------------------------------------------
const rootClasses = computed(() => cn(timeRangePickerVariants({ variant: variant.value, status: status.value }), props.class))
/** Below `md` the trigger grows with its text (two lines) instead of cutting the end time off. */
const TRIGGER_WRAP = { xs: 'max-md:h-auto max-md:min-h-7', sm: 'max-md:h-auto max-md:min-h-8', md: 'max-md:h-auto max-md:min-h-9', lg: 'max-md:h-auto max-md:min-h-11' } as const
const triggerClasses = computed(() =>
  cn(
    timeRangeTriggerVariants({ size: DATE_PICKER_SIZES.includes(props.size) ? props.size : 'md', shape: shape.value, status: status.value }),
    TRIGGER_WRAP[DATE_PICKER_SIZES.includes(props.size) ? props.size : 'md'],
    showClear.value ? 'pe-16' : status.value !== 'default' && FIELD_STATUS_PAD,
  ),
)
const panelClasses = computed(() =>
  isPopover.value ? cn(floatingSurface, 'absolute top-full mt-1 w-full min-w-69 bg-card p-3 text-card-foreground sm:w-max', props.align === 'end' ? 'end-0' : 'start-0') : '@container min-w-0',
)
// The inline panel sits in a column of any width, so it lays presets beside the calendar by its own width, not the viewport's.
const paneRow = computed(() => (isPopover.value ? 'sm:flex-row' : '@lg:flex-row'))
const presetsColumn = computed(() => {
  if (isPopover.value) return 'sm:w-40 sm:shrink-0 sm:flex-col sm:flex-nowrap'
  return paneVisible.value ? '@lg:w-40 @lg:shrink-0 @lg:flex-col @lg:flex-nowrap' : ''
})
const presetsDivider = computed(() => (!paneVisible.value ? '' : isPopover.value ? 'sm:border-e sm:pe-3' : '@lg:border-e @lg:pe-3'))
const MESSAGE = 'mt-1 flex items-start gap-1.5 text-sm font-medium text-destructive'
const PRESET =
  'inline-flex h-8 max-w-full shrink-0 items-center rounded-md px-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-pressed:bg-accent aria-pressed:font-medium aria-pressed:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 pointer-coarse:min-h-11 motion-reduce:transition-none forced-colors:aria-pressed:border-2 ' +
  focusRing
const CLEAR =
  'absolute end-9 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none ' +
  focusRing
const segmentedOptions = computed(() => presetItems.value.map((p) => ({ value: p.id, label: p.label, disabled: p.disabled })))
const zoneNote = computed(() => (props.zoneLabel || 'Times are in {zone}').replace('{zone}', () => zone.value))
const dropdownRole = computed(() => (isPopover.value ? 'dialog' : undefined))
</script>

<template>
  <div
    ref="rootRef"
    data-slot="time-range-picker"
    :data-variant="variant"
    :data-align="align"
    :data-state="isPopover ? (isOpen ? 'open' : 'closed') : undefined"
    :class="rootClasses"
    v-bind="isPopover ? undefined : groupAttrs()"
    @keydown="onKeydown"
    @focusout="onFocusout"
  >
    <div v-if="isPopover" data-slot="time-range-picker-control" class="relative min-w-0">
      <button
        ref="triggerRef"
        type="button"
        data-slot="time-range-picker-trigger"
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
        <span :id="valueId" data-slot="time-range-picker-value" class="min-w-0 truncate tabular-nums max-md:break-words max-md:whitespace-normal">{{ text || placeholder }}</span>
        <svg
          data-slot="time-range-picker-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="size-4 shrink-0 text-muted-foreground opacity-70"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
      <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" />
      <button v-if="showClear" type="button" data-slot="time-range-picker-clear" :aria-label="clearLabel" :class="CLEAR" @click="clear">
        <Icon :icon="faXmark" size="sm" />
      </button>
    </div>
    <p v-else data-slot="time-range-picker-summary" class="min-w-0 text-sm tabular-nums wrap-anywhere" :data-placeholder="text ? undefined : ''">{{ text || placeholder }}</p>
    <template v-if="name || control.required.value">
      <PickerFormInput
        v-for="end in (['from', 'to'] as const)"
        :key="end"
        :name="name ? `${name}[${end}]` : undefined"
        :value="range ? toIso(range[end]) : ''"
        :required="control.required.value"
        :disabled="control.disabled.value"
        @invalid="triggerRef?.focus()"
      />
    </template>
    <span v-if="control.required.value" :id="requiredId" data-slot="time-range-picker-required" class="sr-only">{{ requiredLabel }}</span>

    <div
      v-if="!isPopover || isOpen"
      ref="panelRef"
      data-slot="time-range-picker-content"
      :id="isPopover ? contentId : undefined"
      :role="dropdownRole"
      :aria-label="isPopover ? dialogLabel : undefined"
      :class="panelClasses"
    >
      <div :class="cn('flex min-w-0 flex-col gap-3', paneVisible && variant !== 'segmented' && paneRow)">
        <div v-if="variant === 'segmented'" data-slot="time-range-picker-presets" class="min-w-0">
          <SegmentedControl
            :aria-label="presetsLabel"
            :options="segmentedOptions"
            :model-value="activeId ?? ''"
            :size="fieldSize === 'xs' ? 'sm' : fieldSize"
            :disabled="locked"
            class="w-full"
            @update:model-value="choose($event as TimeRangePresetId)"
          />
        </div>
        <div
          v-else-if="presetItems.length"
          role="group"
          data-slot="time-range-picker-presets"
          :aria-label="presetsLabel"
          :class="cn('flex flex-wrap gap-1', presetsColumn, presetsDivider)"
        >
          <button
            v-for="p in presetItems"
            :key="p.id"
            type="button"
            data-slot="time-range-picker-preset"
            :data-preset="p.id"
            :class="PRESET"
            :aria-pressed="p.pressed ? 'true' : 'false'"
            :disabled="p.disabled || locked"
            @click="choose(p.id)"
          >
            <span class="min-w-0 truncate">{{ p.label }}</span>
          </button>
        </div>

        <div v-if="paneVisible" data-slot="time-range-picker-custom" class="flex min-w-0 flex-1 flex-col gap-3" @keydown="onPaneKeydown">
          <Calendar
            v-if="showCalendar && variant !== 'segmented'"
            mode="range"
            variant="ghost"
            :size="fieldSize"
            :model-value="calValue"
            :month="calMonth"
            :min="calBounds.min"
            :max="calBounds.max"
            :locale="localeTag"
            :disabled="control.disabled.value"
            :readonly="readonly"
            @update:model-value="onCalendarPick"
            @update:month="calMonth = $event"
          />
          <fieldset v-for="end in ['from', 'to'] as const" :key="end" :data-slot="`time-range-picker-${end}`" class="m-0 grid min-w-0 gap-1.5 border-0 p-0">
            <legend class="mb-1.5 p-0 text-sm font-medium">{{ end === 'from' ? fromLabel : toLabel }}</legend>
            <div class="flex flex-wrap items-start gap-2">
              <div class="min-w-36 flex-1">
                <DateInput
                  :model-value="end === 'from' ? draft.fromDate : draft.toDate"
                  :aria-label="`${end === 'from' ? fromLabel : toLabel} ${dateLabel}`"
                  :size="fieldSize"
                  :shape="shape"
                  :disabled="control.disabled.value"
                  :readonly="readonly"
                  @update:model-value="setDraft(end === 'from' ? 'fromDate' : 'toDate', $event)"
                />
              </div>
              <TimeInput
                :model-value="(end === 'from' ? draft.fromTime : draft.toTime) || null"
                :aria-label="`${end === 'from' ? fromLabel : toLabel} ${timeLabel}`"
                :size="fieldSize"
                :shape="shape"
                :hour12="hour12"
                :disabled="control.disabled.value"
                :readonly="readonly"
                @update:model-value="setDraft(end === 'from' ? 'fromTime' : 'toTime', $event)"
              />
            </div>
          </fieldset>
          <p data-slot="time-range-picker-zone" class="text-sm">{{ zoneNote }}</p>
          <p data-slot="time-range-picker-draft-message" role="status" aria-live="polite" :class="draftReason ? MESSAGE : 'sr-only'">
            <template v-if="draftReason">
              <Icon :icon="faCircleExclamation" size="sm" class="mt-0.5 shrink-0" />
              <span class="min-w-0 wrap-anywhere">{{ messageFor(draftReason) }}</span>
            </template>
          </p>
          <div>
            <Button size="sm" data-slot="time-range-picker-apply" :disabled="locked" @click="apply">{{ applyLabel }}</Button>
          </div>
        </div>
      </div>
    </div>

    <p :id="messageId" data-slot="time-range-picker-message" role="status" aria-live="polite" :class="valueMessageShown ? MESSAGE : 'sr-only'">
      <template v-if="valueMessageShown">
        <Icon :icon="faCircleExclamation" size="sm" class="mt-0.5 shrink-0" />
        <span class="min-w-0 wrap-anywhere">{{ messageFor(valueReason) }}</span>
      </template>
    </p>
  </div>
</template>
