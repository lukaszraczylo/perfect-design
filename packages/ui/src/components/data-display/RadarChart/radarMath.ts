/**
 * Pure helpers of RadarChart: ring scale, polar geometry and the radius that keeps every axis label inside the viewBox.
 * No Vue, no DOM; unit-tested in radarMath.test.ts.
 */
import { clamp, extent, isFiniteNumber, r2 } from '../_chart/chartMath'

export interface RadarScale {
  min: number
  max: number
}

const LADDER = [1, 2, 2.5, 5, 10]

/** Smallest 1 / 2 / 2.5 / 5 x 10^n that is >= `x` (a non-positive or non-finite `x` gives 1). */
export function niceStep(x: number): number {
  if (!isFiniteNumber(x) || x <= 0) return 1
  const exp = Math.floor(Math.log10(x))
  const unit = 10 ** exp
  const m = x / unit
  const pick = LADDER.find((l) => l >= m - 1e-9) ?? 10
  return pick * unit
}

/** The next step of the ladder after `step`. */
export function nextStep(step: number): number {
  return niceStep(step * 1.0001)
}

/**
 * Scale of the rings. Without `min` the scale starts at 0 (or the lowest value when that is negative); without `max` it
 * ends at the first multiple of a nice step (`levels` steps from the start) that covers the data. A reversed or equal
 * `min` / `max` pair is repaired instead of drawing nothing.
 */
export function radarScale(values: readonly unknown[], levels: number, min?: unknown, max?: unknown): RadarScale {
  const ext = extent(values) ?? [0, 1]
  const n = clamp(Math.round(levels), 1, 12)
  const userMin = isFiniteNumber(min) ? min : undefined
  const userMax = isFiniteNumber(max) ? max : undefined
  if (userMin !== undefined && userMax !== undefined) {
    const lo = Math.min(userMin, userMax)
    const hi = Math.max(userMin, userMax)
    return { min: lo, max: hi === lo ? lo + 1 : hi }
  }
  if (userMax !== undefined) {
    const lo = Math.min(0, ext[0], userMax - 1)
    return { min: lo >= userMax ? userMax - 1 : lo, max: userMax }
  }
  const base = userMin ?? Math.min(0, ext[0])
  let step = niceStep((Math.max(ext[1], base) - base) / n)
  // An automatic start is moved down to a multiple of the step so rings carry round numbers.
  const lo = userMin !== undefined ? userMin : Math.floor(base / step) * step
  let hi = lo + step * n
  for (let i = 0; i < 12 && hi < ext[1]; i++) {
    step = nextStep(step)
    hi = lo + step * n
  }
  return { min: lo, max: hi }
}

/** Radius (0..1) of `value` on the scale. Values outside the scale are clamped to the centre / rim. */
export function radarFraction(value: number, scale: RadarScale): number {
  const span = scale.max - scale.min
  return span > 0 ? clamp((value - scale.min) / span, 0, 1) : 0
}

export interface Polar {
  /** Unit vector of the axis (x to the right, y down), the first axis points up. */
  dx: number
  dy: number
}

/** Direction of axis `i` of `n`: the first one points up, the rest follow clockwise. */
export function axisDirection(i: number, n: number): Polar {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, n)
  return { dx: r2(Math.cos(a) * 1e6) / 1e6, dy: r2(Math.sin(a) * 1e6) / 1e6 }
}

/** Closed polygon path through the points. */
export function polygonPath(points: readonly { x: number; y: number }[]): string {
  return points.length ? `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(p.x)},${r2(p.y)}`).join(' ')} Z` : ''
}

/** Which side of its anchor an axis label sits on: axes on the right read to the right, on the left to the left. */
export function labelAnchor(dx: number): 'start' | 'middle' | 'end' {
  return dx > 0.25 ? 'start' : dx < -0.25 ? 'end' : 'middle'
}

/**
 * Largest radius for which every axis label (box `widths[i]` x `heights[i]`, lines of `lineH`) stays inside a W x H box,
 * `gap` away from the rim. Never smaller than `minR`; a tiny box therefore clips instead of collapsing the chart.
 */
export function radarRadius(W: number, H: number, widths: readonly number[], heights: readonly number[], gap = 12, pad = 6, minR = 24, lineH = 14): number {
  const cx = W / 2
  const cy = H / 2
  const n = widths.length
  let R = Math.min(cx, cy) - pad
  for (let i = 0; i < n; i++) {
    const { dx, dy } = axisDirection(i, n)
    const w = widths[i]!
    const h = heights[i] ?? lineH
    const half = h / 2
    // A label of several lines is pushed away from the rim by half of its extra height, so its near edge keeps the gap.
    const shift = (h - lineH) / 2
    const reach = labelAnchor(dx) === 'middle' ? w / 2 : w
    if (dx > 0.01) R = Math.min(R, (W - pad - cx - reach) / dx - gap)
    else if (dx < -0.01) R = Math.min(R, (cx - pad - reach) / -dx - gap)
    if (dy > 0.01) R = Math.min(R, (H - pad - half - cy) / dy - gap - shift)
    else if (dy < -0.01) R = Math.min(R, (cy - pad - half) / -dy - gap - shift)
  }
  return Math.max(minR, R)
}
