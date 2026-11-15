import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HStack from './HStack.vue'
import Stack from './Stack.vue'
import VStack from './VStack.vue'
import { stackPaddings, stackSurfaces, stackVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
const SURFACE_CLASSES = ['border', 'border-border', 'bg-card', 'bg-secondary', 'rounded-lg', 'text-card-foreground', 'text-secondary-foreground']
const pad = (c: string[]) => c.filter((x) => /^p-\d+$/.test(x))

describe('Stack surface variant and padding', () => {
  it('default output is unchanged: no surface and no padding', () => {
    const c = mount(Stack).classes()
    expect(set(c.join(' '))).toEqual(set('flex flex-col flex-nowrap gap-4'))
    expect(set(stackVariants())).toEqual(set('flex flex-col flex-nowrap'))
    for (const x of SURFACE_CLASSES) expect(c).not.toContain(x)
    expect(pad(c)).toEqual([])
  })

  describe('variant', () => {
    it('plain adds no surface classes', () => {
      const c = mount(Stack, { props: { variant: 'plain' } }).classes()
      for (const x of SURFACE_CLASSES) expect(c).not.toContain(x)
    })
    it('bordered adds a rounded hairline border and the default p-4', () => {
      const c = mount(Stack, { props: { variant: 'bordered' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'border-border', 'p-4']))
      expect(c).not.toContain('bg-card')
    })
    it('card adds the card token pair, a border and p-4', () => {
      const c = mount(Stack, { props: { variant: 'card' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'border-border', 'bg-card', 'text-card-foreground', 'p-4']))
    })
    it('muted adds the covered secondary token pair with no border and p-4', () => {
      const c = mount(Stack, { props: { variant: 'muted' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['rounded-lg', 'bg-secondary', 'text-secondary-foreground', 'p-4']))
      expect(c).not.toContain('border')
    })
    it('unknown variant falls back to plain', () => {
      const c = mount(Stack, { props: { variant: 'glass' as never } }).classes()
      expect(c).toEqual(mount(Stack).classes())
    })
    it('uses only rounded-lg (DESIGN.md: cards and panels) and no shadow', () => {
      for (const variant of stackSurfaces) {
        const c = mount(Stack, { props: { variant } }).classes().join(' ')
        expect(c).not.toMatch(/shadow|rounded-(xl|2xl|3xl)|backdrop|gradient/)
      }
    })
  })

  describe('padding', () => {
    it.each([
      ['none', 'p-0'],
      ['sm', 'p-3'],
      ['md', 'p-4'],
      ['lg', 'p-6'],
    ] as const)('%s on a card sets only %s', (padding, cls) => {
      expect(pad(mount(Stack, { props: { variant: 'card', padding } }).classes())).toEqual([cls])
    })
    it('padding applies to a plain stack too', () => {
      expect(pad(mount(Stack, { props: { padding: 'lg' } }).classes())).toEqual(['p-6'])
      expect(mount(Stack, { props: { padding: 'lg' } }).classes()).not.toContain('border')
    })
    it('auto is p-4 on a surface and nothing on plain', () => {
      expect(pad(mount(Stack, { props: { variant: 'muted', padding: 'auto' } }).classes())).toEqual(['p-4'])
      expect(pad(mount(Stack, { props: { padding: 'auto' } }).classes())).toEqual([])
    })
    it('unknown padding falls back to auto', () => {
      expect(pad(mount(Stack, { props: { variant: 'card', padding: 'xl' as never } }).classes())).toEqual(['p-4'])
    })
  })

  describe('combinations', () => {
    it('every variant x padding x direction mounts with at most one padding class and the layout classes intact', () => {
      for (const variant of stackSurfaces)
        for (const padding of stackPaddings)
          for (const direction of ['vertical', 'horizontal'] as const) {
            const w = mount(Stack, { props: { variant, padding, direction, gap: 2 } })
            expect(pad(w.classes()).length).toBeLessThanOrEqual(1)
            expect(w.classes()).toEqual(expect.arrayContaining(['flex', direction === 'vertical' ? 'flex-col' : 'flex-row', 'gap-2']))
            expect(w.attributes('data-direction')).toBe(direction)
          }
    })
    it('card with divided keeps the dividers inside the padding', () => {
      const c = mount(Stack, { props: { variant: 'card', divided: true, gap: 0 } }).classes()
      expect(c).toEqual(expect.arrayContaining(['divide-y', 'divide-border', 'bg-card', 'p-4', 'gap-0']))
    })
    it('horizontal collapse and responsive gap still work on a surface', () => {
      const c = mount(Stack, { props: { variant: 'bordered', direction: 'horizontal', collapse: 'md', gapMd: 6 } }).classes()
      expect(c).toEqual(expect.arrayContaining(['flex-col', 'md:flex-row', 'md:gap-6', 'border']))
    })
    it('class prop wins over the surface and padding', () => {
      const c = mount(Stack, { props: { variant: 'card', padding: 'lg', class: 'bg-background p-1 rounded-none' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-background', 'p-1', 'rounded-none']))
      for (const x of ['bg-card', 'p-6', 'rounded-lg']) expect(c).not.toContain(x)
    })
    it('as and asChild keep the surface', () => {
      const ul = mount(Stack, { props: { as: 'ul', variant: 'card' } })
      expect(ul.element.tagName).toBe('UL')
      expect(ul.classes()).toContain('bg-card')
      const child = mount(Stack, { props: { asChild: true, variant: 'bordered' }, slots: { default: '<section>x</section>' } })
      expect(child.element.tagName).toBe('SECTION')
      expect(child.classes()).toContain('border-border')
    })
    it('empty and long content render in a surface', () => {
      expect(mount(Stack, { props: { variant: 'muted' } }).text()).toBe('')
      expect(mount(Stack, { props: { variant: 'card' }, slots: { default: 'x'.repeat(5000) } }).text()).toHaveLength(5000)
    })
    it('stackVariants is reusable for plain elements', () => {
      expect(stackVariants({ variant: 'card', padding: 'sm' })).toEqual(expect.stringContaining('bg-card'))
      expect(pad(stackVariants({ variant: 'card', padding: 'sm' }).split(' '))).toEqual(['p-3'])
    })
  })

  describe('HStack and VStack forward the new props', () => {
    it('HStack', () => {
      const w = mount(HStack, { props: { variant: 'muted', padding: 'sm' } })
      expect(w.attributes('data-slot')).toBe('h-stack')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex-row', 'items-center', 'bg-secondary', 'p-3']))
    })
    it('VStack', () => {
      const w = mount(VStack, { props: { variant: 'card' } })
      expect(w.attributes('data-slot')).toBe('v-stack')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex-col', 'bg-card', 'p-4']))
    })
    it('default HStack and VStack have no surface', () => {
      expect(mount(HStack).classes()).not.toContain('border')
      expect(mount(VStack).classes()).not.toContain('bg-card')
    })
  })
})
