<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { accessibleName, violation } from '../../../lib/contract'
import { faChevronLeft, faChevronRight } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import { useConfig, useConfigLabels } from '../../layout/ConfigProvider/config'
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  createCalendarFormatters,
  createDate,
  dayNumber,
  daysInMonth,
  endOfMonth,
  endOfWeek,
  formatISODate,
  getMonthGrid,
  isDateDisabled,
  isoWeekNumber,
  isSameDay,
  isValidDate,
  localeWeekStart,
  monthIndex,
  normalizeRange,
  normalizeWeekStart,
  resolveBounds,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateList,
  toRange,
  toSingle,
  toggleDay,
  type CalendarMode,
  type CalendarRange,
  type CalendarValue,
} from './dateMath'
import {
  CALENDAR_DAY_SHAPES,
  CALENDAR_SIZES,
  CALENDAR_VARIANTS,
  calendarMonthsVariants,
  calendarVariants,
  type CalendarOrientation,
  type CalendarShape,
  type CalendarSize,
  type CalendarVariant,
} from './variants'

export interface CalendarProps {
  /** Selection: `Date | null` (single), `{ start, end } | null` (range), `Date[]` (multiple). Wrong shapes are treated as empty. */
  modelValue?: CalendarValue
  mode?: CalendarMode
  /** First visible month (any day in it). Controls navigation together with `update:month`. */
  month?: Date
  /** Earliest selectable day. Swapped with `max` when reversed. */
  min?: Date
  /** Latest selectable day. */
  max?: Date
  /** Return true to disable a day. Receives a Date at local midnight. */
  isDateDisabled?: (date: Date) => boolean
  /** First day of the week, 0 (Sunday) - 6 (Saturday). Default: from the locale (Intl.Locale weekInfo), else Sunday. */
  weekStart?: number
  /** BCP 47 locale for month, weekday and day names. Unknown tags fall back to the runtime default. */
  locale?: string
  /** 1, 2 or 3 months side by side (or stacked, see `orientation`). Anything else renders one. */
  numberOfMonths?: 1 | 2 | 3
  /** Layout of several months: `horizontal` wraps side by side, `vertical` stacks them. */
  orientation?: CalendarOrientation
  /** Corner shape of the day buttons. */
  shape?: CalendarShape
  /** Adds a leading column with the ISO week number of each row. */
  weekNumbers?: boolean
  /** Accessible name of the week-number column and of each number ("Week 9"). Translate it. */
  weekLabel?: string
  /** Visible heading of the week-number column. */
  weekShort?: string
  /** Show the "February 2024" heading above each month. */
  showHeading?: boolean
  /** Disables every day and the navigation. */
  disabled?: boolean
  /** Days stay focusable but cannot be selected. Month navigation still works. */
  readonly?: boolean
  variant?: CalendarVariant
  size?: CalendarSize
  prevLabel?: string
  nextLabel?: string
  /** Announced (polite live region) after the first click of a range. `{date}` is replaced with the full date. */
  rangeStartMessage?: string
  /** Announced (polite live region) when the second click is refused because a day in between is disabled or out of bounds. Default: the provider's `calendar.rangeBlocked` label, else English. */
  rangeBlockedMessage?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<CalendarProps>(), {
  mode: 'single',
  numberOfMonths: 1,
  showHeading: true,
  variant: 'default',
  size: 'md',
  orientation: 'horizontal',
  shape: 'rounded',
  weekNumbers: false,
  weekLabel: 'Week',
  weekShort: 'Wk',
  prevLabel: 'Previous month',
  nextLabel: 'Next month',
  rangeStartMessage: 'Range start {date}. Choose the end date.',
})
const emit = defineEmits<{
  'update:modelValue': [value: CalendarValue]
  /** Visible (first) month changed by the user; payload is the 1st of that month. */
  'update:month': [value: Date]
  /** Any enabled day was clicked, even when the value did not change. */
  select: [date: Date]
}>()

const uid = useId()
const root = ref<HTMLElement | null>(null)
const config = useConfig()
const labels = useConfigLabels('calendar', { rangeBlocked: 'The range cannot include unavailable dates. Choose another end date.' })
const localeTag = computed(() => props.locale ?? config.value.locale ?? 'en')
const instance = getCurrentInstance()
/** Text of the persistent polite live region: new month(s) after navigation, range anchor prompt. */
const announcement = ref('')

// The month grids are named by their heading; the nav buttons only by `prevLabel` / `nextLabel`, so a blank label leaves them unnamed.
onMounted(async () => {
  await nextTick()
  const nav = root.value ? [...root.value.querySelectorAll('[data-slot=calendar-prev],[data-slot=calendar-next]')] : []
  const unnamed = nav.find((el) => !accessibleName(el))
  if (!unnamed) return
  const prop = unnamed.matches('[data-slot=calendar-prev]') ? 'prevLabel' : 'nextLabel'
  violation('Calendar', 'requires-accessible-name', `needs an accessible name on the ${prop === 'prevLabel' ? 'previous' : 'next'} month button. Leave \`${prop}\` unset for the default or give it a non-empty string.`)
})

const mode = computed<CalendarMode>(() => (props.mode === 'range' || props.mode === 'multiple' ? props.mode : 'single'))
const count = computed(() => (props.numberOfMonths === 2 || props.numberOfMonths === 3 ? props.numberOfMonths : 1))
const weekStart = computed(() => normalizeWeekStart(props.weekStart, localeWeekStart(localeTag.value)))
const fmt = computed(() => createCalendarFormatters(localeTag.value))
const bounds = computed(() => resolveBounds(props.min, props.max))
// `today` is unknown until mounted so server and client render the same markup.
const today = ref<Date | null>(null)
const FALLBACK_DAY = createDate(1970, 0, 1)
let quietMonth: number | null = null
let midnightTimer: ReturnType<typeof setTimeout> | undefined
function refreshToday() {
  const now = new Date()
  today.value = startOfDay(now)
  const next = createDate(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  midnightTimer = setTimeout(refreshToday, Math.max(1000, next.getTime() - now.getTime()))
}
onMounted(() => {
  refreshToday()
  if (firstSelected() || isValidDate(props.month)) return
  focused.value = clampDate(today.value!, props.min, props.max)
  const first = startOfMonth(focused.value)
  if (monthIndex(first) === monthIndex(visible.value)) return
  quietMonth = monthIndex(first) // the initial month is not a navigation, so it is not announced
  visible.value = first
})
onBeforeUnmount(() => clearTimeout(midnightTimer))

// --- selection (controlled by modelValue, uncontrolled when it is never provided) ---
const inner = shallowRef<CalendarValue | undefined>(props.modelValue)
let lastEmitted: unknown
watch(
  () => props.modelValue,
  (v) => {
    inner.value = v
    if (toRaw(v) === lastEmitted) return // echo of our own emit: the selection is already visible
    const first = firstSelected()
    if (first && !windowContains(first)) {
      focused.value = first
      showDate(first, false)
    }
  },
)
const single = computed(() => (mode.value === 'single' ? toSingle(inner.value) : null))
const multiple = computed(() => (mode.value === 'multiple' ? toDateList(inner.value) : []))
const committedRange = computed(() => (mode.value === 'range' ? toRange(inner.value) : null))
const selectedSet = computed(() => new Set((mode.value === 'single' ? (single.value ? [single.value] : []) : multiple.value).map(dayNumber)))

/** Range selection in progress: first click stored here until the second click completes the range. */
const anchor = ref<Date | null>(null)
const hovered = ref<Date | null>(null)

function firstSelected(): Date | null {
  if (mode.value === 'range') return committedRange.value?.start ?? null
  return mode.value === 'multiple' ? (multiple.value[0] ?? null) : single.value
}

// --- visible month + roving focus ---
const focused = ref<Date>(clampDate(firstSelected() ?? FALLBACK_DAY, props.min, props.max))
const visible = ref<Date>(startOfMonth(isValidDate(props.month) ? props.month : focused.value))

function windowContains(d: Date): boolean {
  const idx = monthIndex(d)
  const first = monthIndex(visible.value)
  return idx >= first && idx <= first + count.value - 1
}

function setVisible(d: Date, notify = true) {
  const next = startOfMonth(d)
  if (!isValidDate(next) || monthIndex(next) === monthIndex(visible.value)) return
  visible.value = next
  if (notify) emit('update:month', new Date(next))
}

/** Scroll the visible window the minimum needed so that `d` is inside it. */
function showDate(d: Date, notify = true) {
  const idx = monthIndex(d)
  const first = monthIndex(visible.value)
  if (idx < first) setVisible(d, notify)
  else if (idx > first + count.value - 1) setVisible(addMonths(startOfMonth(d), -(count.value - 1)), notify)
}

/** Pull the focused day into the visible window (used when the window moved first, e.g. `month` prop). */
function pullFocusIntoWindow() {
  const first = monthIndex(visible.value)
  const target = Math.min(Math.max(monthIndex(focused.value), first), first + count.value - 1)
  if (target !== monthIndex(focused.value)) {
    const y = Math.floor(target / 12)
    const m = target - y * 12
    focused.value = clampDate(createDate(y, m, Math.min(focused.value.getDate(), daysInMonth(y, m))), props.min, props.max)
  }
  showDate(focused.value, false)
}

if (isValidDate(props.month)) pullFocusIntoWindow()
watch(
  () => props.month,
  (m) => {
    if (!isValidDate(m)) return
    setVisible(m, false)
    pullFocusIntoWindow()
  },
)
watch(count, () => showDate(focused.value))
watch(
  () => [props.min, props.max],
  () => {
    focused.value = clampDate(focused.value, props.min, props.max)
    showDate(focused.value)
  },
)

function focusDay(d: Date) {
  root.value?.querySelector<HTMLElement>(`[data-slot="calendar-day"][data-date="${formatISODate(d)}"]`)?.focus()
}

function moveFocus(next: Date) {
  if (!isValidDate(next)) return
  const d = clampDate(next, props.min, props.max)
  focused.value = d
  hovered.value = null
  showDate(d)
  void nextTick(() => focusDay(d))
}

/** Move DOM focus to the roving day (the selected one, or today). Used by pickers when they open. */
function focus() {
  return nextTick(() => focusDay(focused.value))
}
defineExpose({ focus })

// --- navigation ---
const canPrev = computed(() => !props.disabled && (!bounds.value.min || compareDays(endOfMonth(addMonths(visible.value, -1)), bounds.value.min) >= 0))
const canNext = computed(
  () => !props.disabled && (!bounds.value.max || compareDays(startOfMonth(addMonths(visible.value, count.value)), bounds.value.max) <= 0),
)

function shiftMonth(delta: number) {
  if (delta < 0 ? !canPrev.value : !canNext.value) return
  const next = addMonths(visible.value, delta)
  if (!isValidDate(next)) return
  setVisible(next)
  focused.value = clampDate(addMonths(focused.value, delta), props.min, props.max)
  showDate(focused.value)
}

function isRtl(el: HTMLElement | null): boolean {
  if (!el) return false
  const computed = getComputedStyle(el).direction
  return computed ? computed === 'rtl' : el.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl'
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  const f = focused.value
  // In a right-to-left page the day to the left is the later one.
  const step = isRtl(e.currentTarget as HTMLElement | null) ? -1 : 1
  let next: Date
  switch (e.key) {
    case 'ArrowLeft':
      next = addDays(f, -step)
      break
    case 'ArrowRight':
      next = addDays(f, step)
      break
    case 'ArrowUp':
      next = addDays(f, -7)
      break
    case 'ArrowDown':
      next = addDays(f, 7)
      break
    case 'PageUp':
      next = e.shiftKey ? addYears(f, -1) : addMonths(f, -1)
      break
    case 'PageDown':
      next = e.shiftKey ? addYears(f, 1) : addMonths(f, 1)
      break
    case 'Home':
      next = startOfWeek(f, weekStart.value)
      break
    case 'End':
      next = endOfWeek(f, weekStart.value)
      break
    case 'Escape':
      if (!anchor.value) return
      anchor.value = null
      hovered.value = null
      e.preventDefault()
      e.stopPropagation()
      return
    default:
      return
  }
  e.preventDefault()
  moveFocus(next)
}

// --- days ---
/** Range shown on screen: the in-progress preview while an anchor is set, else the committed range. */
const shownRange = computed<{ s: number; e: number } | null>(() => {
  if (mode.value !== 'range') return null
  const r = anchor.value ? normalizeRange(anchor.value, hovered.value ?? focused.value) : committedRange.value
  return r ? { s: dayNumber(r.start), e: dayNumber(r.end) } : null
})

function dayDisabled(d: Date): boolean {
  return props.disabled || isDateDisabled(d, { min: bounds.value.min, max: bounds.value.max, isDisabled: props.isDateDisabled })
}

function makeCell(d: Date) {
  const n = dayNumber(d)
  const r = shownRange.value
  const isStart = !!r && n === r.s
  const isEnd = !!r && n === r.e
  return {
    date: d,
    iso: formatISODate(d),
    text: fmt.value.dayNumber(d.getDate()),
    label: fmt.value.fullDate(d),
    selected: r ? isStart || isEnd : selectedSet.value.has(n),
    rangeStart: isStart && !isEnd,
    rangeEnd: isEnd && !isStart,
    inRange: !!r && n > r.s && n < r.e,
    today: !!today.value && isSameDay(d, today.value),
    disabled: dayDisabled(d),
  }
}

/** ISO week of a row, taken from its middle column so Sunday-first rows get the week most of their days belong to. */
function weekNumberOf(week: (Date | null)[]): number {
  const i = week.findIndex(Boolean)
  return isoWeekNumber(addDays(week[i]!, 3 - i))
}

const months = computed(() =>
  Array.from({ length: count.value }, (_, i) => {
    const first = addMonths(visible.value, i)
    return {
      key: formatISODate(first),
      label: fmt.value.monthYear(first),
      weeks: getMonthGrid(first.getFullYear(), first.getMonth(), weekStart.value).map((week) => ({
        number: weekNumberOf(week),
        cells: week.map((d) => (d ? makeCell(d) : null)),
      })),
    }
  }),
)
const weekdays = computed(() => fmt.value.weekdays(weekStart.value))
// The month elements are re-keyed on navigation, so a live region on the heading would be re-created and stay silent.
// One persistent region announces the new month(s) instead.
watch(visible, () => {
  const quiet = quietMonth
  quietMonth = null
  if (quiet === monthIndex(visible.value)) return
  announcement.value = months.value.map((m) => m.label).join(', ')
})

function onDayClick(d: Date) {
  if (dayDisabled(d)) return
  focused.value = d
  emit('select', new Date(d))
  if (props.readonly) return
  if (mode.value === 'single') {
    if (!isSameDay(single.value, d)) commit(startOfDay(d))
  } else if (mode.value === 'multiple') {
    commit(toggleDay(multiple.value, d))
  } else if (!anchor.value) {
    anchor.value = d
    announcement.value = props.rangeStartMessage.replace('{date}', fmt.value.fullDate(d))
  } else {
    const range = normalizeRange(anchor.value, d) as CalendarRange
    if (rangeBlocked(range)) {
      announcement.value = props.rangeBlockedMessage ?? labels.value.rangeBlocked
      return
    }
    anchor.value = null
    hovered.value = null
    commit(range)
  }
}

/** True when a day of the range is disabled or outside min/max. */
function rangeBlocked(r: CalendarRange): boolean {
  const opts = { min: bounds.value.min, max: bounds.value.max, isDisabled: props.isDateDisabled }
  for (let d = r.start; compareDays(d, r.end) <= 0; d = addDays(d, 1)) if (isDateDisabled(d, opts)) return true
  return false
}

function commit(value: CalendarValue) {
  lastEmitted = value
  inner.value = value
  emit('update:modelValue', value)
  // A controlled parent that ignores the update keeps the old prop: show that, not our optimistic value.
  const vnodeProps = instance?.vnode.props ?? {}
  if ('modelValue' in vnodeProps || 'model-value' in vnodeProps) void nextTick(() => (inner.value = props.modelValue))
}

function onHover(d: Date) {
  if (anchor.value) hovered.value = d
}

const classes = computed(() =>
  cn(
    calendarVariants({
      variant: CALENDAR_VARIANTS.includes(props.variant) ? props.variant : 'default',
      size: CALENDAR_SIZES.includes(props.size) ? props.size : 'md',
    }),
    props.class,
  ),
)

const monthsClasses = computed(() => calendarMonthsVariants({ orientation: props.orientation === 'vertical' ? 'vertical' : 'horizontal' }))
const dayClasses = computed(() => (CALENDAR_DAY_SHAPES[props.shape] ? cn(DAY, CALENDAR_DAY_SHAPES[props.shape]) : DAY))
const showWeeks = computed(() => props.weekNumbers === true)

// Stacked months share one nav pair on the first header; side by side, next sits on the last.
const nextNavIndex = computed(() => (props.orientation === 'vertical' ? 0 : months.value.length - 1))
const NAV =
  'absolute top-0 inline-flex size-(--calendar-cell) items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 aria-disabled:opacity-40 aria-disabled:hover:bg-transparent motion-reduce:transition-none ' +
  focusRing
const DAY =
  'relative inline-flex size-(--calendar-cell) items-center justify-center rounded-md tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground motion-reduce:transition-none ' +
  focusRing +
  ' aria-disabled:pointer-events-none aria-disabled:opacity-40 data-[today]:font-bold data-[today]:underline data-[today]:underline-offset-4 data-[in-range]:rounded-none data-[in-range]:bg-accent data-[in-range]:text-accent-foreground data-[range-start]:rounded-e-none data-[range-end]:rounded-s-none data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary/90 forced-colors:data-[in-range]:border-y forced-colors:data-[selected]:border-2'
</script>

<template>
  <div
    ref="root"
    data-slot="calendar"
    :data-variant="variant"
    :data-size="size"
    :data-shape="shape"
    :data-mode="mode"
    :data-disabled="disabled || undefined"
    :class="classes"
  >
    <div data-slot="calendar-status" role="status" class="sr-only">{{ announcement }}</div>
    <div data-slot="calendar-months" :data-orientation="orientation" :class="monthsClasses">
      <div v-for="(m, mi) in months" :key="m.key" data-slot="calendar-month">
        <div data-slot="calendar-header" class="relative mb-1 flex h-(--calendar-cell) items-center justify-center">
          <button
            v-if="mi === 0"
            type="button"
            data-slot="calendar-prev"
            :class="cn(NAV, 'start-0')"
            :aria-label="prevLabel"
            :disabled="disabled"
            :aria-disabled="!disabled && !canPrev ? 'true' : undefined"
            @click="shiftMonth(-1)"
          >
            <Icon :icon="faChevronLeft" size="sm" class="rtl:rotate-180" />
          </button>
          <div v-if="showHeading" :id="`${uid}-heading-${mi}`" data-slot="calendar-heading" class="font-medium">
            {{ m.label }}
          </div>
          <button
            v-if="mi === nextNavIndex"
            type="button"
            data-slot="calendar-next"
            :class="cn(NAV, 'end-0')"
            :aria-label="nextLabel"
            :disabled="disabled"
            :aria-disabled="!disabled && !canNext ? 'true' : undefined"
            @click="shiftMonth(1)"
          >
            <Icon :icon="faChevronRight" size="sm" class="rtl:rotate-180" />
          </button>
        </div>
        <table
          role="grid"
          data-slot="calendar-grid"
          class="border-collapse"
          :aria-labelledby="showHeading ? `${uid}-heading-${mi}` : undefined"
          :aria-label="showHeading ? undefined : m.label"
          :aria-multiselectable="mode !== 'single' ? 'true' : undefined"
          :aria-readonly="readonly ? 'true' : undefined"
          :aria-disabled="disabled ? 'true' : undefined"
          @keydown="onKeydown"
          @mouseleave="hovered = null"
        >
          <thead>
            <tr role="row">
              <th
                v-if="showWeeks"
                role="columnheader"
                scope="col"
                data-slot="calendar-week-header"
                :aria-label="weekLabel"
                class="size-(--calendar-cell) p-0 text-xs font-normal text-muted-foreground"
              >
                {{ weekShort }}
              </th>
              <th
                v-for="w in weekdays"
                :key="w.long"
                role="columnheader"
                scope="col"
                data-slot="calendar-weekday"
                :aria-label="w.long"
                class="size-(--calendar-cell) p-0 text-xs font-normal text-muted-foreground"
              >
                {{ w.short }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(week, wi) in m.weeks" :key="wi" role="row">
              <th
                v-if="showWeeks"
                role="rowheader"
                scope="row"
                data-slot="calendar-week-number"
                :aria-label="`${weekLabel} ${week.number}`"
                class="size-(--calendar-cell) p-0 text-xs font-normal text-muted-foreground tabular-nums"
              >
                {{ fmt.dayNumber(week.number) }}
              </th>
              <template v-for="(day, di) in week.cells" :key="di">
                <td v-if="day" role="gridcell" data-slot="calendar-cell" class="p-0 text-center" :aria-selected="day.selected || day.inRange ? 'true' : 'false'">
                  <button
                    type="button"
                    data-slot="calendar-day"
                    :data-date="day.iso"
                    :class="dayClasses"
                    :tabindex="isSameDay(day.date, focused) ? 0 : -1"
                    :aria-label="day.label"
                    :aria-disabled="day.disabled ? 'true' : undefined"
                    :aria-current="day.today ? 'date' : undefined"
                    :data-selected="day.selected || undefined"
                    :data-in-range="day.inRange || undefined"
                    :data-range-start="day.rangeStart || undefined"
                    :data-range-end="day.rangeEnd || undefined"
                    :data-today="day.today || undefined"
                    :data-disabled="day.disabled || undefined"
                    @click="onDayClick(day.date)"
                    @focus="focused = day.date"
                    @mouseenter="onHover(day.date)"
                  >
                    {{ day.text }}
                  </button>
                </td>
                <td v-else role="gridcell" aria-hidden="true" class="p-0" />
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
