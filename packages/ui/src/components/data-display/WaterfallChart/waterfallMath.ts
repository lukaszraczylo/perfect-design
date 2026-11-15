/**
 * Pure helpers of WaterfallChart: running totals, bar kinds and the signed value text.
 * No Vue, no DOM; unit-tested in waterfallMath.test.ts.
 */
import { isFiniteNumber } from '../_chart/chartMath'

/** `start` opens the running total, `delta` changes it, `subtotal` and `total` show it (their `value` is not used). */
export type WaterfallType = 'start' | 'delta' | 'subtotal' | 'total'
export const WATERFALL_TYPES: readonly WaterfallType[] = ['start', 'delta', 'subtotal', 'total']

export interface WaterfallItemInput {
  label: string
  /** Opening value of `start`, change of `delta`. Ignored by `subtotal` and `total`, which show the running total. */
  value?: number | null
  /** Defaults to `start` for the first item and `delta` for the others. */
  type?: WaterfallType
}

/** How a bar is drawn: a rise, a fall, or a total (start, subtotal, total). */
export type WaterfallKind = 'increase' | 'decrease' | 'total'

export interface WaterfallBar {
  index: number
  label: string
  type: WaterfallType
  kind: WaterfallKind
  /** The change of a delta; `null` for the other types and for a delta without a finite value. */
  delta: number | null
  /** Level the bar starts at: the running total before a delta, 0 for the others. */
  from: number
  /** Level the bar ends at: the running total after it. */
  to: number
  /** True when the item had no usable value (it is drawn as a bar of no height and reads "n/a"). */
  missing: boolean
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The bars with their levels. Tolerant: entries that are not objects are skipped, an unknown type is a delta (or the start). */
export function computeBars(items: unknown): WaterfallBar[] {
  const list = Array.isArray(items) ? items.filter(isRecord) : []
  const bars: WaterfallBar[] = []
  let running = 0
  list.forEach((it, index) => {
    const type: WaterfallType = WATERFALL_TYPES.includes(it.type as WaterfallType) ? (it.type as WaterfallType) : index === 0 ? 'start' : 'delta'
    const label = typeof it.label === 'string' ? it.label : ''
    const value = isFiniteNumber(it.value) ? it.value : null
    if (type === 'start') {
      const ok = value !== null
      running = ok ? value : 0
      bars.push({ index, label, type, kind: 'total', delta: null, from: 0, to: running, missing: !ok })
    } else if (type === 'delta') {
      const next = value === null ? NaN : running + value
      const ok = Number.isFinite(next)
      const to = ok ? next : running
      bars.push({ index, label, type, kind: ok && value! < 0 ? 'decrease' : 'increase', delta: ok ? value : null, from: running, to, missing: !ok })
      running = to
    } else {
      bars.push({ index, label, type, kind: 'total', delta: null, from: 0, to: running, missing: false })
    }
  })
  return bars
}

/** `+12`, `−5` (a real minus sign) or `0`, with `fmt` applied to the size of the change. */
export function signed(value: number, fmt: (n: number) => string): string {
  if (value > 0) return `+${fmt(value)}`
  if (value < 0) return `−${fmt(-value)}`
  return fmt(0)
}

export const KIND_LABEL: Record<WaterfallKind, string> = { increase: 'Increase', decrease: 'Decrease', total: 'Total' }

/** Word for a bar in the data table and the tooltip. */
export function barWord(bar: WaterfallBar): string {
  if (bar.type === 'delta') return bar.missing ? 'change' : bar.kind
  return bar.type
}
