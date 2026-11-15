import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import LogoCloud from './LogoCloud.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('LogoCloud contract', () => {
  it('throws once for the first logo without a name, even with a src, naming the index', async () => {
    await t.mount(() => el(LogoCloud, { logos: [{ name: 'Acme', src: '/a.svg' }, { src: '/b.svg' }, { name: '' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('LogoCloud: logos[1] requires a non-empty `name`, even with a `src`')
  })
  it('passes with names in every layout, with or without src', async () => {
    for (const layout of ['grid', 'inline', 'marquee', 'with-title']) {
      await t.mount(() => el(LogoCloud, { layout, title: 'Used by', logos: [{ name: 'Acme', src: '/a.svg', href: '/acme' }, { name: 'Globex' }] }))
      expect(t.errors).toEqual([])
      t.reset()
    }
  })
  it('an empty list passes', async () => {
    await t.mount(() => el(LogoCloud))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(LogoCloud, { logos: [{ name: '', src: '/a.svg' }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('LogoCloud: logos[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(LogoCloud, { logos: [{ name: '', src: '/a.svg' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
