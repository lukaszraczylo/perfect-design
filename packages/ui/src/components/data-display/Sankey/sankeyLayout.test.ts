import { describe, expect, it } from 'vitest'
import { buildGraph, layoutSankey, ribbonPath, type SankeyLayoutOptions } from './sankeyLayout'

const flows = [
  { source: 'Orders', target: 'Shipped', value: 80 },
  { source: 'Orders', target: 'Returned', value: 20 },
  { source: 'Shipped', target: 'Delivered', value: 70 },
  { source: 'Shipped', target: 'Lost', value: 10 },
]
const opts: SankeyLayoutOptions = { width: 480, height: 300, nodeWidth: 10, padding: 12 }
const laid = (links: unknown = flows, nodes?: unknown, o = opts) => layoutSankey(buildGraph(nodes, links), o)
const byId = (g: ReturnType<typeof laid>, id: string) => g.nodes.find((n) => n.id === id)!

describe('buildGraph', () => {
  it('creates nodes from the links, in first seen order, labelled with their ids', () => {
    const g = buildGraph(undefined, flows)
    expect(g.nodes.map((n) => n.id)).toEqual(['Orders', 'Shipped', 'Returned', 'Delivered', 'Lost'])
    expect(g.nodes.map((n) => n.label)).toEqual(['Orders', 'Shipped', 'Returned', 'Delivered', 'Lost'])
    expect(g.links).toHaveLength(4)
    expect(g.skipped).toEqual({ invalid: 0, self: 0, cycle: 0, unused: 0 })
  })
  it('uses declared labels, ignores repeated and malformed node entries', () => {
    const g = buildGraph([{ id: 'a', label: 'Alpha' }, { id: 'a', label: 'Again' }, { id: 'b', label: '  ' }, { id: '' }, null, 5, { label: 'no id' }, { id: 3, label: 'Three' }], [{ source: 'a', target: 'b', value: 1 }, { source: 'b', target: 3, value: 1 }])
    expect(g.nodes.map((n) => [n.id, n.label])).toEqual([['a', 'Alpha'], ['b', 'b'], ['3', 'Three']])
  })
  it('drops declared nodes that no flow touches and counts them', () => {
    const g = buildGraph([{ id: 'x' }, { id: 'a' }, { id: 'b' }], [{ source: 'a', target: 'b', value: 1 }])
    expect(g.nodes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(g.skipped.unused).toBe(1)
  })
  it('adds up repeated flows between the same pair but keeps the opposite direction separate', () => {
    const g = buildGraph(undefined, [{ source: 'a', target: 'b', value: 2 }, { source: 'a', target: 'b', value: 3 }, { source: 'b', target: 'c', value: 1 }])
    expect(g.links.map((l) => l.value)).toEqual([5, 1])
  })
  it('counts invalid flows: non-objects, missing ends, zero, negative, NaN and Infinity values', () => {
    const g = buildGraph(undefined, [null, 'x', [1], { source: 'a' }, { target: 'b', value: 1 }, { source: 'a', target: 'b', value: 0 }, { source: 'a', target: 'b', value: -2 }, { source: 'a', target: 'b', value: Number.NaN }, { source: 'a', target: 'b', value: Infinity }, { source: 'a', target: 'b', value: '3' }, { source: 'a', target: 'b', value: 4 }])
    expect(g.skipped.invalid).toBe(10)
    expect(g.links).toHaveLength(1)
  })
  it('counts and drops self flows', () => {
    const g = buildGraph(undefined, [{ source: 'a', target: 'a', value: 1 }, { source: 'a', target: 'b', value: 1 }])
    expect(g.skipped.self).toBe(1)
    expect(g.nodes.map((n) => n.id)).toEqual(['a', 'b'])
  })
  it('breaks cycles deterministically by dropping the flow that closes the loop', () => {
    const loop = [{ source: 'a', target: 'b', value: 1 }, { source: 'b', target: 'c', value: 1 }, { source: 'c', target: 'a', value: 1 }]
    const g = buildGraph(undefined, loop)
    expect(g.skipped.cycle).toBe(1)
    expect(g.links.map((l) => `${l.source.id}>${l.target.id}`)).toEqual(['a>b', 'b>c'])
    expect(buildGraph(undefined, loop).links.map((l) => l.value)).toEqual(g.links.map((l) => l.value))
  })
  it('a two node loop and a diamond are handled', () => {
    expect(buildGraph(undefined, [{ source: 'a', target: 'b', value: 1 }, { source: 'b', target: 'a', value: 1 }]).skipped.cycle).toBe(1)
    const d = buildGraph(undefined, [{ source: 'a', target: 'b', value: 1 }, { source: 'a', target: 'c', value: 1 }, { source: 'b', target: 'd', value: 1 }, { source: 'c', target: 'd', value: 1 }])
    expect(d.skipped.cycle).toBe(0)
    expect(d.layers).toBe(3)
  })
  it('assigns layers by longest path and moves sinks to the last layer', () => {
    const g = buildGraph(undefined, [{ source: 'a', target: 'b', value: 1 }, { source: 'b', target: 'c', value: 1 }, { source: 'a', target: 'd', value: 1 }])
    const layer = Object.fromEntries(g.nodes.map((n) => [n.id, n.layer]))
    expect(layer).toEqual({ a: 0, b: 1, c: 2, d: 2 })
    expect(g.layers).toBe(3)
  })
  it('a node takes the larger of its inflow and outflow as its value', () => {
    const g = buildGraph(undefined, [{ source: 'a', target: 'b', value: 10 }, { source: 'b', target: 'c', value: 4 }, { source: 'b', target: 'd', value: 3 }])
    const v = Object.fromEntries(g.nodes.map((n) => [n.id, [n.in, n.out, n.value]]))
    expect(v.a).toEqual([0, 10, 10])
    expect(v.b).toEqual([10, 7, 10])
    expect(v.c).toEqual([4, 0, 4])
  })
  it('empty and non-array input give an empty graph', () => {
    for (const bad of [undefined, null, 'x', {}, []]) {
      const g = buildGraph(bad, bad)
      expect(g.nodes).toEqual([])
      expect(g.links).toEqual([])
      expect(g.layers).toBe(0)
    }
  })
  it('huge values stay finite when added', () => {
    const g = buildGraph(undefined, [{ source: 'a', target: 'b', value: 1.7e308 }, { source: 'a', target: 'b', value: 1.7e308 }, { source: 'a', target: 'c', value: 1.7e308 }])
    expect(g.links.every((l) => Number.isFinite(l.value))).toBe(true)
    expect(g.nodes.every((n) => Number.isFinite(n.value))).toBe(true)
  })
  it('survives a 3000 node chain', () => {
    const chain = Array.from({ length: 3000 }, (_, i) => ({ source: `n${i}`, target: `n${i + 1}`, value: 1 }))
    const g = buildGraph(undefined, chain)
    expect(g.layers).toBe(3001)
  })
})

describe('layoutSankey', () => {
  it('puts every layer in its own column, first layer at the left edge, last layer at the right edge', () => {
    const g = laid()
    expect(byId(g, 'Orders').x).toBe(0)
    expect(byId(g, 'Shipped').x).toBe(235)
    expect(byId(g, 'Delivered').x).toBe(470)
    expect(byId(g, 'Lost').x).toBe(470)
    expect(byId(g, 'Returned').x).toBe(470)
  })
  it('node height is proportional to its value on one shared scale', () => {
    const g = laid()
    const ky = byId(g, 'Orders').h / 100
    for (const n of g.nodes) expect(n.h).toBeCloseTo(n.value * ky, 1)
  })
  it('keeps every node inside the box and nodes of a layer apart', () => {
    const g = laid()
    for (const n of g.nodes) {
      expect(n.y).toBeGreaterThanOrEqual(-0.01)
      expect(n.y + n.h).toBeLessThanOrEqual(300.01)
    }
    const last = g.nodes.filter((n) => n.layer === 2).sort((a, b) => a.y - b.y)
    for (let i = 1; i < last.length; i++) expect(last[i]!.y).toBeGreaterThanOrEqual(last[i - 1]!.y + last[i - 1]!.h + 11.9)
  })
  it('ribbon widths match their values and fit inside their nodes without overlapping', () => {
    const g = laid()
    for (const l of g.links) {
      expect(l.width).toBeCloseTo(l.value * (byId(g, 'Orders').h / 100), 1)
      expect(l.sy).toBeGreaterThanOrEqual(l.source.y - 0.01)
      expect(l.sy + l.width).toBeLessThanOrEqual(l.source.y + l.source.h + 0.05)
      expect(l.ty).toBeGreaterThanOrEqual(l.target.y - 0.01)
      expect(l.ty + l.width).toBeLessThanOrEqual(l.target.y + l.target.h + 0.05)
    }
    const out = byId(g, 'Orders').sourceLinks
    expect(out[1]!.sy).toBeCloseTo(out[0]!.sy + out[0]!.width, 1)
  })
  it('is deterministic', () => {
    const a = JSON.stringify(laid().nodes.map((n) => [n.id, n.x, n.y, n.h]))
    expect(JSON.stringify(laid().nodes.map((n) => [n.id, n.x, n.y, n.h]))).toBe(a)
  })
  it('an empty graph is returned untouched', () => {
    expect(laid([]).nodes).toEqual([])
  })
  it('a tiny box and a huge padding still give finite, non-negative numbers', () => {
    const g = laid(flows, undefined, { width: 5, height: 5, nodeWidth: 10, padding: 500 })
    for (const n of g.nodes) for (const v of [n.x, n.y, n.h]) expect(Number.isFinite(v) && v >= 0).toBe(true)
    for (const l of g.links) for (const v of [l.sy, l.ty, l.width]) expect(Number.isFinite(v)).toBe(true)
  })
  it('zero height gives zero sized nodes instead of NaN', () => {
    const g = layoutSankey(buildGraph(undefined, flows), { width: 100, height: 0, nodeWidth: 4, padding: 12 })
    for (const n of g.nodes) expect(Number.isFinite(n.h)).toBe(true)
  })
  it('a single layer pair (one flow) works', () => {
    const g = laid([{ source: 'a', target: 'b', value: 5 }])
    expect(g.layers).toBe(2)
    expect(byId(g, 'a').h).toBeGreaterThan(0)
  })
  it('relaxation moves a node toward its neighbours and zero passes keep the stacked order', () => {
    const links = [{ source: 'a', target: 'x', value: 1 }, { source: 'b', target: 'y', value: 1 }, { source: 'c', target: 'z', value: 8 }]
    const none = laid(links, undefined, { ...opts, iterations: 0 })
    const some = laid(links, undefined, opts)
    expect(byId(none, 'a').y).toBe(0)
    expect(Number.isFinite(byId(some, 'x').y)).toBe(true)
  })
  it('lays out 2000 flows quickly', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ source: `s${i % 40}`, target: `m${i % 55}`, value: (i % 9) + 1 })).concat(Array.from({ length: 800 }, (_, i) => ({ source: `m${i % 55}`, target: `t${i % 20}`, value: (i % 7) + 1 })))
    const t = performance.now()
    const g = laid(many)
    expect(performance.now() - t).toBeLessThan(3000)
    expect(g.nodes.every((n) => Number.isFinite(n.y))).toBe(true)
  })
  it('pushes nodes back into the box from the bottom when they would overflow', () => {
    const g = laid([{ source: 'a', target: 'z', value: 1 }, { source: 'b', target: 'z', value: 1 }, { source: 'c', target: 'z', value: 1 }, { source: 'd', target: 'z', value: 100 }])
    for (const n of g.nodes) expect(n.y + n.h).toBeLessThanOrEqual(300.01)
  })
})

describe('ribbonPath', () => {
  it('is a closed band between the two node edges', () => {
    const g = laid()
    const l = g.links[0]!
    const d = ribbonPath(l, 10)
    expect(d.startsWith(`M${l.source.x + 10},${l.sy} C`)).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).not.toMatch(/NaN|Infinity/)
    expect(d).toContain(`L${l.target.x},${Math.round((l.ty + l.width) * 100) / 100}`)
  })
})
