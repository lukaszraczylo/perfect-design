/**
 * Pure helpers of Sankey: tolerant graph building (unknown nodes, duplicate flows, cycles) and a layered layout with a
 * fixed number of relaxation passes. No Vue, no DOM, no randomness: the same input always gives the same positions.
 */
import { isFiniteNumber, r2 } from '../_chart/chartMath'

export interface SankeyNodeInput {
  id: string
  label?: string
}

export interface SankeyLinkInput {
  source: string
  target: string
  value: number
}

export interface SNode {
  id: string
  label: string
  /** Position in the input (declared nodes first, then nodes that only appear in links). */
  index: number
  layer: number
  /** Flow through the node: the larger of what comes in and what goes out. */
  value: number
  in: number
  out: number
  x: number
  y: number
  h: number
  sourceLinks: SLink[]
  targetLinks: SLink[]
}

export interface SLink {
  source: SNode
  target: SNode
  value: number
  width: number
  /** Top of the ribbon at the source and at the target. */
  sy: number
  ty: number
}

export interface Skipped {
  /** Value is not a number above zero, or a link is not an object with a source and a target. */
  invalid: number
  /** A node linked to itself. */
  self: number
  /** The flow closes a loop; diagrams of flow need a direction. */
  cycle: number
  /** Declared nodes that no flow touches. */
  unused: number
}

export interface SankeyGraph {
  nodes: SNode[]
  links: SLink[]
  layers: number
  skipped: Skipped
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const idOf = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : isFiniteNumber(v) ? String(v) : null)
const addSafe = (a: number, b: number) => {
  const s = a + b
  return Number.isFinite(s) ? s : Number.MAX_VALUE
}

/**
 * Builds the graph. Nodes may be omitted: a link names its ends and unknown ids become nodes labelled with the id.
 * Repeated flows between the same pair are added up, self links, invalid flows and flows that close a loop are
 * dropped (and counted), and nodes without any flow are left out.
 */
export function buildGraph(nodes: unknown, links: unknown): SankeyGraph {
  const skipped: Skipped = { invalid: 0, self: 0, cycle: 0, unused: 0 }
  const byId = new Map<string, SNode>()
  const make = (id: string, label: string): SNode => ({ id, label, index: byId.size, layer: 0, value: 0, in: 0, out: 0, x: 0, y: 0, h: 0, sourceLinks: [], targetLinks: [] })
  for (const raw of Array.isArray(nodes) ? nodes : []) {
    if (!isRecord(raw)) continue
    const id = idOf(raw.id)
    if (id === null || byId.has(id)) continue
    byId.set(id, make(id, typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label : id))
  }
  const declared = byId.size

  const pairs = new Map<string, { s: SNode; t: SNode; value: number }>()
  for (const raw of Array.isArray(links) ? links : []) {
    if (!isRecord(raw)) {
      skipped.invalid++
      continue
    }
    const s = idOf(raw.source)
    const t = idOf(raw.target)
    if (s === null || t === null || !isFiniteNumber(raw.value) || raw.value <= 0) {
      skipped.invalid++
      continue
    }
    if (s === t) {
      skipped.self++
      continue
    }
    if (!byId.has(s)) byId.set(s, make(s, s))
    if (!byId.has(t)) byId.set(t, make(t, t))
    const key = `${byId.get(s)!.index}>${byId.get(t)!.index}`
    const hit = pairs.get(key)
    if (hit) hit.value = addSafe(hit.value, raw.value)
    else pairs.set(key, { s: byId.get(s)!, t: byId.get(t)!, value: raw.value })
  }

  const all = [...byId.values()]
  const kept = removeCycles(all, [...pairs.values()], skipped)
  const out: SLink[] = []
  for (const p of kept) {
    const l: SLink = { source: p.s, target: p.t, value: p.value, width: 0, sy: 0, ty: 0 }
    p.s.sourceLinks.push(l)
    p.t.targetLinks.push(l)
    p.s.out = addSafe(p.s.out, p.value)
    p.t.in = addSafe(p.t.in, p.value)
    out.push(l)
  }
  const used = all.filter((n) => n.sourceLinks.length + n.targetLinks.length > 0)
  skipped.unused = all.slice(0, declared).filter((n) => n.sourceLinks.length + n.targetLinks.length === 0).length
  used.forEach((n, i) => {
    n.index = i
    n.value = Math.max(n.in, n.out)
  })
  const layers = assignLayers(used)
  return { nodes: used, links: out, layers, skipped }
}

/** Depth first search in input order; a flow into a node that is still open closes a loop and is dropped. */
function removeCycles(nodes: SNode[], pairs: { s: SNode; t: SNode; value: number }[], skipped: Skipped) {
  const outs = new Map<SNode, { s: SNode; t: SNode; value: number }[]>()
  for (const p of pairs) {
    const list = outs.get(p.s) ?? []
    list.push(p)
    outs.set(p.s, list)
  }
  const state = new Map<SNode, 1 | 2>() // 1 = open, 2 = done
  const dropped = new Set<(typeof pairs)[number]>()
  for (const root of nodes) {
    if (state.has(root)) continue
    const stack: { node: SNode; next: number }[] = [{ node: root, next: 0 }]
    state.set(root, 1)
    while (stack.length > 0) {
      const top = stack[stack.length - 1]!
      const edges = outs.get(top.node) ?? []
      if (top.next >= edges.length) {
        state.set(top.node, 2)
        stack.pop()
        continue
      }
      const edge = edges[top.next++]!
      const seen = state.get(edge.t)
      if (seen === 1) {
        dropped.add(edge)
        skipped.cycle++
      } else if (seen === undefined) {
        state.set(edge.t, 1)
        stack.push({ node: edge.t, next: 0 })
      }
    }
  }
  return pairs.filter((p) => !dropped.has(p))
}

/** Longest path from a source; nodes that nothing leaves move to the last layer so they line up on the right edge. */
function assignLayers(nodes: SNode[]): number {
  const indeg = new Map<SNode, number>()
  for (const n of nodes) indeg.set(n, n.targetLinks.length)
  const queue = nodes.filter((n) => n.targetLinks.length === 0)
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i]!
    for (const l of n.sourceLinks) {
      l.target.layer = Math.max(l.target.layer, n.layer + 1)
      const left = indeg.get(l.target)! - 1
      indeg.set(l.target, left)
      if (left === 0) queue.push(l.target)
    }
  }
  const last = nodes.reduce((m, n) => Math.max(m, n.layer), 0)
  for (const n of nodes) if (n.sourceLinks.length === 0) n.layer = last
  return nodes.length === 0 ? 0 : last + 1
}

export interface SankeyLayoutOptions {
  width: number
  height: number
  nodeWidth: number
  /** Vertical space between nodes of one layer. */
  padding: number
  /** Relaxation passes (fixed, so the result is the same on every run). */
  iterations?: number
}

/** Positions nodes and ribbons inside `width` x `height`. Mutates and returns the graph. */
export function layoutSankey(graph: SankeyGraph, opts: SankeyLayoutOptions): SankeyGraph {
  const { nodes, links, layers } = graph
  if (nodes.length === 0) return graph
  const W = Math.max(1, opts.width)
  const H = Math.max(1, opts.height)
  const nodeW = Math.min(opts.nodeWidth, W / (2 * layers))
  const columns: SNode[][] = Array.from({ length: layers }, () => [])
  for (const n of nodes) columns[n.layer]!.push(n)
  const step = layers > 1 ? (W - nodeW) / (layers - 1) : 0

  const crowded = Math.max(...columns.map((c) => c.length))
  const pad = Math.min(opts.padding, (H * 0.5) / Math.max(1, crowded - 1))
  let ky = Infinity
  for (const col of columns) {
    let sum = 0
    for (const n of col) sum = addSafe(sum, n.value)
    const room = H - (col.length - 1) * pad
    ky = Math.min(ky, room / sum)
  }
  if (!isFiniteNumber(ky) || ky <= 0) ky = 0
  for (const n of nodes) {
    n.x = r2(n.layer * step)
    n.h = n.value * ky
  }
  for (const l of links) l.width = l.value * ky

  for (const col of columns) {
    let y = 0
    for (const n of col) {
      n.y = y
      y += n.h + pad
    }
  }
  const iterations = Math.max(0, Math.floor(opts.iterations ?? 6))
  let alpha = 1
  for (let i = 0; i < iterations; i++) {
    alpha *= 0.99
    for (let c = layers - 2; c >= 0; c--) relax(columns[c]!, 'out', alpha)
    for (const col of columns) collide(col, H, pad)
    for (let c = 1; c < layers; c++) relax(columns[c]!, 'in', alpha)
    for (const col of columns) collide(col, H, pad)
  }
  for (const col of columns) collide(col, H, pad)

  for (const n of nodes) {
    n.sourceLinks.sort((a, b) => a.target.y + a.target.h / 2 - (b.target.y + b.target.h / 2) || a.target.index - b.target.index)
    n.targetLinks.sort((a, b) => a.source.y + a.source.h / 2 - (b.source.y + b.source.h / 2) || a.source.index - b.source.index)
    let sy = n.y
    for (const l of n.sourceLinks) {
      l.sy = sy
      sy += l.width
    }
    let ty = n.y
    for (const l of n.targetLinks) {
      l.ty = ty
      ty += l.width
    }
  }
  for (const n of nodes) {
    n.y = r2(n.y)
    n.h = r2(n.h)
  }
  for (const l of links) {
    l.sy = r2(l.sy)
    l.ty = r2(l.ty)
    l.width = r2(l.width)
  }
  return graph
}

/** Moves each node toward the weighted centre of the nodes it is linked to on one side. */
function relax(col: SNode[], side: 'in' | 'out', alpha: number): void {
  for (const n of col) {
    const ls = side === 'out' ? n.sourceLinks : n.targetLinks
    let sum = 0
    let weight = 0
    for (const l of ls) {
      const o = side === 'out' ? l.target : l.source
      sum += (o.y + o.h / 2) * l.width
      weight += l.width
    }
    if (weight > 0) n.y += (sum / weight - (n.y + n.h / 2)) * alpha
  }
}

/** Sorts a layer top to bottom and pushes overlapping nodes apart, then pulls the stack back inside `height`. */
function collide(col: SNode[], height: number, pad: number): void {
  col.sort((a, b) => a.y - b.y || a.index - b.index)
  let y = 0
  for (const n of col) {
    if (n.y < y) n.y = y
    y = n.y + n.h + pad
  }
  const over = y - pad - height
  if (over > 0) {
    let bottom = height
    for (let i = col.length - 1; i >= 0; i--) {
      const n = col[i]!
      if (n.y + n.h > bottom) n.y = bottom - n.h
      bottom = n.y - pad
    }
  }
  if (col.length > 0 && col[0]!.y < 0) {
    let top = 0
    for (const n of col) {
      if (n.y < top) n.y = top
      top = n.y + n.h + pad
    }
  }
}

/** Closed path of one ribbon: a band of constant height `width` between the two node edges. */
export function ribbonPath(l: SLink, nodeWidth: number): string {
  const x0 = l.source.x + nodeWidth
  const x1 = l.target.x
  const m = (x0 + x1) / 2
  const a = l.sy
  const b = l.ty
  const w = l.width
  return `M${r2(x0)},${r2(a)} C${r2(m)},${r2(a)} ${r2(m)},${r2(b)} ${r2(x1)},${r2(b)} L${r2(x1)},${r2(b + w)} C${r2(m)},${r2(b + w)} ${r2(m)},${r2(a + w)} ${r2(x0)},${r2(a + w)} Z`
}
