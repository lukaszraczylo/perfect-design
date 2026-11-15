import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Gauge from './Gauge.vue'
import { gaugeVariants } from './variants'

const make = (props: Record<string, unknown> = {}, slots?: Record<string, unknown>) => mount(Gauge, { props, slots: slots as never })
const arc = (w: ReturnType<typeof make>) => w.find('[data-slot="gauge-arc"]')

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Gauge', () => {
  describe('good path', () => {
    it('renders role=meter with aria values, value text and arc', () => {
      const w = make({ value: 42, label: 'CPU', animated: false })
      expect(w.attributes('role')).toBe('meter')
      expect(w.attributes('data-slot')).toBe('gauge')
      expect(w.attributes('aria-valuenow')).toBe('42')
      expect(w.attributes('aria-valuemin')).toBe('0')
      expect(w.attributes('aria-valuemax')).toBe('100')
      expect(w.attributes('aria-label')).toBe('CPU')
      expect(w.find('[data-slot="gauge-value"]').text()).toBe('42')
      expect(w.find('[data-slot="gauge-label"]').text()).toBe('CPU')
      expect(arc(w).attributes('stroke-dasharray')).toBe('42 100')
      expect(w.find('[data-slot="gauge-track"]').exists()).toBe(true)
    })

    it('honours custom min/max', () => {
      const w = make({ value: 15, min: 10, max: 20, animated: false })
      expect(arc(w).attributes('stroke-dasharray')).toBe('50 100')
      expect(w.attributes('aria-valuemin')).toBe('10')
      expect(w.attributes('aria-valuemax')).toBe('20')
    })

    it('maps thresholds to tones, highest match wins', () => {
      const thresholds = [
        { value: 90, tone: 'danger' },
        { value: 0, tone: 'success' },
        { value: 70, tone: 'warning' },
      ]
      const tone = (v: number) => make({ value: v, thresholds, animated: false }).attributes('data-tone')
      expect(tone(10)).toBe('success')
      expect(tone(70)).toBe('warning')
      expect(tone(95)).toBe('danger')
      const w = make({ value: 95, thresholds, animated: false })
      expect(arc(w).classes()).toContain('stroke-destructive')
    })

    it('uses `tone` below all thresholds and without thresholds', () => {
      expect(make({ value: 5, tone: 'info', animated: false }).attributes('data-tone')).toBe('info')
      expect(make({ value: 5, tone: 'info', thresholds: [{ value: 50, tone: 'danger' }], animated: false }).attributes('data-tone')).toBe('info')
    })

    it('slots receive scope; valueText overrides text and aria-valuetext', () => {
      const w = make({ value: 50, animated: false }, { default: `<template #default="{ percent, text }">{{ percent }}|{{ text }}</template>`, label: 'Slot label' })
      expect(w.find('[data-slot="gauge-value"]').text()).toBe('50|50')
      expect(w.find('[data-slot="gauge-label"]').text()).toBe('Slot label')
      const v = make({ value: 3, max: 4, valueText: '3 of 4 GB', animated: false })
      expect(v.attributes('aria-valuetext')).toBe('3 of 4 GB')
      expect(v.find('[data-slot="gauge-value"]').text()).toBe('3 of 4 GB')
    })

    it('rounds long decimals in the label', () => {
      expect(make({ value: 33.33333, animated: false }).find('[data-slot="gauge-value"]').text()).toBe('33.33')
    })
  })

  describe('customisation', () => {
    it('merges class last, passes attrs and supports sizes', () => {
      const w = mount(Gauge, { props: { value: 1, size: 'sm', class: 'w-10' }, attrs: { id: 'g', 'aria-labelledby': 'l' } })
      expect(w.classes()).toContain('w-10')
      expect(w.classes()).not.toContain('w-24')
      expect(w.attributes('id')).toBe('g')
      expect(w.attributes('aria-labelledby')).toBe('l')
      expect(make({ size: 'lg' }).classes()).toContain('w-56')
      expect(make({}).classes()).toContain('w-40')
      expect(gaugeVariants({ size: 'sm' })).toContain('w-24')
    })

    it('falls back to a generic accessible name when no label is given', () => {
      expect(make({ value: 5 }).attributes('aria-label')).toBe('Gauge')
      expect(make({ value: null }).attributes('aria-label')).toBe('Gauge: No data')
    })

    it('hides the label element when there is no label', () => {
      expect(make({ value: 1 }).find('[data-slot="gauge-label"]').exists()).toBe(false)
    })
  })

  describe('bad path', () => {
    it.each([NaN, null, undefined, Infinity])('treats %s as no data', (v) => {
      const w = make({ value: v, label: 'x', animated: false })
      expect(w.attributes('aria-valuenow')).toBeUndefined()
      // role=meter requires aria-valuenow (axe aria-required-attr): no data is exposed as a labelled image instead
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-valuemin')).toBeUndefined()
      expect(w.attributes('aria-valuemax')).toBeUndefined()
      expect(w.attributes('aria-label')).toBe('x: No data')
      expect(w.attributes('data-state')).toBe('empty')
      expect(w.attributes('data-tone')).toBe('neutral')
      expect(w.find('[data-slot="gauge-value"]').text()).toBe('–')
      expect(arc(w).exists()).toBe(false)
    })

    it('clamps out-of-range values', () => {
      const hi = make({ value: 500, animated: false })
      expect(hi.attributes('aria-valuenow')).toBe('100')
      expect(arc(hi).attributes('stroke-dasharray')).toBe('100 100')
      const lo = make({ value: -5, animated: false })
      expect(lo.attributes('aria-valuenow')).toBe('0')
      expect(arc(lo).exists()).toBe(false)
    })

    it('swaps reversed min/max and repairs non-finite bounds', () => {
      const w = make({ value: 5, min: 10, max: 0, animated: false })
      expect(w.attributes('aria-valuemin')).toBe('0')
      expect(w.attributes('aria-valuemax')).toBe('10')
      expect(arc(w).attributes('stroke-dasharray')).toBe('50 100')
      const bad = make({ value: 50, min: NaN, max: Infinity, animated: false })
      expect(bad.attributes('aria-valuemin')).toBe('0')
      expect(bad.attributes('aria-valuemax')).toBe('100')
    })

    it('min === max yields 0% and no arc', () => {
      expect(arc(make({ value: 5, min: 5, max: 5, animated: false })).exists()).toBe(false)
    })

    it('ignores malformed thresholds', () => {
      const w = make({
        value: 50,
        animated: false,
        thresholds: [{ value: NaN, tone: 'danger' }, null, { value: 10, tone: 'bogus' }] as never,
      })
      expect(w.attributes('data-tone')).toBe('primary')
    })
  })

  describe('animation', () => {
    it('sweeps from empty to value via rAF and cancels on unmount', async () => {
      let cb: FrameRequestCallback = () => {}
      const cancel = vi.fn()
      vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => ((cb = fn), 7))
      vi.stubGlobal('cancelAnimationFrame', cancel)
      const w = make({ value: 60 })
      await w.vm.$nextTick()
      expect(arc(w).exists()).toBe(false) // drawn = 0 before the frame
      cb(0)
      await w.vm.$nextTick()
      expect(arc(w).attributes('stroke-dasharray')).toBe('60 100')
      expect(arc(w).classes().join(' ')).toContain('transition-[stroke-dasharray]')
      w.unmount()
      expect(cancel).not.toHaveBeenCalled() // frame already ran
      const w2 = make({ value: 60 })
      w2.unmount()
      expect(cancel).toHaveBeenCalledWith(7)
    })

    it('updates the arc when value changes', async () => {
      const w = make({ value: 10, animated: false })
      await w.setProps({ value: 80 })
      expect(arc(w).attributes('stroke-dasharray')).toBe('80 100')
    })

    it('does not animate under prefers-reduced-motion and removes the listener', async () => {
      const add = vi.fn()
      const remove = vi.fn()
      vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: add, removeEventListener: remove }))
      const raf = vi.fn()
      vi.stubGlobal('requestAnimationFrame', raf)
      const w = make({ value: 60 })
      await w.vm.$nextTick()
      expect(raf).not.toHaveBeenCalled()
      expect(arc(w).attributes('stroke-dasharray')).toBe('60 100')
      expect(arc(w).classes().join(' ')).not.toContain('transition-[stroke-dasharray]')
      expect(add).toHaveBeenCalledWith('change', expect.any(Function))
      const handler = add.mock.calls[0][1] as (e: { matches: boolean }) => void
      handler({ matches: false })
      w.unmount()
      expect(remove).toHaveBeenCalledWith('change', handler)
    })

    it('is safe without matchMedia and requestAnimationFrame', () => {
      vi.stubGlobal('matchMedia', undefined)
      Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true })
      vi.stubGlobal('requestAnimationFrame', undefined)
      const w = make({ value: 20 })
      expect(arc(w).attributes('stroke-dasharray')).toBe('20 100')
      w.unmount()
    })
  })
})
