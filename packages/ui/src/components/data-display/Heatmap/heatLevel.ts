import { isFiniteNumber } from '../_chart/chartMath'
import type { ChartTone } from '../_chart/tones'

/**
 * Intensity ramp per tone. Literal class names so Tailwind's scanner emits them
 * (index 0 = faintest, 4 = full colour).
 */
export const HEAT_CLASSES: Record<ChartTone, readonly [string, string, string, string, string]> = {
  'chart-1': ['bg-chart-1/10', 'bg-chart-1/25', 'bg-chart-1/45', 'bg-chart-1/70', 'bg-chart-1'],
  'chart-2': ['bg-chart-2/10', 'bg-chart-2/25', 'bg-chart-2/45', 'bg-chart-2/70', 'bg-chart-2'],
  'chart-3': ['bg-chart-3/10', 'bg-chart-3/25', 'bg-chart-3/45', 'bg-chart-3/70', 'bg-chart-3'],
  'chart-4': ['bg-chart-4/10', 'bg-chart-4/25', 'bg-chart-4/45', 'bg-chart-4/70', 'bg-chart-4'],
  'chart-5': ['bg-chart-5/10', 'bg-chart-5/25', 'bg-chart-5/45', 'bg-chart-5/70', 'bg-chart-5'],
  primary: ['bg-primary/10', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'],
  success: ['bg-success/10', 'bg-success/25', 'bg-success/45', 'bg-success/70', 'bg-success'],
  warning: ['bg-warning/10', 'bg-warning/25', 'bg-warning/45', 'bg-warning/70', 'bg-warning'],
  danger: ['bg-destructive/10', 'bg-destructive/25', 'bg-destructive/45', 'bg-destructive/70', 'bg-destructive'],
  info: ['bg-info/10', 'bg-info/25', 'bg-info/45', 'bg-info/70', 'bg-info'],
  muted: ['bg-muted-foreground/10', 'bg-muted-foreground/25', 'bg-muted-foreground/45', 'bg-muted-foreground/70', 'bg-muted-foreground'],
}

export const HEAT_EMPTY_CLASS = 'bg-muted'
export const MAX_HEAT_LEVELS = 5

/** `levels` clamped to an integer in 1..5 (non-finite → 5). */
export function normalizeLevels(levels: unknown): number {
  if (!isFiniteNumber(levels)) return MAX_HEAT_LEVELS
  return Math.min(MAX_HEAT_LEVELS, Math.max(1, Math.floor(levels)))
}

/**
 * Intensity bucket of `value` within [min, max].
 * 0 = empty (non-finite or exactly 0); otherwise 1..levels (values outside the domain are clamped;
 * when min === max every non-empty value is the top level).
 */
export function heatLevel(value: unknown, min: number, max: number, levels: number): number {
  if (!isFiniteNumber(value) || value === 0) return 0
  const n = normalizeLevels(levels)
  const lo = isFiniteNumber(min) ? min : 0
  const hi = isFiniteNumber(max) ? max : lo
  if (hi <= lo) return n
  // Halved operands keep ±1e308 domains from overflowing to Infinity.
  const t = (value / 2 - lo / 2) / (hi / 2 - lo / 2)
  return Math.min(n, Math.max(1, Math.ceil(t * n)))
}

/** Background class for a level: empty → `bg-muted`; otherwise the ramp entry spread across `levels` steps. */
export function heatClass(tone: ChartTone, level: number, levels: number): string {
  if (level <= 0) return HEAT_EMPTY_CLASS
  const ramp = HEAT_CLASSES[tone] ?? HEAT_CLASSES['chart-1']
  const n = normalizeLevels(levels)
  const lv = Math.min(n, Math.max(1, Math.floor(level)))
  const idx = n === 1 ? ramp.length - 1 : Math.round(((lv - 1) * (ramp.length - 1)) / (n - 1))
  return ramp[idx]!
}
