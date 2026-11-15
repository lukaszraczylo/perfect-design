import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from './Checkbox.vue'

const box = (w: ReturnType<typeof mount>) => w.find('[data-slot="checkbox"]')

describe('Checkbox a11y', () => {
  it('uses the scale radius (rounded-sm), not an arbitrary value', () => {
    const cls = box(mount(Checkbox)).classes()
    expect(cls).toContain('rounded-sm')
    expect(cls.join(' ')).not.toMatch(/rounded-\[/)
  })

  it.each([
    ['sm', 'after:-inset-1.5'],
    ['md', 'after:-inset-1'],
    ['lg', 'after:-inset-1'],
  ] as const)('size=%s grows the hit area to 24px with an invisible ::after (and ~40px on touch)', (size, inset) => {
    const cls = box(mount(Checkbox, { props: { size } })).classes()
    expect(cls).toEqual(expect.arrayContaining(['relative', 'after:absolute', inset, 'pointer-coarse:after:-inset-3']))
  })

  it('exposes checked, unchecked and indeterminate through aria-checked', async () => {
    const w = mount(Checkbox, { props: { modelValue: false } })
    expect(box(w).attributes('aria-checked')).toBe('false')
    await w.setProps({ modelValue: true })
    expect(box(w).attributes('aria-checked')).toBe('true')
    await w.setProps({ modelValue: 'indeterminate' })
    expect(box(w).attributes('aria-checked')).toBe('mixed')
    expect(box(w).attributes('role')).toBe('checkbox')
  })

  it('a required checkbox shows a decorative asterisk in its label and reports aria-invalid=false until invalid', async () => {
    const w = mount(Checkbox, { props: { label: 'Accept', required: true } })
    expect(w.find('[data-slot="label-required"]').attributes('aria-hidden')).toBe('true')
    expect(box(w).attributes('aria-invalid')).toBe('false')
    await w.setProps({ invalid: true })
    expect(box(w).attributes('aria-invalid')).toBe('true')
    expect(box(w).classes()).toContain('forced-colors:aria-invalid:border-dashed')
  })

  it('aligns the box to the first line of a wrapping label and never exceeds its container', () => {
    const w = mount(Checkbox, { props: { label: 'A long label' } })
    expect(w.find('[data-slot="checkbox-wrapper"]').classes()).toEqual(expect.arrayContaining(['items-start', 'max-w-full']))
    expect(box(w).classes()).toContain('mt-0.5')
    expect(box(mount(Checkbox, { attrs: { 'aria-label': 'x' } })).classes()).not.toContain('mt-0.5')
  })

  it('label for matches the box id so clicking the text toggles it', () => {
    const w = mount(Checkbox, { props: { label: 'Accept', id: 'terms' } })
    expect(w.find('label').attributes('for')).toBe('terms')
    expect(box(w).attributes('id')).toBe('terms')
  })
})
