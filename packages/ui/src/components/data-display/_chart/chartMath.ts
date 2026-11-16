/**
 * Pure numeric helpers shared by the dependency-free SVG charts (Sparkline, BarChart, LineChart, ...).
 * No Vue, no DOM: everything here is unit-tested in chartMath.test.ts.
 */

export interface Point {
  x: number
  y: number
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Round to 2 decimals for compact SVG path output (also normalises -0 to 0). */
export function r2(n: number): number {
  const v = Math.round(n * 100) / 100
  return v === 0 ? 0 : v
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** [min, max] over the finite numbers in `values`; `null` when there are none. */
export function extent(values: readonly unknown[]): [number, number] | null {
  let min = Infinity
  let max = -Infinity
  for (const v of values) {
    if (!isFiniteNumber(v)) continue
    if (v < min) min = v
    if (v > max) max = v
  }
  return min === Infinity ? null : [min, max]
}

function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range))
  const frac = range / 10 ** exp
  let nice: number
  if (round) nice = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10
  else nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  return nice * 10 ** exp
}

/**
 * "Nice" axis ticks (1/2/5 × 10^n steps) that cover [min, max].
 * Never throws: non-finite input falls back to [0, 1], min > max is swapped, min === max is padded,
 * `count` is clamped to 2..50. Result is ascending with no floating-point noise (0.1 + 0.2 → 0.3).
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  let lo = min
  let hi = max
  if (!isFiniteNumber(lo) && !isFiniteNumber(hi)) return [0, 1]
  if (!isFiniteNumber(lo)) lo = hi
  if (!isFiniteNumber(hi)) hi = lo
  if (lo > hi) [lo, hi] = [hi, lo]
  if (lo === hi) {
    if (lo === 0) return [0, 1]
    const pad = Math.abs(lo) * 0.1
    lo -= pad
    hi += pad
  }
  const n = clamp(Math.floor(Number.isFinite(count) ? count : 5), 2, 50)
  const step = niceNum(niceNum(hi - lo, false) / (n - 1), true)
  if (!isFiniteNumber(step) || step <= 0) return [lo, hi]
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  const decimals = clamp(-Math.floor(Math.log10(step)) + 1, 0, 12)
  const total = Math.min(100, Math.round((end - start) / step))
  const ticks: number[] = []
  for (let i = 0; i <= total; i++) {
    const t = Number((start + i * step).toFixed(decimals))
    ticks.push(t === 0 ? 0 : t)
  }
  return ticks
}

/** Linear scale. A zero-width domain maps everything to the middle of the range. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  if (d0 === d1) return () => (r0 + r1) / 2
  const k = (r1 - r0) / (d1 - d0)
  return (v) => r0 + (v - d0) * k
}

// ES2023 value that older lib typings do not list: a value that rounds to zero prints without a sign
const NO_NEGATIVE_ZERO = 'negative' as Intl.NumberFormatOptions['signDisplay']

/** `1200` → `1.2K`. Non-finite → `–`. A value that rounds to zero prints `0`, never `-0`. */
export function formatCompact(n: number): string {
  if (!isFiniteNumber(n)) return '–'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, signDisplay: NO_NEGATIVE_ZERO }).format(n)
}

/** Full-precision-ish number for tooltips: `1234.5678` → `1,234.57`. Non-finite → `–`. */
export function formatNumber(n: number): string {
  if (!isFiniteNumber(n)) return '–'
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2, signDisplay: NO_NEGATIVE_ZERO }).format(n)
}

/** Split into runs of consecutive non-null points (gaps come from NaN/missing values). */
export function runs(points: readonly (Point | null)[]): Point[][] {
  const out: Point[][] = []
  let cur: Point[] = []
  for (const p of points) {
    if (p) cur.push(p)
    else if (cur.length) {
      out.push(cur)
      cur = []
    }
  }
  if (cur.length) out.push(cur)
  return out
}

/** SVG path for a polyline that breaks at gaps. Empty input → ''. */
export function linePath(points: readonly (Point | null)[]): string {
  return runs(points)
    .map((run) => run.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(p.x)},${r2(p.y)}`).join(' '))
    .join(' ')
}

/** SVG path for the filled area under a polyline down to `baseY`. Single-point runs are skipped. */
export function areaPath(points: readonly (Point | null)[], baseY: number): string {
  return runs(points)
    .filter((run) => run.length > 1)
    .map((run) => {
      const first = run[0]!
      const last = run[run.length - 1]!
      const body = run.map((p) => `L${r2(p.x)},${r2(p.y)}`).join(' ')
      return `M${r2(first.x)},${r2(baseY)} ${body} L${r2(last.x)},${r2(baseY)} Z`
    })
    .join(' ')
}

/** Points that have no neighbour on either side (a line can't draw them; render a dot instead). */
export function isolatedPoints(points: readonly (Point | null)[]): Point[] {
  return runs(points)
    .filter((run) => run.length === 1)
    .map((run) => run[0]!)
}

export type Curve = 'linear' | 'smooth' | 'step'

/** Known curve name, anything else is `linear`. */
export function normalizeCurve(v: unknown): Curve {
  return v === 'smooth' || v === 'step' ? v : 'linear'
}

/**
 * Tangents of a monotone cubic (Fritsch-Carlson) through `run`: the curve never overshoots the data, so a smoothed
 * series cannot dip below a zero baseline or above its maximum between two points.
 */
function monotoneTangents(run: readonly Point[]): number[] {
  const n = run.length
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const w = run[i + 1]!.x - run[i]!.x
    dx.push(w)
    m.push(w === 0 ? 0 : (run[i + 1]!.y - run[i]!.y) / w)
  }
  const t: number[] = new Array(n).fill(0)
  t[0] = m[0]!
  t[n - 1] = m[n - 2]!
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i]! / m[i]!
    const b = t[i + 1]! / m[i]!
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      t[i] = tau * a * m[i]!
      t[i + 1] = tau * b * m[i]!
    }
  }
  return t
}

/** Path commands from the second point of `run` on (the caller has already moved to the first). */
function curveSegments(run: readonly Point[], curve: Curve): string {
  if (curve === 'step') return run.slice(1).map((p) => `H${r2(p.x)} V${r2(p.y)}`).join(' ')
  const t = monotoneTangents(run)
  const out: string[] = []
  for (let i = 0; i < run.length - 1; i++) {
    const a = run[i]!
    const b = run[i + 1]!
    const k = (b.x - a.x) / 3
    out.push(`C${r2(a.x + k)},${r2(a.y + t[i]! * k)} ${r2(b.x - k)},${r2(b.y - t[i + 1]! * k)} ${r2(b.x)},${r2(b.y)}`)
  }
  return out.join(' ')
}

/**
 * Line path for a `curve`: `linear` is exactly `linePath`; `smooth` is a monotone cubic Bezier; `step` holds each value
 * until the next point (horizontal then vertical). Breaks at gaps like `linePath`.
 */
export function curvePath(points: readonly (Point | null)[], curve: Curve = 'linear'): string {
  if (curve !== 'smooth' && curve !== 'step') return linePath(points)
  return runs(points)
    .map((run) => {
      const first = `M${r2(run[0]!.x)},${r2(run[0]!.y)}`
      return run.length > 1 ? `${first} ${curveSegments(run, curve)}` : first
    })
    .join(' ')
}

/** Filled area under `curvePath` down to `baseY`; `linear` is exactly `areaPath`. Single-point runs are skipped. */
export function curveAreaPath(points: readonly (Point | null)[], baseY: number, curve: Curve = 'linear'): string {
  if (curve !== 'smooth' && curve !== 'step') return areaPath(points, baseY)
  return runs(points)
    .filter((run) => run.length > 1)
    .map((run) => {
      const first = run[0]!
      const last = run[run.length - 1]!
      return `M${r2(first.x)},${r2(baseY)} L${r2(first.x)},${r2(first.y)} ${curveSegments(run, curve)} L${r2(last.x)},${r2(baseY)} Z`
    })
    .join(' ')
}
