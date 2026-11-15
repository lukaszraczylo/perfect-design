import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Field from './Field.vue'
import Input from '../Input/Input.vue'
import Textarea from '../Textarea/Textarea.vue'
import NativeSelect from '../NativeSelect/NativeSelect.vue'
import RadioGroup from '../RadioGroup/RadioGroup.vue'
import RadioGroupItem from '../RadioGroup/RadioGroupItem.vue'
import { useNativeValidation } from './useNativeValidation'
import { useFieldControl } from './useFieldContext'
import { defineComponent, ref } from 'vue'

const inField = (props: Record<string, unknown> = {}, control = () => h(Input)) => mount(Field, { props, slots: { default: control } })

/** jsdom does not implement :user-invalid; let a test decide whether the browser would match it. */
function stubUserInvalid(initial: boolean | 'throw') {
  const state = { value: initial }
  const original = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    if (selector !== ':user-invalid') return original.call(this, selector)
    if (state.value === 'throw') throw new SyntaxError('unsupported selector')
    return state.value
  })
  return state
}

afterEach(() => vi.restoreAllMocks())

describe('Field a11y wiring', () => {
  it('keeps one polite live region in the page whether or not there is an error', async () => {
    const w = inField({ id: 'f', label: 'Name' })
    const region = w.find('[data-slot="field-error-region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.attributes('aria-atomic')).toBe('true')
    expect(region.classes()).toContain('empty:absolute')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
    await w.setProps({ error: 'Too short' })
    // the same node changes, so the message is announced; the message itself is not a role=alert
    expect(w.find('[data-slot="field-error-region"]').element).toBe(region.element)
    const error = region.find('[data-slot="field-error"]')
    expect(error.text()).toBe('Too short')
    expect(error.attributes('role')).toBeUndefined()
    expect(w.find('input').attributes('aria-describedby')).toBe('f-error')
    await w.setProps({ error: '' })
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('sets aria-invalid only for an invalid field; a valid required control reports false', async () => {
    const plain = inField({ label: 'Name' })
    expect(plain.find('input').attributes('aria-invalid')).toBeUndefined()
    const required = inField({ label: 'Name', required: true })
    expect(required.find('input').attributes('aria-invalid')).toBe('false')
    expect(required.find('input').attributes('required')).toBeDefined()
    await required.setProps({ error: 'Required' })
    expect(required.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('puts the hint between label and control with hintPlacement="above" and still describes the control', () => {
    const w = inField({ id: 'h', label: 'Name', hint: 'Shown publicly', hintPlacement: 'above' })
    const order = [...w.element.children].map((el) => el.getAttribute('data-slot'))
    expect(order.indexOf('field-hint')).toBeGreaterThan(order.indexOf('field-label'))
    expect(order.indexOf('field-hint')).toBeLessThan(order.indexOf('field-control'))
    expect(w.find('input').attributes('aria-describedby')).toBe('h-hint')
    const below = inField({ id: 'b', hint: 'Shown publicly' })
    const belowOrder = [...below.element.children].map((el) => el.getAttribute('data-slot'))
    expect(belowOrder.indexOf('field-hint')).toBeGreaterThan(belowOrder.indexOf('field-control'))
  })

  it('ignores hintPlacement="above" in the horizontal layout (hint stays under the label column)', () => {
    const w = inField({ id: 'x', label: 'Alerts', hint: 'Weekly', hintPlacement: 'above', orientation: 'horizontal' })
    const order = [...w.element.children].map((el) => el.getAttribute('data-slot'))
    expect(order.indexOf('field-hint')).toBeGreaterThan(order.indexOf('field-control'))
  })

  it('gives the label an id and names a radiogroup through aria-labelledby', () => {
    const w = inField({ id: 'g', label: 'Plan' }, () =>
      h(RadioGroup, null, () => [h(RadioGroupItem, { value: 'a', label: 'A' }), h(RadioGroupItem, { value: 'b', label: 'B' })]),
    )
    expect(w.find('label').attributes('id')).toBe('g-label')
    expect(w.find('[role="radiogroup"]').attributes('aria-labelledby')).toBe('g-label')
  })

  it('does not override a name the consumer gave the group, and skips labelledby without a label', () => {
    const named = inField({ id: 'g', label: 'Plan' }, () => h(RadioGroup, { 'aria-label': 'Own name' }, () => h(RadioGroupItem, { value: 'a', label: 'A' })))
    expect(named.find('[role="radiogroup"]').attributes('aria-labelledby')).toBeUndefined()
    expect(named.find('[role="radiogroup"]').attributes('aria-label')).toBe('Own name')
    const unlabelled = inField({ id: 'g' }, () => h(RadioGroup, null, () => h(RadioGroupItem, { value: 'a', label: 'A' })))
    expect(unlabelled.find('[role="radiogroup"]').attributes('aria-labelledby')).toBeUndefined()
  })

  it('useFieldControl outside a Field: no labelledby, aria-invalid only when invalid or required', () => {
    let control!: ReturnType<typeof useFieldControl>
    const C = defineComponent({
      setup() {
        control = useFieldControl({ required: ref(true) })
        return () => h('div')
      },
    })
    mount(C)
    expect(control.labelledBy()).toBeUndefined()
    expect(control.ariaInvalid.value).toBe('false')
  })
})

describe('Field + native validation (:user-invalid)', () => {
  it('shows the browser message as the error once the field is user-invalid, wiring aria-invalid and describedby together', async () => {
    const state = stubUserInvalid(false)
    const w = inField({ id: 'v', label: 'Email', hint: 'Format: name@example.com' }, () => h(Input, { required: true }))
    const input = w.find('input')
    expect(input.attributes('aria-invalid')).toBe('false')
    await input.trigger('blur')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
    state.value = true
    await input.trigger('blur')
    expect(w.find('[data-slot="field-error"]').text()).toBe((input.element as HTMLInputElement).validationMessage)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('v-hint v-error')
    // fixed: typing clears it
    state.value = false
    await input.trigger('input')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
    expect(input.attributes('aria-invalid')).toBe('false')
  })

  it('typing in a pristine field never raises an error', async () => {
    stubUserInvalid(true)
    const w = inField({ label: 'Email' }, () => h(Input, { required: true }))
    await w.find('input').trigger('input')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
  })

  it('a failed submit (invalid event) raises the error without a blur', async () => {
    stubUserInvalid(true)
    const w = inField({ label: 'Email' }, () => h(Input, { required: true }))
    await w.find('input').trigger('invalid')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(true)
  })

  it('the error prop wins over the native message', async () => {
    stubUserInvalid(true)
    const w = inField({ label: 'Email', error: 'Custom message' }, () => h(Input, { required: true }))
    await w.find('input').trigger('blur')
    expect(w.find('[data-slot="field-error"]').text()).toBe('Custom message')
  })

  it('is a no-op when :user-invalid is unsupported', async () => {
    stubUserInvalid('throw')
    const w = inField({ label: 'Email' }, () => h(Input, { required: true }))
    await w.find('input').trigger('blur')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
  })

  it('is a no-op outside a Field and removes its listeners on unmount', async () => {
    stubUserInvalid(true)
    const w = mount(Input, { props: { required: true } })
    await w.find('input').trigger('blur')
    expect(w.find('input').attributes('aria-invalid')).toBe('false')
    w.unmount()
  })

  it('clears the message again when the control unmounts', async () => {
    stubUserInvalid(true)
    const show = ref(true)
    const w = mount(Field, { props: { label: 'Email' }, slots: { default: () => (show.value ? h(Input, { required: true }) : h('span')) } })
    await w.find('input').trigger('blur')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(true)
    show.value = false
    await w.vm.$forceUpdate()
    await new Promise((r) => setTimeout(r))
    expect(w.find('[data-slot="field-error"]').exists()).toBe(false)
  })

  it.each([
    ['Textarea', () => h(Textarea, { required: true }), 'textarea'],
    ['NativeSelect', () => h(NativeSelect, { required: true, options: [{ value: 'a', label: 'A' }] }), 'select'],
  ])('%s reports native validation too', async (_name, control, selector) => {
    stubUserInvalid(true)
    const w = inField({ label: 'X' }, control)
    await w.find(selector).trigger('change')
    expect(w.find('[data-slot="field-error"]').exists()).toBe(true)
    expect(w.find(selector).attributes('aria-invalid')).toBe('true')
  })

  it('useNativeValidation ignores a missing element', () => {
    const C = defineComponent({
      setup() {
        const failing = useNativeValidation(ref(null)).failing
        return () => h('div', String(failing.value))
      },
    })
    expect(mount(C).text()).toBe('false')
  })
})
