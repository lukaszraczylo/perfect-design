/**
 * Layered (Sugiyama-style) graph layout, written for this library (no dagre, no elk).
 *
 *  1. cycle removal: depth-first search reverses back edges (deterministic, input order);
 *  2. rank assignment by longest path (edge lengths doubled so every edge owns an in-between rank for its label), then
 *     sources are pulled down toward their successors so short edges stay short;
 *  3. long edges become chains of dummy vertices, one per crossed rank;
 *  4. crossing reduction: barycentre sweeps down and up, the best ordering is kept (crossings are counted with a
 *     Fenwick tree);
 *  5. coordinate assignment: every layer is placed at the weighted mean of its neighbours' positions with order and
 *     minimum separation preserved (pool-adjacent-violators), long edges weighted so they stay straight;
 *  6. clusters (subgraphs) are laid out bottom-up as boxes of their own, so a cluster can never overlap a sibling and
 *     always contains its members. Nested clusters recurse; a cluster may have its own direction.
 *
 * Everything is deterministic: the same input always yields the same output.
 */
import type { Box, NodeShape } from './shapes'
import type { Direction, Point } from './types'

export interface LayoutNode {
  id: string
  width: number
  height: number
  shape?: NodeShape
  /** Id of the containing cluster. */
  parent?: string
}

export interface LayoutEdge {
  id: string
  from: string
  to: string
  label?: { width: number; height: number }
  /** Number of ranks the edge spans at least (1 = adjacent). Longer arrows (`---->`) use more. */
  minLen?: number
}

export interface LayoutCluster {
  id: string
  parent?: string
  titleWidth: number
  titleHeight: number
  direction?: Direction
}

export interface LayoutOptions {
  direction: Direction
  nodeSep: number
  rankSep: number
  clusterPad: number
  /** Space reserved beside a node for self loops. */
  loopSize?: number
}

export interface PlacedEdge {
  id: string
  from: string
  to: string
  /** Intermediate points in drawing order (from `from` to `to`); the end points are added by the router. */
  waypoints: Point[]
  label?: Box
  selfLoop: boolean
  /** Layout direction of the level the edge lives in. */
  direction: Direction
  /** The edge points against the layout direction (a back edge in a cycle). */
  backward: boolean
}

export interface PlacedCluster extends Box {
  titleHeight: number
}

export interface LayoutResult {
  width: number
  height: number
  nodes: Map<string, Box>
  clusters: Map<string, PlacedCluster>
  edges: Map<string, PlacedEdge>
}

/* ------------------------------------------------------------------ one level (no clusters) */

interface Item {
  id: string
  w: number
  h: number
  /** Extra cross-axis room on each side for self loops. */
  loopSpace: number
}
interface EdgeRef {
  id: string
  a: string
  b: string
  label?: { width: number; height: number }
  minLen: number
}
interface Route {
  pts: Point[]
  label?: Box
  backward: boolean
}
interface LevelLayout {
  width: number
  height: number
  pos: Map<string, Box>
  routes: Map<string, Route>
}

const EDGE_SEP = 14
const MAX_SWEEPS = 24
const ITERATIONS = 10

function fenwickCrossings(layers: number[][], down: number[][], pos: Int32Array): number {
  let total = 0
  for (let r = 0; r + 1 < layers.length; r++) {
    const lower = layers[r + 1]!.length
    const tree = new Int32Array(lower + 2)
    let inserted = 0
    for (const u of layers[r]!) {
      const targets = down[u]!
      for (const v of targets) {
        // edges inserted earlier that end right of v cross this one
        let i = pos[v]! + 1
        let le = 0
        while (i > 0) {
          le += tree[i]!
          i -= i & -i
        }
        total += inserted - le
      }
      for (const v of targets) {
        for (let i = pos[v]! + 1; i <= lower; i += i & -i) tree[i]!++
        inserted++
      }
    }
  }
  return total
}

/** Place a layer: minimise the weighted squared distance to the desired centres, keeping order and gaps. */
function placeLayer(desired: number[], weights: number[], gaps: number[]): number[] {
  const n = desired.length
  const offset: number[] = new Array(n)
  offset[0] = 0
  for (let i = 1; i < n; i++) offset[i] = offset[i - 1]! + gaps[i - 1]!
  const blocks: { sum: number; w: number; count: number }[] = []
  for (let i = 0; i < n; i++) {
    blocks.push({ sum: weights[i]! * (desired[i]! - offset[i]!), w: weights[i]!, count: 1 })
    while (blocks.length > 1) {
      const top = blocks[blocks.length - 1]!
      const prev = blocks[blocks.length - 2]!
      if (top.sum / top.w >= prev.sum / prev.w) break
      prev.sum += top.sum
      prev.w += top.w
      prev.count += top.count
      blocks.pop()
    }
  }
  const out: number[] = []
  for (const b of blocks) for (let k = 0; k < b.count; k++) out.push(b.sum / b.w + offset[out.length]!)
  return out
}

function layoutLevel(items: Item[], edges: EdgeRef[], dir: Direction, o: LayoutOptions): LevelLayout {
  const horizontal = dir === 'LR' || dir === 'RL'
  const n = items.length
  const index = new Map<string, number>()
  items.forEach((it, i) => index.set(it.id, i))
  if (n === 0) return { width: 0, height: 0, pos: new Map(), routes: new Map() }

  // vertex arrays (real vertices first, dummies appended)
  const vw: number[] = items.map((it) => (horizontal ? it.h : it.w) + 2 * it.loopSpace)
  const vh: number[] = items.map((it) => (horizontal ? it.w : it.h))
  const dummy: boolean[] = items.map(() => false)

  interface E { ref: EdgeRef; u: number; v: number; rev: boolean; len: number; chain: number[] }
  const es: E[] = []
  const routes = new Map<string, Route>()
  for (const ref of edges) {
    const a = index.get(ref.a)
    const b = index.get(ref.b)
    if (a === undefined || b === undefined) continue
    if (a === b) {
      routes.set(ref.id, { pts: [], backward: false })
      continue
    }
    es.push({ ref, u: a, v: b, rev: false, len: Math.max(1, Math.floor(ref.minLen)), chain: [] })
  }

  // 1. cycle removal
  const outE: number[][] = items.map(() => [])
  es.forEach((e, i) => outE[e.u]!.push(i))
  const color = new Uint8Array(n)
  const hasIn = new Uint8Array(n)
  for (const e of es) hasIn[e.v] = 1
  // start from vertices nothing points to, so a cycle is cut at its back edge and not at its entrance
  const starts = [...Array.from({ length: n }, (_, i) => i).filter((i) => !hasIn[i]), ...Array.from({ length: n }, (_, i) => i).filter((i) => hasIn[i])]
  for (const s of starts) {
    if (color[s]) continue
    const stack: [number, number][] = [[s, 0]]
    color[s] = 1
    while (stack.length) {
      const top = stack[stack.length - 1]!
      const list = outE[top[0]]!
      if (top[1] >= list.length) {
        color[top[0]] = 2
        stack.pop()
        continue
      }
      const e = es[list[top[1]++]!]!
      if (color[e.v] === 1) e.rev = true
      else if (color[e.v] === 0) {
        color[e.v] = 1
        stack.push([e.v, 0])
      }
    }
  }
  for (const e of es) if (e.rev) [e.u, e.v] = [e.v, e.u]

  // 2. ranks
  const inE: number[][] = items.map(() => [])
  const outD: number[][] = items.map(() => [])
  es.forEach((e, i) => {
    inE[e.v]!.push(i)
    outD[e.u]!.push(i)
  })
  const indeg = inE.map((l) => l.length)
  const topo: number[] = []
  const queue: number[] = []
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i)
  for (let qi = 0; qi < queue.length; qi++) {
    const u = queue[qi]!
    topo.push(u)
    for (const ei of outD[u]!) {
      const v = es[ei]!.v
      if (--indeg[v]! === 0) queue.push(v)
    }
  }
  const rank = new Array<number>(n).fill(0)
  for (const u of topo) for (const ei of outD[u]!) rank[es[ei]!.v] = Math.max(rank[es[ei]!.v]!, rank[u]! + 2 * es[ei]!.len)
  for (let k = topo.length - 1; k >= 0; k--) {
    const u = topo[k]!
    if (inE[u]!.length === 0 && outD[u]!.length > 0) rank[u] = Math.min(...outD[u]!.map((ei) => rank[es[ei]!.v]! - 2 * es[ei]!.len))
  }
  const base = Math.min(...rank)
  for (let i = 0; i < n; i++) rank[i]! -= base

  // 3. dummies
  const layerOf: number[] = [...rank]
  const up: number[][] = items.map(() => [])
  const down: number[][] = items.map(() => [])
  const link = (a: number, b: number) => {
    down[a]!.push(b)
    up[b]!.push(a)
  }
  for (const e of es) {
    const steps = rank[e.v]! - rank[e.u]!
    let prev = e.u
    const mid = Math.floor((steps - 2) / 2)
    for (let k = 1; k < steps; k++) {
      const d = vw.length
      const isLabel = !!e.ref.label && k - 1 === mid
      vw.push(isLabel ? (horizontal ? e.ref.label!.height : e.ref.label!.width) + 10 : 4)
      vh.push(isLabel ? (horizontal ? e.ref.label!.width : e.ref.label!.height) : 0)
      dummy.push(true)
      layerOf.push(rank[e.u]! + k)
      up.push([])
      down.push([])
      e.chain.push(d)
      link(prev, d)
      prev = d
    }
    link(prev, e.v)
  }
  const total = vw.length
  const layerCount = Math.max(...layerOf) + 1

  // 4. initial order by depth-first traversal, then barycentre sweeps
  const layers: number[][] = Array.from({ length: layerCount }, () => [])
  const seen = new Uint8Array(total)
  const visit = (s: number) => {
    const stack = [s]
    while (stack.length) {
      const v = stack.pop()!
      if (seen[v]) continue
      seen[v] = 1
      layers[layerOf[v]!]!.push(v)
      const ds = down[v]!
      for (let k = ds.length - 1; k >= 0; k--) if (!seen[ds[k]!]) stack.push(ds[k]!)
    }
  }
  for (let i = 0; i < n; i++) if (up[i]!.length === 0) visit(i)
  for (let i = 0; i < n; i++) visit(i)

  const pos = new Int32Array(total)
  const reindex = (L: number[][]) => L.forEach((l) => l.forEach((v, i) => (pos[v] = i)))
  reindex(layers)
  let best = layers.map((l) => [...l])
  let bestCross = fenwickCrossings(layers, down, pos)
  let stale = 0
  for (let sweep = 0; sweep < MAX_SWEEPS && bestCross > 0 && stale < 6; sweep++) {
    const downward = sweep % 2 === 0
    const range = downward ? Array.from({ length: layerCount - 1 }, (_, i) => i + 1) : Array.from({ length: layerCount - 1 }, (_, i) => layerCount - 2 - i)
    for (const r of range) {
      const adj = downward ? up : down
      const keyed = layers[r]!.map((v, i) => {
        const nb = adj[v]!
        let sum = 0
        for (const w of nb) sum += pos[w]!
        return { v, key: nb.length ? sum / nb.length : i, i }
      })
      keyed.sort((p, q) => p.key - q.key || p.i - q.i)
      layers[r] = keyed.map((k) => k.v)
      layers[r]!.forEach((v, i) => (pos[v] = i))
    }
    const c = fenwickCrossings(layers, down, pos)
    if (c < bestCross) {
      bestCross = c
      best = layers.map((l) => [...l])
      stale = 0
    } else stale++
  }
  for (let r = 0; r < layerCount; r++) layers[r] = best[r]!
  reindex(layers)

  // 5. coordinates
  const x = new Float64Array(total)
  const sep = (a: number, b: number) => {
    const da = dummy[a]!
    const db = dummy[b]!
    return (vw[a]! + vw[b]!) / 2 + (da && db ? EDGE_SEP : da || db ? (o.nodeSep + EDGE_SEP) / 2 : o.nodeSep)
  }
  const weight = (a: number, b: number) => (dummy[a]! && dummy[b]! ? 6 : dummy[a]! || dummy[b]! ? 2 : 1)
  // initial packing, centred per layer
  for (const l of layers) {
    if (!l.length) continue
    let c = 0
    x[l[0]!] = 0
    for (let i = 1; i < l.length; i++) {
      c += sep(l[i - 1]!, l[i]!)
      x[l[i]!] = c
    }
    const mid = (x[l[l.length - 1]!]! + x[l[0]!]!) / 2
    for (const v of l) x[v] = x[v]! - mid
  }
  const relax = (r: number) => {
    const l = layers[r]!
    if (l.length === 0) return
    const desired: number[] = []
    const weights: number[] = []
    for (const v of l) {
      let sum = 0
      let w = 0
      for (const nb of up[v]!) {
        const ww = weight(v, nb)
        sum += ww * x[nb]!
        w += ww
      }
      for (const nb of down[v]!) {
        const ww = weight(v, nb)
        sum += ww * x[nb]!
        w += ww
      }
      desired.push(w ? sum / w : x[v]!)
      weights.push(w || 0.5)
    }
    const gaps = l.slice(1).map((v, i) => sep(l[i]!, v))
    const placed = placeLayer(desired, weights, gaps)
    l.forEach((v, i) => (x[v] = placed[i]!))
  }
  for (let it = 0; it < ITERATIONS; it++) {
    for (let r = 0; r < layerCount; r++) relax(r)
    for (let r = layerCount - 1; r >= 0; r--) relax(r)
  }

  // 6. ranks to coordinates
  const thickness = layers.map((l) => Math.max(0, ...l.map((v) => vh[v]!)))
  const gap = o.rankSep / 2
  const top: number[] = []
  let cursor = 0
  for (let r = 0; r < layerCount; r++) {
    top.push(cursor)
    cursor += thickness[r]! + gap
  }
  const intH = Math.max(0, cursor - gap)
  let minX = Infinity
  let maxX = -Infinity
  for (let v = 0; v < total; v++) {
    minX = Math.min(minX, x[v]! - vw[v]! / 2)
    maxX = Math.max(maxX, x[v]! + vw[v]! / 2)
  }
  const intW = maxX - minX
  const center = (v: number): Point => ({ x: x[v]! - minX, y: top[layerOf[v]!]! + thickness[layerOf[v]!]! / 2 })
  const toOut = (p: Point): Point => {
    switch (dir) {
      case 'BT': return { x: p.x, y: intH - p.y }
      case 'LR': return { x: p.y, y: p.x }
      case 'RL': return { x: intH - p.y, y: p.x }
      default: return p
    }
  }
  const width = horizontal ? intH : intW
  const height = horizontal ? intW : intH

  const posOut = new Map<string, Box>()
  items.forEach((it, i) => {
    const c = toOut(center(i))
    posOut.set(it.id, { x: c.x - it.w / 2, y: c.y - it.h / 2, width: it.w, height: it.h })
  })
  for (const e of es) {
    let pts = e.chain.map((d) => toOut(center(d)))
    let label: Box | undefined
    if (e.ref.label) {
      const mid = e.chain[Math.floor((e.chain.length - 1) / 2)]
      if (mid !== undefined) {
        const c = toOut(center(mid))
        label = { x: c.x - e.ref.label.width / 2, y: c.y - e.ref.label.height / 2, width: e.ref.label.width, height: e.ref.label.height }
      }
    }
    if (e.rev) pts = pts.reverse()
    routes.set(e.ref.id, { pts, label, backward: e.rev })
  }
  return { width, height, pos: posOut, routes }
}

/* ------------------------------------------------------------------ clusters */

const ROOT = ''

export function layoutGraph(nodes: LayoutNode[], edges: LayoutEdge[], clusters: LayoutCluster[], opts: LayoutOptions): LayoutResult {
  const loop = opts.loopSize ?? 26
  const parentOf = new Map<string, string>()
  const clusterById = new Map<string, LayoutCluster>()
  const known = new Set<string>()
  for (const c of clusters) {
    clusterById.set(c.id, c)
    known.add(c.id)
  }
  for (const nd of nodes) known.add(nd.id)
  for (const c of clusters) parentOf.set(c.id, c.parent && clusterById.has(c.parent) && c.parent !== c.id ? c.parent : ROOT)
  for (const nd of nodes) parentOf.set(nd.id, nd.parent && clusterById.has(nd.parent) ? nd.parent : ROOT)
  // break accidental cluster cycles (a cluster inside itself)
  for (const c of clusters) {
    const guard = new Set<string>([c.id])
    let p = parentOf.get(c.id)!
    while (p !== ROOT) {
      if (guard.has(p)) {
        parentOf.set(c.id, ROOT)
        break
      }
      guard.add(p)
      p = parentOf.get(p)!
    }
  }
  const chain = (id: string): string[] => {
    const out: string[] = [id]
    let p = parentOf.get(id)
    while (p !== undefined && p !== ROOT) {
      out.push(p)
      p = parentOf.get(p)
    }
    out.push(ROOT)
    return out
  }
  const depth = (id: string) => chain(id).length

  const nodeById = new Map(nodes.map((nd) => [nd.id, nd]))
  const members = new Map<string, string[]>([[ROOT, []]])
  for (const c of clusters) members.set(c.id, [])
  for (const c of clusters) members.get(parentOf.get(c.id)!)!.push(c.id)
  for (const nd of nodes) members.get(parentOf.get(nd.id)!)!.push(nd.id)

  // assign edges to the level where both ends first diverge
  const levelEdges = new Map<string, EdgeRef[]>([[ROOT, []]])
  for (const c of clusters) levelEdges.set(c.id, [])
  const loops = new Map<string, number>()
  const direct: LayoutEdge[] = []
  for (const e of edges) {
    if (!known.has(e.from) || !known.has(e.to)) continue
    const ca = chain(e.from)
    const cb = chain(e.to)
    if (e.from === e.to) {
      const lb = e.label ? (opts.direction === 'LR' || opts.direction === 'RL' ? e.label.height : e.label.width) + 6 : 0
      loops.set(e.from, Math.max(loops.get(e.from) ?? 0, loop + lb))
      levelEdges.get(parentOf.get(e.from)!)!.push({ id: e.id, a: e.from, b: e.to, label: e.label, minLen: 1 })
      continue
    }
    if (ca.includes(e.to) || cb.includes(e.from)) {
      direct.push(e)
      continue
    }
    const common = ca.find((id) => cb.includes(id))!
    const repA = ca[ca.indexOf(common) - 1]!
    const repB = cb[cb.indexOf(common) - 1]!
    levelEdges.get(common)!.push({ id: e.id, a: repA, b: repB, label: e.label, minLen: e.minLen ?? 1 })
  }

  const levelDir = (id: string): Direction => clusterById.get(id)?.direction ?? opts.direction
  const sizes = new Map<string, { w: number; h: number }>()
  const levels = new Map<string, LevelLayout>()
  const offsets = new Map<string, Point>()
  const titleH = new Map<string, number>()
  for (const nd of nodes) sizes.set(nd.id, { w: nd.width, h: nd.height })

  const runLevel = (id: string) => {
    const items: Item[] = members.get(id)!.map((m) => ({ id: m, w: sizes.get(m)!.w, h: sizes.get(m)!.h, loopSpace: loops.get(m) ?? 0 }))
    const lvl = layoutLevel(items, levelEdges.get(id)!, levelDir(id), { ...opts, direction: levelDir(id) })
    levels.set(id, lvl)
    return lvl
  }
  const byDepth = clusters.toSorted((a, b) => depth(b.id) - depth(a.id) || clusters.indexOf(a) - clusters.indexOf(b))
  for (const c of byDepth) {
    const lvl = runLevel(c.id)
    const pad = opts.clusterPad
    const inner = Math.max(lvl.width, c.titleWidth)
    const empty = members.get(c.id)!.length === 0
    const w = inner + 2 * pad
    const h = (empty ? Math.max(lvl.height, 12) : lvl.height) + 2 * pad + c.titleHeight
    sizes.set(c.id, { w, h })
    offsets.set(c.id, { x: pad + (inner - lvl.width) / 2, y: pad + c.titleHeight })
    titleH.set(c.id, c.titleHeight)
  }
  const rootLevel = runLevel(ROOT)

  const outNodes = new Map<string, Box>()
  const outClusters = new Map<string, PlacedCluster>()
  const outEdges = new Map<string, PlacedEdge>()
  const edgeById = new Map(edges.map((e) => [e.id, e]))
  const place = (id: string, ox: number, oy: number) => {
    const lvl = levels.get(id)!
    for (const [mid, b] of lvl.pos) {
      const abs: Box = { x: b.x + ox, y: b.y + oy, width: b.width, height: b.height }
      if (clusterById.has(mid)) {
        outClusters.set(mid, { ...abs, titleHeight: titleH.get(mid)! })
        const off = offsets.get(mid)!
        place(mid, abs.x + off.x, abs.y + off.y)
      } else outNodes.set(mid, abs)
    }
    for (const [eid, r] of lvl.routes) {
      const e = edgeById.get(eid)!
      outEdges.set(eid, {
        id: eid,
        from: e.from,
        to: e.to,
        waypoints: r.pts.map((p) => ({ x: p.x + ox, y: p.y + oy })),
        label: r.label ? { ...r.label, x: r.label.x + ox, y: r.label.y + oy } : undefined,
        selfLoop: e.from === e.to,
        direction: levelDir(id),
        backward: r.backward,
      })
    }
  }
  place(ROOT, 0, 0)
  for (const e of direct) outEdges.set(e.id, { id: e.id, from: e.from, to: e.to, waypoints: [], selfLoop: false, direction: opts.direction, backward: false })
  return { width: rootLevel.width, height: rootLevel.height, nodes: outNodes, clusters: outClusters, edges: outEdges }
}

/** Box of a node or cluster in a layout. */
export function boxOf(layout: LayoutResult, id: string): Box | undefined {
  return layout.nodes.get(id) ?? layout.clusters.get(id)
}

