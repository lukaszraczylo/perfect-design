import { describe, expect, it } from 'vitest'
import { normalizeGraph, type NormGraph } from './graphData'
import {
  FORCE_MAX_ITERATIONS, FORCE_MIN_ITERATIONS, circularLayout, computeNetworkLayout, convexHull, fitUnit, forceIterations, forceLayout, gridLayout, groupedOrder,
  layerRanks, layeredLayout, padPoints,
} from './networkLayout'

const ring = (n: number, closed = false): NormGraph =>
  normalizeGraph(Array.from({ length: n }, (_, i) => ({ id: `n${i}`, group: i % 2 ? 'odd' : 'even' })), Array.from({ length: closed ? n : n - 1 }, (_, i) => ({ from: `n${i}`, to: `n${(i + 1) % n}` })), 5000)
const graphOf = (n: number, m = n * 2): NormGraph =>
  normalizeGraph(Array.from({ length: n }, (_, i) => ({ id: `n${i}`, group: `g${i % 4}` })), Array.from({ length: m }, (_, i) => ({ from: `n${i % n}`, to: `n${(i * 7 + 3) % n}` })), 5000)
const inUnit = (pts: { x: number; y: number }[]) => pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
const minDist = (pts: { x: number; y: number }[]) => {
  let m = Infinity
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y))
  return m
}

describe('forceIterations', () => {
  it('is fixed per size: many for few nodes, fewer for many, always in range', () => {
    expect(forceIterations(2)).toBe(FORCE_MAX_ITERATIONS)
    expect(forceIterations(300)).toBe(FORCE_MAX_ITERATIONS)
    expect(forceIterations(1000)).toBeLessThan(FORCE_MAX_ITERATIONS)
    expect(forceIterations(1000)).toBeGreaterThan(FORCE_MIN_ITERATIONS)
    expect(forceIterations(5000)).toBe(FORCE_MIN_ITERATIONS)
    expect(forceIterations(0)).toBe(FORCE_MAX_ITERATIONS)
  })
})

describe('fitUnit', () => {
  it('stretches to the unit square and centres a collapsed axis', () => {
    expect(fitUnit([{ x: 2, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }])).toEqual([{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }, { x: 0.5, y: 0.5 }])
    expect(fitUnit([{ x: 7, y: 7 }])).toEqual([{ x: 0.5, y: 0.5 }])
    expect(fitUnit([])).toEqual([])
  })
})

describe('forceLayout', () => {
  it('handles 0, 1 and 2 nodes', () => {
    expect(forceLayout(normalizeGraph([], [], 300))).toEqual([])
    expect(forceLayout(normalizeGraph([{ id: 'a' }], [], 300))).toEqual([{ x: 0.5, y: 0.5 }])
    const two = forceLayout(normalizeGraph([{ id: 'a' }, { id: 'b' }], [{ from: 'a', to: 'b' }], 300))
    expect(two).toHaveLength(2)
    expect(inUnit(two)).toBe(true)
    expect(minDist(two)).toBeGreaterThan(0.1)
  })
  it('is deterministic: the same graph gives identical points', () => {
    expect(forceLayout(graphOf(40))).toEqual(forceLayout(graphOf(40)))
  })
  it('stays inside the unit square and keeps nodes apart', () => {
    const pts = forceLayout(graphOf(60))
    expect(inUnit(pts)).toBe(true)
    expect(minDist(pts)).toBeGreaterThan(0.005)
  })
  it('connected nodes end up closer than unconnected ones on average', () => {
    const g = graphOf(40, 40)
    const pts = forceLayout(g)
    const linked = g.edges.filter((e) => !e.self).map((e) => Math.hypot(pts[e.from]!.x - pts[e.to]!.x, pts[e.from]!.y - pts[e.to]!.y))
    let all = 0
    let count = 0
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++, count++) all += Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y)
    expect(linked.reduce((a, b) => a + b, 0) / linked.length).toBeLessThan(all / count)
  })
  it('keeps disconnected components and isolated nodes in view', () => {
    const g = normalizeGraph(
      Array.from({ length: 12 }, (_, i) => ({ id: `n${i}` })),
      [{ from: 'n0', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n5', to: 'n6' }],
      300,
    )
    const pts = forceLayout(g)
    expect(inUnit(pts)).toBe(true)
    expect(pts).toHaveLength(12)
  })
  it('separates nodes that start on the same spot (many identical, no edges)', () => {
    const pts = forceLayout(normalizeGraph(Array.from({ length: 30 }, (_, i) => ({ id: `x${i}` })), [], 300))
    expect(minDist(pts)).toBeGreaterThan(0)
  })
  it('ignores self loops and heavy weights without producing NaN', () => {
    const g = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [{ from: 'a', to: 'a' }, { from: 'a', to: 'b', weight: 1e300 }, { from: 'b', to: 'c', weight: 1e-300 }], 300)
    expect(inUnit(forceLayout(g))).toBe(true)
  })
  it('lays 300 nodes out quickly (generous bound; the real number is printed)', () => {
    const g = graphOf(300, 600)
    const t0 = performance.now()
    const r = computeNetworkLayout(g, 'force')
    const ms = performance.now() - t0
    console.info(`NetworkGraph force layout, 300 nodes / 600 edges: ${ms.toFixed(1)} ms`)
    expect(r.points).toHaveLength(300)
    expect(ms).toBeLessThan(1500)
  })
  it('lays 2000 nodes out in bounded time', () => {
    const g = graphOf(2000, 3000)
    const t0 = performance.now()
    const r = computeNetworkLayout(g, 'force')
    const ms = performance.now() - t0
    console.info(`NetworkGraph force layout, 2000 nodes / 3000 edges: ${ms.toFixed(1)} ms`)
    expect(inUnit(r.points)).toBe(true)
    expect(ms).toBeLessThan(5000)
  })
})

describe('circularLayout', () => {
  it('puts every node on one circle, the first at the top', () => {
    const { points } = circularLayout(ring(8))
    for (const p of points) expect(Math.hypot(p.x - 0.5, p.y - 0.5)).toBeCloseTo(0.5, 6)
    expect(points[0]!.x).toBeCloseTo(0.5, 6)
    expect(points[0]!.y).toBeCloseTo(0, 6)
  })
  it('a single node sits in the centre', () => {
    expect(circularLayout(normalizeGraph([{ id: 'a' }], [], 1)).points).toEqual([{ x: 0.5, y: 0.5 }])
  })
  it('puts groups next to each other and ungrouped nodes last', () => {
    const g = normalizeGraph([{ id: 'a', group: 'x' }, { id: 'b' }, { id: 'c', group: 'y' }, { id: 'd', group: 'x' }], [], 300)
    expect(groupedOrder(g)).toEqual([0, 3, 2, 1])
    expect(circularLayout(g).order).toEqual([0, 3, 2, 1])
  })
})

describe('gridLayout', () => {
  it('fills rows left to right on a square-ish grid', () => {
    const { points, order } = gridLayout(normalizeGraph(Array.from({ length: 5 }, (_, i) => ({ id: `n${i}` })), [], 300))
    expect(order).toEqual([0, 1, 2, 3, 4])
    expect(points[0]!.y).toBe(points[1]!.y)
    expect(points[3]!.y).toBeGreaterThan(points[0]!.y)
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(5)
    expect(inUnit(points)).toBe(true)
  })
  it('one node is centred', () => {
    expect(gridLayout(normalizeGraph([{ id: 'a' }], [], 300)).points).toEqual([{ x: 0.5, y: 0.5 }])
  })
})

describe('layered layout', () => {
  it('ranks a chain left to right', () => {
    const { rank } = layerRanks(ring(4))
    expect(rank).toEqual([0, 1, 2, 3])
    const { points } = layeredLayout(ring(4))
    expect(points.map((p) => p.x)).toEqual([0, 1 / 3, 2 / 3, 1])
  })
  it('uses the longest path for the layer', () => {
    const g = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'a', to: 'c' }], 300)
    expect(layerRanks(g).rank).toEqual([0, 1, 2])
  })
  it('breaks cycles deterministically and ignores self loops', () => {
    const g = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a' }, { from: 'b', to: 'b' }, { from: 'b', to: 'a' }], 300)
    const r = layerRanks(g)
    expect(r.rank).toEqual([0, 1, 2])
    expect(layerRanks(g)).toEqual(r)
    expect(r.dag.every(([u, v]) => r.rank[u]! < r.rank[v]!)).toBe(true)
  })
  it('places isolated nodes in the first layer and a lone node in the middle', () => {
    const g = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'iso' }], [{ from: 'a', to: 'b' }], 300)
    expect(layeredLayout(g).points[2]!.x).toBe(0)
    expect(layeredLayout(normalizeGraph([{ id: 'a' }], [], 300)).points).toEqual([{ x: 0.5, y: 0.5 }])
  })
  it('a fully cyclic graph still gets distinct layers and stays in range', () => {
    const { points, order } = layeredLayout(ring(30, true))
    expect(inUnit(points)).toBe(true)
    expect(order).toHaveLength(30)
    expect(new Set(order).size).toBe(30)
  })
  it('handles a deep chain of 3000 nodes without recursion limits', () => {
    const { rank } = layerRanks(ring(3000))
    expect(rank[2999]).toBe(2999)
  })
  it('reorders layers by neighbours (fewer crossings) and is deterministic', () => {
    const g = normalizeGraph(
      ['r', 'a', 'b', 'a2', 'b2'].map((id) => ({ id })),
      [{ from: 'r', to: 'a' }, { from: 'r', to: 'b' }, { from: 'b', to: 'a2' }, { from: 'a', to: 'b2' }],
      300,
    )
    const one = layeredLayout(g)
    expect(layeredLayout(g)).toEqual(one)
    // a2 hangs under b, b2 under a: the last layer follows its parents' vertical order
    const [a, b, a2, b2] = [1, 2, 3, 4].map((i) => one.points[i]!.y)
    expect((a! < b!) === (b2! < a2!)).toBe(true)
  })
})

describe('computeNetworkLayout', () => {
  it.each(['force', 'circular', 'grid', 'layered'] as const)('%s returns one finite point per node and a full reading order', (layout) => {
    const g = graphOf(25)
    const r = computeNetworkLayout(g, layout)
    expect(r.points).toHaveLength(25)
    expect(inUnit(r.points)).toBe(true)
    expect([...r.order].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i))
    expect(r.uniform).toBe(layout === 'circular')
  })
  it('the layouts differ from each other', () => {
    const g = graphOf(12)
    const all = (['force', 'circular', 'grid', 'layered'] as const).map((l) => JSON.stringify(computeNetworkLayout(g, l).points))
    expect(new Set(all).size).toBe(4)
  })
})

describe('convexHull and padPoints', () => {
  it('returns the corners of a square and drops inner points', () => {
    const h = convexHull([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }, { x: 2, y: 2 }, { x: 2, y: 0 }, { x: 0, y: 0 }])
    expect(h).toHaveLength(4)
    expect(new Set(h.map((p) => `${p.x},${p.y}`))).toEqual(new Set(['0,0', '4,0', '4,4', '0,4']))
  })
  it('fewer than three distinct points come back as they are (sorted, deduplicated)', () => {
    expect(convexHull([])).toEqual([])
    expect(convexHull([{ x: 1, y: 1 }, { x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }])
    expect(convexHull([{ x: 2, y: 0 }, { x: 1, y: 0 }])).toEqual([{ x: 1, y: 0 }, { x: 2, y: 0 }])
  })
  it('collinear points give the two ends', () => {
    expect(convexHull([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }])).toEqual([{ x: 0, y: 0 }, { x: 2, y: 2 }])
  })
  it('eight padded points per centre make an enclosing octagon', () => {
    const pts = padPoints([{ x: 10, y: 10 }], 5)
    expect(pts).toHaveLength(8)
    expect(convexHull(pts)).toHaveLength(8)
    const two = convexHull(padPoints([{ x: 0, y: 0 }, { x: 20, y: 0 }], 5))
    expect(Math.min(...two.map((p) => p.x))).toBeCloseTo(-5, 6)
    expect(Math.max(...two.map((p) => p.x))).toBeCloseTo(25, 6)
  })
})
