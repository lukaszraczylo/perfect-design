import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import TagsInput from './TagsInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('TagsInput contract', () => {
  it('throws when nothing names the text input, saying how to fix it', async () => {
    await mountTree(() => h(TagsInput, { placeholder: 'Add a skill', modelValue: ['vue'] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('TagsInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['ariaLabel', () => h(TagsInput, { ariaLabel: 'Skills' })],
    ['an aria-label attribute', () => h(TagsInput, { 'aria-label': 'Skills' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Skills'), h(TagsInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Skills' }, () => h(TagsInput, { modelValue: ['vue'] }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Skills', default: () => h(TagsInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Skills'), default: () => h(TagsInput) })],
    ['a Label for the id', () => [h(Label, { for: 't' }, () => 'Skills'), h(TagsInput, { id: 't' })]],
    ['a wrapping label', () => h('label', null, ['Skills', h(TagsInput)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('tags with their remove buttons need nothing beyond the input name', async () => {
    await mountTree(() => h(TagsInput, { ariaLabel: 'Skills', modelValue: ['vue', 'typescript'], max: 3 }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(TagsInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TagsInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(TagsInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
