import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Spacer from './Spacer.vue'

describe('Spacer', () => {
  describe('good path', () => {
    it('is a flexible aria-hidden flex-1 div by default', () => {
      const w = mount(Spacer)
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('spacer')
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.classes()).toContain('flex-1')
    })

    it.each([0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const)('fixed vertical size %s sets height', (size) => {
      const w = mount(Spacer, { props: { size } })
      expect(w.classes()).toContain(`h-${size}`)
      expect(w.classes()).toContain('shrink-0')
      expect(w.classes()).not.toContain('flex-1')
    })

    it.each([0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const)('fixed horizontal size %s sets width', (size) => {
      const w = mount(Spacer, { props: { size, axis: 'horizontal' } })
      expect(w.classes()).toContain(`w-${size}`)
      expect(w.classes().some((c) => c.startsWith('h-'))).toBe(false)
    })
  })

  describe('customisation', () => {
    it('class merges and wins', () => {
      const w = mount(Spacer, { props: { size: 4, class: 'h-20 custom' } })
      expect(w.classes()).toContain('h-20')
      expect(w.classes()).not.toContain('h-4')
      expect(w.classes()).toContain('custom')
    })

    it('as + attrs', () => {
      const w = mount(Spacer, { props: { as: 'span' }, attrs: { 'data-x': '1' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-x')).toBe('1')
    })
  })

  describe('bad path', () => {
    it.each([7, -1, 'big', null, NaN])('invalid size %s falls back to flex-1', (size) => {
      expect(mount(Spacer, { props: { size: size as never } }).classes()).toContain('flex-1')
    })

    it('unknown axis behaves as vertical', () => {
      expect(mount(Spacer, { props: { size: 2, axis: 'diagonal' as never } }).classes()).toContain('h-2')
    })
  })

  describe('edge cases', () => {
    it('size alone does not render content', () => {
      expect(mount(Spacer, { props: { size: 3 } }).html()).not.toContain('<span')
      expect(mount(Spacer).text()).toBe('')
    })

    it('size 0 is a fixed zero-size spacer, not flexible', () => {
      const w = mount(Spacer, { props: { size: 0 } })
      expect(w.classes()).toContain('h-0')
      expect(w.classes()).not.toContain('flex-1')
    })
  })
})
