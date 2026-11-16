import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import DateInput from './DateInput.vue'
import Field from '../Field/Field.vue'

const field = (w: ReturnType<typeof mount>) => w.find('input')
const msg = (w: ReturnType<typeof mount>) => w.find('[data-slot=date-input-message]')
const last = (w: ReturnType<typeof mount>, name = 'update:modelValue') => w.emitted(name)?.at(-1)

describe('DateInput', () => {
  describe('good path', () => {
    it('renders wrapper, input type=date by default, data-slots', () => {
      const w = mount(DateInput)
      expect(w.attributes('data-slot')).toBe('date-input')
      expect(field(w).attributes('data-slot')).toBe('date-input-field')
      expect(field(w).attributes('type')).toBe('date')
    })

    it.each(['date', 'time', 'datetime-local', 'month'] as const)('supports type=%s', (type) => {
      expect(field(mount(DateInput, { props: { type } })).attributes('type')).toBe(type)
    })

    it('reflects modelValue and emits on input', async () => {
      const w = mount(DateInput, { props: { modelValue: '2024-05-01' } })
      expect((field(w).element as HTMLInputElement).value).toBe('2024-05-01')
      await field(w).setValue('2024-06-02')
      expect(last(w)).toEqual(['2024-06-02'])
    })

    it('works uncontrolled', async () => {
      const w = mount(DateInput)
      await field(w).setValue('2024-01-15')
      expect((field(w).element as HTMLInputElement).value).toBe('2024-01-15')
    })

    it('syncs external modelValue changes, treating null as empty', async () => {
      const w = mount(DateInput, { props: { modelValue: '2024-05-01' } })
      await w.setProps({ modelValue: '2025-01-01' })
      expect((field(w).element as HTMLInputElement).value).toBe('2025-01-01')
      await w.setProps({ modelValue: null })
      expect((field(w).element as HTMLInputElement).value).toBe('')
    })

    it('works with a parent v-model', async () => {
      const v = ref('')
      const Host = defineComponent({
        setup: () => () => h(DateInput, { modelValue: v.value, 'onUpdate:modelValue': (x: string) => (v.value = x) }),
      })
      const w = mount(Host)
      await w.find('input').setValue('2024-03-03')
      expect(v.value).toBe('2024-03-03')
    })

    it('forwards min and max natively', () => {
      const w = mount(DateInput, { props: { min: '2024-01-01', max: '2024-12-31' } })
      expect(field(w).attributes('min')).toBe('2024-01-01')
      expect(field(w).attributes('max')).toBe('2024-12-31')
    })

    it('works for time values', async () => {
      const w = mount(DateInput, { props: { type: 'time', min: '09:00', max: '17:00' } })
      await field(w).setValue('12:30')
      expect(last(w)).toEqual(['12:30'])
      expect(msg(w).text()).toBe('')
    })

    it('works for month and datetime-local values', async () => {
      const m = mount(DateInput, { props: { type: 'month', min: '2024-03' } })
      await field(m).setValue('2024-02')
      expect(msg(m).text()).toBe('Must be on or after 2024-03')
      const d = mount(DateInput, { props: { type: 'datetime-local', max: '2024-05-01T10:00' } })
      await field(d).setValue('2024-05-01T11:00')
      expect(msg(d).text()).toBe('Must be on or before 2024-05-01T10:00')
    })
  })

  describe('min/max validation', () => {
    it('flags values before min with default message, aria-invalid and events', async () => {
      const w = mount(DateInput, { props: { min: '2024-01-01' } })
      await field(w).setValue('2023-12-31')
      expect(field(w).attributes('aria-invalid')).toBe('true')
      expect(msg(w).text()).toBe('Must be on or after 2024-01-01')
      expect(last(w, 'invalid')).toEqual([{ valid: false, reason: 'min', message: 'Must be on or after 2024-01-01', value: '2023-12-31' }])
      expect(last(w, 'validate')?.[0]).toMatchObject({ valid: false, reason: 'min' })
      expect(last(w)).toEqual(['2023-12-31'])
    })

    it('flags values after max', async () => {
      const w = mount(DateInput, { props: { max: '2024-12-31' } })
      await field(w).setValue('2025-01-01')
      expect(msg(w).text()).toBe('Must be on or before 2024-12-31')
      expect(last(w, 'invalid')?.[0]).toMatchObject({ reason: 'max' })
    })

    it('boundary values are valid', async () => {
      const w = mount(DateInput, { props: { min: '2024-01-01', max: '2024-12-31' } })
      await field(w).setValue('2024-01-01')
      expect(msg(w).text()).toBe('')
      await field(w).setValue('2024-12-31')
      expect(msg(w).text()).toBe('')
      expect(w.emitted('invalid')).toBeUndefined()
      expect(last(w, 'validate')?.[0]).toEqual({ valid: true, reason: null, message: null, value: '2024-12-31' })
    })

    it('clears the message once the value is valid again', async () => {
      const w = mount(DateInput, { props: { min: '2024-01-01' } })
      await field(w).setValue('2020-01-01')
      expect(msg(w).text()).not.toBe('')
      await field(w).setValue('2024-06-01')
      expect(msg(w).text()).toBe('')
      expect(field(w).attributes('aria-invalid')).toBeUndefined()
    })

    it('empty value is valid even with min/max', async () => {
      const w = mount(DateInput, { props: { min: '2024-01-01', max: '2024-12-31', modelValue: '2024-06-01' } })
      await field(w).setValue('')
      expect(msg(w).text()).toBe('')
      expect(last(w, 'validate')?.[0]).toMatchObject({ valid: true })
      expect(w.emitted('invalid')).toBeUndefined()
    })

    it('validates an out-of-range controlled initial value without emitting', () => {
      const w = mount(DateInput, { props: { min: '2024-01-01', modelValue: '2020-01-01' } })
      expect(msg(w).text()).not.toBe('')
      expect(w.emitted('invalid')).toBeUndefined()
    })

    it('re-validates when an external value arrives', async () => {
      const w = mount(DateInput, { props: { max: '2024-12-31', modelValue: '2024-01-01' } })
      await w.setProps({ modelValue: '2030-01-01' })
      expect(msg(w).text()).not.toBe('')
    })

    it('uses custom messages with {min}/{max} placeholders', async () => {
      const w = mount(DateInput, {
        props: { min: '2024-01-01', max: '2024-12-31', messages: { min: 'Too early (>= {min})', max: 'Too late' } },
      })
      await field(w).setValue('2023-01-01')
      expect(msg(w).text()).toBe('Too early (>= 2024-01-01)')
      await field(w).setValue('2026-01-01')
      expect(msg(w).text()).toBe('Too late')
    })

    it('partial custom messages fall back to defaults', async () => {
      const w = mount(DateInput, { props: { max: '2024-12-31', messages: { min: 'x' } } })
      await field(w).setValue('2026-01-01')
      expect(msg(w).text()).toBe('Must be on or before 2024-12-31')
    })

    it('links the message through aria-describedby and the message is polite-live', async () => {
      const w = mount(DateInput, { props: { min: '2024-01-01' } })
      await field(w).setValue('2000-01-01')
      const id = msg(w).attributes('id')!
      expect(field(w).attributes('aria-describedby')).toBe(id)
      expect(msg(w).attributes('aria-live')).toBe('polite')
    })

    it('invalid prop marks the field invalid without a message', () => {
      const w = mount(DateInput, { props: { invalid: true } })
      expect(field(w).attributes('aria-invalid')).toBe('true')
      expect(msg(w).text()).toBe('')
    })

    it('a valid field has no aria-invalid or aria-describedby', () => {
      const w = mount(DateInput, { props: { modelValue: '2024-01-01' } })
      expect(field(w).attributes('aria-invalid')).toBeUndefined()
      expect(field(w).attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('disabled and readonly', () => {
    it('disabled and readonly are forwarded', () => {
      const w = mount(DateInput, { props: { disabled: true, readonly: true } })
      expect(field(w).attributes('disabled')).toBeDefined()
      expect(field(w).attributes('readonly')).toBeDefined()
    })

    it('readonly blocks changes and reverts the DOM value', async () => {
      const w = mount(DateInput, { props: { readonly: true, modelValue: '2024-01-01' } })
      await field(w).setValue('2025-05-05')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(w.emitted('validate')).toBeUndefined()
      expect((field(w).element as HTMLInputElement).value).toBe('2024-01-01')
    })

    it('disabled blocks changes even if an input event slips through', async () => {
      const w = mount(DateInput, { props: { disabled: true, modelValue: '2024-01-01' } })
      await field(w).setValue('2025-05-05')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('required is forwarded', () => {
      expect(field(mount(DateInput, { props: { required: true } })).attributes('required')).toBeDefined()
      expect(field(mount(DateInput)).attributes('required')).toBeUndefined()
    })
  })

  describe('bad path and edge cases', () => {
    it('rejects malformed values: jsdom sanitises them to empty', async () => {
      const w = mount(DateInput)
      await field(w).setValue('not-a-date')
      expect(last(w)).toEqual([''])
    })

    it('an impossible date is sanitised to empty', async () => {
      const w = mount(DateInput)
      await field(w).setValue('2024-02-30')
      expect(last(w)).toEqual([''])
    })

    it('handles leap days', async () => {
      const w = mount(DateInput, { props: { min: '2024-02-29', max: '2024-02-29' } })
      await field(w).setValue('2024-02-29')
      expect(msg(w).text()).toBe('')
      await field(w).setValue('2024-03-01')
      expect(msg(w).text()).toContain('before')
    })

    it('rapid changes keep the latest value and validation', async () => {
      const w = mount(DateInput, { props: { min: '2024-01-01' } })
      for (let d = 1; d <= 9; d++) await field(w).setValue(`2023-01-0${d}`)
      expect(w.emitted('update:modelValue')).toHaveLength(9)
      expect(msg(w).text()).not.toBe('')
      expect(w.emitted('invalid')).toHaveLength(9)
    })

    it('ignores min/max that are empty strings', async () => {
      const w = mount(DateInput, { props: { min: '', max: '' } })
      await field(w).setValue('1999-01-01')
      expect(msg(w).text()).toBe('')
    })
  })

  describe('customisation', () => {
    it('merges class last on the input', () => {
      const w = mount(DateInput, { props: { class: 'h-12 custom' } })
      expect(field(w).classes()).toContain('custom')
      expect(field(w).classes()).toContain('h-12')
      expect(field(w).classes()).not.toContain('h-9')
    })

    it('uses the shared field surface', () => {
      expect(field(mount(DateInput)).classes()).toContain('border-input')
    })

    it('passes attrs to the input', () => {
      const w = mount(DateInput, { attrs: { name: 'dob', 'aria-label': 'Birth date', 'data-testid': 'd', id: 'my-id' } })
      expect(field(w).attributes('name')).toBe('dob')
      expect(field(w).attributes('aria-label')).toBe('Birth date')
      expect(field(w).attributes('data-testid')).toBe('d')
      expect(field(w).attributes('id')).toBe('my-id')
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid and disabled from Field, and appends its own message id', async () => {
      const w = mount(
        defineComponent({
          components: { Field, DateInput },
          template: `<Field id="dob" hint="Hint" disabled><DateInput min="2024-01-01" model-value="2020-01-01" /></Field>`,
        }),
      )
      const i = w.find('input')
      expect(i.attributes('id')).toBe('dob')
      expect(i.attributes('disabled')).toBeDefined()
      const describedBy = i.attributes('aria-describedby')!
      expect(describedBy).toContain('dob-hint')
      expect(describedBy).toContain(w.find('[data-slot=date-input-message]').attributes('id')!)
    })

    it('Field error marks invalid', () => {
      const w = mount(
        defineComponent({
          components: { Field, DateInput },
          template: `<Field error="Required"><DateInput /></Field>`,
        }),
      )
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
    })
  })
})

describe('DateInput: accessibility regressions', () => {
  it('the message region is always rendered (persistent live region), empty and visually hidden when valid', async () => {
    const w = mount(DateInput, { props: { min: '2024-01-01' } })
    const m = msg(w)
    expect(m.exists()).toBe(true)
    expect(m.attributes('role')).toBe('status')
    expect(m.attributes('aria-live')).toBe('polite')
    expect(m.classes()).toContain('sr-only')
    expect(field(w).attributes('aria-describedby')).toBeUndefined() // an empty region is not a description
    const el = m.element
    await field(w).setValue('2000-01-01')
    expect(msg(w).element).toBe(el) // the same node gets the text, so it is announced
    expect(msg(w).classes()).not.toContain('sr-only')
    expect(msg(w).classes()).toContain('text-destructive')
    expect(field(w).attributes('aria-describedby')).toBe(msg(w).attributes('id'))
  })

  it('appends its message id to a caller aria-describedby instead of replacing it', async () => {
    const w = mount(DateInput, { props: { min: '2024-01-01', modelValue: '2020-01-01' }, attrs: { 'aria-describedby': 'mine' } })
    expect(field(w).attributes('aria-describedby')).toBe(`mine ${msg(w).attributes('id')}`)
  })

  it('is 16px on mobile, 14px from md, with a 44px coarse-pointer height and never wider than its container', () => {
    const cls = field(mount(DateInput)).classes()
    expect(cls).toEqual(expect.arrayContaining(['text-md', 'md:text-sm', 'pointer-coarse:min-h-11', 'w-full', 'min-w-0']))
  })

  it('aria-invalid is only set with an associated message or an explicit invalid', async () => {
    const w = mount(DateInput, { props: { min: '2024-01-01' } })
    expect(field(w).attributes('aria-invalid')).toBeUndefined()
    await field(w).setValue('2000-01-01')
    expect(field(w).attributes('aria-invalid')).toBe('true')
    expect(field(w).attributes('aria-describedby')).toContain(msg(w).attributes('id')!)
  })
})

describe('DateInput controlled rejection', () => {
  it('shows the prop value again when the parent does not accept the emitted value', async () => {
    const w = mount(DateInput, { props: { modelValue: '2025-01-02', 'aria-label': 'x' }, attachTo: document.body })
    const el = w.find('input')
    await el.setValue('2025-02-03')
    await nextTick()
    await nextTick()
    expect((el.element as HTMLInputElement).value).toBe('2025-01-02')
    w.unmount()
  })
  it('stays uncontrolled when modelValue is omitted', async () => {
    const w = mount(DateInput, { props: { 'aria-label': 'x' }, attachTo: document.body })
    const el = w.find('input')
    await el.setValue('2025-02-03')
    await nextTick()
    await nextTick()
    expect((el.element as HTMLInputElement).value).toBe('2025-02-03')
    w.unmount()
  })
})
