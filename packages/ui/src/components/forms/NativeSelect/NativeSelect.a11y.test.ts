import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NativeSelect from './NativeSelect.vue'

describe('NativeSelect a11y', () => {
  const options = [{ value: 'a', label: 'A' }]

  it('chevron is decorative and logically positioned', () => {
    const icon = mount(NativeSelect, { props: { options } }).find('[data-slot="native-select-icon"]')
    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.classes()).toEqual(expect.arrayContaining(['end-3', 'pointer-events-none']))
    expect(icon.classes()).not.toContain('right-3')
  })

  it('reserves room for the chevron with logical padding, 16px text below md, 44px touch height', () => {
    const cls = mount(NativeSelect, { props: { options } }).find('select').classes()
    expect(cls).toEqual(expect.arrayContaining(['pe-9', 'text-md', 'md:text-base', 'pointer-coarse:min-h-11', 'w-full', 'min-w-0']))
    expect(cls).not.toContain('pr-9')
  })

  it('option list uses popover colours so it stays readable in dark mode', () => {
    const cls = mount(NativeSelect, { props: { options } }).find('select').classes().join(' ')
    expect(cls).toContain('[&_option]:bg-popover')
    expect(cls).toContain('[&_option]:text-popover-foreground')
  })

  it('required: aria-invalid false while valid; invalid gets a forced-colors dashed border', () => {
    const w = mount(NativeSelect, { props: { options, required: true } })
    expect(w.find('select').attributes('aria-invalid')).toBe('false')
    expect(w.find('select').attributes('required')).toBeDefined()
    expect(w.find('select').classes()).toContain('forced-colors:aria-invalid:border-dashed')
  })
})
