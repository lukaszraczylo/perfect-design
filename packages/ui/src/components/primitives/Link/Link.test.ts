import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Link from './Link.vue'
import { linkVariants } from './variants'

describe('Link', () => {
  describe('good path', () => {
    it('renders an <a> with href and slot content', () => {
      const w = mount(Link, { props: { href: '/docs' }, slots: { default: 'Docs' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('data-slot')).toBe('link')
      expect(w.attributes('href')).toBe('/docs')
      expect(w.text()).toBe('Docs')
      expect(w.attributes('target')).toBeUndefined()
      expect(w.attributes('rel')).toBeUndefined()
      expect(w.find('[data-slot="link-external-icon"]').exists()).toBe(false)
    })

    it.each([
      ['default', 'text-primary'],
      ['underline', 'underline'],
      ['muted', 'text-muted-foreground'],
      ['subtle', 'decoration-border'],
    ] as const)('applies the %s variant', (variant, cls) => {
      expect(mount(Link, { props: { variant } }).classes()).toContain(cls)
      expect(linkVariants({ variant })).toContain(cls)
    })

    it('external opens in a new tab safely with icon and sr-only hint', () => {
      const w = mount(Link, { props: { href: 'https://x.dev', external: true }, slots: { default: 'X' } })
      expect(w.attributes('target')).toBe('_blank')
      expect(w.attributes('rel')).toBe('noopener noreferrer')
      expect(w.find('[data-slot="link-external-icon"]').exists()).toBe(true)
      expect(w.find('.sr-only').text()).toBe('(opens in new tab)')
      expect(w.attributes('data-external')).toBeDefined()
    })

    it('externalIcon=false hides the icon but keeps the sr-only hint', () => {
      const w = mount(Link, { props: { href: 'https://x.dev', external: true, externalIcon: false } })
      expect(w.find('[data-slot="link-external-icon"]').exists()).toBe(false)
      expect(w.find('.sr-only').exists()).toBe(true)
    })

    it('has a focus ring', () => {
      expect(mount(Link).classes().join(' ')).toContain('focus-visible:ring-3')
    })
  })

  describe('customisation', () => {
    it('merges class with consumer winning', () => {
      const w = mount(Link, { props: { class: 'text-foreground custom' } })
      expect(w.classes()).toContain('text-foreground')
      expect(w.classes()).not.toContain('text-primary')
      expect(w.classes()).toContain('custom')
    })

    it('passes attributes through and consumer target/rel attrs override', () => {
      const w = mount(Link, { props: { external: true }, attrs: { id: 'l', rel: 'nofollow' } })
      expect(w.attributes('id')).toBe('l')
      expect(w.attributes('rel')).toBe('nofollow')
    })

    it('renders as a custom component (RouterLink-like) with `as`', () => {
      const Fake = defineComponent({
        props: { to: { type: String, required: true } },
        setup(p, { slots }) {
          return () => h('a', { href: p.to, 'data-fake': '' }, slots.default?.())
        },
      })
      const w = mount(Link, { props: { as: Fake }, attrs: { to: '/route' }, slots: { default: 'Go' } })
      expect(w.attributes('data-fake')).toBeDefined()
      expect(w.attributes('href')).toBe('/route')
      expect(w.attributes('data-slot')).toBe('link')
      expect(w.text()).toBe('Go')
    })

    it('asChild renders the child element with link classes and no extra markup', () => {
      const w = mount(Link, { props: { asChild: true, external: true }, slots: { default: '<a href="/x">Go</a>' } })
      expect(w.element.tagName).toBe('A')
      expect(w.classes()).toContain('text-primary')
      expect(w.attributes('target')).toBe('_blank')
      expect(w.find('.sr-only').exists()).toBe(false)
      expect(w.text()).toBe('Go')
    })
  })

  describe('bad path', () => {
    it('disabled sets aria-disabled, removes href and tabindex -1', () => {
      const w = mount(Link, { props: { href: '/x', disabled: true } })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('href')).toBeUndefined()
      expect(w.attributes('tabindex')).toBe('-1')
    })

    it('disabled blocks click handlers and default navigation', async () => {
      const onClick = vi.fn()
      const w = mount(Link, { props: { href: '/x', disabled: true }, attrs: { onClick } })
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
      w.element.dispatchEvent(ev)
      expect(onClick).not.toHaveBeenCalled()
      expect(ev.defaultPrevented).toBe(true)
    })

    it('enabled link still fires click', async () => {
      const onClick = vi.fn((e: Event) => e.preventDefault())
      const w = mount(Link, { props: { href: '/x' }, attrs: { onClick } })
      await w.trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('unknown variant falls back to default', () => {
      expect(mount(Link, { props: { variant: 'neon' as never } }).classes()).toContain('text-primary')
    })

    it('without href renders an anchor with no href attribute', () => {
      expect(mount(Link).attributes('href')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('external with no slot content still renders icon and hint', () => {
      const w = mount(Link, { props: { external: true } })
      expect(w.find('svg').exists()).toBe(true)
      expect(w.text()).toContain('(opens in new tab)')
    })

    it('handles unicode and RTL text', () => {
      expect(mount(Link, { slots: { default: 'שלום 日本語 🚀' } }).text()).toBe('שלום 日本語 🚀')
    })

    it('toggles disabled reactively', async () => {
      const w = mount(Link, { props: { href: '/x' } })
      await w.setProps({ disabled: true })
      expect(w.attributes('aria-disabled')).toBe('true')
      await w.setProps({ disabled: false })
      expect(w.attributes('aria-disabled')).toBeUndefined()
      expect(w.attributes('href')).toBe('/x')
    })
  })
})

describe('Link disabled semantics', () => {
  it('a disabled link keeps role=link with aria-disabled (an <a> without href has no role otherwise) and leaves the tab order', () => {
    const w = mount(Link, { props: { href: '/x', disabled: true }, slots: { default: 'Go' } })
    expect(w.attributes('role')).toBe('link')
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.attributes('tabindex')).toBe('-1')
    expect(w.attributes('href')).toBeUndefined()
  })

  it('an enabled link gets no explicit role and uses a logical margin for the external icon', () => {
    const w = mount(Link, { props: { href: '/x', external: true }, slots: { default: 'Go' } })
    expect(w.attributes('role')).toBeUndefined()
    const icon = w.find('[data-slot="link-external-icon"]')
    expect(icon.classes()).toContain('ms-1')
    expect(icon.classes()).not.toContain('ml-1')
  })
})
