import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import NewsletterSignup from './NewsletterSignup.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('NewsletterSignup contract', () => {
  it('throws when nothing listens to subscribe', async () => {
    await t.mount(() => el(NewsletterSignup, { title: 'Release notes' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('NewsletterSignup: requires a `@subscribe` handler')
  })
  it('is satisfied by an onSubscribe listener (also .once) and ignores unrelated listeners', async () => {
    await t.mount(() => el(NewsletterSignup, { onSubscribe: () => {} }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(NewsletterSignup, { onSubscribeOnce: () => {} }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(NewsletterSignup, { 'onUpdate:modelValue': () => {} }))
    expect(t.errors).toHaveLength(1)
  })
  it('throws when the label or the button label is an empty string', async () => {
    await t.mount(() => el(NewsletterSignup, { onSubscribe: () => {}, label: '' }))
    expect(t.text()).toContain('requires a non-empty `label`')
    t.reset()
    await t.mount(() => el(NewsletterSignup, { onSubscribe: () => {}, buttonLabel: ' ' }))
    expect(t.text()).toContain('requires a non-empty `buttonLabel`')
  })
  it('normal usage passes in every variant', async () => {
    for (const variant of ['inline', 'stacked', 'card']) {
      await t.mount(() => el(NewsletterSignup, { variant, title: 'Release notes', description: 'Sent when a version ships.', status: 'idle', onSubscribe: () => {} }))
      expect(t.errors).toEqual([])
      t.reset()
    }
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(NewsletterSignup))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('NewsletterSignup: requires a `@subscribe` handler'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(NewsletterSignup))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
