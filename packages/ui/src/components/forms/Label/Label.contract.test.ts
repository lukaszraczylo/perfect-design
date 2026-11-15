import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Input from '../Input/Input.vue'
import Label from './Label.vue'

const { errors, mountTree } = useStrictHarness()

describe('Label contract', () => {
  it('throws when it has neither `for` nor a nested control', async () => {
    await mountTree(() => h(Label, null, () => 'Name'))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Label: requires `for`')
    expect(errors[0].message).toContain('Field')
  })
  it('throws when `for` matches no element', async () => {
    await mountTree(() => h(Label, { for: 'missing' }, () => 'Name'))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('`for="missing"` does not match the id of any element')
  })
  it('is satisfied by `for` that matches a control', async () => {
    await mountTree(() => [h(Label, { for: 'a' }, () => 'Name'), h(Input, { id: 'a' })])
    expect(errors).toEqual([])
  })
  it('is satisfied by a nested control', async () => {
    await mountTree(() => h(Label, null, () => ['Name', h('input')]))
    expect(errors).toEqual([])
    await mountTree(() => h(Label, null, () => ['Accept', h('button', { role: 'checkbox', 'aria-checked': 'false' })]))
    expect(errors).toEqual([])
  })
  it('accepts the label that Field renders, even for a group control without a matching id', async () => {
    await mountTree(() => h(Label, { for: 'nowhere', 'data-slot': 'field-label' }, () => 'Plan'))
    expect(errors).toEqual([])
  })
  it('checks the rendered element with as-child', async () => {
    await mountTree(() => h(Label, { asChild: true }, () => h('label', null, 'Name')))
    expect(errors).toHaveLength(1)
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Label, null, () => 'Name'))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Label: requires `for`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Label, null, () => 'Name'))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
