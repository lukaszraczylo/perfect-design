import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Label from './Label.vue'

describe('Label', () => {
  describe('good path', () => {
    it('renders a <label> with data-slot and slot text', () => {
      const w = mount(Label, { slots: { default: 'Email' } })
      expect(w.element.tagName).toBe('LABEL')
      expect(w.attributes('data-slot')).toBe('label')
      expect(w.text()).toBe('Email')
    })

    it('wires `for` to the control id', () => {
      expect(mount(Label, { props: { for: 'email' } }).attributes('for')).toBe('email')
    })

    it('shows an aria-hidden required indicator', () => {
      const w = mount(Label, { props: { required: true }, slots: { default: 'Name' } })
      const star = w.find('[data-slot="label-required"]')
      expect(star.exists()).toBe(true)
      expect(star.attributes('aria-hidden')).toBe('true')
    })

    it('has no indicator when not required', () => {
      expect(mount(Label).find('[data-slot="label-required"]').exists()).toBe(false)
    })
  })

  describe('customisation', () => {
    it('merges class and lets it override', () => {
      const w = mount(Label, { props: { class: 'text-lg custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('text-lg')
      expect(w.classes()).not.toContain('text-sm')
    })

    it('renders as another element and passes attrs', () => {
      const w = mount(Label, { props: { as: 'span' }, attrs: { 'data-test': 'x' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('asChild renders the child', () => {
      const w = mount(Label, { props: { asChild: true }, slots: { default: '<span class="kid">Hi</span>' } })
      expect(w.element.tagName).toBe('SPAN')
    })
  })

  describe('bad path / states', () => {
    it('disabled dims the label and sets data-disabled', () => {
      const w = mount(Label, { props: { disabled: true } })
      expect(w.classes()).toContain('opacity-50')
      expect(w.attributes('data-disabled')).toBeDefined()
    })

    it('enabled label has no data-disabled', () => {
      expect(mount(Label).attributes('data-disabled')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('renders empty without error', () => {
      expect(mount(Label).text()).toBe('')
    })

    it('handles unicode and RTL text', () => {
      expect(mount(Label, { slots: { default: 'שם משתמש 🌍' } }).text()).toBe('שם משתמש 🌍')
    })
  })
})
