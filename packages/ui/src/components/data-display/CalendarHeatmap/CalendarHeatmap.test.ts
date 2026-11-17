import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import CalendarHeatmap from './CalendarHeatmap.vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(CalendarHeatmap, { props: props as never, attrs })
const data = [
  { date: '2025-03-03', value: 2 },
  { date: '2025-03-05', value: 6 },
  { date: '2025-03-12', value: 0 },
  { date: '2025-03-18', value: 10 },
]
const base = { label: 'Sample', data, start: '2025-03-03', end: '2025-03-23' }
const slot = (w: ReturnType<typeof m>, s: string) => w.findAll(`[data-slot="${s}"]`)
const day = (w: ReturnType<typeof m>, date: string) => w.find(`[data-date="${date}"]`)
const num = (el: { attributes: (k: string) => string | undefined }, k: string) => Number(el.attributes(k))
const fillOf = (el: { classes: () => string[] }) => el.classes().find((c) => c.startsWith('fill-'))

function expectClean(w: ReturnType<typeof m>) {
  const bad: string[] = []
  const root = w.element as unknown as Element
  const els: Element[] = [root, ...Array.from(root.querySelectorAll('*'))]
  for (const el of els) {
    for (const a of Array.from(el.attributes)) if (/NaN|Infinity|undefined/.test(a.value)) bad.push(`${el.tagName} ${a.name}=${a.value}`)
  }
  expect(bad).toEqual([])
  expect(w.text()).not.toMatch(/NaN|Infinity|undefined/)
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('CalendarHeatmap: good path', () => {
  it('renders a root, a named focusable region and an image SVG', () => {
    const w = m(base)
    expect(w.attributes('data-slot')).toBe('calendar-heatmap')
    const scroll = w.find('[data-slot="calendar-heatmap-scroll"]')
    expect(scroll.attributes('role')).toBe('region')
    expect(scroll.attributes('tabindex')).toBe('0')
    expect(scroll.attributes('aria-label')).toBe('Sample')
    expect(scroll.classes()).toContain('overflow-x-auto')
    const svg = w.find('[data-slot="calendar-heatmap-svg"]')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample')
    expect(svg.find('[tabindex]').exists()).toBe(false)
  })
  it('names the chart by label, title, aria-label or a summary of the range', () => {
    expect(m({ ...base, label: undefined, title: 'Deploys' }).find('svg').attributes('aria-label')).toBe('Deploys')
    expect(m({ ...base, label: undefined }, { 'aria-label': 'Own name' }).find('svg').attributes('aria-label')).toBe('Own name')
    expect(m({ ...base, label: undefined }, { 'aria-labelledby': 'heading' }).find('svg').attributes('aria-labelledby')).toBe('heading')
    expect(m({ ...base, label: undefined }).find('svg').attributes('aria-label')).toBe('Calendar heatmap: 21 days from 2025-03-03 to 2025-03-23, 18 in total on 3 active days')
    const one = m({ label: undefined, data: [{ date: '2025-03-03', value: 1 }] })
    expect(one.find('svg').attributes('aria-label')).toBe('Calendar heatmap: 1 day from 2025-03-03 to 2025-03-03, 1 in total on 1 active day')
  })
  it('renders one cell per day with its date, a tooltip and a position', () => {
    const w = m(base)
    const cells = slot(w, 'calendar-heatmap-day')
    expect(cells).toHaveLength(21)
    expect(cells[0]!.attributes('data-date')).toBe('2025-03-03')
    expect(cells[20]!.attributes('data-date')).toBe('2025-03-23')
    expect(day(w, '2025-03-05').find('title').text()).toBe('Wed 5 Mar 2025: 6')
    expect(day(w, '2025-03-04').find('title').text()).toBe('Tue 4 Mar 2025: no data')
    expect(day(w, '2025-03-12').find('title').text()).toBe('Wed 12 Mar 2025: 0')
    expect(day(w, '2025-03-03').element.tagName).toBe('rect')
  })
  it('lays out weeks as columns and weekdays as rows (week starts on Sunday by default)', () => {
    const w = m(base)
    const x = (date: string) => num(day(w, date), 'x')
    const y = (date: string) => num(day(w, date), 'y')
    expect(x('2025-03-03')).toBe(x('2025-03-04')) // same week
    expect(y('2025-03-04')).toBe(y('2025-03-03') + 14) // next weekday, one step lower
    expect(x('2025-03-09')).toBe(x('2025-03-03') + 14) // Sunday starts the next column
    expect(y('2025-03-09')).toBe(y('2025-03-16')) // all Sundays share row 0
    expect(y('2025-03-09')).toBe(18)
  })
  it('weekStart mon moves Monday to the first row', () => {
    const w = m({ ...base, weekStart: 'mon' })
    expect(num(day(w, '2025-03-03'), 'y')).toBe(18)
    expect(num(day(w, '2025-03-09'), 'y')).toBe(18 + 6 * 14)
    expect(w.attributes('data-week-start')).toBe('mon')
  })
  it('distinguishes no data, a quiet day and levels, by fill and by text', () => {
    const w = m(base)
    expect(day(w, '2025-03-04').classes()).toEqual(expect.arrayContaining(['fill-transparent', 'stroke-border']))
    expect(day(w, '2025-03-12').classes()).toContain('fill-muted')
    expect(fillOf(day(w, '2025-03-03'))).toBe('fill-chart-1/20')
    expect(fillOf(day(w, '2025-03-05'))).toBe('fill-chart-1/55')
    expect(fillOf(day(w, '2025-03-18'))).toBe('fill-chart-1')
    // never colour alone: every cell has a text tooltip and the table lists the totals
    expect(slot(w, 'calendar-heatmap-day').every((c) => c.find('title').text().length > 10)).toBe(true)
  })
  it('sums duplicate days', () => {
    const w = m({ ...base, data: [{ date: '2025-03-05', value: 2 }, { date: '2025-03-05', value: 3 }, { date: '2025-03-05T10:00:00Z', value: 1 }] })
    expect(day(w, '2025-03-05').find('title').text()).toBe('Wed 5 Mar 2025: 6')
  })
  it('accepts Date objects', () => {
    const w = m({ label: 'Sample', data: [{ date: new Date(Date.UTC(2025, 2, 5)), value: 4 }] })
    expect(day(w, '2025-03-05').find('title').text()).toBe('Wed 5 Mar 2025: 4')
  })
  it('defaults the range to the span of the data', () => {
    const w = m({ label: 'Sample', data })
    const cells = slot(w, 'calendar-heatmap-day')
    expect(cells[0]!.attributes('data-date')).toBe('2025-03-03')
    expect(cells[cells.length - 1]!.attributes('data-date')).toBe('2025-03-18')
  })
  it('shows empty days for a range without data', () => {
    const w = m({ label: 'Sample', data: [], start: '2025-03-03', end: '2025-03-09' })
    const cells = slot(w, 'calendar-heatmap-day')
    expect(cells).toHaveLength(7)
    expect(cells.every((c) => c.classes().includes('fill-transparent'))).toBe(true)
    expect(w.find('[data-slot="calendar-heatmap-empty"]').exists()).toBe(false)
  })
  it('draws month labels with the year at the start and January', () => {
    const w = m({ label: 'Sample', data: [], start: '2024-11-20', end: '2025-02-10', weekStart: 'mon' })
    // 'Jan 2025' would run into 'Feb', so January goes without its year here
    expect(slot(w, 'calendar-heatmap-month').map((t) => t.text())).toEqual(['Dec 2024', 'Jan', 'Feb'])
  })
  it('keeps the first month when it is complete and the next one is far enough away', () => {
    const w = m({ label: 'Sample', data: [], start: '2025-03-01', end: '2025-05-31' })
    expect(slot(w, 'calendar-heatmap-month').map((t) => t.text())).toEqual(['Mar 2025', 'Apr', 'May'])
  })
  it('drops a later label that would overlap, and gives a cut-off first month a year when replacing it', () => {
    const w = m({ label: 'Sample', data: [], start: '2025-02-20', end: '2025-04-10' })
    const labels = slot(w, 'calendar-heatmap-month').map((t) => t.text())
    expect(labels[0]).toBe('Mar 2025')
    expect(labels).toContain('Apr')
    const x = slot(w, 'calendar-heatmap-month').map((t) => num(t, 'x'))
    expect(x).toEqual([...x].sort((a, b) => a - b))
  })
  it('draws Mon, Wed and Fri beside the rows of each week start', () => {
    const sun = m(base)
    expect(slot(sun, 'calendar-heatmap-weekday').map((t) => [t.text(), num(t, 'y')])).toEqual([['Mon', 38], ['Wed', 66], ['Fri', 94]])
    const mon = m({ ...base, weekStart: 'mon' })
    expect(slot(mon, 'calendar-heatmap-weekday').map((t) => [t.text(), num(t, 'y')])).toEqual([['Mon', 24], ['Wed', 52], ['Fri', 80]])
  })
  it('draws the legend with the quiet cell and every level', () => {
    const w = m(base)
    expect(slot(w, 'calendar-heatmap-legend-text').map((t) => t.text())).toEqual(['Less', 'More'])
    expect(slot(w, 'calendar-heatmap-legend-swatch')).toHaveLength(6)
    expect(slot(m({ ...base, levels: 3 }), 'calendar-heatmap-legend-swatch')).toHaveLength(4)
    expect(slot(w, 'calendar-heatmap-legend-swatch')[0]!.classes()).toContain('fill-muted')
  })
  it('can hide the legend, the month labels and the weekday labels', () => {
    const w = m({ ...base, showLegend: false, showMonthLabels: false, showWeekdayLabels: false })
    expect(w.find('[data-slot="calendar-heatmap-legend"]').exists()).toBe(false)
    expect(w.find('[data-slot="calendar-heatmap-months"]').exists()).toBe(false)
    expect(w.find('[data-slot="calendar-heatmap-weekdays"]').exists()).toBe(false)
    expect(num(day(w, '2025-03-03'), 'x')).toBe(0) // no weekday labels: the grid starts at the left edge
    expect(num(day(w, '2025-03-09'), 'y')).toBe(0) // no month labels: and at the top
  })
  it('renders title and description as plain text', () => {
    const w = m({ ...base, title: 'Deploys', description: 'Sample data' })
    expect(w.find('[data-slot="calendar-heatmap-title"]').text()).toBe('Deploys')
    expect(w.find('[data-slot="calendar-heatmap-description"]').text()).toBe('Sample data')
    expect(w.find('h1,h2,h3,h4').exists()).toBe(false)
    expect(m(base).find('[data-slot="calendar-heatmap-header"]').exists()).toBe(false)
  })
  it('gives a text alternative by month', () => {
    const w = m({ label: 'Sample', data: [{ date: '2025-01-30', value: 4 }, { date: '2025-01-31', value: 0 }, { date: '2025-02-01', value: 9 }], start: '2025-01-30', end: '2025-02-03' })
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.find('caption').text()).toBe('Sample: data by month')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['Month', 'Total', 'Active days', 'Busiest day', 'Days without data'])
    expect(table.findAll('tbody tr').map((r) => [r.find('th').text(), ...r.findAll('td').map((c) => c.text())])).toEqual([
      ['Jan 2025', '4', '1', '4', '0'],
      ['Feb 2025', '9', '1', '9', '2'],
    ])
    expect(m({ ...base, label: undefined }).find('caption').text()).toBe('Calendar heatmap: data by month')
  })
  it('uses cellTitle for tooltips', () => {
    const calls: unknown[][] = []
    const w = m({ ...base, cellTitle: (date: string, value: number | null) => (calls.push([date, value]), `${date}=${value}`) })
    expect(day(w, '2025-03-05').find('title').text()).toBe('2025-03-05=6')
    expect(day(w, '2025-03-04').find('title').text()).toBe('2025-03-04=null')
    expect(calls).toContainEqual(['2025-03-12', 0])
  })
  it('is deterministic and never reads the clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2001-01-01T00:00:00Z'))
    const a = m(base).html()
    vi.setSystemTime(new Date('2031-07-07T00:00:00Z'))
    expect(m(base).html()).toBe(a)
    const spy = vi.spyOn(Date, 'now')
    m({ label: 'Sample', data })
    expect(spy).not.toHaveBeenCalled()
  })
  it('formats numbers with grouping in the tooltip and the table', () => {
    const w = m({ label: 'Sample', data: [{ date: '2025-03-03', value: 12345.678 }] })
    expect(day(w, '2025-03-03').find('title').text()).toBe('Mon 3 Mar 2025: 12,345.68')
    expect(w.find('tbody td').text()).toBe('12,345.68')
  })
})

describe('CalendarHeatmap: customisation', () => {
  it('merges class last and lets it win; attributes fall through to the root', () => {
    const w = m({ ...base, class: 'gap-8 max-w-xs' }, { id: 'cal', 'data-test': 'x' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.attributes('id')).toBe('cal')
    expect(w.attributes('data-test')).toBe('x')
    expect(w.attributes('aria-label')).toBeUndefined()
  })
  it('puts class on the empty state too', () => {
    expect(m({ label: 'Sample', data: [], class: 'max-w-xs' }).classes()).toContain('max-w-xs')
  })
  it('levels change the number of distinct fills', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10), value: i + 1 }))
    const fills = (levels: number) => new Set(slot(m({ label: 'Sample', data: many, levels, showLegend: false }), 'calendar-heatmap-day').map(fillOf))
    expect(fills(3).size).toBe(3)
    expect(fills(5).size).toBe(5)
    expect(fills(7).size).toBe(7)
    expect(fills(2).size).toBe(3) // clamped up
    expect(fills(12).size).toBe(7) // clamped down
    expect(fills(Number.NaN).size).toBe(5)
  })
  it('min and max set the scale', () => {
    const top = (props: Record<string, unknown>) => fillOf(day(m({ ...base, ...props }), '2025-03-18'))
    expect(top({})).toBe('fill-chart-1')
    expect(top({ max: 100 })).toBe('fill-chart-1/20')
    expect(top({ min: 9, max: 10 })).toBe('fill-chart-1')
    expect(fillOf(day(m({ ...base, min: 5, max: 10 }), '2025-03-03'))).toBe('fill-chart-1/20') // below min is the faintest step
  })
})

describe('CalendarHeatmap: bad and edge input', () => {
  it('shows the empty state without data and without a range', () => {
    for (const bad of [[], undefined, null, 'x', [{ date: 'x', value: 1 }], [null]]) {
      const w = m({ label: 'Sample', data: bad })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Sample')
      expect(w.find('[data-slot="calendar-heatmap-empty"]').text()).toBe('No data')
      expect(w.find('svg').exists()).toBe(false)
    }
    expect(m({ data: [], emptyText: 'No activity yet' }).attributes('aria-label')).toBe('No activity yet')
    expect(m({ title: 'Named', data: [] }).attributes('aria-label')).toBe('Named')
    expect(m({ data: [] }, { 'aria-labelledby': 'h' }).attributes('aria-labelledby')).toBe('h')
  })
  it('skips invalid entries and says how many', () => {
    const w = m({ ...base, data: [...data, { date: '2025-02-30', value: 1 }, { date: '2025-03-05', value: Number.NaN }, { date: '2025-03-06', value: -4 }, { date: '2025-03-07', value: Infinity }] })
    expect(w.find('[data-slot="calendar-heatmap-message"]').text()).toBe('4 entries with an invalid date or value were skipped.')
    expect(day(w, '2025-03-06').find('title').text()).toContain('no data')
    expect(m({ ...base, data: [...data, { value: 1 }] }).find('[data-slot="calendar-heatmap-message"]').text()).toBe('1 entry with an invalid date or value was skipped.')
    expect(m(base).find('[data-slot="calendar-heatmap-message"]').exists()).toBe(false)
    expectClean(w)
  })
  it('keeps clean markup for zero, huge and all-zero data', () => {
    for (const rows of [
      [{ date: '2025-03-03', value: 0 }],
      [{ date: '2025-03-03', value: 0 }, { date: '2025-03-04', value: 0 }],
      [{ date: '2025-03-03', value: 1e300 }, { date: '2025-03-04', value: 1 }],
      [{ date: '2025-03-03', value: Number.MAX_VALUE }],
    ]) expectClean(m({ label: 'Sample', data: rows }))
    const zero = m({ label: 'Sample', data: [{ date: '2025-03-03', value: 0 }, { date: '2025-03-04', value: 0 }] })
    expect(slot(zero, 'calendar-heatmap-day').every((c) => c.classes().includes('fill-muted'))).toBe(true)
  })
  it('handles a single day and a start after the end', () => {
    const one = m({ label: 'Sample', data: [{ date: '2025-03-03', value: 3 }] })
    expect(slot(one, 'calendar-heatmap-day')).toHaveLength(1)
    expectClean(one)
    const swapped = m({ label: 'Sample', data: [], start: '2025-03-09', end: '2025-03-03' })
    expect(slot(swapped, 'calendar-heatmap-day')).toHaveLength(7)
  })
  it('ignores an unusable start or end when there is data', () => {
    const w = m({ label: 'Sample', data, start: 'soon', end: '2025-02-30' })
    expect(slot(w, 'calendar-heatmap-day')).toHaveLength(16)
  })
  it('handles a range across years and leap days', () => {
    const w = m({ label: 'Sample', data: [{ date: '2024-02-29', value: 5 }, { date: '2024-12-31', value: 2 }, { date: '2025-01-01', value: 3 }], start: '2024-02-27', end: '2025-01-02' })
    expect(day(w, '2024-02-29').find('title').text()).toBe('Thu 29 Feb 2024: 5')
    expect(day(w, '2025-01-01').find('title').text()).toBe('Wed 1 Jan 2025: 3')
    expect(slot(w, 'calendar-heatmap-day')).toHaveLength(311)
    // 27 Feb to 1 Mar share the first column: the cut-off February gives way to March
    expect(slot(w, 'calendar-heatmap-month').map((t) => t.text())[0]).toBe('Mar 2024')
    expect(slot(w, 'calendar-heatmap-month').some((t) => t.text().startsWith('Jan'))).toBe(true)
    expect(w.findAll('tbody tr')).toHaveLength(12)
  })
  it('caps a range at five years and says so, in under a second for 2000+ cells', () => {
    const t0 = performance.now()
    const w = m({ label: 'Sample', data: [{ date: '2020-06-01', value: 3 }], start: '2000-01-01', end: '2025-01-01' })
    expect(performance.now() - t0).toBeLessThan(1500)
    expect(slot(w, 'calendar-heatmap-day')).toHaveLength(1830)
    expect(w.find('[data-slot="calendar-heatmap-message"]').text()).toBe('Showing the last 1830 days of the range.')
    expect(day(w, '2025-01-01').exists()).toBe(true)
    expect(w.findAll('tbody tr').length).toBeLessThanOrEqual(62)
    expectClean(w)
  })
  it('handles 2000 data entries', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ date: new Date(Date.UTC(2021, 0, 1 + (i % 1000))).toISOString().slice(0, 10), value: i % 9 }))
    const w = m({ label: 'Sample', data: many })
    expect(slot(w, 'calendar-heatmap-day')).toHaveLength(1000)
    expectClean(w)
  })
  it('does not mutate its input', () => {
    const rows = [{ date: '2025-03-05', value: 1 }, { date: '2025-03-03', value: 2 }]
    const copy = JSON.stringify(rows)
    m({ label: 'Sample', data: rows })
    expect(JSON.stringify(rows)).toBe(copy)
  })
  it('keeps a year of weeks in a scroll region wider than a phone', () => {
    const w = m({ label: 'Sample', data: [], start: '2025-01-01', end: '2025-12-31' })
    expect(num(w.find('svg'), 'width')).toBeGreaterThan(320)
    expect(w.find('svg').classes()).toContain('max-w-none')
    expect(w.find('[data-slot="calendar-heatmap-scroll"]').classes()).toEqual(expect.arrayContaining(['max-w-full', 'overflow-x-auto']))
  })
  it('keeps the last month label inside the viewBox', () => {
    const w = m({ label: 'Sample', data: [], start: '2025-03-01', end: '2025-06-28', showLegend: false })
    const vw = Number(w.find('svg').attributes('viewBox')!.split(' ')[2])
    for (const t of slot(w, 'calendar-heatmap-month')) expect(num(t, 'x')).toBeLessThan(vw)
  })
  it('works with every label hidden and unmounts cleanly', () => {
    const w = m({ ...base, showLegend: false, showMonthLabels: false, showWeekdayLabels: false })
    expect(Number(w.find('svg').attributes('height'))).toBe(98)
    expect(() => w.unmount()).not.toThrow()
  })
})

describe('CalendarHeatmap: fit', () => {
  const settle = async () => {
    await nextTick()
    await nextTick()
  }
  let spy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get')
  })
  const svg = (w: ReturnType<typeof m>) => w.find('[data-slot="calendar-heatmap-svg"]')
  const cellW = (w: ReturnType<typeof m>) => num(day(w, '2025-03-03')!, 'width')

  it('is off by default: fixed size and a w-fit scroll region', async () => {
    spy.mockReturnValue(900)
    const w = m(base)
    await settle()
    expect(w.attributes('data-fit')).toBeUndefined()
    expect(cellW(w)).toBe(12)
    expect(slot(w, 'calendar-heatmap-scroll')[0]!.classes()).toContain('w-fit')
  })
  it('stretches the cells so the SVG fills the container width, never wider', async () => {
    spy.mockReturnValue(300)
    const w = m({ ...base, end: '2025-06-15', fit: true })
    await settle()
    expect(w.attributes('data-fit')).toBe('')
    expect(slot(w, 'calendar-heatmap-scroll')[0]!.classes()).toContain('w-full')
    expect(cellW(w)).toBeGreaterThan(12)
    expect(num(svg(w), 'width')).toBeLessThanOrEqual(300)
    expect(num(svg(w), 'width')).toBeGreaterThanOrEqual(298)
    expect(num(day(w, '2025-03-03')!, 'height')).toBe(cellW(w))
    expectClean(w)
  })
  it('caps the cell at 40px and floors it at 8px', async () => {
    spy.mockReturnValue(2000)
    const wide = m({ ...base, fit: true })
    await settle()
    expect(cellW(wide)).toBe(40)
    spy.mockReturnValue(40)
    const narrow = m({ ...base, fit: true })
    await settle()
    expect(cellW(narrow)).toBe(8)
  })
  it('keeps text at its own size: no viewBox scaling', async () => {
    spy.mockReturnValue(600)
    const w = m({ ...base, fit: true })
    await settle()
    const vb = svg(w).attributes('viewBox')!.split(' ')
    expect(Number(vb[2])).toBe(num(svg(w), 'width'))
    expect(Number(vb[3])).toBe(num(svg(w), 'height'))
  })
  it('uses the fixed size until the container is measured', () => {
    spy.mockReturnValue(0)
    expect(cellW(m({ ...base, fit: true }))).toBe(12)
  })
  it('fits without weekday labels and with circles', async () => {
    spy.mockReturnValue(400)
    const w = m({ ...base, fit: true, showWeekdayLabels: false, shape: 'circle' })
    await settle()
    const c = day(w, '2025-03-03')!
    expect(num(c, 'r') * 2).toBeGreaterThan(12)
    expect(num(svg(w), 'width')).toBeLessThanOrEqual(400)
  })
})

describe('CalendarHeatmap: legend labels', () => {
  const legend = (w: ReturnType<typeof m>) => slot(w, 'calendar-heatmap-legend-text').map((t) => t.text())
  const widthOf = (w: ReturnType<typeof m>) => num(w.find('[data-slot="calendar-heatmap-svg"]'), 'width')

  it('defaults to Less and More', () => {
    expect(legend(m(base))).toEqual(['Less', 'More'])
  })
  it('legendLabels wins over the provider, the provider over English', () => {
    expect(legend(m({ ...base, legendLabels: { less: 'Weniger', more: 'Mehr' } }))).toEqual(['Weniger', 'Mehr'])
    const labels = { 'heatmap.less': 'Moins', 'heatmap.more': 'Plus' }
    const provided = mount(ConfigProvider, { props: { labels }, slots: { default: () => h(CalendarHeatmap, { ...base }) } })
    expect(legend(provided as never)).toEqual(['Moins', 'Plus'])
    const mixed = mount(ConfigProvider, { props: { labels }, slots: { default: () => h(CalendarHeatmap, { ...base, legendLabels: { more: 'Davantage' } }) } })
    expect(legend(mixed as never)).toEqual(['Moins', 'Davantage'])
  })
  it('blank legendLabels fall back to English', () => {
    expect(legend(m({ ...base, legendLabels: { less: ' ', more: '' } }))).toEqual(['Less', 'More'])
  })
  it('measures the translated text: long labels widen the legend and move the More label', () => {
    const short = m(base)
    const long = m({ ...base, legendLabels: { less: 'Significativamente menos', more: 'Significativamente más' } })
    expect(widthOf(long)).toBeGreaterThan(widthOf(short))
    const moreX = (w: ReturnType<typeof m>) => num(slot(w, 'calendar-heatmap-legend-text')[1]!, 'x')
    expect(moreX(long)).toBeGreaterThan(moreX(short))
  })
})
