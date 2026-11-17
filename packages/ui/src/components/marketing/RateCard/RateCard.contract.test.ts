import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import RateCard from './RateCard.vue'

const { errors, open, messages } = useContractHarness()
const items = [{ name: 'Sample requests', unit: 'per 1,000 requests', rate: 0.4 }]

describe('RateCard contract', () => {
  it('throws a ContractError when nothing names the rate list', async () => {
    await open(RateCard, { items })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('RateCard: requires `caption` or `aria-label` or `aria-labelledby`')
    expect(messages()[0]).toContain('caption=')
  })
  it('rejects a blank caption', async () => {
    await open(RateCard, { items, caption: '  ' })
    expect(errors).toHaveLength(1)
  })
  it.each([{ caption: 'Sample rates' }, { 'aria-label': 'Sample rates' }, { 'aria-labelledby': 'heading' }])('accepts %j', async (name) => {
    for (const variant of ['table', 'list']) {
      await open(RateCard, { items, variant, ...name })
      expect(errors).toEqual([])
    }
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(RateCard, { items })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('RateCard: requires'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(RateCard, { items })
    expect(spy).not.toHaveBeenCalled()
  })
})
