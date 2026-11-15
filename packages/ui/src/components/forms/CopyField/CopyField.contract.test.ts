import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import CopyField from './CopyField.vue'

const { errors, mountTree } = useStrictHarness()

describe('CopyField contract', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => h(CopyField, { value: 'sample-api-key-0000' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('CopyField: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(CopyField, { value: 'k', 'aria-label': 'Sample API key' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'API key'), h(CopyField, { value: 'k', 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Secret token' }, () => h(CopyField, { value: 'k', mask: true, iconOnly: true, label: 'Copy token' }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Secret token', default: () => h(CopyField, { value: 'k' }) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Secret token'), default: () => h(CopyField, { value: 'k' }) })],
    ['a Label for the id', () => [h(Label, { for: 'c' }, () => 'API key'), h(CopyField, { value: 'k', id: 'c' })]],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws when the copy button has no text', async () => {
    await mountTree(() => h(CopyField, { value: 'k', 'aria-label': 'Key', label: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CopyField: needs an accessible name')
    expect(errors[0].message).toContain('`label`')
  })
  it('an icon-only button keeps its label as hidden text and passes', async () => {
    await mountTree(() => h(CopyField, { value: 'k', 'aria-label': 'Key', iconOnly: true, label: 'Copy key' }))
    expect(errors).toEqual([])
    expect(document.body.querySelector('[data-slot=copy-field-button] .sr-only')?.textContent).toBe('Copy key')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(CopyField, { value: 'k' }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('CopyField: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(CopyField, { value: 'k' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
