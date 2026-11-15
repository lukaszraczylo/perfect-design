import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import Lightbox from './Lightbox.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const images = [{ src: '/a.jpg', alt: 'First' }, { src: '/b.jpg', alt: '', caption: 'Decorative with a caption' }]
describe('Lightbox contract', () => {
  it('throws when open is not provided, even if closed images are given', async () => {
    await t.mount(() => el(Lightbox, { images }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('Lightbox: requires the `open` prop')
    expect(t.errors[0].message).toContain('v-model:open')
  })
  it('accepts open false and open true', async () => {
    await t.mount(() => el(Lightbox, { open: false, images }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(Lightbox, { open: true, images }))
    expect(t.errors).toEqual([])
  })
  it('throws once for the first image without alt or caption, naming the index', async () => {
    await t.mount(() => el(Lightbox, { open: false, images: [images[0], { src: '/c.jpg' }, { src: '/d.jpg' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('Lightbox: images[1] requires an `alt` string (or a `caption`)')
  })
  it('accepts alt, an empty alt (decorative) and a caption standing in for alt', async () => {
    await t.mount(() => el(Lightbox, { open: false, images: [{ src: '/a.jpg', alt: 'Described' }, { src: '/b.jpg', alt: '' }, { src: '/c.jpg', caption: 'Caption only' }] }))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(Lightbox, { images }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Lightbox: requires the `open` prop'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(Lightbox, { images }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
