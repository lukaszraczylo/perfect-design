import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import DatePicker from './DatePicker.vue'

const { errors, mountTree } = useStrictHarness()
const date = new Date(2024, 4, 1)

describe('DatePicker contract', () => {
  it('throws when nothing names the trigger (its text is only the value), saying how to fix it', async () => {
    await mountTree(() => h(DatePicker, { modelValue: date }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('DatePicker: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it('throws for an aria-labelledby that points at nothing or only at the trigger and its value', async () => {
    await mountTree(() => h(DatePicker, { 'aria-labelledby': 'missing' }))
    expect(errors).toHaveLength(1)
    await mountTree(() => h(DatePicker, { id: 'self', 'aria-labelledby': 'self' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => h(DatePicker, { 'aria-label': 'Due date' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Due date'), h(DatePicker, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Due date', required: true }, () => h(DatePicker, { clearable: true, modelValue: date }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Due date', default: () => h(DatePicker) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Due date'), default: () => h(DatePicker) })],
    ['a Label for the id', () => [h(Label, { for: 'd' }, () => 'Due date'), h(DatePicker, { id: 'd' })]],
    ['a wrapping label', () => h('label', null, ['Due date', h(DatePicker)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws on a blank dialogLabel, and on a blank clearLabel only with clearable', async () => {
    await mountTree(() => h(DatePicker, { 'aria-label': 'Date', dialogLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DatePicker: requires a non-empty `dialogLabel`')
    await mountTree(() => h(DatePicker, { 'aria-label': 'Date', clearLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(DatePicker, { 'aria-label': 'Date', clearable: true, clearLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DatePicker: requires a non-empty `clearLabel`')
  })
  it('the open dropdown with its Calendar adds no violation', async () => {
    await mountTree(() => h(DatePicker, { 'aria-label': 'Date', open: true, modelValue: date }))
    expect(document.body.querySelector('[data-slot=date-picker-content]')).not.toBeNull()
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(DatePicker))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('DatePicker: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(DatePicker))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
