import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusDot from './StatusDot.vue'
import { statusDotVariants } from './variants'

describe('StatusDot', () => {
  describe('good path', () => {
    it('renders a decorative span with data-slot by default', () => {
      const w = mount(StatusDot)
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-slot')).toBe('status-dot')
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('aria-label')).toBeUndefined()
    })

    it.each([
      ['neutral', 'bg-muted-foreground'],
      ['primary', 'bg-primary'],
      ['success', 'bg-success'],
      ['warning', 'bg-warning'],
      ['danger', 'bg-destructive'],
      ['info', 'bg-info'],
    ] as const)('tone %s uses %s', (tone, cls) => {
      expect(mount(StatusDot, { props: { tone } }).classes()).toContain(cls)
    })

    it.each([
      ['sm', 'size-1.5'],
      ['md', 'size-2'],
      ['lg', 'size-2.5'],
    ] as const)('size %s uses %s', (size, cls) => {
      expect(mount(StatusDot, { props: { size } }).classes()).toContain(cls)
    })

    it('defaults to neutral md', () => {
      const w = mount(StatusDot)
      expect(w.classes()).toContain('bg-muted-foreground')
      expect(w.classes()).toContain('size-2')
    })

    it('label exposes role=img and aria-label', () => {
      const w = mount(StatusDot, { props: { label: 'Online' } })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Online')
      expect(w.attributes('aria-hidden')).toBeUndefined()
    })

    it('pulse renders an animated halo that respects reduced motion', () => {
      const w = mount(StatusDot, { props: { pulse: true } })
      const halo = w.find('[data-slot="status-dot-halo"]')
      expect(halo.exists()).toBe(true)
      expect(halo.classes()).toContain('animate-ping')
      expect(halo.classes()).toContain('motion-reduce:animate-none')
      expect(halo.attributes('aria-hidden')).toBe('true')
      expect(w.attributes('data-pulse')).toBeDefined()
    })

    it('has no halo without pulse', () => {
      const w = mount(StatusDot)
      expect(w.find('[data-slot="status-dot-halo"]').exists()).toBe(false)
      expect(w.attributes('data-pulse')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last so it overrides internals', () => {
      const w = mount(StatusDot, { props: { class: 'bg-pink-500 size-4 custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('bg-pink-500')
      expect(w.classes()).toContain('size-4')
      expect(w.classes()).not.toContain('bg-muted-foreground')
      expect(w.classes()).not.toContain('size-2')
    })

    it('passes attributes through', () => {
      const w = mount(StatusDot, { attrs: { id: 'dot', 'data-test': 'x', title: 'Up' } })
      expect(w.attributes('id')).toBe('dot')
      expect(w.attributes('data-test')).toBe('x')
      expect(w.attributes('title')).toBe('Up')
    })

    it('renders as another element with `as`', () => {
      const w = mount(StatusDot, { props: { as: 'div' } })
      expect(w.element.tagName).toBe('DIV')
    })

    it('exports variants for reuse', () => {
      expect(statusDotVariants({ tone: 'success', size: 'lg' })).toContain('bg-success')
      expect(statusDotVariants()).toContain('bg-muted-foreground')
    })
  })

  describe('bad path', () => {
    it('empty-string label is treated as decorative', () => {
      const w = mount(StatusDot, { props: { label: '' } })
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('aria-label')).toBeUndefined()
      expect(w.attributes('aria-hidden')).toBe('true')
    })

    it('unknown tone/size values do not throw and render without tone classes', () => {
      const w = mount(StatusDot, { props: { tone: 'nope' as never, size: 'huge' as never } })
      expect(w.attributes('data-slot')).toBe('status-dot')
      expect(w.classes()).toContain('rounded-full')
    })
  })

  describe('edge cases', () => {
    it('handles unicode and very long labels', () => {
      const label = 'État : en ligne — ' + 'x'.repeat(500)
      expect(mount(StatusDot, { props: { label } }).attributes('aria-label')).toBe(label)
    })

    it('pulse with label keeps role=img on the root only', () => {
      const w = mount(StatusDot, { props: { pulse: true, label: 'Live' } })
      expect(w.findAll('[role="img"]')).toHaveLength(1)
    })

    it('toggling pulse adds and removes the halo', async () => {
      const w = mount(StatusDot)
      await w.setProps({ pulse: true })
      expect(w.find('[data-slot="status-dot-halo"]').exists()).toBe(true)
      await w.setProps({ pulse: false })
      expect(w.find('[data-slot="status-dot-halo"]').exists()).toBe(false)
    })
  })
})
