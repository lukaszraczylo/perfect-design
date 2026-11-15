import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Field from './Field.vue'
import Input from '../Input/Input.vue'
import Textarea from '../Textarea/Textarea.vue'
import { useFieldContext, useFieldControl } from './useFieldContext'

const withInput = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(Field, { props, slots: { default: () => h(Input), ...slots } })

describe('Field', () => {
  describe('good path', () => {
    it('renders label, control and wires for/id', () => {
      const w = withInput({ label: 'Email', id: 'email' })
      expect(w.attributes('data-slot')).toBe('field')
      const label = w.find('label')
      expect(label.text()).toBe('Email')
      expect(label.attributes('for')).toBe('email')
      expect(w.find('input').attributes('id')).toBe('email')
    })

    it('generates a unique id when none is given', () => {
      const Two = defineComponent({
        components: { Field, Input },
        template: '<div><Field label="A"><Input /></Field><Field label="B"><Input /></Field></div>',
      })
      const w = mount(Two)
      const [a, b] = w.findAll('input')
      expect(a.attributes('id')).toBeTruthy()
      expect(a.attributes('id')).not.toBe(b.attributes('id'))
      expect(w.find('label').attributes('for')).toBe(a.attributes('id'))
    })

    it('shows the hint and references it with aria-describedby', () => {
      const w = withInput({ label: 'Name', hint: 'As on your passport', id: 'n' })
      const hint = w.find('[data-slot="field-hint"]')
      expect(hint.text()).toBe('As on your passport')
      expect(hint.attributes('id')).toBe('n-hint')
      expect(w.find('input').attributes('aria-describedby')).toBe('n-hint')
    })

    it('shows the error, sets aria-invalid and describes with hint + error', () => {
      const w = withInput({ label: 'Name', hint: 'h', error: 'Required', id: 'n' })
      const err = w.find('[data-slot="field-error"]')
      expect(err.text()).toBe('Required')
      // announced through the persistent polite live region, not by making the message itself an alert
      expect(err.attributes('role')).toBeUndefined()
      expect(err.element.parentElement?.getAttribute('aria-live')).toBe('polite')
      const input = w.find('input')
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-describedby')).toBe('n-hint n-error')
      expect(w.attributes('data-invalid')).toBeDefined()
    })

    it('required shows the indicator and sets required on the control', () => {
      const w = withInput({ label: 'Name', required: true })
      expect(w.find('[data-slot="label-required"]').exists()).toBe(true)
      expect(w.find('input').attributes('required')).toBeDefined()
    })

    it('disabled propagates to label and control', () => {
      const w = withInput({ label: 'Name', disabled: true })
      expect(w.find('input').attributes('disabled')).toBeDefined()
      expect(w.find('label').classes()).toContain('opacity-50')
      expect(w.attributes('data-disabled')).toBeDefined()
    })

    it('works with Textarea too', () => {
      const w = mount(Field, { props: { label: 'Bio', error: 'Too short', id: 'bio' }, slots: { default: () => h(Textarea) } })
      const ta = w.find('textarea')
      expect(ta.attributes('id')).toBe('bio')
      expect(ta.attributes('aria-invalid')).toBe('true')
      expect(ta.attributes('aria-describedby')).toBe('bio-error')
    })

    it('supports label/hint/error slots', () => {
      const w = mount(Field, {
        slots: { default: () => h(Input), label: '<b>Rich</b>', hint: '<i>hint</i>', error: '<u>err</u>' },
      })
      expect(w.find('label b').exists()).toBe(true)
      expect(w.find('[data-slot="field-hint"] i').exists()).toBe(true)
      expect(w.find('[data-slot="field-error"] u').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class', () => {
      const w = withInput({ class: 'gap-6 custom' })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-1.5')
    })

    it('horizontal orientation sets data-orientation and layout classes', () => {
      const w = withInput({ label: 'x', orientation: 'horizontal' })
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(w.classes().join(' ')).toContain('grid-cols-[auto_1fr]')
    })

    it('control keeps an explicit id/aria-describedby attribute over the field values', () => {
      const w = mount(Field, {
        props: { label: 'x', hint: 'h', id: 'a' },
        slots: { default: () => h(Input, { id: 'custom', 'aria-describedby': 'mine' }) },
      })
      expect(w.find('input').attributes('id')).toBe('custom')
      expect(w.find('input').attributes('aria-describedby')).toBe('mine')
    })
  })

  describe('bad path', () => {
    it('invalid without message sets aria-invalid but renders no error element', () => {
      const w = withInput({ invalid: true })
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
    })

    it('valid field has no aria-invalid / aria-describedby', () => {
      const w = withInput({ label: 'x' })
      expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
      expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
    })

    it('empty error string is treated as no error', () => {
      const w = withInput({ error: '' })
      expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
    })

    it('removing the error clears invalid state reactively', async () => {
      const w = withInput({ error: 'bad', id: 'z' })
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      await w.setProps({ error: '' })
      expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('renders without a label', () => {
      const w = withInput()
      expect(w.find('label').exists()).toBe(false)
    })

    it('handles unicode label and error', () => {
      const w = withInput({ label: 'メール', error: 'Ошибка ✗' })
      expect(w.find('label').text()).toBe('メール')
      expect(w.find('[data-slot="field-error"]').text()).toBe('Ошибка ✗')
    })
  })
})

describe('useFieldContext / useFieldControl', () => {
  it('useFieldContext returns null outside a Field', () => {
    let ctx: unknown = 'unset'
    mount(defineComponent({ setup: () => { ctx = useFieldContext(); return () => h('div') } }))
    expect(ctx).toBeNull()
  })

  it('useFieldControl standalone uses own props only', () => {
    let c!: ReturnType<typeof useFieldControl>
    mount(defineComponent({ setup: () => { c = useFieldControl({ invalid: true, disabled: () => false }); return () => h('div') } }))
    expect(c.invalid.value).toBe(true)
    expect(c.disabled.value).toBe(false)
    expect(c.required.value).toBe(false)
    expect(c.id.value).toBeUndefined()
    expect(c.describedBy.value).toBeUndefined()
  })

  it('own props OR with field state', () => {
    let c!: ReturnType<typeof useFieldControl>
    const Child = defineComponent({ setup: () => { c = useFieldControl({ disabled: true }); return () => h('div') } })
    mount(Field, { props: { invalid: true, required: true, id: 'q' }, slots: { default: () => h(Child) } })
    expect(c.disabled.value).toBe(true)
    expect(c.invalid.value).toBe(true)
    expect(c.required.value).toBe(true)
    expect(c.id.value).toBe('q')
  })
})
