import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import OfflineIndicator from './OfflineIndicator.vue'

let w: VueWrapper | undefined
function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true })
}
function make(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  w = mount(OfflineIndicator, { props, slots, attachTo: document.body })
  return w
}
afterEach(() => {
  w?.unmount()
  w = undefined
  setOnline(true)
})

describe('OfflineIndicator', () => {
  describe('good path', () => {
    it('renders only the live region while online', () => {
      setOnline(true)
      make()
      expect(w!.attributes('data-slot')).toBe('offline-indicator')
      expect(w!.attributes('role')).toBe('status')
      expect(w!.attributes('aria-live')).toBe('polite')
      expect(w!.attributes('data-state')).toBe('online')
      expect(w!.text()).toBe('')
    })

    it('shows the message when navigator is offline at mount', async () => {
      setOnline(false)
      make()
      expect(w!.attributes('data-state')).toBe('online')
      await nextTick()
      expect(w!.attributes('data-state')).toBe('offline')
      expect(w!.text()).toBe('You are offline. Changes may not be saved.')
      expect(w!.find('svg').exists()).toBe(true)
    })

    it('reacts to window offline/online events', async () => {
      setOnline(true)
      make()
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
      await nextTick()
      expect(w!.attributes('data-state')).toBe('offline')
      setOnline(true)
      window.dispatchEvent(new Event('online'))
      await nextTick()
      expect(w!.attributes('data-state')).toBe('online')
      expect(w!.text()).toBe('')
    })
  })

  describe('customisation', () => {
    it('custom label, slot, icon', () => {
      make({ offline: true, label: 'No connection', icon: faBan })
      expect(w!.text()).toBe('No connection')
      expect(w!.find('svg path').attributes('d')).toBe(faBan.icon[4])
      w!.unmount()
      make({ offline: true }, { default: '<b>Custom</b>' })
      expect(w!.find('b').text()).toBe('Custom')
    })

    it('merges class last and passes attrs', () => {
      make({ offline: true, class: 'px-8 mine' })
      expect(w!.classes()).toContain('mine')
      expect(w!.classes()).toContain('px-8')
      expect(w!.classes()).not.toContain('px-3')
      w!.unmount()
      make({}, {})
      expect(w!.classes()).toContain('contents')
    })

    it('offline prop forces the state regardless of the browser', async () => {
      setOnline(true)
      make({ offline: true })
      expect(w!.attributes('data-state')).toBe('offline')
      await w!.setProps({ offline: false })
      expect(w!.attributes('data-state')).toBe('online')
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
      await nextTick()
      expect(w!.attributes('data-state')).toBe('online')
    })
  })

  describe('edge cases', () => {
    it('rapid flapping ends in the last state', async () => {
      setOnline(true)
      make()
      for (let i = 0; i < 20; i++) {
        setOnline(i % 2 === 1)
        window.dispatchEvent(new Event(i % 2 === 1 ? 'online' : 'offline'))
      }
      await nextTick()
      expect(w!.attributes('data-state')).toBe('online')
    })

    it('stops listening after unmount', async () => {
      setOnline(true)
      make()
      const el = w!.element
      w!.unmount()
      w = undefined
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
      await nextTick()
      expect(el.getAttribute('data-state')).toBe('online')
    })

    it('very long unicode label', () => {
      make({ offline: true, label: 'offline '.repeat(500) + '日本語 🚫' })
      expect(w!.text()).toContain('日本語')
    })
  })
})
