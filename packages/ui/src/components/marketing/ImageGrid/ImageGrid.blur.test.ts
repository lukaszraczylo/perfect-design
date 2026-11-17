import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import ImageGrid from './ImageGrid.vue'

const images = [
  { src: '/1.jpg', alt: 'One' },
  { src: '/2.jpg', alt: 'Two' },
  { src: '/3.jpg', alt: 'Three' },
]
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
const qa = (s: string) => Array.from(document.body.querySelectorAll<HTMLElement>(s))
const make = (props: Record<string, unknown> = {}) => (w = mount(ImageGrid, { props: { images, ...props }, attachTo: document.body }))
const thumbs = () => qa('[data-slot="image-grid-item"] img')
const toggles = () => qa('[data-slot="image-grid-item"] > [data-slot="media-blur-toggle"]')
const isBlurred = (el: HTMLElement) => el.classList.contains('blur-md')

describe('ImageGrid blurred', () => {
  it('default output is unchanged', () => {
    make()
    expect(q('[data-slot="image-grid"]')!.hasAttribute('data-blurred')).toBe(false)
    expect(document.body.innerHTML).not.toContain('blur')
    expect(qa('[data-slot="image-grid-item"]').every((li) => !li.className.includes('relative'))).toBe(true)
  })

  it('blurs the thumbnail images only; the tile and alt text are untouched', () => {
    make({ blurred: true, lightbox: false })
    expect(thumbs().every(isBlurred)).toBe(true)
    expect(thumbs().map((i) => i.getAttribute('alt'))).toEqual(['One', 'Two', 'Three'])
    expect(qa('[data-slot="image-grid-item"] > div').every((t) => !t.className.includes('blur'))).toBe(true)
    expect(q('[data-slot="image-grid"]')!.getAttribute('data-blurred')).toBe('')
  })

  it('provider default and own override, both ways', () => {
    w = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(ImageGrid, { images })) }, { attachTo: document.body }) as unknown as VueWrapper
    expect(thumbs().every(isBlurred)).toBe(true)
    w.unmount()
    w = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(ImageGrid, { images, blurred: false })) }, { attachTo: document.body }) as unknown as VueWrapper
    expect(thumbs().some(isBlurred)).toBe(false)
  })

  it('transition classes are motion-safe only', () => {
    make({ blurred: true })
    for (const c of Array.from(thumbs()[0].classList).filter((x) => x.includes('transition'))) expect(c.startsWith('motion-safe:')).toBe(true)
  })

  it('no reveal buttons unless revealable', () => {
    make({ blurred: true })
    expect(toggles()).toHaveLength(0)
  })

  it('per-item reveal unblurs that image only and emits the index', async () => {
    const wrapper = make({ blurred: true, revealable: true })
    expect(toggles()).toHaveLength(3)
    expect(toggles().every((b) => !b.hasAttribute('aria-pressed') && b.textContent!.trim() === 'Show image')).toBe(true)
    await settle()
    toggles()[1].click()
    await nextTick()
    expect(thumbs().map(isBlurred)).toEqual([true, false, true])
    expect(wrapper.emitted('reveal')).toEqual([[1, true]])
    expect(toggles()[1].textContent!.trim()).toBe('Hide image')
    expect(toggles()[1].hasAttribute('aria-pressed')).toBe(false)
    toggles()[1].click()
    await nextTick()
    expect(thumbs().map(isBlurred)).toEqual([true, true, true])
    expect(wrapper.emitted('reveal')).toEqual([[1, true], [1, false]])
  })

  it('revealing does not open the lightbox', async () => {
    const wrapper = make({ blurred: true, revealable: true })
    await settle()
    toggles()[0].click()
    await nextTick()
    expect(wrapper.emitted('open')).toBeUndefined()
    expect(q('[data-slot="lightbox"]')).toBeNull()
  })

  it('changing the grid-wide blurred clears the per-item reveals', async () => {
    const wrapper = make({ blurred: true, revealable: true })
    await settle()
    toggles()[0].click()
    await nextTick()
    await wrapper.setProps({ blurred: false })
    expect(thumbs().some(isBlurred)).toBe(false)
    expect(toggles()).toHaveLength(0)
    await wrapper.setProps({ blurred: true })
    expect(thumbs().every(isBlurred)).toBe(true)
  })

  it('the lightbox respects blur and reveals the open image, syncing the grid', async () => {
    const wrapper = make({ blurred: true, revealable: true })
    await settle()
    qa('[data-slot="image-grid-item"] > button[aria-haspopup]')[2].click()
    await nextTick()
    const box = q('[data-slot="lightbox-image"]')!
    expect(isBlurred(box)).toBe(true)
    expect(box.getAttribute('alt')).toBe('Three')
    q('[data-slot="lightbox-header"] [data-slot="media-blur-toggle"]')!.click()
    await nextTick()
    expect(isBlurred(q('[data-slot="lightbox-image"]')!)).toBe(false)
    expect(wrapper.emitted('reveal')).toEqual([[2, true]])
    expect(thumbs().map(isBlurred)).toEqual([true, true, false])
  })

  it('the lightbox shows a blurred image without a button when not revealable', async () => {
    make({ blurred: true })
    qa('[data-slot="image-grid-item"] > button[aria-haspopup]')[0].click()
    await nextTick()
    expect(isBlurred(q('[data-slot="lightbox-image"]')!)).toBe(true)
    expect(q('[data-slot="lightbox-header"] [data-slot="media-blur-toggle"]')).toBeNull()
  })
})
