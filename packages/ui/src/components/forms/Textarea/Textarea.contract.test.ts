import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import Textarea from './Textarea.vue'

const { errors, mountTree } = useStrictHarness()

describe('Textarea contract', () => {
  it('throws when nothing names the control, saying how to fix it', async () => {
    await mountTree(() => h(Textarea, { placeholder: 'Notes' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Textarea: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(Textarea, { 'aria-label': 'Notes' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Notes'), h(Textarea, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Notes' }, () => h(Textarea))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Notes', default: () => h(Textarea) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Notes'), default: () => h(Textarea) })],
    ['a Label for the id', () => [h(Label, { for: 'i' }, () => 'Notes'), h(Textarea, { id: 'i' })]],
    ['a wrapping label', () => h('label', null, ['Notes', h(Textarea)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('a placeholder is not a name', async () => {
    await mountTree(() => h(Textarea, { placeholder: 'Search', 'aria-label': ' ' }))
    expect(errors).toHaveLength(1)
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Textarea, { placeholder: 'Notes' }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Textarea: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Textarea, { placeholder: 'Notes' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
