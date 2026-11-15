import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Lead from './Lead.vue'
import { leadVariants } from './variants'

describe('Lead', () => {
  describe('good path', () => {
    it('renders a <p> with large muted text', () => {
      const w = mount(Lead, { slots: { default: 'Intro' } })
      expect(w.element.tagName).toBe('P')
      expect(w.attributes('data-slot')).toBe('lead')
      expect(w.text()).toBe('Intro')
      expect(w.classes()).toContain('text-lg')
      expect(w.classes()).toContain('text-muted-foreground')
    })

    it('xl size', () => {
      const c = mount(Lead, { props: { size: 'xl' } }).classes()
      expect(c).toContain('text-xl')
      expect(c).not.toContain('text-lg')
      expect(c).toContain('text-muted-foreground')
    })
  })

  describe('customisation', () => {
    it('as swaps the element', () => {
      expect(mount(Lead, { props: { as: 'div' } }).element.tagName).toBe('DIV')
    })

    it('asChild styles the child', () => {
      const w = mount(Lead, { props: { asChild: true }, slots: { default: '<span>x</span>' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.classes()).toContain('text-lg')
    })

    it('class merges last and overrides', () => {
      const w = mount(Lead, { props: { class: 'text-foreground text-2xl custom-x' } })
      expect(w.classes()).toContain('text-foreground')
      expect(w.classes()).not.toContain('text-muted-foreground')
      expect(w.classes()).toContain('text-2xl')
      expect(w.classes()).not.toContain('text-lg')
      expect(w.classes()).toContain('custom-x')
    })

    it('passes attributes through', () => {
      expect(mount(Lead, { attrs: { id: 'l', lang: 'de' } }).attributes('lang')).toBe('de')
    })

    it('leadVariants is reusable', () => {
      expect(leadVariants({ size: 'xl' })).toContain('text-xl')
    })
  })

  describe('bad path / edge cases', () => {
    it('unknown size does not throw', () => {
      expect(mount(Lead, { props: { size: 'x' as never } }).exists()).toBe(true)
    })

    it('renders empty with empty class', () => {
      const w = mount(Lead, { props: { class: '' } })
      expect(w.text()).toBe('')
      expect(w.classes()).toContain('text-pretty')
    })

    it('handles unicode and long text', () => {
      expect(mount(Lead, { slots: { default: 'مرحبا '.repeat(1000) } }).text().length).toBeGreaterThan(5000)
    })
  })
})
