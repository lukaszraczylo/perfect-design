import { describe, expect, it } from 'vitest'
import { DEFAULT_COLUMN_WIDTH, clampWidth, gridTemplate, maxWidthOf, minWidthOf, orderColumns, resizeBy, stickyOffsets, sumWidths, widthOf } from './column-sizing'

describe('widths', () => {
  it('uses defaults, column width and overrides in that order of precedence', () => {
    expect(widthOf({ key: 'a', label: 'A' }, {})).toBe(DEFAULT_COLUMN_WIDTH)
    expect(widthOf({ key: 'a', label: 'A', width: 200 }, {})).toBe(200)
    expect(widthOf({ key: 'a', label: 'A', width: 200 }, { a: 90 })).toBe(90)
  })
  it('clamps to min and max, ignoring invalid limits', () => {
    expect(clampWidth(10, {})).toBe(48)
    expect(clampWidth(5000, {})).toBe(1000)
    expect(clampWidth(10, { minWidth: 80 })).toBe(80)
    expect(clampWidth(500, { maxWidth: 300 })).toBe(300)
    expect(minWidthOf({ minWidth: -5 })).toBe(48)
    expect(maxWidthOf({ minWidth: 2000 })).toBe(2000)
    expect(maxWidthOf({ minWidth: 100, maxWidth: 50 })).toBe(1000)
    expect(clampWidth(NaN, {})).toBe(DEFAULT_COLUMN_WIDTH)
    expect(clampWidth(100.6, {})).toBe(101)
  })
  it('resizeBy applies a delta inside the limits and ignores NaN', () => {
    expect(resizeBy(100, 10, {})).toBe(110)
    expect(resizeBy(100, -1000, {})).toBe(48)
    expect(resizeBy(100, Infinity, {})).toBe(1000)
    expect(resizeBy(100, NaN, {})).toBe(100)
  })
  it('builds the grid template and sums', () => {
    expect(gridTemplate([40, 120])).toBe('40px 120px')
    expect(sumWidths([40, 120, 5])).toBe(165)
    expect(sumWidths([])).toBe(0)
  })
})

describe('orderColumns', () => {
  it('puts start-pinned first and end-pinned last, keeping the rest in order, without mutating', () => {
    const cols = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B', pinned: 'end' as const },
      { key: 'c', label: 'C', pinned: 'start' as const },
      { key: 'd', label: 'D' },
    ]
    const copy = [...cols]
    expect(orderColumns(cols).map((c) => c.key)).toEqual(['c', 'a', 'd', 'b'])
    expect(cols).toEqual(copy)
  })
})

describe('stickyOffsets', () => {
  it('accumulates start offsets from the start and end offsets from the end', () => {
    const o = stickyOffsets([40, 100, 150, 80, 60], ['start', 'start', undefined, 'end', 'end'])
    expect(o.start).toEqual([0, 40, null, null, null])
    expect(o.end).toEqual([null, null, null, 60, 0])
    expect(o.startWidth).toBe(140)
    expect(o.endWidth).toBe(140)
  })
  it('has no offsets when nothing is pinned', () => {
    const o = stickyOffsets([10, 20], [undefined, undefined])
    expect(o).toEqual({ start: [null, null], end: [null, null], startWidth: 0, endWidth: 0 })
  })
})
