import { describe, expect, it } from 'vitest'
import { axisDirection, labelAnchor, nextStep, niceStep, polygonPath, radarFraction, radarRadius, radarScale } from './radarMath'

describe('niceStep and nextStep', () => {
  it('rounds up the 1, 2, 2.5, 5, 10 ladder', () => {
    expect([0.75, 1, 1.1, 2.2, 2.6, 5.1, 9].map(niceStep)).toEqual([1, 1, 2, 2.5, 5, 10, 10])
    expect(niceStep(0.03)).toBeCloseTo(0.05)
    expect(niceStep(1200)).toBe(2000)
    expect(niceStep(2300)).toBe(2500)
  })
  it('falls back to 1 for non-positive and non-finite input', () => {
    for (const bad of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) expect(niceStep(bad)).toBe(1)
  })
  it('nextStep is the next rung', () => {
    expect([1, 2, 2.5, 5, 10].map(nextStep)).toEqual([2, 2.5, 5, 10, 20])
  })
})

describe('radarScale', () => {
  it('starts at 0 and ends at a round multiple of the step that covers the data', () => {
    expect(radarScale([3, 5, 2], 4)).toEqual({ min: 0, max: 8 })
    expect(radarScale([9], 4)).toEqual({ min: 0, max: 10 })
    expect(radarScale([9], 5)).toEqual({ min: 0, max: 10 })
    expect(radarScale([9], 3)).toEqual({ min: 0, max: 15 })
    expect(radarScale([87], 6)).toEqual({ min: 0, max: 120 })
  })
  it('moves a negative start down to a multiple of the step', () => {
    expect(radarScale([4, -3, 6, -5, 2], 4)).toEqual({ min: -5, max: 15 })
  })
  it('widens the step when the moved start no longer covers the maximum', () => {
    const s = radarScale([-4, 6], 4)
    expect(s.min).toBe(-5)
    expect(s.max).toBeGreaterThanOrEqual(6)
  })
  it('a given min and max are used as they are, in either order', () => {
    expect(radarScale([1, 2], 4, 0, 100)).toEqual({ min: 0, max: 100 })
    expect(radarScale([1, 2], 4, 100, 0)).toEqual({ min: 0, max: 100 })
    expect(radarScale([1, 2], 4, 7, 7)).toEqual({ min: 7, max: 8 })
  })
  it('a given max alone sets the rim and keeps the centre at or below zero', () => {
    expect(radarScale([1, 2], 4, undefined, 10)).toEqual({ min: 0, max: 10 })
    expect(radarScale([1, 2], 4, undefined, 0)).toEqual({ min: -1, max: 0 })
    expect(radarScale([-10, -2], 4, undefined, -5)).toEqual({ min: -10, max: -5 })
  })
  it('a given min alone sets the centre and the rim covers the data', () => {
    expect(radarScale([3, 9], 4, 2)).toEqual({ min: 2, max: 10 })
  })
  it('all-zero, empty and non-finite data give a usable scale', () => {
    expect(radarScale([0, 0], 4)).toEqual({ min: 0, max: 4 })
    expect(radarScale([], 4)).toEqual({ min: 0, max: 1 })
    expect(radarScale([Number.NaN, null, 'x'], 4)).toEqual({ min: 0, max: 1 })
    expect(radarScale([1], 4, Number.NaN, Number.NaN)).toEqual({ min: 0, max: 1 })
  })
  it('stays finite for huge values', () => {
    const s = radarScale([1e300, 2e300], 4)
    expect(Number.isFinite(s.min) && Number.isFinite(s.max)).toBe(true)
    expect(s.max).toBeGreaterThanOrEqual(2e300)
  })
  it('clamps the number of levels', () => {
    expect(radarScale([8], 0)).toEqual(radarScale([8], 1))
    expect(radarScale([8], 99)).toEqual(radarScale([8], 12))
  })
})

describe('radarFraction', () => {
  it('maps the scale to 0..1 and clamps outside it', () => {
    const s = { min: 0, max: 10 }
    expect([0, 5, 10, -3, 30].map((v) => radarFraction(v, s))).toEqual([0, 0.5, 1, 0, 1])
    expect(radarFraction(5, { min: 5, max: 5 })).toBe(0)
  })
})

describe('axisDirection', () => {
  it('points the first axis up and goes clockwise', () => {
    expect(axisDirection(0, 4)).toEqual({ dx: 0, dy: -1 })
    expect(axisDirection(1, 4)).toEqual({ dx: 1, dy: 0 })
    expect(axisDirection(2, 4)).toEqual({ dx: 0, dy: 1 })
    expect(axisDirection(3, 4)).toEqual({ dx: -1, dy: 0 })
  })
  it('is a unit vector and survives n = 0', () => {
    const d = axisDirection(2, 7)
    expect(Math.hypot(d.dx, d.dy)).toBeCloseTo(1, 4)
    expect(Number.isFinite(axisDirection(0, 0).dx)).toBe(true)
  })
})

describe('polygonPath and labelAnchor', () => {
  it('closes the path and is empty without points', () => {
    expect(polygonPath([])).toBe('')
    expect(polygonPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8.123 }])).toBe('M0,0 L10,0 L5,8.12 Z')
  })
  it('puts labels of the right side after the anchor, the left side before it, the rest centred', () => {
    expect([0.9, 0.26, 0, -0.26, -0.9].map(labelAnchor)).toEqual(['start', 'start', 'middle', 'end', 'end'])
    expect(labelAnchor(0.25)).toBe('middle')
    expect(labelAnchor(-0.25)).toBe('middle')
  })
})

describe('radarRadius', () => {
  const w = (n: number, px: number) => Array.from({ length: n }, () => px)
  it('is limited by the smaller side and keeps labels inside', () => {
    const r = radarRadius(400, 300, w(5, 40), w(5, 14))
    expect(r).toBeGreaterThan(24)
    expect(r).toBeLessThan(150)
    // the rightmost label (axis 1 of 5, dx about 0.95) must end inside the box
    const { dx } = axisDirection(1, 5)
    expect(200 + (r + 12) * dx + 40).toBeLessThanOrEqual(400 - 6 + 0.01)
  })
  it('shrinks when labels get wider and never below the minimum', () => {
    const narrow = radarRadius(320, 300, w(5, 30), w(5, 14))
    const wide = radarRadius(320, 300, w(5, 90), w(5, 14))
    expect(wide).toBeLessThan(narrow)
    expect(radarRadius(100, 100, w(5, 500), w(5, 14))).toBe(24)
    expect(radarRadius(100, 100, w(5, 500), w(5, 14), 12, 6, 10)).toBe(10)
  })
  it('makes room for labels of two lines above and below the chart', () => {
    const one = radarRadius(600, 200, w(6, 30), w(6, 14))
    const two = radarRadius(600, 200, w(6, 30), w(6, 28))
    expect(two).toBeLessThan(one)
  })
  it('works with three axes and with no labels', () => {
    expect(radarRadius(300, 300, w(3, 40), w(3, 14))).toBeGreaterThan(24)
    expect(radarRadius(300, 200, [], [])).toBe(94)
  })
  it('treats a missing height as one line', () => {
    expect(radarRadius(300, 300, w(4, 40), [])).toBe(radarRadius(300, 300, w(4, 40), w(4, 14)))
  })
})
