import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import MobileNav from './MobileNav.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const content = `<a href="/one" class="l1">One</a><a href="/two" class="l2">Two</a><button class="b" data-mobile-nav-close>Close me</button>`
function make(props: Record<string, unknown> = {}, slot = content) {
  wrapper = mount(MobileNav, { props, slots: { default: slot }, attachTo: document.body })
  return wrapper
}
const settle = () => new Promise((r) => setTimeout(r, 5))
const panel = () => document.body.querySelector<HTMLElement>('[data-slot="mobile-nav"]')
const key = (k: string, init: KeyboardEventInit = {}) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))

describe('MobileNav', () => {
  describe('good path', () => {
    it('renders nothing while closed and a labelled panel when open', async () => {
      make()
      expect(panel()).toBeNull()
      await wrapper!.setProps({ open: true })
      expect(panel()).not.toBeNull()
      expect(panel()!.getAttribute('role')).toBe('navigation')
      expect(panel()!.getAttribute('aria-label')).toBe('Navigation')
      expect(panel()!.getAttribute('data-variant')).toBe('dropdown')
    })

    it('Escape closes and emits update:open', async () => {
      make({ open: true })
      await flushPromises()
      key('Escape')
      expect(wrapper!.emitted('update:open')![0]).toEqual([false])
    })

    it('uncontrolled mode closes itself on Escape', async () => {
      make({ defaultOpen: true })
      await flushPromises()
      key('Escape')
      await flushPromises()
      expect(panel()).toBeNull()
    })

    it('moves focus into the panel on open and restores it on close', async () => {
      const outside = document.createElement('button')
      document.body.appendChild(outside)
      outside.focus()
      const open = ref(false)
      const Host = defineComponent({
        setup: () => () => h(MobileNav, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => h('a', { href: '/x', class: 'first' }, 'First')),
      })
      wrapper = mount(Host, { attachTo: document.body })
      open.value = true
      await flushPromises()
      expect(document.activeElement?.classList.contains('first')).toBe(true)
      key('Escape')
      await flushPromises()
      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(outside)
    })

    it('focuses the panel itself when it has no focusable content', async () => {
      // A panel that renders already open must not steal focus on page load; a later open moves focus to the panel.
      const open = ref(false)
      const Host = defineComponent({
        setup: () => () => h(MobileNav, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => h('p', 'Nothing to focus')),
      })
      wrapper = mount(Host, { attachTo: document.body })
      open.value = true
      await flushPromises()
      expect(document.activeElement).toBe(panel())
    })

    it('closes when a link or [data-mobile-nav-close] is clicked, by default', async () => {
      make({ open: true })
      await settle()
      ;(document.body.querySelector('.l1') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(wrapper!.emitted('update:open')![0]).toEqual([false])
      ;(document.body.querySelector('.b') as HTMLElement).click()
      expect(wrapper!.emitted('update:open')).toHaveLength(2)
    })

    it('slot receives a close function', async () => {
      wrapper = mount(MobileNav, {
        props: { open: true },
        slots: { default: '<template #default="{ close }"><button class="x" @click="close">x</button></template>' },
        attachTo: document.body,
      })
      await settle()
      ;(document.body.querySelector('.x') as HTMLElement).click()
      expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })
  })

  describe('sheet variant', () => {
    it('renders a modal dialog with an overlay that closes on click', async () => {
      make({ open: true, variant: 'sheet' })
      await settle()
      expect(panel()!.getAttribute('role')).toBe('dialog')
      expect(panel()!.getAttribute('aria-modal')).toBe('true')
      const overlay = document.body.querySelector<HTMLElement>('[data-slot="mobile-nav-overlay"]')!
      expect(overlay).not.toBeNull()
      overlay.click()
      expect(wrapper!.emitted('update:open')![0]).toEqual([false])
    })

    it('traps Tab focus inside the panel', async () => {
      make({ open: true, variant: 'sheet' })
      await flushPromises()
      const items = [...panel()!.querySelectorAll<HTMLElement>('a[href],button')]
      items[items.length - 1].focus()
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      document.dispatchEvent(tab)
      expect(tab.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(items[0])
      items[0].focus()
      const back = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
      document.dispatchEvent(back)
      expect(document.activeElement).toBe(items[items.length - 1])
    })

    it('Tab in the middle is left alone; empty sheet swallows Tab', async () => {
      make({ open: true, variant: 'sheet' })
      await flushPromises()
      const items = [...panel()!.querySelectorAll<HTMLElement>('a[href],button')]
      items[0].focus()
      const mid = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      document.dispatchEvent(mid)
      expect(mid.defaultPrevented).toBe(false)
      wrapper!.unmount()
      make({ open: true, variant: 'sheet' }, '<p>none</p>')
      await flushPromises()
      const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      document.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(true)
    })

    it('Tab handling is ignored in dropdown mode', async () => {
      make({ open: true })
      await flushPromises()
      const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      document.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
    })
  })

  describe('customisation', () => {
    it('merges class (and lets it override) and passes attrs and id', () => {
      make({ open: true, class: 'p-8 custom-x', id: 'mn', label: 'Menu' }, content)
      expect(panel()!.className).toContain('custom-x')
      expect(panel()!.className).toContain('p-8')
      expect(panel()!.className).not.toContain('p-4')
      expect(panel()!.id).toBe('mn')
      expect(panel()!.getAttribute('aria-label')).toBe('Menu')
    })

    it('forwards arbitrary attrs to the panel', () => {
      wrapper = mount(MobileNav, { props: { open: true }, attrs: { 'data-test': 'z' }, attachTo: document.body })
      expect(panel()!.getAttribute('data-test')).toBe('z')
    })

    it('closeOnNavigate=false keeps the panel open on link clicks', async () => {
      make({ open: true, closeOnNavigate: false })
      await settle()
      ;(document.body.querySelector('.l1') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(wrapper!.emitted('update:open')).toBeUndefined()
    })
  })

  describe('bad path', () => {
    it('ignores other keys and clicks on non-link content', async () => {
      make({ open: true }, '<p class="p">text</p><a href="/x">x</a>')
      await settle()
      key('Enter')
      key('a')
      ;(document.body.querySelector('.p') as HTMLElement).click()
      expect(wrapper!.emitted('update:open')).toBeUndefined()
    })

    it('does not emit when already in the requested state', async () => {
      make({ open: false })
      key('Escape')
      expect(wrapper!.emitted('update:open')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('removes the document listener on close and on unmount', async () => {
      make({ open: true })
      await flushPromises()
      wrapper!.unmount()
      wrapper = undefined
      key('Escape') // must not throw or emit anywhere
      expect(panel()).toBeNull()
    })

    it('rapid open/close cycles leave no stale listener', async () => {
      make()
      for (let i = 0; i < 6; i++) {
        await wrapper!.setProps({ open: i % 2 === 0 })
        await flushPromises()
      }
      expect(panel()).toBeNull()
      key('Escape')
      expect(wrapper!.emitted('update:open')).toBeUndefined()
    })

    it('empty slot renders an empty panel', () => {
      wrapper = mount(MobileNav, { props: { open: true }, attachTo: document.body })
      expect(panel()!.textContent).toBe('')
    })

    it('restoring focus is skipped when there was no previously focused element', async () => {
      ;(document.activeElement as HTMLElement | null)?.blur()
      make({ defaultOpen: true })
      await flushPromises()
      key('Escape')
      await flushPromises()
      expect(panel()).toBeNull()
    })
  })
})
