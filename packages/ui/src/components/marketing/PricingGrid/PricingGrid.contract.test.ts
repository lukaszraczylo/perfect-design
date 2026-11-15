import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import PricingCard from '../PricingCard/PricingCard.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import PricingGrid from './PricingGrid.vue'

const { errors, open, messages } = useContractHarness()
const free = { name: 'Plan A', price: 'Free' }
const paid = { name: 'Plan B', price: '$XX', yearlyPrice: '$YY' }

describe('PricingGrid contract', () => {
  it('throws a ContractError when there are no plans and no slot content', async () => {
    await open(PricingGrid, {})
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('PricingGrid: requires at least one entry in `plans`')
  })
  it('accepts plans or cards in the default slot', async () => {
    await open(PricingGrid, { plans: [free] })
    expect(errors).toEqual([])
    await open(PricingGrid, {}, { default: () => h(PricingCard, { name: 'Plan', price: '$XX' }) })
    expect(errors).toEqual([])
  })
  it('throws when billing or defaultBilling is not monthly or yearly', async () => {
    await open(PricingGrid, { plans: [paid], billing: 'annual', 'onUpdate:billing': () => {} })
    expect(messages()[0]).toContain("PricingGrid: requires `billing` to be 'monthly' or 'yearly' (got \"annual\")")
    await open(PricingGrid, { plans: [paid], defaultBilling: 'weekly' })
    expect(messages()[0]).toContain('`defaultBilling`')
  })
  it('throws when billing is controlled but nothing listens to update:billing', async () => {
    await open(PricingGrid, { plans: [paid], billing: 'yearly' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('PricingGrid: has a controlled `billing` but no `update:billing` listener')
    expect(messages()[0]).toContain('v-model:billing')
  })
  it('accepts v-model:billing, uncontrolled use and a controlled billing without a toggle', async () => {
    await open(PricingGrid, { plans: [paid], billing: 'yearly', 'onUpdate:billing': () => {} })
    expect(errors).toEqual([])
    await open(PricingGrid, { plans: [paid], defaultBilling: 'yearly' })
    expect(errors).toEqual([])
    await open(PricingGrid, { plans: [free], billing: 'yearly' })
    expect(errors).toEqual([])
  })
  it('throws when the visible toggle has an empty label', async () => {
    await open(PricingGrid, { plans: [paid], billingLabel: '' })
    expect(messages()[0]).toContain('PricingGrid: requires a non-empty `billingLabel`')
    await open(PricingGrid, { plans: [paid], yearlyLabel: ' ' })
    expect(messages()[0]).toContain('`yearlyLabel`')
    await open(PricingGrid, { plans: [paid], monthlyLabel: '' })
    expect(messages()[0]).toContain('`monthlyLabel`')
    await open(PricingGrid, { plans: [free], billingLabel: '' })
    expect(errors).toEqual([])
  })
  it('does not complain about a normal grid', async () => {
    await open(PricingGrid, { plans: [free, paid], yearlyDiscountLabel: 'Save' })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(PricingGrid, {})
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PricingGrid: requires at least one'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(PricingGrid, {})
    expect(spy).not.toHaveBeenCalled()
  })
})
