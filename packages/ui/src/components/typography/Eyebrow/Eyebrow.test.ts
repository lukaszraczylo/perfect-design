import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Eyebrow from './Eyebrow.vue'
import { eyebrowVariants } from './variants'

describe('Eyebrow', () => {
  describe('good path', () => {
    it('renders a <p> as a plain small label with primary tone by default', () => {
      const w = mount(Eyebrow, { slots: { default: 'New' } })
      expect(w.element.tagName).toBe('P')
      expect(w.attributes('data-slot')).toBe('eyebrow')
      expect(w.text()).toBe('New')
      for (const c of ['text-sm', 'font-medium', 'text-primary']) {
        expect(w.classes()).toContain(c)
      }
      // Regression: no uppercase or tracking default (LLMSlop T4/T5).
      expect(w.classes()).not.toContain('uppercase')
      expect(w.classes().some((c) => c.startsWith('tracking-'))).toBe(false)
    })

    it('muted tone', () => {
      const c = mount(Eyebrow, { props: { tone: 'muted' } }).classes()
      expect(c).toContain('text-muted-foreground')
      expect(c).not.toContain('text-primary')
    })
  })

  describe('customisation', () => {
    it('as renders a span', () => {
      expect(mount(Eyebrow, { props: { as: 'span' } }).element.tagName).toBe('SPAN')
    })

    it('asChild styles the child', () => {
      const w = mount(Eyebrow, { props: { asChild: true }, slots: { default: '<h6>x</h6>' } })
      expect(w.element.tagName).toBe('H6')
      expect(w.classes()).toContain('text-primary')
    })

    it('class merges last and overrides', () => {
      const w = mount(Eyebrow, { props: { class: 'text-xs text-success custom-x' } })
      expect(w.classes()).toContain('text-xs')
      expect(w.classes()).not.toContain('text-sm')
      expect(w.classes()).toContain('text-success')
      expect(w.classes()).not.toContain('text-primary')
      expect(w.classes()).toContain('custom-x')
    })

    it('passes attributes through', () => {
      expect(mount(Eyebrow, { attrs: { id: 'e', 'aria-hidden': 'true' } }).attributes('aria-hidden')).toBe('true')
    })

    it('eyebrowVariants is reusable', () => {
      expect(eyebrowVariants({ tone: 'muted' })).toContain('text-muted-foreground')
    })
  })

  describe('bad path / edge cases', () => {
    it('unknown tone does not throw', () => {
      expect(mount(Eyebrow, { props: { tone: 'x' as never } }).exists()).toBe(true)
    })

    it('renders with no content and empty class', () => {
      const w = mount(Eyebrow, { props: { class: '' } })
      expect(w.text()).toBe('')
      expect(w.classes()).toContain('text-sm')
    })

    it('handles unicode and long text', () => {
      expect(mount(Eyebrow, { slots: { default: 'ÄÖÜ ß 日本 ' + 'x'.repeat(2000) } }).text()).toContain('ÄÖÜ')
    })
  })
})
