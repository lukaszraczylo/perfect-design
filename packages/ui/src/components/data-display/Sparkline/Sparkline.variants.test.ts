import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Sparkline from './Sparkline.vue'
import { sparklineVariants } from './variants'

const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(Sparkline, { props: { data: [3, 5, 4, 8, 6], label: 'Sample', ...props } as never, attrs })
const slot = (w: ReturnType<typeof m>, name: string) => w.find(`[data-slot="sparkline-${name}"]`)
const rects = (d: string) => (d.match(/M/g) ?? []).length

describe('Sparkline variants: defaults are unchanged', () => {
  it('keeps today\'s classes, viewBox and parts', () => {
    const w = m()
    expect(w.classes()).toEqual(['inline-block', 'h-auto', 'w-24', 'shrink-0', 'align-middle'])
    expect(w.attributes('viewBox')).toBe('0 0 96 32')
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(slot(w, 'line').exists()).toBe(true)
    expect(slot(w, 'area').exists()).toBe(false)
    expect(slot(w, 'bars').exists()).toBe(false)
    expect(slot(w, 'baseline').exists()).toBe(false)
    expect(slot(w, 'line').attributes('d')).toMatch(/^M[\d.]+,[\d.]+( L[\d.]+,[\d.]+){4}$/)
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ variant: 'line', curve: 'linear', size: 'md' }).html()).toBe(m().html())
  })
  it('the area boolean still adds the fill', () => {
    expect(slot(m({ area: true }), 'area').exists()).toBe(true)
  })
  it('the cva helper keeps the default string for plain elements', () => {
    expect(sparklineVariants()).toBe('inline-block h-auto w-24 shrink-0 align-middle')
  })
})

describe('Sparkline variants: size', () => {
  it.each([
    ['sm', 'w-16'],
    ['md', 'w-24'],
    ['lg', 'w-32'],
  ])('%s is %s', (size, cls) => {
    const w = m({ size })
    expect(w.classes()).toContain(cls)
    expect(w.classes()).toEqual(expect.arrayContaining(['inline-block', 'h-auto', 'shrink-0', 'align-middle']))
  })
  it('an unknown size falls back to md', () => {
    expect(m({ size: 'huge' }).classes()).toContain('w-24')
  })
  it('class wins over size', () => {
    const w = m({ size: 'sm', class: 'w-40' })
    expect(w.classes()).toContain('w-40')
    expect(w.classes()).not.toContain('w-16')
  })
})

describe('Sparkline variants: variant line and area', () => {
  it('area is the same as the area boolean', () => {
    expect(m({ variant: 'area' }).html()).toBe(m({ area: true }).html())
  })
  it('line wins over area=true', () => {
    expect(m({ variant: 'line', area: true }).html()).toBe(m().html())
  })
  it('an unknown variant follows the area boolean', () => {
    expect(m({ variant: 'bogus' }).html()).toBe(m().html())
    expect(m({ variant: 'bogus', area: true }).html()).toBe(m({ area: true }).html())
  })
})

describe('Sparkline variants: curve', () => {
  it('smooth uses cubic segments, step uses H and V', () => {
    expect(slot(m({ curve: 'smooth' }), 'line').attributes('d')!.match(/C/g)).toHaveLength(4)
    const step = slot(m({ curve: 'step' }), 'line').attributes('d')!
    expect(step.match(/H/g)).toHaveLength(4)
    expect(step.match(/V/g)).toHaveLength(4)
  })
  it('the area follows the curve', () => {
    expect(slot(m({ variant: 'area', curve: 'smooth' }), 'area').attributes('d')).toContain('C')
    expect(slot(m({ variant: 'area', curve: 'step' }), 'area').attributes('d')).toContain('H')
  })
  it('unknown curves are linear', () => {
    expect(m({ curve: 'wavy' }).html()).toBe(m().html())
  })
  it('bars ignore the curve', () => {
    expect(m({ variant: 'bar', curve: 'smooth' }).html()).toBe(m({ variant: 'bar' }).html())
  })
})

describe('Sparkline variants: bar', () => {
  it('draws one bar per value in one path, with no line', () => {
    const w = m({ variant: 'bar' })
    expect(w.attributes('data-variant')).toBe('bar')
    expect(slot(w, 'line').exists()).toBe(false)
    expect(rects(slot(w, 'bars').attributes('d')!)).toBe(5)
    expect(slot(w, 'bars').classes()).toContain('fill-chart-1')
    expect(slot(w, 'bars-negative').exists()).toBe(false)
    expect(slot(w, 'baseline').exists()).toBe(false)
  })
  it('bar heights follow the values from a common baseline', () => {
    const d = slot(m({ variant: 'bar', data: [2, 4, 8] }), 'bars').attributes('d')!
    const heights = [...d.matchAll(/v([\d.]+)/g)].map((x) => Number(x[1]))
    expect(heights[1]).toBeGreaterThan(heights[0]!)
    expect(heights[2]).toBeGreaterThan(heights[1]!)
    expect(heights[1]! / heights[0]!).toBeCloseTo(2, 0)
  })
  it('negative bars hang below a visible baseline in the negative tone', () => {
    const w = m({ variant: 'bar', data: [3, -2, 4, -5] })
    expect(rects(slot(w, 'bars').attributes('d')!)).toBe(2)
    expect(rects(slot(w, 'bars-negative').attributes('d')!)).toBe(2)
    expect(slot(w, 'bars-negative').classes()).toContain('fill-destructive')
    expect(slot(w, 'baseline').exists()).toBe(true)
    const y = Number(slot(w, 'baseline').attributes('y1'))
    const up = [...slot(w, 'bars').attributes('d')!.matchAll(/M[\d.]+,([\d.]+) h[\d.]+ v([\d.]+)/g)].map((x) => Number(x[1]) + Number(x[2]))
    const down = [...slot(w, 'bars-negative').attributes('d')!.matchAll(/M[\d.]+,([\d.]+)/g)].map((x) => Number(x[1]))
    expect(up.every((bottom) => Math.abs(bottom - y) < 0.05)).toBe(true)
    expect(down.every((top) => Math.abs(top - y) < 0.05)).toBe(true)
  })
  it('negativeTone changes the colour of the negative bars', () => {
    const w = m({ variant: 'bar', data: [3, -2], negativeTone: 'warning', tone: 'success' })
    expect(slot(w, 'bars').classes()).toContain('fill-success')
    expect(slot(w, 'bars-negative').classes()).toContain('fill-warning')
    expect(slot(m({ variant: 'bar', data: [3, -2], negativeTone: 'nope' as never }), 'bars-negative').classes()).toContain('fill-destructive')
  })
  it('all-negative data hangs from the top', () => {
    const w = m({ variant: 'bar', data: [-1, -4] })
    expect(slot(w, 'bars').exists()).toBe(false)
    expect(rects(slot(w, 'bars-negative').attributes('d')!)).toBe(2)
  })
  it('zeros draw nothing, gaps leave a space, tiny values stay at least one unit tall', () => {
    const w = m({ variant: 'bar', data: [0, Number.NaN, 0.0001, 100] })
    const d = slot(w, 'bars').attributes('d')!
    expect(rects(d)).toBe(2)
    const heights = [...d.matchAll(/v([\d.]+)/g)].map((x) => Number(x[1]))
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(1)
  })
  it('a single value is one bar no wider than eight units', () => {
    const w = m({ variant: 'bar', data: [5] })
    const width = Number(slot(w, 'bars').attributes('d')!.match(/h([\d.]+)/)![1])
    expect(rects(slot(w, 'bars').attributes('d')!)).toBe(1)
    expect(width).toBeLessThanOrEqual(8)
  })
  it('a flat zero series draws no bars; all-equal values fill the height', () => {
    expect(slot(m({ variant: 'bar', data: [0, 0, 0] }), 'bars').exists()).toBe(false)
    expect(slot(m({ variant: 'bar', data: [4, 4, 4] }), 'bars').exists()).toBe(true)
  })
  it('showLast and dots are ignored', () => {
    const w = m({ variant: 'bar', showLast: true, data: [1, Number.NaN, 3, Number.NaN, 5] })
    expect(slot(w, 'last').exists()).toBe(false)
    expect(slot(w, 'dot').exists()).toBe(false)
  })
})

describe('Sparkline variants: winloss', () => {
  const data = [1, -1, 1, 1, 0, -1, 1]
  it('draws equal squares above the centre line for wins and below it for losses', () => {
    const w = m({ variant: 'winloss', data })
    expect(w.attributes('data-variant')).toBe('winloss')
    const wins = slot(w, 'bars').attributes('d')!
    const losses = slot(w, 'bars-negative').attributes('d')!
    expect(rects(wins)).toBe(4)
    expect(rects(losses)).toBe(2)
    const line = Number(slot(w, 'baseline').attributes('y1'))
    const winHeights = new Set([...wins.matchAll(/v([\d.]+)/g)].map((x) => x[1]))
    const lossHeights = new Set([...losses.matchAll(/v([\d.]+)/g)].map((x) => x[1]))
    expect(winHeights.size).toBe(1)
    expect([...winHeights][0]).toBe([...lossHeights][0])
    for (const x of wins.matchAll(/M[\d.]+,([\d.]+) h[\d.]+ v([\d.]+)/g)) expect(Number(x[1]) + Number(x[2])).toBeLessThan(line)
    for (const x of losses.matchAll(/M[\d.]+,([\d.]+)/g)) expect(Number(x[1])).toBeGreaterThan(line)
  })
  it('the size of the value does not matter, only its sign', () => {
    const a = m({ variant: 'winloss', data: [1, -1] }).html()
    expect(m({ variant: 'winloss', data: [100, -0.001] }).html()).toBe(a)
  })
  it('zero is a short tick on the line, drawn neutral', () => {
    const w = m({ variant: 'winloss', data })
    expect(rects(slot(w, 'bars-zero').attributes('d')!)).toBe(1)
    expect(slot(w, 'bars-zero').classes()).toContain('fill-muted-foreground')
    expect(slot(m({ variant: 'winloss', data: [1, -1] }), 'bars-zero').exists()).toBe(false)
  })
  it('wins use the tone and losses the negative tone', () => {
    const w = m({ variant: 'winloss', data, tone: 'success', negativeTone: 'danger' })
    expect(slot(w, 'bars').classes()).toContain('fill-success')
    expect(slot(w, 'bars-negative').classes()).toContain('fill-destructive')
  })
  it('names the counts instead of the numeric range', () => {
    expect(m({ variant: 'winloss', data }).attributes('aria-label')).toBe('Sample')
    const auto = mount(Sparkline, { props: { data, variant: 'winloss' } as never })
    expect(auto.attributes('aria-label')).toBe('Wins and losses: 4 wins, 2 losses, 1 even')
    expect(mount(Sparkline, { props: { data: [1, -1], variant: 'winloss' } as never }).attributes('aria-label')).toBe('Wins and losses: 1 win, 1 loss, 0 even')
  })
  it('gaps leave a blank slot; an all-gap series draws nothing', () => {
    const w = m({ variant: 'winloss', data: [1, Number.NaN, -1] })
    expect(rects(slot(w, 'bars').attributes('d')!)).toBe(1)
    const none = m({ variant: 'winloss', data: [Number.NaN] })
    expect(slot(none, 'bars').exists()).toBe(false)
    expect(slot(none, 'baseline').exists()).toBe(false)
  })
  it('a single win', () => {
    const w = m({ variant: 'winloss', data: [3] })
    expect(rects(slot(w, 'bars').attributes('d')!)).toBe(1)
    expect(slot(w, 'bars-negative').exists()).toBe(false)
  })
})

describe('Sparkline variants: combinations and edge cases', () => {
  it('every variant is a labelled image and keeps size and class', () => {
    for (const variant of ['line', 'area', 'bar', 'winloss']) {
      const w = m({ variant, size: 'lg', class: 'text-foreground' })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Sample')
      expect(w.classes()).toContain('w-32')
      expect(w.classes()).toContain('text-foreground')
    }
  })
  it('empty data draws nothing in any variant and is announced as no data', () => {
    for (const variant of ['line', 'area', 'bar', 'winloss']) {
      const w = mount(Sparkline, { props: { data: [], variant } as never })
      expect(w.attributes('aria-label')).toBe('No data')
      expect(w.findAll('path, line, circle')).toHaveLength(0)
    }
  })
  it('a long series of bars is a single path', () => {
    const data = Array.from({ length: 500 }, (_, i) => Math.sin(i) * 10)
    const w = m({ variant: 'bar', data })
    expect(w.findAll('path')).toHaveLength(2)
    expect(slot(w, 'bars').attributes('d')).not.toMatch(/NaN|Infinity/)
  })
  it('huge values stay finite', () => {
    const w = m({ variant: 'bar', data: [1e308, -1e308, 5] })
    expect(w.html()).not.toMatch(/NaN|Infinity/)
  })
})
