import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons'
import Checkbox from './Checkbox.vue'
import { Checkbox as Exported } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const box = (w: VueWrapper) => w.find('[data-slot="checkbox"]')

describe('Checkbox', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(Checkbox))

    it('renders a role=checkbox button with data-slot, unchecked by default', () => {
      const w = mount(Checkbox)
      expect(box(w).element.tagName).toBe('BUTTON')
      expect(box(w).attributes('role')).toBe('checkbox')
      expect(box(w).attributes('data-slot')).toBe('checkbox')
      expect(box(w).attributes('aria-checked')).toBe('false')
      expect(box(w).attributes('data-state')).toBe('unchecked')
      expect(w.find('[data-slot="checkbox-indicator"]').exists()).toBe(false)
    })

    it('reflects modelValue and shows the check icon when checked', () => {
      const w = mount(Checkbox, { props: { modelValue: true } })
      expect(box(w).attributes('aria-checked')).toBe('true')
      expect(w.find('svg path').attributes('d')).toBe(faCheck.icon[4])
    })

    it('shows the minus icon and aria-checked=mixed when indeterminate', () => {
      const w = mount(Checkbox, { props: { modelValue: 'indeterminate' } })
      expect(box(w).attributes('aria-checked')).toBe('mixed')
      expect(box(w).attributes('data-state')).toBe('indeterminate')
      expect(w.find('svg path').attributes('d')).toBe(faMinus.icon[4])
    })

    it('emits update:modelValue on click (controlled stays until parent updates)', async () => {
      const w = mount(Checkbox, { props: { modelValue: false } })
      await box(w).trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
      expect(box(w).attributes('aria-checked')).toBe('false')
      await w.setProps({ modelValue: true })
      expect(box(w).attributes('aria-checked')).toBe('true')
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = mount(Checkbox, { props: { defaultValue: true } })
      expect(box(w).attributes('aria-checked')).toBe('true')
      await box(w).trigger('click')
      expect(box(w).attributes('aria-checked')).toBe('false')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('works uncontrolled without any value', async () => {
      const w = mount(Checkbox)
      await box(w).trigger('click')
      expect(box(w).attributes('aria-checked')).toBe('true')
    })

    it('toggles with the Space key', async () => {
      const w = mount(Checkbox)
      await box(w).trigger('keydown', { key: ' ' })
      await box(w).trigger('keyup', { key: ' ' })
      await box(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
    })

    it('works with v-model in a parent', async () => {
      const checked = ref<boolean | 'indeterminate'>(false)
      wrapper = mount(
        defineComponent({
          setup: () => () => h(Checkbox, { modelValue: checked.value, 'onUpdate:modelValue': (v: boolean | 'indeterminate') => (checked.value = v) }),
        }),
      )
      await wrapper.find('button').trigger('click')
      expect(checked.value).toBe(true)
      await wrapper.find('button').trigger('click')
      expect(checked.value).toBe(false)
    })

    it('indeterminate becomes true on click', async () => {
      const w = mount(Checkbox, { props: { modelValue: 'indeterminate' } })
      await box(w).trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it.each([
      ['sm', 'size-3.5'],
      ['md', 'size-4'],
      ['lg', 'size-5'],
    ] as const)('applies the %s size', (size, cls) => {
      expect(box(mount(Checkbox, { props: { size } })).classes()).toContain(cls)
    })

    it('renders a label prop in a <label for> linked to the box', () => {
      const w = mount(Checkbox, { props: { label: 'Accept terms' } })
      const label = w.find('label')
      expect(label.text()).toBe('Accept terms')
      expect(label.attributes('for')).toBe(box(w).attributes('id'))
      expect(w.find('[data-slot="checkbox-wrapper"]').exists()).toBe(true)
    })

    it('renders the label slot over the prop', () => {
      const w = mount(Checkbox, { props: { label: 'prop' }, slots: { label: '<em>slot</em>' } })
      expect(w.find('label em').text()).toBe('slot')
      expect(w.find('label').text()).not.toContain('prop')
    })

    it('clicking the label toggles the checkbox', async () => {
      wrapper = mount(Checkbox, { props: { label: 'Toggle me' }, attachTo: document.body })
      await wrapper.find('label').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('hidden form input carries name/value inside a form', () => {
      const Host = defineComponent({ setup: () => () => h('form', null, [h(Checkbox, { name: 'tos', value: 'yes', modelValue: true })]) })
      wrapper = mount(Host, { attachTo: document.body })
      const input = wrapper.find('input[type="checkbox"]')
      expect(input.attributes('name')).toBe('tos')
      expect(input.attributes('value')).toBe('yes')
    })
  })

  describe('customisation', () => {
    it('merges class last so it wins over internal classes', () => {
      const w = mount(Checkbox, { props: { class: 'size-8 custom' } })
      expect(box(w).classes()).toContain('custom')
      expect(box(w).classes()).toContain('size-8')
      expect(box(w).classes()).not.toContain('size-4')
    })

    it('passes attrs (aria-label, data-*, id) to the box', () => {
      const w = mount(Checkbox, { attrs: { 'aria-label': 'Select row', 'data-x': '1', id: 'cb1' } })
      expect(box(w).attributes('aria-label')).toBe('Select row')
      expect(box(w).attributes('data-x')).toBe('1')
      expect(box(w).attributes('id')).toBe('cb1')
    })

    it('uses the id prop for the box and label', () => {
      const w = mount(Checkbox, { props: { id: 'my-id', label: 'L' } })
      expect(box(w).attributes('id')).toBe('my-id')
      expect(w.find('label').attributes('for')).toBe('my-id')
    })

    it('label wrapper keeps class on the box, not the wrapper', () => {
      const w = mount(Checkbox, { props: { label: 'L', class: 'custom' } })
      expect(box(w).classes()).toContain('custom')
      expect(w.find('[data-slot="checkbox-wrapper"]').classes()).not.toContain('custom')
    })
  })

  describe('bad path', () => {
    it('does not emit and is disabled when disabled', async () => {
      const w = mount(Checkbox, { props: { disabled: true } })
      expect(box(w).attributes('disabled')).toBeDefined()
      await box(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('dims the label when disabled', () => {
      const w = mount(Checkbox, { props: { disabled: true, label: 'L' } })
      expect(w.find('label').classes()).toContain('opacity-50')
    })

    it('sets aria-invalid when invalid', () => {
      expect(box(mount(Checkbox, { props: { invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(box(mount(Checkbox)).attributes('aria-invalid')).toBeUndefined()
    })

    it('falls back to md for an unknown size', () => {
      const w = mount(Checkbox, { props: { size: 'huge' as never } })
      expect(box(w).classes()).toContain('size-4')
    })

    it('null modelValue is treated as unchecked', () => {
      const w = mount(Checkbox, { props: { modelValue: null } })
      expect(box(w).attributes('aria-checked')).toBe('false')
    })

    it('sets aria-required when required', () => {
      expect(box(mount(Checkbox, { props: { required: true } })).attributes('aria-required')).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('rapid toggling ends in the right state', async () => {
      const w = mount(Checkbox)
      for (let i = 0; i < 5; i++) await box(w).trigger('click')
      expect(box(w).attributes('aria-checked')).toBe('true')
      expect(w.emitted('update:modelValue')).toHaveLength(5)
    })

    it('renders unicode/RTL/very long labels', () => {
      const long = 'x'.repeat(500)
      for (const label of ['日本語 ✓ 🎉', 'مرحبا بالعالم', long]) {
        const w = mount(Checkbox, { props: { label } })
        expect(w.find('label').text()).toBe(label)
      }
    })

    it('empty label string renders no label element', () => {
      const w = mount(Checkbox, { props: { label: '' } })
      expect(w.find('label').exists()).toBe(false)
      expect(w.find('[data-slot="checkbox-wrapper"]').exists()).toBe(false)
    })

    it('switches between modes when the label appears', async () => {
      const w = mount(Checkbox)
      await w.setProps({ label: 'now labelled' })
      await nextTick()
      expect(w.find('label').exists()).toBe(true)
    })
  })

  describe('Field integration', () => {
    it('takes id, invalid, disabled and describedBy from Field', () => {
      wrapper = mount(Field, {
        props: { label: 'Terms', error: 'Required', hint: 'Read them', disabled: true, id: 'tos' },
        slots: { default: () => h(Checkbox) },
      })
      const cb = wrapper.find('[data-slot="checkbox"]')
      expect(cb.attributes('id')).toBe('tos')
      expect(cb.attributes('aria-invalid')).toBe('true')
      expect(cb.attributes('disabled')).toBeDefined()
      expect(cb.attributes('aria-describedby')).toBe('tos-hint tos-error')
    })

    it('required from Field propagates', () => {
      wrapper = mount(Field, { props: { label: 'T', required: true }, slots: { default: () => h(Checkbox) } })
      expect(wrapper.find('[data-slot="checkbox"]').attributes('aria-required')).toBe('true')
    })
  })
})
