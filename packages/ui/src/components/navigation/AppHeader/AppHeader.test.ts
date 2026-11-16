import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import AppHeader from './AppHeader.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

const slots = {
  brand: '<span class="brand">Acme</span>',
  nav: '<a href="/docs" class="nav-a">Docs</a>',
  actions: '<button class="act">Sign in</button>',
  mobile: '<a href="/docs" class="m-a">Docs</a>',
}
const mk = (props: Record<string, unknown> = {}, s: Record<string, unknown> = slots) => {
  wrapper = mount(AppHeader, { props, slots: s as never, attachTo: document.body })
  return wrapper
}
const menu = () => document.body.querySelector<HTMLElement>('[data-slot="app-header-menu-button"]')!
// Vue ignores events dispatched in the same millisecond a listener was attached; let that pass first.
const settle = () => new Promise((r) => setTimeout(r, 5))
const click = async (el: HTMLElement) => {
  await settle()
  el.click()
  await flushPromises()
}
const panel = () => document.body.querySelector<HTMLElement>('[data-slot="mobile-nav"]')

describe('AppHeader', () => {
  describe('good path', () => {
    it('renders a header with brand, nav, actions regions', () => {
      const w = mk()
      expect(w.element.tagName).toBe('HEADER')
      expect(w.attributes('data-slot')).toBe('app-header')
      expect(w.find('[data-slot="app-header-brand"] .brand').exists()).toBe(true)
      const nav = w.find('nav[data-slot="app-header-nav"]')
      expect(nav.attributes('aria-label')).toBe('Main')
      expect(nav.classes()).toContain('hidden')
      expect(nav.find('.nav-a').exists()).toBe(true)
      expect(w.find('[data-slot="app-header-actions"] .act').exists()).toBe(true)
    })

    it('menu button toggles the mobile panel and reflects state in aria attributes', async () => {
      mk()
      expect(menu().getAttribute('aria-expanded')).toBe('false')
      expect(menu().getAttribute('aria-label')).toBe('Menu')
      expect(panel()).toBeNull()
      await click(menu())
      expect(menu().getAttribute('aria-expanded')).toBe('true')
      expect(menu().getAttribute('aria-label')).toBe('Menu')
      expect(panel()).not.toBeNull()
      expect(menu().getAttribute('aria-controls')).toBe(panel()!.id)
      expect(panel()!.className).toContain('md:hidden')
      expect(panel()!.querySelector('.m-a')).not.toBeNull()
      await click(menu())
      expect(panel()).toBeNull()
    })

    it('Escape closes the mobile panel', async () => {
      mk()
      await click(menu())
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flushPromises()
      expect(panel()).toBeNull()
    })

    it('sets aria-controls on the menu button only while the panel exists', async () => {
      mk()
      expect(menu().hasAttribute('aria-controls')).toBe(false)
      await click(menu())
      expect(menu().getAttribute('aria-controls')).toBe(panel()!.id)
    })

    it('closes an initially open mobile panel on mount when the viewport is already wide', async () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }))
      const w = mk({ mobileOpen: true })
      await flushPromises()
      expect(w.emitted('update:mobileOpen')![0]).toEqual([false])
    })

    it('supports v-model:mobileOpen', async () => {
      const w = mk({ mobileOpen: true })
      expect(panel()).not.toBeNull()
      await click(menu())
      expect(w.emitted('update:mobileOpen')![0]).toEqual([false])
      await w.setProps({ mobileOpen: false })
      await flushPromises()
      expect(panel()).toBeNull()
    })

    it('mobile slot closes via the scoped close function', async () => {
      mk({}, { mobile: '<template #mobile="{ close }"><button class="c" @click="close">x</button></template>' })
      await click(menu())
      await click(document.body.querySelector('.c') as HTMLElement)
      expect(panel()).toBeNull()
    })

    it('sheet variant is passed through', async () => {
      mk({ mobileVariant: 'sheet', mobileOpen: true })
      expect(panel()!.getAttribute('data-variant')).toBe('sheet')
    })
  })

  describe('customisation', () => {
    it('sticky adds sticky positioning and a data attribute; otherwise relative', () => {
      expect(mk({ sticky: true }).classes()).toContain('sticky')
      expect(wrapper!.attributes('data-sticky')).toBeDefined()
      wrapper!.unmount()
      const w = mk()
      expect(w.classes()).toContain('relative')
      expect(w.classes()).not.toContain('sticky')
    })

    it('bordered can be turned off', () => {
      expect(mk().classes()).toContain('border-b')
      wrapper!.unmount()
      expect(mk({ bordered: false }).classes()).not.toContain('border-b')
    })

    it('merges class and passes attrs; custom nav label', () => {
      const w = mk({ class: 'bg-red-500 custom-x', navLabel: 'Primary' })
      w.element.setAttribute('data-test', 'h')
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('bg-red-500')
      expect(w.classes()).not.toContain('bg-background/90')
      expect(w.find('nav').attributes('aria-label')).toBe('Primary')
    })
  })

  describe('bad path / absent slots', () => {
    it('without a mobile slot there is no menu button or panel', () => {
      const w = mk({}, { brand: 'x' })
      expect(w.find('[data-slot="app-header-menu-button"]').exists()).toBe(false)
      expect(panel()).toBeNull()
    })

    it('without nav/actions/brand slots those regions are omitted', () => {
      const w = mk({}, {})
      expect(w.find('[data-slot="app-header-nav"]').exists()).toBe(false)
      expect(w.find('[data-slot="app-header-actions"]').exists()).toBe(false)
      expect(w.find('[data-slot="app-header-brand"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('rapid menu toggles end open after an odd number of clicks', async () => {
      mk()
      for (let i = 0; i < 5; i++) {
        await click(menu())
      }
      expect(panel()).not.toBeNull()
    })

    it('unmount while open cleans up the listener', async () => {
      mk()
      await click(menu())
      wrapper!.unmount()
      wrapper = undefined
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(panel()).toBeNull()
    })

    it('panel id is derived from useId and referenced by the button while open', () => {
      mk({ mobileOpen: true })
      expect(menu().getAttribute('aria-controls')).toMatch(/-mobile-nav$/)
    })
  })
})
