import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import NumberInput from './NumberInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('NumberInput contract', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => h(NumberInput, { placeholder: '0' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('NumberInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(NumberInput, { 'aria-label': 'Quantity' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Quantity'), h(NumberInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Quantity' }, () => h(NumberInput))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Quantity', default: () => h(NumberInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Quantity'), default: () => h(NumberInput) })],
    ['a Label for the id', () => [h(Label, { for: 'q' }, () => 'Quantity'), h(NumberInput, { id: 'q' })]],
    // With steppers the first labelable descendant of a wrapping label is the stepper button, so it only names a stepper-less input.
    ['a wrapping label without steppers', () => h('label', null, ['Quantity', h(NumberInput, { showSteppers: false })])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws when a stepper has a blank name', async () => {
    await mountTree(() => h(NumberInput, { 'aria-label': 'Quantity', decrementLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('NumberInput: needs an accessible name')
    expect(errors[0].message).toContain('decrementLabel')
    await mountTree(() => h(NumberInput, { 'aria-label': 'Quantity', incrementLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('incrementLabel')
  })
  it('does not check the steppers when they are hidden, and accepts custom stepper labels', async () => {
    await mountTree(() => h(NumberInput, { 'aria-label': 'Quantity', showSteppers: false, decrementLabel: '', incrementLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(NumberInput, { 'aria-label': 'Guests', decrementLabel: 'Fewer guests', incrementLabel: 'More guests' }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(NumberInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('NumberInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(NumberInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
