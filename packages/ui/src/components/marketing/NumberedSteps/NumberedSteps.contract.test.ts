import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import NumberedSteps from './NumberedSteps.vue'

const { errors, open, messages } = useContractHarness()
const steps = [{ title: 'Install' }, { title: 'Import', description: 'Sample' }]

describe('NumberedSteps contract', () => {
  it('throws a ContractError when a step has no title, once, naming the index', async () => {
    await open(NumberedSteps, { steps: [steps[0], { title: ' ' }, { title: '' }] })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('NumberedSteps: requires a non-empty `title` on every step (steps[1] has none)')
    await open(NumberedSteps, { steps: [{ description: 'no title' }] })
    expect(errors).toHaveLength(1)
  })
  it('accepts untitled steps when the step slot renders them', async () => {
    await open(NumberedSteps, { steps: [{ title: '' }] }, { step: () => h('p', 'Custom step') })
    expect(errors).toEqual([])
  })
  it('does not complain about normal usage or an empty list', async () => {
    await open(NumberedSteps, { steps, variant: 'timeline', pad: true })
    expect(errors).toEqual([])
    await open(NumberedSteps, {})
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(NumberedSteps, { steps: [{ title: '' }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('NumberedSteps: requires a non-empty'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(NumberedSteps, { steps: [{ title: '' }] })
    expect(spy).not.toHaveBeenCalled()
  })
})
