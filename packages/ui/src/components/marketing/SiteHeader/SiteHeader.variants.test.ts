import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SiteHeader from './SiteHeader.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import {
  siteHeaderAppearanceNames,
  siteHeaderBarVariants,
  siteHeaderBrandVariants,
  siteHeaderInvertedFocus,
  siteHeaderLinkVariants,
  siteHeaderPanelVariants,
  siteHeaderSizeNames,
  siteHeaderToggleVariants,
  siteHeaderToneNames,
  siteHeaderVariantNames,
  siteHeaderVariants,
} from './variants'

const { errors, open } = useContractHarness()
const links = [
  { label: 'Docs', href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})
const mountWith = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => (w = mount(SiteHeader, { props: { brand: 'Example', links, activeHref: '/docs', ...props }, slots }))
const bar = () => w!.find('[data-slot="site-header-bar"]')
const brand = () => w!.find('[data-slot="site-header-logo"] a')
const link = (i = 0) => w!.findAll('[data-slot="site-header-link"]')[i]
const toggle = () => w!.find('[data-slot="site-header-toggle"]')
const scroll = async (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
}

describe('SiteHeader variations', () => {
  describe('defaults are unchanged', () => {
    it('keeps the original root, bar, brand, link and toggle classes', () => {
      mountWith()
      expect([...w!.classes()].sort()).toEqual(['bg-background', 'border-b', 'border-border', 'sticky', 'text-foreground', 'top-0', 'w-full', 'z-(--z-sticky)'])
      expect([...bar().classes()].sort()).toEqual(['flex', 'gap-4', 'items-center', 'justify-between', 'lg:px-8', 'max-w-7xl', 'min-h-16', 'mx-auto', 'px-4', 'sm:px-6', 'w-full'])
      expect([...brand().classes()].sort()).toEqual(
        ['inline-flex', 'min-h-6', 'items-center', 'rounded-md', 'text-lg', 'font-semibold', 'tracking-tight', 'pointer-coarse:min-h-11', 'outline-hidden', 'focus-visible:border-ring', 'focus-visible:ring-3', 'focus-visible:ring-ring/40'].sort(),
      )
      expect(link(0).classes()).toEqual(expect.arrayContaining(['inline-flex', 'min-h-6', 'items-center', 'rounded-md', 'px-3', 'py-2', 'text-sm', 'font-medium', 'transition-colors', 'pointer-coarse:min-h-11', 'text-foreground', 'underline', 'decoration-2', 'underline-offset-4']))
      expect(link(1).classes()).toEqual(expect.arrayContaining(['text-muted-foreground', 'hover:text-foreground']))
      expect(toggle().classes()).toEqual(expect.arrayContaining(['inline-flex', 'size-10', 'items-center', 'justify-center', 'rounded-md', 'hover:bg-accent', 'pointer-coarse:size-11', 'md:hidden']))
      for (const [a, v] of [['data-size', 'md'], ['data-tone', 'default'], ['data-appearance', 'bordered'], ['data-variant', 'default']]) expect(w!.attributes(a)).toBe(v)
    })
    it('minimal and floating keep their slimmer bar', () => {
      mountWith({ variant: 'minimal' })
      expect(bar().classes()).toContain('min-h-14')
      w!.unmount()
      mountWith({ variant: 'floating' })
      expect(bar().classes()).toContain('min-h-14')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'min-h-12', 'text-base', 'text-sm', 'size-9'],
      ['md', 'min-h-16', 'text-lg', 'text-sm', 'size-10'],
      ['lg', 'min-h-20', 'text-xl', 'text-base', 'size-11'],
    ] as const)('%s: bar %s, brand %s, link %s, toggle %s', (size, minH, brandText, linkText, toggleSize) => {
      mountWith({ size })
      expect(bar().classes().filter((c) => c.startsWith('min-h-'))).toEqual([minH])
      expect(brand().classes()).toContain(brandText)
      expect(brand().classes().filter((c) => /^text-(base|lg|xl)$/.test(c))).toHaveLength(1)
      expect(link(1).classes()).toContain(linkText)
      expect(toggle().classes().filter((c) => /^size-\d+$/.test(c))).toEqual([toggleSize])
      expect(w!.attributes('data-size')).toBe(size)
    })
    it.each([
      ['minimal', 'sm', 'min-h-10'],
      ['minimal', 'lg', 'min-h-16'],
      ['floating', 'sm', 'min-h-10'],
      ['floating', 'lg', 'min-h-16'],
      ['centered', 'sm', 'min-h-12'],
      ['stacked', 'lg', 'min-h-20'],
      ['transparent', 'sm', 'min-h-12'],
      ['with-announcement', 'lg', 'min-h-20'],
    ] as const)('%s at %s uses %s', (variant, size, cls) => {
      mountWith({ variant, size, announcement: 'x' })
      expect(bar().classes().filter((c) => c.startsWith('min-h-'))).toEqual([cls])
    })
    it('the bar stays a minimum height at every size (large text can grow it)', () => {
      for (const size of siteHeaderSizeNames) {
        mountWith({ size })
        expect(bar().classes().join(' ')).not.toMatch(/(^| )h-\d/)
        w!.unmount()
      }
      w = undefined
    })
    it('targets keep 24px (44px on coarse pointers) at every size', () => {
      for (const size of siteHeaderSizeNames) {
        mountWith({ size })
        for (const el of [brand(), link(0)]) expect(el.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
        expect(toggle().classes()).toContain('pointer-coarse:size-11')
        w!.unmount()
      }
      w = undefined
    })
    it('the mobile menu links stay text-base at every size', async () => {
      mountWith({ size: 'sm' })
      await toggle().trigger('click')
      expect(w!.find('[data-slot="site-header-mobile-link"]').classes()).toContain('text-base')
      expect(w!.find('[data-slot="site-header-mobile-link"]').classes()).not.toContain('text-sm')
    })
    it('an unknown size falls back to md', () => {
      mountWith({ size: 'xl' })
      expect(w!.attributes('data-size')).toBe('md')
      expect(bar().classes()).toContain('min-h-16')
    })
  })

  describe('tone', () => {
    it('muted uses the muted surface and the same text colours as default', () => {
      mountWith({ tone: 'muted' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-muted', 'border-border']))
      expect(w!.classes()).not.toContain('bg-background')
      expect(link(1).classes()).toContain('text-muted-foreground')
      expect(link(0).classes()).toContain('text-foreground')
      expect(w!.attributes('data-tone')).toBe('muted')
    })
    it('inverted uses the ink surface with page-coloured links, underline on hover and a page-colour focus outline', () => {
      mountWith({ tone: 'inverted' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'border-background/20']))
      expect(w!.classes()).not.toContain('bg-background')
      expect(link(1).classes()).toEqual(expect.arrayContaining(['text-background', 'hover:underline', 'hover:underline-offset-4']))
      expect(link(1).classes()).not.toContain('text-muted-foreground')
      expect(link(0).classes()).toEqual(expect.arrayContaining(['underline', 'decoration-2', 'text-background']))
      for (const el of [link(0), brand(), toggle()]) {
        expect(el.classes()).toEqual(expect.arrayContaining(siteHeaderInvertedFocus.split(' ')))
        expect(el.classes()).not.toContain('focus-visible:ring-3')
      }
      expect(toggle().classes()).toContain('hover:bg-background/20')
      expect(toggle().classes()).not.toContain('hover:bg-accent')
    })
    it('the current page is underlined in every tone, not only recoloured', () => {
      for (const tone of siteHeaderToneNames) {
        mountWith({ tone })
        expect(link(0).attributes('aria-current')).toBe('page')
        expect(link(0).classes()).toEqual(expect.arrayContaining(['underline', 'decoration-2', 'underline-offset-4']))
        expect(link(1).classes()).not.toContain('decoration-2')
        w!.unmount()
      }
      w = undefined
    })
    it('the mobile panel and group titles follow the tone', async () => {
      mountWith({ tone: 'inverted', links: undefined, linkGroups: [{ title: 'Guides', links }] })
      await toggle().trigger('click')
      expect(w!.find('[data-slot="site-header-mobile"]').classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'border-background/20']))
      expect(w!.find('[data-slot="site-header-mobile-group-title"]').classes()).toContain('text-background')
      expect(w!.find('[data-slot="site-header-mobile-group-title"]').classes()).not.toContain('text-muted-foreground')
      w!.unmount()
      mountWith({ tone: 'muted', links: undefined, linkGroups: [{ title: 'Guides', links }] })
      await toggle().trigger('click')
      expect(w!.find('[data-slot="site-header-mobile"]').classes()).toContain('bg-muted')
      expect(w!.find('[data-slot="site-header-mobile-group-title"]').classes()).toContain('text-muted-foreground')
    })
    it('desktop group separators use the tone border colour', () => {
      mountWith({ tone: 'inverted', links: undefined, linkGroups: [{ title: 'Guides', links }] })
      expect(w!.find('[data-slot="site-header-group"]').classes()).toEqual(expect.arrayContaining(['border-s', 'ps-2', 'border-background/20']))
    })
    it('transparent keeps the page colours until it turns solid, then takes the tone', async () => {
      mountWith({ variant: 'transparent', tone: 'inverted' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-transparent', 'border-transparent']))
      expect(w!.classes()).not.toContain('bg-foreground')
      expect(w!.classes()).not.toContain('text-background')
      expect(link(1).classes()).toContain('text-muted-foreground')
      expect(link(1).classes()).not.toContain('text-background')
      expect(brand().classes()).toContain('focus-visible:ring-3')
      await scroll(120)
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
      expect(w!.classes()).not.toContain('bg-transparent')
      expect(link(1).classes()).toContain('text-background')
      await scroll(0)
      expect(w!.classes()).toContain('bg-transparent')
    })
    it('transparent is solid with the tone while the mobile menu is open', async () => {
      mountWith({ variant: 'transparent', tone: 'muted' })
      await toggle().trigger('click')
      expect(w!.classes()).toContain('bg-muted')
    })
    it('an unknown tone falls back to default', () => {
      mountWith({ tone: 'neon' })
      expect(w!.attributes('data-tone')).toBe('default')
      expect(w!.classes()).toContain('bg-background')
    })
    it('every tone is opaque: no blur, translucent surface or shadow', () => {
      for (const tone of siteHeaderToneNames) {
        mountWith({ tone, variant: 'floating' })
        expect(w!.html()).not.toMatch(/backdrop|blur|shadow/)
        expect(w!.classes().join(' ')).not.toMatch(/bg-[\w-]+\//)
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('appearance', () => {
    it('bordered is the original hairline', () => {
      mountWith({ appearance: 'bordered' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['border-b', 'border-border']))
      expect(w!.classes()).not.toContain('border-b-2')
    })
    it('flat has no border classes on a bar', () => {
      mountWith({ appearance: 'flat' })
      expect(w!.classes().filter((c) => /^border/.test(c))).toEqual([])
      expect(w!.attributes('data-appearance')).toBe('flat')
    })
    it('elevated is a 2px stronger border and casts no shadow', () => {
      mountWith({ appearance: 'elevated' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['border-b-2', 'border-input']))
      expect(w!.classes()).not.toContain('border-b')
      expect(w!.classes()).not.toContain('border-border')
      expect(w!.html()).not.toMatch(/shadow/)
    })
    it.each([
      ['bordered', ['border', 'border-border']],
      ['flat', ['border', 'border-transparent']],
      ['elevated', ['border-2', 'border-input']],
    ] as const)('floating %s uses %j and keeps rounded-lg', (appearance, cls) => {
      mountWith({ variant: 'floating', appearance })
      expect(w!.classes()).toEqual(expect.arrayContaining([...cls, 'rounded-lg']))
    })
    it('transparent shows the appearance border only once solid', async () => {
      mountWith({ variant: 'transparent', appearance: 'elevated' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['border-b', 'border-transparent']))
      expect(w!.classes()).not.toContain('border-b-2')
      await scroll(100)
      expect(w!.classes()).toEqual(expect.arrayContaining(['border-b-2', 'border-input']))
      expect(w!.classes()).not.toContain('border-transparent')
    })
    it('inverted borders use the page colour at low opacity (bordered) and higher opacity (elevated)', () => {
      mountWith({ tone: 'inverted', appearance: 'elevated' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['border-b-2', 'border-background/40']))
      w!.unmount()
      mountWith({ tone: 'inverted', appearance: 'flat' })
      expect(w!.classes().filter((c) => /^border/.test(c))).toEqual([])
    })
    it('an unknown appearance falls back to bordered', () => {
      mountWith({ appearance: 'glass' })
      expect(w!.attributes('data-appearance')).toBe('bordered')
      expect(w!.classes()).toContain('border-b')
    })
  })

  describe('variant stacked', () => {
    it('puts the brand and actions on a first row and the nav on a second row', () => {
      mountWith({ variant: 'stacked' }, { cta: '<button id="cta">Go</button>' })
      expect(w!.attributes('data-variant')).toBe('stacked')
      expect(bar().classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'justify-between', 'max-w-7xl', 'min-h-16']))
      const nav = w!.find('[data-slot="site-header-nav"]')
      expect(nav.classes()).toEqual(expect.arrayContaining(['order-3', 'w-full', 'border-t', 'hidden', 'md:flex']))
      expect(toggle().element.parentElement!.classList.contains('order-2')).toBe(true)
      expect(w!.classes()).toEqual(expect.arrayContaining(['sticky', 'top-0', 'bg-background', 'border-b']))
    })
    it('keeps DOM and tab order as brand, links, actions', () => {
      mountWith({ variant: 'stacked' }, { cta: '<button id="cta">Go</button>' })
      const html = w!.html()
      expect(html.indexOf('site-header-logo')).toBeLessThan(html.indexOf('site-header-nav'))
      expect(html.indexOf('site-header-nav')).toBeLessThan(html.indexOf('site-header-cta'))
    })
    it('keeps the menu button, its aria and the mobile panel', async () => {
      mountWith({ variant: 'stacked' })
      expect(toggle().classes()).toContain('md:hidden')
      expect(toggle().attributes('aria-expanded')).toBe('false')
      await toggle().trigger('click')
      expect(toggle().attributes('aria-expanded')).toBe('true')
      expect(w!.findAll('[data-slot="site-header-mobile-link"]')).toHaveLength(2)
      await w!.trigger('keydown', { key: 'Escape' })
      expect(toggle().attributes('aria-expanded')).toBe('false')
    })
    it('the nav rule follows the tone', () => {
      mountWith({ variant: 'stacked', tone: 'inverted' })
      expect(w!.find('[data-slot="site-header-nav"]').classes()).toContain('border-background/20')
    })
    it('works with no links (no nav, no toggle) and with only the brand', () => {
      mountWith({ variant: 'stacked', links: [] })
      expect(w!.find('[data-slot="site-header-nav"]').exists()).toBe(false)
      expect(toggle().exists()).toBe(false)
      expect(brand().text()).toBe('Example')
    })
    it('other variants do not get the second-row classes', () => {
      for (const variant of siteHeaderVariantNames.filter((v) => v !== 'stacked')) {
        mountWith({ variant, announcement: 'x' })
        // `minimal` has no desktop nav at all.
        if (variant !== 'minimal') expect(w!.find('[data-slot="site-header-nav"]').classes()).not.toContain('order-3')
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('combinations, overrides and accessibility', () => {
    const combos = siteHeaderVariantNames.flatMap((variant) => siteHeaderToneNames.map((tone) => [variant, tone] as const))
    it.each(combos)('variant %s with tone %s has one surface, one border style and the nav label', (variant, tone) => {
      mountWith({ variant, tone, appearance: 'elevated', size: 'lg', announcement: 'x' })
      const c = w!.classes()
      expect(c.filter((x) => /^bg-(background|muted|foreground|transparent)$/.test(x))).toHaveLength(1)
      expect(c.filter((x) => /^border-(b-)?2$|^border-b$|^border$/.test(x))).toHaveLength(1)
      if (variant !== 'minimal') expect(w!.find('nav').attributes('aria-label')).toBe('Main')
      expect(w!.element.tagName).toBe('HEADER')
    })
    it.each(combos)('variant %s with tone %s still has a named menu button and keyboard behaviour', async (variant, tone) => {
      mountWith({ variant, tone })
      expect(toggle().attributes('aria-label')).toBe('Menu')
      await toggle().trigger('click')
      expect(toggle().attributes('aria-expanded')).toBe('true')
      await w!.trigger('keydown', { key: 'Escape' })
      expect(toggle().attributes('aria-expanded')).toBe('false')
    })
    it('the class prop wins over size, tone and appearance classes', () => {
      mountWith({ tone: 'muted', appearance: 'elevated', class: 'bg-card border-b-4 custom' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-card', 'border-b-4', 'custom']))
      expect(w!.classes()).not.toContain('bg-muted')
      expect(w!.classes()).not.toContain('border-b-2')
    })
    it('sticky still works with tone and appearance', () => {
      mountWith({ sticky: false, tone: 'inverted', appearance: 'flat' })
      expect(w!.classes()).toContain('relative')
      expect(w!.classes()).not.toContain('sticky')
    })
    it('long and unicode brand and link text do not break any size', () => {
      for (const size of siteHeaderSizeNames) {
        mountWith({ size, brand: '株式会社'.repeat(50), links: [{ label: 'x'.repeat(300), href: '/x' }] })
        expect(brand().text()).toHaveLength(200)
        expect(link(0).text()).toHaveLength(300)
        w!.unmount()
      }
      w = undefined
    })
    it('the nav label and menu label contracts are enforced in every variation', async () => {
      await open(SiteHeader, { links, navLabel: '', size: 'lg', tone: 'inverted', appearance: 'flat', variant: 'stacked' })
      expect(errors.some((e) => e.message.includes('navLabel'))).toBe(true)
      await open(SiteHeader, { links, menuLabel: '', size: 'sm', tone: 'muted', variant: 'stacked' })
      expect(errors.some((e) => e.message.includes('menuLabel'))).toBe(true)
      await open(SiteHeader, { links, size: 'sm', tone: 'muted', appearance: 'elevated', variant: 'stacked' })
      expect(errors).toEqual([])
    })
  })

  describe('cva helpers', () => {
    it('defaults equal the component defaults', () => {
      expect(siteHeaderVariants()).toBe(siteHeaderVariants({ variant: 'default', sticky: true, solid: false, tone: 'default', appearance: 'bordered' }))
      expect(siteHeaderBarVariants()).toContain('min-h-16')
      expect(siteHeaderBrandVariants()).toContain('text-lg')
      expect(siteHeaderLinkVariants()).toContain('text-muted-foreground')
      expect(siteHeaderToggleVariants()).toContain('size-10')
      expect(siteHeaderPanelVariants()).toContain('bg-background')
    })
    it('no combination produces conflicting borders or surfaces, blur, shadows or arbitrary values', () => {
      for (const variant of siteHeaderVariantNames) {
        for (const tone of siteHeaderToneNames) {
          for (const appearance of siteHeaderAppearanceNames) {
            for (const solid of [true, false]) {
              const c = siteHeaderVariants({ variant, tone, appearance, solid }).split(' ')
              expect(c.filter((x) => /^bg-(background|muted|foreground|transparent)$/.test(x)).length).toBe(1)
              expect(c.filter((x) => /^border(-b)?(-2)?$/.test(x)).length).toBeLessThanOrEqual(1)
              expect(c.join(' ')).not.toMatch(/blur|shadow|\[|gradient/)
            }
          }
        }
      }
    })
  })
})
