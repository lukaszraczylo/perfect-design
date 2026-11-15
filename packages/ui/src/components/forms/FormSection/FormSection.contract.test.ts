import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import FormSection from './FormSection.vue'

const { errors, mountTree } = useStrictHarness()

describe('FormSection contract', () => {
  it('throws without a title, aria-label or aria-labelledby', async () => {
    await mountTree(() => h(FormSection, { description: 'Only a description' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('FormSection: requires a `title`')
    expect(errors[0].message).toContain('Add `title="..."`')
  })
  it.each([
    ['a title prop', () => h(FormSection, { title: 'Profile' })],
    ['a title slot', () => h(FormSection, null, { title: () => 'Profile' })],
    ['aria-label', () => h(FormSection, { 'aria-label': 'Profile' })],
    ['aria-labelledby', () => h(FormSection, { 'aria-labelledby': 'x' })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(FormSection))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('FormSection: requires a `title`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(FormSection))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
