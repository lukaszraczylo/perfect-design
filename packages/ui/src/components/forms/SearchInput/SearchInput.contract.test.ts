import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import SearchInput from './SearchInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('SearchInput contract', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => h(SearchInput, { placeholder: 'Search' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('SearchInput: needs an accessible name')
    expect(errors[0].message).toContain('aria-label')
  })
  it.each([
    ['aria-label', () => h(SearchInput, { 'aria-label': 'Search' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Search'), h(SearchInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Find a customer' }, () => h(SearchInput))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Find', default: () => h(SearchInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Find'), default: () => h(SearchInput) })],
    ['a Label for the id', () => [h(Label, { for: 'q' }, () => 'Find'), h(SearchInput, { id: 'q' })]],
    ['a wrapping label', () => h('label', null, ['Find', h(SearchInput)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('the documented landmark usage passes', async () => {
    await mountTree(() => h(SearchInput, { landmark: true, landmarkLabel: 'Search the docs', 'aria-label': 'Search the docs' }))
    expect(errors).toEqual([])
  })
  it('throws on a blank clearLabel', async () => {
    await mountTree(() => h(SearchInput, { 'aria-label': 'Search', clearLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SearchInput: requires a non-empty `clearLabel`')
  })
  it('throws on a blank landmarkLabel only with landmark', async () => {
    await mountTree(() => h(SearchInput, { 'aria-label': 'Search', landmarkLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(SearchInput, { 'aria-label': 'Search', landmark: true, landmarkLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SearchInput: requires a non-empty `landmarkLabel`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(SearchInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('SearchInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(SearchInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
