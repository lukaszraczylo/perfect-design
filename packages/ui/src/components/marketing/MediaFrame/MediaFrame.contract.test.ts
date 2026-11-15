import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import MediaFrame from './MediaFrame.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('MediaFrame contract', () => {
  it('throws when src is set without an alt string', async () => {
    await t.mount(() => el(MediaFrame, { src: '/shot.png' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('MediaFrame: requires an `alt` string when `src` is set')
  })
  it('accepts a description and an empty alt (decorative)', async () => {
    await t.mount(() => el(MediaFrame, { src: '/shot.png', alt: 'The settings page' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(MediaFrame, { src: '/shot.png', alt: '' }))
    expect(t.errors).toEqual([])
  })
  it('does not ask for alt without src or when the slot supplies the content', async () => {
    await t.mount(() => el(MediaFrame, { title: 'example.com' }, { default: () => h('p', 'Content') }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(MediaFrame, { src: '/shot.png' }, { default: () => h('img', { src: '/x.png', alt: 'Own image' }) }))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(MediaFrame, { src: '/shot.png' }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('MediaFrame: requires an `alt` string'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(MediaFrame, { src: '/shot.png' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
