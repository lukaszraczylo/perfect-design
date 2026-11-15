import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import Combobox from './Combobox.vue'

const { errors, mountTree } = useStrictHarness()
const options = [
  { value: 'pl', label: 'Poland' },
  { value: 'de', label: 'Germany' },
]
const combobox = (props: Record<string, unknown> = {}) => h(Combobox, { options, ...props })

describe('Combobox accessible name', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => combobox({ placeholder: 'Country' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Combobox: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => combobox({ 'aria-label': 'Country' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Country'), combobox({ 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Country' }, () => combobox())],
    ['a Field label slot', () => h(Field, null, { label: () => 'Country', default: () => combobox() })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Country'), default: () => combobox() })],
    ['a Label for the id', () => [h(Label, { for: 'c' }, () => 'Country'), combobox({ id: 'c' })]],
    ['a wrapping label', () => h('label', null, ['Country', combobox()])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('Combobox option values', () => {
  const named = { 'aria-label': 'Country' }
  it('throws for an empty value, saying what it is reserved for', async () => {
    await mountTree(() => combobox({ ...named, options: [{ value: '', label: 'None' }, ...options] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Combobox: requires a non-empty string `value` on every option')
    expect(errors[0].message).toContain('nothing selected')
  })
  it('throws for a missing value', async () => {
    await mountTree(() => combobox({ ...named, options: [{ label: 'No value' }] }))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('requires a non-empty string `value`')])
  })
  it('throws for a duplicate value, naming it', async () => {
    await mountTree(() => combobox({ ...named, options: [...options, { value: 'pl', label: 'Again' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Combobox: requires a unique `value` on every option, but "pl" is used more than once')
  })
  it('accepts unique non-empty values and an empty list', async () => {
    await mountTree(() => combobox(named))
    expect(errors).toEqual([])
    await mountTree(() => combobox({ ...named, options: [] }))
    expect(errors).toEqual([])
  })
})

describe('Combobox modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => combobox({ options: [{ value: '', label: 'None' }] }))
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('Combobox: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('Combobox: requires a non-empty string `value`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => combobox({ options: [{ value: '', label: 'None' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
