import { describe, expect, it } from 'vitest'
import { KIND_LABEL, barWord, computeBars, signed } from './waterfallMath'

describe('computeBars', () => {
  const items = [
    { label: 'Open', value: 100 },
    { label: 'Up', value: 50 },
    { label: 'Down', value: -30 },
    { label: 'Half', type: 'subtotal' },
    { label: 'Up 2', value: 20 },
    { label: 'End', type: 'total' },
  ]
  it('tracks the running total through starts, deltas, subtotals and totals', () => {
    const b = computeBars(items)
    expect(b.map((x) => [x.type, x.kind, x.from, x.to])).toEqual([
      ['start', 'total', 0, 100],
      ['delta', 'increase', 100, 150],
      ['delta', 'decrease', 150, 120],
      ['subtotal', 'total', 0, 120],
      ['delta', 'increase', 120, 140],
      ['total', 'total', 0, 140],
    ])
    expect(b.map((x) => x.delta)).toEqual([null, 50, -30, null, 20, null])
    expect(b.map((x) => x.index)).toEqual([0, 1, 2, 3, 4, 5])
    expect(b.every((x) => !x.missing)).toBe(true)
  })
  it('the first item is the start by default; an explicit type is honoured', () => {
    expect(computeBars([{ label: 'A', value: 5 }])[0]!.type).toBe('start')
    const b = computeBars([{ label: 'A', value: 5, type: 'delta' }, { label: 'B', value: 2 }])
    expect(b.map((x) => [x.type, x.from, x.to])).toEqual([['delta', 0, 5], ['delta', 5, 7]])
  })
  it('a start in the middle resets the running total', () => {
    const b = computeBars([{ label: 'A', value: 10 }, { label: 'B', value: 5 }, { label: 'New year', value: 100, type: 'start' }, { label: 'C', value: -20 }])
    expect(b[2]!.to).toBe(100)
    expect(b[3]!.to).toBe(80)
  })
  it('subtotals and totals ignore their value', () => {
    const b = computeBars([{ label: 'A', value: 10 }, { label: 'T', value: 999, type: 'total' }])
    expect(b[1]!.to).toBe(10)
    expect(b[1]!.delta).toBeNull()
  })
  it('an unknown type is a delta (or the start for the first item)', () => {
    const b = computeBars([{ label: 'A', value: 10, type: 'odd' }, { label: 'B', value: 5, type: 'odd' }])
    expect(b.map((x) => x.type)).toEqual(['start', 'delta'])
  })
  it('a zero change is a flat increase', () => {
    const b = computeBars([{ label: 'A', value: 10 }, { label: 'B', value: 0 }])
    expect(b[1]).toMatchObject({ kind: 'increase', delta: 0, from: 10, to: 10, missing: false })
  })
  it('an item without a finite value is missing and changes nothing', () => {
    const b = computeBars([{ label: 'A', value: Number.NaN }, { label: 'B', value: 5 }, { label: 'C', value: null }, { label: 'D' }, { label: 'E', value: Number.POSITIVE_INFINITY }])
    expect(b.map((x) => x.missing)).toEqual([true, false, true, true, true])
    expect(b.map((x) => x.to)).toEqual([0, 5, 5, 5, 5])
    expect(b[2]!.delta).toBeNull()
  })
  it('an overflowing running total makes the change missing instead of Infinity', () => {
    const b = computeBars([{ label: 'A', value: 1e308 }, { label: 'B', value: 1e308 }, { label: 'C', value: 1 }])
    expect(b[1]!.missing).toBe(true)
    expect(b[1]!.to).toBe(1e308)
    expect(b[2]!.to).toBe(1e308)
  })
  it('skips entries that are not objects and fills missing labels', () => {
    const b = computeBars([null, 'x', [], { value: 3 }])
    expect(b).toHaveLength(1)
    expect(b[0]!.label).toBe('')
    expect(computeBars(undefined)).toEqual([])
    expect(computeBars('x')).toEqual([])
  })
  it('handles 2000 items', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ label: `i${i}`, value: i % 2 ? -1 : 2 }))
    expect(computeBars(many)).toHaveLength(2000)
  })
})

describe('signed, barWord and KIND_LABEL', () => {
  const fmt = (n: number) => String(n)
  it('signs a change with a real minus sign', () => {
    expect(signed(5, fmt)).toBe('+5')
    expect(signed(-5, fmt)).toBe('−5')
    expect(signed(0, fmt)).toBe('0')
    expect(signed(-0, fmt)).toBe('0')
    expect(signed(-5, fmt)).not.toContain('-')
  })
  it('names a bar by its kind or its type', () => {
    const [a, b, c, d, e] = computeBars([{ label: 'a', value: 1 }, { label: 'b', value: 2 }, { label: 'c', value: -1 }, { label: 'd', type: 'subtotal' }, { label: 'e', value: Number.NaN }])
    expect([a, b, c, d, e].map((x) => barWord(x!))).toEqual(['start', 'increase', 'decrease', 'subtotal', 'change'])
  })
  it('has a label per kind', () => {
    expect(KIND_LABEL).toEqual({ increase: 'Increase', decrease: 'Decrease', total: 'Total' })
  })
})
