import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Kbd from './Kbd.vue'
import KbdGroup from './KbdGroup.vue'
import { kbdGroupVariants, kbdSeparatorVariants, kbdVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('Kbd variations', () => {
  describe('default output is frozen', () => {
    const BASE =
      'inline-flex w-fit shrink-0 select-none items-center justify-center rounded-sm border border-border bg-muted font-mono font-medium text-muted-foreground shadow-xs [&_svg:not([class*="size-"])]:size-3'
    it('md default emits the original class set', () => {
      const expected = set(`${BASE} h-6 min-w-6 px-1.5 text-xs`)
      expect(set(kbdVariants())).toEqual(expected)
      expect(set(mount(Kbd).classes().join(' '))).toEqual(expected)
    })
    it('sm emits the original class set', () => {
      expect(set(kbdVariants({ size: 'sm' }))).toEqual(set(`${BASE} h-5 min-w-5 px-1 text-2xs`))
    })
    it('group and separator keep their original classes', () => {
      expect(set(kbdGroupVariants())).toEqual(set('inline-flex items-center gap-1'))
      const w = mount(KbdGroup, { props: { keys: ['A', 'B'], separator: '+' } })
      expect(set(w.classes().join(' '))).toEqual(set('inline-flex items-center gap-1'))
      expect(set(w.find('[data-slot="kbd-separator"]').classes().join(' '))).toEqual(set('text-xs text-muted-foreground'))
    })
  })

  describe('variant', () => {
    it.each([
      ['default', ['border-border', 'bg-muted', 'text-muted-foreground', 'shadow-xs']],
      ['outline', ['border-border', 'bg-transparent', 'text-muted-foreground']],
      ['ghost', ['border-transparent', 'bg-transparent', 'text-muted-foreground']],
      ['solid', ['border-transparent', 'bg-foreground', 'text-background']],
    ] as const)('%s renders its surface classes', (variant, cls) => {
      const w = mount(Kbd, { props: { variant }, slots: { default: 'K' } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(w.text()).toBe('K')
    })

    it('variants replace the default fill (no conflicting classes after merge)', () => {
      for (const variant of ['outline', 'ghost', 'solid'] as const) {
        const c = mount(Kbd, { props: { variant } }).classes()
        expect(c, variant).not.toContain('bg-muted')
        expect(c, variant).not.toContain('shadow-xs')
      }
      expect(mount(Kbd, { props: { variant: 'solid' } }).classes()).not.toContain('text-muted-foreground')
      expect(mount(Kbd, { props: { variant: 'ghost' } }).classes()).not.toContain('border-border')
    })

    it('ghost and solid, which rely on fill, keep a forced-colors border; the others already have one', () => {
      expect(mount(Kbd, { props: { variant: 'ghost' } }).classes()).toContain('forced-colors:border-current')
      expect(mount(Kbd, { props: { variant: 'solid' } }).classes()).toContain('forced-colors:border-current')
      for (const variant of ['default', 'outline'] as const) {
        const c = mount(Kbd, { props: { variant } }).classes()
        expect(c).toContain('border')
        expect(c).toContain('border-border')
      }
    })

    it('solid uses the inverted token pair covered by the contrast test (foreground on background)', () => {
      const c = mount(Kbd, { props: { variant: 'solid' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
    })

    it('unknown variant falls back to default', () => {
      const w = mount(Kbd, { props: { variant: 'neon' as never } })
      expect(set(w.classes().join(' '))).toEqual(set(mount(Kbd).classes().join(' ')))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['h-4', 'min-w-4', 'px-1', 'text-2xs']],
      ['sm', ['h-5', 'min-w-5', 'px-1', 'text-2xs']],
      ['md', ['h-6', 'min-w-6', 'px-1.5', 'text-xs']],
      ['lg', ['h-7', 'min-w-7', 'px-2', 'text-sm']],
    ] as const)('%s renders its height, padding and text size', (size, cls) => {
      expect(mount(Kbd, { props: { size } }).classes()).toEqual(expect.arrayContaining([...cls]))
    })

    it('xs and lg size the inline icon', () => {
      expect(kbdVariants({ size: 'xs' })).toContain('[&_svg:not([class*="size-"])]:size-2.5')
      expect(kbdVariants({ size: 'lg' })).toContain('[&_svg:not([class*="size-"])]:size-4')
    })

    it('unknown size falls back to md', () => {
      expect(mount(Kbd, { props: { size: 'huge' as never } }).classes()).toEqual(expect.arrayContaining(['h-6', 'min-w-6']))
    })
  })

  describe('combinations', () => {
    it.each([
      ['xs', 'solid'],
      ['lg', 'ghost'],
      ['sm', 'outline'],
      ['lg', 'solid'],
    ] as const)('size %s with variant %s applies both dimensions without conflict', (size, variant) => {
      const c = mount(Kbd, { props: { size, variant } }).classes()
      const h = { xs: 'h-4', sm: 'h-5', lg: 'h-7' }[size]
      expect(c).toContain(h)
      expect(c.filter((x) => /^h-\d/.test(x))).toHaveLength(1)
      expect(c.filter((x) => /^bg-/.test(x))).toHaveLength(1)
      expect(c.filter((x) => /^text-(?!2xs|xs|sm)/.test(x))).toHaveLength(1)
    })

    it('class prop wins over variant and size', () => {
      const c = mount(Kbd, { props: { variant: 'solid', size: 'lg', class: 'bg-primary text-primary-foreground h-9' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-primary', 'text-primary-foreground', 'h-9']))
      expect(c).not.toContain('bg-foreground')
      expect(c).not.toContain('h-7')
    })

    it('is still a <kbd> with data-slot for every variant (assistive tech reads keyboard input)', () => {
      for (const variant of ['default', 'outline', 'ghost', 'solid'] as const) {
        const w = mount(Kbd, { props: { variant }, slots: { default: 'Ctrl' } })
        expect(w.element.tagName).toBe('KBD')
        expect(w.attributes('data-slot')).toBe('kbd')
        expect(w.attributes('aria-hidden')).toBeUndefined()
      }
    })

    it('uses no physical-direction or arbitrary-value classes', () => {
      for (const variant of ['default', 'outline', 'ghost', 'solid'] as const)
        for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
          const out = kbdVariants({ variant, size }).replace(/\[&_svg:not\(\[class\*="size-"\]\)\]:size-[\d.]+/g, '')
          expect(out).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-|\[/)
        }
    })
  })
})

describe('KbdGroup variations', () => {
  describe('gap', () => {
    it.each([
      ['none', 'gap-0'],
      ['sm', 'gap-0.5'],
      ['md', 'gap-1'],
      ['lg', 'gap-2'],
    ] as const)('%s uses %s', (gap, cls) => {
      const w = mount(KbdGroup, { props: { gap, keys: ['A', 'B'] } })
      expect(w.classes()).toContain(cls)
      expect(w.classes().filter((c) => c.startsWith('gap-'))).toEqual([cls])
    })

    it('unknown gap falls back to md', () => {
      expect(mount(KbdGroup, { props: { gap: 'wide' as never } }).classes()).toContain('gap-1')
    })

    it('class prop wins over gap', () => {
      const w = mount(KbdGroup, { props: { gap: 'lg', class: 'gap-6' } })
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-2')
    })
  })

  describe('variant and size reach generated chips', () => {
    it('variant is applied to every chip generated from keys', () => {
      const w = mount(KbdGroup, { props: { keys: ['Ctrl', 'K'], variant: 'solid' } })
      const chips = w.findAll('[data-slot="kbd"]')
      expect(chips).toHaveLength(2)
      for (const chip of chips) expect(chip.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
    })

    it('size is applied to chips and scales the separator', () => {
      for (const [size, chip, sep] of [
        ['xs', 'h-4', 'text-2xs'],
        ['sm', 'h-5', 'text-xs'],
        ['md', 'h-6', 'text-xs'],
        ['lg', 'h-7', 'text-sm'],
      ] as const) {
        const w = mount(KbdGroup, { props: { keys: ['A', 'B'], size, separator: '+' } })
        expect(w.find('[data-slot="kbd"]').classes()).toContain(chip)
        expect(w.find('[data-slot="kbd-separator"]').classes()).toContain(sep)
      }
    })

    it('unknown size and variant fall back to the defaults', () => {
      const w = mount(KbdGroup, { props: { keys: ['A', 'B'], separator: '+', size: 'x' as never, variant: 'y' as never } })
      expect(set(w.find('[data-slot="kbd"]').classes().join(' '))).toEqual(set(kbdVariants()))
      expect(set(w.find('[data-slot="kbd-separator"]').classes().join(' '))).toEqual(set(kbdSeparatorVariants()))
    })

    it('slotted Kbd children keep their own props', () => {
      const w = mount(KbdGroup, { props: { variant: 'solid' }, slots: { default: () => h(Kbd, { variant: 'outline' }, () => 'S') } })
      expect(w.find('[data-slot="kbd"]').classes()).toContain('bg-transparent')
    })

    it('separators stay aria-hidden for every size, so keys are read in sequence', () => {
      for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
        const w = mount(KbdGroup, { props: { keys: ['A', 'B', 'C'], size, separator: '+' } })
        for (const sep of w.findAll('[data-slot="kbd-separator"]')) expect(sep.attributes('aria-hidden')).toBe('true')
      }
    })

    it('group variant x gap x size cross-product keeps one gap class and renders all chips', () => {
      const w = mount(KbdGroup, { props: { keys: ['A', 'B'], variant: 'ghost', gap: 'none', size: 'lg', separator: '+' } })
      expect(w.classes().filter((c) => c.startsWith('gap-'))).toEqual(['gap-0'])
      expect(w.findAll('[data-slot="kbd"]').every((k) => k.classes().includes('h-7') && k.classes().includes('border-transparent'))).toBe(true)
    })
  })
})
