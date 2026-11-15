import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import VisuallyHidden from './VisuallyHidden.vue'

describe('VisuallyHidden', () => {
  describe('good path', () => {
    it('renders a span with slot text and data-slot', () => {
      const w = mount(VisuallyHidden, { slots: { default: 'Close dialog' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-slot')).toBe('visually-hidden')
      expect(w.text()).toBe('Close dialog')
    })

    it('is hidden visually via inline styles but stays in the DOM / a11y tree', () => {
      const w = mount(VisuallyHidden, { slots: { default: 'x' } })
      const style = w.attributes('style')!
      expect(style).toContain('position: absolute')
      expect(style).toContain('width: 1px')
      expect(style).toContain('height: 1px')
      expect(style).toContain('overflow: hidden')
      expect(w.attributes('aria-hidden')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class', () => {
      const w = mount(VisuallyHidden, { props: { class: 'custom-x focus:not-sr-only' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('focus:not-sr-only')
    })

    it('passes attributes through', () => {
      const w = mount(VisuallyHidden, { attrs: { id: 'vh', 'data-test': 'x' } })
      expect(w.attributes('id')).toBe('vh')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('`as` renders another element', () => {
      expect(mount(VisuallyHidden, { props: { as: 'label' } }).element.tagName).toBe('LABEL')
    })

    it('asChild applies hiding to the child element', () => {
      const w = mount(VisuallyHidden, { props: { asChild: true }, slots: { default: '<h2>Title</h2>' } })
      expect(w.element.tagName).toBe('H2')
      expect(w.attributes('data-slot')).toBe('visually-hidden')
      expect(w.attributes('style')).toContain('position: absolute')
    })
  })

  describe('edge cases', () => {
    it('renders with an empty slot', () => {
      expect(mount(VisuallyHidden).text()).toBe('')
    })

    it('handles unicode and long text', () => {
      const t = 'Ouvrir le menu — القائمة — 日本語 ' + 'x'.repeat(1000)
      expect(mount(VisuallyHidden, { slots: { default: t } }).text()).toBe(t)
    })

    it('empty class prop is fine', () => {
      expect(mount(VisuallyHidden, { props: { class: '' } }).attributes('data-slot')).toBe('visually-hidden')
    })
  })
})
