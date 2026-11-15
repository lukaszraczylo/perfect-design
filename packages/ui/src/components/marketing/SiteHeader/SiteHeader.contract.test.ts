import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import SiteHeader from './SiteHeader.vue'

const { errors, open, messages } = useContractHarness()
const links = [{ label: 'Components', href: '/components' }, { label: 'Guides', href: '/guides' }]

describe('SiteHeader contract', () => {
  it('throws a ContractError for a link without a label or href, once, naming the location', async () => {
    await open(SiteHeader, { brand: 'Brand', links: [links[0], { label: ' ', href: '/x' }, { label: 'Y', href: '' }] })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('SiteHeader: requires a non-empty `label` and `href` on every link')
    expect(messages()[0]).toContain('links[1] has no `label`')
    await open(SiteHeader, { links: [{ label: 'Docs', href: '' }] })
    expect(messages()[0]).toContain('links[0] ("Docs") has no `href`')
  })
  it('throws for a link group without a title and for a broken link inside a group', async () => {
    await open(SiteHeader, { linkGroups: [{ title: '', links }] })
    expect(messages()[0]).toContain('linkGroups[0] has no `title`')
    await open(SiteHeader, { linkGroups: [{ title: 'Docs', links: [links[0], { label: '', href: '/a' }] }] })
    expect(messages()[0]).toContain('linkGroups[0].links[1] has no `label`')
  })
  it('throws when the navigation is shown without a navLabel or the menu button has no name', async () => {
    await open(SiteHeader, { links, navLabel: '' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('SiteHeader: requires a non-empty `navLabel`')
    await open(SiteHeader, { links, menuLabel: '' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('SiteHeader: requires a non-empty `menuLabel`')
  })
  it('accepts the open/close label pair and a header without navigation', async () => {
    await open(SiteHeader, { links, openLabel: 'Open navigation', menuLabel: '' })
    expect(errors).toEqual([])
    await open(SiteHeader, { brand: 'Brand', navLabel: '', menuLabel: '' })
    expect(errors).toEqual([])
  })
  it('leaves link content to the links slot when it replaces the generated links', async () => {
    await open(SiteHeader, { links: [{ label: '', href: '' }] }, { links: () => h('a', { href: '/x' }, 'Custom') })
    expect(errors).toEqual([])
  })
  it('does not complain about normal usage', async () => {
    await open(SiteHeader, { brand: 'Brand', links, linkGroups: [{ title: 'Docs', links }], activeHref: '/guides', variant: 'centered' }, { cta: () => h('button', 'Sign in') })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(SiteHeader, { links: [{ label: '', href: '/x' }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('SiteHeader: requires a non-empty `label` and `href`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(SiteHeader, { links: [{ label: '', href: '/x' }] })
    expect(spy).not.toHaveBeenCalled()
  })
})
