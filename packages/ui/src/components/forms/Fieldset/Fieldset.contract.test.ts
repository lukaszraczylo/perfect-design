import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Fieldset from './Fieldset.vue'

const { errors, mountTree } = useStrictHarness()

describe('Fieldset contract', () => {
  it('throws without a legend, aria-label or aria-labelledby', async () => {
    await mountTree(() => h(Fieldset, null, () => h('p', 'Body')))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Fieldset: requires a `legend`')
    expect(errors[0].message).toContain('Add `legend="..."`')
  })
  it('a description alone does not name the group', async () => {
    await mountTree(() => h(Fieldset, { description: 'Help' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['a legend prop', () => h(Fieldset, { legend: 'Contact' })],
    ['a legend slot', () => h(Fieldset, null, { legend: () => 'Contact' })],
    ['aria-label', () => h(Fieldset, { 'aria-label': 'Contact' })],
    ['aria-labelledby', () => h(Fieldset, { 'aria-labelledby': 'x' })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Fieldset))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Fieldset: requires a `legend`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Fieldset))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
