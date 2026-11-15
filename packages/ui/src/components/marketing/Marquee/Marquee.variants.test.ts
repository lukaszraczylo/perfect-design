import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Marquee from './Marquee.vue'
import { MARQUEE_SIZES } from './variants'

const items = ['One', 'Two']

describe('Marquee size hook', () => {
  it('exposes the resolved size as data-size, md by default', () => {
    expect(mount(Marquee, { props: { items } }).attributes('data-size')).toBe('md')
  })
  it.each(MARQUEE_SIZES)('size %s is reported on the root and styles the text items only', (size) => {
    const w = mount(Marquee, { props: { items, size }, slots: undefined })
    expect(w.attributes('data-size')).toBe(size)
    expect(w.find('span').classes()).toContain({ sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }[size])
  })
  it('reports the size also when slot content replaces the items (slot content is not rescaled)', () => {
    const w = mount(Marquee, { props: { size: 'lg' }, slots: { default: '<b class="x">a</b>' } })
    expect(w.attributes('data-size')).toBe('lg')
    expect(w.find('.x').classes()).toEqual(['x'])
  })
  it('unknown size falls back to md', () => {
    const w = mount(Marquee, { props: { items, size: 'huge' as 'md' } })
    expect(w.attributes('data-size')).toBe('md')
    expect(w.find('span').classes()).toContain('text-lg')
  })
})
