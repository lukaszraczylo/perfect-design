import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Treemap from './Treemap.vue'

const data = [
  { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }] },
  { label: 'Racks', value: 30 },
  { label: 'Tools', value: 10 },
]
const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(Treemap, { props: { data, label: 'Sample inventory', ...props } as never, attrs, attachTo: document.body })
type W = ReturnType<typeof m>
const cells = (w: W) => w.findAll('[data-slot="treemap-cell"]')
const tiles = (w: W) => w.findAll('[data-slot="treemap-tile"]')
const nums = (w: W) => w.html().match(/\b(NaN|Infinity|undefined)\b/g)

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Treemap: good path', () => {
  it('renders the root, one labelled group svg and one cell per leaf', () => {
    const w = m()
    expect(w.attributes('data-slot')).toBe('treemap')
    expect(w.find('svg').attributes('role')).toBe('group')
    expect(w.find('svg').attributes('aria-label')).toBe('Sample inventory')
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(cells(w)).toHaveLength(4)
    expect(nums(w)).toBeNull()
  })
  it('names every cell with its path, value and share of the total', () => {
    const labels = cells(m()).map((c) => c.attributes('aria-label'))
    expect(labels).toContain('Cables / Copper: 40 (40% of total)')
    expect(labels).toContain('Racks: 30 (30% of total)')
    expect(labels).toContain('Tools: 10 (10% of total)')
    expect(cells(m()).every((c) => c.attributes('role') === 'img')).toBe(true)
  })
  it('tile area follows the value', () => {
    const w = m()
    const area = (key: string) => {
      const r = w.find(`[data-key="${key}"] rect`)
      return Number(r.attributes('width')) * Number(r.attributes('height'))
    }
    expect(area('0.0') / area('0.1')).toBeGreaterThan(1.7)
    expect(area('0.0') / area('0.1')).toBeLessThan(2.3)
  })
  it('writes a label and a value into tiles that are big enough', () => {
    const w = m()
    const copper = w.find('[data-key="0.0"]')
    expect(copper.findAll('[data-slot="treemap-label"]').map((t) => t.text())).toEqual(['Copper', '40'])
  })
  it('shows a visible title and description and uses the title as the name when there is no label', () => {
    const w = m({ label: undefined, title: 'Stock by area', description: 'Sample units' })
    expect(w.find('[data-slot="treemap-title"]').text()).toBe('Stock by area')
    expect(w.find('[data-slot="treemap-description"]').text()).toBe('Sample units')
    expect(w.find('svg').attributes('aria-label')).toBe('Stock by area')
    expect(w.find('caption').text()).toBe('Stock by area: data')
  })
  it('title and description are absent by default', () => {
    const w = m()
    expect(w.find('[data-slot="treemap-title"]').exists()).toBe(false)
    expect(w.find('[data-slot="treemap-description"]').exists()).toBe(false)
  })
  it('valueFormatter formats labels, names and the table', () => {
    const w = m({ valueFormatter: (n: number) => `${n} units` })
    expect(cells(w)[0]!.attributes('aria-label')).toContain('40 units')
    expect(w.find('[data-key="0.0"]').findAll('[data-slot="treemap-label"]').map((t) => t.text())).toEqual(['Copper', '40 units'])
    expect(w.findAll('tbody td').map((t) => t.text())).toContain('40 units')
  })
  it('an explicit width sets the viewBox until the container is measured, height wins over size', () => {
    expect(m({ width: 640 }).find('svg').attributes('viewBox')).toBe('0 0 640 300')
    expect(m({ height: 123 }).find('svg').attributes('viewBox')).toBe('0 0 480 123')
  })
  it('uses the measured width once a ResizeObserver reports one', async () => {
    let cb: ResizeObserverCallback = () => {}
    vi.stubGlobal('ResizeObserver', class { constructor(c: ResizeObserverCallback) { cb = c } observe() {} disconnect() {} unobserve() {} })
    const w = m()
    await nextTick()
    cb([{ contentRect: { width: 320 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 320 300')
    expect(nums(w)).toBeNull()
  })
})

describe('Treemap: text alternative', () => {
  it('ships a data table with every node: groups with their total, then their children', () => {
    const w = m()
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.find('thead').text()).toContain('Item')
    const rows = table.findAll('tbody tr').map((r) => r.text())
    expect(rows).toEqual(['Cables60', 'Cables / Copper40', 'Cables / Fibre20', 'Racks30', 'Tools10'])
  })
  it('has an automatic summary linked with aria-describedby', () => {
    const w = m()
    const id = w.find('svg').attributes('aria-describedby')!
    expect(w.find(`#${id}`).text()).toBe('Treemap: 4 items, 3 top-level groups, total 100')
    expect(w.find(`#${id}`).classes()).toContain('sr-only')
  })
  it('the summary uses singular forms', () => {
    const w = m({ data: [{ label: 'Only', value: 1 }] })
    expect(w.find('[data-slot="treemap-summary"]').text()).toBe('Treemap: 1 item, 1 top-level group, total 1')
  })
})

describe('Treemap: keyboard and focus', () => {
  it('exactly one cell is in the tab order', () => {
    const w = m()
    expect(cells(w).map((c) => c.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
  })
  it('arrow keys, Home and End move focus between cells', async () => {
    const w = m()
    const els = cells(w).map((c) => c.element as unknown as SVGElement)
    els[0]!.focus()
    await nextTick()
    await cells(w)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(els[1])
    expect(cells(w).map((c) => c.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
    await cells(w)[1]!.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(els[2])
    await cells(w)[2]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(els[1])
    await cells(w)[1]!.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(els[0])
    await cells(w)[0]!.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(els[3])
    await cells(w)[3]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(els[3])
    await cells(w)[3]!.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(els[0])
    await cells(w)[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(els[0])
  })
  it('ignores other keys and keys from outside a cell', async () => {
    const w = m()
    const els = cells(w).map((c) => c.element as unknown as SVGElement)
    els[0]!.focus()
    await cells(w)[0]!.trigger('keydown', { key: 'a' })
    expect(document.activeElement).toBe(els[0])
    await w.find('svg').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(els[0])
  })
  it('does not prevent default for keys it does not handle', async () => {
    const w = m()
    const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    cells(w)[0]!.element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
    const arrow = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    cells(w)[0]!.element.dispatchEvent(arrow)
    expect(arrow.defaultPrevented).toBe(true)
  })
  it('focus and hover show the full name in the readout, blur and leave clear it', async () => {
    const w = m()
    const readout = () => w.find('[data-slot="treemap-readout"]').text()
    expect(readout()).toBe('')
    await cells(w)[1]!.trigger('focus')
    expect(readout()).toBe('Cables / Fibre: 20 (20% of total)')
    await cells(w)[1]!.trigger('blur')
    expect(readout()).toBe('')
    await cells(w)[2]!.trigger('mouseenter')
    expect(readout()).toBe('Racks: 30 (30% of total)')
    await cells(w)[2]!.trigger('mouseleave')
    expect(readout()).toBe('')
    expect(w.find('[data-slot="treemap-readout"]').attributes('aria-hidden')).toBe('true')
  })
  it('keeps the roving index inside the cells when the data shrinks', async () => {
    const w = m()
    await cells(w)[3]!.trigger('focus')
    await w.setProps({ data: [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }] })
    expect(cells(w).map((c) => c.attributes('tabindex')).filter((t) => t === '0')).toHaveLength(1)
  })
  it('focus styling lives on the group so it shows for keyboard focus only', () => {
    const t = tiles(m())[0]!
    expect(t.classes()).toContain('group-focus-visible:stroke-ring')
    expect(cells(m())[0]!.classes()).toEqual(['group', 'outline-hidden'])
  })
  it('is a single tab stop even with 2000 cells', () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({ label: `Item ${i}`, value: (i % 17) + 1 }))
    const w = m({ data: big, height: 800, width: 1200 })
    expect(cells(w).filter((c) => c.attributes('tabindex') === '0')).toHaveLength(1)
  })
})

describe('Treemap: empty and invalid data', () => {
  it.each([[[]], [undefined], [null], [[{ label: 'x', value: 0 }]]])('shows the empty state for %j', (d) => {
    const w = m({ data: d, emptyText: 'Nothing to show' })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Sample inventory')
    expect(w.find('[data-slot="treemap-empty"]').text()).toBe('Nothing to show')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('table').exists()).toBe(false)
  })
  it('the empty state falls back to emptyText as the name and explains ignored entries', () => {
    const w = m({ data: [{ label: 'x', value: -1 }], label: undefined })
    expect(w.attributes('aria-label')).toBe('No data')
    expect(w.find('[data-slot="treemap-message"]').text()).toBe('1 entry left out: a value must be a number above zero.')
  })
  it('keeps the class and aria attributes on the empty state', () => {
    const w = m({ data: [], label: undefined, class: 'max-w-xs' }, { 'aria-label': 'Fixed name', id: 'tm' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.attributes('id')).toBe('tm')
    expect(w.attributes('aria-label')).toBe('Fixed name')
    const by = m({ data: [], label: undefined }, { 'aria-labelledby': 'heading' })
    expect(by.attributes('aria-labelledby')).toBe('heading')
  })
  it('drops bad entries, draws the rest and says how many were left out', () => {
    const w = m({ data: [...data, { label: 'Zero', value: 0 }, { label: 'Neg', value: -4 }, { label: 'Bad', value: Number.NaN }, { label: 'Inf', value: Infinity }] })
    expect(cells(w)).toHaveLength(4)
    expect(w.find('[data-slot="treemap-message"]').text()).toBe('4 entries left out: a value must be a number above zero.')
    expect(nums(w)).toBeNull()
  })
  it('no message when everything is valid', () => {
    expect(m().find('[data-slot="treemap-message"]').exists()).toBe(false)
  })
  it('huge values stay finite in every attribute', () => {
    const w = m({ data: [{ label: 'a', value: 1.7e308 }, { label: 'b', value: 1.7e308 }, { label: 'c', value: 1 }] })
    expect(nums(w)).toBeNull()
    expect(cells(w).length).toBeGreaterThan(0)
  })
  it('a single item fills the whole drawing', () => {
    const w = m({ data: [{ label: 'Only', value: 5 }], gap: 'none' })
    const r = tiles(w)[0]!
    expect([r.attributes('width'), r.attributes('height')]).toEqual(['480', '300'])
    expect(cells(w)[0]!.attributes('aria-label')).toBe('Only: 5 (100% of total)')
  })
  it('equal values and duplicate labels all get their own cell', () => {
    const w = m({ data: Array.from({ length: 6 }, () => ({ label: 'Same', value: 2 })) })
    expect(cells(w)).toHaveLength(6)
    expect(new Set(cells(w).map((c) => c.attributes('data-key'))).size).toBe(6)
    expect(w.findAll('tbody tr')).toHaveLength(6)
  })
  it('long and unicode labels are truncated inside the tile but complete in the name', () => {
    const long = 'Gebäude Überwachungssystem 監視システム '.repeat(4)
    const w = m({ data: [{ label: long, value: 3 }, { label: 'B', value: 2 }], width: 200 })
    const first = cells(w)[0]!
    expect(first.attributes('aria-label')).toContain(long)
    const text = first.find('[data-slot="treemap-label"]').text()
    expect(text.endsWith('…')).toBe(true)
    expect(text.length).toBeLessThan(long.length)
  })
  it('right to left text stays intact', () => {
    const w = m({ data: [{ label: 'مخزن', value: 3 }, { label: 'ב', value: 2 }] })
    expect(cells(w)[0]!.attributes('aria-label')).toContain('مخزن')
  })
  it('an array that is not an array of nodes does not throw', () => {
    expect(() => m({ data: [1, 'a', null, [2]] })).not.toThrow()
  })
})

describe('Treemap: deep nesting, cycles and size', () => {
  it('folds levels below maxDepth and keeps the totals', () => {
    let node: Record<string, unknown> = { label: 'leaf', value: 3 }
    for (let i = 0; i < 40; i++) node = { label: `n${i}`, children: [node, { label: `s${i}`, value: 1 }] }
    const deep = m({ data: [node], maxDepth: 8 })
    expect(deep.find('[data-slot="treemap-summary"]').text()).toContain('total 43')
    const shallow = m({ data: [node], maxDepth: 1 })
    expect(cells(shallow)).toHaveLength(1)
    expect(shallow.find('[data-slot="treemap-summary"]').text()).toContain('total 43')
    expect(nums(deep)).toBeNull()
  })
  it('maxDepth outside 1..8 is clamped', () => {
    const nested = [{ label: 'A', children: [{ label: 'B', children: [{ label: 'C', value: 1 }, { label: 'D', value: 1 }] }] }]
    expect(cells(m({ data: nested, maxDepth: 0 }))).toHaveLength(1)
    expect(cells(m({ data: nested, maxDepth: 99 }))).toHaveLength(2)
    expect(cells(m({ data: nested, maxDepth: Number.NaN }))).toHaveLength(2)
  })
  it('a cyclic structure renders once instead of looping', () => {
    const a: Record<string, unknown> = { label: 'a', children: [{ label: 'x', value: 2 }] }
    ;(a.children as unknown[]).push(a)
    const w = m({ data: [a] })
    expect(cells(w)).toHaveLength(1)
    expect(w.find('[data-slot="treemap-message"]').exists()).toBe(true)
  })
  it('2000 items render in good time and say how many are too small', () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({ label: `Item ${i}`, value: ((i * 37) % 101) + 1 }))
    const t = performance.now()
    const w = m({ data: big, width: 480, height: 300 })
    expect(performance.now() - t).toBeLessThan(5000)
    expect(cells(w).length).toBeGreaterThan(100)
    expect(nums(w)).toBeNull()
    expect(w.findAll('tbody tr')).toHaveLength(200)
    expect(w.find('caption').text()).toContain('first 200 of 2000 rows')
    const tiny = m({ data: big, width: 100, height: 60 })
    expect(tiny.find('[data-slot="treemap-message"]').text()).toMatch(/too small to draw/)
  })
  it('is deterministic: the same input twice gives identical markup', () => {
    const big = Array.from({ length: 300 }, (_, i) => ({ label: `Item ${i}`, value: ((i * 53) % 97) + 1 }))
    const strip = (h: string) => h.replace(/v-\d+-\d+/g, 'x').replace(/id="[^"]*"/g, '')
    expect(strip(m({ data: big }).html())).toBe(strip(m({ data: big }).html()))
  })
  it('re-renders when the data changes', async () => {
    const w = m()
    await w.setProps({ data: [{ label: 'Solo', value: 9 }] })
    expect(cells(w)).toHaveLength(1)
    expect(w.find('[data-slot="treemap-summary"]').text()).toContain('1 item')
  })
})

describe('Treemap: customisation', () => {
  it('class wins and is merged onto the root', () => {
    const w = m({ class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('attributes fall through to the root, the name goes to the image', () => {
    const w = m({ label: undefined }, { id: 'tm-1', 'data-testid': 'x', 'aria-label': 'Named by attribute' })
    expect(w.attributes('id')).toBe('tm-1')
    expect(w.attributes('data-testid')).toBe('x')
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.find('svg').attributes('aria-label')).toBe('Named by attribute')
  })
  it('aria-labelledby names the svg', () => {
    const w = m({ label: undefined }, { 'aria-labelledby': 'heading-1' })
    expect(w.find('svg').attributes('aria-labelledby')).toBe('heading-1')
  })
  it('cleans up its resize observer when unmounted', async () => {
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; unobserve() {} })
    const w = m()
    await nextTick()
    w.unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
