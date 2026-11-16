import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Fieldset from './Fieldset.vue'

describe('Fieldset', () => {
  it('merges a consumer aria-describedby with the description id', () => {
    const w = mount(Fieldset, { props: { legend: 'L', description: 'D' }, attrs: { 'aria-describedby': 'extra' } })
    const id = w.find('[data-slot=fieldset-description]').attributes('id')!
    expect(w.attributes('aria-describedby')).toBe(`${id} extra`)
  })

  it('renders a native fieldset with legend and content', () => {
    const w = mount(Fieldset, { props: { legend: 'Billing' }, slots: { default: '<input class="in" />' } })
    expect(w.element.tagName).toBe('FIELDSET')
    expect(w.attributes('data-slot')).toBe('fieldset')
    expect(w.find('legend').text()).toBe('Billing')
    expect(w.find('legend').attributes('data-slot')).toBe('fieldset-legend')
    expect(w.find('[data-slot=fieldset-content] .in').exists()).toBe(true)
  })

  it('legend slot overrides legend prop', () => {
    const w = mount(Fieldset, { props: { legend: 'Prop' }, slots: { legend: '<b>Slot</b>' } })
    expect(w.find('legend').html()).toContain('<b>Slot</b>')
    expect(w.find('legend').text()).toBe('Slot')
  })

  it('omits legend and description when not provided (edge)', () => {
    const w = mount(Fieldset)
    expect(w.find('legend').exists()).toBe(false)
    expect(w.find('[data-slot=fieldset-description]').exists()).toBe(false)
    expect(w.attributes('aria-describedby')).toBeUndefined()
  })

  it('links description via aria-describedby', () => {
    const w = mount(Fieldset, { props: { legend: 'L', description: 'Helpful' } })
    const desc = w.find('[data-slot=fieldset-description]')
    expect(desc.text()).toBe('Helpful')
    expect(desc.attributes('id')).toBeTruthy()
    expect(w.attributes('aria-describedby')).toBe(desc.attributes('id'))
  })

  it('description slot works', () => {
    const w = mount(Fieldset, { slots: { description: '<em>Rich</em>' } })
    expect(w.find('[data-slot=fieldset-description] em').text()).toBe('Rich')
    expect(w.attributes('aria-describedby')).toBeTruthy()
  })

  it('each instance gets a unique description id', () => {
    const Host = defineComponent({
      render: () => h('div', [h(Fieldset, { description: 'a' }), h(Fieldset, { description: 'b' })]),
    })
    const [a, b] = mount(Host).findAll('fieldset')
    expect(a.attributes('aria-describedby')).toBeTruthy()
    expect(a.attributes('aria-describedby')).not.toBe(b.attributes('aria-describedby'))
  })

  it('plain variant has no card chrome; card variant does', () => {
    const plain = mount(Fieldset, { props: { legend: 'x' } })
    expect(plain.attributes('data-variant')).toBe('plain')
    expect(plain.classes()).not.toContain('rounded-lg')
    const card = mount(Fieldset, { props: { variant: 'card', legend: 'x' } })
    expect(card.attributes('data-variant')).toBe('card')
    expect(card.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'bg-card']))
    expect(card.find('legend').classes()).toContain('float-left')
  })

  it('disabled sets native disabled (disables descendants) and data-disabled', () => {
    const w = mount(Fieldset, { props: { disabled: true }, slots: { default: '<input />' } })
    expect((w.element as HTMLFieldSetElement).disabled).toBe(true)
    expect((w.find('input').element as HTMLInputElement).matches(':disabled')).toBe(true)
    expect(w.attributes('data-disabled')).toBeDefined()
    expect(w.classes()).toContain('opacity-60')
  })

  it('enabled by default', () => {
    const w = mount(Fieldset)
    expect(w.attributes('disabled')).toBeUndefined()
    expect(w.attributes('data-disabled')).toBeUndefined()
  })

  it('merges class last and passes attrs through', () => {
    const w = mount(Fieldset, { props: { variant: 'card', class: 'p-8 custom' }, attrs: { id: 'fs', name: 'billing' } })
    expect(w.classes()).toContain('custom')
    expect(w.classes()).toContain('p-8')
    expect(w.classes()).not.toContain('p-4')
    expect(w.attributes('id')).toBe('fs')
    expect(w.attributes('name')).toBe('billing')
  })

  it('handles unicode legend', () => {
    const w = mount(Fieldset, { props: { legend: 'عنوان الفواتير 請求先' } })
    expect(w.find('legend').text()).toBe('عنوان الفواتير 請求先')
  })
})
