import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatBar from './StatBar.vue'

const track = (w: ReturnType<typeof mount>) => w.find('[data-slot="stat-bar-track"]')
const fill = (w: ReturnType<typeof mount>) => w.find('[data-slot="stat-bar-fill"]')

describe('StatBar', () => {
  describe('good path', () => {
    it('renders label, percentage and a meter', () => {
      const w = mount(StatBar, { props: { label: 'CPU', value: 40 } })
      expect(w.attributes('data-slot')).toBe('stat-bar')
      expect(w.find('[data-slot="stat-bar-label"]').text()).toBe('CPU')
      expect(w.find('[data-slot="stat-bar-value"]').text()).toBe('40%')
      expect(track(w).attributes('role')).toBe('meter')
      expect(track(w).attributes('aria-label')).toBe('CPU')
      expect(track(w).attributes('aria-valuenow')).toBe('40')
      expect(track(w).attributes('aria-valuetext')).toBe('40%')
      expect(fill(w).attributes('style')).toContain('width: 40%')
    })

    it('uses a custom max and valueText', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 500, max: 1000, valueText: '500 / 1,000' } })
      expect(fill(w).attributes('style')).toContain('width: 50%')
      expect(track(w).attributes('aria-valuetext')).toBe('500 / 1,000')
      expect(w.find('[data-slot="stat-bar-value"]').text()).toBe('500 / 1,000')
    })

    it.each([
      ['primary', 'bg-primary'],
      ['success', 'bg-success'],
      ['warning', 'bg-warning'],
      ['danger', 'bg-destructive'],
      ['info', 'bg-info'],
    ] as const)('tone %s', (tone, cls) => {
      expect(fill(mount(StatBar, { props: { label: 'x', value: 10, tone } })).classes()).toContain(cls)
    })

    it('auto tone escalates at warnAt and dangerAt', () => {
      const t = (value: number, extra = {}) => fill(mount(StatBar, { props: { label: 'x', value, tone: 'auto', ...extra } })).classes()
      expect(t(50)).toContain('bg-primary')
      expect(t(80)).toContain('bg-warning')
      expect(t(95)).toContain('bg-destructive')
      expect(t(50, { warnAt: 0.4 })).toContain('bg-warning')
      expect(t(50, { warnAt: 0.1, dangerAt: 0.5 })).toContain('bg-destructive')
    })

    it('size sm is thinner', () => {
      expect(track(mount(StatBar, { props: { label: 'x', value: 1, size: 'sm' } })).classes()).toContain('h-1.5')
      expect(track(mount(StatBar, { props: { label: 'x', value: 1 } })).classes()).toContain('h-2.5')
    })

    it('hideLabel removes the caption but keeps the accessible name', () => {
      const w = mount(StatBar, { props: { label: 'Disk', value: 1, hideLabel: true } })
      expect(w.find('[data-slot="stat-bar-label"]').exists()).toBe(false)
      expect(track(w).attributes('aria-label')).toBe('Disk')
    })
  })

  describe('customisation', () => {
    it('merges class and passes attributes', () => {
      const w = mount(StatBar, { props: { label: 'x', value: 1, class: 'gap-4 custom' }, attrs: { 'data-test': 'a' } })
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-1.5')
      expect(w.classes()).toContain('custom')
      expect(w.attributes('data-test')).toBe('a')
    })
  })

  describe('bad path / edge cases', () => {
    it('clamps value above max to a full bar and below zero to empty', () => {
      const over = mount(StatBar, { props: { label: 'x', value: 250 } })
      expect(track(over).attributes('aria-valuenow')).toBe('100')
      expect(fill(over).attributes('style')).toContain('width: 100%')
      const neg = mount(StatBar, { props: { label: 'x', value: -5 } })
      expect(track(neg).attributes('aria-valuenow')).toBe('0')
      expect(fill(neg).attributes('style')).toContain('width: 0%')
    })

    it.each([NaN, Infinity, -Infinity])('treats %s value as empty', (value) => {
      expect(track(mount(StatBar, { props: { label: 'x', value } })).attributes('aria-valuenow')).toBe('0')
    })

    it.each([0, -10, NaN, Infinity])('invalid max %s gives an empty bar', (max) => {
      expect(track(mount(StatBar, { props: { label: 'x', value: 5, max } })).attributes('aria-valuenow')).toBe('0')
    })

    it('invalid tone falls back to primary', () => {
      expect(fill(mount(StatBar, { props: { label: 'x', value: 5, tone: 'nope' as never } })).classes()).toContain('bg-primary')
    })

    it('handles huge numbers and unicode labels', () => {
      const w = mount(StatBar, { props: { label: 'مرحبا 🎉', value: 1e308, max: 1e308 } })
      expect(track(w).attributes('aria-valuenow')).toBe('100')
      expect(w.find('[data-slot="stat-bar-label"]').text()).toBe('مرحبا 🎉')
    })

    it('zero value renders an empty fill', () => {
      expect(fill(mount(StatBar, { props: { label: 'x', value: 0 } })).attributes('style')).toContain('width: 0%')
    })
  })
})
