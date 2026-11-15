import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import PinInput from './PinInput.vue'

const { errors, mountTree } = useStrictHarness()

describe('PinInput contract', () => {
  it('throws when nothing names the group (the named cells do not count), saying how to fix it', async () => {
    await mountTree(() => h(PinInput, { length: 4 }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('PinInput: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => h(PinInput, { 'aria-label': 'Verification code' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Verification code'), h(PinInput, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Enter your PIN' }, () => h(PinInput, { length: 4, type: 'number', mask: true }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Enter your PIN', default: () => h(PinInput) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'PIN'), default: () => h(PinInput) })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('throws on a blank cellLabel but accepts a custom one', async () => {
    await mountTree(() => h(PinInput, { 'aria-label': 'Code', cellLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('PinInput: requires a non-empty `cellLabel`')
    await mountTree(() => h(PinInput, { 'aria-label': 'Code', cellLabel: 'Chiffre' }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(PinInput))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PinInput: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(PinInput))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
