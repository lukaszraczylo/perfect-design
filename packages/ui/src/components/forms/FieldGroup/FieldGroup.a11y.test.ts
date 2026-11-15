import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldGroup from './FieldGroup.vue'

describe('FieldGroup responsive and a11y', () => {
  it('horizontal children have a basis so they wrap at narrow widths instead of shrinking to nothing', () => {
    const w = mount(FieldGroup, { props: { orientation: 'horizontal' } })
    const cls = w.classes().join(' ')
    expect(cls).toContain('flex-wrap')
    expect(cls).toContain('*:basis-48')
    expect(cls).toContain('*:min-w-0')
    expect(cls).not.toContain('*:flex-1')
  })

  it('exposes a named group only when labelled; aria-labelledby falls through', () => {
    expect(mount(FieldGroup).attributes('role')).toBeUndefined()
    const labelled = mount(FieldGroup, { attrs: { 'aria-labelledby': 'h' } })
    expect(labelled.attributes('aria-labelledby')).toBe('h')
    expect(mount(FieldGroup, { props: { label: 'Address' } }).attributes('role')).toBe('group')
  })
})
