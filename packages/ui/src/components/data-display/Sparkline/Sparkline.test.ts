import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Sparkline from './Sparkline.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) =>
  mount(Sparkline, { props: props as never, attrs })
const dOf = (w: ReturnType<typeof m>) => w.find('[data-slot="sparkline-line"]').attributes('d')!
const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

describe('Sparkline: good path', () => {
  it('renders an svg role=img with data-slot, viewBox and a summary label', () => {
    const w = m({ data: [3, 1, 10, 9] })
    expect(w.element.tagName.toLowerCase()).toBe('svg')
    expect(w.attributes('data-slot')).toBe('sparkline')
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('viewBox')).toBe('0 0 96 32')
    expect(w.attributes('aria-label')).toBe('Trend: 4 points, from 3 to 9, min 1, max 10')
    expect(dOf(w)).toMatch(/^M[\d.]+,[\d.]+ L/)
  })
  it('maps higher values to smaller y', () => {
    const [, y0, , y1] = nums(dOf(m({ data: [0, 10] })))
    expect(y1!).toBeLessThan(y0!)
  })
  it('uses the tone classes and respects tone prop', () => {
    expect(m({ data: [1, 2] }).find('path').classes()).toContain('stroke-chart-1')
    expect(m({ data: [1, 2], tone: 'success' }).find('path').classes()).toContain('stroke-success')
  })
  it('draws an area only when asked', () => {
    expect(m({ data: [1, 2, 3] }).find('[data-slot="sparkline-area"]').exists()).toBe(false)
    const w = m({ data: [1, 2, 3], area: true })
    expect(w.find('[data-slot="sparkline-area"]').attributes('d')).toMatch(/Z$/)
    expect(w.find('[data-slot="sparkline-area"]').classes()).toContain('fill-chart-1/15')
  })
  it('showLast adds a dot at the last point', () => {
    const w = m({ data: [1, 5, 2], showLast: true })
    expect(w.find('[data-slot="sparkline-last"]').exists()).toBe(true)
    expect(m({ data: [1, 5, 2] }).find('[data-slot="sparkline-last"]').exists()).toBe(false)
  })
  it('custom width/height change the viewBox', () => {
    expect(m({ data: [1, 2], width: 200, height: 50 }).attributes('viewBox')).toBe('0 0 200 50')
    expect(m({ data: [1, 2], strokeWidth: 3 }).find('path').attributes('stroke-width')).toBe('3')
  })
})

describe('Sparkline: customisation', () => {
  it('merges class last (override wins, defaults kept otherwise)', () => {
    const w = m({ data: [1, 2], class: 'w-40 text-red-500' })
    expect(w.classes()).toContain('w-40')
    expect(w.classes()).not.toContain('w-24')
    expect(w.classes()).toContain('shrink-0')
  })
  it('label prop overrides the summary and attrs fall through', () => {
    const w = m({ data: [1, 2], label: 'Weekly visits' }, { id: 'sp', 'data-x': '1' })
    expect(w.attributes('aria-label')).toBe('Weekly visits')
    expect(w.attributes('id')).toBe('sp')
    expect(w.attributes('data-x')).toBe('1')
  })
})

describe('Sparkline: bad path and edge cases', () => {
  it('empty data → No data, no path', () => {
    const w = m({ data: [] })
    expect(w.attributes('aria-label')).toBe('No data')
    expect(w.find('path').exists()).toBe(false)
    expect(w.find('circle').exists()).toBe(false)
  })
  it('non-array / all non-finite data → No data', () => {
    expect(m({ data: null }).attributes('aria-label')).toBe('No data')
    expect(m({ data: [NaN, Infinity, -Infinity] }).attributes('aria-label')).toBe('No data')
    expect(m({ data: [NaN], showLast: true }).find('circle').exists()).toBe(false)
  })
  it('single point → dot, no line, centred', () => {
    const w = m({ data: [5] })
    expect(w.find('path').exists()).toBe(false)
    const dot = w.findAll('circle')
    expect(dot).toHaveLength(1)
    expect(dot[0]!.attributes('cx')).toBe('48')
    expect(w.attributes('aria-label')).toBe('Trend: 1 point, from 5 to 5, min 5, max 5')
  })
  it('single point with showLast does not duplicate the dot', () => {
    expect(m({ data: [5], showLast: true }).findAll('circle')).toHaveLength(1)
  })
  it('NaN/Infinity create gaps (two sub-paths)', () => {
    const w = m({ data: [1, 2, NaN, 4, 5, Infinity, 7] })
    const d = dOf(w)
    expect(d.match(/M/g)).toHaveLength(3)
    // the lone trailing point 7 becomes a dot (it is also the last point)
    expect(w.findAll('circle')).toHaveLength(1)
    expect(w.attributes('aria-label')).toContain('5 points')
  })
  it('isolated point in the middle is a dot; last stays a separate dot', () => {
    const w = m({ data: [1, 2, NaN, 9, NaN, 3, 4], showLast: true })
    expect(w.findAll('[data-slot="sparkline-dot"]')).toHaveLength(1)
    expect(w.findAll('[data-slot="sparkline-last"]')).toHaveLength(1)
  })
  it('negative values are plotted', () => {
    const w = m({ data: [-5, -1, -10] })
    expect(w.attributes('aria-label')).toBe('Trend: 3 points, from -5 to -10, min -10, max -1')
    expect(nums(dOf(w)).every(Number.isFinite)).toBe(true)
  })
  it('flat series → horizontal mid-line', () => {
    const d = dOf(m({ data: [4, 4, 4, 4] }))
    const ys = [...d.matchAll(/,(-?[\d.]+)/g)].map((x) => Number(x[1]))
    expect(new Set(ys)).toEqual(new Set([16]))
  })
  it('all zeros are flat too', () => {
    expect(dOf(m({ data: [0, 0, 0] }))).toMatch(/,16/)
  })
  it('huge numbers produce finite coordinates and a readable label', () => {
    const w = m({ data: [1e308, -1e308, 0, 1e308] })
    expect(dOf(w)).not.toMatch(/NaN|Infinity/)
    expect(w.attributes('aria-label')).not.toMatch(/NaN/)
    const w2 = m({ data: [1e308, 1e308] })
    expect(dOf(w2)).not.toMatch(/NaN|Infinity/)
  })
  it('invalid dimensions fall back to defaults', () => {
    const w = m({ data: [1, 2], width: -5, height: NaN, strokeWidth: 0 })
    expect(w.attributes('viewBox')).toBe('0 0 96 32')
    expect(w.find('path').attributes('stroke-width')).toBe('1.5')
  })
  it('unknown tone falls back to chart-1', () => {
    expect(m({ data: [1, 2], tone: 'nope' }).find('path').classes()).toContain('stroke-chart-1')
  })
  it('tiny viewBox keeps points inside', () => {
    const w = m({ data: [1, 2, 3], width: 4, height: 4 })
    expect(nums(dOf(w)).every((n) => n >= 0 && n <= 4)).toBe(true)
  })
  it('10k points render fast', () => {
    const data = Array.from({ length: 10_000 }, (_, i) => Math.sin(i / 50) * 100)
    const t = performance.now()
    const w = m({ data, area: true })
    expect(performance.now() - t).toBeLessThan(1500)
    expect(dOf(w).length).toBeGreaterThan(10_000)
    expect(w.attributes('aria-label')).toContain('10000 points')
  })
})
