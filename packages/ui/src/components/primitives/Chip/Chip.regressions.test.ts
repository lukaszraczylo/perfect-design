import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Chip from './Chip.vue'

describe('Chip disabled semantics', () => {
  it('a role-less span has no aria-disabled', () => {
    const w = mount(Chip, { props: { label: 'Tag', disabled: true } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-disabled')).toBeUndefined()
    expect(w.attributes('data-disabled')).toBeDefined()
  })
  it('a disabled removable chip is not a group and has no aria-disabled', () => {
    const w = mount(Chip, { props: { label: 'Tag', disabled: true, removable: true } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-disabled')).toBeUndefined()
  })
})
