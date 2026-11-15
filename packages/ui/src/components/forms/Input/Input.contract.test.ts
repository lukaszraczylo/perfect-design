import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import Input from './Input.vue'

const { errors, mountTree } = useStrictHarness()

describe('Input contract', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => h(Input, { placeholder: 'Your name' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Input: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it('a placeholder is not a name', async () => {
    await mountTree(() => h(Input, { placeholder: 'Search', 'aria-label': ' ' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => h(Input, { 'aria-label': 'Name' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Name'), h(Input, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Name' }, () => h(Input))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Name', default: () => h(Input) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Name'), default: () => h(Input) })],
    ['a Label for the id', () => [h(Label, { for: 'i' }, () => 'Name'), h(Input, { id: 'i' })]],
    ['a wrapping label', () => h('label', null, ['Name', h(Input)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('does not need a name when it is hidden', async () => {
    await mountTree(() => h(Input, { type: 'hidden' }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Input))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Input: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Input))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
