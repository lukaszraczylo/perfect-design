import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import FilterChip from './FilterChip.vue'

describe('FilterChip', () => {
  it('renders the label with a named remove button and data-slots', () => {
    const w = mount(FilterChip, { props: { label: 'Status is Open' } })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.attributes('data-slot')).toBe('filter-chip')
    expect(w.get('[data-slot="filter-chip-label"]').text()).toBe('Status is Open')
    const b = w.get('[data-slot="filter-chip-remove"]')
    expect(b.attributes('aria-label')).toBe('Remove filter: Status is Open')
    expect(b.attributes('type')).toBe('button')
    expect(b.get('svg').attributes('aria-hidden')).toBe('true')
  })

  it('emits remove from the button and from Delete and Backspace on it', async () => {
    const w = mount(FilterChip, { props: { label: 'x' } })
    await w.get('button').trigger('click')
    await w.get('button').trigger('keydown', { key: 'Delete' })
    await w.get('button').trigger('keydown', { key: 'Backspace' })
    await w.get('button').trigger('keydown', { key: 'a' })
    await w.get('[data-slot="filter-chip-label"]').trigger('keydown', { key: 'Delete' })
    expect(w.emitted('remove')).toHaveLength(3)
  })

  it('does not remove when disabled or not removable', async () => {
    const d = mount(FilterChip, { props: { label: 'x', disabled: true } })
    expect(d.get('button').attributes('disabled')).toBeDefined()
    expect(d.attributes('data-disabled')).toBe('')
    ;(d.get('button').element as HTMLButtonElement).click()
    await d.get('button').trigger('keydown', { key: 'Delete' })
    expect(d.emitted('remove')).toBeUndefined()
    const n = mount(FilterChip, { props: { label: 'x', removable: false } })
    expect(n.find('button').exists()).toBe(false)
    await n.trigger('keydown', { key: 'Delete' })
    expect(n.emitted('remove')).toBeUndefined()
  })

  it('uses removeLabel, the default slot and the as prop', () => {
    const w = mount(FilterChip, { props: { label: 'x', removeLabel: 'Drop it', as: 'li' }, slots: { default: () => h('em', 'Custom') } })
    expect(w.element.tagName).toBe('LI')
    expect(w.get('em').text()).toBe('Custom')
    expect(w.get('button').attributes('aria-label')).toBe('Drop it')
  })

  it('falls back to a plain remove name without a label', () => {
    const w = mount(FilterChip, { slots: { default: 'Slot text' } })
    expect(w.get('button').attributes('aria-label')).toBe('Remove filter')
  })

  it('merges class and attributes', () => {
    const w = mount(FilterChip, { props: { label: 'x', class: 'zz' }, attrs: { 'data-id': '7', id: 'c1' } })
    expect(w.classes()).toContain('zz')
    expect(w.attributes('data-id')).toBe('7')
    expect(w.attributes('id')).toBe('c1')
  })

  it('renders hostile, huge and right-to-left labels as text', () => {
    const w = mount(FilterChip, { props: { label: `<b onmouseover=alert(1)>x</b> مرحبا ${'w'.repeat(5000)}` } })
    expect(w.find('b').exists()).toBe(false)
    expect(w.get('[data-slot="filter-chip-label"]').text().length).toBeGreaterThan(5000)
  })
})
