import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Spacer from './Spacer.vue'
import { spacerHeightClasses, spacerLgHeightClasses, spacerLgWidthClasses, spacerMdHeightClasses, spacerMdWidthClasses, spacerWidthClasses } from './variants'

describe('Spacer extra steps and responsive sizes', () => {
  it('default output is unchanged', () => {
    const w = mount(Spacer)
    expect(w.classes()).toEqual(['flex-1'])
    expect(mount(Spacer, { props: { size: 4 } }).classes().sort()).toEqual(['h-4', 'shrink-0'])
  })

  describe('section-level steps', () => {
    it.each([14, 16, 20, 24] as const)('size %s sets a fixed height', (size) => {
      const c = mount(Spacer, { props: { size } }).classes()
      expect(c).toEqual(expect.arrayContaining([`h-${size}`, 'shrink-0']))
      expect(c).not.toContain('flex-1')
    })
    it.each([14, 16, 20, 24] as const)('size %s on the horizontal axis sets a width', (size) => {
      const c = mount(Spacer, { props: { size, axis: 'horizontal' } }).classes()
      expect(c).toContain(`w-${size}`)
      expect(c.some((x) => x.startsWith('h-'))).toBe(false)
    })
    it.each([7, 9, 11, 13, 15, 18, 28, 32])('unsupported size %s falls back to flex-1', (size) => {
      expect(mount(Spacer, { props: { size: size as never } }).classes()).toContain('flex-1')
    })
  })

  describe('sizeMd and sizeLg', () => {
    it('add breakpoint heights on the vertical axis', () => {
      const c = mount(Spacer, { props: { size: 8, sizeMd: 16, sizeLg: 24 } }).classes()
      expect(c).toEqual(expect.arrayContaining(['h-8', 'md:h-16', 'lg:h-24', 'shrink-0']))
    })
    it('add breakpoint widths on the horizontal axis', () => {
      const c = mount(Spacer, { props: { axis: 'horizontal', size: 2, sizeMd: 6, sizeLg: 12 } }).classes()
      expect(c).toEqual(expect.arrayContaining(['w-2', 'md:w-6', 'lg:w-12']))
      expect(c.some((x) => /(^|:)h-/.test(x))).toBe(false)
    })
    it('md alone and lg alone work', () => {
      expect(mount(Spacer, { props: { size: 4, sizeMd: 10 } }).classes()).toEqual(expect.arrayContaining(['h-4', 'md:h-10']))
      expect(mount(Spacer, { props: { size: 4, sizeLg: 10 } }).classes().some((x) => x.startsWith('md:'))).toBe(false)
    })
    it('are ignored without a valid size (the spacer stays flexible)', () => {
      const c = mount(Spacer, { props: { sizeMd: 8, sizeLg: 12 } }).classes()
      expect(c).toEqual(['flex-1'])
      expect(mount(Spacer, { props: { size: 7 as never, sizeMd: 8 } }).classes()).toEqual(['flex-1'])
    })
    it.each([7, -1, 'big', null, NaN])('invalid responsive size %s is ignored', (v) => {
      const c = mount(Spacer, { props: { size: 4, sizeMd: v as never, sizeLg: v as never } }).classes()
      expect(c.sort()).toEqual(['h-4', 'shrink-0'])
    })
    it('class prop wins over the responsive size', () => {
      const c = mount(Spacer, { props: { size: 4, sizeMd: 8, class: 'md:h-2' } }).classes()
      expect(c).toContain('md:h-2')
      expect(c).not.toContain('md:h-8')
    })
    it('size 0 and a larger responsive size is valid', () => {
      expect(mount(Spacer, { props: { size: 0, sizeMd: 6 } }).classes()).toEqual(expect.arrayContaining(['h-0', 'md:h-6']))
    })
    it('stays aria-hidden and empty', () => {
      const w = mount(Spacer, { props: { size: 4, sizeMd: 16 } })
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.text()).toBe('')
    })
  })

  describe('class maps', () => {
    it('every map has the same keys and literal Tailwind classes', () => {
      const keys = Object.keys(spacerHeightClasses)
      expect(keys).toEqual(['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '14', '16', '20', '24'])
      for (const [map, prefix] of [
        [spacerHeightClasses, 'h-'],
        [spacerWidthClasses, 'w-'],
        [spacerMdHeightClasses, 'md:h-'],
        [spacerLgHeightClasses, 'lg:h-'],
        [spacerMdWidthClasses, 'md:w-'],
        [spacerLgWidthClasses, 'lg:w-'],
      ] as const) {
        expect(Object.keys(map)).toEqual(keys)
        for (const k of keys) expect(map[k]).toBe(`${prefix}${k}`)
      }
    })
  })
})
