import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import Lightbox from './Lightbox.vue'

const images = [{ src: '/1.jpg', alt: 'One' }, { src: '/2.jpg', alt: 'Two' }]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})
// Vue skips a bubbling listener attached in the same millisecond as the event, so wait before clicking a fresh mount.
const settle = () => new Promise((r) => setTimeout(r, 5))
const q = (s: string) => document.body.querySelector<HTMLElement>(s)
const make = (props: Record<string, unknown> = {}) => (w = mount(Lightbox, { props: { images, open: true, ...props }, attachTo: document.body }))

describe('Lightbox blurred', () => {
  it('default output is unchanged', () => {
    make()
    expect(q('[data-slot="lightbox"]')!.hasAttribute('data-blurred')).toBe(false)
    expect(q('[data-slot="lightbox-image"]')!.className).not.toContain('blur')
    expect(q('[data-slot="media-blur-toggle"]')).toBeNull()
  })

  it('blurs the open image only and keeps its alt', () => {
    make({ blurred: true })
    const img = q('[data-slot="lightbox-image"]')!
    expect(img.classList.contains('blur-md')).toBe(true)
    expect(img.getAttribute('alt')).toBe('One')
    expect(q('[data-slot="lightbox-close"]')!.className).not.toContain('blur')
    expect(q('[data-slot="lightbox"]')!.getAttribute('data-blurred')).toBe('')
  })

  it('stays blurred across navigation and keeps the same state', async () => {
    make({ blurred: true })
    q('[data-slot="lightbox-next"]')!.click()
    await nextTick()
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(true)
  })

  it('reveal button lives in the header, toggles, and emits v-model events', async () => {
    const onBlur = vi.fn()
    make({ defaultBlurred: true, revealable: true, 'onUpdate:blurred': onBlur })
    const btn = () => q('[data-slot="lightbox-header"] [data-slot="media-blur-toggle"]')!
    expect(btn().textContent!.trim()).toBe('Show image')
    expect(btn().hasAttribute('aria-pressed')).toBe(false)
    await settle()
    btn().click()
    await nextTick()
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(false)
    expect(btn().textContent!.trim()).toBe('Hide image')
    expect(btn().hasAttribute('aria-pressed')).toBe(false)
    expect(onBlur.mock.calls).toEqual([[false]])
    await settle()
    btn().click()
    await nextTick()
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(true)
    expect(onBlur.mock.calls).toEqual([[false], [true]])
  })

  it('controlled value wins', async () => {
    const onBlur = vi.fn()
    make({ blurred: true, revealable: true, 'onUpdate:blurred': onBlur })
    await settle()
    q('[data-slot="media-blur-toggle"]')!.click()
    await nextTick()
    expect(onBlur.mock.calls).toEqual([[false]])
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(true)
    await w!.setProps({ blurred: false })
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(false)
  })

  it('the reveal button does not close the viewer', async () => {
    const onOpen = vi.fn()
    make({ blurred: true, revealable: true, 'onUpdate:open': onOpen })
    await settle()
    q('[data-slot="media-blur-toggle"]')!.click()
    await nextTick()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('inherits the provider; own false wins', () => {
    w = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => [h(Lightbox, { images, open: true })]) }, { attachTo: document.body }) as unknown as VueWrapper
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(true)
    w.unmount()
    w = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => [h(Lightbox, { images, open: true, blurred: false })]) }, { attachTo: document.body }) as unknown as VueWrapper
    expect(q('[data-slot="lightbox-image"]')!.classList.contains('blur-md')).toBe(false)
  })
})
