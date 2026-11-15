import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import CtaBand from './CtaBand.vue'

const { errors, open, messages } = useContractHarness()

describe('CtaBand contract', () => {
  it('throws a ContractError when the band has no heading', async () => {
    await open(CtaBand, { subtext: 'Only supporting text' }, { actions: () => h('button', 'Go') })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('CtaBand: requires a `headline`')
    await open(CtaBand, { headline: ' ' })
    expect(errors).toHaveLength(1)
  })
  it('is satisfied by headline, the headline slot, a heading in another slot or an aria-label', async () => {
    await open(CtaBand, { headline: 'Open the catalogue' })
    expect(errors).toEqual([])
    await open(CtaBand, {}, { headline: () => 'Slot headline' })
    expect(errors).toEqual([])
    await open(CtaBand, {}, { actions: () => h('h3', 'Own heading') })
    expect(errors).toEqual([])
    await open(CtaBand, { 'aria-label': 'Next step' })
    expect(errors).toEqual([])
    await open(CtaBand, { 'aria-labelledby': 'elsewhere' })
    expect(errors).toEqual([])
  })
  it('does not complain about a realistic band', async () => {
    await open(CtaBand, { variant: 'split', headline: 'Open the catalogue', subtext: 'Sub', tone: 'muted' }, { actions: () => h('button', 'Open') })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(CtaBand, {})
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('CtaBand: requires a `headline`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(CtaBand, {})
    expect(spy).not.toHaveBeenCalled()
  })
})
