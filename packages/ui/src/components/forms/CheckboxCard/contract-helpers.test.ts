import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { checkOptionValues, useRequireControlName } from './contract-helpers'
import SelectableCardShell from './SelectableCardShell.vue'
import { useStrictHarness } from '../testing'

describe('useRequireControlName', () => {
  const { errors, mountTree } = useStrictHarness()
  const Probe = defineComponent({
    props: { attrs: { type: Object, default: () => ({}) }, withLabel: Boolean, noElement: Boolean },
    setup(props) {
      const el = ref<HTMLElement | null>(null)
      useRequireControlName('Probe', () => (props.noElement ? null : el.value), 'Name it.')
      return () => [h('span', { id: 'n' }, 'Sample name'), props.withLabel ? h('label', { for: 'b' }, 'Sample label') : null, h('button', { ref: el, id: 'b', ...props.attrs }, 'Visible text')]
    },
  })

  it('does not accept visible text as a name', async () => {
    await mountTree(() => h(Probe))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Probe: needs an accessible name. Name it.')
  })
  it.each([
    ['aria-label', { attrs: { 'aria-label': 'Named' } }],
    ['aria-labelledby', { attrs: { 'aria-labelledby': 'n' } }],
    ['a label element', { withLabel: true }],
  ])('is satisfied by %s', async (_n, props) => {
    await mountTree(() => h(Probe, props))
    expect(errors).toEqual([])
  })
  it('does nothing when the element is missing', async () => {
    await mountTree(() => h(Probe, { noElement: true }))
    expect(errors).toEqual([])
  })
})

describe('checkOptionValues', () => {
  const { errors, mountTree } = useStrictHarness()
  const Check = defineComponent({
    props: { values: { type: Array, required: true } },
    setup(props) {
      checkOptionValues('Probe', 'option', props.values as unknown[])
      return () => null
    },
  })
  it('accepts unique non-empty strings', async () => {
    await mountTree(() => h(Check, { values: ['a', 'b'] }))
    expect(errors).toEqual([])
  })
  it.each([
    ['an empty value', ['a', ' '], 'non-empty string'],
    ['a non-string value', ['a', 3], 'non-empty string'],
    ['a repeated value', ['a', 'b', 'a'], 'unique'],
  ])('reports %s', async (_n, values, text) => {
    await mountTree(() => h(Check, { values }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain(text)
  })
})

describe('SelectableCardShell', () => {
  it('renders the radio dot for type radio and the check icon for type checkbox', () => {
    const radio = mount(SelectableCardShell, { props: { type: 'radio', slotName: 'radio-card', checked: true, title: 'A' } })
    expect(radio.find('[data-slot="radio-card-indicator"] svg').exists()).toBe(false)
    expect(radio.find('[data-slot="radio-card-indicator"] span').classes()).toContain('rounded-full')
    const box = mount(SelectableCardShell, { props: { type: 'checkbox', slotName: 'checkbox-card', checked: true, title: 'A' } })
    expect(box.find('[data-slot="checkbox-card-indicator"] svg').exists()).toBe(true)
  })

  it('does not emit change while disabled, and re-syncs the native input otherwise', async () => {
    const w = mount(SelectableCardShell, { props: { type: 'checkbox', slotName: 'checkbox-card', checked: false, title: 'A', disabled: true }, attachTo: document.body })
    await w.find('input').trigger('change')
    expect(w.emitted('change')).toBeUndefined()
    await w.setProps({ disabled: false })
    const input = w.find('input').element as HTMLInputElement
    input.checked = true
    await w.find('input').trigger('change')
    expect(w.emitted('change')?.[0]).toEqual([true])
    await Promise.resolve()
    await w.vm.$nextTick()
    expect(input.checked).toBe(false)
    w.unmount()
  })
})
