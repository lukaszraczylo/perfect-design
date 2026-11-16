<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { useAnnouncer, useFieldLabelId } from './announce'
import { formatTimeInput, minuteOptions, padTime, parseTimeInput, timeToMinutes } from './time'
import { timeInputVariants } from './variants'

export interface TimeInputProps {
  /** 24h canonical `HH:mm` string, or `null` when empty. Invalid strings render as empty. */
  modelValue?: string | null
  /** Show hours as 1-12 with an AM/PM segment. The model stays 24h. */
  hour12?: boolean
  /** Minutes moved by ArrowUp/ArrowDown on the minute segment (floored, 1..60). Typing is not snapped. */
  step?: number
  /** Earliest allowed `HH:mm`. Ignored when invalid or when greater than `max`. */
  min?: string
  /** Latest allowed `HH:mm`. Ignored when invalid or when less than `min`. */
  max?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid on segments, destructive ring). */
  invalid?: boolean
  /** Surface treatment. */
  variant?: FieldVariant
  /** Height and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. */
  shape?: FieldShape
  /** Status colour plus an icon at the end (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Form field name; renders a hidden input with the 24h `HH:mm` value (empty when incomplete). */
  name?: string
  hourLabel?: string
  minuteLabel?: string
  periodLabel?: string
  /** Spoken (polite live region) when min/max moves the entered time: `Adjusted to 09:00`. */
  adjustedLabel?: string
  class?: HTMLAttributes['class']
}

type Segment = 'hour' | 'minute' | 'period'

const props = withDefaults(defineProps<TimeInputProps>(), {
  step: 1,
  variant: 'outline',
  size: 'md',
  shape: 'rounded',
  status: 'default',
  hourLabel: 'Hours',
  minuteLabel: 'Minutes',
  periodLabel: 'AM/PM',
  adjustedLabel: 'Adjusted to',
})
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const kind = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || kind.value === 'error', disabled: () => props.disabled, required: () => props.required })

const root = ref<HTMLElement | null>(null)
const attrs = useAttrs()
const labelId = useFieldLabelId(() => control.id.value, root)
// Registered after `useFieldLabelId`: the Field label id must be set before the name is checked.
useRequireAccessibleName('TimeInput', () => root.value, 'The segments are named, the group is not. Wrap it in `Field` with a `label`, or set `aria-label` / `aria-labelledby` on it.')
onMounted(() => {
  const hint = 'It names a segment; leave it unset for the default.'
  requireText('TimeInput', 'hourLabel', props.hourLabel, hint)
  requireText('TimeInput', 'minuteLabel', props.minuteLabel, hint)
  if (props.hour12) requireText('TimeInput', 'periodLabel', props.periodLabel, hint)
})
const { message: liveText, announce } = useAnnouncer()
/** Name the group from the Field label unless the caller named it. */
const groupLabelledby = computed(() => (attrs['aria-label'] || attrs['aria-labelledby'] ? undefined : labelId.value))
const hour = ref<number | null>(null)
const minute = ref<number | null>(null)
const pm = ref(false)
let lastEmitted: string | null = null
let buffer = ''

function sync(v: unknown) {
  const p = parseTimeInput(v)
  hour.value = p?.hour ?? null
  minute.value = p?.minute ?? null
  if (p) pm.value = p.hour >= 12
  lastEmitted = p ? formatTimeInput(p.hour, p.minute) : null
}
sync(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    // Our own emission echoed back by the parent must not reset a half-edited state.
    if ((v ?? null) !== lastEmitted) sync(v)
  },
)

const bounds = computed(() => {
  const lo = timeToMinutes(props.min)
  const hi = timeToMinutes(props.max)
  return lo !== null && hi !== null && lo > hi ? { lo: null, hi: null } : { lo, hi }
})

const locked = computed(() => control.disabled.value || props.readonly)
const minutes = computed(() => minuteOptions(props.step))
const segments = computed<Segment[]>(() => (props.hour12 ? ['hour', 'minute', 'period'] : ['hour', 'minute']))

const displayHour = computed(() => (hour.value === null ? null : props.hour12 ? hour.value % 12 || 12 : hour.value))
const current = computed(() => (hour.value !== null && minute.value !== null ? formatTimeInput(hour.value, minute.value) : ''))

function commit() {
  let next: string | null = null
  let adjusted = false
  if (hour.value !== null && minute.value !== null) {
    let total = hour.value * 60 + minute.value
    const { lo, hi } = bounds.value
    if (lo !== null && total < lo) total = lo
    if (hi !== null && total > hi) total = hi
    adjusted = total !== hour.value * 60 + minute.value
    hour.value = Math.floor(total / 60)
    minute.value = total % 60
    pm.value = hour.value >= 12
    next = formatTimeInput(hour.value, minute.value)
  }
  if (next !== lastEmitted) {
    lastEmitted = next
    emit('update:modelValue', next)
  }
  if (adjusted && next) announce(`${props.adjustedLabel} ${next}`)
}

function setHour24(h: number) {
  hour.value = h
  pm.value = h >= 12
}

/** Display hour (1-12 in 12h mode, 0-23 otherwise) to 24h hour, using the current AM/PM. */
function toH24(d: number): number {
  return props.hour12 ? (d % 12) + (pm.value ? 12 : 0) : d
}

function stepHour(dir: 1 | -1) {
  if (hour.value === null) return setHour24(toH24(props.hour12 ? 12 : 0))
  if (!props.hour12) return setHour24((hour.value + dir + 24) % 24)
  const d = displayHour.value as number
  setHour24(toH24(((d - 1 + dir + 12) % 12) + 1))
}

function stepMinute(dir: 1 | -1) {
  const opts = minutes.value
  if (minute.value === null) {
    minute.value = opts[0]
    return
  }
  const m = minute.value
  const next = dir > 0 ? opts.find((o) => o > m) : opts.findLast((o) => o < m)
  minute.value = next ?? (dir > 0 ? opts[0] : opts[opts.length - 1])
}

function togglePeriod() {
  pm.value = !pm.value
  if (hour.value !== null) hour.value = (hour.value + 12) % 24
}

function edgeValue(seg: Segment, end: boolean) {
  if (seg === 'hour') return setHour24(toH24(end ? (props.hour12 ? 12 : 23) : props.hour12 ? 1 : 0))
  if (seg === 'minute') minute.value = end ? minutes.value[minutes.value.length - 1] : minutes.value[0]
  else pm.value = end
  if (seg === 'period' && hour.value !== null) hour.value = (hour.value % 12) + (pm.value ? 12 : 0)
}

function focusSegment(seg: Segment) {
  root.value?.querySelector<HTMLElement>(`[data-segment="${seg}"]`)?.focus()
}

function typeDigit(seg: 'hour' | 'minute', d: string) {
  const max = seg === 'hour' ? (props.hour12 ? 12 : 23) : 59
  const lo = seg === 'hour' && props.hour12 ? 1 : 0
  let cand = buffer + d
  let n = Number(cand)
  if (n > max) {
    cand = d
    n = Number(d)
  }
  buffer = cand
  if (n >= lo) {
    if (seg === 'hour') setHour24(toH24(n))
    else minute.value = n
    commit()
  }
  if (cand.length >= 2 || n * 10 > max) {
    buffer = ''
    if (seg === 'hour') focusSegment('minute')
  }
}

function onKeydown(e: KeyboardEvent, seg: Segment) {
  if (control.disabled.value || e.altKey || e.ctrlKey || e.metaKey) return
  const k = e.key
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    const list = segments.value
    const next = list[list.indexOf(seg) + (k === 'ArrowRight' ? 1 : -1)]
    if (!next) return
    e.preventDefault()
    buffer = ''
    return focusSegment(next)
  }
  if (props.readonly) return
  if (/^\d$/.test(k) && seg !== 'period') {
    e.preventDefault()
    return typeDigit(seg, k)
  }
  if (seg === 'period' && /^[aApP]$/.test(k)) {
    e.preventDefault()
    const wantPm = k.toLowerCase() === 'p'
    if (wantPm !== pm.value) togglePeriod()
    return commit()
  }
  buffer = ''
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    const dir = k === 'ArrowUp' ? 1 : -1
    if (seg === 'hour') {
      stepHour(dir)
      if (minute.value === null) minute.value = 0
    } else if (seg === 'minute') {
      stepMinute(dir)
      if (hour.value === null) setHour24(toH24(props.hour12 ? 12 : 0))
    } else {
      togglePeriod()
    }
    return commit()
  }
  if (k === 'Home' || k === 'End') {
    e.preventDefault()
    edgeValue(seg, k === 'End')
    return commit()
  }
  if (k === 'Backspace' || k === 'Delete') {
    e.preventDefault()
    if (seg === 'hour') hour.value = null
    else if (seg === 'minute') minute.value = null
    else return
    return commit()
  }
}

const root$ = computed(() =>
  cn(timeInputVariants({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: kind.value }), props.class),
)
const statusId = `time-input-${useId()}-status`
const describedBy = computed(() => {
  const ids = [control.describedBy.value, kind.value === 'success' || kind.value === 'warning' ? statusId : undefined].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const segClass =
  'inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm px-0.5 text-center tabular-nums outline-hidden focus:bg-primary focus:text-primary-foreground forced-colors:focus:outline-2 forced-colors:focus:outline-solid aria-disabled:cursor-not-allowed pointer-coarse:min-h-9'
const aria = computed(() => ({
  'aria-invalid': control.invalid.value ? ('true' as const) : undefined,
  'aria-required': control.required.value ? ('true' as const) : undefined,
  'aria-disabled': control.disabled.value ? ('true' as const) : undefined,
  'aria-readonly': props.readonly ? ('true' as const) : undefined,
  tabindex: control.disabled.value ? -1 : 0,
}))
</script>

<template>
  <div
    ref="root"
    data-slot="time-input"
    role="group"
    :aria-labelledby="groupLabelledby"
    :aria-describedby="describedBy"
    :data-invalid="control.invalid.value ? '' : undefined"
    :data-disabled="control.disabled.value ? '' : undefined"
    :class="root$"
  >
    <span
      data-slot="time-input-hour"
      data-segment="hour"
      role="spinbutton"
      :id="control.id.value"
      :aria-label="hourLabel"
      :aria-valuemin="hour12 ? 1 : 0"
      :aria-valuemax="hour12 ? 12 : 23"
      :aria-valuenow="displayHour ?? undefined"
      :aria-valuetext="displayHour === null ? 'Empty' : padTime(displayHour)"
      :class="segClass"
      v-bind="aria"
      @keydown="onKeydown($event, 'hour')"
      @focus="buffer = ''"
      @blur="buffer = ''"
    >{{ displayHour === null ? '--' : padTime(displayHour) }}</span>
    <span data-slot="time-input-separator" aria-hidden="true" class="text-muted-foreground">:</span>
    <span
      data-slot="time-input-minute"
      data-segment="minute"
      role="spinbutton"
      :aria-label="minuteLabel"
      aria-valuemin="0"
      aria-valuemax="59"
      :aria-valuenow="minute ?? undefined"
      :aria-valuetext="minute === null ? 'Empty' : padTime(minute)"
      :class="segClass"
      v-bind="aria"
      @keydown="onKeydown($event, 'minute')"
      @focus="buffer = ''"
      @blur="buffer = ''"
    >{{ minute === null ? '--' : padTime(minute) }}</span>
    <span
      v-if="hour12"
      data-slot="time-input-period"
      data-segment="period"
      role="spinbutton"
      :aria-label="periodLabel"
      aria-valuemin="0"
      aria-valuemax="1"
      :aria-valuenow="pm ? 1 : 0"
      :aria-valuetext="pm ? 'PM' : 'AM'"
      :class="cn(segClass, 'ms-1')"
      v-bind="aria"
      @keydown="onKeydown($event, 'period')"
    >{{ pm ? 'PM' : 'AM' }}</span>
    <FieldStatusIcon :status="kind" :id="statusId" :label="statusLabel" />
    <span data-slot="time-input-status" role="status" class="sr-only">{{ liveText }}</span>
    <input v-if="name" type="hidden" :name="name" :value="current" />
  </div>
</template>
