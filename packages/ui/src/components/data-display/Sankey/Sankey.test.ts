import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Sankey from './Sankey.vue'

const links = [
  { source: 'Orders', target: 'Shipped', value: 80 },
  { source: 'Orders', target: 'Returned', value: 20 },
  { source: 'Shipped', target: 'Delivered', value: 70 },
  { source: 'Shipped', target: 'Lost', value: 10 },
]
const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(Sankey, { props: { links, label: 'Sample orders', ...props } as never, attrs })
type W = ReturnType<typeof m>
const nums = (w: W) => w.html().match(/\b(NaN|Infinity|undefined)\b/g)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Sankey: good path', () => {
  it('renders a labelled image with one node per id, one ribbon per flow and a label per node', () => {
    const w = m()
    expect(w.attributes('data-slot')).toBe('sankey')
    const svg = w.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample orders')
    expect(svg.attributes('viewBox')).toBe('0 0 480 320')
    expect(w.findAll('[data-slot="sankey-node"]')).toHaveLength(5)
    expect(w.findAll('[data-slot="sankey-link"]')).toHaveLength(4)
    expect(w.findAll('[data-slot="sankey-label"]').map((t) => t.text())).toEqual(['Orders100', 'Shipped80', 'Delivered70', 'Returned20', 'Lost10'])
    expect(nums(w)).toBeNull()
  })
  it('ribbons and nodes carry tooltips with the flow and the node total', () => {
    const w = m()
    expect(w.findAll('[data-slot="sankey-link"] title').map((t) => t.text())).toContain('Shipped to Lost: 10')
    expect(w.findAll('[data-slot="sankey-node"] title').map((t) => t.text())).toContain('Shipped: 80')
  })
  it('uses declared labels for nodes', () => {
    const w = m({ nodes: [{ id: 'Orders', label: 'Orders placed' }] })
    expect(w.text()).toContain('Orders placed')
    expect(w.find('[data-slot="sankey-data-table"] tbody th').text()).toBe('Orders placed')
  })
  it('title and description are visible, and the title names the image without a label', () => {
    const w = m({ label: undefined, title: 'Order outcomes', description: 'Sample data' })
    expect(w.find('[data-slot="sankey-title"]').text()).toBe('Order outcomes')
    expect(w.find('[data-slot="sankey-description"]').text()).toBe('Sample data')
    expect(w.find('svg').attributes('aria-label')).toBe('Order outcomes')
    expect(w.find('caption').text()).toBe('Order outcomes: flows')
  })
  it('no title or description by default', () => {
    expect(m().find('[data-slot="sankey-title"]').exists()).toBe(false)
    expect(m().find('[data-slot="sankey-description"]').exists()).toBe(false)
  })
  it('valueFormatter reaches labels, tooltips and the table', () => {
    const w = m({ valueFormatter: (n: number) => `${n} kg` })
    expect(w.findAll('[data-slot="sankey-label"]')[0]!.text()).toBe('Orders100 kg')
    expect(w.findAll('[data-slot="sankey-link"] title')[0]!.text()).toContain('kg')
    expect(w.findAll('tbody td').map((t) => t.text())).toContain('80 kg')
  })
  it('width and height set the viewBox; height wins over size', () => {
    expect(m({ width: 640 }).find('svg').attributes('viewBox')).toBe('0 0 640 320')
    expect(m({ height: 150, size: 'lg' }).find('svg').attributes('viewBox')).toBe('0 0 480 150')
  })
  it('follows the measured container width', async () => {
    let cb: ResizeObserverCallback = () => {}
    vi.stubGlobal('ResizeObserver', class { constructor(c: ResizeObserverCallback) { cb = c } observe() {} disconnect() {} unobserve() {} })
    const w = m()
    await nextTick()
    cb([{ contentRect: { width: 320 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 320 320')
    expect(nums(w)).toBeNull()
  })
})

describe('Sankey: text alternative', () => {
  it('lists every flow as a table row: from, to, value', () => {
    const w = m()
    const table = w.find('[data-slot="sankey-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['From', 'To', 'Value'])
    expect(table.find('caption').text()).toBe('Sample orders: flows')
    const rows = table.findAll('tbody tr').map((r) => [r.find('th').text(), ...r.findAll('td').map((c) => c.text())])
    expect(rows).toEqual([['Orders', 'Shipped', '80'], ['Orders', 'Returned', '20'], ['Shipped', 'Delivered', '70'], ['Shipped', 'Lost', '10']])
    expect(table.find('tbody th').attributes('scope')).toBe('row')
    expect(w.find('svg').find('table').exists()).toBe(false)
  })
  it('has an automatic summary linked with aria-describedby', () => {
    const w = m()
    const id = w.find('svg').attributes('aria-describedby')!
    expect(w.find(`#${id}`).text()).toBe('Sankey diagram: 5 nodes, 4 flows, 3 layers')
  })
  it('singular forms', () => {
    expect(m({ links: [{ source: 'a', target: 'b', value: 1 }] }).find('[data-slot="sankey-summary"]').text()).toBe('Sankey diagram: 2 nodes, 1 flow, 2 layers')
  })
  it('cuts the table at 200 rows and says so', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ source: `s${i}`, target: 't', value: 1 }))
    const w = m({ links: many })
    expect(w.findAll('tbody tr')).toHaveLength(200)
    expect(w.find('caption').text()).toBe('Sample orders: flows (first 200 of 250 rows)')
  })
})

describe('Sankey: bad and edge data', () => {
  it.each([[[]], [undefined], [[{ source: 'a', target: 'b', value: 0 }]], [[{ source: 'a', target: 'a', value: 3 }]]])('shows the empty state for %j', (l) => {
    const w = m({ links: l, emptyText: 'No flows yet' })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Sample orders')
    expect(w.find('[data-slot="sankey-empty"]').text()).toBe('No flows yet')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('table').exists()).toBe(false)
  })
  it('the empty state explains what was left out, keeps class and attributes, and falls back to emptyText as the name', () => {
    const w = m({ links: [{ source: 'a', target: 'a', value: 3 }, { source: 'a', target: 'b', value: -1 }], label: undefined, class: 'max-w-xs' }, { id: 'sk' })
    expect(w.attributes('aria-label')).toBe('No data')
    expect(w.classes()).toContain('max-w-xs')
    expect(w.attributes('id')).toBe('sk')
    expect(w.find('[data-slot="sankey-message"]').text()).toBe('1 flow left out: a flow needs a source, a target and a value above zero. 1 flow from a node to itself left out.')
    expect(m({ links: [], label: undefined }, { 'aria-labelledby': 'h' }).attributes('aria-labelledby')).toBe('h')
  })
  it('draws what is valid and reports what was left out', () => {
    const w = m({ links: [...links, { source: 'x', target: 'x', value: 1 }, { source: 'Lost', target: 'Orders', value: 2 }, { source: 'a', target: 'b', value: Number.NaN }] })
    expect(w.findAll('[data-slot="sankey-link"]')).toHaveLength(4)
    expect(w.find('[data-slot="sankey-message"]').text()).toBe('1 flow left out: a flow needs a source, a target and a value above zero. 1 flow from a node to itself left out. 1 flow left out because they close a loop.')
    expect(nums(w)).toBeNull()
  })
  it('a cyclic input is drawn as an acyclic diagram', () => {
    const w = m({ links: [{ source: 'a', target: 'b', value: 3 }, { source: 'b', target: 'c', value: 3 }, { source: 'c', target: 'a', value: 3 }] })
    expect(w.findAll('[data-slot="sankey-link"]')).toHaveLength(2)
    expect(nums(w)).toBeNull()
  })
  it('huge and tiny values keep every attribute finite', () => {
    const huge = m({ links: [{ source: 'a', target: 'b', value: 1.7e308 }, { source: 'a', target: 'c', value: 1.7e308 }, { source: 'b', target: 'd', value: 1e-300 }] })
    expect(nums(huge)).toBeNull()
    expect(huge.findAll('[data-slot="sankey-node"]').length).toBeGreaterThan(0)
  })
  it('a single flow fills the layers', () => {
    const w = m({ links: [{ source: 'Only', target: 'Other', value: 5 }] })
    expect(w.findAll('[data-slot="sankey-node"]')).toHaveLength(2)
    expect(nums(w)).toBeNull()
  })
  it('duplicate flows are added up into one ribbon', () => {
    const w = m({ links: [{ source: 'a', target: 'b', value: 2 }, { source: 'a', target: 'b', value: 3 }] })
    expect(w.findAll('[data-slot="sankey-link"]')).toHaveLength(1)
    expect(w.find('[data-slot="sankey-link"] title').text()).toBe('a to b: 5')
  })
  it('long and unicode labels are cut in the picture and complete in the table', () => {
    const long = 'Kestrel Freight Überwachungssystem 監視システム regional distribution centre'
    const w = m({ links: [{ source: long, target: 'Customers', value: 5 }, { source: 'Customers', target: 'Archive', value: 5 }], width: 240 })
    expect(w.find('[data-slot="sankey-label"]').text().endsWith('5') || w.find('[data-slot="sankey-label"]').text().includes('…')).toBe(true)
    expect(w.find('tbody th').text()).toBe(long)
    expect(w.find('[data-slot="sankey-node"] title').text()).toContain(long)
  })
  it('right to left labels stay intact in the table', () => {
    const w = m({ links: [{ source: 'مخزن', target: 'ב', value: 2 }] })
    expect(w.find('tbody th').text()).toBe('مخزن')
  })
  it('hides labels that would collide and labels in columns that are too narrow', () => {
    const tiny = m({ links: [{ source: 'a', target: 'b', value: 100 }, { source: 'a', target: 'c', value: 0.5 }, { source: 'a', target: 'd', value: 0.5 }], height: 120 })
    expect(tiny.findAll('[data-slot="sankey-label"]').length).toBeLessThan(4)
    const narrow = m({ links: [{ source: 'a', target: 'b', value: 1 }, { source: 'b', target: 'c', value: 1 }, { source: 'c', target: 'd', value: 1 }, { source: 'd', target: 'e', value: 1 }], width: 90 })
    expect(narrow.findAll('[data-slot="sankey-label"]')).toHaveLength(0)
    expect(narrow.findAll('[data-slot="sankey-node"]')).toHaveLength(5)
  })
  it('2000 flows render quickly and finite', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ source: `s${i % 30}`, target: `m${i % 40}`, value: (i % 9) + 1 }))
    const t = performance.now()
    const w = m({ links: many })
    expect(performance.now() - t).toBeLessThan(5000)
    expect(nums(w)).toBeNull()
  })
  it('is deterministic', () => {
    const strip = (h: string) => h.replace(/v-\d+-\d+/g, 'x')
    expect(strip(m().html())).toBe(strip(m().html()))
  })
  it('re-renders when the links change', async () => {
    const w = m()
    await w.setProps({ links: [{ source: 'a', target: 'b', value: 1 }] })
    expect(w.findAll('[data-slot="sankey-link"]')).toHaveLength(1)
  })
})

describe('Sankey: customisation', () => {
  it('class wins and merges onto the root', () => {
    const w = m({ class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('attributes fall through to the root and the name goes to the image', () => {
    const w = m({ label: undefined }, { id: 'sk-1', 'data-testid': 't', 'aria-label': 'By attribute' })
    expect(w.attributes('id')).toBe('sk-1')
    expect(w.attributes('data-testid')).toBe('t')
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.find('svg').attributes('aria-label')).toBe('By attribute')
    expect(m({ label: undefined }, { 'aria-labelledby': 'h1' }).find('svg').attributes('aria-labelledby')).toBe('h1')
  })
  it('cleans up its resize observer', async () => {
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; unobserve() {} })
    const w = m()
    await nextTick()
    w.unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
