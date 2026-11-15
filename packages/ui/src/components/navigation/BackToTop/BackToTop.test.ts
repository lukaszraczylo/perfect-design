import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import BackToTop from './BackToTop.vue'

let wrapper: VueWrapper | undefined

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true, writable: true })
  document.documentElement.scrollTop = y
  window.dispatchEvent(new Event('scroll'))
}
async function make(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  wrapper = mount(BackToTop, { props, slots: slots as never, attachTo: document.body })
  await flushPromises()
  return wrapper
}
// Vue ignores events dispatched in the same millisecond a listener was attached; let that pass first.
const press = async () => {
  await new Promise((r) => setTimeout(r, 5))
  btn()!.click()
}
const btn = () => document.body.querySelector<HTMLElement>('[data-slot="back-to-top"]')

beforeEach(() => scrollTo(0))
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('BackToTop', () => {
  describe('good path', () => {
    it('is hidden at the top and appears after the default 300px threshold', async () => {
      await make()
      expect(btn()).toBeNull()
      scrollTo(299)
      await flushPromises()
      expect(btn()).toBeNull()
      scrollTo(301)
      await flushPromises()
      expect(btn()).not.toBeNull()
      expect(btn()!.getAttribute('aria-label')).toBe('Back to top')
      expect(btn()!.querySelector('svg')).not.toBeNull()
    })

    it('hides again when scrolled back up', async () => {
      await make()
      scrollTo(900)
      await flushPromises()
      expect(btn()).not.toBeNull()
      scrollTo(0)
      await flushPromises()
      expect(btn()).toBeNull()
    })

    it('click scrolls to the top smoothly', async () => {
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      await make()
      scrollTo(800)
      await flushPromises()
      await press()
      expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })

  describe('customisation', () => {
    it('custom threshold, label, class and icon slot', async () => {
      await make({ threshold: 50, label: 'Nach oben', class: 'bottom-2 custom-x' }, { default: '<i class="mine" />' })
      scrollTo(60)
      await flushPromises()
      expect(btn()!.getAttribute('aria-label')).toBe('Nach oben')
      expect(btn()!.className).toContain('custom-x')
      expect(btn()!.className).toContain('bottom-2')
      expect(btn()!.className).not.toContain('bottom-6')
      expect(btn()!.querySelector('.mine')).not.toBeNull()
      expect(btn()!.querySelector('svg')).toBeNull()
    })

    it('smooth=false and reduced motion both scroll instantly', async () => {
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      await make({ smooth: false })
      scrollTo(800)
      await flushPromises()
      await press()
      expect(spy).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' })
      wrapper!.unmount()
      const mm = vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ matches: true }) as MediaQueryList)
      await make()
      scrollTo(900)
      await flushPromises()
      await press()
      expect(spy).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' })
      mm.mockRestore()
    })

    it('passes attrs through', async () => {
      wrapper = mount(BackToTop, { attrs: { 'data-test': 'b' }, attachTo: document.body })
      scrollTo(500)
      await flushPromises()
      expect(btn()!.getAttribute('data-test')).toBe('b')
    })
  })

  describe('bad path', () => {
    it('invalid or negative thresholds fall back to 300', async () => {
      for (const threshold of [Number.NaN, -10, Number.POSITIVE_INFINITY]) {
        scrollTo(0)
        await make({ threshold })
        scrollTo(200)
        await flushPromises()
        expect(btn(), `threshold ${threshold} at 200px`).toBeNull()
        wrapper!.unmount()
        scrollTo(400)
        await make({ threshold })
        expect(btn(), `threshold ${threshold} at 400px`).not.toBeNull()
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    })

    it('threshold 0 shows after any scroll', async () => {
      await make({ threshold: 0 })
      expect(btn()).toBeNull()
      scrollTo(1)
      await flushPromises()
      expect(btn()).not.toBeNull()
    })
  })

  describe('edge cases', () => {
    it('is visible immediately when mounted already scrolled', async () => {
      scrollTo(1000)
      await make()
      expect(btn()).not.toBeNull()
    })

    it('rapid scroll events settle on the last position', async () => {
      await make()
      for (const y of [500, 0, 700, 10, 999]) scrollTo(y)
      await flushPromises()
      expect(btn()).not.toBeNull()
      scrollTo(5)
      await flushPromises()
      expect(btn()).toBeNull()
    })

    it('unmount removes the scroll listener', async () => {
      const remove = vi.spyOn(window, 'removeEventListener')
      await make()
      wrapper!.unmount()
      wrapper = undefined
      expect(remove.mock.calls.some((c) => c[0] === 'scroll')).toBe(true)
    })

    it('very large scroll offsets work', async () => {
      await make()
      scrollTo(10_000_000)
      await flushPromises()
      expect(btn()).not.toBeNull()
    })
  })
})
