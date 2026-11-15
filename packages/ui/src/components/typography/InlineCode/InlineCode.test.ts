import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineCode from './InlineCode.vue'

describe('InlineCode', () => {
  describe('good path', () => {
    it('renders <code> with muted background, mono font, rounding and data-slot', () => {
      const w = mount(InlineCode, { slots: { default: 'npm i' } })
      expect(w.element.tagName).toBe('CODE')
      expect(w.attributes('data-slot')).toBe('inline-code')
      expect(w.text()).toBe('npm i')
      for (const c of ['bg-muted', 'rounded-sm', 'font-mono']) expect(w.classes()).toContain(c)
    })

    it('uses a token font size (no arbitrary values)', () => {
      expect(mount(InlineCode).classes()).toContain('text-sm')
    })
  })

  describe('customisation', () => {
    it('class merges last and overrides', () => {
      const w = mount(InlineCode, { props: { class: 'bg-primary custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-muted')
    })

    it('as swaps the element', () => {
      expect(mount(InlineCode, { props: { as: 'kbd' } }).element.tagName).toBe('KBD')
    })

    it('asChild styles the child', () => {
      const w = mount(InlineCode, { props: { asChild: true }, slots: { default: '<samp>x</samp>' } })
      expect(w.element.tagName).toBe('SAMP')
      expect(w.classes()).toContain('font-mono')
    })

    it('passes attributes through', () => {
      expect(mount(InlineCode, { attrs: { title: 'cmd', 'data-x': '1' } }).attributes('title')).toBe('cmd')
    })
  })

  describe('bad path / edge cases', () => {
    it('renders with no content', () => {
      expect(mount(InlineCode).text()).toBe('')
    })

    it('empty class prop is harmless', () => {
      expect(mount(InlineCode, { props: { class: '' } }).classes()).toContain('bg-muted')
    })

    it('escapes HTML in text content', () => {
      const w = mount(InlineCode, { slots: { default: () => '<b>x</b>' } })
      expect(w.find('b').exists()).toBe(false)
      expect(w.text()).toBe('<b>x</b>')
    })

    it('handles unicode and very long strings (wraps via break-words)', () => {
      const w = mount(InlineCode, { slots: { default: '日本語'.repeat(2000) } })
      expect(w.text()).toHaveLength(6000)
      expect(w.classes()).toContain('break-words')
    })
  })
})
