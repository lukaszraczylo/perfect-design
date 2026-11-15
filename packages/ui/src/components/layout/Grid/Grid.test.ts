import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Grid from './Grid.vue'
import { resolveMinItemWidth } from './variants'

const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

describe('Grid', () => {
  describe('good path', () => {
    it('renders a grid with 1 column and gap-4 by default', () => {
      const w = mount(Grid, { slots: { default: '<i>a</i><i>b</i>' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('grid')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-1', 'gap-4']))
      expect(w.findAll('i')).toHaveLength(2)
    })

    it.each(nums)('cols %s', (n) => {
      expect(mount(Grid, { props: { cols: n } }).classes()).toContain(`grid-cols-${n}`)
    })

    it.each(['sm', 'md', 'lg', 'xl'] as const)('%s breakpoint columns 1-12', (bp) => {
      for (const n of nums) {
        expect(mount(Grid, { props: { [bp]: n } }).classes()).toContain(`${bp}:grid-cols-${n}`)
      }
    })

    it('combines responsive props', () => {
      const w = mount(Grid, { props: { cols: 1, sm: 2, md: 3, lg: 4, xl: 6 } })
      expect(w.classes()).toEqual(
        expect.arrayContaining(['grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-6']),
      )
    })

    it.each([0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const)('gap %s / gapX / gapY', (g) => {
      expect(mount(Grid, { props: { gap: g } }).classes()).toContain(`gap-${g}`)
      expect(mount(Grid, { props: { gapX: g } }).classes()).toContain(`gap-x-${g}`)
      expect(mount(Grid, { props: { gapY: g } }).classes()).toContain(`gap-y-${g}`)
    })

    it('gapX and gapY coexist with gap', () => {
      const w = mount(Grid, { props: { gap: 2, gapX: 6, gapY: 0 } })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'gap-x-6', 'gap-y-0']))
    })
  })

  describe('responsive gaps', () => {
    it.each([0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const)('gapSm/gapMd/gapLg %s', (g) => {
      expect(mount(Grid, { props: { gapSm: g } }).classes()).toContain(`sm:gap-${g}`)
      expect(mount(Grid, { props: { gapMd: g } }).classes()).toContain(`md:gap-${g}`)
      expect(mount(Grid, { props: { gapLg: g } }).classes()).toContain(`lg:gap-${g}`)
    })

    it('combine with the base gap', () => {
      expect(mount(Grid, { props: { gap: 2, gapMd: 4, gapLg: 8 } }).classes()).toEqual(
        expect.arrayContaining(['gap-2', 'md:gap-4', 'lg:gap-8']),
      )
    })

    it('invalid values are ignored', () => {
      const w = mount(Grid, { props: { gapSm: 7 as never, gapMd: 'x' as never, gapLg: null as never } })
      expect(w.classes().some((c) => /^(sm|md|lg):gap/.test(c))).toBe(false)
    })
  })

  describe('minItemWidth (auto-fit)', () => {
    const fit = 'grid-cols-(--grid-template)'

    it('is off by default: no variable, no data-auto', () => {
      const w = mount(Grid)
      expect(w.attributes('style')).toBeUndefined()
      expect(w.attributes('data-auto')).toBeUndefined()
    })

    it('uses auto-fit and the --grid-min variable instead of base cols', () => {
      const w = mount(Grid, { props: { minItemWidth: '16rem', cols: 3 } })
      expect(w.classes()).toContain(fit)
      expect(w.classes()).not.toContain('grid-cols-3')
      expect(w.classes()).not.toContain('grid-cols-1')
      expect(w.attributes('style')).toContain('--grid-min: 16rem')
      expect(w.attributes('style')).toContain('--grid-template: repeat(auto-fit, minmax(min(100%, 16rem), 1fr))')
      expect(w.classes().some((c) => c.includes('['))).toBe(false)
      expect(w.attributes('data-auto')).toBe('fit')
    })

    it('autoFill switches to auto-fill', () => {
      const w = mount(Grid, { props: { minItemWidth: '10rem', autoFill: true } })
      expect(w.classes()).toContain(fit)
      expect(w.attributes('style')).toContain('--grid-template: repeat(auto-fill, minmax(min(100%, 10rem), 1fr))')
      expect(w.attributes('data-auto')).toBe('fill')
    })

    it('autoFill alone (without minItemWidth) does nothing', () => {
      const w = mount(Grid, { props: { autoFill: true } })
      expect(w.classes()).toContain('grid-cols-1')
      expect(w.attributes('data-auto')).toBeUndefined()
    })

    it('a number means px', () => {
      expect(mount(Grid, { props: { minItemWidth: 240 } }).attributes('style')).toContain('--grid-min: 240px')
    })

    it.each(['12rem', '240px', '20ch', '30%', '1.5em', '.5rem', '50vw'])('accepts %s', (v) => {
      expect(mount(Grid, { props: { minItemWidth: v } }).attributes('style')).toContain(`--grid-min: ${v}`)
    })

    it('breakpoint columns still override the auto-fit base', () => {
      expect(mount(Grid, { props: { minItemWidth: '12rem', lg: 4 } }).classes()).toEqual(expect.arrayContaining([fit, 'lg:grid-cols-4']))
    })

    it('class can override the auto template and user style merges', () => {
      const w = mount(Grid, { props: { minItemWidth: '12rem', class: 'grid-cols-2' }, attrs: { style: 'color: red' } })
      expect(w.classes()).toContain('grid-cols-2')
      expect(w.classes()).not.toContain(fit)
      expect(w.attributes('style')).toContain('--grid-min: 12rem')
      expect(w.attributes('style')).toContain('color: red')
    })

    it.each(['', '   ', '0', '0px', '-5px', 'abc', '10', 'calc(100px + 1rem)', 'var(--x)', '12rem; color:red', '1e3px', 0, -4, NaN, Infinity, null, {}, true])(
      'rejects %s and falls back to cols',
      (v) => {
        const w = mount(Grid, { props: { minItemWidth: v as never, cols: 2 } })
        expect(w.classes()).toContain('grid-cols-2')
        expect(w.attributes('style')).toBeUndefined()
        expect(w.attributes('data-auto')).toBeUndefined()
      },
    )

    it('works with asChild and keeps the variable on the child', () => {
      const w = mount(Grid, { props: { asChild: true, minItemWidth: '8rem' }, slots: { default: '<ul>x</ul>' } })
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('style')).toContain('--grid-min: 8rem')
    })

    it('resolveMinItemWidth trims whitespace', () => {
      expect(resolveMinItemWidth('  14rem ')).toBe('14rem')
      expect(resolveMinItemWidth(undefined)).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('class wins', () => {
      const w = mount(Grid, { props: { cols: 3, class: 'grid-cols-5 custom' } })
      expect(w.classes()).toContain('grid-cols-5')
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('grid-cols-3')
    })

    it('as + attrs + asChild', () => {
      const w = mount(Grid, { props: { as: 'ul' }, attrs: { role: 'list', id: 'g' } })
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('id')).toBe('g')
      const c = mount(Grid, { props: { asChild: true }, slots: { default: '<section>s</section>' } })
      expect(c.element.tagName).toBe('SECTION')
      expect(c.classes()).toContain('grid')
    })
  })

  describe('bad path', () => {
    it.each([0, 13, -1, 2.5, NaN, 'abc', null])('invalid cols %s falls back to grid-cols-1', (v) => {
      expect(mount(Grid, { props: { cols: v as never } }).classes()).toContain('grid-cols-1')
    })

    it('invalid breakpoint values are ignored', () => {
      const w = mount(Grid, { props: { sm: 0 as never, md: 13 as never, lg: 'x' as never, xl: null as never } })
      expect(w.classes().some((c) => /^(sm|md|lg|xl):/.test(c))).toBe(false)
    })

    it('invalid gaps fall back / are ignored', () => {
      const w = mount(Grid, { props: { gap: 7 as never, gapX: 9 as never, gapY: -1 as never } })
      expect(w.classes()).toContain('gap-4')
      expect(w.classes().some((c) => c.startsWith('gap-x-') || c.startsWith('gap-y-'))).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('string numerals work', () => {
      expect(mount(Grid, { props: { cols: '3' as never, md: '4' as never } }).classes()).toEqual(
        expect.arrayContaining(['grid-cols-3', 'md:grid-cols-4']),
      )
    })

    it('empty slot', () => {
      expect(mount(Grid).text()).toBe('')
    })
  })
})
