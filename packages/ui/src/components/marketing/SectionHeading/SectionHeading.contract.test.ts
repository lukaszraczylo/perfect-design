import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import SectionHeading from './SectionHeading.vue'

const { errors, open, messages } = useContractHarness()

describe('SectionHeading contract', () => {
  it('throws a ContractError when there is no title', async () => {
    await open(SectionHeading, { description: 'Only a description' })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('SectionHeading: requires a non-empty `title`')
    await open(SectionHeading, { title: '   ' })
    expect(errors).toHaveLength(1)
  })
  it('is satisfied by the title prop or the title slot', async () => {
    await open(SectionHeading, { title: 'A claim about the section' })
    expect(errors).toEqual([])
    await open(SectionHeading, {}, { title: () => h('em', 'Slot title') })
    expect(errors).toEqual([])
  })
  it('does not complain about a realistic heading', async () => {
    await open(SectionHeading, { eyebrow: 'Data', title: 'Tables', description: 'Sub', align: 'center', size: 'lg', level: 3 }, { actions: () => h('button', 'More') })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(SectionHeading, {})
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('SectionHeading: requires a non-empty'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(SectionHeading, {})
    expect(spy).not.toHaveBeenCalled()
  })
})
