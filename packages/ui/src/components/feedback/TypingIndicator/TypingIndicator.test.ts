import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TypingIndicator from './TypingIndicator.vue'
import { TYPING_INDICATOR_SIZES, TYPING_INDICATOR_VARIANTS } from './variants'

describe('TypingIndicator', () => {
  describe('good path', () => {
    it('is a polite status with a visually hidden default label and three animated dots', () => {
      const w = mount(TypingIndicator)
      expect(w.attributes('data-slot')).toBe('typing-indicator')
      expect(w.attributes('role')).toBe('status')
      expect(w.find('[data-slot="typing-indicator-label"]').text()).toBe('Typing')
      expect(w.find('[data-slot="typing-indicator-label"]').classes()).toContain('sr-only')
      const dots = w.findAll('[data-slot="typing-indicator-dot"]')
      expect(dots).toHaveLength(3)
      for (const d of dots) expect(d.classes()).toContain('animate-ds-dot')
      expect(dots.map((d) => d.classes().find((c) => c.startsWith('[animation-delay')) ?? '')).toEqual(['', '[animation-delay:200ms]', '[animation-delay:400ms]'])
    })
    it('uses a custom label', () => {
      expect(mount(TypingIndicator, { props: { label: 'Mira is typing' } }).text()).toBe('Mira is typing')
    })
    it('hides the dots from assistive tech', () => {
      expect(mount(TypingIndicator).find('[data-slot="typing-indicator-dots"]').attributes('aria-hidden')).toBe('true')
    })
    it('bubble is the default look and plain drops the chip', () => {
      const bubble = mount(TypingIndicator)
      expect(bubble.attributes('data-variant')).toBeUndefined()
      expect(bubble.classes()).toContain('bg-muted')
      const plain = mount(TypingIndicator, { props: { variant: 'plain' } })
      expect(plain.attributes('data-variant')).toBe('plain')
      expect(plain.classes()).not.toContain('bg-muted')
    })
    it.each([['sm', 'size-1'], ['md', 'size-1.5']] as const)('size %s -> dot %s', (size, cls) => {
      const w = mount(TypingIndicator, { props: { size } })
      expect(w.find('[data-slot="typing-indicator-dot"]').classes()).toContain(cls)
    })
    it.each(TYPING_INDICATOR_VARIANTS.flatMap((v) => TYPING_INDICATOR_SIZES.map((s) => [v, s] as const)))('%s %s renders', (variant, size) => {
      expect(mount(TypingIndicator, { props: { variant, size } }).attributes('role')).toBe('status')
    })
  })

  describe('reduced motion', () => {
    it('shows static dots: no movement class remains', () => {
      const dot = mount(TypingIndicator).find('[data-slot="typing-indicator-dot"]')
      expect(dot.classes()).toContain('motion-reduce:animate-none')
      expect(dot.classes()).not.toContain('animate-bounce')
    })
  })

  describe('customisation', () => {
    it('merges class last', () => {
      const w = mount(TypingIndicator, { props: { class: 'bg-card' } })
      expect(w.classes()).toContain('bg-card')
      expect(w.classes()).not.toContain('bg-muted')
    })
    it('passes attributes through', () => {
      expect(mount(TypingIndicator, { attrs: { id: 'typing', 'data-test': 'x' } }).attributes()).toMatchObject({ id: 'typing', 'data-test': 'x' })
    })
    it('decorative drops the role and the label text', () => {
      const w = mount(TypingIndicator, { props: { decorative: true } })
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.text()).toBe('')
    })
  })

  describe('bad path and edge cases', () => {
    it('unknown size and variant fall back to the defaults', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(TypingIndicator, { props: { size: 'huge', variant: 'glow' } })
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('bg-muted')
    })
    it('an empty or blank label falls back to Typing', () => {
      expect(mount(TypingIndicator, { props: { label: '' } }).text()).toBe('Typing')
      expect(mount(TypingIndicator, { props: { label: '   ' } }).text()).toBe('Typing')
    })
    it('renders unicode, RTL and very long labels as text, never as markup', () => {
      const evil = '<img src=x onerror=alert(1)>'
      expect(mount(TypingIndicator, { props: { label: evil } }).find('img').exists()).toBe(false)
      expect(mount(TypingIndicator, { props: { label: 'مرحبا يكتب' } }).text()).toBe('مرحبا يكتب')
      expect(mount(TypingIndicator, { props: { label: 'x'.repeat(5000) } }).text()).toHaveLength(5000)
    })
    it('unmounts cleanly', () => {
      const w = mount(TypingIndicator)
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
