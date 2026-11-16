import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import TimeRangePicker from './TimeRangePicker.vue'
import Field from '../Field/Field.vue'
import TimeInput from '../TimeInput/TimeInput.vue'
import { TIME_RANGE_PRESET_IDS, type TimeRangeValue } from './timeRange'
import * as barrel from './index'

type Props = Record<string, unknown>
const utc = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => new Date(Date.UTC(y, m - 1, d, h, mi, s, ms)).toISOString()
const NOW = utc(2024, 5, 15, 12, 30, 45, 123)
const VALUE: TimeRangeValue = { from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11, 30) }

let wrappers: VueWrapper[] = []
function mountPicker(props: Props = {}, attrs: Props = {}) {
  const w = mount(TimeRangePicker, { props: { locale: 'en-US', now: NOW, ...props }, attrs: { 'aria-label': 'Range', ...attrs }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const trigger = (w: VueWrapper) => w.find('[data-slot="time-range-picker-trigger"]')
const content = (w: VueWrapper) => w.find('[data-slot="time-range-picker-content"]')
const preset = (w: VueWrapper, id: string) => w.find(`[data-slot="time-range-picker-preset"][data-preset="${id}"]`)
const custom = (w: VueWrapper) => w.find('[data-slot="time-range-picker-custom"]')
const dateField = (w: VueWrapper, end: 'from' | 'to') => w.find(`[data-slot="time-range-picker-${end}"] input[type="date"]`)
const timeField = (w: VueWrapper, end: 'from' | 'to') => w.findAllComponents(TimeInput)[end === 'from' ? 0 : 1]
const apply = (w: VueWrapper) => w.find('[data-slot="time-range-picker-apply"]')
const draftMessage = (w: VueWrapper) => w.find('[data-slot="time-range-picker-draft-message"]')
const valueMessage = (w: VueWrapper) => w.find('[data-slot="time-range-picker-message"]')
const last = (w: VueWrapper) => w.emitted('update:modelValue')!.at(-1)![0] as TimeRangeValue | null
const pointerDown = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
async function open(w: VueWrapper) {
  await trigger(w).trigger('click')
  await flushPromises()
}
async function setDraft(w: VueWrapper, from: [string, string], to: [string, string]) {
  await dateField(w, 'from').setValue(from[0])
  timeField(w, 'from').vm.$emit('update:modelValue', from[1])
  await dateField(w, 'to').setValue(to[0])
  timeField(w, 'to').vm.$emit('update:modelValue', to[1])
  await nextTick()
}

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }))
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('TimeRangePicker: rendering', () => {
  it('renders a closed trigger with the placeholder and the data hooks', () => {
    const w = mountPicker()
    expect(w.attributes('data-slot')).toBe('time-range-picker')
    expect(w.attributes('data-variant')).toBe('popover')
    expect(w.attributes('data-state')).toBe('closed')
    expect(trigger(w).text()).toBe('Pick a time range')
    expect(trigger(w).attributes('aria-haspopup')).toBe('dialog')
    expect(trigger(w).attributes('aria-expanded')).toBe('false')
    expect(trigger(w).attributes('data-placeholder')).toBeDefined()
    expect(content(w).exists()).toBe(false)
  })

  it('shows the value in UTC by default, with the zone named once at the end', () => {
    const w = mountPicker({ modelValue: VALUE })
    expect(trigger(w).text()).toBe('May 1, 2024, 10:00 AM – May 1, 2024, 11:30 AM UTC')
    expect(trigger(w).attributes('data-placeholder')).toBeUndefined()
  })

  it('shows the value in the chosen zone while the value stays UTC', () => {
    const w = mountPicker({ modelValue: VALUE, timeZone: 'Europe/Warsaw' })
    expect(trigger(w).text()).toBe('May 1, 2024, 12:00 PM – May 1, 2024, 01:30 PM GMT+2')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('accepts offsets and date-only strings in the model', () => {
    const w = mountPicker({ modelValue: { from: '2024-05-01T12:00:00+02:00', to: '2024-05-02' } })
    expect(trigger(w).text()).toBe('May 1, 2024, 10:00 AM – May 2, 2024, 12:00 AM UTC')
  })

  it('formats with locale and format', async () => {
    const w = mountPicker({ modelValue: VALUE, locale: 'de-DE', format: { dateStyle: 'long', timeStyle: 'short' } })
    expect(trigger(w).text()).toBe('1. Mai 2024 um 10:00 – 1. Mai 2024 um 11:30')
    await w.setProps({ format: { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' } })
    expect(trigger(w).text()).toBe('10:00 UTC – 11:30 UTC')
  })

  it('follows controlled changes and clears to the placeholder', async () => {
    const w = mountPicker({ modelValue: VALUE })
    await w.setProps({ modelValue: null })
    expect(trigger(w).text()).toBe('Pick a time range')
    await w.setProps({ modelValue: { from: utc(2024, 6, 1), to: utc(2024, 6, 2) } })
    expect(trigger(w).text()).toContain('Jun 1, 2024')
  })

  it('custom placeholder', () => expect(trigger(mountPicker({ placeholder: 'Window' })).text()).toBe('Window'))

  it('exports the helpers and variants from the barrel', () => {
    expect(barrel.TimeRangePicker).toBeDefined()
    expect(barrel.TIME_RANGE_PRESET_IDS).toEqual(TIME_RANGE_PRESET_IDS)
    expect(barrel.isValidTimeZone('Europe/Warsaw')).toBe(true)
    expect(barrel.toTimeRangeInstant('2024-05-01')).toBe(Date.UTC(2024, 4, 1))
    expect(barrel.resolveTimeRangePreset('last-1-hour', 3_600_000 * 5, 'UTC')).toEqual({ from: 3_600_000 * 4, to: 3_600_000 * 5 })
    expect(barrel.timeRangePickerVariants({ variant: 'inline' })).toContain('border')
    expect(barrel.timeRangeTriggerVariants({ size: 'lg' })).toContain('h-11')
  })
})

describe('TimeRangePicker: presets', () => {
  it('opens a dialog with every preset in order, none pressed, and moves focus into it', async () => {
    const w = mountPicker()
    await open(w)
    expect(content(w).attributes('role')).toBe('dialog')
    expect(content(w).attributes('aria-label')).toBe('Choose time range')
    expect(trigger(w).attributes('aria-controls')).toBe(content(w).attributes('id'))
    expect(w.findAll('[data-slot="time-range-picker-preset"]').map((b) => b.attributes('data-preset'))).toEqual([...TIME_RANGE_PRESET_IDS])
    expect(w.findAll('[data-slot="time-range-picker-preset"]').map((b) => b.text())).toEqual([
      'Last 15 minutes', 'Last 30 minutes', 'Last hour', 'Last 6 hours', 'Last 24 hours', 'Last 7 days', 'Last 30 days', 'Today', 'Yesterday', 'Custom range',
    ])
    expect(w.findAll('[data-slot="time-range-picker-preset"][aria-pressed="true"]')).toHaveLength(0)
    expect(w.find('[data-slot="time-range-picker-presets"]').attributes('aria-label')).toBe('Presets')
    expect(document.activeElement).toBe(preset(w, 'last-15-minutes').element)
    expect(custom(w).exists()).toBe(false)
  })

  it.each([
    ['last-15-minutes', utc(2024, 5, 15, 12, 15, 45, 123)],
    ['last-30-minutes', utc(2024, 5, 15, 12, 0, 45, 123)],
    ['last-1-hour', utc(2024, 5, 15, 11, 30, 45, 123)],
    ['last-6-hours', utc(2024, 5, 15, 6, 30, 45, 123)],
    ['last-24-hours', utc(2024, 5, 14, 12, 30, 45, 123)],
    ['last-7-days', utc(2024, 5, 8, 12, 30, 45, 123)],
    ['last-30-days', utc(2024, 4, 15, 12, 30, 45, 123)],
  ])('%s resolves to concrete ISO strings ending at now, emits, selects and closes', async (id, from) => {
    const w = mountPicker()
    await open(w)
    await preset(w, id).trigger('click')
    await flushPromises()
    expect(last(w)).toEqual({ from, to: NOW })
    expect(w.emitted('select')![0][0]).toEqual({ preset: id, value: { from, to: NOW } })
    expect(content(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
    expect(w.emitted('update:open')!.map((e) => e[0])).toEqual([true, false])
  })

  it('today and yesterday follow the zone', async () => {
    const w = mountPicker({ timeZone: 'Asia/Tokyo' })
    await open(w)
    await preset(w, 'today').trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 14, 15), to: NOW })
    await open(w)
    await preset(w, 'yesterday').trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 13, 15), to: new Date(Date.parse(utc(2024, 5, 14, 15)) - 1).toISOString() })
  })

  it('resolves at selection time: the same preset gives a later range after the clock moved', async () => {
    vi.setSystemTime(new Date(utc(2024, 5, 15, 12, 0)))
    const w = mountPicker({ now: undefined })
    await open(w)
    await preset(w, 'last-1-hour').trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 15, 11), to: utc(2024, 5, 15, 12) })
    vi.setSystemTime(new Date(utc(2024, 5, 15, 12, 20)))
    await open(w)
    await preset(w, 'last-1-hour').trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 15, 11, 20), to: utc(2024, 5, 15, 12, 20) })
  })

  it('a changed `now` prop is used by the next selection', async () => {
    const w = mountPicker()
    await w.setProps({ now: new Date(utc(2024, 1, 1, 8)) })
    await open(w)
    await preset(w, 'last-1-hour').trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 1, 1, 7), to: utc(2024, 1, 1, 8) })
  })

  it('accepts now as a number, a Date or an ISO string; a bad now falls back to the clock', async () => {
    vi.setSystemTime(new Date(utc(2024, 7, 1, 9)))
    for (const now of [Date.parse(utc(2024, 5, 15, 12)), new Date(utc(2024, 5, 15, 12)), '2024-05-15T12:00:00Z']) {
      const w = mountPicker({ now })
      await open(w)
      await preset(w, 'last-1-hour').trigger('click')
      expect(last(w)).toEqual({ from: utc(2024, 5, 15, 11), to: utc(2024, 5, 15, 12) })
    }
    for (const now of ['garbage', NaN, {}, 1e300]) {
      const w = mountPicker({ now })
      await open(w)
      await preset(w, 'last-1-hour').trigger('click')
      expect(last(w)).toEqual({ from: utc(2024, 7, 1, 8), to: utc(2024, 7, 1, 9) })
    }
  })

  it('shows a subset in the given order, with its own labels; unknown ids and duplicates are ignored', async () => {
    const w = mountPicker({ presets: ['today', 'bogus', 'last-1-hour', 'today', 7, null, 'custom'], presetLabels: { today: 'Heute', 'last-1-hour': '  ', custom: 5, nope: 'x' } })
    await open(w)
    expect(w.findAll('[data-slot="time-range-picker-preset"]').map((b) => b.text())).toEqual(['Heute', 'Last hour', 'Custom range'])
  })

  it('without custom there is no field pane, even with a value', async () => {
    const w = mountPicker({ presets: ['last-1-hour'], modelValue: VALUE })
    await open(w)
    expect(custom(w).exists()).toBe(false)
    expect(w.findAll('[data-slot="time-range-picker-preset"]')).toHaveLength(1)
  })

  it('an empty or non-array preset list shows nothing to pick, or all of them', async () => {
    const none = mountPicker({ presets: [] })
    await open(none)
    expect(none.findAll('[data-slot="time-range-picker-preset"]')).toHaveLength(0)
    expect(none.find('[data-slot="time-range-picker-presets"]').exists()).toBe(false)
    const all = mountPicker({ presets: 'last-1-hour' })
    await open(all)
    expect(all.findAll('[data-slot="time-range-picker-preset"]')).toHaveLength(10)
  })

  it('disables a preset whose range leaves min or max, and ignores a click on it', async () => {
    const w = mountPicker({ min: utc(2024, 5, 15, 12), max: NOW })
    await open(w)
    expect(preset(w, 'last-15-minutes').attributes('disabled')).toBeUndefined()
    expect(preset(w, 'last-1-hour').attributes('disabled')).toBeDefined()
    expect(preset(w, 'today').attributes('disabled')).toBeDefined()
    expect(preset(w, 'custom').attributes('disabled')).toBeUndefined()
    await preset(w, 'last-1-hour').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await w.setProps({ max: utc(2024, 5, 15, 12) })
    expect(preset(w, 'last-15-minutes').attributes('disabled')).toBeDefined()
  })

  it('a reversed min and max are swapped', async () => {
    const w = mountPicker({ min: NOW, max: utc(2024, 5, 15, 12) })
    await open(w)
    expect(preset(w, 'last-15-minutes').attributes('disabled')).toBeUndefined()
    expect(preset(w, 'last-1-hour').attributes('disabled')).toBeDefined()
  })

  it('marks the chosen preset pressed on the next open', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'last-6-hours').trigger('click')
    await open(w)
    expect(preset(w, 'last-6-hours').attributes('aria-pressed')).toBe('true')
    expect(preset(w, 'today').attributes('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(preset(w, 'last-6-hours').element)
  })
})

describe('TimeRangePicker: custom range', () => {
  it('clicking Custom range shows the calendar, both field groups, the zone and Apply; it moves focus to the first date', async () => {
    const w = mountPicker({ timeZone: 'Europe/Warsaw' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    await flushPromises()
    expect(preset(w, 'custom').attributes('aria-pressed')).toBe('true')
    expect(custom(w).exists()).toBe(true)
    expect(w.find('[data-slot="calendar"]').attributes('data-mode')).toBe('range')
    expect(w.find('[data-slot="time-range-picker-from"] legend').text()).toBe('From')
    expect(w.find('[data-slot="time-range-picker-to"] legend').text()).toBe('To')
    expect(dateField(w, 'from').attributes('aria-label')).toBe('From date')
    expect(dateField(w, 'to').attributes('aria-label')).toBe('To date')
    expect(timeField(w, 'from').attributes('aria-label')).toBe('From time')
    expect(timeField(w, 'to').attributes('aria-label')).toBe('To time')
    expect(w.find('[data-slot="time-range-picker-zone"]').text()).toBe('Times are in Europe/Warsaw')
    expect(apply(w).text()).toBe('Apply')
    expect(document.activeElement).toBe(dateField(w, 'from').element)
    expect(draftMessage(w).text()).toBe('')
  })

  it('a range set at mount opens the custom fields filled with the zone wall clock', async () => {
    const w = mountPicker({ modelValue: VALUE, timeZone: 'Europe/Warsaw' })
    await open(w)
    expect(custom(w).exists()).toBe(true)
    expect((dateField(w, 'from').element as HTMLInputElement).value).toBe('2024-05-01')
    expect(timeField(w, 'from').text()).toContain('12')
    expect(timeField(w, 'to').find('[data-segment="minute"]').text()).toBe('30')
    expect(preset(w, 'custom').attributes('aria-pressed')).toBe('true')
  })

  it('Apply converts the zone wall clock to UTC ISO strings', async () => {
    const w = mountPicker({ timeZone: 'Europe/Warsaw' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    await setDraft(w, ['2024-05-01', '12:00'], ['2024-05-01', '13:30'])
    await apply(w).trigger('click')
    await flushPromises()
    expect(last(w)).toEqual({ from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11, 30) })
    expect(w.emitted('select')![0][0]).toEqual({ preset: 'custom', value: last(w) })
    expect(content(w).exists()).toBe(false)
    expect(trigger(w).text()).toBe('May 1, 2024, 12:00 PM – May 1, 2024, 01:30 PM GMT+2')
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('spring forward: a time that does not exist is moved forward and the fields show what was stored', async () => {
    const w = mountPicker({ timeZone: 'America/New_York' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    await setDraft(w, ['2024-03-10', '02:30'], ['2024-03-10', '04:00'])
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 3, 10, 7, 30), to: utc(2024, 3, 10, 8) })
    await open(w)
    expect(timeField(w, 'from').find('[data-segment="hour"]').text()).toBe('03')
    expect(timeField(w, 'from').find('[data-segment="minute"]').text()).toBe('30')
  })

  it('fall back: a time that happens twice is read as the first occurrence, and the 25 hour day is one range', async () => {
    const w = mountPicker({ timeZone: 'America/New_York' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    await setDraft(w, ['2024-11-03', '01:30'], ['2024-11-04', '00:00'])
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 11, 3, 5, 30), to: utc(2024, 11, 4, 5) })
  })

  it('the same wall time means a different instant in another zone', async () => {
    const out: string[] = []
    for (const timeZone of ['UTC', 'Asia/Kolkata', 'Pacific/Honolulu']) {
      const w = mountPicker({ timeZone })
      await open(w)
      await preset(w, 'custom').trigger('click')
      await setDraft(w, ['2024-05-01', '12:00'], ['2024-05-01', '13:00'])
      await apply(w).trigger('click')
      out.push(last(w)!.from)
    }
    expect(out).toEqual([utc(2024, 5, 1, 12), utc(2024, 5, 1, 6, 30), utc(2024, 5, 1, 22)])
  })

  it('a zero length range is valid', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    await setDraft(w, ['2024-05-01', '12:00'], ['2024-05-01', '12:00'])
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 1, 12), to: utc(2024, 5, 1, 12) })
  })

  it('clicking two calendar days sets both dates and fills empty times with the start and end of the day', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    await w.find('[data-slot="calendar-day"][data-date="2024-05-10"]').trigger('click')
    await w.find('[data-slot="calendar-day"][data-date="2024-05-12"]').trigger('click')
    await flushPromises()
    expect((dateField(w, 'from').element as HTMLInputElement).value).toBe('2024-05-10')
    expect((dateField(w, 'to').element as HTMLInputElement).value).toBe('2024-05-12')
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 10), to: utc(2024, 5, 12, 23, 59) })
  })

  it('a calendar pick keeps times that were already typed', async () => {
    const w = mountPicker({ modelValue: VALUE })
    await open(w)
    await w.find('[data-slot="calendar-day"][data-date="2024-05-10"]').trigger('click')
    await w.find('[data-slot="calendar-day"][data-date="2024-05-11"]').trigger('click')
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 10, 10), to: utc(2024, 5, 11, 11, 30) })
  })

  it('typing a date moves the calendar selection, and the calendar can be hidden', async () => {
    const w = mountPicker({ modelValue: VALUE })
    await open(w)
    await dateField(w, 'to').setValue('2024-05-03')
    expect(w.find('[data-slot="calendar-day"][data-date="2024-05-02"]').attributes('data-in-range')).toBe('true')
    await w.setProps({ showCalendar: false })
    expect(w.find('[data-slot="calendar"]').exists()).toBe(false)
  })

  it('a reversed calendar selection is normalised for display only', async () => {
    const w = mountPicker({ modelValue: VALUE })
    await open(w)
    await dateField(w, 'from').setValue('2024-05-09')
    await dateField(w, 'to').setValue('2024-05-05')
    expect(w.find('[data-slot="calendar-day"][data-date="2024-05-07"]').attributes('data-in-range')).toBe('true')
  })

  it('the calendar follows the zone date of the start, not the browser date', async () => {
    const w = mountPicker({ modelValue: { from: utc(2024, 5, 31, 23), to: utc(2024, 6, 1, 3) }, timeZone: 'Asia/Tokyo' })
    await open(w)
    expect(w.find('[data-slot="calendar-heading"]').text()).toBe('June 2024')
  })

  it('opens the calendar on the month of now when empty', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    expect(w.find('[data-slot="calendar-heading"]').text()).toBe('May 2024')
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(w.find('[data-slot="calendar-heading"]').text()).toBe('June 2024')
  })

  it('hour12 shows the AM/PM segment', async () => {
    const w = mountPicker({ modelValue: VALUE, hour12: true })
    await open(w)
    expect(timeField(w, 'from').find('[data-segment="period"]').exists()).toBe(true)
  })

  it('editing a field emits validate with the ISO ends and the reason', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    await dateField(w, 'from').setValue('2024-05-01')
    expect(w.emitted('validate')!.at(-1)![0]).toEqual({ valid: false, reason: 'incomplete', message: 'Enter a start and an end', from: null, to: null })
    expect(w.emitted('invalid')).toBeUndefined()
    await setDraft(w, ['2024-05-01', '10:00'], ['2024-05-01', '11:00'])
    expect(w.emitted('validate')!.at(-1)![0]).toEqual({ valid: true, reason: null, message: null, from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11) })
  })
})

describe('TimeRangePicker: validation', () => {
  async function customOpen(props: Props = {}) {
    const w = mountPicker(props)
    await open(w)
    await preset(w, 'custom').trigger('click')
    return w
  }

  it('a start after the end shows visible text with an icon, keeps the value, and emits invalid', async () => {
    const w = await customOpen()
    await setDraft(w, ['2024-05-02', '10:00'], ['2024-05-01', '10:00'])
    expect(draftMessage(w).text()).toBe('The start must not be after the end')
    expect(draftMessage(w).attributes('role')).toBe('status')
    expect(draftMessage(w).find('svg').exists()).toBe(true)
    expect(draftMessage(w).classes()).not.toContain('sr-only')
    await apply(w).trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(content(w).exists()).toBe(true)
    expect((w.emitted('invalid')!.at(-1)![0] as { reason: string }).reason).toBe('order')
  })

  it('the error clears as soon as the range is fixed', async () => {
    const w = await customOpen()
    await setDraft(w, ['2024-05-02', '10:00'], ['2024-05-01', '10:00'])
    await dateField(w, 'to').setValue('2024-05-03')
    expect(draftMessage(w).text()).toBe('')
    expect(draftMessage(w).classes()).toContain('sr-only')
  })

  it('an end the same instant in another zone is not an error (the order is of instants)', async () => {
    const w = await customOpen({ timeZone: 'Europe/Warsaw' })
    await setDraft(w, ['2024-05-01', '12:00'], ['2024-05-01', '12:00'])
    expect(draftMessage(w).text()).toBe('')
  })

  it('incomplete shows only after Apply was pressed, and Apply does not emit', async () => {
    const w = await customOpen()
    expect(draftMessage(w).text()).toBe('')
    await apply(w).trigger('click')
    expect(draftMessage(w).text()).toBe('Enter a start and an end')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await setDraft(w, ['2024-05-01', '10:00'], ['2024-05-01', '11:00'])
    expect(draftMessage(w).text()).toBe('')
  })

  it('an impossible date is incomplete, not a crash', async () => {
    const w = await customOpen()
    await setDraft(w, ['2024-02-30', '10:00'], ['2024-05-01', '11:00'])
    await apply(w).trigger('click')
    expect(draftMessage(w).text()).toBe('Enter a start and an end')
  })

  it('min and max reject a range outside them and name the limit in the zone', async () => {
    const w = await customOpen({ min: utc(2024, 5, 1, 8), max: utc(2024, 5, 1, 18), timeZone: 'Europe/Warsaw' })
    await setDraft(w, ['2024-05-01', '09:00'], ['2024-05-01', '12:00'])
    expect(draftMessage(w).text()).toBe('Must not start before May 1, 2024, 10:00 AM GMT+2')
    await setDraft(w, ['2024-05-01', '12:00'], ['2024-05-01', '21:00'])
    expect(draftMessage(w).text()).toBe('Must not end after May 1, 2024, 08:00 PM GMT+2')
    await setDraft(w, ['2024-05-01', '10:00'], ['2024-05-01', '20:00'])
    expect(draftMessage(w).text()).toBe('')
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 1, 8), to: utc(2024, 5, 1, 18) })
  })

  it('custom messages replace the defaults; {min} and {max} are filled; $ patterns in the text stay literal', async () => {
    const w = await customOpen({ min: utc(2024, 5, 1), messages: { order: 'Start $& end $1', min: 'Not before {min} {min} $`', incomplete: 'Fill both' } })
    await setDraft(w, ['2024-05-02', '10:00'], ['2024-05-01', '10:00'])
    expect(draftMessage(w).text()).toBe('Start $& end $1')
    await setDraft(w, ['2024-04-01', '10:00'], ['2024-05-02', '10:00'])
    expect(draftMessage(w).text()).toBe('Not before May 1, 2024, 12:00 AM UTC May 1, 2024, 12:00 AM UTC $`')
    await apply(w).trigger('click')
    await w.setProps({ messages: { order: 5, min: '   ', max: {} } as never })
    expect(draftMessage(w).text()).toBe('Must not start before May 1, 2024, 12:00 AM UTC')
  })

  it('a model value that is reversed shows the error outside the dropdown, sets aria-invalid and the error icon', async () => {
    const w = mountPicker({ modelValue: { from: VALUE.to, to: VALUE.from } })
    expect(valueMessage(w).text()).toBe('The start must not be after the end')
    expect(valueMessage(w).classes()).not.toContain('sr-only')
    expect(valueMessage(w).find('svg').exists()).toBe(true)
    expect(trigger(w).attributes('aria-invalid')).toBe('true')
    expect(trigger(w).attributes('aria-describedby')).toContain(valueMessage(w).attributes('id'))
    expect(w.find('[data-slot="field-status"]').attributes('data-status')).toBe('error')
    await w.setProps({ modelValue: VALUE })
    expect(valueMessage(w).text()).toBe('')
    expect(trigger(w).attributes('aria-invalid')).toBeUndefined()
  })

  it('a model value outside min or max is an error too', () => {
    const early = mountPicker({ modelValue: VALUE, min: utc(2024, 5, 2) })
    expect(valueMessage(early).text()).toBe('Must not start before May 2, 2024, 12:00 AM UTC')
    const late = mountPicker({ modelValue: VALUE, max: utc(2024, 5, 1, 11) })
    expect(valueMessage(late).text()).toBe('Must not end after May 1, 2024, 11:00 AM UTC')
  })

  it('the value error is hidden while the custom fields (which show the same error) are open', async () => {
    const w = mountPicker({ modelValue: { from: VALUE.to, to: VALUE.from } })
    await open(w)
    expect(valueMessage(w).text()).toBe('')
    expect(draftMessage(w).text()).toBe('The start must not be after the end')
  })

  it('the invalid prop and status error set aria-invalid without a message', () => {
    expect(trigger(mountPicker({ invalid: true })).attributes('aria-invalid')).toBe('true')
    const w = mountPicker({ status: 'error' })
    expect(trigger(w).attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-slot="field-status"]').exists()).toBe(true)
  })
})

describe('TimeRangePicker: keyboard', () => {
  it('ArrowDown on the trigger opens; Escape closes and returns focus', async () => {
    const w = mountPicker()
    ;(trigger(w).element as HTMLElement).focus()
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(content(w).exists()).toBe(true)
    await preset(w, 'today').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('Enter and Space on the trigger open it (native button click)', async () => {
    const w = mountPicker()
    await trigger(w).trigger('click')
    expect(w.attributes('data-state')).toBe('open')
  })

  it('presets are buttons: a click from the keyboard picks one', async () => {
    const w = mountPicker()
    await open(w)
    const el = preset(w, 'last-30-minutes').element as HTMLButtonElement
    el.focus()
    expect(document.activeElement).toBe(el)
    el.click()
    await flushPromises()
    expect(last(w)!.to).toBe(NOW)
  })

  it('Enter in a date field applies a valid range, and does nothing harmful for an invalid one', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    await setDraft(w, ['2024-05-01', '10:00'], ['2024-05-01', '11:00'])
    await dateField(w, 'from').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(last(w)).toEqual({ from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11) })
    await open(w)
    await dateField(w, 'to').setValue('2024-04-01')
    await dateField(w, 'to').trigger('keydown', { key: 'Enter' })
    expect(draftMessage(w).text()).toBe('The start must not be after the end')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('Enter on a calendar day is not treated as Apply', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    await w.find('[data-slot="calendar-day"][data-date="2024-05-10"]').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('types a time with the keyboard into the time segments', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'custom').trigger('click')
    await dateField(w, 'from').setValue('2024-05-01')
    await dateField(w, 'to').setValue('2024-05-01')
    const from = timeField(w, 'from')
    for (const [i, k] of ['0', '9', '3', '0'].entries()) await from.find(`[data-segment="${i < 2 ? 'hour' : 'minute'}"]`).trigger('keydown', { key: k })
    for (const [i, k] of ['1', '0', '4', '5'].entries()) await timeField(w, 'to').find(`[data-segment="${i < 2 ? 'hour' : 'minute'}"]`).trigger('keydown', { key: k })
    await apply(w).trigger('click')
    expect(last(w)).toEqual({ from: utc(2024, 5, 1, 9, 30), to: utc(2024, 5, 1, 10, 45) })
  })

  it('Tab order inside the dropdown: presets, calendar, fields, Apply; focus leaving closes it', async () => {
    const w = mountPicker({ modelValue: VALUE })
    await open(w)
    const order = [...content(w).element.querySelectorAll('button:not(:disabled), input, [role=spinbutton]')].map((el) => el.getAttribute('data-slot') ?? el.getAttribute('role'))
    expect(order.indexOf('time-range-picker-preset')).toBeLessThan(order.indexOf('calendar-prev'))
    expect(order.indexOf('calendar-prev')).toBeLessThan(order.indexOf('date-input-field'))
    expect(order.indexOf('date-input-field')).toBeLessThan(order.indexOf('time-input-hour'))
    expect(order.at(-1)).toBe('time-range-picker-apply')
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    await apply(w).trigger('focusout', { relatedTarget: outside })
    await flushPromises()
    expect(content(w).exists()).toBe(false)
  })

  it('a pointer press outside closes it; one inside does not', async () => {
    const w = mountPicker()
    await open(w)
    pointerDown(content(w).element)
    await flushPromises()
    expect(content(w).exists()).toBe(true)
    pointerDown(document.body)
    await flushPromises()
    expect(content(w).exists()).toBe(false)
  })
})

describe('TimeRangePicker: states', () => {
  it('disabled blocks opening and keyboard opening', async () => {
    const w = mountPicker({ disabled: true })
    expect(trigger(w).attributes('disabled')).toBeDefined()
    await trigger(w).trigger('click')
    expect(content(w).exists()).toBe(false)
  })
  it('readonly shows the range but cannot open or clear', async () => {
    const w = mountPicker({ readonly: true, clearable: true, modelValue: VALUE })
    await trigger(w).trigger('click')
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(content(w).exists()).toBe(false)
    expect(w.find('[data-slot="time-range-picker-clear"]').exists()).toBe(false)
    expect(trigger(w).attributes('data-readonly')).toBeDefined()
    expect(trigger(w).text()).toContain('May 1, 2024')
  })
  it('a dropdown that is open when the picker becomes disabled closes', async () => {
    const w = mountPicker()
    await open(w)
    await w.setProps({ disabled: true })
    expect(content(w).exists()).toBe(false)
  })
  it('required adds a hidden description to the trigger', () => {
    const w = mountPicker({ required: true })
    const id = w.find('[data-slot="time-range-picker-required"]').attributes('id')!
    expect(w.find('[data-slot="time-range-picker-required"]').text()).toBe('Required')
    expect(trigger(w).attributes('aria-describedby')).toContain(id)
  })
  it('clearable: the clear button resets the value, closes and focuses the trigger', async () => {
    const w = mountPicker({ clearable: true, modelValue: VALUE })
    const clear = w.find('[data-slot="time-range-picker-clear"]')
    expect(clear.attributes('aria-label')).toBe('Clear time range')
    await clear.trigger('click')
    await flushPromises()
    expect(last(w)).toBeNull()
    expect(trigger(w).text()).toBe('Pick a time range')
    expect(document.activeElement).toBe(trigger(w).element)
    expect(w.find('[data-slot="time-range-picker-clear"]').exists()).toBe(false)
    await open(w)
    expect(preset(w, 'custom').attributes('aria-pressed')).toBe('false')
  })
  it('controlled open', async () => {
    const w = mountPicker({ open: true })
    expect(content(w).exists()).toBe(true)
    await preset(w, 'today').trigger('click')
    expect(w.emitted('update:open')!.at(-1)).toEqual([false])
    expect(content(w).exists()).toBe(true)
    await w.setProps({ open: false })
    expect(content(w).exists()).toBe(false)
  })
  it('inside a Field it takes the label, the id and the error wiring', async () => {
    const w = mount(Field, { props: { label: 'Window', error: 'Pick a window', required: true }, slots: { default: () => h(TimeRangePicker, { now: NOW }) }, attachTo: document.body })
    wrappers.push(w)
    await flushPromises()
    const t = w.find('[data-slot="time-range-picker-trigger"]')
    expect(t.attributes('aria-invalid')).toBe('true')
    expect(t.attributes('aria-describedby')).toContain(w.find('[data-slot="field-error"]').attributes('id'))
    expect(w.find('label').attributes('for')).toBe(t.attributes('id'))
  })
  it('an external value change opens the custom fields and syncs them; the same value emitted by us does not', async () => {
    const w = mountPicker()
    await open(w)
    await preset(w, 'last-1-hour').trigger('click')
    await w.setProps({ modelValue: last(w) })
    await open(w)
    expect(custom(w).exists()).toBe(false)
    await w.setProps({ modelValue: { from: utc(2024, 1, 1, 8), to: utc(2024, 1, 1, 9) } })
    expect(custom(w).exists()).toBe(true)
    expect((dateField(w, 'from').element as HTMLInputElement).value).toBe('2024-01-01')
    await w.setProps({ modelValue: null })
    expect(custom(w).exists()).toBe(false)
  })
  it('a zone change re-reads the fields in the new zone', async () => {
    const w = mountPicker({ modelValue: { from: utc(2024, 5, 1, 23), to: utc(2024, 5, 2, 1) } })
    await open(w)
    expect((dateField(w, 'from').element as HTMLInputElement).value).toBe('2024-05-01')
    await w.setProps({ timeZone: 'Asia/Tokyo' })
    expect((dateField(w, 'from').element as HTMLInputElement).value).toBe('2024-05-02')
  })
})

describe('TimeRangePicker: bad and hostile input', () => {
  it.each([null, undefined, 'x', 5, [], {}, { from: VALUE.from }, { from: 'x', to: VALUE.to }, { from: {}, to: [] }, { from: new Date(NaN), to: new Date(NaN) }, { from: '9'.repeat(1_000_000), to: VALUE.to }])('model %j counts as empty', (v) => {
    const w = mountPicker({ modelValue: v })
    expect(trigger(w).text()).toBe('Pick a time range')
    expect(valueMessage(w).text()).toBe('')
  })

  it('an unknown time zone shows UTC; a hostile one never throws', () => {
    for (const timeZone of ['Mars/Base', '', '  ', 'x'.repeat(10_000), '<script>alert(1)</script>', '../../etc/passwd', 5, null, {}]) {
      const w = mountPicker({ modelValue: VALUE, timeZone })
      expect(trigger(w).text(), String(timeZone)).toBe('May 1, 2024, 10:00 AM – May 1, 2024, 11:30 AM UTC')
    }
  })

  it('a time zone is case insensitive and resolved to its canonical name', async () => {
    const w = mountPicker({ timeZone: 'europe/warsaw' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    expect(w.find('[data-slot="time-range-picker-zone"]').text()).toBe('Times are in Europe/Warsaw')
  })

  it('a bad locale or format falls back instead of throwing', () => {
    expect(trigger(mountPicker({ modelValue: VALUE, locale: 'not a locale!!' })).text()).toContain('2024')
    expect(trigger(mountPicker({ modelValue: VALUE, format: { dateStyle: 'bogus' } })).text()).toBe('May 1, 2024, 10:00 AM – May 1, 2024, 11:30 AM UTC')
  })

  it('huge and markup text stays text and is truncated by CSS, not injected', async () => {
    const huge = 'W'.repeat(100_000)
    const w = mountPicker({ placeholder: huge, presetLabels: { today: '<img src=x onerror=alert(1)>' }, applyLabel: '<b>Go</b>' })
    expect(w.find('[data-slot="time-range-picker-value"]').classes()).toContain('truncate')
    await open(w)
    expect(preset(w, 'today').text()).toBe('<img src=x onerror=alert(1)>')
    expect(w.find('img').exists()).toBe(false)
    await preset(w, 'custom').trigger('click')
    expect(apply(w).text()).toBe('<b>Go</b>')
    expect(w.find('b').exists()).toBe(false)
  })

  it('a hostile zoneLabel with $ patterns stays literal', async () => {
    const w = mountPicker({ zoneLabel: 'Zone $& {zone} $1' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    expect(w.find('[data-slot="time-range-picker-zone"]').text()).toBe('Zone $& UTC $1')
  })

  it('rapid toggling and repeated clicks stay consistent', async () => {
    const w = mountPicker()
    for (let i = 0; i < 20; i++) await trigger(w).trigger('click')
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    await open(w)
    await preset(w, 'last-1-hour').trigger('click')
    expect(preset(w, 'last-1-hour').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('a custom range at the edge of the supported years', async () => {
    const w = mountPicker({ timeZone: 'Pacific/Pago_Pago' })
    await open(w)
    await preset(w, 'custom').trigger('click')
    await setDraft(w, ['9999-12-30', '10:00'], ['9999-12-31', '23:59'])
    await apply(w).trigger('click')
    expect(draftMessage(w).text()).toBe('Enter a start and an end')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('removes its document listener on unmount', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const w = mountPicker()
    await open(w)
    w.unmount()
    wrappers = []
    expect(remove.mock.calls.some((c) => c[0] === 'pointerdown')).toBe(true)
  })
})

describe('TimeRangePicker: right to left', () => {
  const rtl = (props: Props = {}) => {
    const host = document.createElement('div')
    host.dir = 'rtl'
    document.body.append(host)
    const w = mount(TimeRangePicker, { props: { now: NOW, ...props }, attrs: { 'aria-label': 'Range' }, attachTo: host })
    wrappers.push(w)
    return w
  }
  it('uses only logical classes in every variant, open and closed', async () => {
    for (const variant of ['popover', 'inline', 'segmented']) {
      const w = rtl({ variant, modelValue: VALUE, clearable: true, open: true })
      await flushPromises()
      const html = w.html()
      expect(html, variant).not.toMatch(/\b(?:ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r|rounded-l|rounded-r)-/)
    }
  })
  it('displays an Arabic value with Arabic digits and keeps working', async () => {
    const w = rtl({ modelValue: VALUE, locale: 'ar-EG', timeZone: 'Africa/Cairo' })
    expect(trigger(w).text()).toMatch(/[٠-٩]/)
    await open(w)
    await preset(w, 'last-1-hour').trigger('click')
    expect(last(w)!.to).toBe(NOW)
  })
  it('Hebrew and long right to left labels render as text', async () => {
    const label = 'טווח זמן '.repeat(50)
    const w = rtl({ locale: 'he-IL', placeholder: label, presetLabels: { today: label } })
    expect(trigger(w).text()).toBe(label.trim())
    await open(w)
    expect(preset(w, 'today').text()).toBe(label.trim())
  })
})

describe('TimeRangePicker: lifecycle', () => {
  it('works under a parent that re-renders with v-model', async () => {
    const model = ref<TimeRangeValue | null>(null)
    const Parent = defineComponent({ setup: () => () => h(TimeRangePicker, { modelValue: model.value, now: NOW, locale: 'en-US', 'aria-label': 'Range', 'onUpdate:modelValue': (v: TimeRangeValue | null) => (model.value = v) }) })
    const w = mount(Parent, { attachTo: document.body })
    wrappers.push(w)
    await w.find('[data-slot="time-range-picker-trigger"]').trigger('click')
    await w.find('[data-preset="last-24-hours"]').trigger('click')
    await flushPromises()
    expect(model.value).toEqual({ from: utc(2024, 5, 14, 12, 30, 45, 123), to: NOW })
    expect(w.find('[data-slot="time-range-picker-trigger"]').text()).toContain('May 14, 2024')
  })
})
