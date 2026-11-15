import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  BAR_FILL, CHART_HEIGHTS, MARKER_SHAPES, barFill, barRadius, chartHeight, markerPath, oneOf, seriesMarker,
} from './chartKit'
import { areaPath, curveAreaPath, curvePath, linePath, normalizeCurve, type Point } from './chartMath'
import ChartLegend from './ChartLegend.vue'

const pts: Point[] = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 5 }]

describe('normalizeCurve', () => {
  it('keeps the known curves and falls back to linear', () => {
    expect(normalizeCurve('smooth')).toBe('smooth')
    expect(normalizeCurve('step')).toBe('step')
    expect(normalizeCurve('linear')).toBe('linear')
    expect(normalizeCurve('wavy')).toBe('linear')
    expect(normalizeCurve(undefined)).toBe('linear')
    expect(normalizeCurve(3)).toBe('linear')
  })
})

describe('curvePath', () => {
  it('linear (and unknown, and default) is exactly linePath', () => {
    expect(curvePath(pts, 'linear')).toBe(linePath(pts))
    expect(curvePath(pts)).toBe(linePath(pts))
    expect(curvePath(pts, 'zigzag' as never)).toBe(linePath(pts))
  })
  it('step holds each value until the next point', () => {
    expect(curvePath(pts, 'step')).toBe('M0,0 H10 V10 H20 V5')
  })
  it('smooth through two points is a straight cubic', () => {
    expect(curvePath([{ x: 0, y: 0 }, { x: 30, y: 30 }], 'smooth')).toBe('M0,0 C10,10 20,20 30,30')
  })
  it('smooth flat data stays flat', () => {
    expect(curvePath([{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 20, y: 10 }], 'smooth')).toBe('M0,10 C3.33,10 6.67,10 10,10 C13.33,10 16.67,10 20,10')
  })
  it('smooth has a flat tangent at a local extremum (no overshoot)', () => {
    const d = curvePath([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }], 'smooth')
    expect(d).toBe('M0,0 C3.33,3.33 6.67,10 10,10 C13.33,10 16.67,3.33 20,0')
  })
  it('smooth never leaves the y range of its data', () => {
    const data = [5, 40, 38, 2, 2, 90, 10, 11, 60, 0]
    const points = data.map((y, i) => ({ x: i * 10, y }))
    const d = curvePath(points, 'smooth')
    const ys = [...d.matchAll(/C([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+) ([\d.-]+),([\d.-]+)/g)].flatMap((m) => [Number(m[2]), Number(m[4])])
    expect(ys.length).toBe((data.length - 1) * 2)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(90)
  })
  it('steep Fritsch-Carlson limiting keeps tangents finite', () => {
    const d = curvePath([{ x: 0, y: 0 }, { x: 1, y: 100 }, { x: 2, y: 101 }, { x: 3, y: 500 }], 'smooth')
    expect(d).not.toMatch(/NaN|Infinity/)
    expect(d.match(/C/g)).toHaveLength(3)
  })
  it('coincident x values do not produce NaN', () => {
    expect(curvePath([{ x: 5, y: 1 }, { x: 5, y: 9 }, { x: 8, y: 3 }], 'smooth')).not.toMatch(/NaN|Infinity/)
  })
  it('breaks at gaps and draws a lone point as a move only', () => {
    expect(curvePath([pts[0]!, pts[1]!, null, { x: 30, y: 2 }], 'step')).toBe('M0,0 H10 V10 M30,2')
    expect(curvePath([{ x: 3, y: 4 }], 'smooth')).toBe('M3,4')
    expect(curvePath([], 'smooth')).toBe('')
    expect(curvePath([null, null], 'step')).toBe('')
  })
})

describe('curveAreaPath', () => {
  it('linear is exactly areaPath', () => {
    expect(curveAreaPath(pts, 40, 'linear')).toBe(areaPath(pts, 40))
    expect(curveAreaPath(pts, 40)).toBe(areaPath(pts, 40))
  })
  it('step and smooth areas close down to the baseline', () => {
    expect(curveAreaPath(pts, 40, 'step')).toBe('M0,40 L0,0 H10 V10 H20 V5 L20,40 Z')
    const smooth = curveAreaPath(pts, 40, 'smooth')
    expect(smooth.startsWith('M0,40 L0,0 C')).toBe(true)
    expect(smooth.endsWith('L20,40 Z')).toBe(true)
  })
  it('skips single-point runs and handles empty input', () => {
    expect(curveAreaPath([{ x: 1, y: 1 }], 10, 'smooth')).toBe('')
    expect(curveAreaPath([], 10, 'step')).toBe('')
  })
})

describe('chartHeight', () => {
  it('maps sizes and lets an explicit height win', () => {
    expect(chartHeight('sm')).toBe(CHART_HEIGHTS.sm)
    expect(chartHeight('md')).toBe(240)
    expect(chartHeight('lg')).toBe(320)
    expect(chartHeight('lg', 100)).toBe(100)
    expect(chartHeight('huge')).toBe(240)
    expect(chartHeight(undefined, -5)).toBe(240)
    expect(chartHeight('sm', Number.NaN)).toBe(160)
  })
})

describe('barRadius', () => {
  it('auto keeps the original look and unknown values behave like auto', () => {
    expect(barRadius('auto', false, 20, 20)).toBe(2)
    expect(barRadius('auto', true, 20, 20)).toBe(0)
    expect(barRadius('bogus', false, 20, 20)).toBe(2)
    expect(barRadius(undefined, true, 20, 20)).toBe(0)
  })
  it('named radii are clamped to half of the shorter side', () => {
    expect(barRadius('none', false, 20, 20)).toBe(0)
    expect(barRadius('sm', true, 20, 20)).toBe(2)
    expect(barRadius('md', false, 20, 20)).toBe(4)
    expect(barRadius('md', false, 4, 20)).toBe(2)
    expect(barRadius('sm', false, 20, 1)).toBe(0.5)
    expect(barRadius('full', false, 10, 40)).toBe(5)
    expect(barRadius('full', false, 40, 10)).toBe(5)
    expect(barRadius('full', false, 0, 0)).toBe(0)
  })
})

describe('barFill', () => {
  it('widens or narrows the bars and defaults to 70%', () => {
    expect(barFill('md')).toBe(BAR_FILL.md)
    expect(BAR_FILL.md).toBe(0.7)
    expect(barFill('sm')).toBeGreaterThan(barFill('md'))
    expect(barFill('lg')).toBeLessThan(barFill('md'))
    expect(barFill('x')).toBe(0.7)
    expect(barFill(undefined)).toBe(0.7)
  })
})

describe('markers', () => {
  it('cycles through four shapes by series index', () => {
    expect(MARKER_SHAPES).toEqual(['circle', 'square', 'diamond', 'triangle'])
    expect([0, 1, 2, 3, 4, 5].map(seriesMarker)).toEqual(['circle', 'square', 'diamond', 'triangle', 'circle', 'square'])
    expect(seriesMarker(Number.NaN)).toBe('circle')
    expect(seriesMarker(-1)).toBe('square')
  })
  it('draws closed paths centred on the point', () => {
    expect(markerPath('square', 10, 10, 3)).toBe('M7,7 h6 v6 h-6 Z')
    expect(markerPath('diamond', 10, 10, 3)).toBe('M10,6.1 L13.9,10 L10,13.9 L6.1,10 Z')
    expect(markerPath('triangle', 10, 10, 4)).toBe('M10,5 L15,14 L5,14 Z')
    expect(markerPath('circle', 10, 10, 3)).toMatch(/^M10,/)
  })
})

describe('oneOf', () => {
  it('returns the value when allowed, otherwise the fallback', () => {
    expect(oneOf('a', ['a', 'b'] as const, 'b')).toBe('a')
    expect(oneOf('z', ['a', 'b'] as const, 'b')).toBe('b')
    expect(oneOf(undefined, ['a', 'b'] as const, 'a')).toBe('a')
  })
})

describe('ChartLegend markers', () => {
  const items = [
    { name: 'A', bg: 'bg-chart-1', stroke: 'stroke-chart-1', dash: '', marker: 'circle' as const, fill: 'fill-chart-1' },
    { name: 'B', bg: 'bg-chart-2', stroke: 'stroke-chart-2', dash: '6 4', marker: 'diamond' as const, fill: 'fill-chart-2' },
    { name: 'C', bg: 'bg-chart-3', stroke: 'stroke-chart-3', dash: '2 4' },
  ]
  it('draws the marker of each series on its line sample, none when unset', () => {
    const w = mount(ChartLegend, { props: { items, dataSlot: 'x-legend' } })
    const lis = w.findAll('li')
    expect(lis[0]!.find('circle').exists()).toBe(true)
    expect(lis[1]!.find('path').attributes('d')).toMatch(/^M10,/)
    expect(lis[1]!.find('circle').exists()).toBe(false)
    expect(lis[2]!.find('circle').exists()).toBe(false)
    expect(lis[2]!.find('path').exists()).toBe(false)
  })
})
