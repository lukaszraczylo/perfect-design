import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import FeatureCard from './FeatureCard.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('FeatureCard contract', () => {
  it('throws without a title', async () => {
    await t.mount(() => el(FeatureCard, { description: 'Only text' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('FeatureCard: requires a non-empty `title`')
    t.reset()
    await t.mount(() => el(FeatureCard, { title: '  ' }))
    expect(t.errors).toHaveLength(1)
  })
  it('is satisfied by the title prop or the title slot', async () => {
    await t.mount(() => el(FeatureCard, { title: 'Tokens', description: 'Semantic colours.', href: '/tokens' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(FeatureCard, null, { title: () => 'Tokens' }))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(FeatureCard))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('FeatureCard: requires a non-empty `title`'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(FeatureCard))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
