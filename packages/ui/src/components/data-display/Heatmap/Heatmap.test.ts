import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import Heatmap from './Heatmap.vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(Heatmap, { props: props as never, attrs })
const cells = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-cell"]')
const swatch = (w: ReturnType<typeof m>, i: number) => cells(w)[i]!.find('[data-slot="heatmap-swatch"]')
const values = [
  [0, 1, 2],
  [3, 4, 5],
]

describe('Heatmap: good path', () => {
  it('renders a real table with data-slot, caption summary and one td per cell', () => {
    const w = m({ values })
    expect(w.attributes('data-slot')).toBe('heatmap')
    expect(w.find('table').exists()).toBe(true)
    expect(w.find('caption').text()).toBe('Heatmap: 2 rows by 3 columns, values from 0 to 5')
    expect(cells(w)).toHaveLength(6)
    expect(w.findAll('tbody tr')).toHaveLength(2)
  })
  it('row/column labels become th with scope', () => {
    const w = m({ values, rowLabels: ['Mon', 'Tue'], colLabels: ['A', 'B', 'C'] })
    const col = w.findAll('th[scope="col"]')
    const row = w.findAll('th[scope="row"]')
    expect(col.map((t) => t.text())).toEqual(['A', 'B', 'C'])
    expect(row.map((t) => t.text())).toEqual(['Mon', 'Tue'])
  })
  it('no label rows/cols when none supplied', () => {
    const w = m({ values })
    expect(w.find('thead').exists()).toBe(false)
    expect(w.find('th').exists()).toBe(false)
  })
  it('each td has a visually-hidden value and the colour in an inner span', () => {
    const w = m({ values: [[1234.5, 2]] })
    expect(cells(w)[0]!.find('.sr-only').text()).toBe('1,234.5')
    expect(swatch(w, 0).classes()).toContain('bg-chart-1')
    expect(swatch(w, 1).classes()).toContain('bg-chart-1/10')
  })
  it('intensity grows with value; zero and null are bg-muted', () => {
    const w = m({ values: [[0, null, 1, 10]] })
    expect(swatch(w, 0).classes()).toContain('bg-muted')
    expect(swatch(w, 1).classes()).toContain('bg-muted')
    expect(swatch(w, 2).classes()).toContain('bg-chart-1/10')
    expect(swatch(w, 3).classes()).toContain('bg-chart-1')
    expect(cells(w)[1]!.attributes('data-empty')).toBe('true')
    expect(cells(w)[1]!.find('.sr-only').text()).toBe('no data')
  })
  it('default tooltip uses labels or fallbacks; cellTitle overrides', () => {
    const w = m({ values: [[7]], rowLabels: ['Mon'], colLabels: ['W1'] })
    expect(swatch(w, 0).attributes('title')).toBe('Mon, W1: 7')
    expect(swatch(m({ values: [[7, null]] }), 1).attributes('title')).toBe('Row 1, Column 2: no data')
    const calls: unknown[][] = []
    const c = m({ values: [[7, null]], rowLabels: ['r'], colLabels: ['a'], cellTitle: (v: unknown, r: string, k: string) => (calls.push([v, r, k]), `${r}/${k}/${v}`) })
    expect(swatch(c, 0).attributes('title')).toBe('r/a/7')
    expect(calls[1]).toEqual([null, 'r', ''])
  })
  it('tone, min/max, levels and size props', () => {
    expect(swatch(m({ values, tone: 'success' }), 5).classes()).toContain('bg-success')
    expect(swatch(m({ values, tone: 'danger' }), 5).classes()).toContain('bg-destructive')
    // domain widened with max: top value is no longer full colour
    expect(swatch(m({ values, max: 50 }), 5).classes()).toContain('bg-chart-1/10')
    // min raises the floor: value 1 below the min is level 1
    expect(swatch(m({ values, min: 3, max: 5 }), 1).classes()).toContain('bg-chart-1/10')
    expect(swatch(m({ values, levels: 2 }), 5).classes()).toContain('bg-chart-1')
    expect(swatch(m({ values, size: 'sm' }), 0).classes()).toContain('size-3')
    expect(swatch(m({ values, size: 'lg' }), 0).classes()).toContain('size-6')
    expect(swatch(m({ values }), 0).classes()).toContain('size-4')
    expect(swatch(m({ values, size: 'xl' }), 0).classes()).toContain('size-4')
  })
  it('legend: Less … More with empty + one swatch per level; can be hidden', () => {
    const w = m({ values })
    const lg = w.find('[data-slot="heatmap-legend"]')
    expect(lg.text()).toContain('Less')
    expect(lg.text()).toContain('More')
    expect(w.findAll('[data-slot="heatmap-legend-swatch"]')).toHaveLength(6)
    expect(m({ values, levels: 3 }).findAll('[data-slot="heatmap-legend-swatch"]')).toHaveLength(4)
    expect(m({ values, showLegend: false }).find('[data-slot="heatmap-legend"]').exists()).toBe(false)
  })
  it('colLabelStep keeps every label for AT but shows every n-th visibly', () => {
    const w = m({ values: [[1, 2, 3, 4, 5]], colLabels: ['a', 'b', 'c', 'd', 'e'], colLabelStep: 2 })
    const spans = w.findAll('th[scope="col"] span')
    expect(spans.map((s) => s.classes().includes('sr-only'))).toEqual([false, true, false, true, false])
    expect(m({ values: [[1, 2]], colLabels: ['a', 'b'], colLabelStep: 0 }).findAll('th[scope="col"] span.sr-only')).toHaveLength(0)
    expect(m({ values: [[1, 2]], colLabels: ['a', 'b'], colLabelStep: NaN }).findAll('th[scope="col"] span.sr-only')).toHaveLength(0)
  })
})

describe('Heatmap: customisation', () => {
  it('merges class and passes attrs / label', () => {
    const w = m({ values, class: 'gap-6 p-2', label: 'Activity' }, { id: 'hm', 'data-z': '1' })
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).toContain('p-2')
    expect(w.attributes('id')).toBe('hm')
    expect(w.attributes('data-z')).toBe('1')
    expect(w.find('caption').text()).toBe('Activity')
  })
})

describe('Heatmap: empty and bad input', () => {
  it.each([[[]], [[[]]], [null], [undefined], ['x']])('%j → empty state', (v) => {
    const w = m({ values: v })
    expect(w.attributes('role')).toBe('img')
    expect(w.text()).toBe('No data')
    expect(w.attributes('aria-label')).toBe('No data')
    expect(w.find('table').exists()).toBe(false)
  })
  it('emptyText / label / class on empty', () => {
    const w = m({ values: [], emptyText: 'No activity', label: 'Commits', class: 'h-20' })
    expect(w.text()).toBe('No activity')
    expect(w.attributes('aria-label')).toBe('Commits')
    expect(w.classes()).toContain('h-20')
  })
  it('non-array rows are treated as empty rows', () => {
    const w = m({ values: [[1, 2], 'bad', null] })
    expect(cells(w)).toHaveLength(6)
    expect(swatch(w, 2).classes()).toContain('bg-muted')
  })
})

describe('Heatmap: edge cases', () => {
  it('ragged rows are padded with empty cells', () => {
    const w = m({ values: [[1], [1, 2, 3], []] })
    expect(cells(w)).toHaveLength(9)
    expect(cells(w).filter((c) => c.attributes('data-empty') === 'true')).toHaveLength(5)
  })
  it('NaN / Infinity / undefined cells are empty', () => {
    const w = m({ values: [[NaN, Infinity, -Infinity, undefined, 5]] })
    expect(cells(w).map((c) => c.attributes('data-empty'))).toEqual(['true', 'true', 'true', 'true', undefined])
    expect(w.find('caption').text()).toContain('values from 5 to 5')
  })
  it('all null / all zero: still a grid, all muted', () => {
    const w = m({ values: [[null, null], [0, 0]] })
    expect(cells(w)).toHaveLength(4)
    expect([0, 1, 2, 3].every((i) => swatch(w, i).classes().includes('bg-muted'))).toBe(true)
    expect(m({ values: [[null]] }).find('caption').text()).toContain('no values')
  })
  it('all-equal non-zero values are top intensity', () => {
    const w = m({ values: [[4, 4], [4, 4]] })
    expect([0, 1, 2, 3].every((i) => swatch(w, i).classes().includes('bg-chart-1'))).toBe(true)
  })
  it('negative numbers still map into the ramp', () => {
    const w = m({ values: [[-10, -5, 0, 5]] })
    expect(swatch(w, 0).classes()).toContain('bg-chart-1/10')
    expect(swatch(w, 2).classes()).toContain('bg-muted')
    expect(swatch(w, 3).classes()).toContain('bg-chart-1')
  })
  it('huge numbers', () => {
    const w = m({ values: [[1e308, -1e308, 1]] })
    expect(w.html()).not.toMatch(/NaN|Infinity/)
    expect(swatch(w, 0).classes()).toContain('bg-chart-1')
  })
  it('fewer labels than rows/cols are tolerated', () => {
    const w = m({ values, rowLabels: ['only'], colLabels: ['a'] })
    expect(w.findAll('th[scope="row"]').map((t) => t.text())).toEqual(['only', ''])
    expect(w.findAll('th[scope="col"]')).toHaveLength(3)
    expect(swatch(w, 4).attributes('title')).toBe('Row 2, Column 2: 4')
  })
  it('duplicate labels are fine', () => {
    const w = m({ values, rowLabels: ['x', 'x'], colLabels: ['y', 'y', 'y'] })
    expect(cells(w)).toHaveLength(6)
  })
  it('commit-calendar sized grid (7 x 26) and larger smoke', () => {
    const grid = Array.from({ length: 7 }, (_, r) => Array.from({ length: 26 }, (_, c) => ((r * 31 + c * 17) % 11)))
    expect(cells(m({ values: grid }))).toHaveLength(182)
    const big = Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => (r * c) % 9))
    const t = performance.now()
    expect(cells(m({ values: big }))).toHaveLength(10_000)
    expect(performance.now() - t).toBeLessThan(5000)
  })

  describe('accessibility and responsive behaviour', () => {
    it('the grid scrolls inside a focusable, named region instead of widening the page', () => {
      const w = m({ values: [[1, 2], [3, 4]], label: 'Activity' })
      expect(w.attributes('role')).toBe('region')
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.attributes('aria-label')).toBe('Activity')
      // `relative` makes the scroller the containing block of the absolutely positioned sr-only cell text, so it is clipped instead of widening the page
      expect(w.classes()).toEqual(expect.arrayContaining(['relative', 'overflow-x-auto', 'max-w-full', 'min-w-0', 'focus-visible:ring-inset']))
    })

    it('falls back to the generated summary as the region name', () => {
      expect(m({ values: [[1, 2]] }).attributes('aria-label')).toContain('Heatmap: 1 row by 2 columns')
    })

    it('uses scale tokens only: no arbitrary text sizes or radii, tabular legend, logical alignment', () => {
      const w = m({ values: [[1, 2]], rowLabels: ['r'], colLabels: ['a', 'b'] })
      expect(w.html()).not.toMatch(/text-\[|rounded-\[/)
      expect(w.find('[data-slot="heatmap-legend"]').classes()).toEqual(expect.arrayContaining(['text-xs', 'tabular-nums']))
      expect(w.find('[data-slot="heatmap-row-label"]').classes()).toEqual(expect.arrayContaining(['text-end', 'pe-1']))
      expect(w.find('[data-slot="heatmap-col-label"]').classes()).toContain('text-start')
      expect(w.find('[data-slot="heatmap-swatch"]').classes()).toContain('rounded-xs')
    })

    it('the empty state is not a scroll region', () => {
      const w = m({ values: [] })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('tabindex')).toBeUndefined()
    })
  })
})

describe('Heatmap: fit mode', () => {
  const wide = Array.from({ length: 3 }, (_, r) => Array.from({ length: 24 }, (_, c) => (r + c) % 5))
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const visible = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-col-label"]').map((th) => !th.find('span').classes().includes('sr-only'))
  const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get')
  afterEach(() => spy.mockReset())

  it('is off by default: fixed cell sizes, w-fit root, plain table', () => {
    const w = m({ values })
    expect(w.attributes('data-fit')).toBeUndefined()
    expect(w.classes()).toContain('w-fit')
    expect(w.find('table').classes()).toContain('border-separate')
    expect(w.find('table').attributes('style')).toBeUndefined()
    expect(swatch(w, 0).classes()).toContain('size-4')
  })
  it('fit: root fills the width, columns are fr-capped, cells are square and fill their column', () => {
    const w = m({ values, fit: true, rowLabels: ['a', 'b'] })
    expect(w.attributes('data-fit')).toBe('')
    expect(w.classes()).toContain('w-full')
    expect(w.classes()).not.toContain('w-fit')
    expect(w.find('table').classes()).toContain('grid')
    expect(w.find('table').attributes('style')).toContain('auto repeat(3, minmax(0px, 40px))')
    expect(swatch(w, 0).classes()).toEqual(expect.arrayContaining(['aspect-square', 'w-full']))
    expect(swatch(w, 0).classes()).not.toContain('size-4')
  })
  it('fit keeps table semantics through explicit roles and every cell', () => {
    const w = m({ values, fit: true, rowLabels: ['a', 'b'], colLabels: ['x', 'y', 'z'] })
    expect(w.find('table').attributes('role')).toBe('table')
    expect(w.findAll('tr').every((tr) => tr.attributes('role') === 'row')).toBe(true)
    expect(w.find('[data-slot="heatmap-row-label"]').attributes('role')).toBe('rowheader')
    expect(w.find('[data-slot="heatmap-col-label"]').attributes('role')).toBe('columnheader')
    expect(cells(w)).toHaveLength(6)
  })
  it('fit respects shape and gap', () => {
    const w = m({ values, fit: true, shape: 'circle', gap: 'lg' })
    expect(swatch(w, 0).classes()).toContain('rounded-full')
    expect(w.find('table').classes()).toContain('gap-1')
  })
  it('fit thins column labels on a narrow container; first and last always show, none collide', async () => {
    spy.mockReturnValue(300)
    const w = m({ values: wide, fit: true, colLabels: hours })
    await nextTick()
    const shown = visible(w)
    const idx = shown.flatMap((v, i) => (v ? [i] : []))
    expect(shown[0]).toBe(true)
    expect(shown[23]).toBe(true)
    expect(idx.length).toBeLessThan(24)
    const gaps = idx.slice(1).map((v, i) => v - idx[i]!)
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(2)
  })
  it('fit shows every label when there is room, and an explicit colLabelStep is never lowered', async () => {
    spy.mockReturnValue(5000)
    const roomy = m({ values: wide, fit: true, colLabels: hours })
    const forced = m({ values: wide, fit: true, colLabels: hours, colLabelStep: 4 })
    await nextTick()
    expect(visible(roomy).every(Boolean)).toBe(true)
    const stepped = visible(forced)
    expect(stepped[1]).toBe(false)
    expect(stepped[4]).toBe(true)
  })
  it('without fit the label step is unchanged even in a narrow container', async () => {
    spy.mockReturnValue(300)
    const plain = m({ values: wide, colLabels: hours })
    await nextTick()
    expect(visible(plain).every(Boolean)).toBe(true)
  })
  it('single column and no labels do not break', () => {
    spy.mockReturnValue(100)
    expect(cells(m({ values: [[1], [2]], fit: true, colLabels: ['only'] }))).toHaveLength(2)
    expect(cells(m({ values: [[1, 2]], fit: true }))).toHaveLength(2)
  })
})

describe('Heatmap: fit column label alignment', () => {
  const wide = Array.from({ length: 2 }, (_, r) => Array.from({ length: 24 }, (_, c) => (r + c) % 5))
  const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get')
  afterEach(() => spy.mockReset())
  const heads = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-col-label"]')
  const align = (el: { classes: () => string[] }) => el.classes().find((c) => c.startsWith('justify-'))

  it('centres every label, the last included, when all of them fit', async () => {
    spy.mockReturnValue(1200)
    const w = m({ values: wide, fit: true, colLabels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')) })
    await nextTick()
    const all = heads(w).map(align)
    expect(new Set(all)).toEqual(new Set(['justify-center']))
    expect(align(heads(w)[23]!)).toBe(align(heads(w)[22]!))
  })
  it('centres labels before the container is measured', () => {
    spy.mockReturnValue(0)
    const w = m({ values: wide, fit: true, colLabels: ['a', 'b', 'c'] })
    expect(heads(w).every((h) => align(h) === 'justify-center')).toBe(true)
  })
  it('clamps the first label to the start and the last to the end only when wider than their cell', async () => {
    spy.mockReturnValue(300)
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
    const w = m({ values: wide, fit: true, colLabels: hours })
    await nextTick()
    const all = heads(w).map(align)
    expect(all[0]).toBe('justify-start')
    expect(all[23]).toBe('justify-end')
    expect(all.slice(1, 23).every((a) => a === 'justify-center')).toBe(true)
  })
  it('non-fit labels keep their plain start alignment', () => {
    const w = m({ values: wide, colLabels: ['a', 'b'] })
    expect(heads(w)[0]!.classes()).toContain('text-start')
  })
})

describe('Heatmap: fill', () => {
  const wide = Array.from({ length: 2 }, (_, r) => Array.from({ length: 24 }, (_, c) => (r + c) % 5))
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get')
  afterEach(() => spy.mockReset())
  const shown = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-col-label"]').filter((th) => !th.find('span').classes().includes('sr-only')).length

  it('is off by default: columns stay capped at 40px', () => {
    const w = m({ values, fit: true })
    expect(w.attributes('data-fill')).toBeUndefined()
    expect(w.find('table').attributes('style')).toContain('minmax(0px, 40px)')
  })
  it('fill uses 1fr columns and marks the root', () => {
    const w = m({ values, fit: true, fill: true, rowLabels: ['a', 'b'] })
    expect(w.attributes('data-fill')).toBe('')
    expect(w.find('table').attributes('style')).toContain('auto repeat(3, minmax(0px, 1fr))')
    expect(swatch(w, 0).classes()).toEqual(expect.arrayContaining(['aspect-square', 'w-full']))
  })
  it('fill without fit changes nothing', () => {
    const w = m({ values, fill: true })
    expect(w.attributes('data-fill')).toBeUndefined()
    expect(w.find('table').attributes('style')).toBeUndefined()
  })
  it('label thinning uses the uncapped cell width with fill', async () => {
    // 1200px / 24 columns = ~49px cells: more than the 40px cap, so a capped heatmap thins harder.
    spy.mockReturnValue(1200)
    const capped = m({ values: wide, fit: true, colLabels: hours })
    const filled = m({ values: wide, fit: true, fill: true, colLabels: hours })
    await nextTick()
    expect(shown(filled)).toBeGreaterThanOrEqual(shown(capped))
    expect(shown(filled)).toBe(24)
  })
})

describe('Heatmap: legend', () => {
  const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
  afterEach(() => spy.mockReset())
  const texts = (w: ReturnType<typeof m>) => w.find('[data-slot="heatmap-legend"]').findAll(':scope > span:not([data-slot])').map((s) => s.text())

  it('defaults to Less and More', () => {
    expect(texts(m({ values }))).toEqual(['Less', 'More'])
  })
  it('legendLabels wins over the provider, the provider over English', () => {
    expect(texts(m({ values, legendLabels: { less: 'Weniger', more: 'Mehr' } }))).toEqual(['Weniger', 'Mehr'])
    const provided = mount(ConfigProvider, { props: { labels: { 'heatmap.less': 'Moins', 'heatmap.more': 'Plus' } }, slots: { default: () => h(Heatmap, { values, label: 'x' }) } })
    expect(texts(provided as never)).toEqual(['Moins', 'Plus'])
    const mixed = mount(ConfigProvider, { props: { labels: { 'heatmap.less': 'Moins', 'heatmap.more': 'Plus' } }, slots: { default: () => h(Heatmap, { values, label: 'x', legendLabels: { more: 'Davantage' } }) } })
    expect(texts(mixed as never)).toEqual(['Moins', 'Davantage'])
  })
  it('blank legendLabels fall back', () => {
    expect(texts(m({ values, legendLabels: { less: '  ', more: '' } }))).toEqual(['Less', 'More'])
  })
  it('fit with row labels starts the legend at the first cell column', async () => {
    spy.mockImplementation(function (this: HTMLElement) {
      const slot = this.getAttribute('data-slot')
      return { left: slot === 'heatmap-cell' ? 36 : 0, right: 0 } as DOMRect
    })
    const w = m({ values, fit: true, rowLabels: ['Mon', 'Tue'] })
    await nextTick()
    await nextTick()
    expect(w.find('[data-slot="heatmap-legend"]').attributes('style')).toContain('padding-inline-start: 36px')
  })
  it('no inset without row labels or without fit', async () => {
    const a = m({ values, fit: true })
    const b = m({ values, rowLabels: ['Mon', 'Tue'] })
    await nextTick()
    expect(a.find('[data-slot="heatmap-legend"]').attributes('style')).toBeUndefined()
    expect(b.find('[data-slot="heatmap-legend"]').attributes('style')).toBeUndefined()
  })
})
