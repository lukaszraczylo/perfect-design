/**
 * Node shape geometry for flowchart-like diagrams: size from the label block, SVG path, and where a line from the
 * centre toward a point leaves the outline (so edges and arrowheads touch the shape, not its bounding box).
 */
import { r2 } from './text'
import type { Metrics, Point } from './types'

export const NODE_SHAPES = [
  'rect', 'round', 'stadium', 'subroutine', 'cylinder', 'circle', 'doublecircle', 'rhombus', 'hexagon',
  'parallelogram', 'parallelogram-alt', 'trapezoid', 'trapezoid-alt', 'asymmetric',
] as const
export type NodeShape = (typeof NODE_SHAPES)[number]

export const isNodeShape = (v: unknown): v is NodeShape => (NODE_SHAPES as readonly unknown[]).includes(v)

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

const DOUBLE_GAP = 6
const CAP = 9

/** Outer size of a node whose label block is `tw` x `th`. */
export function shapeSize(shape: NodeShape, tw: number, th: number, m: Metrics): { width: number; height: number } {
  const w = tw + 2 * m.padX
  const h = th + 2 * m.padY
  switch (shape) {
    case 'stadium':
      return { width: w + h * 0.5, height: h }
    case 'subroutine':
      return { width: w + 2 * 8, height: h }
    case 'cylinder':
      return { width: w, height: h + 2 * CAP }
    case 'circle':
    case 'doublecircle': {
      const d = Math.max(Math.hypot(tw, th) + m.padX, h)
      const extra = shape === 'doublecircle' ? 2 * DOUBLE_GAP : 0
      return { width: d + extra, height: d + extra }
    }
    case 'rhombus':
      return { width: (tw + m.padX) * 1.7, height: (th + m.padY) * 1.7 }
    case 'hexagon':
    case 'parallelogram':
    case 'parallelogram-alt':
    case 'trapezoid':
    case 'trapezoid-alt':
      return { width: w + h * 0.6, height: h }
    case 'asymmetric':
      return { width: w + h * 0.4, height: h }
    default:
      return { width: w, height: h }
  }
}

const f = r2

function roundedRect(x: number, y: number, w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  if (r === 0) return `M${f(x)},${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`
  return `M${f(x + r)},${f(y)}H${f(x + w - r)}A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y + r)}V${f(y + h - r)}A${f(r)},${f(r)} 0 0 1 ${f(x + w - r)},${f(y + h)}H${f(x + r)}A${f(r)},${f(r)} 0 0 1 ${f(x)},${f(y + h - r)}V${f(y + r)}A${f(r)},${f(r)} 0 0 1 ${f(x + r)},${f(y)}Z`
}

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${f(cx - rx)},${f(cy)}A${f(rx)},${f(ry)} 0 1 0 ${f(cx + rx)},${f(cy)}A${f(rx)},${f(ry)} 0 1 0 ${f(cx - rx)},${f(cy)}Z`
}

/** Corner points of the polygonal shapes, or null for the others. */
export function polygonPoints(shape: NodeShape, b: Box): Point[] | null {
  const { x, y, width: w, height: h } = b
  const cx = x + w / 2
  const cy = y + h / 2
  const k = h * 0.3
  switch (shape) {
    case 'rhombus':
      return [{ x: cx, y }, { x: x + w, y: cy }, { x: cx, y: y + h }, { x, y: cy }]
    case 'hexagon':
      return [{ x: x + k, y }, { x: x + w - k, y }, { x: x + w, y: cy }, { x: x + w - k, y: y + h }, { x: x + k, y: y + h }, { x, y: cy }]
    case 'parallelogram':
      return [{ x: x + k, y }, { x: x + w, y }, { x: x + w - k, y: y + h }, { x, y: y + h }]
    case 'parallelogram-alt':
      return [{ x, y }, { x: x + w - k, y }, { x: x + w, y: y + h }, { x: x + k, y: y + h }]
    case 'trapezoid':
      return [{ x, y }, { x: x + w, y }, { x: x + w - k, y: y + h }, { x: x + k, y: y + h }]
    case 'trapezoid-alt':
      return [{ x: x + k, y }, { x: x + w - k, y }, { x: x + w, y: y + h }, { x, y: y + h }]
    case 'asymmetric':
      return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x: x + h * 0.2, y: cy }]
    default:
      return null
  }
}

/** Outline path (and extra inner strokes) of a node at `b`. `m.radius` is the corner radius of plain rectangles. */
export function shapePath(shape: NodeShape, b: Box, m: Metrics): { d: string; inner: string[] } {
  const { x, y, width: w, height: h } = b
  const cx = x + w / 2
  const cy = y + h / 2
  const poly = polygonPoints(shape, b)
  if (poly) return { d: `M${poly.map((p) => `${f(p.x)},${f(p.y)}`).join('L')}Z`, inner: [] }
  switch (shape) {
    case 'round':
      return { d: roundedRect(x, y, w, h, Math.max(m.radius, Math.min(10, h / 2))), inner: [] }
    case 'stadium':
      return { d: roundedRect(x, y, w, h, h / 2), inner: [] }
    case 'subroutine':
      return { d: roundedRect(x, y, w, h, 0), inner: [`M${f(x + 8)},${f(y)}V${f(y + h)}`, `M${f(x + w - 8)},${f(y)}V${f(y + h)}`] }
    case 'cylinder': {
      const rx = w / 2
      const ry = Math.min(CAP, h / 4)
      return {
        d: `M${f(x)},${f(y + ry)}A${f(rx)},${f(ry)} 0 0 1 ${f(x + w)},${f(y + ry)}V${f(y + h - ry)}A${f(rx)},${f(ry)} 0 0 1 ${f(x)},${f(y + h - ry)}Z`,
        inner: [`M${f(x)},${f(y + ry)}A${f(rx)},${f(ry)} 0 0 0 ${f(x + w)},${f(y + ry)}`],
      }
    }
    case 'circle':
      return { d: ellipse(cx, cy, w / 2, h / 2), inner: [] }
    case 'doublecircle':
      return { d: ellipse(cx, cy, w / 2, h / 2), inner: [ellipse(cx, cy, w / 2 - DOUBLE_GAP, h / 2 - DOUBLE_GAP)] }
    default:
      return { d: roundedRect(x, y, w, h, m.radius), inner: [] }
  }
}

function rayPolygon(poly: Point[], cx: number, cy: number, dx: number, dy: number): Point | null {
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const ex = b.x - a.x
    const ey = b.y - a.y
    const den = dx * ey - dy * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((a.x - cx) * ey - (a.y - cy) * ex) / den
    const u = ((a.x - cx) * dy - (a.y - cy) * dx) / den
    if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) best = t
  }
  return best === Infinity ? null : { x: cx + dx * best, y: cy + dy * best }
}

/** Where the ray from the centre of `b` toward `to` crosses the outline of `shape` (`cluster` is a plain rectangle). */
export function clipToShape(shape: NodeShape | 'cluster', b: Box, to: Point): Point {
  const cx = b.x + b.width / 2
  const cy = b.y + b.height / 2
  const dx = to.x - cx
  const dy = to.y - cy
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return { x: cx, y: b.y + b.height }
  if (shape === 'circle' || shape === 'doublecircle') {
    const rx = b.width / 2
    const ry = b.height / 2
    const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
    return { x: cx + dx * t, y: cy + dy * t }
  }
  if (shape !== 'cluster') {
    const poly = polygonPoints(shape, b)
    const hit = poly ? rayPolygon(poly, cx, cy, dx, dy) : null
    if (hit) return hit
  }
  const sx = Math.abs(dx) < 1e-9 ? Infinity : b.width / 2 / Math.abs(dx)
  const sy = Math.abs(dy) < 1e-9 ? Infinity : b.height / 2 / Math.abs(dy)
  const t = Math.min(sx, sy)
  return { x: cx + dx * t, y: cy + dy * t }
}

/**
 * Where the line `cross = c` (parallel to the rank axis) meets the outline of `shape`, on the high or low side along the
 * rank axis. `horizontal` means the rank axis is x. `c` is clamped into the shape so an edge always lands on it.
 */
export function lineHit(shape: NodeShape | 'cluster', b: Box, horizontal: boolean, c: number, high: boolean): Point {
  const lo = horizontal ? b.y : b.x
  const size = horizontal ? b.height : b.width
  const cc = Math.min(Math.max(c, lo + Math.min(2, size / 2)), lo + size - Math.min(2, size / 2))
  const rLo = horizontal ? b.x : b.y
  const rSize = horizontal ? b.width : b.height
  const at = (r: number): Point => (horizontal ? { x: r, y: cc } : { x: cc, y: r })
  if (shape === 'circle' || shape === 'doublecircle') {
    const mid = lo + size / 2
    const t = Math.min(1, Math.abs(cc - mid) / (size / 2))
    const half = (rSize / 2) * Math.sqrt(1 - t * t)
    const rc = rLo + rSize / 2
    return at(high ? rc + half : rc - half)
  }
  const poly = shape === 'cluster' ? null : polygonPoints(shape, b)
  if (!poly) return at(high ? rLo + rSize : rLo)
  let best: number | null = null
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!
    const q = poly[(i + 1) % poly.length]!
    const pc = horizontal ? p.y : p.x
    const qc = horizontal ? q.y : q.x
    if ((pc - cc) * (qc - cc) > 0 || pc === qc) continue
    const t = (cc - pc) / (qc - pc)
    const r = (horizontal ? p.x : p.y) + t * ((horizontal ? q.x : q.y) - (horizontal ? p.x : p.y))
    if (best === null || (high ? r > best : r < best)) best = r
  }
  return at(best ?? (high ? rLo + rSize : rLo))
}
