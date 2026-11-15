import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Button from '../../primitives/Button/Button.vue'
import FormActions from './FormActions.vue'

const { errors, mountTree } = useStrictHarness()

describe('FormActions contract', () => {
  it('throws when it renders no actions, saying how to fix it', async () => {
    await mountTree(() => h(FormActions))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('FormActions: renders no actions')
    expect(errors[0].message).toContain('submitLabel')
  })
  it('an empty default slot and blank labels still count as no actions', async () => {
    await mountTree(() => h(FormActions, { submitLabel: '', cancelLabel: '' }, { default: () => [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('FormActions: renders no actions')
  })
  it.each([
    ['a submitLabel', () => h(FormActions, { submitLabel: 'Save changes' })],
    ['a cancelLabel', () => h(FormActions, { cancelLabel: 'Cancel' })],
    ['both labels', () => h(FormActions, { submitLabel: 'Save changes', cancelLabel: 'Cancel', loading: true })],
    ['buttons in the default slot', () => h(FormActions, { align: 'between', 'aria-label': 'Publish actions' }, () => [h(Button, { type: 'button' }, () => 'Save draft'), h(Button, { type: 'submit' }, () => 'Publish')])],
    ['plain text in the default slot', () => h(FormActions, null, () => 'Saved automatically')],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(FormActions))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('FormActions: renders no actions'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(FormActions))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
