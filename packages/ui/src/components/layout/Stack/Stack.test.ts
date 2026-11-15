import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Stack from './Stack.vue'
import HStack from './HStack.vue'
import VStack from './VStack.vue'
import { lookup } from './gap'
import { stackVariants } from './variants'

describe('Stack', () => {
  describe('good path', () => {
    it('renders a vertical flex column with gap-4 by default', () => {
      const w = mount(Stack, { slots: { default: '<span>a</span><span>b</span>' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('stack')
      expect(w.attributes('data-direction')).toBe('vertical')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-4']))
      expect(w.findAll('span')).toHaveLength(2)
    })

    it('horizontal direction', () => {
      const w = mount(Stack, { props: { direction: 'horizontal' } })
      expect(w.classes()).toContain('flex-row')
      expect(w.classes()).not.toContain('flex-col')
    })

    it.each([0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const)('gap %s', (gap) => {
      expect(mount(Stack, { props: { gap } }).classes()).toContain(`gap-${gap}`)
    })

    it.each([
      ['start', 'items-start'],
      ['center', 'items-center'],
      ['end', 'items-end'],
      ['stretch', 'items-stretch'],
      ['baseline', 'items-baseline'],
    ] as const)('align %s', (align, cls) => {
      expect(mount(Stack, { props: { align } }).classes()).toContain(cls)
    })

    it.each([
      ['start', 'justify-start'],
      ['center', 'justify-center'],
      ['end', 'justify-end'],
      ['between', 'justify-between'],
      ['around', 'justify-around'],
      ['evenly', 'justify-evenly'],
    ] as const)('justify %s', (justify, cls) => {
      expect(mount(Stack, { props: { justify } }).classes()).toContain(cls)
    })

    it('wrap toggles flex-wrap', () => {
      expect(mount(Stack, { props: { wrap: true } }).classes()).toContain('flex-wrap')
      expect(mount(Stack).classes()).toContain('flex-nowrap')
    })

    it('exports CVA variants', () => {
      expect(stackVariants({ direction: 'horizontal' })).toContain('flex-row')
      expect(stackVariants({ divided: true })).toContain('divide-y')
      expect(stackVariants({ direction: 'horizontal', divided: true })).toContain('divide-x')
    })

    it.each([0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const)('responsive gaps %s', (g) => {
      expect(mount(Stack, { props: { gapSm: g } }).classes()).toContain(`sm:gap-${g}`)
      expect(mount(Stack, { props: { gapMd: g } }).classes()).toContain(`md:gap-${g}`)
      expect(mount(Stack, { props: { gapLg: g } }).classes()).toContain(`lg:gap-${g}`)
    })

    it('responsive gaps combine with the base gap', () => {
      const w = mount(Stack, { props: { gap: 2, gapMd: 4, gapLg: 8 } })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'md:gap-4', 'lg:gap-8']))
      expect(w.classes().some((c) => c.startsWith('sm:gap'))).toBe(false)
    })

    it.each(['sm', 'md', 'lg'] as const)('horizontal collapse %s stacks below the breakpoint', (bp) => {
      const w = mount(Stack, { props: { direction: 'horizontal', collapse: bp } })
      expect(w.classes()).toContain('flex-col')
      expect(w.classes()).toContain(`${bp}:flex-row`)
      expect(w.classes()).not.toContain('flex-row')
      expect(w.attributes('data-direction')).toBe('horizontal')
    })

    it('collapse is ignored for vertical stacks', () => {
      const w = mount(Stack, { props: { collapse: 'md' } })
      expect(w.classes()).toContain('flex-col')
      expect(w.classes().some((c) => c.endsWith(':flex-row'))).toBe(false)
    })

    it('divided draws divide-y for vertical and divide-x for horizontal', () => {
      expect(mount(Stack, { props: { divided: true } }).classes()).toEqual(expect.arrayContaining(['divide-y', 'divide-border']))
      const h = mount(Stack, { props: { direction: 'horizontal', divided: true } })
      expect(h.classes()).toEqual(expect.arrayContaining(['divide-x', 'divide-border']))
      expect(h.classes()).not.toContain('divide-y')
    })

    it('not divided by default', () => {
      expect(mount(Stack).classes().some((c) => c.startsWith('divide-'))).toBe(false)
    })
  })

  describe('customisation', () => {
    it('class overrides internals', () => {
      const w = mount(Stack, { props: { class: 'gap-1 custom' } })
      expect(w.classes()).toContain('gap-1')
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-4')
    })

    it('as + attrs', () => {
      const w = mount(Stack, { props: { as: 'ul' }, attrs: { role: 'list', 'data-x': '1' } })
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('role')).toBe('list')
      expect(w.attributes('data-x')).toBe('1')
    })

    it('asChild', () => {
      const w = mount(Stack, { props: { asChild: true }, slots: { default: '<nav>n</nav>' } })
      expect(w.element.tagName).toBe('NAV')
      expect(w.classes()).toContain('flex')
    })
  })

  describe('bad path', () => {
    it('invalid gap falls back to gap-4', () => {
      expect(mount(Stack, { props: { gap: 7 as never } }).classes()).toContain('gap-4')
      expect(mount(Stack, { props: { gap: 'x' as never } }).classes()).toContain('gap-4')
      expect(mount(Stack, { props: { gap: null as never } }).classes()).toContain('gap-4')
    })

    it('string gap from attributes works', () => {
      expect(mount(Stack, { props: { gap: '6' as never } }).classes()).toContain('gap-6')
    })

    it('invalid responsive gaps and collapse are ignored', () => {
      const w = mount(Stack, { props: { direction: 'horizontal', gapSm: 7 as never, gapMd: 'x' as never, gapLg: null as never, collapse: 'xl' as never } })
      expect(w.classes().some((c) => /^(sm|md|lg):/.test(c))).toBe(false)
      expect(w.classes()).toContain('flex-row')
      expect(mount(Stack, { props: { direction: 'horizontal', collapse: 'toString' as never } }).classes()).toContain('flex-row')
    })

    it('unknown align adds no align class', () => {
      const w = mount(Stack, { props: { align: 'wat' as never } })
      expect(w.classes().some((c) => c.startsWith('items-'))).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('empty slot', () => {
      expect(mount(Stack).text()).toBe('')
    })

    it('class overrides responsive gap and divider', () => {
      const w = mount(Stack, { props: { gapMd: 4, divided: true, class: 'md:gap-1 divide-muted' } })
      expect(w.classes()).toContain('md:gap-1')
      expect(w.classes()).not.toContain('md:gap-4')
      expect(w.classes()).toContain('divide-muted')
      expect(w.classes()).not.toContain('divide-border')
    })

    it('lookup helper handles undefined and prototype keys', () => {
      expect(lookup({ a: 'x' }, undefined)).toBeUndefined()
      expect(lookup({ a: 'x' }, 'constructor')).toBeUndefined()
      expect(lookup({ a: 'x' }, 'a')).toBe('x')
    })
  })
})

describe('HStack', () => {
  it('is horizontal with centred alignment by default', () => {
    const w = mount(HStack, { slots: { default: 'x' } })
    expect(w.attributes('data-slot')).toBe('h-stack')
    expect(w.attributes('data-direction')).toBe('horizontal')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-row', 'items-center', 'gap-4']))
    expect(w.text()).toBe('x')
  })

  it('accepts overrides for align, gap, justify, wrap, as and class', () => {
    const w = mount(HStack, { props: { align: 'start', gap: 2, justify: 'between', wrap: true, as: 'nav', class: 'extra' } })
    expect(w.element.tagName).toBe('NAV')
    expect(w.classes()).toEqual(expect.arrayContaining(['items-start', 'gap-2', 'justify-between', 'flex-wrap', 'extra']))
    expect(w.classes()).not.toContain('items-center')
  })

  it('passes attrs through', () => {
    expect(mount(HStack, { attrs: { 'aria-label': 'Toolbar' } }).attributes('aria-label')).toBe('Toolbar')
  })

  it('invalid gap falls back', () => {
    expect(mount(HStack, { props: { gap: 99 as never } }).classes()).toContain('gap-4')
  })
})

describe('VStack', () => {
  it('is vertical by default with no align class', () => {
    const w = mount(VStack, { slots: { default: 'x' } })
    expect(w.attributes('data-slot')).toBe('v-stack')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-col', 'gap-4']))
    expect(w.classes().some((c) => c.startsWith('items-'))).toBe(false)
  })

  it('accepts overrides', () => {
    const w = mount(VStack, { props: { align: 'center', gap: 8, as: 'section', class: 'extra' } })
    expect(w.element.tagName).toBe('SECTION')
    expect(w.classes()).toEqual(expect.arrayContaining(['items-center', 'gap-8', 'extra']))
  })
})

describe('HStack / VStack new props', () => {
  it('HStack forwards collapse, divided and responsive gaps', () => {
    const w = mount(HStack, { props: { collapse: 'sm', divided: true, gapMd: 6 } })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-col', 'sm:flex-row', 'divide-x', 'md:gap-6']))
  })

  it('VStack forwards divided and responsive gaps', () => {
    const w = mount(VStack, { props: { divided: true, gapLg: 8 } })
    expect(w.classes()).toEqual(expect.arrayContaining(['divide-y', 'lg:gap-8']))
  })
})
