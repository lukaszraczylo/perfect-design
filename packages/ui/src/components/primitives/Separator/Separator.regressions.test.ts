import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Separator from './Separator.vue'

describe('Separator accessible name', () => {
  it('a slot label with decorative=false names the separator via aria-labelledby', () => {
    const w = mount(Separator, { props: { decorative: false }, slots: { default: 'Or continue with' } })
    const id = w.attributes('aria-labelledby')
    expect(id).toBeTruthy()
    expect(w.find('[data-slot="separator-label"]').attributes('id')).toBe(id)
    expect(w.attributes('role')).toBe('separator')
  })

  it('a decorative separator has no name; a label prop keeps aria-label', () => {
    expect(mount(Separator, { slots: { default: 'or' } }).attributes('aria-labelledby')).toBeUndefined()
    expect(mount(Separator, { props: { decorative: false, label: 'or' } }).attributes('aria-label')).toBe('or')
  })
})
