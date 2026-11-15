import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Label from './Label.vue'

describe('Label a11y', () => {
  it('passes id through (so a group can reference it with aria-labelledby) and keeps a native for', () => {
    const w = mount(Label, { props: { for: 'x' }, attrs: { id: 'lbl' }, slots: { default: 'Name' } })
    expect(w.attributes('id')).toBe('lbl')
    expect(w.attributes('for')).toBe('x')
  })

  it('wraps long text (no leading-none) and aligns the asterisk to the text baseline', () => {
    const w = mount(Label, { props: { required: true }, slots: { default: 'A very long label that wraps' } })
    expect(w.classes()).toContain('leading-snug')
    expect(w.classes()).not.toContain('leading-none')
    expect(w.classes()).toContain('items-baseline')
    expect(w.find('[data-slot="label-required"]').attributes('aria-hidden')).toBe('true')
  })
})
