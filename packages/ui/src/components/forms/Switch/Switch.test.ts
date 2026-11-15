import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import Switch from './Switch.vue'
import { Switch as Exported } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const sw = (w: VueWrapper) => w.find('[data-slot="switch"]')
const thumb = (w: VueWrapper) => w.find('[data-slot="switch-thumb"]')

describe('Switch', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(Switch))

    it('renders a role=switch button with a thumb, off by default', () => {
      const w = mount(Switch)
      const el = sw(w)
      expect(el.element.tagName).toBe('BUTTON')
      expect(el.attributes('role')).toBe('switch')
      expect(el.attributes('aria-checked')).toBe('false')
      expect(el.attributes('data-state')).toBe('unchecked')
      expect(thumb(w).exists()).toBe(true)
    })

    it('reflects modelValue', () => {
      const w = mount(Switch, { props: { modelValue: true } })
      expect(sw(w).attributes('aria-checked')).toBe('true')
      expect(sw(w).attributes('data-state')).toBe('checked')
      expect(thumb(w).attributes('data-state')).toBe('checked')
    })

    it('emits update:modelValue on click; controlled value waits for the parent', async () => {
      const w = mount(Switch, { props: { modelValue: false } })
      await sw(w).trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
      expect(sw(w).attributes('aria-checked')).toBe('false')
      await w.setProps({ modelValue: true })
      expect(sw(w).attributes('aria-checked')).toBe('true')
    })

    it('works uncontrolled, with and without defaultValue', async () => {
      const a = mount(Switch, { props: { defaultValue: true } })
      expect(sw(a).attributes('aria-checked')).toBe('true')
      await sw(a).trigger('click')
      expect(sw(a).attributes('aria-checked')).toBe('false')
      const b = mount(Switch)
      await sw(b).trigger('click')
      expect(sw(b).attributes('aria-checked')).toBe('true')
      expect(b.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('toggles with Enter', async () => {
      const w = mount(Switch)
      await sw(w).trigger('keydown', { key: 'Enter' })
      expect(sw(w).attributes('aria-checked')).toBe('true')
    })

    it('works with v-model in a parent', async () => {
      const on = ref(false)
      wrapper = mount(
        defineComponent({ setup: () => () => h(Switch, { modelValue: on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v) }) }),
      )
      await wrapper.find('button').trigger('click')
      expect(on.value).toBe(true)
    })

    it.each([
      ['sm', 'h-4', 'size-3'],
      ['md', 'h-5', 'size-4'],
      ['lg', 'h-6', 'size-5'],
    ] as const)('applies the %s size to track and thumb', (size, track, th) => {
      const w = mount(Switch, { props: { size } })
      expect(sw(w).classes()).toContain(track)
      expect(thumb(w).classes()).toContain(th)
    })

    it('forwards name/value to the hidden input inside a form', () => {
      const Host = defineComponent({ setup: () => () => h('form', null, [h(Switch, { name: 'notify', value: 'on', modelValue: true })]) })
      wrapper = mount(Host, { attachTo: document.body })
      const input = wrapper.find('input[type="checkbox"]')
      expect(input.attributes('name')).toBe('notify')
    })
  })

  describe('customisation', () => {
    it('merges class last and wins over internal classes', () => {
      const w = mount(Switch, { props: { class: 'h-10 custom' } })
      expect(sw(w).classes()).toContain('custom')
      expect(sw(w).classes()).toContain('h-10')
      expect(sw(w).classes()).not.toContain('h-5')
    })

    it('passes attrs through (aria-label, data-*)', () => {
      const w = mount(Switch, { attrs: { 'aria-label': 'Wi-Fi', 'data-testid': 'wifi' } })
      expect(sw(w).attributes('aria-label')).toBe('Wi-Fi')
      expect(sw(w).attributes('data-testid')).toBe('wifi')
    })

    it('id prop is applied', () => {
      expect(sw(mount(Switch, { props: { id: 'sw1' } })).attributes('id')).toBe('sw1')
    })
  })

  describe('bad path', () => {
    it('disabled blocks toggling', async () => {
      const w = mount(Switch, { props: { disabled: true } })
      expect(sw(w).attributes('disabled')).toBeDefined()
      await sw(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(sw(w).attributes('aria-checked')).toBe('false')
    })

    it('invalid sets aria-invalid', () => {
      expect(sw(mount(Switch, { props: { invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(sw(mount(Switch)).attributes('aria-invalid')).toBeUndefined()
    })

    it('unknown size falls back to md', () => {
      const w = mount(Switch, { props: { size: 'xxl' as never } })
      expect(sw(w).classes()).toContain('h-5')
      expect(thumb(w).classes()).toContain('size-4')
    })

    it('null modelValue is off', () => {
      expect(sw(mount(Switch, { props: { modelValue: null } })).attributes('aria-checked')).toBe('false')
    })

    it('required sets aria-required', () => {
      expect(sw(mount(Switch, { props: { required: true } })).attributes('aria-required')).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('rapid toggling emits each change', async () => {
      const w = mount(Switch)
      for (let i = 0; i < 7; i++) await sw(w).trigger('click')
      expect(w.emitted('update:modelValue')).toHaveLength(7)
      expect(sw(w).attributes('aria-checked')).toBe('true')
    })

    it('can be toggled externally while mounted', async () => {
      const w = mount(Switch, { props: { modelValue: false } })
      await w.setProps({ modelValue: true })
      await w.setProps({ modelValue: false })
      expect(sw(w).attributes('data-state')).toBe('unchecked')
    })
  })

  describe('Field integration', () => {
    it('takes id, invalid, disabled and aria-describedby from Field', () => {
      wrapper = mount(Field, {
        props: { label: 'Notify', hint: 'Emails only', error: 'Nope', id: 'notify', disabled: true },
        slots: { default: () => h(Switch) },
      })
      const el = wrapper.find('[data-slot="switch"]')
      expect(el.attributes('id')).toBe('notify')
      expect(el.attributes('aria-invalid')).toBe('true')
      expect(el.attributes('aria-describedby')).toBe('notify-hint notify-error')
      expect(el.attributes('disabled')).toBeDefined()
    })

    it('an explicit id prop wins over the Field id', () => {
      wrapper = mount(Field, { props: { label: 'X', id: 'a' }, slots: { default: () => h(Switch, { id: 'b' }) } })
      expect(wrapper.find('[data-slot="switch"]').attributes('id')).toBe('b')
    })
  })
})
