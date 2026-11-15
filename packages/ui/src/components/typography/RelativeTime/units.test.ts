import { describe, expect, it } from 'vitest'
import { relativeUnits, selectUnit, UNIT_MS, type RelativeUnit } from './units'

const S = 1000
const M = 60 * S
const H = 60 * M
const D = 24 * H

describe('selectUnit', () => {
  describe('unit boundaries (past)', () => {
    it.each([
      [0, 0, 'second'],
      [-500, 0, 'second'],
      [-999, 0, 'second'],
      [-1 * S, -1, 'second'],
      [-59 * S, -59, 'second'],
      [-59_999, -59, 'second'],
      [-60 * S, -1, 'minute'],
      [-59 * M, -59, 'minute'],
      [-60 * M, -1, 'hour'],
      [-23 * H, -23, 'hour'],
      [-24 * H, -1, 'day'],
      [-6 * D, -6, 'day'],
      [-7 * D, -1, 'week'],
      [-29 * D, -4, 'week'],
      [-30 * D, -4, 'week'],
      [-31 * D, -1, 'month'],
      [-364 * D, -11, 'month'],
      [-365 * D, -11, 'month'],
      [-366 * D, -1, 'year'],
      [-730 * D, -1, 'year'],
      [-1000 * 365.25 * D, -1000, 'year'],
    ] as [number, number, RelativeUnit][])('%d ms is %d %s', (diff, value, unit) => expect(selectUnit(diff)).toEqual({ value, unit }))
  })

  describe('future mirrors the past', () => {
    it.each([500, 5 * S, 59 * M, 5 * H, 3 * D, 10 * D, 90 * D, 800 * D])('%d', (ms) => {
      const past = selectUnit(-ms)
      const future = selectUnit(ms)
      expect(future.unit).toBe(past.unit)
      expect(future.value).toBe(Math.abs(past.value))
    })
  })

  it('truncates toward zero instead of rounding up', () => {
    expect(selectUnit(-(59 * M + 59 * S))).toEqual({ value: -59, unit: 'minute' })
    expect(selectUnit(59 * M + 59 * S)).toEqual({ value: 59, unit: 'minute' })
  })

  it('never returns negative zero', () => {
    expect(Object.is(selectUnit(-0.4).value, 0)).toBe(true)
    expect(Object.is(selectUnit(-0).value, 0)).toBe(true)
  })

  describe('minUnit', () => {
    it('reads closer times as 0 of the min unit', () => expect(selectUnit(-30 * S, { minUnit: 'minute' })).toEqual({ value: 0, unit: 'minute' }))
    it('does not affect larger gaps', () => expect(selectUnit(-3 * H, { minUnit: 'minute' })).toEqual({ value: -3, unit: 'hour' }))
    it('can force a large min unit', () => expect(selectUnit(-3 * D, { minUnit: 'week' })).toEqual({ value: 0, unit: 'week' }))
  })

  describe('maxUnit', () => {
    it('keeps counting in days', () => expect(selectUnit(-400 * D, { maxUnit: 'day' })).toEqual({ value: -400, unit: 'day' }))
    it('hours as max', () => expect(selectUnit(2 * D, { maxUnit: 'hour' })).toEqual({ value: 48, unit: 'hour' }))
    it('week as max', () => expect(selectUnit(100 * D, { maxUnit: 'week' })).toEqual({ value: 14, unit: 'week' }))
    it('max below min is raised to min', () => expect(selectUnit(-3 * H, { minUnit: 'day', maxUnit: 'second' })).toEqual({ value: 0, unit: 'day' }))
    it('min and max equal pins the unit', () => expect(selectUnit(2 * H, { minUnit: 'minute', maxUnit: 'minute' })).toEqual({ value: 120, unit: 'minute' }))
  })

  describe('hostile input', () => {
    it.each([NaN, Infinity, -Infinity])('%s reads as 0 of the min unit', (v) => {
      expect(selectUnit(v)).toEqual({ value: 0, unit: 'second' })
      expect(selectUnit(v, { minUnit: 'hour' })).toEqual({ value: 0, unit: 'hour' })
    })
    it('unknown unit names are ignored', () => expect(selectUnit(-3 * H, { minUnit: 'fortnight' as never, maxUnit: 'eon' as never })).toEqual({ value: -3, unit: 'hour' }))
    it('the largest Date gap stays finite', () => {
      const r = selectUnit(-2 * 8.64e15)
      expect(r.unit).toBe('year')
      expect(Number.isFinite(r.value)).toBe(true)
    })
  })

  it('UNIT_MS is ascending and covers every unit', () => {
    const values = relativeUnits.map((u) => UNIT_MS[u])
    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(relativeUnits).toHaveLength(7)
  })
})
