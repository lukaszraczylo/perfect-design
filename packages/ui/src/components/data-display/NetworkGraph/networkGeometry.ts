/**
 * Sizes and edge geometry of NetworkGraph in pixel space. Pure; every output is finite.
 */
import { r2 } from '../_chart/chartMath'
import type { NormGraph } from './graphData'

export interface Pt {
  x: number
  y: number
}

/** Radius range in px. Many nodes shrink it so a dense graph stays readable. */
export function radiusRange(n: number): { min: number; max: number } {
  const f = n <= 40 ? 1 : Math.max(0.35, Math.sqrt(40 / n))
  return { min: 5 * f, max: 14 * f }
}

/** Node radii: `size` when set, else the weighted degree, mapped on a square-root scale to the radius range. */
export function nodeRadii(g: NormGraph): number[] {
  const { min, max } = radiusRange(g.nodes.length)
  const vals = g.nodes.map((n) => n.size ?? n.degree)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  return vals.map((v) => {
    const t = hi > lo ? Math.sqrt((v / 2 - lo / 2) / (hi / 2 - lo / 2)) : 0.35
    return r2(min + (max - min) * (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0.35))
  })
}

/** Stroke width of an edge: 1.5 without weights, otherwise 1 to 4 on a square-root scale of the weight. */
export function edgeWidths(g: NormGraph): number[] {
  const ws = g.edges.filter((e) => e.weight !== null).map((e) => e.weight!)
  const lo = Math.min(...ws)
  const hi = Math.max(...ws)
  return g.edges.map((e) => {
    if (e.weight === null) return 1.5
    if (!(hi > lo)) return 2
    const t = Math.sqrt((e.weight / 2 - lo / 2) / (hi / 2 - lo / 2))
    return r2(1 + 3 * (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0))
  })
}

export interface EdgeShape {
  /** Path data of the line. */
  d: string
  /** Polygon points of the arrowhead, or '' for none. */
  arrow: string
  /** Point on the line halfway along, for the edge label. */
  mid: Pt
}

const ARROW = 7
const unit = (x: number, y: number): Pt => {
  const l = Math.hypot(x, y)
  return l > 1e-9 ? { x: x / l, y: y / l } : { x: 1, y: 0 }
}

function arrowPoints(tip: Pt, dir: Pt, size: number): string {
  const bx = tip.x - dir.x * size
  const by = tip.y - dir.y * size
  const w = size * 0.45
  return [tip, { x: bx - dir.y * w, y: by + dir.x * w }, { x: bx + dir.y * w, y: by - dir.x * w }].map((p) => `${r2(p.x)},${r2(p.y)}`).join(' ')
}

/**
 * Line between two nodes, trimmed at the node borders so an arrowhead touches the border. `curved` bends the line to one
 * side of its direction (so A to B and B to A separate); a self loop is a small loop above the node.
 */
export function edgeShape(a: Pt & { r: number }, b: Pt & { r: number }, o: { curved: boolean; directed: boolean; self: boolean }): EdgeShape {
  if (o.self) {
    const r = a.r
    const l = r * 1.2 + 6
    const p0 = { x: a.x - r * 0.6, y: a.y - r * 0.8 }
    const p1 = { x: a.x + r * 0.6, y: a.y - r * 0.8 }
    const c0 = { x: p0.x - l, y: p0.y - l * 1.6 }
    const c1 = { x: p1.x + l, y: p1.y - l * 1.6 }
    const dir = unit(p1.x - c1.x, p1.y - c1.y)
    const end = o.directed ? { x: p1.x - dir.x * ARROW * 0.8, y: p1.y - dir.y * ARROW * 0.8 } : p1
    return {
      d: `M${r2(p0.x)},${r2(p0.y)} C${r2(c0.x)},${r2(c0.y)} ${r2(c1.x)},${r2(c1.y)} ${r2(end.x)},${r2(end.y)}`,
      arrow: o.directed ? arrowPoints(p1, dir, ARROW) : '',
      mid: { x: a.x, y: r2(p0.y - l * 1.2) },
    }
  }
  const u = unit(b.x - a.x, b.y - a.y)
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const bend = o.curved ? Math.min(len * 0.2, 40) : 0
  const c = { x: mx - u.y * bend, y: my + u.x * bend }
  const ds = o.curved ? unit(c.x - a.x, c.y - a.y) : u
  const de = o.curved ? unit(c.x - b.x, c.y - b.y) : { x: -u.x, y: -u.y }
  const start = { x: a.x + ds.x * a.r, y: a.y + ds.y * a.r }
  const tip = { x: b.x + de.x * b.r, y: b.y + de.y * b.r }
  const into = { x: -de.x, y: -de.y }
  const end = o.directed ? { x: tip.x - into.x * ARROW * 0.8, y: tip.y - into.y * ARROW * 0.8 } : tip
  const d = o.curved ? `M${r2(start.x)},${r2(start.y)} Q${r2(c.x)},${r2(c.y)} ${r2(end.x)},${r2(end.y)}` : `M${r2(start.x)},${r2(start.y)} L${r2(end.x)},${r2(end.y)}`
  const mid = o.curved ? { x: r2(0.25 * start.x + 0.5 * c.x + 0.25 * end.x), y: r2(0.25 * start.y + 0.5 * c.y + 0.25 * end.y) } : { x: r2(mx), y: r2(my) }
  return { d, arrow: o.directed ? arrowPoints(tip, into, ARROW) : '', mid }
}
