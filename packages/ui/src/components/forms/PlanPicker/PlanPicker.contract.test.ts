import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Field from '../Field/Field.vue'
import Fieldset from '../Fieldset/Fieldset.vue'
import PlanPicker from './PlanPicker.vue'
import type { PlanPickerPlan } from './PlanPicker.vue'

const { errors, mountTree } = useStrictHarness()
const plans: PlanPickerPlan[] = [
  { id: 'a', name: 'Sample plan A', price: 0 },
  { id: 'b', name: 'Sample plan B', price: 10 },
]
const messages = () => errors.map((e) => e.message)

describe('PlanPicker accessible name', () => {
  it('throws when the picker has no name, saying how to fix it', async () => {
    await mountTree(() => h(PlanPicker, { plans }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('PlanPicker: needs an accessible name')
    expect(errors[0]!.message).toContain('aria-label')
    expect(errors[0]!.message).toContain('Field')
  })

  it.each([
    ['aria-label', () => h(PlanPicker, { plans, 'aria-label': 'Plan' })],
    ['aria-labelledby', () => h('div', [h('span', { id: 'lbl' }, 'Plan'), h(PlanPicker, { plans, 'aria-labelledby': 'lbl' })])],
    ['a Field label', () => h(Field, { label: 'Plan' }, () => h(PlanPicker, { plans }))],
    ['a Fieldset legend', () => h(Fieldset, { legend: 'Plan' }, () => h(PlanPicker, { plans }))],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })

  it('is satisfied with the billing toggle, which carries its own name', async () => {
    await mountTree(() => h(PlanPicker, { plans, 'aria-label': 'Plan', showBillingToggle: true }))
    expect(errors).toEqual([])
  })
})

describe('PlanPicker plans', () => {
  const mountWith = (list: unknown) => mountTree(() => h(PlanPicker, { plans: list as PlanPickerPlan[], 'aria-label': 'Plan' }))

  it.each([[''], ['   '], [undefined], [3]])('throws when a plan id is %j', async (id) => {
    await mountWith([{ ...plans[0], id }])
    expect(messages()[0]).toContain('PlanPicker: requires a non-empty string `id` on every plan')
  })

  it('throws when two plans share an id', async () => {
    await mountWith([plans[0], { ...plans[1], id: 'a' }])
    expect(messages()[0]).toContain('requires a unique `id` on every plan')
    expect(messages()[0]).toContain('"a"')
  })

  it.each([[''], ['  '], [undefined]])('throws when a plan name is %j', async (name) => {
    await mountWith([{ ...plans[0], name }])
    expect(messages()[0]).toContain('requires a non-empty `name` on plan "a"')
  })

  it('is satisfied by valid plans, an empty list and plans without a price', async () => {
    await mountWith(plans)
    expect(errors).toEqual([])
    await mountWith([])
    expect(errors).toEqual([])
    await mountWith([{ id: 'x', name: 'Sample plan X', price: null }])
    expect(errors).toEqual([])
  })

  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountWith([{ ...plans[0], id: '' }])
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('PlanPicker: requires a non-empty string `id`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountWith([{ ...plans[0], id: '' }])
    await mountTree(() => h(PlanPicker, { plans }))
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
