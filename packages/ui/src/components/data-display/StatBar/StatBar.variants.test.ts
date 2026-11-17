import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { trackSurface } from '../../../lib/styles'
import StatBar from './StatBar.vue'

const mk = (props: Record<string, unknown> = {}) => mount(StatBar, { props: { label: 'Storage', value: 40, ...props } as never })
const track = (w: ReturnType<typeof mk>) => w.find('[data-slot="stat-bar-track"]')
const fill = (w: ReturnType<typeof mk>) => w.find('[data-slot="stat-bar-fill"]')

describe('StatBar track', () => {
  it('uses the shared perceivable track surface, not bg-muted', () => {
    expect(track(mk()).classes()).toContain(trackSurface)
    expect(track(mk()).classes()).not.toContain('bg-muted')
  })
})

describe('StatBar size, layout and shape dimensions', () => {
  it('default output is unchanged', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('flex flex-col gap-1.5')
    expect(track(w).attributes('class')).toBe('w-full overflow-hidden rounded-full bg-input/45 h-2.5')
    expect(fill(w).attributes('class')).toBe('h-full rounded-full motion-safe:transition-[width] bg-primary')
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.attributes('data-shape')).toBeUndefined()
  })

  describe('size', () => {
    it.each([['sm', 'h-1.5'], ['md', 'h-2.5'], ['lg', 'h-4']])('%s -> %s', (size, cls) => expect(track(mk({ size })).classes()).toContain(cls))
    it('unknown falls back to md', () => expect(mk({ size: 'xl' }).html()).toBe(mk().html()))
  })

  describe('shape', () => {
    it('square removes the radius from track and fill', () => {
      const w = mk({ shape: 'square' })
      expect(w.attributes('data-shape')).toBe('square')
      expect(track(w).classes()).toContain('rounded-none')
      expect(track(w).classes()).not.toContain('rounded-full')
      expect(fill(w).classes()).toContain('rounded-none')
    })
    it('unknown falls back to rounded', () => expect(mk({ shape: 'blob' }).html()).toBe(mk().html()))
  })

  describe('layout inline', () => {
    const w = mk({ layout: 'inline', valueText: '40 of 100' })
    it('is one row with the label, bar and value', () => {
      expect(w.attributes('data-layout')).toBe('inline')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-row', 'items-center']))
      expect(w.classes()).not.toContain('flex-col')
      expect(track(w).classes()).toEqual(expect.arrayContaining(['flex-1', 'order-1', 'min-w-0']))
      expect(w.find('[data-slot="stat-bar-value"]').classes()).toContain('order-2')
      expect(w.find('[data-slot="stat-bar-label"]').text()).toBe('Storage')
      expect(w.find('[data-slot="stat-bar-value"]').text()).toBe('40 of 100')
    })
    it('keeps the meter semantics and name', () => {
      expect(track(w).attributes('role')).toBe('meter')
      expect(track(w).attributes('aria-label')).toBe('Storage')
      expect(track(w).attributes('aria-valuetext')).toBe('40 of 100')
    })
    it('with hideLabel it renders the bar alone like stacked', () => {
      const h = mk({ layout: 'inline', hideLabel: true })
      expect(h.find('[data-slot="stat-bar-label"]').exists()).toBe(false)
      expect(h.attributes('data-layout')).toBeUndefined()
      expect(h.classes()).toContain('flex-col')
      expect(track(h).classes()).not.toContain('flex-1')
    })
    it('unknown layout falls back to stacked', () => expect(mk({ layout: 'grid' }).html()).toBe(mk().html()))
  })

  describe('combinations', () => {
    it('inline + lg + square + auto tone', () => {
      const w = mk({ layout: 'inline', size: 'lg', shape: 'square', tone: 'auto', value: 95 })
      expect(track(w).classes()).toEqual(expect.arrayContaining(['h-4', 'rounded-none', 'flex-1']))
      expect(fill(w).classes()).toContain('bg-destructive')
    })
    it('class wins over layout classes', () => {
      const w = mk({ layout: 'inline', class: 'gap-8' })
      expect(w.classes()).toContain('gap-8')
      expect(w.classes()).not.toContain('gap-3')
    })
  })

  it('handles zero, overflow and long labels at every size', () => {
    for (const size of ['sm', 'md', 'lg']) {
      expect(fill(mk({ size, value: 0 })).attributes('style')).toContain('width: 0%')
      expect(fill(mk({ size, value: 500 })).attributes('style')).toContain('width: 100%')
      expect(mk({ size, layout: 'inline', label: 'L'.repeat(200) }).find('[data-slot="stat-bar-label"]').text()).toHaveLength(200)
    }
  })
})
