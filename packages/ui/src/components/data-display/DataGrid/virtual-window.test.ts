import { describe, expect, it } from 'vitest'
import { computeRange, renderedIndexes, rowOffset, safeRowHeight, scrollTopToReveal, totalHeight, visibleRowCount } from './virtual-window'

const base = { viewport: 300, rowHeight: 30, count: 10000, overscan: 5 }

describe('computeRange', () => {
  it('starts at the top with overscan only below', () => {
    expect(computeRange({ ...base, scrollTop: 0 })).toEqual({ start: 0, end: 15 })
  })
  it('windows a scrolled position with overscan on both sides', () => {
    // row 100 is the first visible; 10 rows fit; overscan 5
    expect(computeRange({ ...base, scrollTop: 3000 })).toEqual({ start: 95, end: 115 })
  })
  it('includes a partially visible row', () => {
    expect(computeRange({ ...base, scrollTop: 3015, overscan: 0 })).toEqual({ start: 100, end: 111 })
  })
  it('clamps at the end of the data', () => {
    expect(computeRange({ ...base, scrollTop: 1e9 })).toEqual({ start: 10000, end: 10000 })
    expect(computeRange({ ...base, scrollTop: totalHeight(10000, 30) - 300 })).toEqual({ start: 9985, end: 10000 })
  })
  it('handles empty, tiny and invalid input without throwing', () => {
    expect(computeRange({ ...base, count: 0, scrollTop: 0 })).toEqual({ start: 0, end: 0 })
    expect(computeRange({ ...base, count: 3, scrollTop: 0 })).toEqual({ start: 0, end: 3 })
    expect(computeRange({ scrollTop: NaN, viewport: NaN, rowHeight: 0, count: NaN, overscan: -4 })).toEqual({ start: 0, end: 0 })
    expect(computeRange({ ...base, scrollTop: -50, overscan: Infinity })).toEqual({ start: 0, end: 10 })
  })
  it('never renders more than viewport rows plus twice the overscan (+2) for 10k rows', () => {
    for (const top of [0, 1, 29, 30, 31, 12345, 150000, 299700]) {
      const r = computeRange({ ...base, scrollTop: top })
      expect(r.end - r.start).toBeLessThanOrEqual(10 + 2 * 5 + 1)
    }
  })
})

describe('helpers', () => {
  it('safeRowHeight falls back for non-positive and non-finite heights', () => {
    expect(safeRowHeight(28)).toBe(28)
    for (const bad of [0, -3, NaN, Infinity]) expect(safeRowHeight(bad)).toBe(36)
  })
  it('totalHeight and rowOffset', () => {
    expect(totalHeight(10000, 36)).toBe(360000)
    expect(totalHeight(-5, 36)).toBe(0)
    expect(totalHeight(NaN, 36)).toBe(0)
    expect(rowOffset(7, 40)).toBe(280)
  })
  it('visibleRowCount is at least one', () => {
    expect(visibleRowCount(300, 30)).toBe(10)
    expect(visibleRowCount(10, 30)).toBe(1)
    expect(visibleRowCount(0, 30)).toBe(1)
    expect(visibleRowCount(NaN, 30)).toBe(1)
  })
})

describe('scrollTopToReveal', () => {
  it('keeps the position when the row is already visible', () => {
    expect(scrollTopToReveal(12, 30, 300, 300, 1000)).toBe(300)
  })
  it('scrolls up so the row sits at the top edge', () => {
    expect(scrollTopToReveal(5, 30, 300, 300, 1000)).toBe(150)
  })
  it('scrolls down so the row sits at the bottom edge', () => {
    expect(scrollTopToReveal(40, 30, 0, 300, 1000)).toBe(40 * 30 + 30 - 300)
  })
  it('clamps to the scrollable range and clamps the index', () => {
    expect(scrollTopToReveal(99999, 30, 0, 300, 100)).toBe(100 * 30 - 300)
    expect(scrollTopToReveal(-4, 30, 500, 300, 100)).toBe(0)
    expect(scrollTopToReveal(NaN, 30, NaN, 300, 100)).toBe(0)
    expect(scrollTopToReveal(0, 30, 0, 300, 0)).toBe(0)
  })
  it('reveals every row of a 10k grid so that it falls inside the computed window', () => {
    for (const i of [0, 1, 9, 10, 4999, 9999]) {
      const top = scrollTopToReveal(i, 30, 0, 300, 10000)
      const r = computeRange({ ...base, scrollTop: top })
      expect(i).toBeGreaterThanOrEqual(r.start)
      expect(i).toBeLessThan(r.end)
    }
  })
})

describe('renderedIndexes', () => {
  it('returns the window when there is no extra row', () => {
    expect(renderedIndexes({ start: 2, end: 5 }, null, 100)).toEqual([2, 3, 4])
  })
  it('does not duplicate an extra row that is inside the window', () => {
    expect(renderedIndexes({ start: 2, end: 5 }, 3, 100)).toEqual([2, 3, 4])
  })
  it('keeps the focused row mounted when it is above or below the window, in order', () => {
    expect(renderedIndexes({ start: 50, end: 53 }, 7, 100)).toEqual([7, 50, 51, 52])
    expect(renderedIndexes({ start: 50, end: 53 }, 90, 100)).toEqual([50, 51, 52, 90])
  })
  it('ignores an extra row outside the data', () => {
    expect(renderedIndexes({ start: 0, end: 2 }, 500, 100)).toEqual([0, 1])
    expect(renderedIndexes({ start: 0, end: 2 }, -1, 100)).toEqual([0, 1])
  })
})
