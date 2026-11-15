/**
 * Edge routing: turns the waypoints of a layout plus the two end boxes into an SVG path for the three edge styles.
 * `straight` is a polyline that leaves each shape at its outline; `curved` is a chain of S-curves with tangents along
 * the rank direction; `orthogonal` uses right angles with small rounded corners. End points sit exactly on the outline
 * so arrowheads touch the node.
 */
import type { PlacedEdge } from './layout'
import { clipToShape, lineHit, type Box, type NodeShape } from './shapes'
import { r2 } from './text'
import type { Direction, EdgeStyle, Point } from './types'

export interface Endpoint {
  box: Box
  shape: NodeShape | 'cluster'
}

export interface RoutedEdge {
  d: string
  /** Points the path passes through (for tests and hit areas). */
  points: Point[]
  /** Centre of the label, when the edge has one. */
  label?: Point
}

const dedupe = (pts: Point[]): Point[] => pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1]!.x, p.y - pts[i - 1]!.y) > 0.01)
const fmt = (p: Point) => `${r2(p.x)},${r2(p.y)}`
const centerOf = (b: Box): Point => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })

function polylineMidpoint(pts: Point[]): Point {
  let total = 0
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y)
  let half = total / 2
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y)
    if (half <= seg && seg > 0) {
      const t = half / seg
      return { x: pts[i - 1]!.x + (pts[i]!.x - pts[i - 1]!.x) * t, y: pts[i - 1]!.y + (pts[i]!.y - pts[i - 1]!.y) * t }
    }
    half -= seg
  }
  return pts[0] ?? { x: 0, y: 0 }
}

export function routeSelfLoop(box: Box, label: { width: number; height: number } | undefined, dir: Direction, loop: number): RoutedEdge {
  const c = centerOf(box)
  if (dir === 'LR' || dir === 'RL') {
    const k = Math.min(box.width / 4, 9)
    const y = box.y + box.height
    const a = { x: c.x - k, y }
    const b = { x: c.x + k, y }
    return {
      d: `M${fmt(a)}C${r2(a.x - 8)},${r2(y + loop)} ${r2(b.x + 8)},${r2(y + loop)} ${fmt(b)}`,
      points: [a, { x: c.x, y: y + loop * 0.75 }, b],
      label: label ? { x: c.x, y: y + loop + 4 + label.height / 2 } : undefined,
    }
  }
  const k = Math.min(box.height / 4, 9)
  const x = box.x + box.width
  const a = { x, y: c.y - k }
  const b = { x, y: c.y + k }
  return {
    d: `M${fmt(a)}C${r2(x + loop)},${r2(a.y - 8)} ${r2(x + loop)},${r2(b.y + 8)} ${fmt(b)}`,
    points: [a, { x: x + loop * 0.75, y: c.y }, b],
    label: label ? { x: x + loop + 4 + label.width / 2, y: c.y } : undefined,
  }
}

const sameBox = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
const containsBox = (outer: Box, inner: Box) => inner.x >= outer.x - 0.01 && inner.y >= outer.y - 0.01 && inner.x + inner.width <= outer.x + outer.width + 0.01 && inner.y + inner.height <= outer.y + outer.height + 0.01

/** True when the segment a-b passes through the interior of the rectangle (Liang-Barsky, touching does not count). */
function segmentHitsBox(a: Point, b: Point, o: Box): boolean {
  const x0 = o.x + 0.5
  const x1 = o.x + o.width - 0.5
  const y0 = o.y + 0.5
  const y1 = o.y + o.height - 0.5
  if (x1 <= x0 || y1 <= y0) return false
  let t0 = 0
  let t1 = 1
  const dx = b.x - a.x
  const dy = b.y - a.y
  for (const [p, q] of [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]] as const) {
    if (p === 0) {
      if (q < 0) return false
    } else {
      const r = q / p
      if (p < 0) t0 = Math.max(t0, r)
      else t1 = Math.min(t1, r)
      if (t0 >= t1) return false
    }
  }
  return true
}

/**
 * Bend a polyline around the boxes it would cross: a segment that runs through a box is replaced by a detour along the
 * side of the box (the shorter side), padded so the line keeps clear of the outline. Used for edges whose end sits
 * inside a group, where the layout only knows the group box and not the nodes inside it.
 */
export function avoidObstacles(pts: Point[], obstacles: Box[], horizontal: boolean, pad = 10, bounds?: Box): Point[] {
  if (obstacles.length === 0 || pts.length < 2) return pts
  const boxes = obstacles.map((o) => ({ x: o.x - pad, y: o.y - pad, width: o.width + 2 * pad, height: o.height + 2 * pad }))
  const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y)
  const walk = (a: Point, b: Point, depth: number, skip: Set<number>): Point[] => {
    if (depth > 6) return [b]
    let hit = -1
    let best = Infinity
    boxes.forEach((o, i) => {
      if (skip.has(i) || !segmentHitsBox(a, b, o)) return
      const d = dist(a, { x: o.x + o.width / 2, y: o.y + o.height / 2 })
      if (d < best) {
        best = d
        hit = i
      }
    })
    if (hit < 0) return [b]
    const o = boxes[hit]!
    const next = new Set(skip).add(hit)
    const options: [Point, Point][] = horizontal
      ? [o.y, o.y + o.height].map((y): [Point, Point] => (a.x <= b.x ? [{ x: o.x, y }, { x: o.x + o.width, y }] : [{ x: o.x + o.width, y }, { x: o.x, y }]))
      : [o.x, o.x + o.width].map((x): [Point, Point] => (a.y <= b.y ? [{ x, y: o.y }, { x, y: o.y + o.height }] : [{ x, y: o.y + o.height }, { x, y: o.y }]))
    // keep the detour inside the drawing when one side allows it
    const inBounds = (p: Point) => !bounds || (p.x >= bounds.x && p.x <= bounds.x + bounds.width && p.y >= bounds.y && p.y <= bounds.y + bounds.height)
    const fitting = options.filter((c) => inBounds(c[0]) && inBounds(c[1]))
    const clampP = (p: Point): Point => (bounds ? { x: Math.min(Math.max(p.x, bounds.x), bounds.x + bounds.width), y: Math.min(Math.max(p.y, bounds.y), bounds.y + bounds.height) } : p)
    const [q1, q2] = (fitting.length ? fitting : options).reduce((m, c) => (dist(a, c[0]) + dist(c[0], c[1]) + dist(c[1], b) < dist(a, m[0]) + dist(m[0], m[1]) + dist(m[1], b) ? c : m))
    const p1 = clampP(q1)
    const p2 = clampP(q2)
    return [...walk(a, p1, depth + 1, next), ...walk(p1, p2, depth + 1, next), ...walk(p2, b, depth + 1, next)]
  }
  const out: Point[] = [pts[0]!]
  for (let i = 1; i < pts.length; i++) out.push(...walk(pts[i - 1]!, pts[i]!, 0, new Set()))
  return out
}

export interface EdgePorts {
  /** Cross-axis coordinate where the edge leaves the source (default: the centre). */
  start?: number
  /** Cross-axis coordinate where the edge enters the target (default: the centre). */
  end?: number
}

/** Which faces an edge uses and where it heads, shared by routing and port assignment. */
export function edgeFaces(placed: PlacedEdge, from: Endpoint, to: Endpoint) {
  const dir = placed.direction
  const horizontal = dir === 'LR' || dir === 'RL'
  const sign = dir === 'TB' || dir === 'LR' ? 1 : -1
  const rank = (p: Point) => (horizontal ? p.x : p.y)
  const wp = placed.waypoints
  const sc = centerOf(from.box)
  const tc = centerOf(to.box)
  const firstTarget = wp[0] ?? tc
  const lastSource = wp[wp.length - 1] ?? sc
  const sameRank = Math.abs(rank(sc) - rank(tc)) < 1 && wp.length === 0
  // the high side along the rank axis is the forward side for TB and LR
  const startForward = sign * (rank(firstTarget) - rank(sc)) >= 0
  const endForward = sign * (rank(tc) - rank(lastSource)) < 0
  return { horizontal, sign, sameRank, startHigh: startForward === (sign > 0), endHigh: endForward === (sign > 0), startToward: firstTarget, endToward: lastSource }
}

/**
 * Spread the edges that share a face of a node along that face (sorted by where they head, so they do not cross), so
 * arrowheads and line ends do not pile up on one point. Returns the ports per edge id; edges alone on a face keep the centre.
 */
export function assignPorts(list: { id: string; placed: PlacedEdge; from: Endpoint; to: Endpoint; fromId: string; toId: string }[]): Map<string, EdgePorts> {
  const groups = new Map<string, { id: string; end: 'start' | 'end'; at: number; box: Box; horizontal: boolean }[]>()
  for (const e of list) {
    if (e.placed.selfLoop) continue
    const f = edgeFaces(e.placed, e.from, e.to)
    if (f.sameRank) continue
    const add = (key: string, end: 'start' | 'end', toward: Point, box: Box) =>
      (groups.get(key) ?? groups.set(key, []).get(key)!).push({ id: e.id, end, at: f.horizontal ? toward.y : toward.x, box, horizontal: f.horizontal })
    add(`${e.fromId}|${f.startHigh}`, 'start', f.startToward, e.from.box)
    add(`${e.toId}|${f.endHigh}`, 'end', f.endToward, e.to.box)
  }
  const out = new Map<string, EdgePorts>()
  for (const g of groups.values()) {
    if (g.length < 2) continue
    g.sort((a, b) => a.at - b.at)
    const { box, horizontal } = g[0]!
    const face = horizontal ? box.height : box.width
    const lo = horizontal ? box.y : box.x
    const step = Math.min(18, (face * 0.7) / (g.length - 1))
    g.forEach((m, i) => {
      const cross = lo + face / 2 + (i - (g.length - 1) / 2) * step
      const ports = out.get(m.id) ?? {}
      ports[m.end] = cross
      out.set(m.id, ports)
    })
  }
  return out
}

/** Route one edge. `labelSize` is only used for self loops (other labels are placed by the layout). */
export function routeEdge(placed: PlacedEdge, from: Endpoint, to: Endpoint, style: EdgeStyle, loop = 26, labelSize?: { width: number; height: number }, ports: EdgePorts = {}, obstacles: Box[] = [], bounds?: Box): RoutedEdge {
  if (placed.selfLoop) return routeSelfLoop(from.box, labelSize, placed.direction, loop)
  const f = edgeFaces(placed, from, to)
  const { horizontal, sign } = f
  const rank = (p: Point) => (horizontal ? p.x : p.y)
  const cross = (p: Point) => (horizontal ? p.y : p.x)
  const at = (r: number, c: number): Point => (horizontal ? { x: r, y: c } : { x: c, y: r })
  const wp = placed.waypoints
  const sc = centerOf(from.box)
  const tc = centerOf(to.box)

  let pts: Point[]
  const sameRank = f.sameRank
  if (sameRank) {
    pts = [clipToShape(from.shape, from.box, f.startToward), clipToShape(to.shape, to.box, f.endToward)]
  } else {
    const start = lineHit(from.shape, from.box, horizontal, ports.start ?? cross(sc), f.startHigh)
    const end = lineHit(to.shape, to.box, horizontal, ports.end ?? cross(tc), f.endHigh)
    pts = [start, ...wp, end]
  }
  // nodes inside the end groups (and the end nodes themselves) are not obstacles
  const blocking = obstacles.filter((o) => !sameBox(o, from.box) && !sameBox(o, to.box) && !containsBox(from.box, o) && !containsBox(to.box, o))
  pts = dedupe(avoidObstacles(dedupe(pts), blocking, horizontal, 10, bounds))
  if (pts.length < 2) pts = [pts[0] ?? sc, { x: (pts[0] ?? sc).x + 0.01, y: (pts[0] ?? sc).y }]

  let d: string
  if (style === 'straight' || sameRank) {
    d = `M${pts.map(fmt).join('L')}`
  } else if (style === 'curved') {
    d = `M${fmt(pts[0]!)}`
    if (pts.length === 2 || pts.length > 40) {
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1]!
        const q = pts[i]!
        if (Math.abs(cross(p) - cross(q)) < 0.01) d += `L${fmt(q)}`
        else {
          const m = (rank(p) + rank(q)) / 2
          d += `C${fmt(at(m, cross(p)))} ${fmt(at(m, cross(q)))} ${fmt(q)}`
        }
      }
    } else {
      // smooth through the waypoints: tangents follow the neighbours, the end tangents follow the rank axis
      const tangents = pts.map((p, i): Point => {
        if (i === 0 || i === pts.length - 1) {
          const along = Math.sign(i === 0 ? rank(pts[1]!) - rank(p) : rank(p) - rank(pts[i - 1]!)) || sign
          return at(along, 0)
        }
        const dx = pts[i + 1]!.x - pts[i - 1]!.x
        const dy = pts[i + 1]!.y - pts[i - 1]!.y
        const len = Math.hypot(dx, dy) || 1
        return { x: dx / len, y: dy / len }
      })
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1]!
        const q = pts[i]!
        const h = Math.hypot(q.x - p.x, q.y - p.y) * 0.4
        const tp = tangents[i - 1]!
        const tq = tangents[i]!
        d += `C${fmt({ x: p.x + tp.x * h, y: p.y + tp.y * h })} ${fmt({ x: q.x - tq.x * h, y: q.y - tq.y * h })} ${fmt(q)}`
      }
    }
  } else {
    const R = 8
    d = `M${fmt(pts[0]!)}`
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1]!
      const q = pts[i]!
      const dc = cross(q) - cross(p)
      if (Math.abs(dc) < 0.01) {
        d += `L${fmt(q)}`
        continue
      }
      const m = (rank(p) + rank(q)) / 2
      const dr1 = Math.abs(m - rank(p))
      const r = Math.max(0, Math.min(R, Math.abs(dc) / 2, dr1))
      const s1 = Math.sign(rank(q) - rank(p)) || sign
      const s2 = Math.sign(dc)
      d += `L${fmt(at(m - s1 * r, cross(p)))}Q${fmt(at(m, cross(p)))} ${fmt(at(m, cross(p) + s2 * r))}`
      d += `L${fmt(at(m, cross(q) - s2 * r))}Q${fmt(at(m, cross(q)))} ${fmt(at(m + s1 * r, cross(q)))}L${fmt(q)}`
    }
  }
  const label = placed.label ? { x: placed.label.x + placed.label.width / 2, y: placed.label.y + placed.label.height / 2 } : undefined
  return { d, points: pts, label: label ?? undefined }
}

/** Midpoint of a routed edge, used to place a label when the layout did not reserve one. */
export function edgeMidpoint(points: Point[]): Point {
  return polylineMidpoint(points)
}
