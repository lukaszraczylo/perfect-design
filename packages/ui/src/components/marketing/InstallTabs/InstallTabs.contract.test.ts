import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import InstallTabs from './InstallTabs.vue'

const { errors, open, messages } = useContractHarness()
const tabs = [{ label: 'pnpm', code: 'pnpm add sample' }, { label: 'npm', code: 'npm install sample' }]

describe('InstallTabs contract', () => {
  it('throws a ContractError when there are no tabs', async () => {
    await open(InstallTabs, {})
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('InstallTabs: requires at least one tab in `tabs`')
  })
  it('throws when a tab has no label or no code, once, naming the index', async () => {
    await open(InstallTabs, { tabs: [tabs[0], { label: ' ', code: 'x' }, { label: 'y', code: '' }] })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('InstallTabs: requires a non-empty `label` on every tab (tabs[1] has none)')
    await open(InstallTabs, { tabs: [{ label: 'npm', code: '' }] })
    expect(messages()[0]).toContain('non-empty `code` on every tab (tabs[0] has none)')
  })
  it('throws when the tab list name is emptied', async () => {
    await open(InstallTabs, { tabs, label: '' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('InstallTabs: requires a non-empty `label`')
  })
  it('does not complain about normal usage', async () => {
    await open(InstallTabs, { tabs })
    expect(errors).toEqual([])
    await open(InstallTabs, { tabs: [tabs[0]], label: 'Installationsbefehle', variant: 'minimal' })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(InstallTabs, {})
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('InstallTabs: requires at least one tab'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(InstallTabs, {})
    expect(spy).not.toHaveBeenCalled()
  })
})
