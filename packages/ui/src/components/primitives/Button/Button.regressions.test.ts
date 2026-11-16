import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button loading accessible name', () => {
  it('keeps the original label as the name: spinner is decorative, aria-busy set', () => {
    const w = mount(Button, { props: { loading: true }, slots: { default: 'Save' } })
    const spinner = w.find('[data-slot="spinner"]')
    expect(spinner.attributes('aria-hidden')).toBe('true')
    expect(spinner.attributes('role')).toBeUndefined()
    expect(spinner.attributes('aria-label')).toBeUndefined()
    expect(w.text()).toBe('Save')
    expect(w.attributes('aria-busy')).toBe('true')
  })
})
