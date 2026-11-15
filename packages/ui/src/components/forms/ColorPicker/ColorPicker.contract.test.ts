import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Field from '../Field/Field.vue'
import ColorPicker from './ColorPicker.vue'

const { errors, mountTree } = useStrictHarness()

describe('ColorPicker contract', () => {
  it('the documented usage passes: the hex input and the swatch group have default names', async () => {
    await mountTree(() => h(ColorPicker, { modelValue: '#3b82f6' }))
    expect(errors).toEqual([])
    await mountTree(() => h(ColorPicker, { swatches: [] }))
    expect(errors).toEqual([])
  })
  it('a Field label names the hex input, also with a blank inputLabel', async () => {
    await mountTree(() => h(Field, { label: 'Brand colour' }, () => h(ColorPicker, { modelValue: '#14b8a6' })))
    expect(errors).toEqual([])
    await mountTree(() => h(Field, { label: 'Brand colour' }, () => h(ColorPicker, { inputLabel: '' })))
    expect(errors).toEqual([])
  })
  it('custom inputLabel and swatchesLabel pass', async () => {
    await mountTree(() => h(ColorPicker, { inputLabel: 'Couleur hexadécimale', swatchesLabel: 'Couleurs' }))
    expect(errors).toEqual([])
  })
  it('throws when the hex input has a blank name, saying how to fix it', async () => {
    await mountTree(() => h(ColorPicker, { inputLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('ColorPicker: needs an accessible name')
    expect(errors[0].message).toContain('inputLabel')
  })
  it('throws when the swatch group has a blank name', async () => {
    await mountTree(() => h(ColorPicker, { swatchesLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ColorPicker: needs an accessible name')
    expect(errors[0].message).toContain('swatchesLabel')
  })
  it('does not check parts that are not rendered', async () => {
    await mountTree(() => h(ColorPicker, { showInput: false, inputLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(ColorPicker, { swatches: [], swatchesLabel: '' }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(ColorPicker, { inputLabel: '' }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('ColorPicker: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(ColorPicker, { inputLabel: '' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('ColorPicker variations keep the contract', () => {
  const variations: [string, Record<string, unknown>][] = [
    ['circle shape', { shape: 'circle' }],
    ['compact layout', { layout: 'compact' }],
    ['inline layout, square shape, large size', { layout: 'inline', shape: 'square', size: 'lg' }],
  ]
  it.each(variations)('still throws for a blank hex input name with %s', async (_n, props) => {
    await mountTree(() => h(ColorPicker, { inputLabel: '', ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
  })
  it.each(variations)('still throws for a blank swatch group name with %s', async (_n, props) => {
    await mountTree(() => h(ColorPicker, { swatchesLabel: '', ...props }))
    expect(errors).toHaveLength(1)
  })
  it.each(variations)('is silent with the default names and %s', async (_n, props) => {
    await mountTree(() => h(ColorPicker, { modelValue: '#3b82f6', ...props }))
    expect(errors).toEqual([])
  })
})
