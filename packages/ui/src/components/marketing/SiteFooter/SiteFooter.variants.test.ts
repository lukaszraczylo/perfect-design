import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import SiteFooter from './SiteFooter.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import {
  siteFooterAlignNames,
  siteFooterAlignVariants,
  siteFooterBrandAlignVariants,
  siteFooterContainerVariants,
  siteFooterLegalAlignVariants,
  siteFooterListAlignVariants,
  siteFooterMainAlignVariants,
  siteFooterSizeNames,
  siteFooterTextVariants,
  siteFooterToneNames,
  siteFooterVariantNames,
  siteFooterVariants,
} from './variants'

const { errors, open } = useContractHarness()
const columns = [
  { title: 'Reference', links: [{ label: 'Components', href: '/components' }, { label: 'Colours', href: '/colors' }] },
  { title: 'Guides', links: [{ label: 'Getting started', href: '/start' }] },
]
const legalLinks = [{ label: 'Privacy', href: '/privacy' }]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
})
const mountWith = (props: Record<string, unknown> = {}) =>
  (w = mount(SiteFooter, { props: { columns, legal: '© sample', legalLinks, description: 'Tagline', ...props }, slots: { brand: '<b>Example</b>', social: '<a href="/s">s</a>' } }))
const container = () => w!.find('[data-slot="site-footer-container"]')
const main = () => w!.find('[data-slot="site-footer-main"]')
const brand = () => w!.find('[data-slot="site-footer-brand"]')
const legal = () => w!.find('[data-slot="site-footer-legal"]')
const link = () => w!.find('[data-slot="site-footer-link"]')

describe('SiteFooter variations', () => {
  describe('defaults are unchanged', () => {
    it('root, container and typography keep the original classes', () => {
      mountWith()
      expect([...w!.classes()].sort()).toEqual(['bg-background', 'border-t', 'text-foreground'])
      expect([...container().classes()].sort()).toEqual(['lg:px-8', 'max-w-7xl', 'mx-auto', 'px-4', 'py-12', 'sm:px-6', 'w-full'])
      expect(w!.find('[data-slot="site-footer-column-title"]').classes()).toEqual(expect.arrayContaining(['text-sm', 'font-semibold']))
      expect(link().classes()).toEqual(expect.arrayContaining(['text-sm', 'min-h-6', 'pointer-coarse:min-h-11', 'text-muted-foreground', 'hover:text-foreground']))
      expect(legal().find('p').classes()).toEqual(expect.arrayContaining(['text-sm', 'text-muted-foreground']))
      expect(w!.attributes('data-size')).toBe('md')
      expect(w!.attributes('data-align')).toBeUndefined()
    })
    it.each([
      ['columns', 'py-12'],
      ['newsletter', 'py-12'],
      ['mega', 'py-16'],
      ['simple', 'py-10'],
      ['centered', 'py-10'],
      ['minimal', 'py-6'],
    ] as const)('%s keeps %s at the default size', (variant, py) => {
      mountWith({ variant })
      expect(container().classes().filter((c) => c.startsWith('py-'))).toEqual([py])
    })
  })

  describe('size', () => {
    it.each([
      ['columns', { sm: 'py-8', md: 'py-12', lg: 'py-16' }],
      ['newsletter', { sm: 'py-8', md: 'py-12', lg: 'py-16' }],
      ['split', { sm: 'py-8', md: 'py-12', lg: 'py-16' }],
      ['mega', { sm: 'py-12', md: 'py-16', lg: 'py-20' }],
      ['simple', { sm: 'py-6', md: 'py-10', lg: 'py-14' }],
      ['centered', { sm: 'py-6', md: 'py-10', lg: 'py-14' }],
      ['minimal', { sm: 'py-4', md: 'py-6', lg: 'py-8' }],
    ] as const)('%s padding scales with size', (variant, scale) => {
      for (const size of siteFooterSizeNames) {
        mountWith({ variant, size })
        expect(container().classes().filter((c) => c.startsWith('py-'))).toEqual([scale[size]])
        expect(w!.attributes('data-size')).toBe(size)
        w!.unmount()
      }
      w = undefined
    })
    it('lg steps text up to text-base for links, titles, description and legal text', () => {
      mountWith({ size: 'lg' })
      expect(link().classes()).toContain('text-base')
      expect(link().classes()).not.toContain('text-sm')
      expect(w!.find('[data-slot="site-footer-column-title"]').classes()).toContain('text-base')
      expect(brand().find('p').classes()).toContain('text-base')
      expect(legal().find('p').classes()).toContain('text-base')
      expect(w!.find('[data-slot="site-footer-legal-link"]').classes()).toContain('text-base')
    })
    it('sm keeps 14px text (padding is the only difference) and every size keeps the target classes', () => {
      for (const size of siteFooterSizeNames) {
        mountWith({ size })
        expect(link().classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
        if (size !== 'lg') expect(link().classes()).toContain('text-sm')
        w!.unmount()
      }
      w = undefined
    })
    it('newsletter text follows the size', () => {
      mountWith({ variant: 'newsletter', size: 'lg', newsletterTitle: 'Title', newsletterDescription: 'Text' })
      expect(w!.find('[data-slot="site-footer-newsletter-title"]').classes()).toContain('text-base')
      expect(w!.find('[data-slot="site-footer-newsletter"] p').classes()).toContain('text-base')
    })
    it('an unknown size falls back to md', () => {
      mountWith({ size: 'xl' })
      expect(w!.attributes('data-size')).toBe('md')
      expect(container().classes()).toContain('py-12')
    })
  })

  describe('tone muted', () => {
    it('uses the muted surface with the usual text colours', () => {
      mountWith({ tone: 'muted' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-muted', 'text-foreground', 'border-t']))
      expect(w!.classes()).not.toContain('bg-background')
      expect(link().classes()).toEqual(expect.arrayContaining(['text-muted-foreground', 'hover:text-foreground']))
      expect(legal().find('p').classes()).toContain('text-muted-foreground')
      expect(legal().classes()).not.toContain('border-background/20')
      expect(w!.attributes('data-tone')).toBe('muted')
    })
    it('dark still inverts and an unknown tone falls back to default', () => {
      mountWith({ tone: 'dark' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
      w!.unmount()
      mountWith({ tone: 'bright' })
      expect(w!.attributes('data-tone')).toBe('default')
      expect(w!.classes()).toContain('bg-background')
    })
    it('works in every variant with one surface class', () => {
      for (const variant of siteFooterVariantNames) {
        mountWith({ variant, tone: 'muted' })
        expect(w!.classes().filter((c) => /^bg-/.test(c))).toEqual(['bg-muted'])
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('variant split', () => {
    it('is a two-half grid: brand on one half, three-up link columns on the other', () => {
      mountWith({ variant: 'split' })
      expect(w!.attributes('data-variant')).toBe('split')
      expect(main().classes()).toEqual(expect.arrayContaining(['grid', 'gap-10', 'lg:grid-cols-2']))
      expect(brand().classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'items-start']))
      expect(w!.find('[data-slot="site-footer-nav"]').classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-2', 'sm:grid-cols-3']))
      expect(w!.findAll('[data-slot="site-footer-column"]')).toHaveLength(2)
      expect(legal().classes()).toEqual(expect.arrayContaining(['mt-12', 'border-t']))
    })
    it('differs from columns (no four-column grid, no column span)', () => {
      mountWith({ variant: 'split' })
      expect(main().classes()).not.toContain('lg:grid-cols-4')
      expect(w!.find('[data-slot="site-footer-nav"]').classes().join(' ')).not.toContain('col-span')
    })
    it('keeps headings, named lists, the landmark name and links', () => {
      mountWith({ variant: 'split', navLabel: 'Split footer' })
      expect(w!.find('nav').attributes('aria-label')).toBe('Split footer')
      expect(w!.findAll('h2')).toHaveLength(2)
      const ul = w!.find('ul')
      expect(w!.find(`#${ul.attributes('aria-labelledby')}`).text()).toBe('Reference')
      expect(w!.findAll('[data-slot="site-footer-link"]')).toHaveLength(3)
    })
    it('renders an empty shell and survives no columns', () => {
      w = mount(SiteFooter, { props: { variant: 'split' } })
      expect(w!.find('[data-slot="site-footer-nav"]').exists()).toBe(false)
      expect(w!.find('[data-slot="site-footer-main"]').exists()).toBe(false)
    })
  })

  describe('align', () => {
    it('start, center and end set the root text alignment and data-align', () => {
      for (const [align, cls] of [['start', 'text-start'], ['center', 'text-center'], ['end', 'text-end']] as const) {
        mountWith({ align })
        expect(w!.classes()).toContain(cls)
        expect(w!.attributes('data-align')).toBe(align)
        w!.unmount()
      }
      w = undefined
    })
    it.each([
      ['start', 'items-start'],
      ['center', 'items-center'],
      ['end', 'items-end'],
    ] as const)('%s aligns the brand block with one items class', (align, cls) => {
      mountWith({ align })
      expect(brand().classes().filter((c) => /^items-/.test(c))).toEqual([cls])
    })
    it('unset keeps each variant default: centered centres, columns starts', () => {
      mountWith({ variant: 'centered' })
      expect(brand().classes()).toContain('items-center')
      expect(main().classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
      w!.unmount()
      mountWith()
      expect(brand().classes()).toContain('items-start')
      expect(w!.classes()).not.toContain('text-center')
    })
    it('align start turns the centered variant left-aligned', () => {
      mountWith({ variant: 'centered', align: 'start' })
      expect(main().classes()).toEqual(expect.arrayContaining(['items-start', 'text-start']))
      expect(main().classes()).not.toContain('items-center')
      expect(main().classes()).not.toContain('text-center')
      expect(brand().classes()).toContain('items-start')
      expect(w!.find('ul[role="list"]').classes()).toContain('justify-start')
      expect(w!.find('ul[role="list"]').classes()).not.toContain('justify-center')
      expect(legal().classes()).toEqual(expect.arrayContaining(['items-start', 'text-start', 'sm:flex-row']))
      expect(legal().classes()).not.toContain('text-center')
    })
    it('simple with center or end stacks the row instead of spreading it', () => {
      mountWith({ variant: 'simple', align: 'center', links: [{ label: 'A', href: '/a' }] })
      expect(main().classes()).toEqual(expect.arrayContaining(['md:flex-col', 'md:items-center', 'md:justify-center']))
      expect(main().classes()).not.toContain('md:flex-row')
      expect(main().classes()).not.toContain('md:justify-between')
      expect(w!.find('ul[role="list"]').classes()).toContain('justify-center')
      w!.unmount()
      mountWith({ variant: 'simple', align: 'end', links: [{ label: 'A', href: '/a' }] })
      expect(main().classes()).toEqual(expect.arrayContaining(['items-end', 'md:items-end', 'md:flex-col']))
      expect(main().classes()).not.toContain('md:items-center')
      expect(w!.find('ul[role="list"]').classes()).toContain('justify-end')
    })
    it('simple without align keeps the spread-out row', () => {
      mountWith({ variant: 'simple' })
      expect(main().classes()).toEqual(expect.arrayContaining(['md:flex-row', 'md:items-center', 'md:justify-between']))
    })
    it('grid variants do not get vertical centering on the main grid', () => {
      mountWith({ variant: 'columns', align: 'center' })
      expect(main().classes()).not.toContain('items-center')
      expect(main().classes()).toContain('lg:grid-cols-4')
    })
    it('the legal row stacks and aligns for center and end, and uses logical text alignment', () => {
      mountWith({ align: 'center' })
      expect(legal().classes()).toEqual(expect.arrayContaining(['items-center', 'text-center', 'sm:flex-col', 'sm:justify-center']))
      expect(legal().classes()).not.toContain('sm:flex-row')
      w!.unmount()
      mountWith({ align: 'end' })
      expect(legal().classes()).toEqual(expect.arrayContaining(['items-end', 'text-end', 'sm:flex-col', 'sm:items-end']))
      expect(legal().classes().join(' ')).not.toMatch(/text-right|text-left|items-(left|right)/)
    })
    it('uses logical alignment only (no physical left or right classes anywhere)', () => {
      for (const align of siteFooterAlignNames) {
        for (const variant of siteFooterVariantNames) {
          mountWith({ variant, align, links: [{ label: 'A', href: '/a' }] })
          expect(w!.html()).not.toMatch(/class="[^"]*\b(text-left|text-right|justify-left|ml-|mr-|pl-|pr-)/)
          w!.unmount()
        }
      }
      w = undefined
    })
    it('an unknown align is ignored', () => {
      mountWith({ align: 'justify' })
      expect(w!.attributes('data-align')).toBeUndefined()
      expect(w!.classes()).not.toContain('text-center')
    })
    it('minimal with align keeps brand, legal and social in one row that stacks when centred', () => {
      mountWith({ variant: 'minimal', align: 'center' })
      expect(w!.find('[data-slot="site-footer-main"]').exists()).toBe(false)
      expect(legal().classes()).toEqual(expect.arrayContaining(['items-center', 'sm:flex-col']))
      expect(legal().find('[data-slot="site-footer-brand"]').exists()).toBe(true)
    })
  })

  describe('combinations, overrides and contracts', () => {
    const combos = siteFooterVariantNames.flatMap((variant) => siteFooterToneNames.map((tone) => [variant, tone] as const))
    it.each(combos)('variant %s with tone %s renders links, legal and one surface class with size lg and align end', (variant, tone) => {
      mountWith({ variant, tone, size: 'lg', align: 'end', links: [{ label: 'A', href: '/a' }] })
      expect(w!.classes().filter((c) => /^bg-/.test(c))).toHaveLength(1)
      expect(container().classes().filter((c) => c.startsWith('py-'))).toHaveLength(1)
      expect(legal().text()).toContain('© sample')
      expect(w!.findAll('a').length).toBeGreaterThan(0)
    })
    it('the class prop wins over tone, align and size classes', () => {
      mountWith({ tone: 'muted', align: 'center', class: 'bg-card text-start custom' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['bg-card', 'text-start', 'custom']))
      expect(w!.classes()).not.toContain('bg-muted')
      expect(w!.classes()).not.toContain('text-center')
    })
    it('empty slots and no props render an empty shell for every size and align', () => {
      for (const size of siteFooterSizeNames) {
        for (const align of siteFooterAlignNames) {
          w = mount(SiteFooter, { props: { size, align } })
          expect(w.find('[data-slot="site-footer-main"]').exists()).toBe(false)
          expect(w.find('[data-slot="site-footer-legal"]').exists()).toBe(false)
          w.unmount()
        }
      }
      w = undefined
    })
    it('long and unicode text does not break the large size', () => {
      mountWith({ size: 'lg', legal: '株式会社'.repeat(200), description: 'x'.repeat(500) })
      expect(legal().find('p').text()).toHaveLength(800)
      expect(brand().find('p').text()).toHaveLength(500)
    })
    it('the link and nav label contracts are enforced with the new props', async () => {
      await open(SiteFooter, { columns: [{ title: '', links: [{ label: 'A', href: '/a' }] }], variant: 'split', size: 'lg', align: 'end', tone: 'muted' })
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('requires a non-empty `label` and `href`')
      await open(SiteFooter, { columns, navLabel: '', variant: 'split', size: 'sm', tone: 'muted' })
      expect(errors.some((e) => e.message.includes('navLabel'))).toBe(true)
      await open(SiteFooter, { columns, variant: 'split', size: 'sm', align: 'center', tone: 'muted' })
      expect(errors).toEqual([])
    })
  })

  describe('cva helpers', () => {
    it('defaults match the component defaults', () => {
      expect(siteFooterVariants()).toContain('bg-background')
      expect(siteFooterContainerVariants()).toContain('py-12')
      expect(siteFooterTextVariants()).toBe('text-sm')
      expect(siteFooterTextVariants({ size: 'lg' })).toBe('text-base')
    })
    it('align helpers map every value and are empty when unset', () => {
      for (const helper of [siteFooterAlignVariants, siteFooterBrandAlignVariants, siteFooterListAlignVariants, siteFooterMainAlignVariants, siteFooterLegalAlignVariants]) {
        expect(helper()).toBe('')
        for (const align of siteFooterAlignNames) expect(helper({ align }).length).toBeGreaterThan(0)
      }
    })
    it('no combination uses arbitrary values, shadows, blur or physical sides', () => {
      const all = siteFooterVariantNames.flatMap((variant) => siteFooterSizeNames.map((size) => siteFooterContainerVariants({ variant, size }))).join(' ')
      const aligns = siteFooterAlignNames.flatMap((align) => [siteFooterAlignVariants({ align }), siteFooterMainAlignVariants({ align }), siteFooterLegalAlignVariants({ align })]).join(' ')
      expect(`${all} ${aligns}`).not.toMatch(/\[|shadow|blur|text-left|text-right/)
    })
  })
})
