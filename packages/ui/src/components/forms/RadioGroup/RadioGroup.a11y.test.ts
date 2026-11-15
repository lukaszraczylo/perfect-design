import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import RadioGroup from './RadioGroup.vue'
import RadioGroupItem from './RadioGroupItem.vue'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const items = () => [h(RadioGroupItem, { value: 'a', label: 'Alpha' }), h(RadioGroupItem, { value: 'b', label: 'Beta' })]

describe('RadioGroup a11y', () => {
  it('a Field label names the radiogroup through aria-labelledby and the hint/error describe it', () => {
    wrapper = mount(Field, { props: { id: 'f', label: 'Plan', hint: 'Pick one', error: 'Required' }, slots: { default: () => h(RadioGroup, null, items) } })
    const group = wrapper.find('[role="radiogroup"]')
    expect(group.attributes('aria-labelledby')).toBe('f-label')
    expect(group.attributes('aria-describedby')).toBe('f-hint f-error')
    expect(group.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#f-label').text()).toBe('Plan')
  })

  it('required group: aria-required and aria-invalid=false while valid', () => {
    wrapper = mount(RadioGroup, { props: { required: true }, slots: { default: items } })
    expect(wrapper.attributes('aria-required')).toBe('true')
    expect(wrapper.attributes('aria-invalid')).toBe('false')
  })

  it('items have an invisible ::after hit area (24px, ~40px on touch), rounded-full, and align to a wrapping label', () => {
    wrapper = mount(RadioGroup, { slots: { default: items } })
    const radio = wrapper.find('[data-slot="radio-group-item"]')
    expect(radio.classes()).toEqual(expect.arrayContaining(['relative', 'after:absolute', 'after:-inset-1', 'pointer-coarse:after:-inset-3', 'rounded-full', 'mt-0.5']))
    expect(wrapper.find('[data-slot="radio-group-item-wrapper"]').classes()).toEqual(expect.arrayContaining(['items-start', 'max-w-full']))
  })

  it('the checked dot survives forced-colors mode, and invalid items get a dashed border', async () => {
    wrapper = mount(RadioGroup, { props: { defaultValue: 'a' }, slots: { default: items }, attachTo: document.body })
    expect(wrapper.find('[data-slot="radio-group-indicator"] span').classes()).toContain('forced-colors:bg-[CanvasText]')
    expect(wrapper.find('[data-slot="radio-group-item"]').classes()).toContain('forced-colors:aria-invalid:border-dashed')
  })

  it('an unlabelled radio (no label, no slot) renders the bare control and the dot is also forced-colors safe', () => {
    wrapper = mount(RadioGroup, { props: { defaultValue: 'a' }, slots: { default: () => h(RadioGroupItem, { value: 'a', 'aria-label': 'A' }) }, attachTo: document.body })
    expect(wrapper.find('[data-slot="radio-group-item-wrapper"]').exists()).toBe(false)
    expect(wrapper.find('[data-slot="radio-group-indicator"] span').classes()).toContain('forced-colors:bg-[CanvasText]')
    expect(wrapper.find('[data-slot="radio-group-item"]').classes()).not.toContain('mt-0.5')
  })
})
