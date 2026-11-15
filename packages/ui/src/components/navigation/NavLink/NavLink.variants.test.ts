import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import NavLink from './NavLink.vue'
import { navLinkVariants } from './index'

const make = (props: Record<string, unknown> = {}) => mount(NavLink, { props: { href: '/x', ...props }, slots: { default: 'Label' } })

describe('NavLink variations', () => {
  describe('defaults are unchanged', () => {
    it('default variant, size and shape produce today\'s classes', () => {
      const cls = make().classes()
      expect(cls).toEqual(expect.arrayContaining(['rounded-md', 'text-muted-foreground', 'h-9', 'px-3', 'pointer-coarse:min-h-11', 'text-sm']))
      expect(cls).not.toContain('rounded-full')
      expect(navLinkVariants()).toBe(navLinkVariants({ variant: 'default', size: 'md', shape: 'rounded' }))
      expect(navLinkVariants()).toContain('rounded-md text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground h-9 px-3 pointer-coarse:min-h-11')
    })
  })

  describe('variant', () => {
    it('plain reads as text: bold when current, underlined on hover and in forced colors', () => {
      const cls = make({ variant: 'plain', active: true }).classes()
      expect(cls).toContain('text-foreground')
      expect(cls).toContain('hover:underline')
      expect(cls).toContain('aria-[current=page]:font-semibold')
      expect(cls).toContain('font-normal')
      expect(cls).not.toContain('font-medium')
      expect(cls).toContain('forced-colors:aria-[current=page]:underline')
      expect(cls).not.toContain('text-muted-foreground')
      expect(make({ variant: 'plain', active: true }).attributes('aria-current')).toBe('page')
    })

    it('solid fills the current link with the primary pair and keeps it on hover', () => {
      const cls = make({ variant: 'solid', active: true }).classes()
      expect(cls).toContain('aria-[current=page]:bg-primary')
      expect(cls).toContain('aria-[current=page]:text-primary-foreground')
      expect(cls).toContain('aria-[current=page]:hover:bg-primary')
      expect(cls).toContain('aria-[current=page]:hover:text-primary-foreground')
      expect(cls).toContain('hover:bg-accent')
    })

    it('outline borders the current link and leaves the others borderless', () => {
      const cls = make({ variant: 'outline' }).classes()
      expect(cls).toContain('border')
      expect(cls).toContain('border-transparent')
      expect(cls).toContain('aria-[current=page]:border-border')
      expect(cls).toContain('aria-[current=page]:bg-background')
    })

    it('every variant, old and new, renders a different class list', () => {
      const variants = ['default', 'pill', 'sidebar', 'underline', 'plain', 'solid', 'outline']
      expect(new Set(variants.map((variant) => make({ variant }).classes().join(' '))).size).toBe(variants.length)
    })

    it('state is never colour alone: every variant has a non-colour current marker', () => {
      const marker = /aria-\[current=page\]:(bg-|border|font-)|forced-colors:aria-\[current=page\]:underline/
      for (const variant of ['default', 'pill', 'sidebar', 'underline', 'plain', 'solid', 'outline']) expect(make({ variant }).classes().join(' '), variant).toMatch(marker)
    })

    it('unknown variant falls back to default', () => {
      expect(make({ variant: 'neon' }).classes()).toEqual(make().classes())
    })
  })

  describe('size', () => {
    it.each([
      ['xs', 'h-6', 'px-2', 'text-xs'],
      ['sm', 'h-8', 'px-2.5', undefined],
      ['md', 'h-9', 'px-3', 'text-sm'],
      ['lg', 'h-11', 'px-4', 'text-base'],
    ])('%s sets the height, padding and text', (size, h, px, text) => {
      const cls = make({ size }).classes()
      expect(cls).toContain(h)
      expect(cls).toContain(px)
      if (text) expect(cls).toContain(text)
      if (size === 'lg' || size === 'xs') expect(cls).not.toContain('text-sm')
    })

    it('xs keeps a 24px target and grows on coarse pointers', () => {
      expect(make({ size: 'xs' }).classes()).toContain('h-6')
      expect(make({ size: 'xs' }).classes()).toContain('pointer-coarse:min-h-10')
    })

    it('unknown size falls back to md', () => {
      expect(make({ size: 'huge' }).classes()).toEqual(make().classes())
    })

    it('size still applies to the other variants and to collapsed icon links', () => {
      const w = make({ variant: 'sidebar', size: 'lg', collapsed: true })
      expect(w.classes()).toContain('h-11')
      expect(w.get('[data-slot="nav-link-label"]').classes()).toContain('sr-only')
    })
  })

  describe('shape', () => {
    it('rounded is the default', () => {
      expect(make({ shape: 'rounded' }).classes()).toEqual(make().classes())
    })

    it('pill and square replace the radius of the variant', () => {
      for (const variant of ['default', 'pill', 'solid', 'outline', 'plain']) {
        expect(make({ variant, shape: 'pill' }).classes(), variant).toContain('rounded-full')
        expect(make({ variant, shape: 'pill' }).classes(), variant).not.toContain('rounded-md')
        expect(make({ variant, shape: 'square' }).classes(), variant).toContain('rounded-none')
        expect(make({ variant, shape: 'square' }).classes(), variant).not.toContain('rounded-md')
      }
    })

    it('unknown shape falls back to rounded', () => {
      expect(make({ shape: 'blob' }).classes()).toEqual(make().classes())
    })
  })

  describe('combinations and overrides', () => {
    it.each([
      ['solid', 'lg', 'pill'],
      ['outline', 'xs', 'square'],
      ['plain', 'sm', 'rounded'],
    ])('%s + %s + %s do not conflict', (variant, size, shape) => {
      const w = make({ variant, size, shape, active: true, icon: undefined, badge: 3 })
      expect(w.attributes('aria-current')).toBe('page')
      expect(w.find('[data-slot="nav-link-badge"]').exists()).toBe(true)
      expect(w.text()).toContain('Label')
      const heights = w.classes().filter((c) => /^h-\d/.test(c))
      expect(heights).toHaveLength(1)
    })

    it('class still wins over every dimension', () => {
      const w = make({ variant: 'solid', size: 'lg', shape: 'pill', class: 'h-20 rounded-sm px-1' })
      expect(w.classes()).toEqual(expect.arrayContaining(['h-20', 'rounded-sm', 'px-1']))
      expect(w.classes()).not.toContain('h-11')
      expect(w.classes()).not.toContain('rounded-full')
    })

    it('exported variants work on plain anchors through cn()', () => {
      const cls = cn(navLinkVariants({ variant: 'outline', size: 'lg', shape: 'pill' }))
      expect(cls).toContain('rounded-full')
      expect(cls).not.toContain('rounded-md')
      expect(cls).toContain('h-11')
      expect(cls).not.toContain('h-9')
    })

    it('keeps names, focus ring and disabled behaviour in new variants', () => {
      const w = make({ variant: 'solid', disabled: true })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('tabindex')).toBe('-1')
      expect(w.attributes('href')).toBeUndefined()
      expect(w.classes()).toContain('focus-visible:ring-3')
      expect(w.classes()).toContain('aria-disabled:opacity-50')
    })

    it('handles very long labels by truncating inside the link', () => {
      const long = 'A very long navigation label '.repeat(8).trim()
      const w = mount(NavLink, { props: { href: '/x', variant: 'outline', size: 'lg' }, slots: { default: long } })
      expect(w.get('[data-slot="nav-link-label"]').classes()).toContain('truncate')
      expect(w.text()).toBe(long)
      expect(w.classes()).toContain('min-w-0')
    })
  })
})
