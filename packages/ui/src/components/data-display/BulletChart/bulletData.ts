/**
 * Pure data helpers of BulletChart: tolerant normalisation of the `bullets` prop and the value domain (with "nice" ticks).
 * No Vue, no DOM.
 */
import { isFiniteNumber, niceTicks } from '../_chart/chartMath'
import { toneClasses, type ChartTone } from '../_chart/tones'

export interface BulletInput {
  /** Name of the measure, e.g. "Orders shipped". */
  label: string
  /** The measured value (the thin bar). */
  value: number
  /** The goal (the marker). */
  target?: number
  /** Ascending upper bounds of the qualitative range bands, e.g. `[50, 75, 100]`. Unsorted input is sorted. */
  ranges?: number[]
  /** Upper end of this measure's scale. Without it the scale ends at the largest of the value, target and ranges. */
  max?: number
  tone?: ChartTone
  /** Unit text appended to the value, e.g. `'ms'`. */
  unit?: string
}

export interface Bullet {
  label: string
  value: number | null
  target: number | null
  ranges: number[]
  max: number | null
  tone: ChartTone | null
  unit: string
}

/** Values beyond this are clamped so the layout maths never overflows to Infinity. */
export const MAX_ABS = 1e15
/** A bullet chart renders at most this many measures; the rest is announced in an inline message. */
export const MAX_BULLETS = 60
/** At most this many range bands per measure. */
export const MAX_RANGES = 5

const bound = (v: unknown): number | null => (isFiniteNumber(v) ? Math.max(-MAX_ABS, Math.min(MAX_ABS, v)) : null)

/** Valid entries only (objects), finite numbers only, ranges sorted ascending without duplicates. Never throws. */
export function normalizeBullets(raw: unknown): Bullet[] {
  const list = Array.isArray(raw) ? raw : []
  const out: Bullet[] = []
  for (const item of list) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const b = item as Partial<BulletInput>
    const ranges = Array.isArray(b.ranges)
      ? [...new Set(b.ranges.map(bound).filter((n): n is number => n !== null))].sort((a, c) => a - c).slice(0, MAX_RANGES)
      : []
    const label = typeof b.label === 'string' && b.label.trim() !== '' ? b.label : `Measure ${out.length + 1}`
    out.push({
      label,
      value: bound(b.value),
      target: bound(b.target),
      ranges,
      max: bound(b.max),
      tone: b.tone && b.tone in toneClasses ? b.tone : null,
      unit: typeof b.unit === 'string' ? b.unit : '',
    })
  }
  return out
}

export interface BulletDomain {
  lo: number
  hi: number
  ticks: number[]
}

/**
 * Value domain shared by `bullets`. It always contains 0; the upper end is the largest explicit `max` (when every bullet
 * has one the domain ends exactly there) or the nice tick above the largest value, target or range.
 */
export function bulletDomain(bullets: readonly Bullet[]): BulletDomain {
  const nums: number[] = [0]
  for (const b of bullets) {
    if (b.value !== null) nums.push(b.value)
    if (b.target !== null) nums.push(b.target)
    nums.push(...b.ranges)
  }
  const lo = Math.min(...nums)
  const top = Math.max(...nums)
  const maxes = bullets.map((b) => (b.max !== null && b.max > lo ? b.max : null))
  const explicit = bullets.length > 0 && maxes.every((m) => m !== null)
  let hi = Math.max(top, ...maxes.map((m) => m ?? -Infinity))
  if (explicit) hi = Math.max(...(maxes as number[]))
  if (!(hi > lo)) hi = lo + 1
  const nice = niceTicks(lo, hi, 5)
  if (explicit) {
    const ticks = nice.filter((t) => t >= lo && t <= hi)
    return { lo, hi, ticks: ticks.length > 1 ? ticks : [lo, hi] }
  }
  return { lo: Math.min(lo, nice[0]!), hi: nice[nice.length - 1]!, ticks: nice }
}

/** Literal Tailwind fills of the range bands: darkest (lowest range) first. Keyed by the number of bands. */
export const BAND_FILLS: Record<number, readonly string[]> = {
  1: ['fill-muted-foreground/20'],
  2: ['fill-muted-foreground/30', 'fill-muted-foreground/15'],
  3: ['fill-muted-foreground/30', 'fill-muted-foreground/20', 'fill-muted-foreground/10'],
  4: ['fill-muted-foreground/30', 'fill-muted-foreground/20', 'fill-muted-foreground/15', 'fill-muted-foreground/10'],
  5: ['fill-muted-foreground/30', 'fill-muted-foreground/25', 'fill-muted-foreground/20', 'fill-muted-foreground/15', 'fill-muted-foreground/10'],
}
/** Fill of the single track drawn behind a measure without ranges. */
export const TRACK_FILL = 'fill-muted-foreground/10'

/** Band class for the `i`-th of `count` bands. */
export function bandFill(i: number, count: number): string {
  const set = BAND_FILLS[Math.min(MAX_RANGES, Math.max(1, count))]!
  return set[Math.min(set.length - 1, Math.max(0, i))]!
}

/** Hatch of a band: the darkest band is hatched densely, the next one sparsely (only when there are bands to tell apart). */
export function bandHatch(i: number, count: number): 'dense' | 'sparse' | null {
  if (count < 2) return null
  if (i === 0) return 'dense'
  if (i === 1 && count >= 3) return 'sparse'
  return null
}
