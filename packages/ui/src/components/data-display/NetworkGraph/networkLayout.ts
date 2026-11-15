/**
 * Deterministic layouts for NetworkGraph. Every layout works in the unit square (0..1 on both axes), does not depend on
 * the rendered width, uses no randomness and no clock: the same graph always yields the same points.
 */
import type { NormGraph } from './graphData'

export interface UnitPoint {
  x: number
  y: number
}

export type NetworkLayout = 'force' | 'circular' | 'grid' | 'layered'
export const NETWORK_LAYOUTS: readonly NetworkLayout[] = ['force', 'circular', 'grid', 'layered']

export interface LayoutResult {
  points: UnitPoint[]
  /** Node indexes in reading order: the order of keyboard navigation and of the text alternative. */
  order: number[]
  /** True when x and y must keep their ratio (the circular layout stays a circle). */
  uniform: boolean
}

const GOLDEN_ANGLE = 2.399963229728653
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Total number of pair interactions the force layout may spend (keeps 300 nodes well under a tenth of a second). */
const FORCE_BUDGET = 2e7
export const FORCE_MIN_ITERATIONS = 12
export const FORCE_MAX_ITERATIONS = 220

/** Fixed iteration count for `n` nodes: a pure function of the size, so the result never depends on timing. */
export function forceIterations(n: number): number {
  const pairs = Math.max(1, (n * (n - 1)) / 2)
  return Math.min(FORCE_MAX_ITERATIONS, Math.max(FORCE_MIN_ITERATIONS, Math.floor(FORCE_BUDGET / pairs)))
}

/** Stretch the points so they span the whole unit square; a collapsed axis is centred. */
export function fitUnit(points: UnitPoint[]): UnitPoint[] {
  if (points.length === 0) return points
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (const p of points) {
    if (p.x < x0) x0 = p.x
    if (p.x > x1) x1 = p.x
    if (p.y < y0) y0 = p.y
    if (p.y > y1) y1 = p.y
  }
  const sx = x1 - x0
  const sy = y1 - y0
  return points.map((p) => ({ x: sx > 1e-9 ? (p.x - x0) / sx : 0.5, y: sy > 1e-9 ? (p.y - y0) / sy : 0.5 }))
}

/**
 * Fruchterman-Reingold on the unit square: a golden-angle spiral start, a fixed number of iterations, linear cooling,
 * and a pull to the centre so unconnected parts stay in view. The result is stretched to fill the square.
 */
export function forceLayout(g: NormGraph): UnitPoint[] {
  const n = g.nodes.length
  if (n === 0) return []
  if (n === 1) return [{ x: 0.5, y: 0.5 }]
  const px = new Float64Array(n)
  const py = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt((i + 0.5) / n) * 0.45
    px[i] = 0.5 + r * Math.cos(i * GOLDEN_ANGLE)
    py[i] = 0.5 + r * Math.sin(i * GOLDEN_ANGLE)
  }
  const edges = g.edges.filter((e) => !e.self)
  const ea = new Int32Array(edges.length)
  const eb = new Int32Array(edges.length)
  const es = new Float64Array(edges.length)
  edges.forEach((e, i) => {
    ea[i] = e.from
    eb[i] = e.to
    es[i] = Math.min(3, 1 + Math.log10(1 + (e.weight ?? 1)))
  })
  const k = Math.sqrt(1 / n)
  const k2 = k * k
  const gravity = 1.2 * k
  const iterations = forceIterations(n)
  const dx = new Float64Array(n)
  const dy = new Float64Array(n)
  for (let it = 0; it < iterations; it++) {
    const temp = 0.12 * (1 - it / iterations) + 0.002
    dx.fill(0)
    dy.fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let vx = px[i]! - px[j]!
        let vy = py[i]! - py[j]!
        let d2 = vx * vx + vy * vy
        if (d2 < 1e-10) {
          vx = ((i * 7 + j) % 5) * 1e-3 + 1e-3
          vy = ((i + j * 3) % 5) * 1e-3 + 1e-3
          d2 = vx * vx + vy * vy
        }
        const f = k2 / d2
        dx[i] = dx[i]! + vx * f
        dy[i] = dy[i]! + vy * f
        dx[j] = dx[j]! - vx * f
        dy[j] = dy[j]! - vy * f
      }
    }
    for (let e = 0; e < ea.length; e++) {
      const a = ea[e]!
      const b = eb[e]!
      const vx = px[a]! - px[b]!
      const vy = py[a]! - py[b]!
      const d = Math.sqrt(vx * vx + vy * vy)
      const f = (d / k) * es[e]!
      dx[a] = dx[a]! - vx * f
      dy[a] = dy[a]! - vy * f
      dx[b] = dx[b]! + vx * f
      dy[b] = dy[b]! + vy * f
    }
    for (let i = 0; i < n; i++) {
      const gx = dx[i]! - (px[i]! - 0.5) * gravity
      const gy = dy[i]! - (py[i]! - 0.5) * gravity
      const len = Math.sqrt(gx * gx + gy * gy)
      const s = len > temp ? temp / len : 1
      px[i] = clamp01(px[i]! + gx * s)
      py[i] = clamp01(py[i]! + gy * s)
    }
  }
  return fitUnit(Array.from({ length: n }, (_, i) => ({ x: px[i]!, y: py[i]! })))
}

/** Node indexes sorted by group (ungrouped last), ties by index, so groups sit together on a ring or grid. */
export function groupedOrder(g: NormGraph): number[] {
  return g.nodes
    .map((n, i) => ({ i, k: n.groupIndex < 0 ? Number.MAX_SAFE_INTEGER : n.groupIndex }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((o) => o.i)
}

export function circularLayout(g: NormGraph): { points: UnitPoint[]; order: number[] } {
  const n = g.nodes.length
  const order = groupedOrder(g)
  const points: UnitPoint[] = new Array(n)
  order.forEach((node, slot) => {
    const a = -Math.PI / 2 + (2 * Math.PI * slot) / n
    points[node] = n === 1 ? { x: 0.5, y: 0.5 } : { x: 0.5 + 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) }
  })
  return { points, order }
}

export function gridLayout(g: NormGraph): { points: UnitPoint[]; order: number[] } {
  const n = g.nodes.length
  const order = groupedOrder(g)
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
  const rows = Math.max(1, Math.ceil(n / cols))
  const points: UnitPoint[] = new Array(n)
  order.forEach((node, slot) => {
    points[node] = { x: (slot % cols + 0.5) / cols, y: (Math.floor(slot / cols) + 0.5) / rows }
  })
  return { points, order }
}

/**
 * Layer of every node for the layered layout. Cycles are broken deterministically: a depth-first search in node order
 * reverses every edge that points at a node still on the stack. Layers then follow the longest path. Self loops are ignored.
 */
export function layerRanks(g: NormGraph): { rank: number[]; dag: [number, number][] } {
  const n = g.nodes.length
  const out: number[][] = Array.from({ length: n }, () => [])
  for (const e of g.edges) if (!e.self) out[e.from]!.push(e.to)
  const state = new Uint8Array(n) // 0 new, 1 on the stack, 2 done
  const dag: [number, number][] = []
  const cursor = new Int32Array(n)
  for (let root = 0; root < n; root++) {
    if (state[root] !== 0) continue
    const stack = [root]
    state[root] = 1
    while (stack.length) {
      const u = stack[stack.length - 1]!
      if (cursor[u]! < out[u]!.length) {
        const v = out[u]![cursor[u]!++]!
        if (state[v] === 1) dag.push([v, u])
        else {
          dag.push([u, v])
          if (state[v] === 0) {
            state[v] = 1
            stack.push(v)
          }
        }
      } else {
        state[u] = 2
        stack.pop()
      }
    }
  }
  const indeg = new Int32Array(n)
  const succ: number[][] = Array.from({ length: n }, () => [])
  for (const [u, v] of dag) {
    succ[u]!.push(v)
    indeg[v] = indeg[v]! + 1
  }
  const rank = new Array<number>(n).fill(0)
  const queue: number[] = []
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i)
  for (let q = 0; q < queue.length; q++) {
    const u = queue[q]!
    for (const v of succ[u]!) {
      rank[v] = Math.max(rank[v]!, rank[u]! + 1)
      indeg[v] = indeg[v]! - 1
      if (indeg[v] === 0) queue.push(v)
    }
  }
  return { rank, dag }
}

export function layeredLayout(g: NormGraph): { points: UnitPoint[]; order: number[] } {
  const n = g.nodes.length
  const { rank, dag } = layerRanks(g)
  const depth = rank.reduce((m, r) => Math.max(m, r), 0) + 1
  const layers: number[][] = Array.from({ length: depth }, () => [])
  for (let i = 0; i < n; i++) layers[rank[i]!]!.push(i)
  const nb: number[][] = Array.from({ length: n }, () => [])
  for (const [u, v] of dag) {
    nb[u]!.push(v)
    nb[v]!.push(u)
  }
  const pos = new Array<number>(n).fill(0)
  const place = () => layers.forEach((l) => l.forEach((v, k) => (pos[v] = k)))
  place()
  // Barycentre sweeps reduce crossings: a few fixed passes, ties keep the current order.
  for (let pass = 0; pass < 6; pass++) {
    const ls = pass % 2 === 0 ? layers.slice(1) : layers.slice(0, -1).reverse()
    for (const l of ls) {
      const key = new Map<number, number>()
      for (const v of l) {
        const ns = nb[v]!.filter((u) => rank[u] !== rank[v])
        key.set(v, ns.length ? ns.reduce((s, u) => s + pos[u]!, 0) / ns.length : pos[v]!)
      }
      l.sort((a, b) => key.get(a)! - key.get(b)! || pos[a]! - pos[b]!)
      l.forEach((v, k) => (pos[v] = k))
    }
  }
  const points: UnitPoint[] = new Array(n)
  layers.forEach((l, r) => l.forEach((v, k) => (points[v] = { x: depth > 1 ? r / (depth - 1) : 0.5, y: (k + 0.5) / l.length })))
  return { points, order: layers.flat() }
}

export function computeNetworkLayout(g: NormGraph, layout: NetworkLayout): LayoutResult {
  const n = g.nodes.length
  const indexOrder = Array.from({ length: n }, (_, i) => i)
  if (layout === 'circular') return { ...circularLayout(g), uniform: true }
  if (layout === 'grid') return { ...gridLayout(g), uniform: false }
  if (layout === 'layered') return { ...layeredLayout(g), uniform: false }
  return { points: forceLayout(g), order: indexOrder, uniform: false }
}

/** Convex hull (Andrew's monotone chain), counter-clockwise, no repeated points. Fewer than 3 distinct points are returned as is. */
export function convexHull(points: UnitPoint[]): UnitPoint[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y).filter((p, i, a) => i === 0 || p.x !== a[i - 1]!.x || p.y !== a[i - 1]!.y)
  if (pts.length < 3) return pts
  const cross = (o: UnitPoint, a: UnitPoint, b: UnitPoint) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: UnitPoint[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: UnitPoint[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

/** Eight points on a circle of `pad` around every centre, so the hull of them encloses the nodes with a margin. */
export function padPoints(centres: { x: number; y: number }[], pad: number): UnitPoint[] {
  const out: UnitPoint[] = []
  for (const c of centres) for (let k = 0; k < 8; k++) out.push({ x: c.x + pad * Math.cos((k * Math.PI) / 4), y: c.y + pad * Math.sin((k * Math.PI) / 4) })
  return out
}
