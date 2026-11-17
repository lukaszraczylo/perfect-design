import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import Field from '../Field/Field.vue'
import PlanPicker from './PlanPicker.vue'
import { PlanPicker as Exported, normalizePlanPickerBilling, planPickerItemVariants, planPickerVariants, type PlanPickerPlan } from './index'

const plans: PlanPickerPlan[] = [
  { id: 'a', name: 'Sample plan A', description: 'Sample description A', price: 0, period: '/month' },
  { id: 'b', name: 'Sample plan B', description: 'Sample description B', price: 10, yearlyPrice: 100, period: '/month', yearlyPeriod: '/year', features: ['Sample feature one', 'Sample feature two'], badge: 'Current' },
  { id: 'c', name: 'Sample plan C', price: 40, period: '/month' },
]

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  wrapper = mount(PlanPicker, { props: { plans, 'aria-label': 'Plan', ...props }, attachTo: document.body, ...options })
  return wrapper
}
const radios = (w: VueWrapper) => w.findAll('[role=radio]')
const checked = (w: VueWrapper) => radios(w).map((r) => r.attributes('aria-checked'))
const item = (w: VueWrapper, i: number) => w.findAll('[data-slot=plan-picker-item]')[i]!
const price = (w: VueWrapper, i: number) => item(w, i).find('[data-slot=plan-picker-price]').text()
const press = async (el: Element, key: string) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await new Promise((r) => setTimeout(r, 30)) // reka moves focus and then selects from a timeout
}

describe('PlanPicker: good path', () => {
  it('is exported from the barrel', () => expect(Exported).toBe(PlanPicker))

  it('renders a named radio group with one radio per plan', () => {
    const w = make()
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-label')).toBe('Plan')
    expect(group.attributes('data-slot')).toBe('plan-picker-group')
    expect(radios(w)).toHaveLength(3)
    expect(w.findAll('[data-slot=plan-picker-name]').map((n) => n.text())).toEqual(['Sample plan A', 'Sample plan B', 'Sample plan C'])
  })

  it('shows description, features, badge and the price at the end of each row', () => {
    const w = make()
    expect(item(w, 0).find('[data-slot=plan-picker-description]').text()).toBe('Sample description A')
    expect(item(w, 1).findAll('[data-slot=plan-picker-feature]').map((f) => f.text())).toEqual(['Sample feature one', 'Sample feature two'])
    expect(item(w, 1).find('[data-slot=plan-picker-badge]').text()).toBe('Current')
    expect(item(w, 2).find('[data-slot=plan-picker-description]').exists()).toBe(false)
    expect(item(w, 2).find('[data-slot=plan-picker-features]').exists()).toBe(false)
    expect(price(w, 1)).toContain('$10')
    expect(price(w, 1)).toContain('/month')
    expect(item(w, 1).element.lastElementChild!.getAttribute('data-slot')).toBe('plan-picker-price')
  })

  it('names each plan by its name and describes it with description, points and price', () => {
    const w = make()
    const radio = radios(w)[1]!
    const name = document.getElementById(radio.attributes('aria-labelledby')!)!
    expect(name.textContent).toBe('Sample plan B')
    const described = radio.attributes('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent)
    expect(described.join(' ')).toContain('Sample description B')
    expect(described.join(' ')).toContain('Sample feature one')
    expect(described.join(' ')).toContain('$10')
  })

  it('has nothing selected by default and shows the radio indicator on the selected plan only', () => {
    const w = make({ defaultValue: 'b' })
    expect(checked(w)).toEqual(['false', 'true', 'false'])
    expect(w.findAll('[data-slot=plan-picker-dot]')).toHaveLength(1)
    expect(item(w, 1).attributes('data-state')).toBe('checked')
    expect(checked(make())).toEqual(['false', 'false', 'false'])
  })

  it('uncontrolled: clicking a plan selects it and emits its id', async () => {
    const w = make()
    await radios(w)[2]!.trigger('click')
    expect(checked(w)).toEqual(['false', 'false', 'true'])
    expect(w.emitted('update:modelValue')).toEqual([['c']])
    await radios(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['a'])
  })

  it('controlled: shows the prop, and keeps it when the parent rejects the change', async () => {
    const w = make({ modelValue: 'a' })
    await radios(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['b']])
    expect(checked(w)).toEqual(['true', 'false', 'false'])
    await w.setProps({ modelValue: 'c' })
    expect(checked(w)).toEqual(['false', 'false', 'true'])
  })

  it('works with v-model in a parent', async () => {
    const value = ref('a')
    wrapper = mount(defineComponent({ setup: () => () => h(PlanPicker, { plans, 'aria-label': 'Plan', modelValue: value.value, 'onUpdate:modelValue': (v: string) => (value.value = v) }) }), { attachTo: document.body })
    await radios(wrapper)[1]!.trigger('click')
    expect(value.value).toBe('b')
    value.value = 'c'
    await wrapper.vm.$nextTick()
    expect(checked(wrapper)).toEqual(['false', 'false', 'true'])
  })

  it('does not emit again for the plan that is already selected', async () => {
    const w = make({ defaultValue: 'b' })
    await radios(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('keyboard: arrow keys move and select, and the group is one tab stop', async () => {
    const w = make({ defaultValue: 'a' })
    await new Promise((r) => setTimeout(r, 20))
    expect(w.find('[role=radiogroup]').attributes('tabindex')).toBe('0')
    expect(radios(w).map((r) => r.attributes('tabindex'))).toEqual(['-1', '-1', '-1'])
    ;(radios(w)[0]!.element as HTMLElement).focus()
    await press(radios(w)[0]!.element, 'ArrowDown')
    expect(document.activeElement).toBe(radios(w)[1]!.element)
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['b'])
    await press(radios(w)[1]!.element, 'ArrowUp')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['a'])
  })

  it('keyboard: arrows skip a disabled plan', async () => {
    const w = make({ defaultValue: 'a', plans: [plans[0], { ...plans[1]!, disabled: true }, plans[2]] })
    await new Promise((r) => setTimeout(r, 20))
    ;(radios(w)[0]!.element as HTMLElement).focus()
    await press(radios(w)[0]!.element, 'ArrowDown')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['c'])
  })
})

describe('PlanPicker: billing', () => {
  it('shows monthly prices and no toggle by default', () => {
    const w = make()
    expect(w.find('[data-slot=plan-picker-billing]').exists()).toBe(false)
    expect(price(w, 1)).toContain('$10')
    expect(w.find('[data-slot=plan-picker-note]').exists()).toBe(false)
  })

  it('the toggle switches every plan to its yearly price, period and note', async () => {
    const w = make({ showBillingToggle: true })
    const toggle = w.find('[data-slot=plan-picker-billing]')
    expect(toggle.attributes('aria-label')).toBe('Billing period')
    expect(toggle.findAll('[role=radio]').map((r) => r.text())).toEqual(['Monthly', 'Yearly'])
    await toggle.findAll('[role=radio]')[1]!.trigger('click')
    expect(w.emitted('update:billing')).toEqual([['yearly']])
    expect(price(w, 1)).toContain('$100')
    expect(price(w, 1)).toContain('/year')
    expect(price(w, 1)).toContain('Billed yearly')
    // plan A has no yearlyPrice: keeps its monthly price and shows no yearly note
    expect(price(w, 2)).toContain('$40')
    expect(price(w, 2)).toContain('/month')
    expect(price(w, 2)).not.toContain('Billed yearly')
    await toggle.findAll('[role=radio]')[0]!.trigger('click')
    expect(price(w, 1)).toContain('$10')
  })

  it('billing is controllable and uncontrolled start can be yearly', async () => {
    const w = make({ billing: 'yearly' })
    expect(price(w, 1)).toContain('$100')
    await w.setProps({ billing: 'monthly' })
    expect(price(w, 1)).toContain('$10')
    w.unmount()
    expect(price(make({ defaultBilling: 'yearly' }), 1)).toContain('$100')
  })

  it('a controlled billing stays put when the parent rejects the switch', async () => {
    const w = make({ showBillingToggle: true, billing: 'monthly' })
    await w.find('[data-slot=plan-picker-billing]').findAll('[role=radio]')[1]!.trigger('click')
    expect(w.emitted('update:billing')).toEqual([['yearly']])
    expect(price(w, 1)).toContain('$10')
    expect(price(w, 1)).not.toContain('$100')
  })

  it('billingLabels and yearlyNote change the text; an empty note hides it', () => {
    const w = make({ showBillingToggle: true, billing: 'yearly', yearlyNote: 'Jährlich abgerechnet', billingLabels: { group: 'Abrechnung', monthly: 'Monatlich', yearly: 'Jährlich' } })
    const toggle = w.find('[data-slot=plan-picker-billing]')
    expect(toggle.attributes('aria-label')).toBe('Abrechnung')
    expect(toggle.text()).toContain('Monatlich')
    expect(price(w, 1)).toContain('Jährlich abgerechnet')
    w.unmount()
    expect(price(make({ billing: 'yearly', yearlyNote: '' }), 1)).not.toContain('Billed')
  })

  it('an unknown billing value counts as monthly', () => {
    expect(price(make({ billing: 'weekly' }), 1)).toContain('$10')
    expect(normalizePlanPickerBilling('weekly')).toBe('monthly')
    expect(normalizePlanPickerBilling('yearly')).toBe('yearly')
  })
})

describe('PlanPicker: native form', () => {
  const inForm = (props: Record<string, unknown>) =>
    mount(defineComponent({ setup: () => () => h('form', { id: 'f' }, h(PlanPicker, { plans, 'aria-label': 'Plan', name: 'plan', ...props })) }), { attachTo: document.body })

  it('submits the selected id under `name`', async () => {
    wrapper = inForm({ defaultValue: 'b' })
    const form = document.getElementById('f') as HTMLFormElement
    expect(new FormData(form).get('plan')).toBe('b')
    await radios(wrapper)[2]!.trigger('click')
    expect(new FormData(form).get('plan')).toBe('c')
  })

  it('submits nothing while no plan is selected, or when disabled, or without a name', () => {
    wrapper = inForm({})
    expect(new FormData(document.getElementById('f') as HTMLFormElement).has('plan')).toBe(false)
    wrapper.unmount()
    wrapper = inForm({ defaultValue: 'b', disabled: true })
    expect(new FormData(document.getElementById('f') as HTMLFormElement).has('plan')).toBe(false)
    wrapper.unmount()
    wrapper = inForm({ defaultValue: 'b', name: undefined })
    expect(new FormData(document.getElementById('f') as HTMLFormElement).has('plan')).toBe(false)
  })

  it('renders exactly one input with that name', () => {
    wrapper = inForm({ defaultValue: 'b' })
    expect(document.querySelectorAll('[name=plan]')).toHaveLength(1)
  })
})

describe('PlanPicker: Field integration', () => {
  it('is named by the Field label and described by its hint', () => {
    wrapper = mount(Field, { props: { label: 'Plan', hint: 'Sample hint' }, slots: { default: () => h(PlanPicker, { plans }) }, attachTo: document.body })
    const group = wrapper.find('[role=radiogroup]')
    expect(document.getElementById(group.attributes('aria-labelledby')!)!.textContent).toContain('Plan')
    expect(document.getElementById(group.attributes('aria-describedby')!.split(' ')[0]!)).not.toBeNull()
  })

  it('takes invalid, required and disabled from the Field', () => {
    wrapper = mount(Field, { props: { label: 'Plan', error: 'Choose a plan', required: true, disabled: true }, slots: { default: () => h(PlanPicker, { plans }) }, attachTo: document.body })
    const group = wrapper.find('[role=radiogroup]')
    expect(group.attributes('aria-invalid')).toBe('true')
    expect(group.attributes('aria-required')).toBe('true')
    expect(radios(wrapper).every((r) => r.attributes('disabled') !== undefined)).toBe(true)
    expect(item(wrapper, 0).attributes('data-invalid')).toBe('')
  })

  it('own invalid and required work without a Field', () => {
    const w = make({ invalid: true, required: true })
    expect(w.find('[role=radiogroup]').attributes('aria-invalid')).toBe('true')
    expect(w.find('[role=radiogroup]').attributes('aria-required')).toBe('true')
    expect(item(w, 1).attributes('data-invalid')).toBe('')
  })
})

describe('PlanPicker: customisation', () => {
  it('merges `class` last on the root and keeps data-slot hooks', () => {
    const w = make({ class: 'max-w-md gap-8' })
    expect(w.attributes('data-slot')).toBe('plan-picker')
    expect(w.classes()).toEqual(expect.arrayContaining(['max-w-md', 'gap-8']))
    expect(w.classes()).not.toContain('gap-3')
    for (const slot of ['group', 'item', 'indicator', 'name', 'price']) expect(w.find(`[data-slot=plan-picker-${slot}]`).exists()).toBe(true)
  })

  it('sends aria and data attributes to the radio group', () => {
    const w = make({ 'aria-label': undefined, 'aria-labelledby': 'x', 'data-test': 'y', id: 'plans' })
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-labelledby')).toBe('x')
    expect(group.attributes('data-test')).toBe('y')
    expect(group.attributes('id')).toBe('plans')
    expect(w.attributes('data-test')).toBeUndefined()
  })

  it('cards are separate bordered rows; list is one bordered list with dividers', () => {
    const cards = make()
    expect(cards.find('[data-slot=plan-picker-group]').classes()).not.toContain('divide-y')
    expect(item(cards, 0).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border-input']))
    cards.unmount()
    const list = make({ variant: 'list' })
    expect(list.find('[data-slot=plan-picker-group]').classes()).toEqual(expect.arrayContaining(['divide-y', 'rounded-lg', 'border']))
    expect(item(list, 0).classes()).toContain('first:rounded-t-lg')
    expect(list.find('[data-slot=plan-picker-group]').attributes('data-variant')).toBe('list')
  })

  it('sizes change padding and gap, and unknown values fall back', () => {
    const html = (props: Record<string, unknown>) => {
      const w = make(props)
      const out = w.html()
      w.unmount()
      return out
    }
    const base = html({})
    expect(html({ size: 'sm' })).not.toBe(base)
    expect(html({ size: 'lg' })).not.toBe(base)
    expect(html({ size: 'sm' })).toContain('p-3')
    expect(html({ size: 'lg' })).toContain('p-5')
    expect(html({ size: 'huge' })).toBe(base)
    expect(html({ variant: 'huge' })).toBe(base)
  })

  it('exports the variant functions', () => {
    expect(planPickerVariants({ variant: 'list' })).toContain('divide-y')
    expect(planPickerVariants({ size: 'lg' })).toContain('gap-3')
    expect(planPickerItemVariants({ size: 'sm' })).toContain('p-3')
  })

  it('selected state is drawn with a radio dot, a border and a tint, not colour alone', () => {
    const w = make({ defaultValue: 'a' })
    expect(item(w, 0).classes().join(' ')).toContain('data-[state=checked]:border-primary')
    expect(item(w, 0).classes().join(' ')).toContain('data-[state=checked]:bg-primary/5')
    expect(item(w, 0).find('[data-slot=plan-picker-dot]').exists()).toBe(true)
    expect(item(w, 1).find('[data-slot=plan-picker-dot]').exists()).toBe(false)
  })
})

describe('PlanPicker: bad path', () => {
  it('a disabled plan cannot be selected and is skipped by tab order', async () => {
    const w = make({ plans: [plans[0], { ...plans[1]!, disabled: true }, plans[2]] })
    expect(item(w, 1).attributes('data-disabled')).toBe('')
    await radios(w)[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(checked(w)).toEqual(['false', 'false', 'false'])
  })

  it('a disabled picker blocks every plan and the toggle', async () => {
    const w = make({ disabled: true, showBillingToggle: true })
    await radios(w)[0]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('[data-slot=plan-picker-billing]').findAll('[role=radio]').every((r) => r.attributes('disabled') !== undefined)).toBe(true)
  })

  it.each([[[]], [undefined], [null], ['x'], [{}]])('renders an empty group for plans %j', (value) => {
    const w = make({ plans: value })
    expect(w.find('[role=radiogroup]').exists()).toBe(true)
    expect(radios(w)).toHaveLength(0)
  })

  it('skips null entries in the plan list', () => {
    expect(radios(make({ plans: [null, plans[0]] }))).toHaveLength(1)
  })

  it.each([[null], [NaN], [Infinity], ['10' as unknown as number], [undefined as unknown as number]])('shows the custom label instead of a price for %j', (value) => {
    const w = make({ plans: [{ id: 'x', name: 'Sample plan X', price: value }] })
    expect(w.find('[data-slot=plan-picker-custom]').text()).toBe('Custom')
    expect(w.find('[data-slot=price]').exists()).toBe(false)
  })

  it('customLabel replaces the default text; a null yearly price shows it in yearly mode', () => {
    const w = make({ billing: 'yearly', customLabel: 'Ask us', plans: [{ id: 'x', name: 'Sample plan X', price: 10, yearlyPrice: null }] })
    expect(w.find('[data-slot=plan-picker-custom]').text()).toBe('Ask us')
  })

  it('selects nothing for a modelValue that matches no plan', () => {
    expect(checked(make({ modelValue: 'zzz' }))).toEqual(['false', 'false', 'false'])
  })

  it('a free plan shows a zero price', () => {
    expect(price(make(), 0)).toContain('$0')
  })
})

describe('PlanPicker: edge cases', () => {
  it('formats huge prices', () => {
    const w = make({ plans: [{ id: 'x', name: 'Sample plan X', price: 1e12, period: '/month' }] })
    expect(price(w, 0)).toContain('1,000,000,000,000')
  })

  it('formats prices for de-DE with currency and a decimal comma', () => {
    const w = make({ locale: 'de-DE', currency: 'EUR', plans: [{ id: 'x', name: 'Sample plan X', price: 9.5, period: '/Monat' }] })
    expect(price(w, 0)).toContain('9,50')
    expect(price(w, 0)).toContain('€')
    expect(price(w, 0)).toContain('/Monat')
  })

  it('formats an invalid currency or locale without throwing', () => {
    expect(price(make({ currency: 'nope', locale: 'not a locale' }), 1)).toContain('10')
  })

  it('wraps long and unicode text and uses logical properties', () => {
    const long = 'Sample plan with a very long name '.repeat(8)
    const w = make({ plans: [{ id: 'x', name: long, description: 'שלום 世界 '.repeat(20), price: 10 }] })
    expect(w.find('[data-slot=plan-picker-name]').text()).toBe(long.trim())
    expect(w.html()).not.toMatch(/\b(ml|mr|pl|pr|left|right)-\d/)
    expect(item(w, 0).classes()).toContain('text-start')
    expect(item(w, 0).classes()).toContain('w-full')
  })

  it('renders inside a right-to-left container', () => {
    wrapper = mount(defineComponent({ setup: () => () => h('div', { dir: 'rtl' }, h(PlanPicker, { plans, 'aria-label': 'Plan' })) }), { attachTo: document.body })
    expect(radios(wrapper)).toHaveLength(3)
  })

  it('handles rapid selection changes', async () => {
    const w = make()
    for (const i of [0, 1, 2, 1, 0, 2]) await radios(w)[i]!.trigger('click')
    expect(w.emitted('update:modelValue')!.map((e) => e[0])).toEqual(['a', 'b', 'c', 'b', 'a', 'c'])
    expect(checked(w)).toEqual(['false', 'false', 'true'])
  })

  it('reacts to a changed plan list', async () => {
    const w = make({ defaultValue: 'b' })
    await w.setProps({ plans: [plans[1]] })
    expect(radios(w)).toHaveLength(1)
    expect(checked(w)).toEqual(['true'])
  })

  it('handles many plans', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ id: `p${i}`, name: `Sample plan ${i}`, price: i }))
    expect(radios(make({ plans: many }))).toHaveLength(50)
  })

  it('unmounts cleanly', () => {
    const w = make({ defaultValue: 'a', showBillingToggle: true })
    w.unmount()
    wrapper = undefined
    expect(document.body.querySelector('[data-slot=plan-picker]')).toBeNull()
  })
})
