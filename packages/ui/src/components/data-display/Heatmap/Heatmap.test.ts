import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Heatmap from './Heatmap.vue'

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
