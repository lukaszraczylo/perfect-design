import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import PromptInput from './PromptInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('PromptInput contract', () => {
  it('throws when nothing names the field, saying how to fix it', async () => {
    await mountTree(() => h(PromptInput, { placeholder: 'Write a message' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('PromptInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(PromptInput, { 'aria-label': 'Message' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Message'), h(PromptInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Message' }, () => h(PromptInput))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Message', default: () => h(PromptInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Message'), default: () => h(PromptInput) })],
    ['a Label for the id', () => [h(Label, { for: 'i' }, () => 'Message'), h(PromptInput, { id: 'i' })]],
    ['a wrapping label', () => h('label', null, ['Message', h(PromptInput)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('a placeholder is not a name', async () => {
    await mountTree(() => h(PromptInput, { placeholder: 'Search', 'aria-label': ' ' }))
    expect(errors).toHaveLength(1)
  })
  it('does not complain about the Send and Stop buttons (they are named)', async () => {
    await mountTree(() => h(PromptInput, { 'aria-label': 'Message', loading: true }))
    expect(errors).toEqual([])
    await mountTree(() => h(PromptInput, { 'aria-label': 'Message', maxLength: 10, modelValue: 'x'.repeat(20) }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(PromptInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PromptInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(PromptInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
