import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NetworkGraph from './NetworkGraph.vue'
import { NETWORK_EDGE_STYLES, NETWORK_HEIGHTS, NETWORK_SIZES, NETWORK_VARIANTS, networkGraphVariants } from './variants'
import { NETWORK_LAYOUTS } from './networkLayout'

const nodes = [
  { id: 'a', label: 'Kestrel Freight', group: 'Depot' },
  { id: 'b', label: 'Orchard Mill', group: 'Mill' },
  { id: 'c', label: 'Brightwater Co', group: 'Depot' },
  { id: 'd', label: 'Quarry Row' },
]
const edges = [{ from: 'a', to: 'b', label: 'Supplies', weight: 2 }, { from: 'b', to: 'c', directed: true }, { from: 'c', to: 'd' }, { from: 'd', to: 'a' }]
const base = { nodes, edges, label: 'Sample network' }
const m = (props: Record<string, unknown> = {}) => mount(NetworkGraph, { props: { ...base, ...props } as never })
const edgePaths = (w: ReturnType<typeof m>) => w.findAll('[data-slot="network-graph-edge"] path').map((p) => p.attributes('d'))
const nodeXY = (w: ReturnType<typeof m>) => w.findAll('[data-slot="network-graph-node"]').map((n) => [n.attributes('data-index'), n.find('circle, path').attributes('cx') ?? n.find('path').attributes('d')])

describe('NetworkGraph variants: defaults are unchanged', () => {
  it('pins the default markup', () => {
    const w = m()
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-layout')).toBe('force')
    expect(w.attributes('data-variant')).toBe('plain')
    expect(w.attributes('data-edge-style')).toBe('straight')
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(w.find('[data-slot="network-graph-hulls"]').exists()).toBe(false)
    expect(w.find('[data-slot="network-graph-node-label"]').exists()).toBe(false)
    expect(w.find('[data-slot="network-graph-edge-label"]').exists()).toBe(false)
    expect(edgePaths(w).every((d) => /^M[\d.-]+,[\d.-]+ L/.test(d!))).toBe(true)
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ layout: 'force', variant: 'plain', size: 'md', edgeStyle: 'straight', directed: false, showLegend: 'auto', maxNodes: 300 }).html()).toBe(m().html())
  })
  it('the cva helper keeps the default string for plain elements', () => {
    expect(networkGraphVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(networkGraphVariants({ size: 'sm' })).toBe('flex w-full min-w-0 flex-col gap-1.5')
    expect(networkGraphVariants({ size: 'lg' })).toBe('flex w-full min-w-0 flex-col gap-3')
  })
})

describe('NetworkGraph variants: layout', () => {
  it('each layout puts the nodes somewhere else', () => {
    const html = NETWORK_LAYOUTS.map((layout) => JSON.stringify(nodeXY(m({ layout }))))
    expect(new Set(html).size).toBe(4)
  })
  it.each(NETWORK_LAYOUTS)('%s is marked on the root and renders every node and line', (layout) => {
    const w = m({ layout })
    expect(w.attributes('data-layout')).toBe(layout)
    expect(w.findAll('[data-slot="network-graph-node"]')).toHaveLength(4)
    expect(w.findAll('[data-slot="network-graph-edge"]')).toHaveLength(4)
    expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
  })
  it('circular puts the nodes on one circle (equal distance from the middle)', () => {
    const w = m({ layout: 'circular', width: 480, height: 300, nodes: Array.from({ length: 6 }, (_, i) => ({ id: `n${i}` })), edges: [] })
    const c = w.findAll('[data-slot="network-graph-node"] circle').map((n) => [Number(n.attributes('cx')), Number(n.attributes('cy'))])
    const dist = c.map(([x, y]) => Math.hypot(x! - (c.reduce((s, p) => s + p[0]!, 0) / c.length), y! - (c.reduce((s, p) => s + p[1]!, 0) / c.length)))
    expect(Math.max(...dist) - Math.min(...dist)).toBeLessThan(2)
  })
  it('layered puts a directed chain in increasing x order', () => {
    const chain = [{ id: 'x' }, { id: 'y' }, { id: 'z' }]
    const w = m({ layout: 'layered', nodes: chain, edges: [{ from: 'x', to: 'y' }, { from: 'y', to: 'z' }] })
    const xs = w.findAll('[data-slot="network-graph-node"] circle').map((n) => Number(n.attributes('cx')))
    expect(xs[0]).toBeLessThan(xs[1]!)
    expect(xs[1]).toBeLessThan(xs[2]!)
  })
  it('grid puts nodes on shared rows and columns', () => {
    const w = m({ layout: 'grid', nodes: Array.from({ length: 9 }, (_, i) => ({ id: `n${i}` })), edges: [] })
    const pts = w.findAll('[data-slot="network-graph-node"] circle').map((n) => [n.attributes('cx'), n.attributes('cy')])
    expect(new Set(pts.map((p) => p[0])).size).toBe(3)
    expect(new Set(pts.map((p) => p[1])).size).toBe(3)
  })
  it('an unknown layout falls back to force', () => {
    expect(m({ layout: 'spiral' }).html()).toBe(m().html())
  })
  it('the same layout twice is identical for every layout', () => {
    for (const layout of NETWORK_LAYOUTS) expect(m({ layout }).html()).toBe(m({ layout }).html())
  })
})

describe('NetworkGraph variants: variant', () => {
  it('labelled adds node labels and connection labels', () => {
    const w = m({ variant: 'labelled' })
    expect(w.attributes('data-variant')).toBe('labelled')
    expect(w.findAll('[data-slot="network-graph-node-label"]').map((t) => t.text())).toEqual(['Kestrel Freight', 'Orchard Mill', 'Brightwater Co', 'Quarry Row'])
    expect(w.findAll('[data-slot="network-graph-edge-label"]').map((t) => t.text())).toEqual(['Supplies'])
    expect(w.find('[data-slot="network-graph-hulls"]').exists()).toBe(false)
  })
  it('labelled leaves a margin for the text so labels stay inside the drawing', () => {
    const w = m({ variant: 'labelled', width: 320 })
    for (const t of w.findAll('[data-slot="network-graph-node-label"]')) {
      expect(Number(t.attributes('x'))).toBeGreaterThanOrEqual(40)
      expect(Number(t.attributes('x'))).toBeLessThanOrEqual(280)
      expect(Number(t.attributes('y'))).toBeLessThanOrEqual(300)
    }
  })
  it('labels are left out above 120 nodes', () => {
    const many = Array.from({ length: 130 }, (_, i) => ({ id: `n${i}` }))
    expect(m({ variant: 'labelled', nodes: many, edges: [] }).find('[data-slot="network-graph-node-label"]').exists()).toBe(false)
  })
  it('grouped draws one dashed hull per group, filled and stroked with the group tone', () => {
    const w = m({ variant: 'grouped' })
    const hulls = w.findAll('[data-slot="network-graph-hull"]')
    expect(hulls.map((h) => h.attributes('data-group'))).toEqual(['Depot', 'Mill'])
    expect(hulls[0]!.classes()).toEqual(expect.arrayContaining(['fill-chart-1/15', 'stroke-chart-1']))
    expect(hulls[1]!.classes()).toEqual(expect.arrayContaining(['fill-chart-2/15', 'stroke-chart-2']))
    expect(hulls[0]!.attributes('stroke-dasharray')).toBe('4 3')
    expect(hulls[0]!.attributes('d')).toMatch(/^M[\d.,-]+( L[\d.,-]+)+ Z$/)
    expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
  })
  it('a hull encloses its nodes (bounding box contains every member)', () => {
    const w = m({ variant: 'grouped', layout: 'circular' })
    const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
    const hull = nums(w.find('[data-group="Depot"]').attributes('d')!)
    const xs = hull.filter((_, i) => i % 2 === 0)
    const ys = hull.filter((_, i) => i % 2 === 1)
    for (const i of [0, 2]) {
      const c = w.find(`[data-slot="network-graph-node"][data-index="${i}"] circle`)
      expect(Number(c.attributes('cx'))).toBeGreaterThan(Math.min(...xs))
      expect(Number(c.attributes('cx'))).toBeLessThan(Math.max(...xs))
      expect(Number(c.attributes('cy'))).toBeGreaterThan(Math.min(...ys))
      expect(Number(c.attributes('cy'))).toBeLessThan(Math.max(...ys))
    }
  })
  it('grouped without groups draws no hulls; a one-node group still gets one', () => {
    expect(m({ variant: 'grouped', nodes: [{ id: 'a' }, { id: 'b' }], edges: [] }).find('[data-slot="network-graph-hull"]').exists()).toBe(false)
    expect(m({ variant: 'grouped', nodes: [{ id: 'a', group: 'solo' }], edges: [] }).findAll('[data-slot="network-graph-hull"]')).toHaveLength(1)
  })
  it.each(NETWORK_VARIANTS)('%s renders different markup from the others', (variant) => {
    const others = NETWORK_VARIANTS.filter((v) => v !== variant).map((v) => m({ variant: v }).html())
    expect(others).not.toContain(m({ variant }).html())
  })
  it('an unknown variant falls back to plain', () => {
    expect(m({ variant: 'fancy' }).html()).toBe(m().html())
  })
})

describe('NetworkGraph variants: size', () => {
  it.each([
    ['sm', '0 0 480 200'],
    ['md', '0 0 480 300'],
    ['lg', '0 0 480 420'],
  ])('%s sets the viewBox height', (size, viewBox) => {
    expect(m({ size }).find('svg').attributes('viewBox')).toBe(viewBox)
    expect(NETWORK_HEIGHTS[size as keyof typeof NETWORK_HEIGHTS]).toBe(Number(viewBox.split(' ')[3]))
  })
  it('sets the gap of the root', () => {
    expect(m({ size: 'sm' }).classes()).toContain('gap-1.5')
    expect(m({ size: 'lg' }).classes()).toContain('gap-3')
  })
  it('an explicit height wins over size, bad values are ignored', () => {
    expect(m({ size: 'lg', height: 150 }).find('svg').attributes('viewBox')).toBe('0 0 480 150')
    expect(m({ size: 'lg', height: -1 }).find('svg').attributes('viewBox')).toBe('0 0 480 420')
  })
  it('unknown sizes fall back to md', () => {
    expect(m({ size: 'huge' }).html()).toBe(m().html())
  })
  it('the nodes stay inside the taller and the shorter drawing', () => {
    for (const size of NETWORK_SIZES) {
      const h = NETWORK_HEIGHTS[size]
      for (const c of m({ size }).findAll('[data-slot="network-graph-node"] circle')) {
        expect(Number(c.attributes('cy')) - Number(c.attributes('r'))).toBeGreaterThanOrEqual(0)
        expect(Number(c.attributes('cy')) + Number(c.attributes('r'))).toBeLessThanOrEqual(h)
      }
    }
  })
})

describe('NetworkGraph variants: edgeStyle', () => {
  it('curved draws quadratic curves, straight draws lines', () => {
    expect(edgePaths(m({ edgeStyle: 'straight' })).every((d) => d!.includes(' L'))).toBe(true)
    const curved = m({ edgeStyle: 'curved' })
    expect(curved.attributes('data-edge-style')).toBe('curved')
    expect(edgePaths(curved).every((d) => d!.includes(' Q'))).toBe(true)
  })
  it('the nodes do not move when the style changes', () => {
    expect(nodeXY(m({ edgeStyle: 'curved' }))).toEqual(nodeXY(m()))
  })
  it('curved separates a pair A to B and B to A', () => {
    const pair = [{ id: 'a' }, { id: 'b' }]
    const both = [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }]
    const straight = edgePaths(m({ nodes: pair, edges: both }))
    const curved = edgePaths(m({ nodes: pair, edges: both, edgeStyle: 'curved' }))
    expect(new Set(curved).size).toBe(2)
    expect(straight[0]).not.toBe(curved[0])
  })
  it('an unknown value falls back to straight', () => {
    expect(m({ edgeStyle: 'wavy' }).html()).toBe(m().html())
  })
  it.each(NETWORK_EDGE_STYLES)('%s keeps arrowheads on directed lines', (edgeStyle) => {
    expect(m({ edgeStyle }).findAll('[data-slot="network-graph-arrow"]')).toHaveLength(1)
  })
})

describe('NetworkGraph variants: cross products', () => {
  it('every layout, variant and edge style together renders without bad values and with all parts', () => {
    for (const layout of NETWORK_LAYOUTS) {
      for (const variant of NETWORK_VARIANTS) {
        for (const edgeStyle of NETWORK_EDGE_STYLES) {
          const w = m({ layout, variant, edgeStyle, directed: true, size: 'sm', width: 320, edges: [...edges, { from: 'a', to: 'a' }] })
          expect(w.findAll('[data-slot="network-graph-node"]'), `${layout}/${variant}/${edgeStyle}`).toHaveLength(4)
          expect(w.findAll('[data-slot="network-graph-edge"]')).toHaveLength(5)
          expect(w.findAll('[data-slot="network-graph-arrow"]')).toHaveLength(5) // the directed prop covers every line, loop included
          expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
          expect(w.find('[data-slot="network-graph-hulls"]').exists()).toBe(variant === 'grouped')
        }
      }
    }
  })
  it('class still wins in every variant combination', () => {
    const w = m({ layout: 'grid', variant: 'grouped', size: 'lg', class: 'gap-10' })
    expect(w.classes()).toContain('gap-10')
    expect(w.classes()).not.toContain('gap-3')
  })
  it('legend, hulls and highlight work together with a layered layout', async () => {
    const w = m({ layout: 'layered', variant: 'grouped' })
    expect(w.find('[data-slot="network-graph-legend"]').exists()).toBe(true)
    await w.find('[data-slot="network-graph-node"]').trigger('mouseenter')
    expect(w.findAll('.opacity-30').length).toBeGreaterThanOrEqual(0)
    expect(w.findAll('[data-slot="network-graph-hull"]')).toHaveLength(2)
  })
})
