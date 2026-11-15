import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import TimeInput from './TimeInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('TimeInput contract', () => {
  it('throws when nothing names the group (the named segments do not count), saying how to fix it', async () => {
    await mountTree(() => h(TimeInput, { modelValue: '09:30' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('TimeInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(TimeInput, { 'aria-label': 'Start time' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Start time'), h(TimeInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Start time' }, () => h(TimeInput, { hour12: true }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Start time', default: () => h(TimeInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Start time'), default: () => h(TimeInput) })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws on a blank segment label, the AM/PM one only in 12 hour mode', async () => {
    await mountTree(() => h(TimeInput, { 'aria-label': 'Time', hourLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeInput: requires a non-empty `hourLabel`')
    await mountTree(() => h(TimeInput, { 'aria-label': 'Time', minuteLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeInput: requires a non-empty `minuteLabel`')
    await mountTree(() => h(TimeInput, { 'aria-label': 'Time', periodLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(TimeInput, { 'aria-label': 'Time', hour12: true, periodLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeInput: requires a non-empty `periodLabel`')
  })
  it('custom segment labels pass', async () => {
    await mountTree(() => h(TimeInput, { 'aria-label': 'Heure', hour12: true, hourLabel: 'Heures', minuteLabel: 'Minutes', periodLabel: 'Matin ou après-midi' }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(TimeInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TimeInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(TimeInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
