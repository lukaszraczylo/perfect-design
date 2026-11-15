import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressRing from './ProgressRing.vue'
import { progressRingSizeScale } from './variants'

const arc = (w: ReturnType<typeof mount>) => w.find('[data-slot="progress-ring-value"]')
const track = (w: ReturnType<typeof mount>) => w.find('[data-slot="progress-ring-track"]')
const label = (w: ReturnType<typeof mount>) => w.find('[data-slot="progress-ring-label"]')

describe('ProgressRing variations', () => {
  describe('default output is unchanged', () => {
    it('64px, 6px stroke, round cap, track and arc present', () => {
      const w = mount(ProgressRing, { props: { value: 25 } })
      expect(w.attributes('style')).toContain('width: 64px')
      expect(arc(w).attributes('stroke-width')).toBe('6')
      expect(arc(w).attributes('r')).toBe('29')
      expect(arc(w).attributes('stroke-linecap')).toBe('round')
      expect(track(w).exists()).toBe(true)
      expect(track(w).classes()).toEqual(['fill-none', 'stroke-muted'])
      expect(arc(w).classes()).toEqual(expect.arrayContaining(['fill-none', 'stroke-primary']))
    })
    it('explicit md preset equals the numeric default', () => {
      const a = mount(ProgressRing, { props: { value: 25 } }).html()
      const b = mount(ProgressRing, { props: { value: 25, size: 'md' } }).html()
      expect(b).toBe(a)
    })
  })

  describe('size presets', () => {
    it.each([
      ['xs', 40, 4, 'text-2xs'],
      ['sm', 48, 5, 'text-xs'],
      ['md', 64, 6, 'text-xs'],
      ['lg', 96, 8, 'text-base'],
      ['xl', 128, 10, 'text-xl'],
    ] as const)('%s is %ipx with a %ipx stroke and label class %s', (size, px, stroke, text) => {
      const w = mount(ProgressRing, { props: { value: 50, size } })
      expect(w.attributes('style')).toContain(`width: ${px}px`)
      expect(w.attributes('style')).toContain(`height: ${px}px`)
      expect(w.find('svg').attributes('width')).toBe(String(px))
      expect(w.find('svg').attributes('viewBox')).toBe(`0 0 ${px} ${px}`)
      expect(arc(w).attributes('stroke-width')).toBe(String(stroke))
      expect(arc(w).attributes('r')).toBe(String((px - stroke) / 2))
      expect(label(w).classes()).toContain(text)
    })

    it('the exported scale matches what renders', () => {
      for (const [name, { size, stroke }] of Object.entries(progressRingSizeScale)) {
        const w = mount(ProgressRing, { props: { size: name as never } })
        expect(w.find('svg').attributes('width')).toBe(String(size))
        expect(arc(w).attributes('stroke-width')).toBe(String(stroke))
      }
    })

    it('an explicit strokeWidth wins over the preset thickness', () => {
      expect(arc(mount(ProgressRing, { props: { size: 'xl', strokeWidth: 3 } })).attributes('stroke-width')).toBe('3')
    })

    it('a numeric size still works and keeps the 6px stroke', () => {
      const w = mount(ProgressRing, { props: { size: 100 } })
      expect(w.find('svg').attributes('width')).toBe('100')
      expect(arc(w).attributes('stroke-width')).toBe('6')
    })

    it('a numeric string counts as px', () => {
      expect(mount(ProgressRing, { props: { size: '96' as never } }).find('svg').attributes('width')).toBe('96')
    })

    it('unknown preset falls back to 64px', () => {
      const w = mount(ProgressRing, { props: { size: 'huge' as never } })
      expect(w.find('svg').attributes('width')).toBe('64')
      expect(arc(w).attributes('stroke-width')).toBe('6')
    })

    it('an invalid strokeWidth on a preset falls back to the preset thickness', () => {
      expect(arc(mount(ProgressRing, { props: { size: 'lg', strokeWidth: Number.NaN } })).attributes('stroke-width')).toBe('8')
      expect(arc(mount(ProgressRing, { props: { size: 'lg', strokeWidth: -2 } })).attributes('stroke-width')).toBe('8')
    })

    it('geometry stays valid for every preset (positive radius, dash array = circumference)', () => {
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        const w = mount(ProgressRing, { props: { size, value: 40 } })
        const r = Number(arc(w).attributes('r'))
        expect(r).toBeGreaterThan(0)
        expect(Number(arc(w).attributes('stroke-dasharray'))).toBeCloseTo(2 * Math.PI * r, 5)
      }
    })

    it('class prop and style keep the box a square of the preset size', () => {
      const w = mount(ProgressRing, { props: { size: 'sm', class: 'ms-2' } })
      expect(w.classes()).toContain('ms-2')
      expect(w.attributes('style')).toContain('width: 48px')
    })
  })

  describe('variant', () => {
    it('bare removes the track and keeps the arc', () => {
      const w = mount(ProgressRing, { props: { value: 40, variant: 'bare' } })
      expect(track(w).exists()).toBe(false)
      expect(arc(w).exists()).toBe(true)
      expect(w.findAll('circle')).toHaveLength(1)
    })

    it('bare keeps the meter semantics and the centre percentage (value is not colour alone)', () => {
      const w = mount(ProgressRing, { props: { value: 40, variant: 'bare', label: 'Storage used' } })
      expect(w.attributes('role')).toBe('meter')
      expect(w.attributes('aria-label')).toBe('Storage used')
      expect(w.attributes('aria-valuenow')).toBe('40')
      expect(w.attributes('aria-valuetext')).toBe('40%')
      expect(label(w).text()).toBe('40%')
    })

    it('default draws the muted track', () => {
      expect(track(mount(ProgressRing, { props: { variant: 'default' } })).classes()).toContain('stroke-muted')
    })

    it('unknown variant falls back to default (track drawn)', () => {
      expect(track(mount(ProgressRing, { props: { variant: 'dashed' as never } })).exists()).toBe(true)
    })
  })

  describe('shape', () => {
    it.each(['round', 'butt'] as const)('%s sets stroke-linecap', (shape) => {
      expect(arc(mount(ProgressRing, { props: { value: 30, shape } })).attributes('stroke-linecap')).toBe(shape)
    })

    it('unknown shape falls back to round', () => {
      expect(arc(mount(ProgressRing, { props: { shape: 'square' as never } })).attributes('stroke-linecap')).toBe('round')
    })

    it('butt keeps the arc length exact: dash array and offset are unchanged', () => {
      const a = mount(ProgressRing, { props: { value: 25, size: 100, strokeWidth: 10 } })
      const b = mount(ProgressRing, { props: { value: 25, size: 100, strokeWidth: 10, shape: 'butt' } })
      expect(arc(b).attributes('stroke-dasharray')).toBe(arc(a).attributes('stroke-dasharray'))
      expect(arc(b).attributes('stroke-dashoffset')).toBe(arc(a).attributes('stroke-dashoffset'))
    })
  })

  describe('combinations', () => {
    it.each([
      ['xs', 'bare', 'butt', 'danger', 'stroke-destructive'],
      ['xl', 'default', 'butt', 'success', 'stroke-success'],
      ['sm', 'bare', 'round', 'info', 'stroke-info'],
    ] as const)('size %s, variant %s, shape %s, tone %s do not conflict', (size, variant, shape, tone, cls) => {
      const w = mount(ProgressRing, { props: { value: 60, size, variant, shape, tone, label: 'Sample' } })
      expect(arc(w).classes()).toContain(cls)
      expect(arc(w).attributes('stroke-linecap')).toBe(shape)
      expect(w.find('svg').attributes('width')).toBe(String(progressRingSizeScale[size].size))
      expect(track(w).exists()).toBe(variant === 'default')
      expect(w.attributes('aria-valuetext')).toBe('60%')
    })

    it('value 0 hides the arc in every shape so no stray cap shows', () => {
      for (const shape of ['round', 'butt'] as const) expect(arc(mount(ProgressRing, { props: { value: 0, shape } })).classes()).toContain('opacity-0')
    })

    it('reacts to preset, variant and shape changes', async () => {
      const w = mount(ProgressRing, { props: { value: 50 } })
      await w.setProps({ size: 'lg', variant: 'bare', shape: 'butt' })
      expect(w.find('svg').attributes('width')).toBe('96')
      expect(track(w).exists()).toBe(false)
      expect(arc(w).attributes('stroke-linecap')).toBe('butt')
    })

    it('keeps the transition and reduced-motion classes for every variant', () => {
      for (const variant of ['default', 'bare'] as const) expect(arc(mount(ProgressRing, { props: { variant, value: 5 } })).classes()).toContain('motion-reduce:transition-none')
    })
  })
})
