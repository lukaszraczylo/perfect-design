import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Slider from './Slider.vue'

const { errors, mountTree } = useStrictHarness()

describe('Slider accessible name', () => {
  it('throws when no thumb is named, saying how to fix it', async () => {
    await mountTree(() => h(Slider, { modelValue: [40] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Slider: needs an accessible name on every thumb')
    expect(errors[0].message).toContain('aria-label')
    expect(errors[0].message).toContain('thumb-labels')
  })
  it('throws when one thumb of a range is unnamed', async () => {
    await mountTree(() => h(Slider, { modelValue: [20, 80], thumbLabels: ['Minimum price'] }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => h(Slider, { modelValue: [40], 'aria-label': 'Volume' })],
    ['aria-label on a range', () => h(Slider, { modelValue: [20, 80], 'aria-label': 'Price' })],
    ['thumb-labels', () => h(Slider, { modelValue: [20, 80], thumbLabels: ['Minimum price', 'Maximum price'] })],
    ['a Field label prop', () => h(Field, { label: 'Volume' }, () => h(Slider, { modelValue: [40] }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Volume', default: () => h(Slider, { modelValue: [40] }) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Volume'), default: () => h(Slider, { modelValue: [40] }) })],
    ['a Field label on a range', () => h(Field, { label: 'Price' }, () => h(Slider, { modelValue: [20, 80] }))],
    ['an uncontrolled default', () => h(Slider, { defaultValue: [10], 'aria-label': 'Volume' })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('Slider value shape', () => {
  const named = { 'aria-label': 'Volume' }
  it('throws when v-model is a plain number, saying what to pass', async () => {
    await mountTree(() => h(Slider, { ...named, modelValue: 40 as never }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Slider: requires `modelValue` to be an array of numbers')
    expect(errors[0].message).toContain('ref([40])')
  })
  it('throws when the array holds something else', async () => {
    await mountTree(() => h(Slider, { ...named, modelValue: ['40'] as never }))
    expect(errors).toHaveLength(1)
  })
  it('throws when defaultValue is a plain number', async () => {
    await mountTree(() => h(Slider, { ...named, defaultValue: 10 as never }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires `defaultValue` to be an array of numbers')
  })
  it('falls back to a single thumb at min instead of crashing the render', async () => {
    const w = await mountTree(() => h(Slider, { ...named, modelValue: 40 as never, min: 5 }))
    expect(w.findAll('[role=slider]')).toHaveLength(1)
    expect(w.find('[role=slider]').attributes('aria-valuenow')).toBe('5')
  })
  it('accepts null, undefined and number arrays', async () => {
    await mountTree(() => h(Slider, { ...named, modelValue: null }))
    expect(errors).toEqual([])
    await mountTree(() => h(Slider, { ...named }))
    expect(errors).toEqual([])
    await mountTree(() => h(Slider, { ...named, modelValue: [20, 80] }))
    expect(errors).toEqual([])
  })
})

describe('Slider modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Slider, { modelValue: 40 as never }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Slider: requires `modelValue` to be an array of numbers'))).toBe(true)
    spy.mockClear()
    await mountTree(() => h(Slider, { modelValue: [40] }))
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Slider: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Slider, { modelValue: 40 as never }))
    await mountTree(() => h(Slider, { modelValue: [40] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('Slider variations keep the contract', () => {
  const variations: [string, Record<string, unknown>][] = [
    ['tone and size', { tone: 'success', size: 'lg' }],
    ['marks with labels', { marks: [{ value: 0, label: 'Low' }, { value: 100, label: 'High' }] }],
    ['showValue vertical', { showValue: true, orientation: 'vertical' }],
  ]
  it.each(variations)('still throws for an unnamed thumb with %s', async (_n, props) => {
    await mountTree(() => h(Slider, { modelValue: [40], ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Slider: needs an accessible name on every thumb')
  })
  it.each(variations)('still throws for a plain number model with %s', async (_n, props) => {
    await mountTree(() => h(Slider, { 'aria-label': 'Volume', modelValue: 40 as never, ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires `modelValue` to be an array of numbers')
  })
  it.each(variations)('is silent for a named slider with %s', async (_n, props) => {
    await mountTree(() => h(Slider, { 'aria-label': 'Volume', modelValue: [40], ...props }))
    expect(errors).toEqual([])
  })
})
