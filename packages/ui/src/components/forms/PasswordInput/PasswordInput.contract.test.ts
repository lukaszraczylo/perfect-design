import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import PasswordInput from './PasswordInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('PasswordInput contract', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => h(PasswordInput))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('PasswordInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(PasswordInput, { 'aria-label': 'Password' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Password'), h(PasswordInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Password' }, () => h(PasswordInput))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Password', default: () => h(PasswordInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Password'), default: () => h(PasswordInput) })],
    ['a Label for the id', () => [h(Label, { for: 'p' }, () => 'Password'), h(PasswordInput, { id: 'p' })]],
    ['a wrapping label', () => h('label', null, ['Password', h(PasswordInput)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws when the toggle has a blank name', async () => {
    await mountTree(() => h(PasswordInput, { 'aria-label': 'Password', showLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('PasswordInput: needs an accessible name')
    expect(errors[0].message).toContain('showLabel')
  })
  it('the default toggle name and a custom showLabel pass', async () => {
    await mountTree(() => h(PasswordInput, { 'aria-label': 'Password' }))
    expect(errors).toEqual([])
    await mountTree(() => h(PasswordInput, { 'aria-label': 'Mot de passe', showLabel: 'Afficher le mot de passe' }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(PasswordInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PasswordInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(PasswordInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
