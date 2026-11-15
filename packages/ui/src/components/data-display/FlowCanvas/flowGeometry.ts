/**
 * Pure geometry of the flow canvas: tolerant normalisation of nodes and edges, ports, edge routing, viewport math,
 * hit testing, spatial focus and the layered auto layout. No Vue and no DOM, so every function is unit tested alone.
 * Layout, node outlines and polyline midpoints come from `_diagram` (the same code that draws Mermaid flowcharts).
 */
import { layoutGraph } from '../_diagram/layout'
import { edgeMidpoint, routeSelfLoop } from '../_diagram/route'
import { clipToShape, isNodeShape, lineHit, shapePath, type Box, type NodeShape } from '../_diagram/shapes'
import { metricsFor, r2 } from '../_diagram/text'
import { DIAGRAM_TONES, type DiagramTone, type Direction, type Point } from '../_diagram/types'
import type { FlowCanvasEdgeStyle, FlowEdgeLine, FlowPortType, FlowSide, FlowViewport } from './types'

export const FLOW_SIDES: readonly FlowSide[] = ['top', 'right', 'bottom', 'left']
export const FLOW_PORT_TYPES: readonly FlowPortType[] = ['source', 'target', 'both']
export const FLOW_LINES: readonly FlowEdgeLine[] = ['solid', 'dashed', 'dotted']
export const NODE_WIDTH = 148
export const NODE_HEIGHT = 52
export const MIN_NODE = 24
export const MAX_NODE = 1200
export const DEFAULT_GRID = 20
/** Longest label kept (characters); the rest is cut so one hostile label cannot slow the canvas down. */
export const MAX_LABEL = 500

export interface NormPort {
  id: string
  side: FlowSide
  type: FlowPortType
  label: string
}
export interface NormNode {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  shape: NodeShape
  tone: DiagramTone
  ports: NormPort[]
  canSource: boolean
  canTarget: boolean
}
export interface NormEdge {
  id: string
  from: string
  to: string
  label: string
  fromPort?: string
  toPort?: string
  style: FlowEdgeLine
}
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isId = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const finite = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const size = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) && v >= MIN_NODE ? Math.min(v, MAX_NODE) : fallback)
export const pick = <T extends string>(value: unknown, list: readonly T[], fallback: T): T => (list.includes(value as T) ? (value as T) : fallback)

const DEFAULT_PORTS: NormPort[] = FLOW_SIDES.map((side) => ({ id: side, side, type: 'both', label: '' }))

function normalizePorts(raw: unknown): NormPort[] {
  if (!Array.isArray(raw)) return DEFAULT_PORTS
  const seen = new Set<string>()
  const out: NormPort[] = []
  for (const p of raw) {
    if (!isRecord(p) || !isId(p.id) || seen.has(p.id)) continue
    seen.add(p.id)
    out.push({ id: p.id, side: pick(p.side, FLOW_SIDES, 'right'), type: pick(p.type, FLOW_PORT_TYPES, 'both'), label: typeof p.label === 'string' ? p.label : '' })
  }
  return out
}

/** Tolerant: entries without a usable id are skipped, a repeated id keeps the first. Everything is text, never markup. */
export function normalizeNodes(raw: unknown): NormNode[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: NormNode[] = []
  for (const n of raw) {
    if (!isRecord(n) || !isId(n.id) || seen.has(n.id)) continue
    seen.add(n.id)
    const ports = normalizePorts(n.ports)
    out.push({
      id: n.id,
      label: typeof n.label === 'string' && n.label.trim() !== '' ? n.label.slice(0, MAX_LABEL) : n.id.slice(0, MAX_LABEL),
      x: finite(n.x, 0),
      y: finite(n.y, 0),
      w: size(n.width, NODE_WIDTH),
      h: size(n.height, NODE_HEIGHT),
      shape: isNodeShape(n.shape) ? n.shape : 'rect',
      tone: pick(n.tone, DIAGRAM_TONES, 'neutral'),
      ports,
      canSource: ports.some((p) => p.type !== 'target'),
      canTarget: ports.some((p) => p.type !== 'source'),
    })
  }
  return out
}

/** Edges whose ends are unknown nodes are dropped and counted; a repeated id keeps the first. */
export function normalizeEdges(raw: unknown, nodeIds: ReadonlySet<string>): { edges: NormEdge[]; skipped: number } {
  const out: NormEdge[] = []
  let skipped = 0
  if (!Array.isArray(raw)) return { edges: out, skipped }
  const seen = new Set<string>()
  for (const e of raw) {
    if (!isRecord(e) || !isId(e.id) || !isId(e.from) || !isId(e.to) || seen.has(e.id)) continue
    seen.add(e.id)
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) {
      skipped++
      continue
    }
    out.push({
      id: e.id,
      from: e.from,
      to: e.to,
      label: typeof e.label === 'string' ? e.label : '',
      fromPort: isId(e.fromPort) ? e.fromPort : undefined,
      toPort: isId(e.toPort) ? e.toPort : undefined,
      style: pick(e.style, FLOW_LINES, 'solid'),
    })
  }
  return { edges: out, skipped }
}

export const boxOf = (n: NormNode): Box => ({ x: n.x, y: n.y, width: n.w, height: n.h })
export const centerOf = (n: NormNode): Point => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 })

/* ------------------------------------------------------------------ ports */

export interface PortPoint extends Point {
  /** Outward unit normal. `0, 0` for a virtual point (a node without ports). */
  nx: number
  ny: number
  port?: NormPort
}
const NORMALS: Record<FlowSide, Point> = { top: { x: 0, y: -1 }, right: { x: 1, y: 0 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 } }

/** Position of every port: ports on one side are spread evenly and snapped to the outline of the node's shape. */
export function portPoints(n: NormNode): PortPoint[] {
  const box = boxOf(n)
  const bySide = new Map<FlowSide, NormPort[]>()
  for (const p of n.ports) (bySide.get(p.side) ?? bySide.set(p.side, []).get(p.side)!).push(p)
  const out: PortPoint[] = []
  for (const p of n.ports) {
    const group = bySide.get(p.side)!
    const frac = (group.indexOf(p) + 1) / (group.length + 1)
    const normal = NORMALS[p.side]
    let at: Point
    if (p.side === 'top' || p.side === 'bottom') at = lineHit(n.shape, box, false, n.x + frac * n.w, p.side === 'bottom')
    else at = lineHit(n.shape, box, true, n.y + frac * n.h, p.side === 'right')
    out.push({ x: at.x, y: at.y, nx: normal.x, ny: normal.y, port: p })
  }
  return out
}

const compatible = (p: NormPort, role: 'source' | 'target') => p.type === 'both' || p.type === role

/** Candidate anchors of one end: the named port, else every port that can play `role`, else a virtual point on the outline. */
function candidates(n: NormNode, role: 'source' | 'target', portId: string | undefined, toward: Point): PortPoint[] {
  const all = portPoints(n)
  if (portId) {
    const named = all.filter((p) => p.port!.id === portId)
    if (named.length) return named
  }
  const fit = all.filter((p) => compatible(p.port!, role))
  if (fit.length) return fit
  if (all.length) return all
  const edge = clipToShape(n.shape, boxOf(n), toward)
  const c = centerOf(n)
  const horizontal = Math.abs(edge.x - c.x) / (n.w / 2) >= Math.abs(edge.y - c.y) / (n.h / 2)
  return [{ x: edge.x, y: edge.y, nx: horizontal ? Math.sign(edge.x - c.x) || 1 : 0, ny: horizontal ? 0 : Math.sign(edge.y - c.y) || 1 }]
}

/** Pick the pair of ports with the shortest line that leaves each node outward. */
export function edgeAnchors(a: NormNode, b: NormNode, fromPort?: string, toPort?: string): { start: PortPoint; end: PortPoint } {
  const ca = candidates(a, 'source', fromPort, centerOf(b))
  const cb = candidates(b, 'target', toPort, centerOf(a))
  let best = { start: ca[0]!, end: cb[0]!, cost: Infinity }
  for (const p of ca) {
    for (const q of cb) {
      const dx = q.x - p.x
      const dy = q.y - p.y
      const away = (p.nx * dx + p.ny * dy < -1e-6 ? 400 : 0) + (q.nx * -dx + q.ny * -dy < -1e-6 ? 400 : 0)
      const cost = Math.hypot(dx, dy) + away
      if (cost < best.cost) best = { start: p, end: q, cost }
    }
  }
  return { start: best.start, end: best.end }
}

/* ------------------------------------------------------------------ routing */

export interface FlowRoute {
  d: string
  /** Where the label sits. */
  mid: Point
  points: Point[]
}
const fmt = (p: Point) => `${r2(p.x)},${r2(p.y)}`

function dedupePoints(pts: Point[]): Point[] {
  const out: Point[] = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 0.01) continue
    const prev = out[out.length - 2]
    if (last && prev && ((Math.abs(prev.x - last.x) < 0.01 && Math.abs(last.x - p.x) < 0.01) || (Math.abs(prev.y - last.y) < 0.01 && Math.abs(last.y - p.y) < 0.01))) out.pop()
    out.push(p)
  }
  return out
}

/** Polyline with rounded corners (quadratic curves through the vertices). */
function roundedPolyline(pts: Point[], radius: number): string {
  let d = `M${fmt(pts[0]!)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const u = pts[i - 1]!
    const v = pts[i]!
    const w = pts[i + 1]!
    const lin = Math.hypot(v.x - u.x, v.y - u.y)
    const lout = Math.hypot(w.x - v.x, w.y - v.y)
    const r = Math.min(radius, lin / 2, lout / 2)
    const a = { x: v.x - ((v.x - u.x) / lin) * r, y: v.y - ((v.y - u.y) / lin) * r }
    const b = { x: v.x + ((w.x - v.x) / lout) * r, y: v.y + ((w.y - v.y) / lout) * r }
    d += `L${fmt(a)}Q${fmt(v)} ${fmt(b)}`
  }
  return `${d}L${fmt(pts[pts.length - 1]!)}`
}

/** Normal of a virtual point is zero: borrow the direction toward the other end. */
function normalOf(p: PortPoint, other: Point): Point {
  if (p.nx !== 0 || p.ny !== 0) return { x: p.nx, y: p.ny }
  const dx = other.x - p.x
  const dy = other.y - p.y
  return Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx) || 1, y: 0 } : { x: 0, y: Math.sign(dy) || 1 }
}

export function routeFlowEdge(start: PortPoint, end: PortPoint, style: FlowCanvasEdgeStyle): FlowRoute {
  const n1 = normalOf(start, end)
  const n2 = normalOf(end, start)
  if (style === 'curved') {
    const dist = Math.hypot(end.x - start.x, end.y - start.y)
    const k = Math.min(160, Math.max(28, dist * 0.45))
    const c1 = { x: start.x + n1.x * k, y: start.y + n1.y * k }
    const c2 = { x: end.x + n2.x * k, y: end.y + n2.y * k }
    const mid = { x: (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8, y: (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8 }
    return { d: `M${fmt(start)}C${fmt(c1)} ${fmt(c2)} ${fmt(end)}`, mid, points: [start, c1, c2, end] }
  }
  if (style === 'orthogonal') {
    const M = 24
    const a = { x: start.x + n1.x * M, y: start.y + n1.y * M }
    const b = { x: end.x + n2.x * M, y: end.y + n2.y * M }
    const h1 = n1.x !== 0
    const h2 = n2.x !== 0
    let bend: Point[]
    if (h1 && h2) {
      const mx = (a.x + b.x) / 2
      bend = [{ x: mx, y: a.y }, { x: mx, y: b.y }]
    } else if (!h1 && !h2) {
      const my = (a.y + b.y) / 2
      bend = [{ x: a.x, y: my }, { x: b.x, y: my }]
    } else bend = [h1 ? { x: b.x, y: a.y } : { x: a.x, y: b.y }]
    const pts = dedupePoints([start, a, ...bend, b, end])
    return pts.length < 3 ? { d: `M${fmt(start)}L${fmt(end)}`, mid: edgeMidpoint([start, end]), points: [start, end] } : { d: roundedPolyline(pts, 8), mid: edgeMidpoint(pts), points: pts }
  }
  return { d: `M${fmt(start)}L${fmt(end)}`, mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, points: [start, end] }
}

/** A connection from a node to itself: a loop at the right side of the node (shared with the Mermaid renderer). */
export function routeLoop(n: NormNode): FlowRoute {
  const r = routeSelfLoop(boxOf(n), undefined, 'TB', 26)
  return { d: r.d, mid: edgeMidpoint(r.points), points: r.points }
}

/** Path of a node outline at the origin (the node group is translated to its position). */
export function outlinePath(shape: NodeShape, w: number, h: number): { d: string; inner: string[] } {
  return shapePath(shape, { x: 0, y: 0, width: w, height: h }, metricsFor())
}

/* ------------------------------------------------------------------ viewport */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const snap = (v: number, grid: number) => (grid > 0 ? Math.round(v / grid) * grid : v)

/** `grid` prop to a step in canvas units (0 = no snapping). */
export function gridStep(grid: unknown): number {
  if (grid === true) return DEFAULT_GRID
  return typeof grid === 'number' && Number.isFinite(grid) && grid > 0 ? Math.min(grid, 400) : 0
}

export function zoomLimits(min: unknown, max: unknown): { min: number; max: number } {
  const lo = typeof min === 'number' && Number.isFinite(min) && min > 0 ? Math.min(min, 1) : 0.25
  const hi = typeof max === 'number' && Number.isFinite(max) && max > 0 ? Math.max(max, 1) : 2
  return { min: lo, max: hi }
}

/** Zoom by `factor` keeping the canvas point under (cx, cy) in place. */
export function zoomAt(vp: FlowViewport, factor: number, cx: number, cy: number, limits: { min: number; max: number }): FlowViewport {
  const zoom = clamp(vp.zoom * factor, limits.min, limits.max)
  const k = zoom / vp.zoom
  return { zoom, x: cx - (cx - vp.x) * k, y: cy - (cy - vp.y) * k }
}

export function boundsOf(nodes: readonly NormNode[]): Rect | null {
  if (!nodes.length) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const n of nodes) {
    x0 = Math.min(x0, n.x)
    y0 = Math.min(y0, n.y)
    x1 = Math.max(x1, n.x + n.w)
    y1 = Math.max(y1, n.y + n.h)
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/** The viewport that shows `bounds` centred with `padding` around it. A single small node is not zoomed in beyond 1. */
export function fitViewport(bounds: Rect | null, width: number, height: number, padding: number, limits: { min: number; max: number }): FlowViewport {
  if (!bounds || width <= 0 || height <= 0) return { x: 0, y: 0, zoom: 1 }
  const zoom = clamp(Math.min((width - 2 * padding) / bounds.width, (height - 2 * padding) / bounds.height, 1), limits.min, limits.max)
  return { zoom, x: width / 2 - (bounds.x + bounds.width / 2) * zoom, y: height / 2 - (bounds.y + bounds.height / 2) * zoom }
}

/** Canvas rectangle visible in a view of `width` x `height` pixels, grown by `margin` canvas units. */
export function visibleRect(vp: FlowViewport, width: number, height: number, margin: number): Rect {
  return { x: -vp.x / vp.zoom - margin, y: -vp.y / vp.zoom - margin, width: width / vp.zoom + 2 * margin, height: height / vp.zoom + 2 * margin }
}

export const rectsIntersect = (a: Rect, b: Rect) => a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
export const nodeRect = (n: NormNode): Rect => ({ x: n.x, y: n.y, width: n.w, height: n.h })
export const normRect = (a: Point, b: Point): Rect => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) })
export const pointInRect = (p: Point, r: Rect) => p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height

/* ------------------------------------------------------------------ hit testing and focus order */

export interface PortHit {
  nodeId: string
  portId: string
}

/** The port nearest to `p` within `radius`, or null. Later nodes are drawn on top, so they win ties. */
export function hitPort(nodes: readonly NormNode[], p: Point, radius: number): PortHit | null {
  let best: PortHit | null = null
  let bestD = radius
  for (const n of nodes) {
    if (p.x < n.x - radius || p.x > n.x + n.w + radius || p.y < n.y - radius || p.y > n.y + n.h + radius) continue
    for (const pp of portPoints(n)) {
      const d = Math.hypot(pp.x - p.x, pp.y - p.y)
      if (d <= bestD) {
        bestD = d
        best = { nodeId: n.id, portId: pp.port!.id }
      }
    }
  }
  return best
}

/** The topmost node under `p` (the last one in the list). */
export function hitNode(nodes: readonly NormNode[], p: Point): NormNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) if (pointInRect(p, nodeRect(nodes[i]!))) return nodes[i]!
  return null
}

/** Reading order (top to bottom, then left to right) as ids. Stable for equal positions. */
export function readingOrder(nodes: readonly NormNode[]): string[] {
  return nodes
    .map((n, i) => ({ n, i }))
    .sort((a, b) => a.n.y - b.n.y || a.n.x - b.n.x || a.i - b.i)
    .map((o) => o.n.id)
}

export type Arrow = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'

/** The node nearest to `from` in the arrow's direction (distance along it plus twice the sideways offset), or null. */
export function nearestInDirection(from: NormNode, others: readonly NormNode[], key: Arrow): NormNode | null {
  const c = centerOf(from)
  let best: NormNode | null = null
  let bestScore = Infinity
  for (const n of others) {
    if (n.id === from.id) continue
    const o = centerOf(n)
    const dx = o.x - c.x
    const dy = o.y - c.y
    const along = key === 'ArrowRight' ? dx : key === 'ArrowLeft' ? -dx : key === 'ArrowDown' ? dy : -dy
    if (along <= 0.5) continue
    const across = key === 'ArrowLeft' || key === 'ArrowRight' ? Math.abs(dy) : Math.abs(dx)
    const score = along + 2 * across
    if (score < bestScore) {
      bestScore = score
      best = n
    }
  }
  return best
}

/** The node whose centre is closest to `from`. */
export function nearestNode(from: NormNode, others: readonly NormNode[]): NormNode | null {
  const c = centerOf(from)
  let best: NormNode | null = null
  let bestD = Infinity
  for (const n of others) {
    if (n.id === from.id) continue
    const o = centerOf(n)
    const d = Math.hypot(o.x - c.x, o.y - c.y)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

/* ------------------------------------------------------------------ layout */

export const LAYOUT_DIRECTIONS: readonly Direction[] = ['TB', 'LR', 'BT', 'RL']

/** New top-left positions from the layered layout of the Mermaid renderer, starting at (margin, margin). */
export function layoutPositions(nodes: readonly NormNode[], edges: readonly NormEdge[], direction: Direction, grid: number, margin = 40): Map<string, Point> {
  const result = layoutGraph(
    nodes.map((n) => ({ id: n.id, width: n.w, height: n.h, shape: n.shape })),
    edges.map((e) => ({ id: e.id, from: e.from, to: e.to })),
    [],
    { direction, nodeSep: 48, rankSep: 96, clusterPad: 0, loopSize: 26 },
  )
  const out = new Map<string, Point>()
  for (const n of nodes) {
    const b = result.nodes.get(n.id)
    if (b) out.set(n.id, { x: snap(b.x + margin, grid), y: snap(b.y + margin, grid) })
  }
  return out
}
