import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import BeforeAfter from './BeforeAfter.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('BeforeAfter contract', () => {
  it('throws when before has no beforeAlt, naming the fix', async () => {
    await t.mount(() => el(BeforeAfter, { before: '/b.jpg', after: '/a.jpg', afterAlt: 'After' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('BeforeAfter: requires a `beforeAlt` string')
    expect(t.errors[0].message).toContain('empty string')
  })
  it('throws when after has no afterAlt', async () => {
    await t.mount(() => el(BeforeAfter, { before: '/b.jpg', beforeAlt: 'Before', after: '/a.jpg' }))
    expect(t.text()).toContain('requires a `afterAlt` string')
  })
  it('accepts descriptive alts and an empty string (decorative)', async () => {
    await t.mount(() => el(BeforeAfter, { before: '/b.jpg', beforeAlt: 'Old layout', after: '/a.jpg', afterAlt: '' }))
    expect(t.errors).toEqual([])
  })
  it('does not ask for alts of images that are not set', async () => {
    await t.mount(() => el(BeforeAfter))
    expect(t.errors).toEqual([])
  })
  it('throws when the label is an empty string', async () => {
    await t.mount(() => el(BeforeAfter, { label: '' }))
    expect(t.text()).toContain('requires a non-empty `label`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(BeforeAfter, { before: '/b.jpg' }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('BeforeAfter: requires a `beforeAlt`'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(BeforeAfter, { before: '/b.jpg' }))
    expect(t.errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
