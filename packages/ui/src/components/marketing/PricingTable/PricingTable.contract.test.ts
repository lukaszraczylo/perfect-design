import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import PricingTable from './PricingTable.vue'

const { errors, open, messages } = useContractHarness()
const plans = [{ name: 'Plan A', price: 'Free' }, { name: 'Plan B', price: '$XX', yearlyPrice: '$YY' }]
const rows = [{ label: 'Projects', values: ['1', '10'] }]

describe('PricingTable contract', () => {
  it('throws a ContractError when the table has no name', async () => {
    await open(PricingTable, { plans, rows })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('PricingTable: requires `caption` or `aria-label` or `aria-labelledby`')
    await open(PricingTable, { plans, rows, caption: ' ' })
    expect(errors).toHaveLength(1)
  })
  it('accepts caption, aria-label and aria-labelledby, and names the table region', async () => {
    let w = await open(PricingTable, { plans, rows, caption: 'Plans' })
    expect(errors).toEqual([])
    expect(w.find('caption').text()).toBe('Plans')
    w = await open(PricingTable, { plans, rows, 'aria-label': 'Plan matrix' })
    expect(errors).toEqual([])
    expect(w.find('[data-slot="comparison-table"]').attributes('aria-label')).toBe('Plan matrix')
    expect(w.find('[data-slot="pricing-table"]').attributes('aria-label')).toBeUndefined()
    w = await open(PricingTable, { plans, rows, 'aria-labelledby': 'heading' })
    expect(errors).toEqual([])
    expect(w.find('[data-slot="comparison-table"]').attributes('aria-labelledby')).toBe('heading')
  })
  it('throws when a plan has no name', async () => {
    await open(PricingTable, { plans: [plans[0], { name: ' ', price: 'x' }], rows, caption: 'Plans' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('PricingTable: requires a non-empty `plans[1].name`')
  })
  it('throws for an unknown billing value and for a controlled billing without a listener', async () => {
    await open(PricingTable, { plans, rows, caption: 'Plans', billing: 'annual', 'onUpdate:billing': () => {} })
    expect(messages()[0]).toContain("PricingTable: requires `billing` to be 'monthly' or 'yearly'")
    await open(PricingTable, { plans, rows, caption: 'Plans', billing: 'yearly' })
    expect(messages()[0]).toContain('PricingTable: has a controlled `billing` but no `update:billing` listener')
    await open(PricingTable, { plans, rows, caption: 'Plans', billing: 'yearly', 'onUpdate:billing': () => {} })
    expect(errors).toEqual([])
  })
  it('throws when the visible toggle has an empty label', async () => {
    await open(PricingTable, { plans, rows, caption: 'Plans', billingLabel: '' })
    expect(messages()[0]).toContain('PricingTable: requires a non-empty `billingLabel`')
  })
  it('does not complain about normal usage', async () => {
    await open(PricingTable, { plans, rows, caption: 'Plan comparison', yearlyDiscountLabel: 'Save' })
    expect(errors).toEqual([])
  })
  it('keeps the old fallback name in the DOM even when the contract is off', async () => {
    configureStrictMode('off')
    const w = await open(PricingTable, { plans, rows })
    expect(w.find('caption').text()).toBe('Plan comparison')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(PricingTable, { plans, rows })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PricingTable: requires `caption`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(PricingTable, { plans, rows })
    expect(spy).not.toHaveBeenCalled()
  })
})
