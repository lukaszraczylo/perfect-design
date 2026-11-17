import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import NetworkGraph from './NetworkGraph.vue'

const nodes = [
  { id: 'a', label: 'Kestrel Freight', group: 'Depot' },
  { id: 'b', label: 'Orchard Mill', group: 'Mill' },
  { id: 'c', label: 'Brightwater Co', group: 'Depot' },
  { id: 'd', label: 'Quarry Row' },
]
const edges = [
  { from: 'a', to: 'b', weight: 3, label: 'Supplies' },
  { from: 'b', to: 'c', directed: true },
  { from: 'c', to: 'a' },
]
const base = { nodes, edges, label: 'Sample network' }
let mounted: VueWrapper[] = []
const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => {
  const w = mount(NetworkGraph, { props: { ...base, ...props } as never, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  mounted.forEach((w) => w.unmount())
  mounted = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const nodeEls = (w: VueWrapper) => w.findAll('[data-slot="network-graph-node"]')
const nodeFor = (w: VueWrapper, i: number) => w.find(`[data-slot="network-graph-node"][data-index="${i}"]`)
const edgeEls = (w: VueWrapper) => w.findAll('[data-slot="network-graph-edge"]')
const noBadValues = (w: VueWrapper) => expect(w.html()).not.toMatch(/NaN|Infinity|undefined|null/)

describe('NetworkGraph: good path', () => {
  it('renders the root, one grouped image, a node per entry and a line per connection', () => {
    const w = m()
    expect(w.attributes('data-slot')).toBe('network-graph')
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    const svg = w.find('[data-slot="network-graph-svg"]')
    expect(svg.attributes('role')).toBe('group')
    expect(svg.attributes('aria-label')).toBe('Sample network')
    expect(svg.attributes('viewBox')).toBe('0 0 480 300')
    expect(nodeEls(w)).toHaveLength(4)
    expect(edgeEls(w)).toHaveLength(3)
    noBadValues(w)
  })
  it('the name moves from the wrapper to the group and the root gets the remaining attributes', () => {
    const w = m({ label: undefined }, { 'aria-label': 'From attribute', id: 'net-1', 'data-test': 'x' })
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.attributes('id')).toBe('net-1')
    expect(w.attributes('data-test')).toBe('x')
    expect(w.find('svg').attributes('aria-label')).toBe('From attribute')
  })
  it('aria-labelledby names the group', () => {
    const w = m({ label: undefined }, { 'aria-labelledby': 'heading-1' })
    expect(w.find('svg').attributes('aria-labelledby')).toBe('heading-1')
  })
  it('title and description are plain text; the title names the graph', () => {
    const w = m({ label: undefined, title: 'Depot links', description: 'Sample data' })
    expect(w.find('[data-slot="network-graph-title"]').text()).toBe('Depot links')
    expect(w.find('[data-slot="network-graph-description"]').text()).toBe('Sample data')
    expect(w.find('[data-slot="network-graph-title"]').element.tagName).toBe('P')
    expect(w.find('svg').attributes('aria-label')).toBe('Depot links')
    expect(m().find('[data-slot="network-graph-title"]').exists()).toBe(false)
  })
  it('without any name (strict mode off) the group is named by a summary', () => {
    const w = m({ label: undefined })
    expect(w.find('svg').attributes('aria-label')).toBe('Network graph: 4 nodes, 3 connections, 2 groups')
  })
  it('the summary is singular for one node', () => {
    const w = m({ label: undefined, nodes: [{ id: 'a' }], edges: [] })
    expect(w.find('svg').attributes('aria-label')).toBe('Network graph: 1 node, 0 connections, 0 groups')
  })
  it('class wins over internal classes', () => {
    const w = m({ class: 'gap-8 max-w-sm' })
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.classes()).toContain('max-w-sm')
  })
  it('is deterministic: the same props give identical markup', () => {
    expect(m().html()).toBe(m().html())
    expect(m({ layout: 'layered', variant: 'grouped', edgeStyle: 'curved' }).html()).toBe(m({ layout: 'layered', variant: 'grouped', edgeStyle: 'curved' }).html())
  })
  it('re-renders when the data changes and keeps a valid tab stop', async () => {
    const w = m()
    await w.setProps({ nodes: [{ id: 'x' }, { id: 'y' }], edges: [{ from: 'x', to: 'y' }] })
    expect(nodeEls(w)).toHaveLength(2)
    expect(w.findAll('[tabindex="0"]')).toHaveLength(1)
  })
})

describe('NetworkGraph: nodes', () => {
  it('draw as circles by default, sized by weighted degree', () => {
    const w = m({ nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], edges: [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }] })
    const r = nodeEls(w).map((n) => Number(n.find('circle').attributes('r')))
    expect(r[0]).toBeGreaterThan(r[1]!)
    expect(r[1]).toBe(r[2])
  })
  it('an explicit size wins over degree', () => {
    const w = m({ nodes: [{ id: 'a', size: 100 }, { id: 'b', size: 1 }], edges: [{ from: 'a', to: 'b' }] })
    const r = nodeEls(w).map((n) => Number(n.find('circle').attributes('r')))
    expect(r).toEqual([14, 5])
  })
  it('colour and marker shape follow the group; ungrouped nodes are muted circles', () => {
    const w = m()
    const el = (id: number) => nodeFor(w, id)
    expect(el(0).find('circle').classes()).toContain('fill-chart-1')
    expect(el(1).find('path').classes()).toContain('fill-chart-2')
    expect(el(1).find('path').attributes('d')).toMatch(/^M[\d.]+,[\d.]+ h/) // square
    expect(el(2).find('circle').classes()).toContain('fill-chart-1')
    expect(el(3).find('circle').classes()).toContain('fill-muted-foreground')
  })
  it('keeps a visible outline for forced colours', () => {
    expect(nodeFor(m(), 0).find('circle').classes()).toContain('forced-colors:stroke-[CanvasText]')
  })
  it('every node is a named image with group, connection count and neighbours', () => {
    const w = m()
    expect(nodeFor(w, 0).attributes('role')).toBe('img')
    expect(nodeFor(w, 0).attributes('aria-label')).toBe('Kestrel Freight, group Depot, 2 connections: Orchard Mill, Brightwater Co')
    expect(nodeFor(w, 3).attributes('aria-label')).toBe('Quarry Row, 0 connections')
    expect(nodeFor(w, 0).find('title').text()).toBe('Kestrel Freight')
  })
  it('lists at most five neighbours and counts the rest', () => {
    const hub = [{ id: 'hub' }, ...Array.from({ length: 8 }, (_, i) => ({ id: `s${i}` }))]
    const w = m({ nodes: hub, edges: hub.slice(1).map((n) => ({ from: 'hub', to: n.id })) })
    expect(nodeFor(w, 0).attributes('aria-label')).toBe('hub, 8 connections: s0, s1, s2, s3, s4 and 3 more')
  })
  it('draws connection labels after every line, with a surface-coloured halo, in the foreground colour', () => {
    const w = m({ variant: 'labelled', nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }], edges: [{ from: 'a', to: 'b', label: 'Pickup' }, { from: 'b', to: 'c', label: 'Flour' }] })
    const groups = w.findAll('svg > g').map((g) => g.attributes('data-slot'))
    expect(groups.indexOf('network-graph-edge-labels')).toBeGreaterThan(groups.indexOf('network-graph-edges'))
    expect(groups.indexOf('network-graph-edge-labels')).toBeLessThan(groups.indexOf('network-graph-nodes'))
    const label = w.find('[data-slot="network-graph-edge-label"]')
    expect(label.classes()).toEqual(expect.arrayContaining(['fill-foreground', 'stroke-background', '[paint-order:stroke]']))
    expect(w.find('[data-slot="network-graph-node-label"]').attributes('stroke-width')).toBe('4')
  })
  it('keeps names of up to 18 characters whole', () => {
    const w = m({ variant: 'labelled', nodes: [{ id: 'a', label: 'Brightwater Co' }, { id: 'b', label: 'Tallow and Finch' }], edges: [] })
    expect(w.findAll('[data-slot="network-graph-node-label"]').map((t) => t.text())).toEqual(['Brightwater Co', 'Tallow and Finch'])
  })
  it('long and unicode labels render unchanged in the name and are cut in the drawing', () => {
    const long = 'A very long node label that keeps going'
    const w = m({ variant: 'labelled', nodes: [{ id: 'a', label: long }, { id: 'b', label: 'Ünïcödé 東京' }], edges: [] })
    expect(nodeFor(w, 0).attributes('aria-label')).toContain(long)
    expect(w.find('[data-slot="network-graph-node-label"]').text()).toBe('A very long node …')
    expect(nodeFor(w, 1).find('[data-slot="network-graph-node-label"]').text()).toBe('Ünïcödé 東京')
  })
  it('a single node and nodes without edges render', () => {
    expect(nodeEls(m({ nodes: [{ id: 'solo' }], edges: [] }))).toHaveLength(1)
    const w = m({ nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], edges: undefined })
    expect(nodeEls(w)).toHaveLength(3)
    expect(w.find('[data-slot="network-graph-edge"]').exists()).toBe(false)
    expect(w.findAll('table')).toHaveLength(1)
  })
  it('numeric ids work', () => {
    const w = m({ nodes: [{ id: 1 }, { id: 2 }], edges: [{ from: 1, to: 2 }] })
    expect(nodeEls(w)).toHaveLength(2)
    expect(edgeEls(w)).toHaveLength(1)
  })
})

describe('NetworkGraph: connections', () => {
  it('arrowheads only on directed connections, drawn as polygons', () => {
    const w = m()
    expect(w.findAll('[data-slot="network-graph-arrow"]')).toHaveLength(1)
    expect(edgeEls(w)[1]!.find('polygon').exists()).toBe(true)
    expect(edgeEls(w)[0]!.find('polygon').exists()).toBe(false)
    expect(w.find('marker').exists()).toBe(false)
  })
  it('the directed prop sets every connection, and a connection can opt out', () => {
    const w = m({ directed: true, edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c', directed: false }] })
    expect(w.findAll('[data-slot="network-graph-arrow"]')).toHaveLength(1)
    expect(edgeEls(w)[0]!.find('polygon').exists()).toBe(true)
  })
  it('weight sets the line width', () => {
    const w = m({ edges: [{ from: 'a', to: 'b', weight: 1 }, { from: 'b', to: 'c', weight: 9 }, { from: 'c', to: 'a' }] })
    expect(edgeEls(w).map((e) => e.find('path').attributes('stroke-width'))).toEqual(['1', '4', '1.5'])
  })
  it('self loops are drawn as a loop above the node', () => {
    const w = m({ edges: [{ from: 'a', to: 'a', directed: true }] })
    expect(edgeEls(w)[0]!.find('path').attributes('d')).toMatch(/ C/)
    expect(edgeEls(w)[0]!.find('polygon').exists()).toBe(true)
    noBadValues(w)
  })
  it('duplicate and opposite connections are all drawn', () => {
    const w = m({ edges: [{ from: 'a', to: 'b' }, { from: 'a', to: 'b' }, { from: 'b', to: 'a' }] })
    expect(edgeEls(w)).toHaveLength(3)
  })
  it('lines carry token colours only', () => {
    const w = m()
    expect(edgeEls(w)[0]!.find('path').classes()).toContain('stroke-muted-foreground/60')
    expect(edgeEls(w)[0]!.find('path').attributes('fill')).toBe('none')
  })
})

describe('NetworkGraph: messages and bad data', () => {
  it('nodes: [] shows the empty state as an image with the text', () => {
    const w = m({ nodes: [], edges: [] })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Sample network')
    expect(w.find('[data-slot="network-graph-empty"]').text()).toBe('No data')
    expect(w.find('svg').exists()).toBe(false)
  })
  it('emptyText replaces the text; a nameless empty graph is named by it', () => {
    const w = m({ label: undefined, nodes: [], emptyText: 'No sites yet' })
    expect(w.attributes('aria-label')).toBe('No sites yet')
    expect(w.text()).toBe('No sites yet')
  })
  it('the empty state also takes aria-labelledby and class', () => {
    const w = m({ label: undefined, nodes: [], class: 'min-h-48' }, { 'aria-labelledby': 'h' })
    expect(w.attributes('aria-labelledby')).toBe('h')
    expect(w.classes()).toContain('min-h-48')
  })
  it('only invalid nodes also show the empty state', () => {
    expect(m({ nodes: [{}, null, { id: '' }] }).find('[data-slot="network-graph-empty"]').exists()).toBe(true)
  })
  it('a cap shows the exact message, draws that many nodes and drops edges to the rest', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}` }))
    const w = m({ nodes: many, edges: [{ from: 'n0', to: 'n1' }, { from: 'n0', to: 'n11' }], maxNodes: 5 })
    expect(nodeEls(w)).toHaveLength(5)
    const msgs = w.findAll('[data-slot="network-graph-message"]').map((p) => p.text())
    expect(msgs).toEqual(['Showing the first 5 of 12 nodes', '1 connection skipped: unknown node id'])
    expect(w.find('svg').attributes('aria-label')).toBe('Sample network')
  })
  it('the default cap is 300 nodes', () => {
    const w = m({ nodes: Array.from({ length: 450 }, (_, i) => ({ id: `n${i}` })), edges: [] })
    expect(nodeEls(w)).toHaveLength(300)
    expect(w.find('[data-slot="network-graph-message"]').text()).toBe('Showing the first 300 of 450 nodes')
  })
  it('an invalid maxNodes falls back to the default cap', () => {
    const w = m({ nodes: Array.from({ length: 310 }, (_, i) => ({ id: `n${i}` })), edges: [], maxNodes: Number.NaN })
    expect(nodeEls(w)).toHaveLength(300)
  })
  it('duplicate ids, entries without an id and unknown endpoints are reported', () => {
    const w = m({ nodes: [{ id: 'a' }, { id: 'a' }, { id: 'b' }, {}], edges: [{ from: 'a', to: 'b' }, { from: 'a', to: 'nope' }] })
    expect(w.findAll('[data-slot="network-graph-message"]').map((p) => p.text())).toEqual([
      '1 duplicate node id ignored',
      '1 entry without an id ignored',
      '1 connection skipped: unknown node id',
    ])
    expect(nodeEls(w)).toHaveLength(2)
  })
  it('no message for clean data', () => {
    expect(m().find('[data-slot="network-graph-message"]').exists()).toBe(false)
  })
  it('NaN, Infinity, negative, zero and huge numbers never reach the markup', () => {
    const w = m({
      nodes: [{ id: 'a', size: Number.NaN }, { id: 'b', size: Infinity }, { id: 'c', size: -4 }, { id: 'd', size: 0 }, { id: 'e', size: 1e308 }],
      edges: [
        { from: 'a', to: 'b', weight: Number.NaN },
        { from: 'b', to: 'c', weight: Infinity },
        { from: 'c', to: 'd', weight: -1 },
        { from: 'd', to: 'e', weight: 0 },
        { from: 'e', to: 'a', weight: 1e308, directed: true },
        { from: 'e', to: 'e', weight: 1e308 },
      ],
      width: Number.NaN,
      height: -5,
    })
    noBadValues(w)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 300')
    for (const el of w.findAll('circle, path, polygon, text')) {
      for (const v of Object.values(el.attributes())) expect(v).not.toMatch(/NaN|Infinity/)
    }
  })
  it('wrong-typed props do not throw', () => {
    expect(() => m({ nodes: 'x', edges: 5 })).not.toThrow()
    expect(m({ nodes: 'x' }).find('[data-slot="network-graph-empty"]').exists()).toBe(true)
    expect(() => m({ nodes, edges: [null, 1, 'a', {}] })).not.toThrow()
  })
  it('a graph of identical coordinates inputs, disconnected parts and cycles all render', () => {
    const cyc = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'x' }, { id: 'y' }]
    const w = m({ nodes: cyc, edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a' }, { from: 'x', to: 'y' }], layout: 'layered' })
    expect(nodeEls(w)).toHaveLength(5)
    noBadValues(w)
  })
  it('renders 2000 nodes when the cap allows it', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ id: `n${i}`, group: `g${i % 6}` }))
    const manyEdges = Array.from({ length: 2400 }, (_, i) => ({ from: `n${i % 2000}`, to: `n${(i * 13 + 5) % 2000}` }))
    const w = m({ nodes: many, edges: manyEdges, maxNodes: 2000, variant: 'grouped' })
    expect(nodeEls(w)).toHaveLength(2000)
    expect(w.findAll('[data-slot="network-graph-hull"]')).toHaveLength(6)
    noBadValues(w)
  })
})

describe('NetworkGraph: legend', () => {
  it('lists the groups with their marker, plus "No group" for ungrouped nodes', () => {
    const w = m()
    const items = w.findAll('[data-slot="network-graph-legend-item"]')
    expect(items.map((i) => i.text())).toEqual(['Depot', 'Mill', 'No group'])
    expect(items[0]!.find('circle').exists()).toBe(true)
    expect(items[1]!.find('path').exists()).toBe(true)
    expect(items.every((i) => i.find('svg').attributes('aria-hidden') === 'true')).toBe(true)
  })
  it('is left out without groups, or with showLegend false', () => {
    expect(m({ nodes: [{ id: 'a' }, { id: 'b' }], edges: [] }).find('[data-slot="network-graph-legend"]').exists()).toBe(false)
    expect(m({ showLegend: false }).find('[data-slot="network-graph-legend"]').exists()).toBe(false)
    expect(m({ showLegend: true }).find('[data-slot="network-graph-legend"]').exists()).toBe(true)
  })
  it('has no "No group" entry when every node has a group', () => {
    const w = m({ nodes: nodes.slice(0, 3), edges: [] })
    expect(w.findAll('[data-slot="network-graph-legend-item"]').map((i) => i.text())).toEqual(['Depot', 'Mill'])
  })
})

describe('NetworkGraph: highlighting and keyboard', () => {
  it('hovering a node keeps its neighbours and their connections, and dims the rest', async () => {
    const w = m({ edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }] })
    await nodeFor(w, 0).trigger('mouseenter')
    expect(nodeEls(w).map((n) => n.classes().includes('opacity-30'))).toEqual([false, false, true, true]) // a, b kept; c, d dimmed
    expect(edgeEls(w).map((e) => e.classes().includes('opacity-30'))).toEqual([false, true])
    expect(edgeEls(w)[0]!.find('path').classes()).toContain('stroke-foreground')
    await nodeFor(w, 0).trigger('mouseleave')
    expect(w.findAll('.opacity-30')).toHaveLength(0)
    expect(edgeEls(w)[0]!.find('path').classes()).toContain('stroke-muted-foreground/60')
  })
  it('dimming uses opacity with a motion-safe transition only', () => {
    const w = m()
    expect(nodeEls(w)[0]!.classes()).toContain('motion-safe:transition-opacity')
    expect(w.html()).not.toMatch(/(?<!motion-safe:)transition-opacity|duration-/)
  })
  it('focus highlights, shows a focus ring and blur clears it', async () => {
    const w = m({ edges: [{ from: 'a', to: 'b' }] })
    await nodeFor(w, 2).trigger('focus')
    expect(w.find('[data-slot="network-graph-focus"]').exists()).toBe(true)
    expect(nodeFor(w, 0).classes()).toContain('opacity-30')
    expect(nodeFor(w, 2).classes()).not.toContain('opacity-30')
    await nodeFor(w, 2).trigger('blur')
    expect(w.find('[data-slot="network-graph-focus"]').exists()).toBe(false)
    expect(w.findAll('.opacity-30')).toHaveLength(0)
  })
  it('hover wins over focus while the pointer is on a node', async () => {
    const w = m({ edges: [{ from: 'a', to: 'b' }] })
    await nodeFor(w, 2).trigger('focus')
    await nodeFor(w, 0).trigger('mouseenter')
    expect(nodeFor(w, 2).classes()).toContain('opacity-30')
    await nodeFor(w, 0).trigger('mouseleave')
    expect(nodeFor(w, 2).classes()).not.toContain('opacity-30')
  })
  it('a self loop and an isolated node highlight themselves only', async () => {
    const w = m({ edges: [{ from: 'a', to: 'a' }] })
    await nodeFor(w, 3).trigger('mouseenter')
    expect(w.findAll('[data-slot="network-graph-node"].opacity-30')).toHaveLength(3)
  })
  it('roving tab stop: exactly one node has tabindex 0, the others -1', () => {
    const w = m()
    expect(nodeEls(w).filter((n) => n.attributes('tabindex') === '0')).toHaveLength(1)
    expect(nodeEls(w).filter((n) => n.attributes('tabindex') === '-1')).toHaveLength(3)
    expect(nodeEls(w)[0]!.attributes('tabindex')).toBe('0')
  })
  it('arrow keys, Home and End move focus through the nodes and the tab stop follows', async () => {
    const w = m({ layout: 'grid' })
    const els = nodeEls(w)
    ;(els[0]!.element as unknown as HTMLElement).focus()
    await nextTick()
    const press = async (key: string) => {
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      document.activeElement!.dispatchEvent(ev)
      await nextTick()
      return ev
    }
    const active = () => (document.activeElement as HTMLElement).getAttribute('data-index')
    expect(active()).toBe('0')
    expect((await press('ArrowRight')).defaultPrevented).toBe(true)
    expect(active()).toBe('2') // grid order groups Depot (a, c) before Mill (b)
    await press('ArrowDown')
    expect(active()).toBe('1')
    await press('ArrowLeft')
    expect(active()).toBe('2')
    await press('ArrowUp')
    expect(active()).toBe('0')
    await press('ArrowUp')
    expect(active()).toBe('0') // no wrap at the start
    await press('End')
    expect(active()).toBe('3')
    await press('ArrowRight')
    expect(active()).toBe('3') // no wrap at the end
    expect(w.findAll('[tabindex="0"]')).toHaveLength(1)
    expect(nodeFor(w, 3).attributes('tabindex')).toBe('0')
    await press('Home')
    expect(active()).toBe('0')
    expect((await press('a')).defaultPrevented).toBe(false)
    expect((await press('Tab')).defaultPrevented).toBe(false)
    expect(active()).toBe('0')
  })
  it('the order follows the layout (layered: by layer, not by index)', async () => {
    const w = m({ layout: 'layered', nodes: [{ id: 'z' }, { id: 'y' }], edges: [{ from: 'y', to: 'z' }] })
    expect(nodeEls(w).map((n) => n.attributes('data-index'))).toEqual(['1', '0'])
    expect(nodeEls(w)[0]!.attributes('tabindex')).toBe('0')
  })
})

describe('NetworkGraph: text alternative', () => {
  it('a hidden node table lists group and connections, and a connection table lists weight and label', () => {
    const w = m()
    const box = w.find('[data-slot="network-graph-table"]')
    expect(box.classes()).toContain('sr-only')
    const tables = box.findAll('table')
    expect(tables).toHaveLength(2)
    expect(tables[0]!.find('caption').text()).toBe('Sample network: nodes')
    expect(tables[0]!.findAll('thead th').map((t) => t.text())).toEqual(['Node', 'Group', 'Connections'])
    const rows = tables[0]!.findAll('tbody tr')
    expect(rows).toHaveLength(4)
    expect(rows[0]!.find('th').attributes('scope')).toBe('row')
    expect(rows[0]!.findAll('td').map((t) => t.text())).toEqual(['Depot', 'Kestrel Freight and Orchard Mill (weight 3, Supplies); Brightwater Co and Kestrel Freight'])
    expect(rows[3]!.findAll('td').map((t) => t.text())).toEqual(['none', 'none'])
    expect(tables[1]!.find('caption').text()).toBe('Sample network: connections')
    const erows = tables[1]!.findAll('tbody tr')
    expect(erows.map((r) => r.find('th').text())).toEqual(['Kestrel Freight and Orchard Mill', 'Orchard Mill to Brightwater Co', 'Brightwater Co and Kestrel Freight'])
    expect(erows[0]!.findAll('td').map((t) => t.text())).toEqual(['3', 'Supplies'])
    expect(erows[1]!.findAll('td').map((t) => t.text())).toEqual(['n/a', 'none'])
  })
  it('stays outside the image and the drawing has no table', () => {
    const w = m()
    expect(w.find('svg table').exists()).toBe(false)
    expect(w.find('[data-slot="network-graph-table"]').element.parentElement).toBe(w.element)
  })
  it('the caption uses a generic name without a label', () => {
    expect(m({ label: undefined }).find('caption').text()).toBe('Network graph: nodes')
  })
  it('rows are cut at 200 and the caption says so', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ id: `n${i}` }))
    const w = m({ nodes: many, edges: many.slice(1).map((n, i) => ({ from: `n${i}`, to: n.id })), maxNodes: 250 })
    const tables = w.findAll('table')
    expect(tables[0]!.findAll('tbody tr')).toHaveLength(200)
    expect(tables[0]!.find('caption').text()).toBe('Sample network: nodes (first 200 of 250 rows)')
    expect(tables[1]!.findAll('tbody tr')).toHaveLength(200)
    expect(tables[1]!.find('caption').text()).toBe('Sample network: connections (first 200 of 249 rows)')
  })
  it('a node with many connections lists ten and counts the rest', () => {
    const hub = [{ id: 'hub' }, ...Array.from({ length: 14 }, (_, i) => ({ id: `s${i}` }))]
    const w = m({ nodes: hub, edges: hub.slice(1).map((n) => ({ from: 'hub', to: n.id })) })
    const cell = w.findAll('tbody tr')[0]!.findAll('td')[1]!.text()
    expect(cell.split('; ')).toHaveLength(11)
    expect(cell.endsWith('and 4 more')).toBe(true)
  })
})

describe('NetworkGraph: sizing', () => {
  it('uses the width prop until measured and the measured width afterwards (1 unit = 1 CSS px)', async () => {
    expect(m({ width: 320 }).find('svg').attributes('viewBox')).toBe('0 0 320 300')
    let cb: ResizeObserverCallback = () => {}
    class RO {
      constructor(fn: ResizeObserverCallback) {
        cb = fn
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', RO)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(288)
    const w = m()
    await nextTick()
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 288 300')
    cb([{ contentRect: { width: 400 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 400 300')
  })
  it('stays inside the box at 320px: every node is within the viewBox', () => {
    for (const layout of ['force', 'circular', 'grid', 'layered']) {
      for (const variant of ['plain', 'labelled', 'grouped']) {
        const w = m({ width: 320, layout, variant, edges: [...edges, { from: 'a', to: 'a' }] })
        for (const c of w.findAll('[data-slot="network-graph-node"] circle, [data-slot="network-graph-node"] path')) {
          const { cx, cy, r } = c.attributes()
          if (cx === undefined) continue
          expect(Number(cx) - Number(r)).toBeGreaterThanOrEqual(0)
          expect(Number(cx) + Number(r)).toBeLessThanOrEqual(320)
          expect(Number(cy) - Number(r)).toBeGreaterThanOrEqual(0)
          expect(Number(cy) + Number(r)).toBeLessThanOrEqual(300)
        }
      }
    }
  })
  it('unmounting disconnects the observer and leaves no handlers behind', async () => {
    const disconnect = vi.fn()
    class RO {
      observe() {}
      disconnect = disconnect
    }
    vi.stubGlobal('ResizeObserver', RO)
    const w = m()
    await nextTick()
    w.unmount()
    mounted = []
    expect(disconnect).toHaveBeenCalled()
  })
})
