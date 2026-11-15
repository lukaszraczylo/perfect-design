import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import StatCounter from './StatCounter.vue'

const { errors, open, messages } = useContractHarness()

describe('StatCounter contract', () => {
  it('throws a ContractError when the value is not a finite number', async () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, undefined, '12']) {
      await open(StatCounter, { value })
      expect(errors).toHaveLength(1)
      expect(errors[0].name).toBe('ContractError')
      expect(messages()[0]).toContain('StatCounter: requires a finite number `value`')
    }
  })
  it('accepts a non-finite value when an explicit fallback text is chosen', async () => {
    const w = await open(StatCounter, { value: Number.NaN, fallback: 'not reported' })
    expect(errors).toEqual([])
    expect(w.text()).toBe('not reported')
  })
  it('does not complain about normal usage, including zero and negatives', async () => {
    for (const value of [0, -5, 1234.5]) {
      await open(StatCounter, { value, decimals: 1, prefix: '$' })
      expect(errors).toEqual([])
    }
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(StatCounter, { value: Number.NaN })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('StatCounter: requires a finite number'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(StatCounter, { value: Number.NaN })
    expect(spy).not.toHaveBeenCalled()
  })
})
