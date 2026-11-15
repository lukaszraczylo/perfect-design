import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, settle, strictMount } from '../shared/contract/testing'
import ImageGrid from './ImageGrid.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const images = [{ src: '/a.jpg', alt: 'First' }, { src: '/b.jpg', alt: '' }]
describe('ImageGrid contract', () => {
  it('throws once for the first image without alt, naming the index (also reaches the internal Lightbox once)', async () => {
    await t.mount(() => el(ImageGrid, { images: [images[0], { src: '/c.jpg' }, { src: '/d.jpg' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('ImageGrid: images[1] requires an `alt` string')
  })
  it('accepts alt, an empty alt, and (with lightbox) a caption', async () => {
    await t.mount(() => el(ImageGrid, { images: [...images, { src: '/c.jpg', caption: 'A caption' }] }))
    expect(t.errors).toEqual([])
  })
  it('without lightbox a caption does not replace alt', async () => {
    await t.mount(() => el(ImageGrid, { lightbox: false, images: [{ src: '/c.jpg', caption: 'A caption' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('ImageGrid: images[0] requires an `alt` string.')
  })
  it('the internal Lightbox is bound to open, so opening it raises no error', async () => {
    await t.mount(() => el(ImageGrid, { images }))
    document.querySelector<HTMLButtonElement>('button')?.click()
    await settle()
    expect(document.querySelector('[data-slot="lightbox"]')).not.toBeNull()
    expect(t.errors).toEqual([])
  })
  it('an empty grid passes', async () => {
    await t.mount(() => el(ImageGrid))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(ImageGrid, { images: [{ src: '/c.jpg' }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('ImageGrid: images[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(ImageGrid, { images: [{ src: '/c.jpg' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
