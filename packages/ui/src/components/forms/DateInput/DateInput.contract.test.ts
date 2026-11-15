import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import DateInput from './DateInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('DateInput contract', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => h(DateInput, { modelValue: '2024-05-01' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('DateInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(DateInput, { 'aria-label': 'Meeting date' })],
    ['aria-label on a time input', () => h(DateInput, { type: 'time', 'aria-label': 'Meeting time' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Date'), h(DateInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Due date' }, () => h(DateInput, { min: '2024-01-01', max: '2024-12-31' }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Due date', default: () => h(DateInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Due date'), default: () => h(DateInput) })],
    ['a Label for the id', () => [h(Label, { for: 'd' }, () => 'Due date'), h(DateInput, { id: 'd' })]],
    ['a wrapping label', () => h('label', null, ['Due date', h(DateInput)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(DateInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('DateInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(DateInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
