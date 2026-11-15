import { describe, expect, it } from 'vitest'
import { HEAT_CLASSES, HEAT_EMPTY_CLASS, heatClass, heatLevel, normalizeLevels } from './heatLevel'

describe('heatLevel', () => {
  it('0 for empty-ish values', () => {
    for (const v of [null, undefined, NaN, Infinity, -Infinity, 0, '3', {}]) expect(heatLevel(v, 0, 10, 5)).toBe(0)
  })
  it('buckets across 1..levels', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => heatLevel(v, 0, 10, 5))).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
    expect(heatLevel(10, 0, 10, 2)).toBe(2)
    expect(heatLevel(1, 0, 10, 2)).toBe(1)
  })
  it('clamps values outside the domain', () => {
    expect(heatLevel(100, 0, 10, 5)).toBe(5)
    expect(heatLevel(-5, 0, 10, 5)).toBe(1)
    expect(heatLevel(1, 10, 20, 5)).toBe(1)
  })
  it('min === max or inverted domain → top level for non-empty values', () => {
    expect(heatLevel(5, 5, 5, 5)).toBe(5)
    expect(heatLevel(5, 10, 2, 4)).toBe(4)
  })
  it('non-finite domain falls back', () => {
    expect(heatLevel(5, NaN, NaN, 5)).toBe(5)
    expect(heatLevel(5, 0, NaN, 5)).toBe(5)
    expect(heatLevel(5, NaN, 10, 5)).toBe(3)
  })
  it('huge domain does not overflow', () => {
    expect(heatLevel(1e308, -1e308, 1e308, 5)).toBe(5)
    expect(heatLevel(-1e308, -1e308, 1e308, 5)).toBe(1)
    expect(heatLevel(1e308, 0, 1e308, 5)).toBe(5)
  })
  it('normalizes levels', () => {
    expect(normalizeLevels(3.9)).toBe(3)
    expect(normalizeLevels(0)).toBe(1)
    expect(normalizeLevels(-4)).toBe(1)
    expect(normalizeLevels(99)).toBe(5)
    expect(normalizeLevels(NaN)).toBe(5)
    expect(normalizeLevels(undefined)).toBe(5)
    expect(heatLevel(10, 0, 10, 99)).toBe(5)
    expect(heatLevel(10, 0, 10, 1)).toBe(1)
  })
})

describe('heatClass', () => {
  it('level 0 → bg-muted', () => {
    expect(heatClass('chart-1', 0, 5)).toBe(HEAT_EMPTY_CLASS)
    expect(heatClass('chart-1', -3, 5)).toBe('bg-muted')
  })
  it('maps levels onto the ramp', () => {
    expect([1, 2, 3, 4, 5].map((l) => heatClass('chart-1', l, 5))).toEqual(['bg-chart-1/10', 'bg-chart-1/25', 'bg-chart-1/45', 'bg-chart-1/70', 'bg-chart-1'])
    expect(heatClass('chart-2', 1, 3)).toBe('bg-chart-2/10')
    expect(heatClass('chart-2', 2, 3)).toBe('bg-chart-2/45')
    expect(heatClass('chart-2', 3, 3)).toBe('bg-chart-2')
    expect(heatClass('success', 1, 1)).toBe('bg-success')
    expect(heatClass('danger', 99, 5)).toBe('bg-destructive')
  })
  it('unknown tone falls back to chart-1', () => {
    expect(heatClass('nope' as never, 2, 5)).toBe('bg-chart-1/25')
  })
  it('every tone has 5 literal bg- classes', () => {
    for (const ramp of Object.values(HEAT_CLASSES)) {
      expect(ramp).toHaveLength(5)
      expect(ramp.every((c) => c.startsWith('bg-'))).toBe(true)
    }
  })
})
