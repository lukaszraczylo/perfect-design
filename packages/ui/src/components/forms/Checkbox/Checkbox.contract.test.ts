import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import Checkbox from './Checkbox.vue'

const { errors, mountTree } = useStrictHarness()

describe('Checkbox contract', () => {
  it('throws when nothing names the checkbox, saying how to fix it', async () => {
    await mountTree(() => h(Checkbox))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Checkbox: needs an accessible name')
    expect(errors[0].message).toContain('label')
    expect(errors[0].message).toContain('aria-label')
  })
  it.each([
    ['the label prop', () => h(Checkbox, { label: 'Accept' })],
    ['the label slot', () => h(Checkbox, null, { label: () => 'Accept' })],
    ['aria-label', () => h(Checkbox, { 'aria-label': 'Accept' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Accept'), h(Checkbox, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Accept', orientation: 'horizontal' }, () => h(Checkbox))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Accept', default: () => h(Checkbox) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Accept'), default: () => h(Checkbox) })],
    ['a Label for the id', () => [h(Label, { for: 'c' }, () => 'Accept'), h(Checkbox, { id: 'c' })]],
    ['a wrapping label', () => h('label', null, ['Accept', h(Checkbox)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('a blank aria-label is not a name', async () => {
    await mountTree(() => h(Checkbox, { 'aria-label': ' ' }))
    expect(errors).toHaveLength(1)
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Checkbox))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Checkbox: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Checkbox))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
