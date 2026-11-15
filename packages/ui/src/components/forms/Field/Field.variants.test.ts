import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Field from './Field.vue'
import Input from '../Input/Input.vue'

const mountField = (props: Record<string, unknown> = {}) =>
  mount(Field, { props: { label: 'Name', hint: 'A hint', error: 'An error', ...props }, slots: { default: () => h(Input) } })

describe('Field size', () => {
  it('md keeps the default gap and text sizes', () => {
    const w = mountField()
    expect(w.attributes('data-size')).toBe('md')
    expect(w.classes()).toEqual(expect.arrayContaining(['group/field', 'grid', 'min-w-0', 'gap-1.5']))
    expect(w.find('[data-slot="field-hint"]').classes()).toEqual(['text-sm', 'text-muted-foreground'])
    expect(w.find('[data-slot="field-error"]').classes()).toEqual(['text-sm', 'font-medium', 'text-destructive'])
    expect(w.find('[data-slot="field-label"]').classes()).toContain('text-sm')
  })
  it.each([
    ['sm', 'gap-1', 'text-xs'],
    ['lg', 'gap-2', 'text-base'],
  ])('size %s sets the gap, label, hint and error text', (size, gap, text) => {
    const w = mountField({ size })
    expect(w.attributes('data-size')).toBe(size)
    expect(w.classes()).toContain(gap)
    expect(w.classes()).not.toContain('gap-1.5')
    for (const slot of ['field-label', 'field-hint', 'field-error']) expect(w.find(`[data-slot="${slot}"]`).classes()).toContain(text)
  })
  it('hint above the control gets the same size', () => {
    const w = mountField({ size: 'sm', hintPlacement: 'above' })
    expect(w.find('[data-slot="field-hint"]').classes()).toContain('text-xs')
  })
  it('unknown size falls back to md; class wins over the gap', () => {
    expect(mountField({ size: 'huge' }).attributes('data-size')).toBe('md')
    const w = mountField({ size: 'lg', class: 'gap-6' })
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('combines with horizontal orientation without losing the wiring', () => {
    const w = mountField({ size: 'sm', orientation: 'horizontal' })
    expect(w.classes().join(' ')).toContain('grid-cols-[auto_1fr]')
    const input = w.find('input')
    expect(w.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toContain('hint')
    expect(input.attributes('aria-invalid')).toBe('true')
  })
})
