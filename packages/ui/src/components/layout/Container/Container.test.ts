import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Container from './Container.vue'
import { containerVariants } from './variants'

describe('Container', () => {
  describe('good path', () => {
    it('renders a div with defaults: 7xl, padded, centered', () => {
      const w = mount(Container, { slots: { default: 'Hello' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('container')
      expect(w.text()).toBe('Hello')
      expect(w.classes()).toEqual(expect.arrayContaining(['w-full', 'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8']))
    })

    it.each(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'] as const)('applies max-w-%s', (size) => {
      expect(mount(Container, { props: { size } }).classes()).toContain(`max-w-${size}`)
    })

    it('supports full', () => {
      expect(mount(Container, { props: { size: 'full' } }).classes()).toContain('max-w-full')
    })

    it('padded=false removes padding, centered=false removes mx-auto', () => {
      const w = mount(Container, { props: { padded: false, centered: false } })
      expect(w.classes()).not.toContain('px-4')
      expect(w.classes()).not.toContain('mx-auto')
    })

    it('supports the prose size', () => {
      expect(mount(Container, { props: { size: 'prose' } }).classes()).toContain('max-w-prose')
    })

    it.each([
      ['none', 'px-0'],
      ['sm', 'px-3'],
      ['md', 'px-4'],
      ['lg', 'px-6'],
    ] as const)('gutter %s', (gutter, cls) => {
      expect(mount(Container, { props: { gutter } }).classes()).toContain(cls)
    })

    it('gutter replaces the padded classes', () => {
      const w = mount(Container, { props: { gutter: 'lg' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['px-6', 'sm:px-8', 'lg:px-12']))
      expect(w.classes()).not.toContain('px-4')
      expect(mount(Container, { props: { gutter: 'sm', padded: false } }).classes()).toContain('px-3')
    })

    it.each([
      ['none', 'py-0'],
      ['sm', 'py-4'],
      ['md', 'py-8'],
      ['lg', 'py-12'],
    ] as const)('paddingY %s', (paddingY, cls) => {
      expect(mount(Container, { props: { paddingY } }).classes()).toContain(cls)
    })

    it('adds no vertical padding by default', () => {
      expect(mount(Container).classes().some((c) => c.startsWith('py-'))).toBe(false)
    })

    it('exposes the CVA variants', () => {
      expect(containerVariants({ size: 'lg' })).toContain('max-w-lg')
      expect(containerVariants({ gutter: 'sm', paddingY: 'md' })).toContain('py-8')
    })
  })

  describe('customisation', () => {
    it('merges class and lets it override', () => {
      const w = mount(Container, { props: { class: 'max-w-xs custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('max-w-xs')
      expect(w.classes()).not.toContain('max-w-7xl')
    })

    it('renders with `as`', () => {
      const w = mount(Container, { props: { as: 'main' } })
      expect(w.element.tagName).toBe('MAIN')
    })

    it('asChild renders the child', () => {
      const w = mount(Container, { props: { asChild: true }, slots: { default: '<section id="s">x</section>' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.classes()).toContain('max-w-7xl')
    })

    it('passes attributes through', () => {
      const w = mount(Container, { attrs: { id: 'c', 'data-test': 'y', 'aria-label': 'Content' } })
      expect(w.attributes('id')).toBe('c')
      expect(w.attributes('data-test')).toBe('y')
      expect(w.attributes('aria-label')).toBe('Content')
    })
  })

  describe('bad path', () => {
    it('falls back to 7xl for an unknown size', () => {
      const w = mount(Container, { props: { size: 'nope' as never } })
      expect(w.classes()).toContain('max-w-7xl')
    })

    it('unknown gutter is ignored and padded still applies', () => {
      const w = mount(Container, { props: { gutter: 'huge' as never } })
      expect(w.classes()).toContain('px-4')
      expect(w.classes()).toContain('lg:px-8')
      expect(mount(Container, { props: { gutter: 'toString' as never } }).classes()).toContain('px-4')
    })

    it('unknown paddingY adds no vertical padding', () => {
      expect(mount(Container, { props: { paddingY: 'huge' as never } }).classes().some((c) => c.startsWith('py-'))).toBe(false)
    })

    it('falls back for inherited object keys', () => {
      expect(mount(Container, { props: { size: 'toString' as never } }).classes()).toContain('max-w-7xl')
    })
  })

  describe('edge cases', () => {
    it('renders empty', () => {
      expect(mount(Container).text()).toBe('')
    })

    it('handles unicode / RTL content', () => {
      expect(mount(Container, { slots: { default: 'שלום 🌍 مرحبا' } }).text()).toBe('שלום 🌍 مرحبا')
    })

    it('class overrides gutter and paddingY', () => {
      const w = mount(Container, { props: { gutter: 'lg', paddingY: 'lg', class: 'px-1 py-1' } })
      expect(w.classes()).toContain('px-1')
      expect(w.classes()).toContain('py-1')
      expect(w.classes()).not.toContain('px-6')
      expect(w.classes()).not.toContain('py-12')
    })

    it('all options together', () => {
      const w = mount(Container, { props: { size: 'prose', gutter: 'none', paddingY: 'sm', centered: false } })
      expect(w.classes()).toEqual(expect.arrayContaining(['max-w-prose', 'px-0', 'py-4']))
      expect(w.classes()).not.toContain('mx-auto')
    })

    it('handles an empty class', () => {
      expect(mount(Container, { props: { class: '' } }).classes()).toContain('w-full')
    })
  })
})
