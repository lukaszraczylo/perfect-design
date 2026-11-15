import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faCheck } from '../../../lib/icons'
import type { IconDefinition } from '../../../lib/icons-tools'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('renders an inline svg from the icon path data and is decorative by default', () => {
    const w = mount(Icon, { props: { icon: faCheck } })
    expect(w.element.tagName.toLowerCase()).toBe('svg')
    expect(w.find('path').attributes('d')).toBe(faCheck.icon[4])
    expect(w.attributes('viewBox')).toBe(`0 0 ${faCheck.icon[0]} ${faCheck.icon[1]}`)
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('data-slot')).toBe('icon')
    expect(w.attributes('focusable')).toBe('false')
  })
  it('exposes a label as role=img when provided', () => {
    const w = mount(Icon, { props: { icon: faCheck, label: 'Done' } })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Done')
    expect(w.attributes('aria-hidden')).toBeUndefined()
  })
  it.each([['xs', 'size-3'], ['sm', 'size-3.5'], ['md', 'size-4'], ['lg', 'size-5'], ['xl', 'size-6']] as const)(
    'size %s',
    (size, cls) => {
      expect(mount(Icon, { props: { icon: faCheck, size } }).classes()).toContain(cls)
    },
  )
  it('falls back to md for unknown size and merges class', () => {
    // @ts-expect-error deliberately invalid
    const w = mount(Icon, { props: { icon: faCheck, size: 'zz', class: 'text-green-500' } })
    expect(w.classes()).toContain('size-4')
    expect(w.classes()).toContain('text-green-500')
  })
  it('spins when asked', () => {
    expect(mount(Icon, { props: { icon: faCheck, spin: true } }).classes()).toContain('animate-spin')
    expect(mount(Icon, { props: { icon: faCheck } }).classes()).not.toContain('animate-spin')
  })
  it('accepts any FontAwesome-shaped object (e.g. from a pro kit)', () => {
    const custom: IconDefinition = { prefix: 'fad', iconName: 'x', icon: [512, 512, [], 'f000', 'M0 0h10v10z'] }
    expect(mount(Icon, { props: { icon: custom } }).find('path').attributes('d')).toBe('M0 0h10v10z')
  })
  it('supports duotone (array) path data, dimming the first layer', () => {
    const duo: IconDefinition = { prefix: 'fad', iconName: 'd', icon: [512, 512, [], 'f001', ['M0 0h5v5z', 'M5 5h5v5z']] }
    const paths = mount(Icon, { props: { icon: duo } }).findAll('path')
    expect(paths).toHaveLength(2)
    expect(paths[0].classes()).toContain('opacity-40')
  })
  it('renders nothing (no crash) for malformed icon data (bad input)', () => {
    // @ts-expect-error deliberately invalid
    expect(mount(Icon, { props: { icon: undefined } }).html()).toBe('<!--v-if-->')
    // @ts-expect-error deliberately invalid
    expect(mount(Icon, { props: { icon: { icon: [1, 2] } } }).html()).toBe('<!--v-if-->')
    const empty: IconDefinition = { prefix: 'x', iconName: 'x', icon: [1, 1, [], '', ''] }
    expect(mount(Icon, { props: { icon: empty } }).findAll('path')).toHaveLength(0)
  })
})

describe('Icon spin and reduced motion', () => {
  it('spinning icons switch to a gentle pulse for prefers-reduced-motion', () => {
    const c = mount(Icon, { props: { icon: faCheck, spin: true } }).classes()
    expect(c).toContain('animate-spin')
    expect(c).toContain('motion-reduce:animate-pulse')
    expect(mount(Icon, { props: { icon: faCheck } }).classes()).not.toContain('animate-spin')
  })
})
