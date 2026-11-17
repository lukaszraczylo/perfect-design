import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import TieredPricing from './TieredPricing.vue'

const { errors, open, messages } = useContractHarness()
const tiers = [{ upTo: null, rate: 1 }]

describe('TieredPricing contract', () => {
  it('throws a ContractError when nothing names the tiers', async () => {
    await open(TieredPricing, { tiers })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('TieredPricing: requires `caption` or `aria-label` or `aria-labelledby`')
    expect(messages()[0]).toContain('caption=')
  })
  it('rejects a blank caption', async () => {
    await open(TieredPricing, { tiers, caption: '   ' })
    expect(errors).toHaveLength(1)
  })
  it.each([{ caption: 'Sample tiers' }, { 'aria-label': 'Sample tiers' }, { 'aria-labelledby': 'heading' }])('accepts %j', async (name) => {
    await open(TieredPricing, { tiers, ...name })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(TieredPricing, { tiers })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TieredPricing: requires'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(TieredPricing, { tiers })
    expect(spy).not.toHaveBeenCalled()
  })
})
