import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import DateRangePicker from './DateRangePicker.vue'

const { errors, mountTree } = useStrictHarness()
const range = { start: new Date(2024, 4, 1), end: new Date(2024, 4, 7) }

describe('DateRangePicker contract', () => {
  it('throws when nothing names the trigger (its text is only the value), saying how to fix it', async () => {
    await mountTree(() => h(DateRangePicker, { modelValue: range }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('DateRangePicker: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it('throws for an aria-labelledby that points at nothing or only at the trigger and its value', async () => {
    await mountTree(() => h(DateRangePicker, { 'aria-labelledby': 'missing' }))
    expect(errors).toHaveLength(1)
    await mountTree(() => h(DateRangePicker, { id: 'self', 'aria-labelledby': 'self' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => h(DateRangePicker, { 'aria-label': 'Stay' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Stay'), h(DateRangePicker, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Stay', required: true }, () => h(DateRangePicker, { clearable: true, modelValue: range }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Stay', default: () => h(DateRangePicker) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Stay'), default: () => h(DateRangePicker) })],
    ['a Label for the id', () => [h(Label, { for: 'd' }, () => 'Stay'), h(DateRangePicker, { id: 'd' })]],
    ['a wrapping label', () => h('label', null, ['Stay', h(DateRangePicker)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws on a blank dialogLabel, and on a blank clearLabel only with clearable', async () => {
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', dialogLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DateRangePicker: requires a non-empty `dialogLabel`')
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', clearLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', clearable: true, clearLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('DateRangePicker: requires a non-empty `clearLabel`')
  })
  it('the open dropdown with its Calendar adds no violation', async () => {
    await mountTree(() => h(DateRangePicker, { 'aria-label': 'Range', open: true, modelValue: range }))
    expect(document.body.querySelector('[data-slot=date-range-picker-content]')).not.toBeNull()
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(DateRangePicker))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('DateRangePicker: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(DateRangePicker))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
