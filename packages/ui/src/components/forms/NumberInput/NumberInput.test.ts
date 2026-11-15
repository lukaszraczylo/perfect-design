import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NumberInput from './NumberInput.vue'
import Field from '../Field/Field.vue'

const field = (w: ReturnType<typeof mount>) => w.find('input')
const last = (w: ReturnType<typeof mount>) => w.emitted('update:modelValue')?.at(-1)
const type = async (w: ReturnType<typeof mount>, text: string, commit: 'blur' | 'enter' = 'blur') => {
  await field(w).setValue(text)
  if (commit === 'blur') await field(w).trigger('blur')
  else await field(w).trigger('keydown', { key: 'Enter' })
}
const val = (w: ReturnType<typeof mount>) => (field(w).element as HTMLInputElement).value

describe('NumberInput', () => {
  describe('good path', () => {
    it('renders wrapper, text input, and two steppers with data-slots', () => {
      const w = mount(NumberInput)
      expect(w.attributes('data-slot')).toBe('number-input')
      expect(field(w).attributes('data-slot')).toBe('number-input-field')
      expect(field(w).attributes('type')).toBe('text')
      expect(field(w).attributes('inputmode')).toBe('decimal')
      expect(w.find('[data-slot=number-input-decrement]').exists()).toBe(true)
      expect(w.find('[data-slot=number-input-increment]').exists()).toBe(true)
    })

    it('shows modelValue and exposes spinbutton semantics', () => {
      const w = mount(NumberInput, { props: { modelValue: 5, min: 0, max: 10 } })
      const i = field(w)
      expect(val(w)).toBe('5')
      expect(i.attributes('role')).toBe('spinbutton')
      expect(i.attributes('aria-valuenow')).toBe('5')
      expect(i.attributes('aria-valuemin')).toBe('0')
      expect(i.attributes('aria-valuemax')).toBe('10')
    })

    it('omits aria-valuenow/min/max when empty or unbounded', () => {
      const i = field(mount(NumberInput))
      expect(i.attributes('aria-valuenow')).toBeUndefined()
      expect(i.attributes('aria-valuemin')).toBeUndefined()
      expect(i.attributes('aria-valuemax')).toBeUndefined()
    })

    it('commits typed number on blur', async () => {
      const w = mount(NumberInput)
      await type(w, '42')
      expect(last(w)).toEqual([42])
      expect(field(w).attributes('aria-valuenow')).toBe('42')
    })

    it('commits typed number on Enter', async () => {
      const w = mount(NumberInput)
      await type(w, '7', 'enter')
      expect(last(w)).toEqual([7])
    })

    it('does not emit while typing, only on commit', async () => {
      const w = mount(NumberInput)
      await field(w).setValue('12')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('does not re-emit when the committed value is unchanged', async () => {
      const w = mount(NumberInput, { props: { modelValue: 3 } })
      await type(w, '3')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('increment and decrement buttons step', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5, step: 2 } })
      await w.find('[data-slot=number-input-increment]').trigger('click')
      expect(last(w)).toEqual([7])
      await w.find('[data-slot=number-input-decrement]').trigger('click')
      expect(last(w)).toEqual([5])
      expect(val(w)).toBe('5')
    })

    it('ArrowUp/ArrowDown step and prevent default', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5 } })
      const up = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
      field(w).element.dispatchEvent(up)
      expect(up.defaultPrevented).toBe(true)
      await w.vm.$nextTick()
      expect(last(w)).toEqual([6])
      await field(w).trigger('keydown', { key: 'ArrowDown' })
      expect(last(w)).toEqual([5])
    })

    it('PageUp/PageDown step by 10x', async () => {
      const w = mount(NumberInput, { props: { modelValue: 50, step: 2 } })
      await field(w).trigger('keydown', { key: 'PageUp' })
      expect(last(w)).toEqual([70])
      await field(w).trigger('keydown', { key: 'PageDown' })
      expect(last(w)).toEqual([50])
    })

    it('Home/End jump to min/max when defined', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5, min: 1, max: 9 } })
      await field(w).trigger('keydown', { key: 'End' })
      expect(last(w)).toEqual([9])
      await field(w).trigger('keydown', { key: 'Home' })
      expect(last(w)).toEqual([1])
    })

    it('Home/End are ignored without bounds', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5 } })
      await field(w).trigger('keydown', { key: 'Home' })
      await field(w).trigger('keydown', { key: 'End' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('other keys are ignored', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5 } })
      await field(w).trigger('keydown', { key: 'a' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('syncs when the model changes externally', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1 } })
      await w.setProps({ modelValue: 9 })
      expect(val(w)).toBe('9')
      await w.setProps({ modelValue: null })
      expect(val(w)).toBe('')
    })

    it('works with a parent v-model', async () => {
      const n = ref<number | null>(2)
      const Host = defineComponent({
        setup: () => () => h(NumberInput, { modelValue: n.value, 'onUpdate:modelValue': (v: number | null) => (n.value = v) }),
      })
      const w = mount(Host)
      await w.find('[data-slot=number-input-increment]').trigger('click')
      expect(n.value).toBe(3)
    })

    it('empty draft commits null', async () => {
      const w = mount(NumberInput, { props: { modelValue: 4 } })
      await type(w, '')
      expect(last(w)).toEqual([null])
      expect(val(w)).toBe('')
    })

    it('empty draft on an already-empty field does not emit', async () => {
      const w = mount(NumberInput)
      await type(w, '   ')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('clamping and validation', () => {
    it('clamps above max and below min on commit', async () => {
      const w = mount(NumberInput, { props: { min: 0, max: 10 } })
      await type(w, '99')
      expect(last(w)).toEqual([10])
      expect(val(w)).toBe('10')
      await type(w, '-5')
      expect(last(w)).toEqual([0])
    })

    it('clamps stepping at the bounds', async () => {
      const w = mount(NumberInput, { props: { modelValue: 10, min: 0, max: 10 } })
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await field(w).trigger('keydown', { key: 'PageUp' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('disables the steppers at the bounds', () => {
      const atMax = mount(NumberInput, { props: { modelValue: 10, max: 10 } })
      expect(atMax.find('[data-slot=number-input-increment]').attributes('disabled')).toBeDefined()
      expect(atMax.find('[data-slot=number-input-decrement]').attributes('disabled')).toBeUndefined()
      const atMin = mount(NumberInput, { props: { modelValue: 0, min: 0 } })
      expect(atMin.find('[data-slot=number-input-decrement]').attributes('disabled')).toBeDefined()
    })

    it.each(['abc', '1.2.3', '1e3', '--1', '12px', 'Infinity', 'NaN', '٣', '+', '-', '.', ','])(
      'rejects non-numeric %j and reverts to the last valid value',
      async (bad) => {
        const w = mount(NumberInput, { props: { modelValue: 8 } })
        await type(w, bad)
        expect(w.emitted('update:modelValue')).toBeUndefined()
        expect(val(w)).toBe('8')
      },
    )

    it('rejects non-numeric on Enter as well', async () => {
      const w = mount(NumberInput, { props: { modelValue: 8 } })
      await type(w, 'zzz', 'enter')
      expect(val(w)).toBe('8')
    })

    it('reverts to empty when nothing valid was ever committed', async () => {
      const w = mount(NumberInput)
      await type(w, 'abc')
      expect(val(w)).toBe('')
    })

    it.each([
      ['  12  ', 12],
      ['+5', 5],
      ['-3.5', -3.5],
      ['.5', 0.5],
      ['5.', 5],
      ['1,5', 1.5],
      ['1 000', 1000],
      ['007', 7],
    ])('accepts %j as %d', async (input, expected) => {
      const w = mount(NumberInput)
      await type(w, input)
      expect(last(w)).toEqual([expected])
    })

    it('treats NaN / Infinity modelValue as empty', () => {
      expect(val(mount(NumberInput, { props: { modelValue: NaN } }))).toBe('')
      expect(val(mount(NumberInput, { props: { modelValue: Infinity } }))).toBe('')
    })

    it('rejects an absurdly long digit string that overflows to Infinity', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1 } })
      await type(w, '9'.repeat(400))
      expect(val(w)).toBe('1')
    })
  })

  describe('floating point and precision', () => {
    it('steps 0.1 + 0.2 to exactly 0.3', async () => {
      const w = mount(NumberInput, { props: { modelValue: 0.1, step: 0.2 } })
      await w.find('[data-slot=number-input-increment]').trigger('click')
      expect(last(w)).toEqual([0.3])
    })

    it('steps 0.3 - 0.1 to exactly 0.2', async () => {
      const w = mount(NumberInput, { props: { modelValue: 0.3, step: 0.1 } })
      await w.find('[data-slot=number-input-decrement]').trigger('click')
      expect(last(w)).toEqual([0.2])
    })

    it('ten steps of 0.1 land on exactly 1', async () => {
      const w = mount(NumberInput, { props: { modelValue: 0, step: 0.1 } })
      for (let i = 0; i < 10; i++) await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([1])
    })

    it('keeps the decimals of the current value when stepping by an integer', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1.25, step: 1 } })
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([2.25])
    })

    it('handles exponent-form numbers when stepping', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1e-7, step: 1e-7 } })
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([2e-7])
    })

    it('handles exponent-form numbers with precision rounding', async () => {
      const w = mount(NumberInput, { props: { precision: 2 } })
      await w.setProps({ modelValue: 1e-7 })
      await type(w, '0.0000001')
      expect(val(w)).toBe('0.00')
    })

    it('precision rounds typed values and pads the display', async () => {
      const w = mount(NumberInput, { props: { precision: 2 } })
      await type(w, '1.005')
      expect(last(w)).toEqual([1.01])
      expect(val(w)).toBe('1.01')
      await type(w, '1.5')
      expect(last(w)).toEqual([1.5])
      expect(val(w)).toBe('1.50')
    })

    it('precision 0 rounds to integers', async () => {
      const w = mount(NumberInput, { props: { precision: 0 } })
      await type(w, '2.6')
      expect(last(w)).toEqual([3])
    })

    it('precision formats the initial modelValue', () => {
      expect(val(mount(NumberInput, { props: { modelValue: 2, precision: 2 } }))).toBe('2.00')
    })

    it('precision rounding is clamped to the bounds', async () => {
      const w = mount(NumberInput, { props: { precision: 1, max: 1 } })
      await type(w, '1.04')
      expect(last(w)).toEqual([1])
    })

    it('without precision keeps long decimals as typed', async () => {
      const w = mount(NumberInput)
      await type(w, '1.23456789')
      expect(last(w)).toEqual([1.23456789])
    })

    it('handles negative stepping across zero', async () => {
      const w = mount(NumberInput, { props: { modelValue: 0.1, step: 0.2 } })
      await w.find('[data-slot=number-input-decrement]').trigger('click')
      expect(last(w)).toEqual([-0.1])
    })
  })

  describe('stepping from a draft or empty value', () => {
    it('empty + ArrowUp starts from 0 clamped to min', async () => {
      const w = mount(NumberInput, { props: { min: 5 } })
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([5])
    })

    it('empty + ArrowUp gives step when no min', async () => {
      const w = mount(NumberInput, { props: { step: 3 } })
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([3])
    })

    it('steps from a valid uncommitted draft', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1 } })
      await field(w).setValue('20')
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([21])
    })

    it('steps from the last value when the draft is invalid', async () => {
      const w = mount(NumberInput, { props: { modelValue: 4 } })
      await field(w).setValue('abc')
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      expect(last(w)).toEqual([5])
    })

    it('steps from 0 when the draft is cleared', async () => {
      const w = mount(NumberInput, { props: { modelValue: 4 } })
      await field(w).setValue('')
      await field(w).trigger('keydown', { key: 'ArrowDown' })
      expect(last(w)).toEqual([-1])
    })

    it('rapid stepper clicks accumulate', async () => {
      const w = mount(NumberInput, { props: { modelValue: 0 } })
      const btn = w.find('[data-slot=number-input-increment]')
      for (let i = 0; i < 25; i++) await btn.trigger('click')
      expect(last(w)).toEqual([25])
      expect(w.emitted('update:modelValue')).toHaveLength(25)
    })
  })

  describe('disabled and readonly', () => {
    it('disabled disables input and steppers, marks root', () => {
      const w = mount(NumberInput, { props: { disabled: true, modelValue: 1 } })
      expect(field(w).attributes('disabled')).toBeDefined()
      expect(w.find('[data-slot=number-input-increment]').attributes('disabled')).toBeDefined()
      expect(w.find('[data-slot=number-input-decrement]').attributes('disabled')).toBeDefined()
      expect(w.attributes('data-disabled')).toBeDefined()
    })

    it('disabled blocks keyboard stepping and Enter', async () => {
      const w = mount(NumberInput, { props: { disabled: true, modelValue: 1 } })
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      await field(w).trigger('keydown', { key: 'End' })
      await field(w).trigger('keydown', { key: 'Enter' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('readonly blocks stepper buttons, keys and typing', async () => {
      const w = mount(NumberInput, { props: { readonly: true, modelValue: 1 } })
      expect(field(w).attributes('readonly')).toBeDefined()
      await w.find('[data-slot=number-input-increment]').trigger('click')
      await field(w).trigger('keydown', { key: 'ArrowUp' })
      await field(w).setValue('99')
      await field(w).trigger('blur')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(val(w)).toBe('1')
    })

    it('stepping is a no-op when locked even if invoked directly', async () => {
      const w = mount(NumberInput, { props: { disabled: true, modelValue: 1 } })
      await w.find('[data-slot=number-input-increment]').trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last on the root', () => {
      const w = mount(NumberInput, { props: { class: 'h-12 custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('h-12')
      expect(w.classes()).not.toContain('h-9')
    })

    it('passes attrs to the input, not the wrapper', () => {
      const w = mount(NumberInput, { attrs: { name: 'qty', 'aria-label': 'Quantity', 'data-testid': 'q', id: 'my-id' } })
      expect(field(w).attributes('name')).toBe('qty')
      expect(field(w).attributes('aria-label')).toBe('Quantity')
      expect(field(w).attributes('data-testid')).toBe('q')
      expect(field(w).attributes('id')).toBe('my-id')
      expect(w.attributes('data-testid')).toBeUndefined()
    })

    it('forwards placeholder', () => {
      expect(field(mount(NumberInput, { props: { placeholder: '0.00' } })).attributes('placeholder')).toBe('0.00')
    })

    it('hides steppers with showSteppers=false', () => {
      const w = mount(NumberInput, { props: { showSteppers: false } })
      expect(w.find('button').exists()).toBe(false)
    })

    it('stepper buttons have default and custom aria-labels', () => {
      const d = mount(NumberInput)
      expect(d.find('[data-slot=number-input-decrement]').attributes('aria-label')).toBe('Decrease')
      expect(d.find('[data-slot=number-input-increment]').attributes('aria-label')).toBe('Increase')
      const c = mount(NumberInput, { props: { decrementLabel: 'Fewer', incrementLabel: 'More' } })
      expect(c.find('[data-slot=number-input-decrement]').attributes('aria-label')).toBe('Fewer')
      expect(c.find('[data-slot=number-input-increment]').attributes('aria-label')).toBe('More')
    })

    it('steppers are type=button, out of tab order, with decorative icons', () => {
      const w = mount(NumberInput)
      const btn = w.find('[data-slot=number-input-increment]')
      expect(btn.attributes('type')).toBe('button')
      expect(btn.attributes('tabindex')).toBe('-1')
      expect(btn.find('svg').attributes('aria-hidden')).toBe('true')
    })

    it('invalid sets aria-invalid and data-invalid', () => {
      const w = mount(NumberInput, { props: { invalid: true } })
      expect(field(w).attributes('aria-invalid')).toBe('true')
      expect(w.attributes('data-invalid')).toBeDefined()
      expect(field(mount(NumberInput)).attributes('aria-invalid')).toBeUndefined()
    })

    it('required is forwarded', () => {
      expect(field(mount(NumberInput, { props: { required: true } })).attributes('required')).toBeDefined()
      expect(field(mount(NumberInput)).attributes('required')).toBeUndefined()
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid, disabled from Field', () => {
      const w = mount(
        defineComponent({
          components: { Field, NumberInput },
          template: `<Field id="qty" label="Qty" hint="How many" error="Too many" disabled><NumberInput :model-value="1" /></Field>`,
        }),
      )
      const i = w.find('input')
      expect(i.attributes('id')).toBe('qty')
      expect(i.attributes('aria-describedby')).toContain('qty-hint')
      expect(i.attributes('aria-invalid')).toBe('true')
      expect(i.attributes('disabled')).toBeDefined()
    })
  })

  describe('accessibility fixes', () => {
    const status = (w: ReturnType<typeof mount>) => w.find('[data-slot=number-input-status]')
    const tick = async () => {
      await nextTick()
      await nextTick()
    }

    it('has a polite visually hidden status region, empty at rest', () => {
      const w = mount(NumberInput, { props: { modelValue: 1 } })
      expect(status(w).attributes('role')).toBe('status')
      expect(status(w).classes()).toContain('sr-only')
      expect(status(w).text()).toBe('')
    })

    it('announces a revert after non-numeric text', async () => {
      const w = mount(NumberInput, { props: { modelValue: 4 } })
      await type(w, 'abc')
      await tick()
      expect(val(w)).toBe('4')
      expect(status(w).text()).toBe('Not a number, value restored')
    })

    it('uses custom invalid and adjusted labels', async () => {
      const w = mount(NumberInput, { props: { modelValue: 4, max: 10, invalidLabel: 'Nope', adjustedLabel: 'Now' } })
      await type(w, 'x')
      await tick()
      expect(status(w).text()).toBe('Nope')
      await type(w, '99')
      await tick()
      expect(status(w).text()).toBe('Now 10')
    })

    it('announces clamping to max and min', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5, min: 2, max: 8 } })
      await type(w, '50')
      await tick()
      expect(status(w).text()).toBe('Adjusted to 8')
      await type(w, '-4', 'enter')
      await field(w).trigger('blur')
      await tick()
      expect(status(w).text()).toBe('Adjusted to 2')
    })

    it('announces precision rounding', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1, precision: 2 } })
      await type(w, '1.234')
      await tick()
      expect(status(w).text()).toBe('Adjusted to 1.23')
    })

    it('does not announce when the typed number is accepted as is', async () => {
      const w = mount(NumberInput, { props: { modelValue: 1, min: 0, max: 10 } })
      await type(w, '7')
      await tick()
      expect(status(w).text()).toBe('')
    })

    it('announces the new value after a stepper click, including a clamp, because focus stays off the input', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5, max: 6, step: 1, precision: 1 } })
      await w.find('[data-slot=number-input-increment]').trigger('click')
      await tick()
      expect(status(w).text()).toBe('6.0')
      const d = mount(NumberInput, { props: { modelValue: 5, step: 2 } })
      await d.find('[data-slot=number-input-decrement]').trigger('click')
      await tick()
      expect(status(d).text()).toBe('3')
    })

    it('stepper clicks do nothing and stay silent when locked', async () => {
      const w = mount(NumberInput, { props: { modelValue: 5, readonly: true } })
      await w.find('[data-slot=number-input-increment]').trigger('click')
      await tick()
      expect(status(w).text()).toBe('')
    })

    it('uses a numeric keypad for integers and a decimal keypad otherwise', () => {
      expect(field(mount(NumberInput, { props: { precision: 0 } })).attributes('inputmode')).toBe('numeric')
      expect(field(mount(NumberInput, { props: { precision: 2 } })).attributes('inputmode')).toBe('decimal')
      expect(field(mount(NumberInput)).attributes('inputmode')).toBe('decimal')
      expect(field(mount(NumberInput)).attributes('enterkeyhint')).toBe('done')
    })

    it('exposes aria-readonly and aria-valuetext with the formatted value', () => {
      const w = mount(NumberInput, { props: { modelValue: 1.5, precision: 2, readonly: true } })
      expect(field(w).attributes('aria-readonly')).toBe('true')
      expect(field(w).attributes('aria-valuetext')).toBe('1.50')
      const e = mount(NumberInput)
      expect(field(e).attributes('aria-valuetext')).toBeUndefined()
      expect(field(e).attributes('aria-readonly')).toBeUndefined()
    })

    it('has 16px text on small screens, coarse-pointer sizes, logical borders and a forced-colors outline', () => {
      const w = mount(NumberInput)
      expect(field(w).classes()).toEqual(expect.arrayContaining(['text-md', 'md:text-base', 'tabular-nums']))
      expect(w.classes()).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'forced-colors:focus-within:outline-2']))
      const dec = w.find('[data-slot=number-input-decrement]').classes()
      const inc = w.find('[data-slot=number-input-increment]').classes()
      expect(dec).toEqual(expect.arrayContaining(['border-e', 'pointer-coarse:w-11']))
      expect(inc).toContain('border-s')
      expect(dec).not.toContain('border-r')
      expect(inc).not.toContain('border-l')
    })
  })
})
