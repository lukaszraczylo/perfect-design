import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import StatGrid from './StatGrid.vue'

const { errors, open, messages } = useContractHarness()
const items = [{ value: 170, label: 'Components' }, { value: '24/7', label: 'Support' }]

describe('StatGrid contract', () => {
  it('throws a ContractError for a non-finite number, once, naming the index (no duplicate from StatCounter)', async () => {
    await open(StatGrid, { items: [items[0], { value: Number.NaN, label: 'Broken' }, { value: Number.POSITIVE_INFINITY, label: 'Also broken' }] })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('StatGrid: requires a finite number or non-empty string `value` on every item (items[1] has none)')
  })
  it('throws for a blank string value and for a missing value', async () => {
    await open(StatGrid, { items: [{ value: ' ', label: 'Blank' }] })
    expect(messages()[0]).toContain('items[0]')
    await open(StatGrid, { items: [{ label: 'No value' }] })
    expect(messages()[0]).toContain('`value`')
  })
  it('throws for an empty label', async () => {
    await open(StatGrid, { items: [items[0], { value: 1, label: '  ' }] })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('StatGrid: requires a non-empty `label` on every item (items[1] has none)')
  })
  it('does not complain about normal usage: zero, negatives, strings, empty list', async () => {
    await open(StatGrid, { items: [...items, { value: 0, label: 'Zero' }, { value: -3, label: 'Negative', trend: 'down', change: '-3' }], variant: 'cards' })
    expect(errors).toEqual([])
    await open(StatGrid, {})
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(StatGrid, { items: [{ value: Number.NaN, label: 'Broken' }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('StatGrid: requires a finite number'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(StatGrid, { items: [{ value: Number.NaN, label: 'Broken' }] })
    expect(spy).not.toHaveBeenCalled()
  })
})
