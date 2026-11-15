import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import SegmentedControl from './SegmentedControl.vue'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
]

describe('SegmentedControl a11y and responsive', () => {
  it('a Field label names the radiogroup via aria-labelledby; aria-label wins when given', () => {
    wrapper = mount(Field, { props: { id: 'r', label: 'Range' }, slots: { default: () => h(SegmentedControl, { options: OPTIONS }) } })
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-labelledby')).toBe('r-label')
    const own = mount(Field, { props: { id: 'r', label: 'Range' }, slots: { default: () => h(SegmentedControl, { options: OPTIONS, 'aria-label': 'Own' }) } })
    expect(own.find('[role="radiogroup"]').attributes('aria-labelledby')).toBeUndefined()
    expect(own.find('[role="radiogroup"]').attributes('aria-label')).toBe('Own')
  })

  it('wraps instead of overflowing and never exceeds the container', () => {
    wrapper = mount(SegmentedControl, { props: { options: OPTIONS } })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['max-w-full', 'flex-wrap']))
  })

  it('segments are at least 24px tall and 36px on touch', () => {
    wrapper = mount(SegmentedControl, { props: { options: OPTIONS, size: 'sm' } })
    const item = wrapper.find('[data-slot="segmented-control-item"]')
    expect(item.classes()).toEqual(expect.arrayContaining(['h-6', 'pointer-coarse:min-h-9']))
  })

  it('marks the selected segment in forced-colors mode and the invalid group with a dashed border', () => {
    wrapper = mount(SegmentedControl, { props: { options: OPTIONS, invalid: true } })
    expect(wrapper.find('[data-slot="segmented-control-item"]').classes().join(' ')).toContain('forced-colors:data-[state=checked]:bg-[Highlight]')
    expect(wrapper.classes()).toContain('forced-colors:aria-invalid:border-dashed')
    expect(wrapper.attributes('aria-invalid')).toBe('true')
  })

  it('roving tabindex: once a segment has focus, exactly one segment is in the tab order', async () => {
    wrapper = mount(SegmentedControl, { props: { options: OPTIONS, defaultValue: 'day' }, attachTo: document.body })
    const radios = wrapper.findAll('[role="radio"]')
    ;(radios[0].element as HTMLElement).focus()
    await radios[0].trigger('focus')
    expect(radios.filter((r) => r.attributes('tabindex') === '0')).toHaveLength(1)
    expect(radios.map((r) => r.attributes('type'))).toEqual(['button', 'button'])
  })
})
