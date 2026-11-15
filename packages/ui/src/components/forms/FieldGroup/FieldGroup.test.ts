import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldGroup from './FieldGroup.vue'

describe('FieldGroup', () => {
  it('renders slot content stacked vertically by default with data-slot', () => {
    const w = mount(FieldGroup, { slots: { default: '<div class="a">A</div><div class="b">B</div>' } })
    expect(w.attributes('data-slot')).toBe('field-group')
    expect(w.attributes('data-orientation')).toBe('vertical')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col']))
    expect(w.findAll('.a, .b')).toHaveLength(2)
  })

  it('horizontal orientation lays out a wrapping row', () => {
    const w = mount(FieldGroup, { props: { orientation: 'horizontal' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap']))
    expect(w.classes()).not.toContain('flex-col')
  })

  it('columns 2 and 3 render a responsive grid', () => {
    const two = mount(FieldGroup, { props: { columns: 2 } })
    expect(two.classes()).toEqual(expect.arrayContaining(['grid', 'sm:grid-cols-2']))
    expect(two.classes()).not.toContain('lg:grid-cols-3')
    const three = mount(FieldGroup, { props: { columns: 3 } })
    expect(three.classes()).toContain('lg:grid-cols-3')
  })

  it('columns wins over orientation', () => {
    const w = mount(FieldGroup, { props: { columns: 2, orientation: 'horizontal' } })
    expect(w.classes()).toContain('grid')
    expect(w.classes()).not.toContain('flex-row')
  })

  it('invalid columns fall back to a single column layout', () => {
    // @ts-expect-error deliberately invalid
    const w = mount(FieldGroup, { props: { columns: 9 } })
    expect(w.classes()).toContain('flex-col')
  })

  it('label adds role=group and aria-label; absent label adds neither', () => {
    const named = mount(FieldGroup, { props: { label: 'Address' } })
    expect(named.attributes('role')).toBe('group')
    expect(named.attributes('aria-label')).toBe('Address')
    const plain = mount(FieldGroup)
    expect(plain.attributes('role')).toBeUndefined()
    expect(plain.attributes('aria-label')).toBeUndefined()
  })

  it('empty label string is treated as no label', () => {
    const w = mount(FieldGroup, { props: { label: '' } })
    expect(w.attributes('role')).toBeUndefined()
  })

  it('merges class last (wins over internal gap) and passes attrs through', () => {
    const w = mount(FieldGroup, { props: { class: 'gap-2 custom' }, attrs: { id: 'g', 'data-test': 'x' } })
    expect(w.classes()).toContain('custom')
    expect(w.classes()).toContain('gap-2')
    expect(w.classes()).not.toContain('gap-5')
    expect(w.attributes('id')).toBe('g')
    expect(w.attributes('data-test')).toBe('x')
  })

  it('renders with no slot content and with unicode label (edge)', () => {
    const w = mount(FieldGroup, { props: { label: 'Адрес 住所 🏠' } })
    expect(w.element.children).toHaveLength(0)
    expect(w.attributes('aria-label')).toBe('Адрес 住所 🏠')
  })
})
