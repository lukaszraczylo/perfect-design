import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import SectionReveal from './SectionReveal.vue'
import { installIntersectionObserver, mockMatchMedia } from '../shared/testing'

let io: ReturnType<typeof installIntersectionObserver>
let w: VueWrapper | undefined
beforeEach(() => {
  io = installIntersectionObserver()
  mockMatchMedia(false)
})
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.unstubAllGlobals()
})

describe('SectionReveal', () => {
  describe('good path', () => {
    it('hides on mount, reveals when intersecting, and emits once', async () => {
      w = mount(SectionReveal, { props: { enabled: true }, slots: { default: '<p>Hi</p>' } })
      await nextTick()
      expect(w.attributes('data-slot')).toBe('section-reveal')
      expect(w.attributes('data-revealed')).toBe('false')
      expect(w.classes()).toContain('opacity-0')
      expect(w.text()).toBe('Hi')
      io[0].fire(true)
      await nextTick()
      expect(w.attributes('data-revealed')).toBe('true')
      expect(w.classes()).toContain('opacity-100')
      expect(w.emitted('reveal')).toHaveLength(1)
    })
    it('once=true disconnects after revealing', async () => {
      w = mount(SectionReveal, { props: { enabled: true } })
      io[0].fire(true)
      expect(io[0].disconnected).toBe(true)
    })
    it('once=false re-hides when scrolled out and re-reveals', async () => {
      w = mount(SectionReveal, { props: { enabled: true, once: false } })
      io[0].fire(true)
      await nextTick()
      expect(w.attributes('data-revealed')).toBe('true')
      io[0].fire(false)
      await nextTick()
      expect(w.attributes('data-revealed')).toBe('false')
      io[0].fire(true)
      await nextTick()
      expect(w.attributes('data-revealed')).toBe('true')
      expect(w.emitted('reveal')).toHaveLength(2)
      expect(io[0].disconnected).toBe(false)
    })
    it('passes threshold and rootMargin to the observer', () => {
      w = mount(SectionReveal, { props: { enabled: true, threshold: 0.5, rootMargin: '10px' } })
      expect(io[0].options).toEqual({ threshold: 0.5, rootMargin: '10px' })
    })
    it('delay sets transition-delay', () => {
      w = mount(SectionReveal, { props: { enabled: true, delay: 200 } })
      expect(w.attributes('style')).toContain('transition-delay: 200ms')
    })
    it('effect=fade omits the translate', async () => {
      w = mount(SectionReveal, { props: { enabled: true, effect: 'fade' } })
      await nextTick()
      expect(w.classes()).toContain('opacity-0')
      expect(w.classes()).not.toContain('translate-y-4')
    })
    it('fade-up hidden state translates', async () => {
      w = mount(SectionReveal, { props: { enabled: true } })
      await nextTick()
      expect(w.classes()).toContain('translate-y-4')
    })
  })
  describe('default is a no-op (slop rule M1: off unless explicitly enabled)', () => {
    it('renders a plain wrapper: no animation classes, no observer, no hidden state', async () => {
      w = mount(SectionReveal, { slots: { default: '<p>Hi</p>' } })
      await nextTick()
      expect(io).toHaveLength(0)
      expect(w.attributes('data-revealed')).toBe('true')
      expect(w.classes()).toEqual([])
      expect(w.html()).not.toMatch(/opacity|translate|transition/)
      expect(w.text()).toBe('Hi')
    })
    it('still merges class and ignores delay when disabled', () => {
      w = mount(SectionReveal, { props: { class: 'custom', delay: 300 } })
      expect(w.classes()).toEqual(['custom'])
      expect(w.attributes('style')).toBeUndefined()
      expect(w.emitted('reveal')).toBeUndefined()
    })
  })
  describe('content already on screen is never hidden', () => {
    it('stays revealed without an observer when it is in the viewport at mount', () => {
      const rect = { top: 10, bottom: 110, height: 100, left: 0, right: 0, width: 0, x: 0, y: 10, toJSON: () => ({}) } as DOMRect
      const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
      w = mount(SectionReveal, { props: { enabled: true } })
      spy.mockRestore()
      expect(w.attributes('data-revealed')).toBe('true')
      expect(w.classes()).toContain('opacity-100')
      expect(io).toHaveLength(0)
    })
    it('hides content that starts below the viewport', async () => {
      const rect = { top: 5000, bottom: 5100, height: 100, left: 0, right: 0, width: 0, x: 0, y: 5000, toJSON: () => ({}) } as DOMRect
      const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
      w = mount(SectionReveal, { props: { enabled: true } })
      spy.mockRestore()
      await nextTick()
      expect(w.attributes('data-revealed')).toBe('false')
      expect(io).toHaveLength(1)
    })
  })
  describe('customisation', () => {
    it('merges class, attrs, as', () => {
      w = mount(SectionReveal, { props: { enabled: true, as: 'section', class: 'duration-300 custom' }, attrs: { id: 'r' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('duration-300')
      expect(w.classes()).not.toContain('duration-700')
      expect(w.attributes('id')).toBe('r')
    })
    it('can render as a component and still observes its element', async () => {
      const Box = defineComponent({ setup: (_, { slots }) => () => h('article', slots.default?.()) })
      w = mount(SectionReveal, { props: { enabled: true, as: Box } })
      expect(io[0].targets[0]).toBe(w.element)
      expect(w.element.tagName).toBe('ARTICLE')
    })
  })
  describe('bad path', () => {
    it('without IntersectionObserver the content stays visible', () => {
      vi.stubGlobal('IntersectionObserver', undefined)
      w = mount(SectionReveal, { props: { enabled: true }, slots: { default: 'x' } })
      expect(w.attributes('data-revealed')).toBe('true')
      expect(w.classes()).toContain('opacity-100')
    })
    it('reduced motion keeps content visible and never observes', () => {
      mockMatchMedia(true)
      w = mount(SectionReveal, { props: { enabled: true } })
      expect(w.attributes('data-revealed')).toBe('true')
      expect(io).toHaveLength(0)
    })
    it('invalid threshold falls back to 0.15; negative/NaN delay to 0', () => {
      w = mount(SectionReveal, { props: { enabled: true, threshold: Number.NaN, delay: -50 } })
      expect(io[0].options?.threshold).toBe(0.15)
      expect(w.attributes('style')).toBeUndefined()
      w.unmount()
      w = mount(SectionReveal, { props: { enabled: true, threshold: 7, delay: Number.NaN } })
      expect(io[1].options?.threshold).toBe(1)
      expect(w.attributes('style')).toBeUndefined()
    })
  })
  describe('edge cases', () => {
    it('unmount disconnects the observer', () => {
      w = mount(SectionReveal, { props: { enabled: true } })
      w.unmount()
      w = undefined
      expect(io[0].disconnected).toBe(true)
    })
    it('repeated intersecting callbacks emit reveal only once', async () => {
      w = mount(SectionReveal, { props: { enabled: true, once: false } })
      io[0].fire(true)
      io[0].fire(true)
      io[0].fire(true)
      expect(w.emitted('reveal')).toHaveLength(1)
    })
    it('empty slot and many instances work', () => {
      const ws = Array.from({ length: 100 }, () => mount(SectionReveal, { props: { enabled: true } }))
      expect(io).toHaveLength(100)
      ws.forEach((x) => x.unmount())
      expect(io.every((o) => o.disconnected)).toBe(true)
    })
    it('non-intersecting entry before reveal with once=true keeps it hidden', async () => {
      w = mount(SectionReveal, { props: { enabled: true } })
      io[0].fire(false)
      await nextTick()
      expect(w.attributes('data-revealed')).toBe('false')
    })
  })
})
