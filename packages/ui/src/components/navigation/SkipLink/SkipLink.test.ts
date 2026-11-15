import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SkipLink from './SkipLink.vue'

// Vue ignores events dispatched in the same millisecond a listener was attached; let that pass first.
const settle = () => new Promise((r) => setTimeout(r, 5))

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('SkipLink', () => {
  describe('good path', () => {
    it('renders an anchor to #main-content with default text, visually hidden until focused', async () => {
      const w = mount(SkipLink)
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('#main-content')
      expect(w.attributes('data-slot')).toBe('skip-link')
      expect(w.text()).toBe('Skip to main content')
      expect(w.classes()).toContain('sr-only')
      expect(w.classes()).toContain('focus:not-sr-only')
    })

    it('moves focus to the target and makes it focusable', async () => {
      const main = document.createElement('main')
      main.id = 'main-content'
      document.body.appendChild(main)
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      const w = mount(SkipLink, { attachTo: document.body })
      await settle()
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
      w.element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
      expect(main.getAttribute('tabindex')).toBe('-1')
      expect(document.activeElement).toBe(main)
      expect(spy).toHaveBeenCalled()
      w.unmount()
    })

    it('keeps an existing tabindex on the target', async () => {
      const main = document.createElement('div')
      main.id = 'main-content'
      main.setAttribute('tabindex', '0')
      document.body.appendChild(main)
      const w = mount(SkipLink, { attachTo: document.body })
      await settle()
      w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(main.getAttribute('tabindex')).toBe('0')
      w.unmount()
    })
  })

  describe('customisation', () => {
    it('custom href, text and class merging', async () => {
      const w = mount(SkipLink, { props: { href: '#content', class: 'focus:bg-red-500 custom-x' }, slots: { default: 'Jump to content' } })
      expect(w.attributes('href')).toBe('#content')
      expect(w.text()).toBe('Jump to content')
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('focus:bg-red-500')
      expect(w.classes()).not.toContain('focus:bg-primary')
    })

    it('passes attrs through', async () => {
      expect(mount(SkipLink, { attrs: { id: 'skip', 'data-test': 'x' } }).attributes('id')).toBe('skip')
    })
  })

  describe('bad path', () => {
    it('target missing: default navigation is left alone and nothing throws', async () => {
      const w = mount(SkipLink, { attachTo: document.body })
      await settle()
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
      w.element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      w.unmount()
    })

    it('non-fragment or bare "#" hrefs are not intercepted', async () => {
      for (const href of ['/other', '#', 'https://x.test/#main-content']) {
        const w = mount(SkipLink, { props: { href }, attachTo: document.body })
      await settle()
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
        w.element.dispatchEvent(ev)
        expect(ev.defaultPrevented).toBe(false)
        w.unmount()
      }
    })
  })

  describe('edge cases', () => {
    it('url-encoded fragment ids are decoded', async () => {
      const t = document.createElement('div')
      t.id = 'главная'
      document.body.appendChild(t)
      const w = mount(SkipLink, { props: { href: `#${encodeURIComponent('главная')}` }, attachTo: document.body })
      await settle()
      w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(document.activeElement).toBe(t)
      w.unmount()
    })

    it('works when scrollIntoView is unavailable', async () => {
      const t = document.createElement('div')
      t.id = 'main-content'
      document.body.appendChild(t)
      const original = Element.prototype.scrollIntoView
      // @ts-expect-error simulate older environments
      Element.prototype.scrollIntoView = undefined
      const w = mount(SkipLink, { attachTo: document.body })
      await settle()
      expect(() => w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).not.toThrow()
      Element.prototype.scrollIntoView = original
      w.unmount()
    })

    it('rapid activations keep focus on the target', async () => {
      const t = document.createElement('div')
      t.id = 'main-content'
      document.body.appendChild(t)
      const w = mount(SkipLink, { attachTo: document.body })
      await settle()
      for (let i = 0; i < 5; i++) w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(document.activeElement).toBe(t)
      w.unmount()
    })
  })
})
