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

  describe('markers', () => {
    const ticks = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="stat-bar-marker"]')
    const left = (el: { attributes: (k: string) => string | undefined }) => el.attributes('style') ?? ''

    it('renders one tick per marker at value/max', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 27, max: 30, markers: [{ value: 24, label: 'pacing' }, { value: 30, label: 'limit' }] } })
      const t = ticks(w)
      expect(t).toHaveLength(2)
      expect(left(t[0]!)).toContain('80%')
      expect(left(t[1]!)).toContain('100%')
      expect(t[0]!.attributes('aria-hidden')).toBe('true')
      expect(t[0]!.attributes('role')).toBeUndefined()
      expect(t[0]!.attributes('aria-label')).toBeUndefined()
    })

    it('clamps markers to the track', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 10, max: 30, markers: [{ value: -5, label: 'low' }, { value: 45, label: 'high' }] } })
      const t = ticks(w)
      expect(left(t[0]!)).toContain('0%')
      expect(left(t[0]!)).not.toContain('-5')
      expect(left(t[1]!)).toContain('100%')
    })

    it('keeps both labels for coinciding markers', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 30, markers: [{ value: 30, label: 'soft limit' }, { value: 30, label: 'hard limit' }] } })
      const t = ticks(w)
      expect(t).toHaveLength(2)
      expect(w.find(`[id="${track(w).attributes('aria-describedby')}"]`).text()).toBe('soft limit 30, hard limit 30')
    })

    it('lists the markers in the meter description', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 30, markers: [{ value: 24, label: 'pacing' }, { value: 30, label: 'limit' }] } })
      const id = track(w).attributes('aria-describedby')!
      expect(id).toBeTruthy()
      expect(w.find(`[id="${id}"]`).text()).toBe('pacing 24, limit 30')
    })

    it('gives every tick a background ring so a tick matching the fill stays visible', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 32, max: 30, tone: 'danger', markers: [{ value: 30, label: 'limit', tone: 'danger' }] } })
      expect(ticks(w)[0]!.classes()).toEqual(expect.arrayContaining(['ring-1', 'ring-background']))
    })

    it('formats marker values like the visible value', () => {
      const w = mount(StatBar, { props: { label: 'Tok', value: 5, max: 2000000, markers: [{ value: 1200000, label: 'limit' }, { value: 1234.5678, label: 'soft' }] } })
      expect(w.find(`[id="${track(w).attributes('aria-describedby')}"]`).text()).toBe('limit 1,200,000, soft 1,234.57')
    })

    it('lets a marker valueText win over the formatted value', () => {
      const w = mount(StatBar, { props: { label: 'Tok', value: 5, max: 2000000, markers: [{ value: 1200000, label: 'limit', valueText: '1.2M' }] } })
      expect(w.find(`[id="${track(w).attributes('aria-describedby')}"]`).text()).toBe('limit 1.2M')
    })

    it('never prints NaN or Infinity in the description', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 30, markers: [{ value: Number.NaN, label: 'nan' }, { value: Infinity, label: 'inf' }] } })
      const text = w.find(`[id="${track(w).attributes('aria-describedby')}"]`).text()
      expect(text).toBe('nan, inf')
    })

    it('skips null and non-object markers instead of throwing', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 30, markers: [null, undefined, 3, { value: 10, label: 'ok' }] as never } })
      expect(ticks(w)).toHaveLength(1)
      expect(w.find(`[id="${track(w).attributes('aria-describedby')}"]`).text()).toBe('ok 10')
    })

    it.each([
      ['neutral', 'bg-foreground'],
      ['warning', 'bg-warning'],
      ['danger', 'bg-destructive'],
      ['primary', 'bg-primary'],
    ] as const)('tone %s uses %s', (tone, cls) => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 30, markers: [{ value: 10, label: 'm', tone }] } })
      expect(ticks(w)[0]!.classes()).toContain(cls)
    })

    it('defaults to the neutral tone and ignores an unknown tone', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 30, markers: [{ value: 10, label: 'a' }, { value: 11, label: 'b', tone: 'bogus' as never }] } })
      for (const t of ticks(w)) expect(t.classes()).toContain('bg-foreground')
    })

    it('ignores non-finite marker values and a non-positive max', () => {
      const w = mount(StatBar, { props: { label: 'Req', value: 5, max: 0, markers: [{ value: Number.NaN, label: 'nan' }, { value: 3, label: 'x' }] } })
      for (const t of ticks(w)) expect(left(t)).toContain('0%')
    })

    it('renders identical markup when markers is unset or empty', () => {
      const pinned =
        '<div data-slot="stat-bar" class="flex flex-col gap-1.5">\n  <div class="flex items-baseline justify-between gap-2 text-sm"><span data-slot="stat-bar-label" class="text-muted-foreground">Storage</span><span data-slot="stat-bar-value" class="font-medium tabular-nums text-foreground">42%</span></div>\n  <div data-slot="stat-bar-track" role="meter" aria-label="Storage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="42" aria-valuetext="42%" class="w-full overflow-hidden rounded-full bg-input/45 h-2.5">\n    <div data-slot="stat-bar-fill" class="h-full rounded-full motion-safe:transition-[width] bg-primary" style="width: 42%;"></div>\n  </div>\n</div>'
      expect(mount(StatBar, { props: { label: 'Storage', value: 42 } }).html()).toBe(pinned)
      expect(mount(StatBar, { props: { label: 'Storage', value: 42, markers: [] } }).html()).toBe(pinned)
    })
  })
})
