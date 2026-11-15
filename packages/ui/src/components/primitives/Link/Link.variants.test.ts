import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Link from './Link.vue'
import { linkVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('Link variations', () => {
  describe('default output is frozen', () => {
    const BASE =
      'rounded-sm font-medium underline-offset-4 transition-colors aria-disabled:pointer-events-none aria-disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'
    const ORIGINAL = {
      default: 'text-primary hover:underline',
      underline: 'text-primary underline hover:text-primary/80',
      muted: 'text-muted-foreground hover:text-foreground hover:underline',
      subtle: 'text-foreground underline decoration-border hover:decoration-foreground',
    } as const
    it.each(Object.keys(ORIGINAL))('variant %s emits the exact original class set (size inherit adds nothing)', (variant) => {
      const expected = set(`${BASE} ${ORIGINAL[variant as keyof typeof ORIGINAL]}`)
      expect(set(linkVariants({ variant: variant as never }))).toEqual(expected)
      expect(set(mount(Link, { props: { variant: variant as never } }).classes().join(' '))).toEqual(expected)
    })
    it('no props renders the default variant with no size class', () => {
      expect(set(mount(Link).classes().join(' '))).toEqual(set(`${BASE} ${ORIGINAL.default}`))
    })
  })

  describe('variant', () => {
    it('plain inherits the surrounding colour and stays underlined (not colour alone)', () => {
      const w = mount(Link, { props: { variant: 'plain', href: '/x' }, slots: { default: 'Go' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['text-inherit', 'underline', 'hover:decoration-2']))
      expect(w.classes()).not.toContain('text-primary')
    })

    it('destructive uses the destructive text colour and stays underlined', () => {
      const w = mount(Link, { props: { variant: 'destructive', href: '/x' }, slots: { default: 'Delete' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['text-destructive', 'underline']))
      expect(w.classes()).not.toContain('text-primary')
    })

    it('every variant keeps the focus ring and the disabled styles', () => {
      for (const variant of ['default', 'underline', 'muted', 'subtle', 'plain', 'destructive'] as const) {
        const c = mount(Link, { props: { variant } }).classes().join(' ')
        expect(c, variant).toContain('focus-visible:ring-3')
        expect(c, variant).toContain('aria-disabled:opacity-50')
      }
    })

    it('uses only token colours (no raw palette classes)', () => {
      for (const variant of ['plain', 'destructive'] as const) expect(linkVariants({ variant })).not.toMatch(/-(?:red|blue|green|gray|slate)-\d/)
    })

    it('unknown variant falls back to default', () => {
      expect(set(mount(Link, { props: { variant: 'neon' as never } }).classes().join(' '))).toEqual(set(mount(Link).classes().join(' ')))
    })
  })

  describe('size', () => {
    it.each([
      ['inherit', null],
      ['sm', 'text-sm'],
      ['md', 'text-base'],
      ['lg', 'text-lg'],
    ] as const)('%s', (size, cls) => {
      const c = mount(Link, { props: { size } }).classes()
      if (cls) expect(c).toContain(cls)
      else expect(c.filter((x) => /^text-(?:xs|sm|base|lg|xl)$/.test(x))).toEqual([])
    })

    it('unknown size falls back to inherit (no text-size class)', () => {
      expect(mount(Link, { props: { size: 'giant' as never } }).classes().filter((x) => /^text-(?:xs|sm|base|lg|xl)$/.test(x))).toEqual([])
    })

    it('size is reusable on plain elements through linkVariants', () => {
      expect(linkVariants({ size: 'lg', variant: 'plain' })).toEqual(expect.stringContaining('text-lg'))
    })
  })

  describe('combinations', () => {
    it.each([
      ['plain', 'sm'],
      ['destructive', 'lg'],
      ['muted', 'md'],
      ['subtle', 'sm'],
    ] as const)('variant %s with size %s applies both and keeps one text colour', (variant, size) => {
      const c = mount(Link, { props: { variant, size } }).classes()
      expect(c).toContain({ sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size])
      expect(c.filter((x) => /^text-(?:primary|inherit|destructive|foreground|muted-foreground)$/.test(x))).toHaveLength(1)
    })

    it('class prop wins over variant and size', () => {
      const c = mount(Link, { props: { variant: 'destructive', size: 'lg', class: 'text-foreground text-xs' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-foreground', 'text-xs']))
      expect(c).not.toContain('text-destructive')
      expect(c).not.toContain('text-lg')
    })

    it('new variants keep external and disabled behaviour', () => {
      const ext = mount(Link, { props: { variant: 'plain', size: 'sm', href: 'https://x.dev', external: true }, slots: { default: 'X' } })
      expect(ext.attributes('target')).toBe('_blank')
      expect(ext.find('.sr-only').text()).toBe('(opens in new tab)')
      const off = mount(Link, { props: { variant: 'destructive', href: '/x', disabled: true }, slots: { default: 'Delete' } })
      expect(off.attributes('aria-disabled')).toBe('true')
      expect(off.attributes('role')).toBe('link')
      expect(off.attributes('href')).toBeUndefined()
    })

    it('keeps an accessible name from its text for every variant', () => {
      for (const variant of ['plain', 'destructive'] as const) expect(mount(Link, { props: { variant, href: '/x' }, slots: { default: 'Docs' } }).text()).toBe('Docs')
    })
  })
})
