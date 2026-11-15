import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import SiteFooter from './SiteFooter.vue'

const { errors, open, messages } = useContractHarness()
const links = [{ label: 'Components', href: '/components' }, { label: 'Guides', href: '/guides' }]
const columns = [{ title: 'Docs', links }]

describe('SiteFooter contract', () => {
  it('throws a ContractError for a column without a title, naming the column', async () => {
    await open(SiteFooter, { columns: [columns[0], { title: ' ', links }] })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('SiteFooter: requires a non-empty `label` and `href` on every link and a `title` on every column')
    expect(messages()[0]).toContain('columns[1] has no `title`')
  })
  it('throws for a link without a label or href in columns, links and legalLinks, once', async () => {
    await open(SiteFooter, { columns: [{ title: 'Docs', links: [links[0], { label: '', href: '/x' }, { label: 'Y', href: '' }] }] })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('columns[0].links[1] has no `label`')
    await open(SiteFooter, { variant: 'simple', links: [{ label: 'Docs', href: '' }] })
    expect(messages()[0]).toContain('links[0] ("Docs") has no `href`')
    await open(SiteFooter, { legalLinks: [{ label: 'Privacy', href: ' ' }] })
    expect(messages()[0]).toContain('legalLinks[0] ("Privacy") has no `href`')
  })
  it('throws when a footer navigation is shown without a navLabel', async () => {
    await open(SiteFooter, { columns, navLabel: '' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('SiteFooter: requires a non-empty `navLabel`')
    await open(SiteFooter, { variant: 'simple', links, navLabel: ' ' })
    expect(errors).toHaveLength(1)
  })
  it('accepts an empty navLabel when no navigation is rendered', async () => {
    await open(SiteFooter, { variant: 'minimal', legal: '(c) Sample', navLabel: '' })
    expect(errors).toEqual([])
  })
  it('does not complain about normal usage', async () => {
    await open(SiteFooter, { columns, legalLinks: [{ label: 'Privacy', href: '/privacy' }], legal: '(c) Sample', description: 'About' }, { brand: () => h('span', 'Brand') })
    expect(errors).toEqual([])
    await open(SiteFooter, { variant: 'centered', links, tone: 'dark' })
    expect(errors).toEqual([])
    await open(SiteFooter, {})
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(SiteFooter, { columns: [{ title: '', links }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('SiteFooter: requires a non-empty `label` and `href`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(SiteFooter, { columns: [{ title: '', links }] })
    expect(spy).not.toHaveBeenCalled()
  })
})
