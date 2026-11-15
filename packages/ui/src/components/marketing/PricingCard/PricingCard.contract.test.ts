import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import PricingCard from './PricingCard.vue'

const { errors, open, messages } = useContractHarness()

describe('PricingCard contract', () => {
  it('throws a ContractError when the name is missing, naming the fix', async () => {
    await open(PricingCard, { price: '$XX' })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('PricingCard: requires a non-empty `name`')
    expect(messages()[0]).toContain('`name` slot')
  })
  it('rejects a blank name and accepts the name slot', async () => {
    await open(PricingCard, { name: '   ', price: '$XX' })
    expect(errors).toHaveLength(1)
    await open(PricingCard, { price: '$XX' }, { name: () => h('em', 'Custom name') })
    expect(errors).toEqual([])
  })
  it('throws when the price is missing, empty or NaN', async () => {
    for (const price of [undefined, '', Number.NaN]) {
      await open(PricingCard, { name: 'Plan', price })
      expect(messages()[0]).toContain('PricingCard: requires a `price`')
    }
  })
  it('accepts text prices, zero and the price slot', async () => {
    for (const price of ['Free', 'Custom', 0, 49]) {
      await open(PricingCard, { name: 'Plan', price })
      expect(errors).toEqual([])
    }
    await open(PricingCard, { name: 'Plan' }, { price: () => h('span', '$XX') })
    expect(errors).toEqual([])
  })
  it('does not complain about a normal plan', async () => {
    await open(PricingCard, { name: 'Plan', price: '$XX', period: '/mo', features: ['One'] }, { cta: () => h('button', 'Choose') })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(PricingCard, {})
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PricingCard: requires'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(PricingCard, {})
    expect(spy).not.toHaveBeenCalled()
  })
})
