import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import ContactLink from './ContactLink.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('ContactLink contract', () => {
  it('throws when there is no value, label or slot text', async () => {
    await t.mount(() => el(ContactLink))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('ContactLink: requires a `value`, a `label` or default slot text')
  })
  it('accepts a value, a label alone (plain text), slot text, or aria-label', async () => {
    await t.mount(() => el(ContactLink, { value: 'hello@example.com' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(ContactLink, { label: 'Email us' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(ContactLink, { value: 'hello@example.com' }, { default: () => 'Write to us' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(ContactLink, { 'aria-label': 'Email us', noIcon: true }))
    expect(t.errors).toEqual([])
  })
  it('passes for every documented variant', async () => {
    for (const variant of ['inline', 'button', 'card']) {
      await t.mount(() => el(ContactLink, { variant, type: 'tel', value: '+1 555 0100', label: 'Call us' }))
      expect(t.errors).toEqual([])
      t.reset()
    }
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(ContactLink))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('ContactLink: requires a `value`'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(ContactLink))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
