import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Editable from './Editable.vue'

const { errors, mountTree } = useStrictHarness()

describe('Editable contract', () => {
  it('throws when nothing names the control (the preview text alone does not), saying how to fix it', async () => {
    await mountTree(() => h(Editable, { modelValue: 'Quarterly report', placeholder: 'Untitled' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Editable: needs an accessible name')
    expect(errors[0].message).toContain('ariaLabel')
  })
  it('a blank ariaLabel is not a name', async () => {
    await mountTree(() => h(Editable, { ariaLabel: '  ' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['ariaLabel', () => h(Editable, { ariaLabel: 'Title', modelValue: 'Quarterly report' })],
    ['an aria-label attribute', () => h(Editable, { 'aria-label': 'Title' })],
    ['a Field label prop', () => h(Field, { label: 'Title' }, () => h(Editable, { modelValue: 'Quarterly report' }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Title', default: () => h(Editable) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Title'), default: () => h(Editable) })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('multiline, disabled and readonly variants need the same name, nothing more', async () => {
    await mountTree(() => [
      h(Editable, { multiline: true, rows: 4, ariaLabel: 'Note' }),
      h(Editable, { disabled: true, modelValue: 'Locked', ariaLabel: 'Disabled' }),
      h(Editable, { readonly: true, modelValue: 'Locked', ariaLabel: 'Read only' }),
    ])
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Editable))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Editable: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Editable))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
