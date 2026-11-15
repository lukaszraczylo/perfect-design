import { describe, expect, it } from 'vitest'
import { clampPos, inRange, isNavKey, navigate, rangeBetween, samePos, type NavContext } from './grid-navigation'

const ctx: NavContext = { rowCount: 100, colCount: 5, pageRows: 10, rtl: false }

describe('navigate', () => {
  it('moves one cell with the arrows', () => {
    expect(navigate({ row: 3, col: 2 }, 'ArrowRight', false, ctx)).toEqual({ row: 3, col: 3 })
    expect(navigate({ row: 3, col: 2 }, 'ArrowLeft', false, ctx)).toEqual({ row: 3, col: 1 })
    expect(navigate({ row: 3, col: 2 }, 'ArrowDown', false, ctx)).toEqual({ row: 4, col: 2 })
    expect(navigate({ row: 3, col: 2 }, 'ArrowUp', false, ctx)).toEqual({ row: 2, col: 2 })
  })
  it('stops at every edge instead of wrapping', () => {
    expect(navigate({ row: 0, col: 0 }, 'ArrowLeft', false, ctx)).toEqual({ row: 0, col: 0 })
    expect(navigate({ row: 0, col: 0 }, 'ArrowUp', false, ctx)).toEqual({ row: 0, col: 0 })
    expect(navigate({ row: 100, col: 4 }, 'ArrowRight', false, ctx)).toEqual({ row: 100, col: 4 })
    expect(navigate({ row: 100, col: 4 }, 'ArrowDown', false, ctx)).toEqual({ row: 100, col: 4 })
  })
  it('swaps left and right in right-to-left', () => {
    const rtl = { ...ctx, rtl: true }
    expect(navigate({ row: 1, col: 2 }, 'ArrowRight', false, rtl)).toEqual({ row: 1, col: 1 })
    expect(navigate({ row: 1, col: 2 }, 'ArrowLeft', false, rtl)).toEqual({ row: 1, col: 3 })
  })
  it('Home and End go to the first and last column; Ctrl goes to the first and last cell', () => {
    expect(navigate({ row: 7, col: 2 }, 'Home', false, ctx)).toEqual({ row: 7, col: 0 })
    expect(navigate({ row: 7, col: 2 }, 'End', false, ctx)).toEqual({ row: 7, col: 4 })
    expect(navigate({ row: 7, col: 2 }, 'Home', true, ctx)).toEqual({ row: 0, col: 0 })
    expect(navigate({ row: 7, col: 2 }, 'End', true, ctx)).toEqual({ row: 100, col: 4 })
  })
  it('Home and End are logical in right-to-left', () => {
    expect(navigate({ row: 7, col: 2 }, 'Home', false, { ...ctx, rtl: true })).toEqual({ row: 7, col: 0 })
  })
  it('PageUp and PageDown move by the page size and clamp', () => {
    expect(navigate({ row: 5, col: 1 }, 'PageDown', false, ctx)).toEqual({ row: 15, col: 1 })
    expect(navigate({ row: 95, col: 1 }, 'PageDown', false, ctx)).toEqual({ row: 100, col: 1 })
    expect(navigate({ row: 15, col: 1 }, 'PageUp', false, ctx)).toEqual({ row: 5, col: 1 })
    expect(navigate({ row: 3, col: 1 }, 'PageUp', false, ctx)).toEqual({ row: 0, col: 1 })
  })
  it('treats a zero or invalid page size as one row', () => {
    expect(navigate({ row: 5, col: 0 }, 'PageDown', false, { ...ctx, pageRows: 0 })).toEqual({ row: 6, col: 0 })
    expect(navigate({ row: 5, col: 0 }, 'PageDown', false, { ...ctx, pageRows: NaN })).toEqual({ row: 6, col: 0 })
  })
  it('works on an empty grid (header only) and a single column', () => {
    const empty = { rowCount: 0, colCount: 1, pageRows: 5, rtl: false }
    for (const k of ['ArrowDown', 'ArrowRight', 'End', 'PageDown'] as const) expect(navigate({ row: 0, col: 0 }, k, true, empty)).toEqual({ row: 0, col: 0 })
  })
})

describe('helpers', () => {
  it('clampPos pulls any position into the grid and survives NaN', () => {
    expect(clampPos({ row: 500, col: 99 }, ctx)).toEqual({ row: 100, col: 4 })
    expect(clampPos({ row: -3, col: -1 }, ctx)).toEqual({ row: 0, col: 0 })
    expect(clampPos({ row: NaN, col: 2.7 }, ctx)).toEqual({ row: 0, col: 2 })
  })
  it('isNavKey recognises only navigation keys', () => {
    expect(isNavKey('PageUp')).toBe(true)
    expect(isNavKey('Enter')).toBe(false)
    expect(isNavKey('a')).toBe(false)
  })
  it('samePos compares both coordinates and tolerates null', () => {
    expect(samePos({ row: 1, col: 2 }, { row: 1, col: 2 })).toBe(true)
    expect(samePos({ row: 1, col: 2 }, { row: 1, col: 3 })).toBe(false)
    expect(samePos(null, { row: 1, col: 2 })).toBe(false)
  })
  it('rangeBetween orders its ends and inRange tests inclusively', () => {
    const r = rangeBetween({ row: 5, col: 3 }, { row: 2, col: 1 })
    expect(r).toEqual({ rowStart: 2, rowEnd: 5, colStart: 1, colEnd: 3 })
    expect(inRange(r, 2, 1)).toBe(true)
    expect(inRange(r, 5, 3)).toBe(true)
    expect(inRange(r, 6, 3)).toBe(false)
    expect(inRange(null, 1, 1)).toBe(false)
  })
})
