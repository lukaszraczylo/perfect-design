import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfigProvider from './ConfigProvider.vue'
import { CONFIG_DENSITIES, CONFIG_DIRS, CONFIG_REDUCED_MOTION, CONFIG_SIZES } from './config'

const host = (props: Record<string, unknown> = {}) => mount(ConfigProvider, { props }).find('[data-slot="config-provider"]')
const attr = (props: Record<string, unknown>, name: string) => host(props).attributes(name)

describe('ConfigProvider variations', () => {
  it('documents the value sets the tests below cover', () => {
    expect([CONFIG_DIRS, CONFIG_REDUCED_MOTION, CONFIG_SIZES, CONFIG_DENSITIES]).toEqual([
      ['ltr', 'rtl', 'auto'],
      ['user', 'reduce', 'no-preference'],
      ['xs', 'sm', 'md', 'lg', 'xl'],
      ['default', 'compact', 'comfortable'],
    ])
  })
  it.each(CONFIG_DIRS)('dir="%s" is set on the wrapper', (dir) => expect(attr({ dir }, 'dir')).toBe(dir))
  it.each(CONFIG_SIZES)('size="%s" sets data-size', (size) => expect(attr({ size }, 'data-size')).toBe(size))
  it.each(CONFIG_DENSITIES)('density="%s" sets data-density', (density) => expect(attr({ density }, 'data-density')).toBe(density))
  it.each(CONFIG_REDUCED_MOTION.filter((v) => v !== 'user'))('reducedMotion="%s" sets data-reduced-motion', (reducedMotion) => expect(attr({ reducedMotion }, 'data-reduced-motion')).toBe(reducedMotion))
  it('the default renders no variant attributes', () => {
    const w = host()
    expect(w.html()).toBe('<div data-slot="config-provider"></div>')
  })
  it.each(['dir', 'size', 'density', 'reducedMotion'])('an unknown %s falls back to the default output', (prop) => {
    expect(host({ [prop]: '__unknown__' }).html()).toBe(host().html())
  })
  it('combinations do not conflict and class still wins', () => {
    const w = host({ dir: 'rtl', size: 'sm', density: 'compact', reducedMotion: 'reduce', class: 'p-4' })
    expect(w.attributes()).toMatchObject({ dir: 'rtl', 'data-size': 'sm', 'data-density': 'compact', 'data-reduced-motion': 'reduce', class: 'p-4' })
  })
})
