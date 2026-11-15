import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Input from './Input.vue'
import Field from '../Field/Field.vue'

describe('Input', () => {
  it('renders an <input type=text> with data-slot', () => {
    const w = mount(Input)
    expect(w.element.tagName).toBe('INPUT')
    expect(w.attributes('type')).toBe('text')
    expect(w.attributes('data-slot')).toBe('input')
  })

  it('reflects modelValue and emits update:modelValue on input', async () => {
    const w = mount(Input, { props: { modelValue: 'abc' } })
    expect((w.element as HTMLInputElement).value).toBe('abc')
    await w.find('input').setValue('xyz')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['xyz'])
  })

  it('works uncontrolled (internal state via passive v-model)', async () => {
    const w = mount(Input)
    await w.find('input').setValue('hello')
    expect((w.element as HTMLInputElement).value).toBe('hello')
  })

  it('emits a number for type=number', async () => {
    const w = mount(Input, { props: { type: 'number' } })
    await w.find('input').setValue('42')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([42])
  })

  it('emits an empty string (not NaN) when a number input is cleared', async () => {
    const w = mount(Input, { props: { type: 'number', modelValue: 5 } })
    await w.find('input').setValue('')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('treats null/undefined modelValue as empty (edge)', () => {
    expect((mount(Input, { props: { modelValue: null } }).element as HTMLInputElement).value).toBe('')
    expect((mount(Input, { props: { modelValue: undefined } }).element as HTMLInputElement).value).toBe('')
  })

  it('disabled and readonly are forwarded', () => {
    const w = mount(Input, { props: { disabled: true, readonly: true } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('readonly')).toBeDefined()
  })

  it('invalid sets aria-invalid; valid does not', () => {
    expect(mount(Input, { props: { invalid: true } }).attributes('aria-invalid')).toBe('true')
    expect(mount(Input).attributes('aria-invalid')).toBeUndefined()
  })

  it('sizes map to heights; unknown falls back to md', () => {
    expect(mount(Input, { props: { size: 'sm' } }).classes()).toContain('h-8')
    expect(mount(Input, { props: { size: 'lg' } }).classes()).toContain('h-11')
    // @ts-expect-error deliberately invalid
    expect(mount(Input, { props: { size: 'x' } }).classes()).toContain('h-9')
  })

  it('merges class and passes through attrs (placeholder, name, aria-*)', () => {
    const w = mount(Input, { props: { class: 'h-20' }, attrs: { placeholder: 'Email', name: 'email', 'aria-label': 'Email' } })
    expect(w.classes()).toContain('h-20')
    expect(w.classes()).not.toContain('h-9')
    expect(w.attributes('placeholder')).toBe('Email')
    expect(w.attributes('name')).toBe('email')
  })

  it('required sets the attribute; absent otherwise', () => {
    expect(mount(Input, { props: { required: true } }).attributes('required')).toBeDefined()
    expect(mount(Input).attributes('required')).toBeUndefined()
  })

  it('syncs when modelValue changes from outside', async () => {
    const w = mount(Input, { props: { modelValue: 'a' } })
    await w.setProps({ modelValue: 'b' })
    expect((w.element as HTMLInputElement).value).toBe('b')
  })

  it('number input with a non-numeric raw value falls back to the string', async () => {
    const w = mount(Input, { props: { type: 'number' } })
    const el = w.element as HTMLInputElement
    Object.defineProperty(el, 'valueAsNumber', { value: NaN })
    el.value = '5'
    await w.find('input').trigger('input')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['5'])
  })

  it('handles unicode and rapid input', async () => {
    const w = mount(Input)
    for (const v of ['ü', 'üñ', 'üñí🌍']) await w.find('input').setValue(v)
    expect(w.emitted('update:modelValue')).toHaveLength(3)
    expect(w.emitted('update:modelValue')?.[2]).toEqual(['üñí🌍'])
  })

  describe('inside a Field', () => {
    const mountInField = (fieldProps: Record<string, unknown>, inputProps: Record<string, unknown> = {}) =>
      mount(Field, { props: fieldProps, slots: { default: () => h(Input, inputProps) } })

    it('takes id, aria-describedby and aria-invalid from the field', () => {
      const w = mountInField({ id: 'f', hint: 'h', error: 'e' })
      const i = w.find('input')
      expect(i.attributes('id')).toBe('f')
      expect(i.attributes('aria-describedby')).toBe('f-hint f-error')
      expect(i.attributes('aria-invalid')).toBe('true')
    })

    it('field disabled/required propagate; own props still work', () => {
      const w = mountInField({ disabled: true, required: true })
      expect(w.find('input').attributes('disabled')).toBeDefined()
      expect(w.find('input').attributes('required')).toBeDefined()
      const own = mountInField({}, { invalid: true })
      expect(own.find('input').attributes('aria-invalid')).toBe('true')
    })
  })
})
