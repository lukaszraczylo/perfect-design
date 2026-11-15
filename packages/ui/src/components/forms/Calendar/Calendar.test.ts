import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import Calendar from './Calendar.vue'
import { calendarVariants } from './variants'
import { addDays, createDate, formatISODate } from './dateMath'
import * as barrel from './index'

const d = (y: number, m: number, day: number) => createDate(y, m - 1, day)
const iso = (v: unknown) => formatISODate(v as Date)
type Props = Record<string, unknown>

let wrappers: VueWrapper[] = []
function mountCal(props: Props = {}, attrs: Props = {}) {
  const w = mount(Calendar, { props: { weekStart: 0, locale: 'en-US', ...props }, attrs, attachTo: document.body })
  wrappers.push(w)
  return w
}
const day = (w: VueWrapper, date: string) => w.find(`[data-slot="calendar-day"][data-date="${date}"]`)
const days = (w: VueWrapper) => w.findAll('[data-slot="calendar-day"]')
const heading = (w: VueWrapper) => w.findAll('[data-slot="calendar-heading"]').map((h) => h.text())
const focusedIso = () => (document.activeElement as HTMLElement | null)?.getAttribute('data-date')
const lastEmit = (w: VueWrapper, name = 'update:modelValue') => w.emitted(name)!.at(-1)![0]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2024, 1, 15, 10, 30)) // Thu 15 Feb 2024 (leap year)
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Calendar: rendering', () => {
  it('renders an accessible month grid with heading, weekdays and every day', () => {
    const w = mountCal()
    expect(w.attributes('data-slot')).toBe('calendar')
    expect(heading(w)).toEqual(['February 2024'])
    const grid = w.find('[role="grid"]')
    // The visible heading names the grid (aria-labelledby), so the visible text is the accessible name.
    expect(grid.attributes('aria-labelledby')).toBe(w.find('[data-slot="calendar-heading"]').attributes('id'))
    expect(grid.attributes('aria-label')).toBeUndefined()
    expect(grid.attributes('aria-multiselectable')).toBeUndefined()
    expect(w.findAll('[role="columnheader"]').map((c) => c.text())).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(w.findAll('[role="columnheader"]')[0].attributes('aria-label')).toBe('Sunday')
    expect(days(w)).toHaveLength(29)
    expect(day(w, '2024-02-29').exists()).toBe(true)
    expect(day(w, '2024-02-29').attributes('aria-label')).toBe('Thursday, February 29, 2024')
    expect(day(w, '2024-02-01').text()).toBe('1')
    expect(w.findAll('[role="row"]')).toHaveLength(6) // header + 5 weeks
  })

  it('marks today and gives it the roving tab stop (only one tabbable day)', () => {
    const w = mountCal()
    expect(day(w, '2024-02-15').attributes('data-today')).toBe('true')
    expect(day(w, '2024-02-15').attributes('aria-current')).toBe('date')
    expect(days(w).filter((b) => b.attributes('tabindex') === '0').map((b) => b.attributes('data-date'))).toEqual(['2024-02-15'])
    expect(w.findAll('[aria-current="date"]')).toHaveLength(1)
  })

  it('renders blank, hidden cells for days outside the month', () => {
    const w = mountCal()
    const blanks = w.findAll('td[aria-hidden="true"]')
    expect(blanks).toHaveLength(35 - 29)
    expect(blanks.every((b) => b.find('button').exists() === false)).toBe(true)
  })

  it('starts on the month of the selected value', () => {
    const w = mountCal({ modelValue: d(2023, 12, 25) })
    expect(heading(w)).toEqual(['December 2023'])
    expect(day(w, '2023-12-25').attributes('tabindex')).toBe('0')
    expect(day(w, '2023-12-25').attributes('data-selected')).toBe('true')
    expect(day(w, '2023-12-25').element.closest('td')!.getAttribute('aria-selected')).toBe('true')
    expect(day(w, '2023-12-24').element.closest('td')!.getAttribute('aria-selected')).toBe('false')
  })

  it('weekStart reorders columns; locale changes names and numerals', () => {
    const mon = mountCal({ weekStart: 1 })
    expect(mon.findAll('[role="columnheader"]')[0].text()).toBe('Mon')
    expect(mon.findAll('[role="columnheader"]')[6].text()).toBe('Sun')
    const de = mountCal({ locale: 'de-DE', weekStart: 1 })
    expect(heading(de)).toEqual(['Februar 2024'])
    expect(de.findAll('[role="columnheader"]')[0].attributes('aria-label')).toBe('Montag')
    const ar = mountCal({ locale: 'ar-EG' })
    expect(day(ar, '2024-02-05').text()).toBe('٥')
  })

  it('derives the first weekday from the locale when weekStart is omitted', () => {
    const w = mount(Calendar, { props: { locale: 'en-GB' }, attachTo: document.body })
    wrappers.push(w)
    expect(w.findAll('[role="columnheader"]')[0].attributes('aria-label')).toBe('Monday')
  })

  it('invalid weekStart falls back to the locale default', () => {
    const w = mountCal({ weekStart: 9, locale: 'en-US' })
    expect(w.findAll('[role="columnheader"]')[0].text()).toBe('Sun')
  })

  it('showHeading=false hides the title but keeps navigation and the grid label', () => {
    const w = mountCal({ showHeading: false })
    expect(heading(w)).toEqual([])
    expect(w.find('[data-slot="calendar-prev"]').exists()).toBe(true)
    expect(w.find('[role="grid"]').attributes('aria-label')).toBe('February 2024')
  })

  it('numberOfMonths=2 renders two grids with one prev (first) and one next (last)', () => {
    const w = mountCal({ numberOfMonths: 2 })
    expect(heading(w)).toEqual(['February 2024', 'March 2024'])
    expect(w.findAll('[role="grid"]')).toHaveLength(2)
    expect(w.findAll('[data-slot="calendar-prev"]')).toHaveLength(1)
    expect(w.findAll('[data-slot="calendar-next"]')).toHaveLength(1)
    expect(days(w)).toHaveLength(29 + 31)
    expect(w.findAll('[data-slot="calendar-month"]')[0].find('[data-slot="calendar-prev"]').exists()).toBe(true)
    expect(w.findAll('[data-slot="calendar-month"]')[1].find('[data-slot="calendar-next"]').exists()).toBe(true)
  })

  it('numberOfMonths other than 2 or 3 renders one month (3 is covered in Calendar.variants.test.ts)', () => {
    expect(mountCal({ numberOfMonths: 4 as never }).findAll('[role="grid"]')).toHaveLength(1)
    expect(mountCal({ numberOfMonths: 0 }).findAll('[role="grid"]')).toHaveLength(1)
  })

  it('renders years below 100 and far-future months without throwing', () => {
    const w = mountCal({ modelValue: createDate(99, 5, 1) })
    expect(days(w)).toHaveLength(30)
    expect(day(w, '0099-06-01').exists()).toBe(true)
  })
})

describe('Calendar: single selection', () => {
  it('click emits update:modelValue with a local-midnight Date and select', async () => {
    const w = mountCal()
    await day(w, '2024-02-10').trigger('click')
    const v = lastEmit(w) as Date
    expect(iso(v)).toBe('2024-02-10')
    expect(v.getHours()).toBe(0)
    expect(iso(lastEmit(w, 'select'))).toBe('2024-02-10')
  })

  it('works uncontrolled: selected day updates without a parent', async () => {
    const w = mountCal()
    await day(w, '2024-02-10').trigger('click')
    expect(day(w, '2024-02-10').attributes('data-selected')).toBe('true')
    await day(w, '2024-02-11').trigger('click')
    expect(day(w, '2024-02-10').attributes('data-selected')).toBeUndefined()
    expect(day(w, '2024-02-11').attributes('data-selected')).toBe('true')
  })

  it('follows a controlled modelValue change (including time-of-day input)', async () => {
    const w = mountCal({ modelValue: new Date(2024, 1, 3, 23, 59) })
    expect(day(w, '2024-02-03').attributes('data-selected')).toBe('true')
    await w.setProps({ modelValue: d(2024, 2, 20) })
    expect(day(w, '2024-02-03').attributes('data-selected')).toBeUndefined()
    expect(day(w, '2024-02-20').attributes('data-selected')).toBe('true')
  })

  it('re-clicking the selected day emits select but no model update', async () => {
    const w = mountCal({ modelValue: d(2024, 2, 10) })
    await day(w, '2024-02-10').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('select')).toHaveLength(1)
  })

  it('moves the visible month when the model changes to a day that is not visible', async () => {
    const w = mountCal({ modelValue: d(2024, 2, 10) })
    await w.setProps({ modelValue: d(2025, 7, 4) })
    expect(heading(w)).toEqual(['July 2025'])
    expect(day(w, '2025-07-04').attributes('tabindex')).toBe('0')
    expect(w.emitted('update:month')).toBeUndefined() // external change: no echo
  })

  it('leaves the month alone when the new value is already visible', async () => {
    const w = mountCal({ modelValue: d(2024, 2, 10) })
    await w.setProps({ modelValue: d(2024, 2, 12) })
    expect(heading(w)).toEqual(['February 2024'])
  })

  it('null clears the selection', async () => {
    const w = mountCal({ modelValue: d(2024, 2, 10) })
    await w.setProps({ modelValue: null })
    expect(w.find('[data-selected]').exists()).toBe(false)
  })
})

describe('Calendar: multiple selection', () => {
  it('toggles days on and off and emits sorted arrays', async () => {
    const w = mountCal({ mode: 'multiple' })
    expect(w.find('[role="grid"]').attributes('aria-multiselectable')).toBe('true')
    await day(w, '2024-02-20').trigger('click')
    await day(w, '2024-02-05').trigger('click')
    expect((lastEmit(w) as Date[]).map(iso)).toEqual(['2024-02-05', '2024-02-20'])
    await day(w, '2024-02-20').trigger('click')
    expect((lastEmit(w) as Date[]).map(iso)).toEqual(['2024-02-05'])
    expect(w.findAll('[data-selected]')).toHaveLength(1)
  })

  it('renders a controlled array, ignoring invalid and duplicate entries', () => {
    const w = mountCal({ mode: 'multiple', modelValue: [d(2024, 2, 1), new Date(2024, 1, 1, 9), new Date('x'), d(2024, 2, 3)] })
    expect(w.findAll('[data-selected]').map((b) => b.attributes('data-date'))).toEqual(['2024-02-01', '2024-02-03'])
  })

  it('handles 10 000 selected dates', () => {
    const many = Array.from({ length: 10_000 }, (_, i) => addDays(d(2000, 1, 1), i))
    const w = mountCal({ mode: 'multiple', modelValue: many, month: d(2024, 2, 1) })
    expect(w.findAll('[data-selected]')).toHaveLength(29)
  })

  it('empty array selects nothing; a non-array value is treated as empty', () => {
    expect(mountCal({ mode: 'multiple', modelValue: [] }).find('[data-selected]').exists()).toBe(false)
    expect(mountCal({ mode: 'multiple', modelValue: d(2024, 2, 1) }).find('[data-selected]').exists()).toBe(false)
  })
})

describe('Calendar: range selection', () => {
  it('first click only anchors; second click emits the normalised range', async () => {
    const w = mountCal({ mode: 'range' })
    await day(w, '2024-02-10').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(day(w, '2024-02-10').attributes('data-selected')).toBe('true')
    await day(w, '2024-02-14').trigger('click')
    const r = lastEmit(w) as { start: Date; end: Date }
    expect([iso(r.start), iso(r.end)]).toEqual(['2024-02-10', '2024-02-14'])
    expect(day(w, '2024-02-12').attributes('data-in-range')).toBe('true')
    expect(day(w, '2024-02-10').attributes('data-range-start')).toBe('true')
    expect(day(w, '2024-02-14').attributes('data-range-end')).toBe('true')
    expect(day(w, '2024-02-09').attributes('data-in-range')).toBeUndefined()
  })

  it('reversed clicks are normalised', async () => {
    const w = mountCal({ mode: 'range' })
    await day(w, '2024-02-20').trigger('click')
    await day(w, '2024-02-05').trigger('click')
    const r = lastEmit(w) as { start: Date; end: Date }
    expect([iso(r.start), iso(r.end)]).toEqual(['2024-02-05', '2024-02-20'])
  })

  it('clicking the same day twice gives a one-day range with no in-between cells', async () => {
    const w = mountCal({ mode: 'range' })
    await day(w, '2024-02-10').trigger('click')
    await day(w, '2024-02-10').trigger('click')
    const r = lastEmit(w) as { start: Date; end: Date }
    expect(iso(r.start)).toBe(iso(r.end))
    expect(w.findAll('[data-in-range]')).toHaveLength(0)
    expect(day(w, '2024-02-10').attributes('data-range-start')).toBeUndefined()
    expect(day(w, '2024-02-10').attributes('data-selected')).toBe('true')
  })

  it('a third click starts a new range', async () => {
    const w = mountCal({ mode: 'range', modelValue: { start: d(2024, 2, 1), end: d(2024, 2, 5) } })
    await day(w, '2024-02-20').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await day(w, '2024-02-22').trigger('click')
    const r = lastEmit(w) as { start: Date; end: Date }
    expect([iso(r.start), iso(r.end)]).toEqual(['2024-02-20', '2024-02-22'])
  })

  it('renders a controlled range and normalises a reversed one', () => {
    const w = mountCal({ mode: 'range', modelValue: { start: d(2024, 2, 9), end: d(2024, 2, 5) } })
    expect(day(w, '2024-02-05').attributes('data-range-start')).toBe('true')
    expect(day(w, '2024-02-09').attributes('data-range-end')).toBe('true')
    expect(w.findAll('[data-in-range]')).toHaveLength(3)
  })

  it('treats wrong shapes (Date, partial, invalid) as empty', () => {
    for (const bad of [d(2024, 2, 1), { start: d(2024, 2, 1) }, { start: new Date('x'), end: d(2024, 2, 3) }, [d(2024, 2, 1)]]) {
      expect(mountCal({ mode: 'range', modelValue: bad }).find('[data-selected]').exists()).toBe(false)
    }
  })

  it('hover previews the range while an anchor is set, and leaving the grid clears it', async () => {
    const w = mountCal({ mode: 'range' })
    await day(w, '2024-02-10').trigger('click')
    await day(w, '2024-02-13').trigger('mouseenter')
    expect(day(w, '2024-02-11').attributes('data-in-range')).toBe('true')
    expect(day(w, '2024-02-13').attributes('data-range-end')).toBe('true')
    await day(w, '2024-02-06').trigger('mouseenter') // hovering before the anchor previews a reversed range
    expect(day(w, '2024-02-08').attributes('data-in-range')).toBe('true')
    expect(day(w, '2024-02-06').attributes('data-range-start')).toBe('true')
    await w.find('[role="grid"]').trigger('mouseleave')
    expect(w.findAll('[data-in-range]')).toHaveLength(0)
  })

  it('hover without an anchor does nothing', async () => {
    const w = mountCal({ mode: 'range', modelValue: { start: d(2024, 2, 1), end: d(2024, 2, 3) } })
    await day(w, '2024-02-20').trigger('mouseenter')
    expect(w.findAll('[data-in-range]')).toHaveLength(1)
  })

  it('Escape cancels an in-progress range (and swallows the event); otherwise it bubbles', async () => {
    const outer = vi.fn()
    const w = mountCal({ mode: 'range' })
    w.element.parentElement!.addEventListener('keydown', outer)
    await day(w, '2024-02-10').trigger('click')
    await day(w, '2024-02-10').trigger('keydown', { key: 'Escape' })
    expect(outer).not.toHaveBeenCalled()
    await day(w, '2024-02-12').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined() // the second click started a new anchor
    await day(w, '2024-02-12').trigger('keydown', { key: 'Escape' })
    await day(w, '2024-02-12').trigger('keydown', { key: 'Escape' })
    expect(outer).toHaveBeenCalledTimes(1)
  })

  it('range across a month boundary with two months visible', async () => {
    const w = mountCal({ mode: 'range', numberOfMonths: 2 })
    await day(w, '2024-02-28').trigger('click')
    await day(w, '2024-03-02').trigger('click')
    const r = lastEmit(w) as { start: Date; end: Date }
    expect([iso(r.start), iso(r.end)]).toEqual(['2024-02-28', '2024-03-02'])
    expect(day(w, '2024-02-29').attributes('data-in-range')).toBe('true')
    expect(day(w, '2024-03-01').attributes('data-in-range')).toBe('true')
  })

  it('a controlled model that is cleared externally empties the range', async () => {
    const w = mountCal({ mode: 'range', modelValue: { start: d(2024, 2, 1), end: d(2024, 2, 3) } })
    await w.setProps({ modelValue: null })
    expect(w.find('[data-selected]').exists()).toBe(false)
  })

  it('unknown mode falls back to single', async () => {
    const w = mountCal({ mode: 'bogus' })
    await day(w, '2024-02-04').trigger('click')
    expect(lastEmit(w)).toBeInstanceOf(Date)
  })
})

describe('Calendar: min / max / disabled dates', () => {
  it('disables days outside min..max (inclusive) with aria-disabled and ignores clicks', async () => {
    const w = mountCal({ min: d(2024, 2, 10), max: d(2024, 2, 20) })
    expect(day(w, '2024-02-09').attributes('aria-disabled')).toBe('true')
    expect(day(w, '2024-02-10').attributes('aria-disabled')).toBeUndefined()
    expect(day(w, '2024-02-20').attributes('aria-disabled')).toBeUndefined()
    expect(day(w, '2024-02-21').attributes('data-disabled')).toBe('true')
    await day(w, '2024-02-09').trigger('click')
    await day(w, '2024-02-21').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('select')).toBeUndefined()
    await day(w, '2024-02-10').trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('swaps reversed min/max', () => {
    const w = mountCal({ min: d(2024, 2, 20), max: d(2024, 2, 10) })
    expect(day(w, '2024-02-15').attributes('aria-disabled')).toBeUndefined()
    expect(day(w, '2024-02-05').attributes('aria-disabled')).toBe('true')
    expect(day(w, '2024-02-25').attributes('aria-disabled')).toBe('true')
  })

  it('ignores invalid min/max', () => {
    const w = mountCal({ min: new Date('x'), max: new Date('y') })
    expect(w.findAll('[aria-disabled="true"]').filter((b) => b.attributes('data-slot') === 'calendar-day')).toHaveLength(0)
  })

  it('isDateDisabled predicate disables weekends', async () => {
    const w = mountCal({ isDateDisabled: (x: Date) => x.getDay() === 0 || x.getDay() === 6 })
    expect(day(w, '2024-02-03').attributes('aria-disabled')).toBe('true') // Saturday
    expect(day(w, '2024-02-04').attributes('aria-disabled')).toBe('true') // Sunday
    expect(day(w, '2024-02-05').attributes('aria-disabled')).toBeUndefined()
    await day(w, '2024-02-03').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('range selection ignores clicks on disabled days (anchor stays)', async () => {
    const w = mountCal({ mode: 'range', max: d(2024, 2, 20) })
    await day(w, '2024-02-10').trigger('click')
    await day(w, '2024-02-25').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await day(w, '2024-02-18').trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('initial focus is clamped into min..max and its month shown', () => {
    const w = mountCal({ min: d(2024, 5, 10) })
    expect(heading(w)).toEqual(['May 2024'])
    expect(day(w, '2024-05-10').attributes('tabindex')).toBe('0')
    const w2 = mountCal({ max: d(2023, 11, 20) })
    expect(heading(w2)).toEqual(['November 2023'])
  })

  it('re-clamps focus when min/max change', async () => {
    const w = mountCal()
    await w.setProps({ min: d(2024, 4, 3) })
    expect(heading(w)).toEqual(['April 2024'])
    expect(day(w, '2024-04-03').attributes('tabindex')).toBe('0')
  })

  it('disabled selected day stays rendered as selected', () => {
    const w = mountCal({ modelValue: d(2024, 2, 4), isDateDisabled: () => true })
    expect(day(w, '2024-02-04').attributes('data-selected')).toBe('true')
  })
})

describe('Calendar: month navigation', () => {
  it('next/prev change the month, keep one tab stop and emit update:month', async () => {
    const w = mountCal()
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(heading(w)).toEqual(['March 2024'])
    expect(iso(lastEmit(w, 'update:month'))).toBe('2024-03-01')
    expect(days(w).filter((b) => b.attributes('tabindex') === '0').map((b) => b.attributes('data-date'))).toEqual(['2024-03-15'])
    await w.find('[data-slot="calendar-prev"]').trigger('click')
    await w.find('[data-slot="calendar-prev"]').trigger('click')
    expect(heading(w)).toEqual(['January 2024'])
    expect(iso(lastEmit(w, 'update:month'))).toBe('2024-01-01')
  })

  it('navigating from Jan 31 to Feb clamps the roving day to the month length', async () => {
    const w = mountCal({ modelValue: d(2024, 1, 31) })
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(day(w, '2024-02-29').attributes('tabindex')).toBe('0')
  })

  it('crosses year boundaries both ways', async () => {
    const w = mountCal({ modelValue: d(2024, 12, 10) })
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(heading(w)).toEqual(['January 2025'])
    await w.find('[data-slot="calendar-prev"]').trigger('click')
    await w.find('[data-slot="calendar-prev"]').trigger('click')
    expect(heading(w)).toEqual(['November 2024'])
  })

  it('two-month view pages by one month', async () => {
    const w = mountCal({ numberOfMonths: 2 })
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(heading(w)).toEqual(['March 2024', 'April 2024'])
  })

  it('prev/next are aria-disabled at min/max and do nothing', async () => {
    const w = mountCal({ min: d(2024, 2, 1), max: d(2024, 2, 29) })
    const prev = w.find('[data-slot="calendar-prev"]')
    const next = w.find('[data-slot="calendar-next"]')
    expect(prev.attributes('aria-disabled')).toBe('true')
    expect(next.attributes('aria-disabled')).toBe('true')
    await prev.trigger('click')
    await next.trigger('click')
    expect(heading(w)).toEqual(['February 2024'])
    expect(w.emitted('update:month')).toBeUndefined()
  })

  it('stays navigable up to a bound that is a month away', async () => {
    const w = mountCal({ max: d(2024, 3, 1) })
    expect(w.find('[data-slot="calendar-next"]').attributes('aria-disabled')).toBeUndefined()
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(w.find('[data-slot="calendar-next"]').attributes('aria-disabled')).toBe('true')
  })

  it('two-month view disables next when the second month is the last allowed', () => {
    const w = mountCal({ numberOfMonths: 2, max: d(2024, 3, 31) })
    expect(w.find('[data-slot="calendar-next"]').attributes('aria-disabled')).toBe('true')
  })

  it('custom prev/next labels', () => {
    const w = mountCal({ prevLabel: 'Zurück', nextLabel: 'Weiter' })
    expect(w.find('[data-slot="calendar-prev"]').attributes('aria-label')).toBe('Zurück')
    expect(w.find('[data-slot="calendar-next"]').attributes('aria-label')).toBe('Weiter')
  })

  it('rapid next clicks land on the right month', async () => {
    const w = mountCal()
    for (let i = 0; i < 25; i++) await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(heading(w)).toEqual(['March 2026'])
  })

  it('month prop controls the visible month and follows changes without echoing', async () => {
    const w = mountCal({ month: d(2025, 6, 20) })
    expect(heading(w)).toEqual(['June 2025'])
    expect(days(w).filter((b) => b.attributes('tabindex') === '0')).toHaveLength(1)
    await w.setProps({ month: d(2023, 1, 5) })
    expect(heading(w)).toEqual(['January 2023'])
    expect(w.emitted('update:month')).toBeUndefined()
    expect(days(w).filter((b) => b.attributes('tabindex') === '0')).toHaveLength(1)
  })

  it('invalid month prop is ignored', async () => {
    const w = mountCal({ month: new Date('x') })
    expect(heading(w)).toEqual(['February 2024'])
    await w.setProps({ month: new Date('y') })
    expect(heading(w)).toEqual(['February 2024'])
  })

  it('month prop with two months pulls focus into the new window', async () => {
    const w = mountCal({ numberOfMonths: 2 })
    await w.setProps({ month: d(2024, 8, 1) })
    expect(heading(w)).toEqual(['August 2024', 'September 2024'])
    expect(days(w).filter((b) => b.attributes('tabindex') === '0')).toHaveLength(1)
    await w.setProps({ month: d(2024, 1, 1) })
    expect(days(w).filter((b) => b.attributes('tabindex') === '0')).toHaveLength(1)
  })

  it('switching numberOfMonths keeps the focused day visible', async () => {
    const w = mountCal({ modelValue: d(2024, 3, 10) })
    await w.setProps({ numberOfMonths: 2 })
    expect(days(w).filter((b) => b.attributes('tabindex') === '0')).toHaveLength(1)
  })
})

describe('Calendar: keyboard navigation', () => {
  async function press(w: VueWrapper, from: string, key: string, extra: Props = {}) {
    await day(w, from).trigger('keydown', { key, ...extra })
    await flushPromises()
  }

  it.each([
    ['ArrowRight', '2024-02-16'],
    ['ArrowLeft', '2024-02-14'],
    ['ArrowDown', '2024-02-22'],
    ['ArrowUp', '2024-02-08'],
    ['Home', '2024-02-11'],
    ['End', '2024-02-17'],
    ['PageDown', '2024-03-15'],
    ['PageUp', '2024-01-15'],
  ])('%s moves focus to %s', async (key, expected) => {
    const w = mountCal()
    await press(w, '2024-02-15', key)
    expect(focusedIso()).toBe(expected)
    expect(day(w, expected).attributes('tabindex')).toBe('0')
    expect(days(w).filter((b) => b.attributes('tabindex') === '0')).toHaveLength(1)
  })

  it('Home/End honour weekStart', async () => {
    const w = mountCal({ weekStart: 1 })
    await press(w, '2024-02-15', 'Home')
    expect(focusedIso()).toBe('2024-02-12')
    await press(w, '2024-02-12', 'End')
    expect(focusedIso()).toBe('2024-02-18')
  })

  it('Shift+PageUp/PageDown jump a year; Feb 29 maps to Feb 28', async () => {
    const w = mountCal({ modelValue: d(2024, 2, 29) })
    await press(w, '2024-02-29', 'PageDown', { shiftKey: true })
    expect(focusedIso()).toBe('2025-02-28')
    await press(w, '2025-02-28', 'PageUp', { shiftKey: true })
    expect(focusedIso()).toBe('2024-02-28')
  })

  it('arrows cross month and year boundaries and scroll the view', async () => {
    const w = mountCal({ modelValue: d(2024, 12, 31) })
    await press(w, '2024-12-31', 'ArrowRight')
    expect(heading(w)).toEqual(['January 2025'])
    expect(focusedIso()).toBe('2025-01-01')
    await press(w, '2025-01-01', 'ArrowLeft')
    expect(heading(w)).toEqual(['December 2024'])
    expect(focusedIso()).toBe('2024-12-31')
    expect(iso(lastEmit(w, 'update:month'))).toBe('2024-12-01')
  })

  it('PageDown from Jan 31 lands on the last day of February (leap)', async () => {
    const w = mountCal({ modelValue: d(2024, 1, 31) })
    await press(w, '2024-01-31', 'PageDown')
    expect(focusedIso()).toBe('2024-02-29')
  })

  it('two-month view: moving past the last month shifts by one, before the first month too', async () => {
    const w = mountCal({ numberOfMonths: 2, modelValue: d(2024, 3, 31) })
    await press(w, '2024-03-31', 'ArrowRight')
    expect(heading(w)).toEqual(['March 2024', 'April 2024'])
    expect(focusedIso()).toBe('2024-04-01')
    const w2 = mountCal({ numberOfMonths: 2, modelValue: d(2024, 2, 1) })
    await press(w2, '2024-02-01', 'ArrowLeft')
    expect(heading(w2)).toEqual(['January 2024', 'February 2024'])
    expect(focusedIso()).toBe('2024-01-31')
  })

  it('clamps at min and max instead of leaving the allowed range', async () => {
    const w = mountCal({ min: d(2024, 2, 10), max: d(2024, 2, 20), modelValue: d(2024, 2, 10) })
    await press(w, '2024-02-10', 'ArrowLeft')
    expect(focusedIso()).toBe('2024-02-10')
    await press(w, '2024-02-10', 'PageUp')
    expect(focusedIso()).toBe('2024-02-10')
    await press(w, '2024-02-10', 'PageDown')
    expect(focusedIso()).toBe('2024-02-20')
  })

  it('can focus (but not select) disabled days', async () => {
    const w = mountCal({ isDateDisabled: (x: Date) => x.getDate() === 16 })
    await press(w, '2024-02-15', 'ArrowRight')
    expect(focusedIso()).toBe('2024-02-16')
    await day(w, '2024-02-16').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('prevents default for handled keys only', async () => {
    const w = mountCal()
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    day(w, '2024-02-15').element.dispatchEvent(handled)
    expect(handled.defaultPrevented).toBe(true)
    for (const key of ['Enter', ' ', 'a', 'Tab']) {
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      day(w, '2024-02-15').element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    }
  })

  it('does not move on keys when disabled', async () => {
    const w = mountCal({ disabled: true })
    await press(w, '2024-02-15', 'ArrowRight')
    expect(day(w, '2024-02-15').attributes('tabindex')).toBe('0')
  })

  it('focusing a day with the mouse/tab moves the roving tab stop', async () => {
    const w = mountCal()
    await day(w, '2024-02-20').trigger('focus')
    expect(day(w, '2024-02-20').attributes('tabindex')).toBe('0')
    expect(day(w, '2024-02-15').attributes('tabindex')).toBe('-1')
  })

  it('exposed focus() focuses the roving day', async () => {
    const w = mountCal({ modelValue: d(2024, 2, 7) })
    await (w.vm as unknown as { focus: () => Promise<void> }).focus()
    expect(focusedIso()).toBe('2024-02-07')
  })

  it('hover state is cleared when keyboard navigation resumes', async () => {
    const w = mountCal({ mode: 'range' })
    await day(w, '2024-02-10').trigger('click')
    await day(w, '2024-02-20').trigger('mouseenter')
    expect(day(w, '2024-02-20').attributes('data-range-end')).toBe('true')
    await press(w, '2024-02-10', 'ArrowRight')
    expect(day(w, '2024-02-20').attributes('data-range-end')).toBeUndefined()
    expect(day(w, '2024-02-11').attributes('data-range-end')).toBe('true')
  })

  it('ignores a move that produces an invalid date (far future)', async () => {
    const far = new Date(8.64e15) // max Date
    const w = mountCal({ modelValue: far })
    await press(w, formatISODate(far), 'PageDown', { shiftKey: true })
    expect(focusedIso()).not.toBe('')
    expect(w.findAll('[role="grid"]')).toHaveLength(1)
  })
})

describe('Calendar: disabled and readonly', () => {
  it('disabled: every day aria-disabled, nav buttons disabled, clicks ignored', async () => {
    const w = mountCal({ disabled: true })
    expect(w.attributes('data-disabled')).toBe('true')
    expect(w.find('[role="grid"]').attributes('aria-disabled')).toBe('true')
    expect(days(w).every((b) => b.attributes('aria-disabled') === 'true')).toBe(true)
    expect(w.find('[data-slot="calendar-prev"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-slot="calendar-next"]').attributes('disabled')).toBeDefined()
    await day(w, '2024-02-10').trigger('click')
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(heading(w)).toEqual(['February 2024'])
  })

  it('readonly: days stay enabled and emit select, but never change the model; nav still works', async () => {
    const w = mountCal({ readonly: true, modelValue: d(2024, 2, 5) })
    expect(w.find('[role="grid"]').attributes('aria-readonly')).toBe('true')
    await day(w, '2024-02-10').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('select')).toHaveLength(1)
    expect(day(w, '2024-02-05').attributes('data-selected')).toBe('true')
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(heading(w)).toEqual(['March 2024'])
  })

  it('readonly range never sets an anchor', async () => {
    const w = mountCal({ readonly: true, mode: 'range' })
    await day(w, '2024-02-10').trigger('click')
    expect(w.find('[data-selected]').exists()).toBe(false)
  })
})

describe('Calendar: customisation', () => {
  it('merges class last (tailwind-merge wins) and forwards attrs', () => {
    const w = mountCal({ class: 'p-8 bg-primary custom' }, { id: 'cal', 'aria-label': 'Departure', 'data-testid': 'x' })
    expect(w.classes()).toEqual(expect.arrayContaining(['custom', 'p-8', 'bg-primary']))
    expect(w.classes()).not.toContain('p-3')
    expect(w.classes()).not.toContain('bg-card')
    expect(w.attributes('id')).toBe('cal')
    expect(w.attributes('aria-label')).toBe('Departure')
    expect(w.attributes('data-testid')).toBe('x')
  })

  it('variant and size set classes and data attributes', () => {
    const ghost = mountCal({ variant: 'ghost', size: 'lg' })
    expect(ghost.attributes('data-variant')).toBe('ghost')
    expect(ghost.attributes('data-size')).toBe('lg')
    expect(ghost.classes()).toContain('p-0')
    expect(ghost.classes().join(' ')).toContain('--calendar-cell:calc(var(--spacing)*11)')
    const sm = mountCal({ size: 'sm' })
    expect(sm.classes().join(' ')).toContain('calc(var(--spacing)*7)')
    expect(mountCal().classes()).toContain('border')
  })

  it('invalid variant/size fall back to the defaults', () => {
    const w = mountCal({ variant: 'nope', size: 'huge' })
    expect(w.classes()).toContain('border')
    expect(w.classes().join(' ')).toContain('calc(var(--spacing)*9)')
  })

  it('every part carries a data-slot', () => {
    const w = mountCal()
    for (const slot of ['calendar-months', 'calendar-month', 'calendar-header', 'calendar-prev', 'calendar-next', 'calendar-heading', 'calendar-grid', 'calendar-weekday', 'calendar-cell', 'calendar-day']) {
      expect(w.find(`[data-slot="${slot}"]`).exists(), slot).toBe(true)
    }
  })

  it('calendarVariants is usable standalone and the barrel exports unique names', () => {
    expect(calendarVariants({ variant: 'ghost', size: 'sm', class: 'x' })).toContain('x')
    expect(Object.keys(barrel).sort()).toEqual(['Calendar', 'calendarFormatISODate', 'calendarIsSameDay', 'calendarMonthsVariants', 'calendarNormalizeRange', 'calendarVariants'])
    expect(barrel.calendarIsSameDay(d(2024, 1, 1), new Date(2024, 0, 1, 5))).toBe(true)
    expect(barrel.calendarFormatISODate(d(2024, 1, 1))).toBe('2024-01-01')
    expect(barrel.calendarNormalizeRange(d(2024, 1, 2), d(2024, 1, 1))!.start.getDate()).toBe(1)
  })
})

describe('Calendar: v-model in a parent, lifecycle', () => {
  it('works with v-model on a parent ref (no jump after multi-select echo)', async () => {
    const model = ref<Date[]>([d(2024, 1, 5)])
    const Parent = defineComponent({
      setup: () => () => h(Calendar, { mode: 'multiple', locale: 'en-US', weekStart: 0, modelValue: model.value, 'onUpdate:modelValue': (v: unknown) => (model.value = v as Date[]) }),
    })
    const w = mount(Parent, { attachTo: document.body })
    wrappers.push(w as unknown as VueWrapper)
    expect(heading(w as unknown as VueWrapper)).toEqual(['January 2024'])
    await w.find('[data-slot="calendar-next"]').trigger('click')
    await day(w as unknown as VueWrapper, '2024-02-10').trigger('click')
    expect(model.value.map(iso)).toEqual(['2024-01-05', '2024-02-10'])
    expect(heading(w as unknown as VueWrapper)).toEqual(['February 2024']) // did not jump back to the first selected day
  })

  it('range v-model round trip through a parent', async () => {
    const model = ref<unknown>(null)
    const Parent = defineComponent({
      setup: () => () => h(Calendar, { mode: 'range', locale: 'en-US', weekStart: 0, modelValue: model.value as never, 'onUpdate:modelValue': (v: unknown) => (model.value = v) }),
    })
    const w = mount(Parent, { attachTo: document.body }) as unknown as VueWrapper
    wrappers.push(w)
    await day(w, '2024-02-03').trigger('click')
    await day(w, '2024-02-07').trigger('click')
    expect(w.findAll('[data-in-range]')).toHaveLength(3)
    expect(model.value).toMatchObject({ start: expect.any(Date), end: expect.any(Date) })
  })

  it('unmounting is clean (no errors, DOM removed)', () => {
    const w = mountCal({ mode: 'range' })
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(document.querySelector('[data-slot="calendar"]')).toBeNull()
    expect(err).not.toHaveBeenCalled()
    err.mockRestore()
  })
})

describe('Calendar: DST-ish and leap behaviour', () => {
  const originalTZ = process.env.TZ
  afterEach(() => {
    if (originalTZ === undefined) delete process.env.TZ
    else process.env.TZ = originalTZ
  })

  it('renders every day of March 2024 exactly once in a DST zone (spring forward 10 March)', () => {
    process.env.TZ = 'America/New_York'
    const w = mountCal({ month: d(2024, 3, 1), modelValue: d(2024, 3, 10) })
    expect(days(w).map((b) => b.text())).toEqual(Array.from({ length: 31 }, (_, i) => String(i + 1)))
    expect(day(w, '2024-03-10').attributes('data-selected')).toBe('true')
  })

  it('range spanning fall-back (3 Nov 2024) includes the 25-hour day', async () => {
    process.env.TZ = 'America/New_York'
    const w = mountCal({ mode: 'range', month: d(2024, 11, 1) })
    await day(w, '2024-11-02').trigger('click')
    await day(w, '2024-11-04').trigger('click')
    expect(day(w, '2024-11-03').attributes('data-in-range')).toBe('true')
  })

  it('non-leap February has 28 days', () => {
    const w = mountCal({ month: d(2023, 2, 1) })
    expect(days(w)).toHaveLength(28)
    expect(day(w, '2023-02-29').exists()).toBe(false)
  })

  it('century non-leap year (1900) and leap century (2000)', () => {
    expect(days(mountCal({ month: d(1900, 2, 1) }))).toHaveLength(28)
    expect(days(mountCal({ month: d(2000, 2, 1) }))).toHaveLength(29)
  })
})

describe('Calendar: accessibility regressions', () => {
  it('without a visible heading the grid falls back to aria-label', () => {
    const grid = mountCal({ showHeading: false }).find('[role="grid"]')
    expect(grid.attributes('aria-label')).toBe('February 2024')
    expect(grid.attributes('aria-labelledby')).toBeUndefined()
  })

  it('the month heading is not a live region; one persistent status region announces month changes', async () => {
    const w = mountCal()
    expect(w.find('[data-slot="calendar-heading"]').attributes('aria-live')).toBeUndefined()
    const status = w.find('[data-slot="calendar-status"]')
    expect(status.attributes('role')).toBe('status')
    expect(status.classes()).toContain('sr-only')
    expect(status.text()).toBe('') // nothing announced on mount
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(w.find('[data-slot="calendar-status"]').element).toBe(status.element) // same node, not re-created
    expect(status.text()).toBe('March 2024')
    await w.find('[data-slot="calendar-prev"]').trigger('click')
    await w.find('[data-slot="calendar-prev"]').trigger('click')
    expect(status.text()).toBe('January 2024')
  })

  it('announces both months in a two-month view and keyboard month changes', async () => {
    const w = mountCal({ numberOfMonths: 2 })
    await day(w, '2024-02-15').trigger('keydown', { key: 'PageDown' })
    await day(w, '2024-03-15').trigger('keydown', { key: 'PageDown' })
    expect(w.find('[data-slot="calendar-status"]').text()).toBe('March 2024, April 2024')
  })

  it('announces the range start and prompts for the end date', async () => {
    const w = mountCal({ mode: 'range' })
    await day(w, '2024-02-10').trigger('click')
    expect(w.find('[data-slot="calendar-status"]').text()).toBe('Range start Saturday, February 10, 2024. Choose the end date.')
  })

  it('rangeStartMessage is translatable', async () => {
    const w = mountCal({ mode: 'range', rangeStartMessage: 'Anfang {date}' })
    await day(w, '2024-02-10').trigger('click')
    expect(w.find('[data-slot="calendar-status"]').text()).toBe('Anfang Saturday, February 10, 2024')
  })

  it('single and multiple mode do not announce a range prompt', async () => {
    const w = mountCal()
    await day(w, '2024-02-10').trigger('click')
    expect(w.find('[data-slot="calendar-status"]').text()).toBe('')
  })

  describe('right-to-left', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'))

    it('ArrowLeft moves to the next day and ArrowRight to the previous one', async () => {
      document.documentElement.setAttribute('dir', 'rtl')
      const w = mountCal({ modelValue: d(2024, 2, 14) })
      await day(w, '2024-02-14').trigger('keydown', { key: 'ArrowLeft' })
      await flushPromises()
      expect(focusedIso()).toBe('2024-02-15')
      await day(w, '2024-02-15').trigger('keydown', { key: 'ArrowRight' })
      await day(w, '2024-02-14').trigger('keydown', { key: 'ArrowRight' })
      await flushPromises()
      expect(focusedIso()).toBe('2024-02-13')
    })

    it('left-to-right pages are unchanged', async () => {
      const w = mountCal({ modelValue: d(2024, 2, 14) })
      await day(w, '2024-02-14').trigger('keydown', { key: 'ArrowLeft' })
      await flushPromises()
      expect(focusedIso()).toBe('2024-02-13')
    })

    it('chevrons mirror and range ends round on the logical sides', () => {
      const w = mountCal({ mode: 'range', modelValue: { start: d(2024, 2, 10), end: d(2024, 2, 12) } })
      expect(w.find('[data-slot="calendar-prev"] svg').classes()).toContain('rtl:rotate-180')
      expect(w.find('[data-slot="calendar-next"] svg').classes()).toContain('rtl:rotate-180')
      const cls = day(w, '2024-02-10').classes().join(' ')
      expect(cls).toContain('data-[range-start]:rounded-e-none')
      expect(cls).toContain('data-[range-end]:rounded-s-none')
      expect(cls).not.toMatch(/rounded-[lr]-none/)
    })
  })

  it('selected and in-range days have a forced-colors border fallback; weekday labels use the type scale', () => {
    const w = mountCal()
    const cls = day(w, '2024-02-10').classes().join(' ')
    expect(cls).toContain('forced-colors:data-[selected]:border-2')
    expect(cls).toContain('forced-colors:data-[in-range]:border-y')
    expect(cls).toContain('tabular-nums')
    expect(w.find('[role="columnheader"]').classes()).toContain('text-xs')
    expect(w.html()).not.toMatch(/-\[\d/)
  })

  it('size lg shrinks below the sm breakpoint so one month fits a 320px viewport', () => {
    const cls = calendarVariants({ size: 'lg' })
    expect(cls).toContain('[--calendar-cell:calc(var(--spacing)*9)]')
    expect(cls).toContain('sm:[--calendar-cell:calc(var(--spacing)*11)]')
  })
})
