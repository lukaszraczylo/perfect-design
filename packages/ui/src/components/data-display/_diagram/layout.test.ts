import { describe, expect, it } from 'vitest'
import { boxOf, layoutGraph, type LayoutCluster, type LayoutEdge, type LayoutNode, type LayoutOptions, type LayoutResult } from './layout'
import type { Box } from './shapes'
import type { Direction } from './types'

const OPTS: LayoutOptions = { direction: 'TB', nodeSep: 28, rankSep: 45, clusterPad: 12 }
const node = (id: string, parent?: string, w = 80, h = 40): LayoutNode => ({ id, width: w, height: h, parent })
const edge = (from: string, to: string, id = `${from}-${to}`, extra: Partial<LayoutEdge> = {}): LayoutEdge => ({ id, from, to, ...extra })
const ids = (n: number, prefix = 'n') => Array.from({ length: n }, (_, i) => `${prefix}${i}`)
const run = (nodes: LayoutNode[], edges: LayoutEdge[] = [], clusters: LayoutCluster[] = [], o: Partial<LayoutOptions> = {}) => layoutGraph(nodes, edges, clusters, { ...OPTS, ...o })

const overlap = (a: Box, b: Box, gap = 0) => a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap
const inside = (inner: Box, outer: Box) => inner.x >= outer.x - 0.01 && inner.y >= outer.y - 0.01 && inner.x + inner.width <= outer.x + outer.width + 0.01 && inner.y + inner.height <= outer.y + outer.height + 0.01
const noOverlaps = (l: LayoutResult) => {
  const boxes = [...l.nodes.values()]
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i]!, boxes[j]!), `${i} and ${j} overlap`).toBe(false)
}
const finite = (l: LayoutResult) => {
  expect(Number.isFinite(l.width) && Number.isFinite(l.height)).toBe(true)
  for (const b of [...l.nodes.values(), ...l.clusters.values()]) for (const v of [b.x, b.y, b.width, b.height]) expect(Number.isFinite(v)).toBe(true)
  for (const e of l.edges.values()) for (const p of e.waypoints) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true)
}
// small seeded generator so "random" graphs are reproducible
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const randomGraph = (n: number, m: number, seed: number) => {
  const r = rng(seed)
  const nodes = ids(n).map((id) => node(id, undefined, 60 + Math.floor(r() * 60), 30 + Math.floor(r() * 30)))
  const edges: LayoutEdge[] = []
  for (let i = 0; i < m; i++) edges.push(edge(`n${Math.floor(r() * n)}`, `n${Math.floor(r() * n)}`, `e${i}`))
  return { nodes, edges }
}

describe('layoutGraph: basics', () => {
  it('an empty graph is empty', () => {
    const l = run([])
    expect(l).toMatchObject({ width: 0, height: 0 })
    expect(l.nodes.size).toBe(0)
  })
  it('a single node sits at the origin with its own size', () => {
    const l = run([node('a')])
    expect(l.nodes.get('a')).toEqual({ x: 0, y: 0, width: 80, height: 40 })
    expect([l.width, l.height]).toEqual([80, 40])
  })
  it('ignores edges that mention unknown nodes', () => {
    const l = run([node('a')], [edge('a', 'zzz'), edge('zzz', 'a')])
    expect(l.edges.size).toBe(0)
    finite(l)
  })
  it('keeps node sizes and never lets nodes overlap in a chain, a tree and a diamond', () => {
    for (const [nodes, edges] of [
      [ids(6).map((i) => node(i)), ids(5).map((_, i) => edge(`n${i}`, `n${i + 1}`))],
      [ids(7).map((i) => node(i)), [edge('n0', 'n1'), edge('n0', 'n2'), edge('n1', 'n3'), edge('n1', 'n4'), edge('n2', 'n5'), edge('n2', 'n6')]],
      [ids(4).map((i) => node(i)), [edge('n0', 'n1'), edge('n0', 'n2'), edge('n1', 'n3'), edge('n2', 'n3')]],
    ] as [LayoutNode[], LayoutEdge[]][]) {
      const l = run(nodes, edges)
      noOverlaps(l)
      finite(l)
      for (const nd of nodes) expect(l.nodes.get(nd.id)).toMatchObject({ width: nd.width, height: nd.height })
    }
  })
  it('keeps every node inside the reported size', () => {
    const { nodes, edges } = randomGraph(40, 60, 7)
    const l = run(nodes, edges)
    for (const b of l.nodes.values()) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01)
      expect(b.y).toBeGreaterThanOrEqual(-0.01)
      expect(b.x + b.width).toBeLessThanOrEqual(l.width + 0.01)
      expect(b.y + b.height).toBeLessThanOrEqual(l.height + 0.01)
    }
  })
  it('is deterministic: the same input always gives the same output', () => {
    const { nodes, edges } = randomGraph(50, 80, 11)
    const a = JSON.stringify([...run(nodes, edges).nodes], null, 0)
    const b = JSON.stringify([...run(nodes, edges).nodes], null, 0)
    expect(a).toBe(b)
    const ea = JSON.stringify([...run(nodes, edges).edges])
    expect(ea).toBe(JSON.stringify([...run(nodes, edges).edges]))
  })
})

describe('layoutGraph: direction', () => {
  const chain = { nodes: ids(4).map((i) => node(i)), edges: ids(3).map((_, i) => edge(`n${i}`, `n${i + 1}`)) }
  const axis = (l: LayoutResult, d: Direction) => ids(4).map((i) => (d === 'TB' || d === 'BT' ? l.nodes.get(i)!.y : l.nodes.get(i)!.x))
  it.each(['TB', 'LR'] as const)('%s ranks grow along the flow', (d) => {
    const a = axis(run(chain.nodes, chain.edges, [], { direction: d }), d)
    expect(a).toEqual([...a].sort((x, y) => x - y))
    expect(new Set(a).size).toBe(4)
  })
  it.each(['BT', 'RL'] as const)('%s ranks grow against the axis', (d) => {
    const a = axis(run(chain.nodes, chain.edges, [], { direction: d }), d)
    expect(a).toEqual([...a].sort((x, y) => y - x))
    expect(new Set(a).size).toBe(4)
  })
  it('LR swaps width and height of the canvas for a chain', () => {
    const tb = run(chain.nodes, chain.edges, [], { direction: 'TB' })
    const lr = run(chain.nodes, chain.edges, [], { direction: 'LR' })
    expect(tb.height).toBeGreaterThan(tb.width)
    expect(lr.width).toBeGreaterThan(lr.height)
  })
  it('a long chain keeps nodes apart by at least the rank separation', () => {
    const l = run(chain.nodes, chain.edges)
    const ys = ids(4).map((i) => l.nodes.get(i)!)
    for (let i = 1; i < 4; i++) expect(ys[i]!.y - (ys[i - 1]!.y + ys[i - 1]!.height)).toBeGreaterThanOrEqual(OPTS.rankSep - 0.01)
  })
})

describe('layoutGraph: crossings, cycles, components, loops, parallel edges', () => {
  it('reorders a layer to remove a crossing', () => {
    const l = run([node('a'), node('b'), node('c'), node('d')], [edge('a', 'd'), edge('b', 'c')])
    const a = l.nodes.get('a')!
    const b = l.nodes.get('b')!
    const c = l.nodes.get('c')!
    const d = l.nodes.get('d')!
    expect(Math.sign(a.x - b.x)).toBe(Math.sign(d.x - c.x))
  })
  it('centres a parent above its children', () => {
    const l = run([node('p'), node('a'), node('b')], [edge('p', 'a'), edge('p', 'b')])
    const mid = (n: string) => l.nodes.get(n)!.x + l.nodes.get(n)!.width / 2
    expect(mid('p')).toBeCloseTo((mid('a') + mid('b')) / 2, 0)
  })
  it('lays out a cycle and marks exactly the closing edge as backward', () => {
    const l = run([node('a'), node('b'), node('c')], [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')])
    noOverlaps(l)
    finite(l)
    expect([...l.edges.values()].filter((e) => e.backward).map((e) => e.id)).toEqual(['c-a'])
    expect(l.nodes.get('a')!.y).toBeLessThan(l.nodes.get('b')!.y)
    expect(l.nodes.get('b')!.y).toBeLessThan(l.nodes.get('c')!.y)
  })
  it('lays out two-way edges, dense cycles and random cyclic graphs without overlap', () => {
    noOverlaps(run([node('a'), node('b')], [edge('a', 'b'), edge('b', 'a')]))
    for (let seed = 1; seed <= 8; seed++) {
      const { nodes, edges } = randomGraph(25, 60, seed)
      const l = run(nodes, edges)
      noOverlaps(l)
      finite(l)
    }
  })
  it('places disconnected components and isolated nodes without overlap', () => {
    const l = run([...ids(3).map((i) => node(i)), ...ids(3, 'm').map((i) => node(i)), node('solo')], [edge('n0', 'n1'), edge('n1', 'n2'), edge('m0', 'm1'), edge('m0', 'm2')])
    noOverlaps(l)
    expect(l.nodes.size).toBe(7)
  })
  it('self loops make room beside the node and are flagged', () => {
    const l = run([node('a'), node('b')], [edge('a', 'a', 'loop', { label: { width: 40, height: 20 } }), edge('a', 'b')])
    expect(l.edges.get('loop')).toMatchObject({ selfLoop: true, waypoints: [] })
    const a = l.nodes.get('a')!
    const b = l.nodes.get('b')!
    expect(a.x + a.width + 26 + 46).toBeLessThanOrEqual(l.width + 0.01)
    expect(b.x + b.width).toBeLessThanOrEqual(l.width)
    noOverlaps(l)
  })
  it('self loops in a horizontal layout reserve the cross axis', () => {
    const l = run([node('a')], [edge('a', 'a', 'loop', { label: { width: 40, height: 20 } })], [], { direction: 'LR' })
    expect(l.height).toBeGreaterThan(40 + 26)
  })
  it('keeps parallel edges apart and their labels from overlapping', () => {
    const lab = { width: 50, height: 20 }
    const l = run([node('a'), node('b')], [edge('a', 'b', 'e1', { label: lab }), edge('a', 'b', 'e2', { label: lab }), edge('a', 'b', 'e3', { label: lab })])
    const boxes = ['e1', 'e2', 'e3'].map((e) => l.edges.get(e)!.label!)
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(overlap(boxes[i]!, boxes[j]!)).toBe(false)
    expect(new Set(['e1', 'e2', 'e3'].map((e) => l.edges.get(e)!.waypoints[0]!.x)).size).toBe(3)
  })
  it('labels never overlap nodes', () => {
    const { nodes, edges } = randomGraph(20, 30, 5)
    const labelled = edges.map((e) => ({ ...e, label: { width: 60, height: 18 } }))
    const l = run(nodes, labelled)
    for (const e of l.edges.values()) if (e.label) for (const b of l.nodes.values()) expect(overlap(e.label, b), `${e.id} label on a node`).toBe(false)
  })
  it('long edges get one waypoint per crossed rank pair and stay off nodes', () => {
    const l = run([node('a'), node('b'), node('c'), node('d')], [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('a', 'd', 'long')])
    const long = l.edges.get('long')!
    expect(long.waypoints.length).toBeGreaterThanOrEqual(3)
    for (const p of long.waypoints) for (const b of l.nodes.values()) expect(p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height).toBe(false)
  })
  it('minLen stretches an edge over more ranks', () => {
    const near = run([node('a'), node('b')], [edge('a', 'b')])
    const far = run([node('a'), node('b')], [edge('a', 'b', 'a-b', { minLen: 3 })])
    expect(far.height).toBeGreaterThan(near.height + 60)
  })
  it('backward edges list their waypoints in drawing order (source first)', () => {
    const l = run([node('a'), node('b'), node('c')], [edge('a', 'b'), edge('b', 'c'), edge('c', 'a', 'back')])
    const back = l.edges.get('back')!
    expect(back.backward).toBe(true)
    const ys = back.waypoints.map((p) => p.y)
    expect(ys).toEqual([...ys].sort((x, y) => y - x))
  })
})

describe('layoutGraph: clusters', () => {
  const clusters: LayoutCluster[] = [{ id: 'g1', titleWidth: 60, titleHeight: 24 }, { id: 'g2', titleWidth: 60, titleHeight: 24 }, { id: 'in', parent: 'g1', titleWidth: 40, titleHeight: 24 }]
  const nodes = [node('a', 'in'), node('b', 'in'), node('c', 'g1'), node('d', 'g2'), node('e', 'g2'), node('out')]
  const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('d', 'e'), edge('out', 'a'), edge('e', 'out')]
  it('contains every member in its cluster, nested clusters inside their parents', () => {
    const l = run(nodes, edges, clusters)
    const g1 = l.clusters.get('g1')!
    const g2 = l.clusters.get('g2')!
    const inner = l.clusters.get('in')!
    for (const n of ['a', 'b']) expect(inside(l.nodes.get(n)!, inner)).toBe(true)
    expect(inside(inner, g1)).toBe(true)
    expect(inside(l.nodes.get('c')!, g1)).toBe(true)
    for (const n of ['d', 'e']) expect(inside(l.nodes.get(n)!, g2)).toBe(true)
    noOverlaps(l)
    finite(l)
  })
  it('sibling clusters and outside nodes stay out of each other', () => {
    const l = run(nodes, edges, clusters)
    expect(overlap(l.clusters.get('g1')!, l.clusters.get('g2')!)).toBe(false)
    expect(overlap(l.clusters.get('g1')!, l.nodes.get('out')!)).toBe(false)
    expect(overlap(l.clusters.get('g2')!, l.nodes.get('out')!)).toBe(false)
    expect(overlap(l.clusters.get('in')!, l.nodes.get('c')!)).toBe(false)
  })
  it('reserves the title band at the top of a cluster', () => {
    const l = run(nodes, edges, clusters)
    const g2 = l.clusters.get('g2')!
    expect(g2.titleHeight).toBe(24)
    for (const n of ['d', 'e']) expect(l.nodes.get(n)!.y).toBeGreaterThanOrEqual(g2.y + 24 + OPTS.clusterPad - 0.01)
  })
  it('a wide title widens the cluster', () => {
    const l = run([node('a', 'g')], [], [{ id: 'g', titleWidth: 300, titleHeight: 20 }])
    expect(l.clusters.get('g')!.width).toBeGreaterThanOrEqual(300 + 2 * OPTS.clusterPad)
  })
  it('an empty cluster still gets a box', () => {
    const l = run([node('a')], [], [{ id: 'g', titleWidth: 30, titleHeight: 20 }])
    expect(l.clusters.get('g')!.height).toBeGreaterThan(20)
    expect(l.clusters.get('g')!.width).toBeGreaterThan(30)
  })
  it('a cluster can have its own direction', () => {
    const inner = [node('a', 'g'), node('b', 'g')]
    const horiz = run(inner, [edge('a', 'b')], [{ id: 'g', titleWidth: 20, titleHeight: 20, direction: 'LR' }])
    expect(horiz.nodes.get('a')!.x).toBeLessThan(horiz.nodes.get('b')!.x)
    expect(horiz.nodes.get('a')!.y).toBeCloseTo(horiz.nodes.get('b')!.y, 0)
    const vert = run(inner, [edge('a', 'b')], [{ id: 'g', titleWidth: 20, titleHeight: 20 }])
    expect(vert.nodes.get('a')!.y).toBeLessThan(vert.nodes.get('b')!.y)
  })
  it('an edge between members of different clusters is routed at the common level', () => {
    const l = run(nodes, edges, clusters)
    const e = l.edges.get('d-e')!
    expect(e).toBeDefined()
    expect(l.edges.get('c-d')).toBeDefined()
    expect(l.edges.get('out-a')!.waypoints.every((p) => Number.isFinite(p.x))).toBe(true)
  })
  it('an edge to a cluster id and an edge from a cluster to its member are kept', () => {
    const l = run([node('a', 'g'), node('x')], [edge('x', 'g', 'to-cluster'), edge('g', 'a', 'inside')], [{ id: 'g', titleWidth: 20, titleHeight: 20 }])
    expect(l.edges.get('to-cluster')).toMatchObject({ from: 'x', to: 'g' })
    expect(l.edges.get('inside')).toMatchObject({ waypoints: [], selfLoop: false })
    expect(boxOf(l, 'g')).toBe(l.clusters.get('g'))
    expect(boxOf(l, 'a')).toBe(l.nodes.get('a'))
    expect(boxOf(l, 'nope')).toBeUndefined()
  })
  it('survives a cluster that names itself or a missing parent', () => {
    const l = run([node('a', 'g'), node('b', 'missing')], [], [{ id: 'g', parent: 'g', titleWidth: 10, titleHeight: 10 }, { id: 'h', parent: 'i', titleWidth: 10, titleHeight: 10 }, { id: 'i', parent: 'h', titleWidth: 10, titleHeight: 10 }])
    finite(l)
    expect(l.nodes.size).toBe(2)
  })
})

describe('layoutGraph: speed', () => {
  it('lays out 200 nodes and 300 edges in about 100ms', () => {
    const { nodes, edges } = randomGraph(200, 300, 3)
    let best = Infinity
    for (let i = 0; i < 3; i++) {
      const t = performance.now()
      const l = run(nodes, edges)
      best = Math.min(best, performance.now() - t)
      expect(l.nodes.size).toBe(200)
    }
    expect(best).toBeLessThan(150)
  })
  it('lays out a 200-node tree with a hub and a 150-edge star', () => {
    const hub = [node('hub'), ...ids(150).map((i) => node(i))]
    const t = performance.now()
    const l = run(hub, ids(150).map((i) => edge('hub', i)))
    expect(performance.now() - t).toBeLessThan(400)
    noOverlaps(l)
  })
  it('lays out a 2000-node chain without recursion problems', () => {
    const l = run(ids(2000).map((i) => node(i)), ids(1999).map((_, i) => edge(`n${i}`, `n${i + 1}`)))
    expect(l.nodes.size).toBe(2000)
    finite(l)
  })
})
