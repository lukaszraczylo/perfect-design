import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import Calendar from './Calendar.vue'
import { calendarMonthsVariants, calendarVariants } from './variants'
import { createDate, isoWeekNumber } from './dateMath'

type Props = Record<string, unknown>
let wrappers: VueWrapper[] = []
function mountCal(props: Props = {}) {
  const w = mount(Calendar, { props: { weekStart: 0, locale: 'en-US', ...props }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const dayBtn = (w: VueWrapper, iso: string) => w.find(`[data-slot="calendar-day"][data-date="${iso}"]`)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2024, 1, 15, 10, 30)) // Thu 15 Feb 2024
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Calendar variations: defaults', () => {
  it('keeps the default class string of the root, the months wrapper and the days', () => {
    expect(calendarVariants()).toBe('inline-block select-none rounded-md border bg-card p-3 text-card-foreground shadow-xs text-sm [--calendar-cell:calc(var(--spacing)*9)]')
    expect(calendarMonthsVariants()).toBe('flex flex-wrap gap-x-4 gap-y-2')
    const w = mountCal()
    expect(w.attributes('class')).toBe(calendarVariants())
    expect(w.find('[data-slot="calendar-months"]').classes()).toEqual(['flex', 'flex-wrap', 'gap-x-4', 'gap-y-2'])
    const day = dayBtn(w, '2024-02-10')
    expect(day.classes()).toContain('rounded-md')
    expect(day.classes()).not.toContain('rounded-full')
    expect(w.attributes('data-shape')).toBe('rounded')
    expect(w.find('[data-slot="calendar-week-number"]').exists()).toBe(false)
    expect(w.find('[data-slot="calendar-week-header"]').exists()).toBe(false)
  })
})

describe('Calendar variations: size and variant', () => {
  it('size xs uses a 24px cell (--spacing * 6) and 12px text', () => {
    const w = mountCal({ size: 'xs' })
    expect(w.attributes('data-size')).toBe('xs')
    expect(w.classes()).toContain('text-xs')
    expect(w.classes().join(' ')).toContain('[--calendar-cell:calc(var(--spacing)*6)]')
  })
  it('variant outline draws a border without the card surface', () => {
    const w = mountCal({ variant: 'outline' })
    expect(w.attributes('data-variant')).toBe('outline')
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'bg-transparent', 'p-3']))
    expect(w.classes()).not.toContain('bg-card')
    expect(w.classes()).not.toContain('shadow-xs')
  })
  it('unknown size and variant fall back to the defaults', () => {
    const w = mountCal({ size: 'huge', variant: 'neon' })
    expect(w.classes()).toContain('bg-card')
    expect(w.classes()).toContain('text-sm')
  })
  it('class wins over variant classes', () => {
    const w = mountCal({ variant: 'outline', class: 'bg-muted p-6' })
    expect(w.classes()).toContain('bg-muted')
    expect(w.classes()).toContain('p-6')
    expect(w.classes()).not.toContain('bg-transparent')
    expect(w.classes()).not.toContain('p-3')
  })
})

describe('Calendar variations: shape', () => {
  it.each([
    ['pill', 'rounded-full'],
    ['square', 'rounded-none'],
  ])('shape %s changes the day buttons to %s', (shape, cls) => {
    const w = mountCal({ shape })
    const day = dayBtn(w, '2024-02-10')
    expect(w.attributes('data-shape')).toBe(shape)
    expect(day.classes()).toContain(cls)
    expect(day.classes()).not.toContain('rounded-md')
  })
  it('keeps the flat inner edge of range ends in every shape', () => {
    const w = mountCal({ shape: 'pill', mode: 'range', modelValue: { start: createDate(2024, 1, 5), end: createDate(2024, 1, 9) } })
    const start = dayBtn(w, '2024-02-05')
    expect(start.attributes('data-range-start')).toBeDefined()
    expect(start.classes()).toContain('rounded-full')
    expect(start.classes()).toContain('data-[range-start]:rounded-e-none')
  })
  it('unknown shape falls back to rounded', () => {
    const day = dayBtn(mountCal({ shape: 'blob' }), '2024-02-10')
    expect(day.classes()).toContain('rounded-md')
  })
})

describe('Calendar variations: months and orientation', () => {
  it('numberOfMonths 3 renders three grids, one prev on the first and one next on the last', () => {
    const w = mountCal({ numberOfMonths: 3 })
    expect(w.findAll('[role="grid"]')).toHaveLength(3)
    expect(w.findAll('[data-slot="calendar-heading"]').map((h) => h.text())).toEqual(['February 2024', 'March 2024', 'April 2024'])
    expect(w.findAll('[data-slot="calendar-prev"]')).toHaveLength(1)
    expect(w.findAll('[data-slot="calendar-next"]')).toHaveLength(1)
    const grids = w.findAll('[data-slot="calendar-month"]')
    expect(grids[0].find('[data-slot="calendar-prev"]').exists()).toBe(true)
    expect(grids[2].find('[data-slot="calendar-next"]').exists()).toBe(true)
  })
  it('navigating moves the whole three-month window', async () => {
    const w = mountCal({ numberOfMonths: 3 })
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(w.findAll('[data-slot="calendar-heading"]').map((h) => h.text())).toEqual(['March 2024', 'April 2024', 'May 2024'])
    expect(w.emitted('update:month')?.at(-1)?.[0]).toEqual(createDate(2024, 2, 1))
  })
  it('numberOfMonths above 3 or below 1 renders one month', () => {
    expect(mountCal({ numberOfMonths: 4 }).findAll('[role="grid"]')).toHaveLength(1)
    expect(mountCal({ numberOfMonths: 0 }).findAll('[role="grid"]')).toHaveLength(1)
  })
  it('orientation vertical stacks the months', () => {
    const w = mountCal({ numberOfMonths: 2, orientation: 'vertical' })
    const months = w.find('[data-slot="calendar-months"]')
    expect(months.attributes('data-orientation')).toBe('vertical')
    expect(months.classes()).toEqual(expect.arrayContaining(['flex-col', 'gap-y-4']))
    expect(months.classes()).not.toContain('flex-wrap')
  })
  it('unknown orientation falls back to horizontal', () => {
    expect(mountCal({ orientation: 'diagonal' }).find('[data-slot="calendar-months"]').classes()).toContain('flex-wrap')
  })
  it('selection works across three months in range mode', async () => {
    const w = mountCal({ numberOfMonths: 3, mode: 'range' })
    await dayBtn(w, '2024-02-20').trigger('click')
    await dayBtn(w, '2024-04-02').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)?.[0]).toEqual({ start: createDate(2024, 1, 20), end: createDate(2024, 3, 2) })
  })
})

describe('Calendar variations: week numbers', () => {
  it('adds a labelled column header and an ISO week number per row', () => {
    const w = mountCal({ weekNumbers: true })
    const header = w.find('[data-slot="calendar-week-header"]')
    expect(header.text()).toBe('Wk')
    expect(header.attributes('aria-label')).toBe('Week')
    expect(header.attributes('role')).toBe('columnheader')
    const cells = w.findAll('[data-slot="calendar-week-number"]')
    expect(cells.map((c) => c.text())).toEqual(['5', '6', '7', '8', '9'])
    expect(cells[0].attributes('aria-label')).toBe('Week 5')
    expect(cells[0].attributes('role')).toBe('rowheader')
    expect(cells[0].attributes('scope')).toBe('row')
  })
  it('week numbers are not focusable and do not add day buttons', () => {
    const w = mountCal({ weekNumbers: true })
    expect(w.findAll('[data-slot="calendar-week-number"] button')).toHaveLength(0)
    expect(w.findAll('[data-slot="calendar-day"]')).toHaveLength(29)
    expect(w.findAll('[data-slot="calendar-day"][tabindex="0"]')).toHaveLength(1)
  })
  it('uses weekLabel and weekShort for translation', () => {
    const w = mountCal({ weekNumbers: true, weekLabel: 'Woche', weekShort: 'KW' })
    expect(w.find('[data-slot="calendar-week-header"]').text()).toBe('KW')
    expect(w.find('[data-slot="calendar-week-number"]').attributes('aria-label')).toBe('Woche 5')
  })
  it('is numbered the same with a Monday week start', () => {
    const w = mountCal({ weekNumbers: true, weekStart: 1 })
    expect(w.findAll('[data-slot="calendar-week-number"]').map((c) => c.text())).toEqual(['5', '6', '7', '8', '9'])
  })
  it('uses the locale numerals', () => {
    const w = mountCal({ weekNumbers: true, locale: 'ar-EG' })
    expect(w.find('[data-slot="calendar-week-number"]').text()).toBe('٥')
  })
  it('renders one column per month with three months', () => {
    const w = mountCal({ weekNumbers: true, numberOfMonths: 3 })
    expect(w.findAll('[data-slot="calendar-week-header"]')).toHaveLength(3)
  })
  it('weekNumbers must be exactly true', () => {
    expect(mountCal({ weekNumbers: 'yes' }).find('[data-slot="calendar-week-number"]').exists()).toBe(false)
  })
})

describe('isoWeekNumber', () => {
  it.each([
    [createDate(2021, 0, 3), 53],
    [createDate(2021, 0, 4), 1],
    [createDate(2024, 11, 30), 1],
    [createDate(2026, 0, 1), 1],
    [createDate(2024, 1, 29), 9],
    [createDate(2020, 11, 31), 53],
  ])('%s is week %i', (date, week) => expect(isoWeekNumber(date)).toBe(week))
})

describe('Calendar variations: combinations', () => {
  it('pill + xs + outline + week numbers + two stacked months do not conflict', () => {
    const w = mountCal({ shape: 'pill', size: 'xs', variant: 'outline', weekNumbers: true, numberOfMonths: 2, orientation: 'vertical' })
    expect(w.classes()).toEqual(expect.arrayContaining(['text-xs', 'border', 'bg-transparent']))
    expect(dayBtn(w, '2024-02-10').classes()).toContain('rounded-full')
    expect(w.findAll('[role="grid"]')).toHaveLength(2)
    expect(w.findAll('[data-slot="calendar-week-number"]').length).toBeGreaterThan(8)
  })
  it('keyboard navigation still crosses months with week numbers on', async () => {
    const w = mountCal({ weekNumbers: true, modelValue: createDate(2024, 1, 29), mode: 'single' })
    const day = dayBtn(w, '2024-02-29')
    await day.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('[data-slot="calendar-heading"]').text()).toBe('March 2024')
  })
  it('the grid keeps its a11y wiring', () => {
    const w = mountCal({ weekNumbers: true })
    const grid = w.find('[role="grid"]')
    expect(grid.attributes('aria-labelledby')).toBeTruthy()
    expect(w.find('[data-slot="calendar-status"]').attributes('role')).toBe('status')
  })
})
