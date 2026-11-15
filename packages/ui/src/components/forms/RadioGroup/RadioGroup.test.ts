import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import RadioGroup from './RadioGroup.vue'
import RadioGroupItem from './RadioGroupItem.vue'
import { RadioGroup as G, RadioGroupItem as I } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(groupProps: Record<string, unknown> = {}, itemProps: Array<Record<string, unknown>> = [], attachTo = false) {
  const items = itemProps.length
    ? itemProps
    : [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
        { value: 'c', label: 'Gamma' },
      ]
  wrapper = mount(RadioGroup, {
    props: groupProps,
    slots: { default: () => items.map((p) => h(RadioGroupItem, { key: p.value as string, ...(p as { value: string }) })) },
    attachTo: attachTo ? document.body : undefined,
  })
  return wrapper
}
const radios = (w: VueWrapper) => w.findAll('[role="radio"]')

describe('RadioGroup', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => {
      expect(G).toBe(RadioGroup)
      expect(I).toBe(RadioGroupItem)
    })

    it('renders a role=radiogroup with radio items and labels', () => {
      const w = make()
      expect(w.find('[data-slot="radio-group"]').attributes('role')).toBe('radiogroup')
      expect(radios(w)).toHaveLength(3)
      expect(w.findAll('label').map((l) => l.text())).toEqual(['Alpha', 'Beta', 'Gamma'])
    })

    it('marks the item matching modelValue as checked', () => {
      const w = make({ modelValue: 'b' })
      expect(radios(w).map((r) => r.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
      expect(w.findAll('[data-slot="radio-group-indicator"]')).toHaveLength(1)
    })

    it('emits update:modelValue when an item is clicked', async () => {
      const w = make({ modelValue: 'a' })
      await radios(w)[2]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['c'])
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = make({ defaultValue: 'a' })
      expect(radios(w)[0]!.attributes('aria-checked')).toBe('true')
      await radios(w)[1]!.trigger('click')
      expect(radios(w)[1]!.attributes('aria-checked')).toBe('true')
      expect(radios(w)[0]!.attributes('aria-checked')).toBe('false')
    })

    it('works with v-model in a parent', async () => {
      const v = ref('a')
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(RadioGroup, { modelValue: v.value, 'onUpdate:modelValue': (x: string) => (v.value = x) }, () => [
              h(RadioGroupItem, { value: 'a' }),
              h(RadioGroupItem, { value: 'b' }),
            ]),
        }),
      )
      await wrapper.findAll('[role="radio"]')[1]!.trigger('click')
      expect(v.value).toBe('b')
    })

    it('clicking the label selects the item', async () => {
      const w = make({}, [{ value: 'a', label: 'Alpha' }], true)
      await w.find('label').trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['a'])
    })

    it('label slot content renders instead of the prop', () => {
      wrapper = mount(RadioGroup, {
        slots: { default: () => h(RadioGroupItem, { value: 'a', label: 'prop' }, () => h('em', 'slot')) },
      })
      expect(wrapper.find('label em').text()).toBe('slot')
    })

    it('vertical layout by default, horizontal on request', () => {
      expect(make().find('[data-slot="radio-group"]').classes()).toContain('grid')
      expect(make().find('[data-slot="radio-group"]').attributes('data-orientation')).toBe('vertical')
      const h2 = make({ orientation: 'horizontal' })
      expect(h2.find('[data-slot="radio-group"]').classes()).toContain('flex')
      expect(h2.find('[data-slot="radio-group"]').attributes('aria-orientation')).toBe('horizontal')
    })
  })

  describe('customisation', () => {
    it('merges class on the group and the item (class wins)', () => {
      const w = make({ class: 'gap-8 custom' }, [{ value: 'a', class: 'size-6 item-custom' }])
      const g = w.find('[data-slot="radio-group"]')
      expect(g.classes()).toContain('custom')
      expect(g.classes()).toContain('gap-8')
      expect(g.classes()).not.toContain('gap-2.5')
      const r = radios(w)[0]!
      expect(r.classes()).toContain('item-custom')
      expect(r.classes()).toContain('size-6')
      expect(r.classes()).not.toContain('size-4')
    })

    it('passes attrs to group and item', () => {
      wrapper = mount(RadioGroup, {
        attrs: { 'aria-label': 'Plan', 'data-x': '1' },
        slots: { default: () => h(RadioGroupItem, { value: 'a', 'aria-label': 'A', 'data-y': '2' }) },
      })
      expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('Plan')
      expect(wrapper.find('[role="radiogroup"]').attributes('data-x')).toBe('1')
      expect(wrapper.find('[role="radio"]').attributes('aria-label')).toBe('A')
      expect(wrapper.find('[role="radio"]').attributes('data-y')).toBe('2')
    })

    it('uses the id prop for item and label', () => {
      const w = make({}, [{ value: 'a', label: 'A', id: 'r-a' }])
      expect(radios(w)[0]!.attributes('id')).toBe('r-a')
      expect(w.find('label').attributes('for')).toBe('r-a')
    })

    it('an id attr on an item is honoured for label linking', () => {
      wrapper = mount(RadioGroup, { slots: { default: () => h(RadioGroupItem, { value: 'a', label: 'A', id: 'attr-id' }) } })
      expect(wrapper.find('label').attributes('for')).toBe('attr-id')
    })

    it('items without a label render bare (no wrapper)', () => {
      const w = make({}, [{ value: 'a' }])
      expect(w.find('[data-slot="radio-group-item-wrapper"]').exists()).toBe(false)
      expect(w.find('label').exists()).toBe(false)
    })
  })

  describe('bad path', () => {
    it('disabled group blocks selection', async () => {
      const w = make({ disabled: true })
      expect(radios(w).every((r) => r.attributes('disabled') !== undefined)).toBe(true)
      await radios(w)[0]!.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('disabled item blocks selection but siblings still work', async () => {
      const w = make({}, [
        { value: 'a', label: 'A', disabled: true },
        { value: 'b', label: 'B' },
      ])
      await radios(w)[0]!.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await radios(w)[1]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
      expect(w.findAll('label')[0]!.classes()).toContain('opacity-50')
    })

    it('invalid sets aria-invalid on the group', () => {
      expect(make({ invalid: true }).find('[role="radiogroup"]').attributes('aria-invalid')).toBe('true')
      expect(make().find('[role="radiogroup"]').attributes('aria-invalid')).toBeUndefined()
    })

    it('modelValue matching no item selects nothing', () => {
      const w = make({ modelValue: 'zzz' })
      expect(radios(w).every((r) => r.attributes('aria-checked') === 'false')).toBe(true)
    })

    it('unknown orientation falls back to vertical', () => {
      const w = make({ orientation: 'diagonal' })
      expect(w.find('[data-slot="radio-group"]').classes()).toContain('grid')
    })

    it('required sets aria-required', () => {
      expect(make({ required: true }).find('[role="radiogroup"]').attributes('aria-required')).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('empty group renders no items', () => {
      wrapper = mount(RadioGroup)
      expect(wrapper.findAll('[role="radio"]')).toHaveLength(0)
    })

    it('unicode labels render', () => {
      const w = make({}, [{ value: 'jp', label: '日本語 🎌' }, { value: 'ar', label: 'مرحبا' }])
      expect(w.findAll('label').map((l) => l.text())).toEqual(['日本語 🎌', 'مرحبا'])
    })

    it('rapid selection ends on the last click', async () => {
      const w = make({ defaultValue: 'a' })
      for (const i of [1, 2, 0, 2, 1]) await radios(w)[i]!.trigger('click')
      expect(radios(w)[1]!.attributes('aria-checked')).toBe('true')
    })

    it('forwards name to hidden inputs inside a form', () => {
      const Host = defineComponent({
        setup: () => () => h('form', null, [h(RadioGroup, { name: 'plan', modelValue: 'a' }, () => [h(RadioGroupItem, { value: 'a' })])]),
      })
      wrapper = mount(Host, { attachTo: document.body })
      expect(wrapper.find('input[name="plan"]').attributes('name')).toBe('plan')
    })

    it('numeric-looking values stay strings in the emit', async () => {
      const w = make({}, [{ value: '1' }, { value: '2' }])
      await radios(w)[1]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['2'])
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid, disabled from Field', () => {
      wrapper = mount(Field, {
        props: { label: 'Plan', hint: 'Pick one', error: 'Required', id: 'plan', disabled: true },
        slots: { default: () => h(RadioGroup, null, () => [h(RadioGroupItem, { value: 'a' })]) },
      })
      const g = wrapper.find('[role="radiogroup"]')
      expect(g.attributes('id')).toBe('plan')
      expect(g.attributes('aria-describedby')).toBe('plan-hint plan-error')
      expect(g.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('[role="radio"]').attributes('disabled')).toBeDefined()
    })
  })
})
