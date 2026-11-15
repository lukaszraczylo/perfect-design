import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import InlineMessage from './InlineMessage.vue'
import { inlineMessageVariants } from './variants'

describe('InlineMessage', () => {
  describe('good path', () => {
    it('renders text with an icon and data-slot', () => {
      const w = mount(InlineMessage, { slots: { default: 'Looks good' } })
      expect(w.attributes('data-slot')).toBe('inline-message')
      expect(w.element.tagName).toBe('P')
      expect(w.find('[data-slot="inline-message-text"]').text()).toBe('Looks good')
      expect(w.find('[data-slot="inline-message-icon"]').exists()).toBe(true)
    })

    it.each(['neutral', 'info', 'success', 'warning', 'danger'] as const)('tone %s', (tone) => {
      const w = mount(InlineMessage, { props: { tone } })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(w.classes().join(' ')).toContain(inlineMessageVariants({ tone }).split(' ')[2])
    })

    it('uses role=alert for danger and role=status otherwise', () => {
      expect(mount(InlineMessage, { props: { tone: 'danger' } }).attributes('role')).toBe('alert')
      for (const tone of ['neutral', 'info', 'success', 'warning'] as const) expect(mount(InlineMessage, { props: { tone } }).attributes('role')).toBe('status')
    })

    it('size sm is smaller', () => {
      expect(mount(InlineMessage, { props: { size: 'sm' } }).classes()).toContain('text-xs')
      expect(mount(InlineMessage).classes()).toContain('text-sm')
    })
  })

  describe('customisation', () => {
    it('custom icon and hideIcon', () => {
      expect(mount(InlineMessage, { props: { icon: faBell } }).find('svg path').attributes('d')).toBe(faBell.icon[4])
      expect(mount(InlineMessage, { props: { hideIcon: true } }).find('svg').exists()).toBe(false)
    })

    it('merges class last; attrs (id, role) fall through and win', () => {
      const w = mount(InlineMessage, { props: { class: 'text-lg mine', tone: 'danger' }, attrs: { id: 'f-err', role: 'status' } })
      expect(w.classes()).toContain('mine')
      expect(w.classes()).toContain('text-lg')
      expect(w.classes()).not.toContain('text-sm')
      expect(w.attributes('id')).toBe('f-err')
      expect(w.attributes('role')).toBe('status')
    })
  })

  describe('bad path / edge cases', () => {
    it('unknown tone and size fall back', () => {
      const w = mount(InlineMessage, { props: { tone: 'bogus' as never, size: 'xl' as never } })
      expect(w.attributes('data-tone')).toBe('neutral')
      expect(w.classes()).toContain('text-sm')
    })

    it('empty slot still renders the (empty) text node', () => {
      expect(mount(InlineMessage).find('[data-slot="inline-message-text"]').text()).toBe('')
    })

    it('very long unicode/RTL text', () => {
      const w = mount(InlineMessage, { slots: { default: 'غير صالح ' + 'ü'.repeat(3000) + ' 🚫' } })
      expect(w.text()).toContain('غير صالح')
      expect(w.find('[data-slot="inline-message-text"]').classes()).toContain('break-words')
    })

    it('toTone helper is exercised through fallback with null', () => {
      expect(mount(InlineMessage, { props: { tone: null as never } }).attributes('data-tone')).toBe('neutral')
    })
  })
})
