import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import { faEnvelope } from '../../../lib/icons'
import TeamGrid from './TeamGrid.vue'
import TeamMemberCard from './TeamMemberCard.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const member = { name: 'Member One', role: 'Maintainer', links: [{ label: 'Email', href: 'mailto:one@example.com', icon: faEnvelope }, { label: 'Website', href: '/one' }] }
describe('TeamGrid contract', () => {
  it('throws once for the first member without a name, naming the index', async () => {
    await t.mount(() => el(TeamGrid, { items: [member, { role: 'No name' }, { name: '' }] }))
    // The nameless members also make their Avatar complain; only the grid's own report is asserted here.
    const own = t.errors.filter((e) => e.message.includes('TeamGrid:'))
    expect(own).toHaveLength(1)
    expect(own[0].name).toBe('ContractError')
    expect(own[0].message).toContain('TeamGrid: items[1] requires a non-empty `name`')
  })
  it('throws when an icon-only link has no label', async () => {
    await t.mount(() => el(TeamGrid, { items: [{ name: 'Member', links: [{ href: '/x', icon: faEnvelope }] }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('TeamGrid: items[0] requires a non-empty `label` on links[0]')
  })
  it('throws when a link has no href', async () => {
    await t.mount(() => el(TeamGrid, { items: [{ name: 'Member', links: [{ label: 'Site', href: '' }] }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('requires a non-empty `href` on links[0]')
  })
  it('complete members pass in every variant, with or without links', async () => {
    for (const variant of ['card', 'centered', 'minimal', 'horizontal']) {
      await t.mount(() => el(TeamGrid, { variant, items: [member, { name: 'Member Two' }] }))
      expect(t.errors).toEqual([])
      t.reset()
    }
  })
  it('TeamMemberCard checks itself when used in a slot', async () => {
    await t.mount(() => el(TeamGrid, null, { default: () => [el(TeamMemberCard, { name: 'Fine' }), el(TeamMemberCard, { role: 'Unnamed' })] }))
    const own = t.errors.filter((e) => e.message.includes('TeamMemberCard:'))
    expect(own).toHaveLength(1)
    expect(own[0].message).toContain('TeamMemberCard: requires a non-empty `name`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(TeamGrid, { items: [{ role: 'x' }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TeamGrid: items[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(TeamGrid, { items: [{ role: 'x' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
