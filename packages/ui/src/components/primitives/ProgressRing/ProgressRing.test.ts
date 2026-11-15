import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressRing from './ProgressRing.vue'
import { progressRingVariants } from './variants'

const arc = (w: ReturnType<typeof mount>) => w.find('[data-slot="progress-ring-value"]')
const circ = (r: number) => 2 * Math.PI * r

describe('ProgressRing', () => {
  describe('good path', () => {
    it('renders a meter with aria attributes and data-slot', () => {
      const w = mount(ProgressRing, { props: { value: 25 } })
      expect(w.attributes('data-slot')).toBe('progress-ring')
      expect(w.attributes('role')).toBe('meter')
      expect(w.attributes('aria-valuenow')).toBe('25')
      expect(w.attributes('aria-valuemin')).toBe('0')
      expect(w.attributes('aria-valuemax')).toBe('100')
      expect(w.attributes('aria-valuetext')).toBe('25%')
      expect(w.attributes('aria-label')).toBe('Progress')
    })

    it('sizes the box and svg (default 64px)', () => {
      const w = mount(ProgressRing)
      expect(w.attributes('style')).toContain('width: 64px')
      expect(w.attributes('style')).toContain('height: 64px')
      const svg = w.find('svg')
      expect(svg.attributes('width')).toBe('64')
      expect(svg.attributes('viewBox')).toBe('0 0 64 64')
      expect(svg.attributes('aria-hidden')).toBe('true')
    })

    it('computes radius from size and stroke width', () => {
      const w = mount(ProgressRing, { props: { size: 100, strokeWidth: 10 } })
      expect(arc(w).attributes('r')).toBe('45')
      expect(arc(w).attributes('cx')).toBe('50')
      expect(arc(w).attributes('stroke-width')).toBe('10')
      expect(w.find('[data-slot="progress-ring-track"]').attributes('r')).toBe('45')
    })

    it('sets dash array/offset proportional to value', () => {
      const w = mount(ProgressRing, { props: { value: 25, size: 100, strokeWidth: 10 } })
      const c = circ(45)
      expect(Number(arc(w).attributes('stroke-dasharray'))).toBeCloseTo(c, 5)
      expect(Number(arc(w).attributes('stroke-dashoffset'))).toBeCloseTo(c * 0.75, 5)
    })

    it('honours a custom max', () => {
      const w = mount(ProgressRing, { props: { value: 5, max: 20 } })
      expect(w.attributes('aria-valuemax')).toBe('20')
      expect(w.attributes('aria-valuetext')).toBe('25%')
    })

    it('draws the arc from the top with round caps and a reduced-motion safe transition', () => {
      const w = mount(ProgressRing, { props: { value: 50 } })
      expect(w.find('svg').classes()).toContain('-rotate-90')
      expect(arc(w).attributes('stroke-linecap')).toBe('round')
      expect(arc(w).classes()).toContain('transition-[stroke-dashoffset]')
      expect(arc(w).classes()).toContain('motion-reduce:transition-none')
      expect(w.find('[data-slot="progress-ring-track"]').classes()).toContain('stroke-muted')
    })

    it.each([
      ['neutral', 'stroke-muted-foreground'],
      ['primary', 'stroke-primary'],
      ['success', 'stroke-success'],
      ['warning', 'stroke-warning'],
      ['danger', 'stroke-destructive'],
      ['info', 'stroke-info'],
    ] as const)('tone %s uses %s', (tone, cls) => {
      expect(arc(mount(ProgressRing, { props: { value: 10, tone } })).classes()).toContain(cls)
    })

    it('renders the percentage by default', () => {
      expect(mount(ProgressRing, { props: { value: 66.4 } }).find('[data-slot="progress-ring-label"]').text()).toBe('66%')
    })

    it('scoped label slot receives value and percent', () => {
      const w = mount(ProgressRing, {
        props: { value: 3, max: 4 },
        slots: { label: `<template #label="{ value, percent }">{{ value }}/{{ percent }}</template>` },
      })
      expect(w.find('[data-slot="progress-ring-label"]').text()).toBe('3/75')
    })
  })

  describe('customisation', () => {
    it('merges class last', () => {
      const w = mount(ProgressRing, { props: { class: 'inline-block custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('inline-block')
      expect(w.classes()).not.toContain('inline-flex')
    })

    it('passes attributes through and lets aria-label be overridden', () => {
      const w = mount(ProgressRing, { attrs: { 'aria-label': 'CPU load', id: 'r', 'data-test': 'x' } })
      expect(w.attributes('aria-label')).toBe('CPU load')
      expect(w.attributes('id')).toBe('r')
      expect(w.attributes('data-test')).toBe('x')
    })

    it.each([
      [30, 'text-2xs'],
      [64, 'text-xs'],
      [96, 'text-base'],
      [160, 'text-xl'],
    ])('size %i uses label text class %s', (size, cls) => {
      expect(mount(ProgressRing, { props: { size } }).find('[data-slot="progress-ring-label"]').classes()).toContain(cls)
    })

    it('exports variants for reuse', () => {
      expect(progressRingVariants({ tone: 'success' })).toContain('stroke-success')
      expect(progressRingVariants()).toContain('stroke-primary')
    })
  })

  describe('bad path', () => {
    it('NaN becomes 0', () => {
      const w = mount(ProgressRing, { props: { value: Number.NaN } })
      expect(w.attributes('aria-valuenow')).toBe('0')
      expect(w.find('[data-slot="progress-ring-label"]').text()).toBe('0%')
    })

    it('negative becomes 0', () => {
      expect(mount(ProgressRing, { props: { value: -10 } }).attributes('aria-valuenow')).toBe('0')
    })

    it('above max is clamped to max', () => {
      const w = mount(ProgressRing, { props: { value: 500, max: 200 } })
      expect(w.attributes('aria-valuenow')).toBe('200')
      expect(w.attributes('aria-valuetext')).toBe('100%')
      expect(Number(arc(w).attributes('stroke-dashoffset'))).toBeCloseTo(0, 5)
    })

    it.each([0, -5, Number.NaN, Infinity])('max %s falls back to 100', (max) => {
      const w = mount(ProgressRing, { props: { value: 50, max } })
      expect(w.attributes('aria-valuemax')).toBe('100')
      expect(w.attributes('aria-valuetext')).toBe('50%')
    })

    it('Infinity value clamps to max, -Infinity to 0', () => {
      expect(mount(ProgressRing, { props: { value: Infinity } }).attributes('aria-valuenow')).toBe('100')
      expect(mount(ProgressRing, { props: { value: -Infinity } }).attributes('aria-valuenow')).toBe('0')
    })

    it.each([0, -3, Number.NaN])('invalid size %s falls back to 64', (size) => {
      expect(mount(ProgressRing, { props: { size } }).find('svg').attributes('width')).toBe('64')
    })

    it.each([0, -1, Number.NaN])('invalid strokeWidth %s falls back to 6', (strokeWidth) => {
      expect(arc(mount(ProgressRing, { props: { strokeWidth } })).attributes('stroke-width')).toBe('6')
    })

    it('stroke wider than half the size is capped so the radius stays positive', () => {
      const w = mount(ProgressRing, { props: { size: 20, strokeWidth: 50 } })
      expect(arc(w).attributes('stroke-width')).toBe('10')
      expect(Number(arc(w).attributes('r'))).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('value 0 hides the arc so no stray round cap shows', () => {
      expect(arc(mount(ProgressRing, { props: { value: 0 } })).classes()).toContain('opacity-0')
      expect(arc(mount(ProgressRing, { props: { value: 1 } })).classes()).not.toContain('opacity-0')
    })

    it('value equal to max is a full ring', () => {
      const w = mount(ProgressRing, { props: { value: 100 } })
      expect(Number(arc(w).attributes('stroke-dashoffset'))).toBeCloseTo(0, 5)
      expect(w.find('[data-slot="progress-ring-label"]').text()).toBe('100%')
    })

    it('reacts to prop updates', async () => {
      const w = mount(ProgressRing, { props: { value: 10 } })
      await w.setProps({ value: 90 })
      expect(w.attributes('aria-valuenow')).toBe('90')
      expect(w.find('[data-slot="progress-ring-label"]').text()).toBe('90%')
    })

    it('empty label slot renders an empty centre', () => {
      const w = mount(ProgressRing, { slots: { label: '<span></span>' } })
      expect(w.find('[data-slot="progress-ring-label"]').text()).toBe('')
    })

    it('handles tiny and huge sizes', () => {
      expect(mount(ProgressRing, { props: { size: 1, strokeWidth: 1 } }).exists()).toBe(true)
      expect(mount(ProgressRing, { props: { size: 4000 } }).find('svg').attributes('width')).toBe('4000')
    })
  })
})

describe('ProgressRing accessible name', () => {
  it('defaults to "Progress" and can be named with `label`', () => {
    expect(mount(ProgressRing, { props: { value: 10 } }).attributes('aria-label')).toBe('Progress')
    expect(mount(ProgressRing, { props: { value: 10, label: 'CPU load' } }).attributes('aria-label')).toBe('CPU load')
  })

  it('an explicit aria-label attribute still wins', () => {
    expect(mount(ProgressRing, { props: { value: 10 }, attrs: { 'aria-label': 'Memory' } }).attributes('aria-label')).toBe('Memory')
  })
})
