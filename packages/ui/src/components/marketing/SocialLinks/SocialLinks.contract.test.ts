import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import { faEnvelope } from '../../../lib/icons'
import SocialLinks from './SocialLinks.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const link = { label: 'GitHub', href: 'https://example.com/org', icon: faEnvelope }
describe('SocialLinks contract', () => {
  it('throws once for the first entry without a label, naming the index', async () => {
    await t.mount(() => el(SocialLinks, { links: [link, { href: '/x', icon: faEnvelope }, { href: '/y', label: '', icon: faEnvelope }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('SocialLinks: links[1] requires a non-empty `label`')
  })
  it('throws for an entry without an href', async () => {
    await t.mount(() => el(SocialLinks, { links: [{ label: 'GitHub', icon: faEnvelope }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('SocialLinks: links[0] requires a non-empty `href`')
  })
  it('complete entries and an empty list pass', async () => {
    await t.mount(() => el(SocialLinks, { links: [link, { ...link, label: 'Mastodon' }] }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(SocialLinks))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(SocialLinks, { links: [{ href: '/x', icon: faEnvelope }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('SocialLinks: links[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(SocialLinks, { links: [{ href: '/x', icon: faEnvelope }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
