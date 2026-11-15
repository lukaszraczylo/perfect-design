import type { SortDirection, SortState } from './types'

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** null, undefined, NaN and Invalid Date always sort last, in either direction. */
export function isMissing(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'number') return Number.isNaN(v)
  if (v instanceof Date) return Number.isNaN(v.getTime())
  return false
}

function rank(v: unknown): number {
  if (typeof v === 'number' || typeof v === 'bigint' || v instanceof Date) return 0
  if (typeof v === 'boolean') return 1
  return 2
}

/**
 * Ascending comparison of two present (non-missing) values. numbers/bigints/Dates compare numerically,
 * booleans false < true, everything else as strings via a numeric, case/accent-insensitive collator.
 * Mixed kinds are ranked number < boolean < string so the order is total and deterministic.
 */
export function compareValues(a: unknown, b: unknown): number {
  const ra = rank(a)
  const rb = rank(b)
  if (ra !== rb) return ra - rb
  if (ra === 0) {
    const na = a instanceof Date ? a.getTime() : (a as number | bigint)
    const nb = b instanceof Date ? b.getTime() : (b as number | bigint)
    return na < nb ? -1 : na > nb ? 1 : 0
  }
  if (ra === 1) return Number(a) - Number(b)
  return collator.compare(String(a), String(b))
}

/**
 * Pure, stable sort. Returns a new array; the input is never mutated. `sort === null` returns a copy in
 * source order. Missing values (see `isMissing`) go last for both directions; ties keep source order.
 */
export function sortRows<T>(
  rows: readonly T[],
  sort: SortState | null | undefined,
  getValue: (row: T, key: string) => unknown,
): T[] {
  if (!sort) return rows.slice()
  const dir = sort.direction === 'desc' ? -1 : 1
  const decorated = rows.map((row, index) => ({ row, index, value: getValue(row, sort.key) }))
  decorated.sort((x, y) => {
    const mx = isMissing(x.value)
    const my = isMissing(y.value)
    if (mx || my) return mx && my ? x.index - y.index : mx ? 1 : -1
    return compareValues(x.value, y.value) * dir || x.index - y.index
  })
  return decorated.map((d) => d.row)
}

/** none -> asc -> desc -> none. */
export function nextSort(current: SortState | null | undefined, key: string): SortState | null {
  const dir: SortDirection | null = current && current.key === key ? current.direction : null
  if (dir === null) return { key, direction: 'asc' }
  if (dir === 'asc') return { key, direction: 'desc' }
  return null
}
