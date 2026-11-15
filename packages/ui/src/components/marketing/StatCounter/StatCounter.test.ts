import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatCounter from './StatCounter.vue'
import { installIntersectionObserver, installRaf } from '../shared/testing'

describe('StatCounter', () => {
  describe('good path', () => {
    it('renders the formatted final value statically with tabular figures', () => {
      const w = mount(StatCounter, { props: { value: 1000, suffix: '+' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-slot')).toBe('stat-counter')
      expect(w.text()).toBe('1,000+')
      expect(w.classes()).toContain('tabular-nums')
    })
    it('formats prefix, decimals and locale', () => {
      expect(mount(StatCounter, { props: { value: 5, prefix: '$' } }).text()).toBe('$5')
      expect(mount(StatCounter, { props: { value: 1234.5, decimals: 2, locale: 'de-DE' } }).text()).toBe('1.234,50')
    })
    it('re-renders when the value changes', async () => {
      const w = mount(StatCounter, { props: { value: 100 } })
      await w.setProps({ value: 200 })
      expect(w.text()).toBe('200')
    })
  })

  describe('count-up removed (slop rule M3)', () => {
    it('never creates an observer or animation frame, even with the old props', () => {
      const io = installIntersectionObserver()
      const raf = installRaf()
      const w = mount(StatCounter, { props: { value: 42, animate: true, duration: 1400 } })
      expect(w.text()).toBe('42')
      expect(io).toHaveLength(0)
      expect(raf.pending()).toBe(0)
      vi.unstubAllGlobals()
    })
    it('exposes one text node: no aria-hidden visual copy, no sr-only duplicate, no live region', () => {
      const w = mount(StatCounter, { props: { value: 9 } })
      expect(w.find('[aria-hidden]').exists()).toBe(false)
      expect(w.find('.sr-only').exists()).toBe(false)
      expect(w.find('[aria-live]').exists()).toBe(false)
      expect(w.element.children).toHaveLength(0)
    })
    it('deprecated animate and duration props are not rendered as attributes', () => {
      const w = mount(StatCounter, { props: { value: 1, animate: false, duration: 5 } })
      expect(w.attributes('animate')).toBeUndefined()
      expect(w.attributes('duration')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class and passes attrs', () => {
      const w = mount(StatCounter, { props: { value: 1, class: 'text-4xl custom' }, attrs: { id: 's' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('tabular-nums')
      expect(w.attributes('id')).toBe('s')
    })
  })

  describe('bad path', () => {
    it.each([Number.NaN, Infinity, -Infinity])('non-finite %s renders the fallback', (value) => {
      expect(mount(StatCounter, { props: { value, fallback: 'unknown' } }).text()).toBe('unknown')
      expect(mount(StatCounter, { props: { value } }).text()).toBe('n/a')
    })
    it('the default fallback contains no em dash', () => {
      expect(mount(StatCounter, { props: { value: Number.NaN } }).text()).not.toMatch(/\u2014/)
    })
    it('negative values keep their sign', () => {
      expect(mount(StatCounter, { props: { value: -50 } }).text()).toBe('-50')
    })
    it('invalid decimals are clamped', () => {
      expect(mount(StatCounter, { props: { value: 1.5, decimals: -3 } }).text()).toBe('2')
      expect(mount(StatCounter, { props: { value: 1.5, decimals: Number.NaN } }).text()).toBe('2')
      expect(mount(StatCounter, { props: { value: 1, decimals: 99 } }).text()).toBe('1.000000')
    })
    it('invalid locale falls back without throwing', () => {
      expect(mount(StatCounter, { props: { value: 1500, locale: 'not_a_locale!!' } }).text()).toBe('1500')
    })
    it('value turning invalid shows the fallback; recovering shows the number', async () => {
      const w = mount(StatCounter, { props: { value: 10 } })
      await w.setProps({ value: Number.NaN })
      expect(w.text()).toBe('n/a')
      await w.setProps({ value: 20 })
      expect(w.text()).toBe('20')
    })
  })

  describe('edge cases', () => {
    it('huge numbers format', () => {
      expect(mount(StatCounter, { props: { value: 1e12 } }).text()).toBe('1,000,000,000,000')
    })
    it('unmounts cleanly', () => {
      expect(() => mount(StatCounter, { props: { value: 1 } }).unmount()).not.toThrow()
    })
  })
})
