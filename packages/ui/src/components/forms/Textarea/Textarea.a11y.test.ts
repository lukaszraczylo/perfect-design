import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Textarea from './Textarea.vue'
import Field from '../Field/Field.vue'

afterEach(() => vi.useRealTimers())

describe('Textarea a11y', () => {
  it('keeps a consumer id and aria-describedby, and merges them with the Field wiring', () => {
    const alone = mount(Textarea, { attrs: { id: 'mine', 'aria-describedby': 'extra' } }).find('textarea')
    expect(alone.attributes('id')).toBe('mine')
    expect(alone.attributes('aria-describedby')).toBe('extra')
    const w = mount(Field, { props: { id: 'f', hint: 'h', error: 'e' }, slots: { default: () => h(Textarea, { 'aria-describedby': 'extra' }) } })
    const t = w.find('textarea')
    expect(t.attributes('id')).toBe('f')
    expect(t.attributes('aria-describedby')).toBe('f-hint f-error extra')
    expect(t.attributes('aria-invalid')).toBe('true')
  })

  it('the counter is not a live region (it would announce every keystroke) but describes the field', () => {
    const w = mount(Textarea, { props: { maxlength: 10, showCount: true, modelValue: 'abc' } })
    const count = w.find('[data-slot="textarea-count"]')
    expect(count.attributes('aria-live')).toBeUndefined()
    expect(count.text()).toBe('3 / 10')
    expect(count.classes()).toContain('tabular-nums')
    expect(w.find('textarea').attributes('aria-describedby')).toBe(count.attributes('id'))
  })

  it('announces only when the limit is reached, through a separate status region', async () => {
    const w = mount(Textarea, { props: { maxlength: 3, showCount: true, modelValue: 'ab', limitLabel: 'Limit hit' } })
    const status = w.find('[data-slot="textarea-limit-status"]')
    expect(status.attributes('role')).toBe('status')
    expect(status.text()).toBe('')
    await w.setProps({ modelValue: 'abc' })
    expect(status.text()).toBe('Limit hit')
    expect(w.find('[data-slot="textarea-count"]').classes()).toContain('text-destructive')
  })

  it('default limit message and no counter nodes without showCount', async () => {
    const w = mount(Textarea, { props: { maxlength: 1, showCount: true, modelValue: 'a' } })
    expect(w.find('[data-slot="textarea-limit-status"]').text()).toBe('Character limit reached')
    const plain = mount(Textarea, { props: { maxlength: 1, modelValue: 'a' } })
    expect(plain.find('[data-slot="textarea-count"]').exists()).toBe(false)
    expect(plain.find('[data-slot="textarea-limit-status"]').exists()).toBe(false)
    expect(plain.find('textarea').attributes('aria-describedby')).toBeUndefined()
  })

  it('uses 16px text below md, forced-colors invalid fallback, and aria-invalid=false when required and valid', () => {
    const w = mount(Textarea, { props: { required: true } })
    expect(w.find('textarea').classes()).toEqual(expect.arrayContaining(['text-md', 'md:text-base', 'forced-colors:aria-invalid:border-dashed']))
    expect(w.find('textarea').attributes('aria-invalid')).toBe('false')
    expect(w.find('textarea').attributes('required')).toBeDefined()
  })

  it('counter is aligned with a logical utility (RTL safe)', () => {
    const w = mount(Textarea, { props: { maxlength: 5, showCount: true } })
    expect(w.find('[data-slot="textarea-count"]').classes()).toContain('text-end')
    expect(w.find('[data-slot="textarea-count"]').classes()).not.toContain('text-right')
  })
})
