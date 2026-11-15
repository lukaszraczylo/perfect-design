import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SiteFooter from './SiteFooter.vue'
import { siteFooterLegalVariants, siteFooterMainVariants, siteFooterVariantNames, siteFooterVariants } from './variants'

const columns = [
  { title: 'Product', links: [{ label: 'Features', href: '/features' }, { label: 'Pricing', href: '/pricing' }] },
  { title: 'Company', links: [{ label: 'Blog', href: 'https://blog.x', external: true }] },
]

describe('SiteFooter', () => {
  describe('good path', () => {
    it('renders columns with headings and links', () => {
      const w = mount(SiteFooter, { props: { columns } })
      expect(w.element.tagName).toBe('FOOTER')
      expect(w.attributes('data-slot')).toBe('site-footer')
      expect(w.find('nav').attributes('aria-label')).toBe('Footer')
      expect(w.findAll('[data-slot="site-footer-column"]')).toHaveLength(2)
      expect(w.findAll('h2').map((h) => h.text())).toEqual(['Product', 'Company'])
      expect(w.findAll('[data-slot="site-footer-link"]')).toHaveLength(3)
      const ul = w.find('ul')
      expect(ul.attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'))
    })
    it('external links are safe', () => {
      const a = mount(SiteFooter, { props: { columns } }).findAll('[data-slot="site-footer-link"]')[2]
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
    })
    it('renders legal text, legal links, brand and social slots, description', () => {
      const w = mount(SiteFooter, {
        props: { legal: '© 2026 Example', legalLinks: [{ label: 'Privacy', href: '/privacy' }], description: 'We build things' },
        slots: { brand: '<span id="b">Example</span>', social: '<a id="s" href="/x">X</a>' },
      })
      expect(w.find('[data-slot="site-footer-legal"]').text()).toContain('© 2026 Example')
      expect(w.find('[data-slot="site-footer-legal-link"]').attributes('href')).toBe('/privacy')
      expect(w.find('[data-slot="site-footer-brand"] #b').exists()).toBe(true)
      expect(w.find('[data-slot="site-footer-social"] #s').exists()).toBe(true)
      expect(w.find('[data-slot="site-footer-brand"]').text()).toContain('We build things')
    })
    it('legal slot overrides legal text; default slot renders', () => {
      const w = mount(SiteFooter, { slots: { legal: '<i id="l"/>', default: '<div id="d"/>' } })
      expect(w.find('#l').exists() && w.find('#d').exists()).toBe(true)
    })
  })
  describe('customisation', () => {
    it('merges class, attrs, custom nav label', () => {
      const w = mount(SiteFooter, { props: { columns, navLabel: 'Fußzeile', class: 'border-0 custom' }, attrs: { id: 'f' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('border-t')
      expect(w.attributes('id')).toBe('f')
      expect(w.find('nav').attributes('aria-label')).toBe('Fußzeile')
    })
  })
  describe('bad path', () => {
    it('empty footer renders only the shell', () => {
      const w = mount(SiteFooter)
      for (const part of ['brand', 'nav', 'legal']) expect(w.find(`[data-slot="site-footer-${part}"]`).exists()).toBe(false)
    })
    it('skips malformed columns', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SiteFooter, { props: { columns: [null, { title: 'x' }, columns[0]] } })
      expect(w.findAll('[data-slot="site-footer-column"]')).toHaveLength(1)
    })
    it('column with no links renders an empty list', () => {
      const w = mount(SiteFooter, { props: { columns: [{ title: 'Empty', links: [] }] } })
      expect(w.findAll('li')).toHaveLength(0)
      expect(w.find('h2').text()).toBe('Empty')
    })
  })
  describe('edge cases', () => {
    it('many columns and links, unicode, duplicates', () => {
      const big = Array.from({ length: 12 }, (_, i) => ({ title: '列', links: Array.from({ length: 20 }, (_, j) => ({ label: `L${i}${j}`, href: '/' })) }))
      const w = mount(SiteFooter, { props: { columns: big } })
      expect(w.findAll('[data-slot="site-footer-link"]')).toHaveLength(240)
      const ids = w.findAll('h2').map((h) => h.attributes('id'))
      expect(new Set(ids).size).toBe(12)
    })
    it('very long legal text', () => {
      expect(mount(SiteFooter, { props: { legal: 'x'.repeat(5000) } }).find('[data-slot="site-footer-legal"]').text()).toHaveLength(5000)
    })
  })
})

const legalLinks = [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }]
const four = Array.from({ length: 4 }, (_, i) => ({ title: `Col ${i}`, links: [{ label: `A${i}`, href: `/a${i}` }, { label: `B${i}`, href: `/b${i}` }] }))

describe('SiteFooter variants', () => {
  it.each(siteFooterVariantNames)('variant %s renders legal row, brand slot and carries data attributes', (variant) => {
    const w = mount(SiteFooter, {
      props: { variant, columns, legal: '© 2026', legalLinks, description: 'Tagline' },
      slots: { brand: '<b id="b">Example</b>', social: '<a id="s" href="/x">x</a>' },
    })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.attributes('data-tone')).toBe('default')
    expect(w.find('#b').exists()).toBe(true)
    expect(w.find('#s').exists()).toBe(true)
    expect(w.find('[data-slot="site-footer-legal"]').text()).toContain('© 2026')
    expect(w.findAll('[data-slot="site-footer-legal-link"]')).toHaveLength(2)
    expect(siteFooterMainVariants({ variant })).toBeDefined()
    expect(siteFooterLegalVariants({ variant })).toContain('flex')
  })

  it('columns is the default: a four-column grid (no arbitrary fr values), brand one column, links three', () => {
    const w = mount(SiteFooter, { props: { columns, legal: '© x' } })
    expect(w.attributes('data-variant')).toBe('columns')
    expect(w.find('[data-slot="site-footer-main"]').classes()).toContain('lg:grid-cols-4')
    expect(w.find('[data-slot="site-footer-main"]').classes().join(' ')).not.toContain('[')
    expect(w.find('[data-slot="site-footer-nav"]').classes()).toEqual(expect.arrayContaining(['lg:grid-cols-4', 'lg:col-span-3', 'lg:only:col-span-4']))
    expect(w.find('[data-slot="site-footer-legal"]').classes()).toEqual(expect.arrayContaining(['mt-12', 'border-t']))
  })

  describe('simple', () => {
    it('shows one row: brand, flat links from columns, and social', () => {
      const w = mount(SiteFooter, { props: { variant: 'simple', columns }, slots: { brand: '<b>A</b>', social: '<i id="s" />' } })
      expect(w.find('[data-slot="site-footer-main"]').classes()).toContain('md:flex-row')
      expect(w.findAll('[data-slot="site-footer-column"]')).toHaveLength(0)
      expect(w.findAll('nav [data-slot="site-footer-link"]')).toHaveLength(3)
      expect(w.find('nav').attributes('aria-label')).toBe('Footer')
      expect(w.find('[data-slot="site-footer-brand"] #s').exists()).toBe(false)
      expect(w.find('[data-slot="site-footer-main"] > [data-slot="site-footer-social"] #s').exists()).toBe(true)
    })
    it('explicit links override the column links', () => {
      const w = mount(SiteFooter, { props: { variant: 'simple', columns, links: [{ label: 'Only', href: '/o' }, { label: 'Ext', href: 'https://x', external: true }] } })
      const a = w.findAll('[data-slot="site-footer-link"]')
      expect(a.map((l) => l.text())).toEqual(['Only', 'Ext'])
      expect(a[1].attributes('rel')).toBe('noopener noreferrer')
    })
    it('empty links array hides the nav', () => {
      expect(mount(SiteFooter, { props: { variant: 'simple', columns, links: [] } }).find('nav').exists()).toBe(false)
    })
    it('skips malformed explicit links', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SiteFooter, { props: { variant: 'simple', links: [null, { label: 'x' }, { label: 'ok', href: '/ok' }] } })
      expect(w.findAll('[data-slot="site-footer-link"]')).toHaveLength(1)
    })
    it('non-array links and columns are tolerated', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SiteFooter, { props: { variant: 'simple', links: 'x', columns: 'y', legalLinks: 'z' } })
      expect(w.find('nav').exists()).toBe(false)
      expect(w.find('[data-slot="site-footer-legal"]').exists()).toBe(false)
    })
  })

  describe('centered', () => {
    it('centres brand, description, links, social and legal', () => {
      const w = mount(SiteFooter, {
        props: { variant: 'centered', columns, description: 'Tag', legal: '© x' },
        slots: { brand: '<b>A</b>', social: '<i id="s" />' },
      })
      expect(w.find('[data-slot="site-footer-main"]').classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
      expect(w.find('[data-slot="site-footer-brand"]').classes()).toContain('items-center')
      expect(w.find('[data-slot="site-footer-brand"] p').classes()).toContain('max-w-md')
      expect(w.find('nav ul').classes()).toContain('justify-center')
      expect(w.find('[data-slot="site-footer-legal"]').classes()).toContain('text-center')
    })
  })

  describe('minimal', () => {
    it('shows only the legal row with brand and social inline', () => {
      const w = mount(SiteFooter, {
        props: { variant: 'minimal', columns, description: 'ignored', legal: '© x', legalLinks },
        slots: { brand: '<b id="b">A</b>', social: '<i id="s" />' },
      })
      expect(w.find('[data-slot="site-footer-main"]').exists()).toBe(false)
      expect(w.find('[data-slot="site-footer-nav"]').exists()).toBe(false)
      expect(w.text()).not.toContain('ignored')
      const legal = w.find('[data-slot="site-footer-legal"]')
      expect(legal.find('#b').exists() && legal.find('#s').exists()).toBe(true)
      expect(legal.classes()).not.toContain('border-t')
      expect(w.find('[data-slot="site-footer-container"]').classes()).toContain('py-6')
    })
    it('renders an empty container with nothing to show', () => {
      const w = mount(SiteFooter, { props: { variant: 'minimal' } })
      expect(w.find('[data-slot="site-footer-container"]').element.children).toHaveLength(0)
    })
    it('brand slot alone is enough to render the row', () => {
      expect(mount(SiteFooter, { props: { variant: 'minimal' }, slots: { brand: '<b />' } }).find('[data-slot="site-footer-legal"]').exists()).toBe(true)
    })
  })

  describe('newsletter', () => {
    it('adds a form column with title, description and slot', () => {
      const w = mount(SiteFooter, {
        props: { variant: 'newsletter', columns, newsletterTitle: 'Subscribe', newsletterDescription: 'Monthly news' },
        slots: { brand: '<b />', newsletter: '<form id="f"><input aria-label="Email"></form>' },
      })
      const n = w.find('[data-slot="site-footer-newsletter"]')
      expect(n.find('h2').text()).toBe('Subscribe')
      expect(n.text()).toContain('Monthly news')
      expect(n.find('#f').exists()).toBe(true)
      expect(w.find('[data-slot="site-footer-main"]').classes()).toContain('lg:grid-cols-4')
      expect(w.find('[data-slot="site-footer-nav"]').classes()).toContain('lg:col-span-2')
      expect(w.findAll('[data-slot="site-footer-column"]')).toHaveLength(2)
    })
    it('slot alone, title alone and nothing at all', () => {
      expect(mount(SiteFooter, { props: { variant: 'newsletter' }, slots: { newsletter: '<i id="x" />' } }).find('#x').exists()).toBe(true)
      const t = mount(SiteFooter, { props: { variant: 'newsletter', newsletterTitle: 'T' } })
      expect(t.find('[data-slot="site-footer-newsletter-title"]').exists()).toBe(true)
      expect(t.find('[data-slot="site-footer-newsletter"] p').exists()).toBe(false)
      expect(mount(SiteFooter, { props: { variant: 'newsletter' } }).find('[data-slot="site-footer-newsletter"]').exists()).toBe(false)
    })
    it('other variants ignore the newsletter props and slot', () => {
      const w = mount(SiteFooter, { props: { newsletterTitle: 'T' }, slots: { newsletter: '<i />' } })
      expect(w.find('[data-slot="site-footer-newsletter"]').exists()).toBe(false)
    })
  })

  describe('mega', () => {
    it('lays out brand over two of six columns and four link columns, with a legal row', () => {
      const w = mount(SiteFooter, { props: { variant: 'mega', columns: four, description: 'D', legal: '© x', legalLinks }, slots: { brand: '<b />', social: '<i id="s" />' } })
      expect(w.find('[data-slot="site-footer-main"]').classes()).toContain('lg:grid-cols-6')
      expect(w.find('[data-slot="site-footer-brand"]').classes()).toContain('lg:col-span-2')
      expect(w.find('[data-slot="site-footer-brand"] #s').exists()).toBe(true)
      expect(w.find('[data-slot="site-footer-nav"]').classes()).toEqual(expect.arrayContaining(['lg:col-span-4', 'sm:grid-cols-4']))
      expect(w.findAll('[data-slot="site-footer-column"]')).toHaveLength(4)
      expect(w.find('h2').classes().join(' ')).not.toMatch(/uppercase|tracking/)
      expect(w.find('[data-slot="site-footer-legal"]').classes()).toContain('mt-16')
    })
    it('survives more than 4 columns and none', () => {
      const six = Array.from({ length: 6 }, (_, i) => ({ title: `C${i}`, links: [{ label: 'x', href: '/' }] }))
      expect(mount(SiteFooter, { props: { variant: 'mega', columns: six } }).findAll('[data-slot="site-footer-column"]')).toHaveLength(6)
      expect(mount(SiteFooter, { props: { variant: 'mega' } }).find('nav').exists()).toBe(false)
    })
  })

  describe('dark tone', () => {
    it('inverts surface, links, text and the legal border', () => {
      const w = mount(SiteFooter, { props: { tone: 'dark', columns, legal: '© x', legalLinks, description: 'D' }, slots: { brand: '<b />' } })
      expect(w.attributes('data-tone')).toBe('dark')
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
      expect(w.classes()).not.toContain('bg-background')
      expect(w.find('[data-slot="site-footer-link"]').classes()).toContain('text-background/70')
      expect(w.find('[data-slot="site-footer-link"]').classes()).not.toContain('text-muted-foreground')
      expect(w.find('[data-slot="site-footer-brand"] p').classes()).toContain('text-background/70')
      expect(w.find('[data-slot="site-footer-legal"]').classes()).toContain('border-background/20')
      expect(siteFooterVariants({ tone: 'dark' })).toContain('bg-foreground')
    })
    it.each(siteFooterVariantNames)('dark works with %s', (variant) => {
      const w = mount(SiteFooter, { props: { tone: 'dark', variant, columns, legal: 'x' } })
      expect(w.classes()).toContain('bg-foreground')
      expect(w.find('[data-slot="site-footer-legal"] p').classes()).toContain('text-background/70')
    })
    it('unknown tone falls back to default', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SiteFooter, { props: { tone: 'neon' } })
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.classes()).toContain('bg-background')
    })
  })

  describe('bad path, customisation, edge cases', () => {
    it('unknown variant falls back to columns', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SiteFooter, { props: { variant: 'giant', columns } })
      expect(w.attributes('data-variant')).toBe('columns')
      expect(w.findAll('[data-slot="site-footer-column"]')).toHaveLength(2)
    })
    it('every variant renders an empty shell without props or slots', () => {
      for (const variant of siteFooterVariantNames) {
        const w = mount(SiteFooter, { props: { variant } })
        expect(w.find('[data-slot="site-footer-main"]').exists()).toBe(false)
        expect(w.find('[data-slot="site-footer-legal"]').exists()).toBe(false)
      }
    })
    it('empty columns and links arrays in every variant', () => {
      for (const variant of siteFooterVariantNames) {
        const w = mount(SiteFooter, { props: { variant, columns: [], links: [], legalLinks: [] } })
        expect(w.find('nav').exists()).toBe(false)
      }
    })
    it('class merges last in every variant and tone', () => {
      for (const variant of siteFooterVariantNames) {
        const w = mount(SiteFooter, { props: { variant, tone: 'dark', class: 'bg-red-500 custom' } })
        expect(w.classes()).toEqual(expect.arrayContaining(['custom', 'bg-red-500']))
        expect(w.classes()).not.toContain('bg-foreground')
      }
    })
    it('default slot renders between main and legal in all variants', () => {
      for (const variant of siteFooterVariantNames) {
        const w = mount(SiteFooter, { props: { variant, legal: 'x', columns }, slots: { default: '<div id="d" />' } })
        const html = w.html()
        expect(html.indexOf('id="d"')).toBeLessThan(html.indexOf('site-footer-legal'))
      }
    })
    it('very long and unicode text in new regions; unique heading ids', () => {
      const long = 'ж'.repeat(3000)
      const w = mount(SiteFooter, { props: { variant: 'newsletter', newsletterTitle: long, newsletterDescription: long, columns: four, legal: long } })
      expect(w.find('[data-slot="site-footer-newsletter-title"]').text()).toHaveLength(3000)
      expect(new Set(w.findAll('[data-slot="site-footer-column-title"]').map((h) => h.attributes('id'))).size).toBe(4)
    })
    it('rapid variant switching ends in a consistent tree', async () => {
      const w = mount(SiteFooter, { props: { columns, legal: 'x' }, slots: { newsletter: '<i />', social: '<b />' } })
      for (const v of ['mega', 'simple', 'minimal', 'centered', 'newsletter', 'columns'] as const) await w.setProps({ variant: v })
      expect(w.attributes('data-variant')).toBe('columns')
      expect(w.findAll('[data-slot="site-footer-legal"]')).toHaveLength(1)
      expect(w.findAll('[data-slot="site-footer-social"]')).toHaveLength(1)
    })
  })

  describe('accessibility and slop regressions', () => {
    const cols = [{ title: 'Reference', links: [{ label: 'Components', href: '/components' }] }]
    it('heading level is configurable for column and newsletter titles (heading-order)', () => {
      const w = mount(SiteFooter, { props: { variant: 'newsletter', columns: cols, headingLevel: 3, newsletterTitle: 'N' } })
      expect(w.find('h3[data-slot="site-footer-column-title"]').exists()).toBe(true)
      expect(w.find('h3[data-slot="site-footer-newsletter-title"]').exists()).toBe(true)
      expect(w.find('h2').exists()).toBe(false)
      // @ts-expect-error deliberately invalid
      expect(mount(SiteFooter, { props: { columns: cols, headingLevel: 9 } }).find('h2').exists()).toBe(true)
    })
    it('distinct navLabel names the landmark (landmark-unique) and each column list is named by its heading', () => {
      const w = mount(SiteFooter, { props: { columns: cols, navLabel: 'Docs footer' } })
      expect(w.find('nav').attributes('aria-label')).toBe('Docs footer')
      const h = w.find('[data-slot="site-footer-column-title"]')
      expect(w.find('ul').attributes('aria-labelledby')).toBe(h.attributes('id'))
    })
    it('links meet target size (24px, 44px on coarse pointers)', () => {
      const w = mount(SiteFooter, { props: { columns: cols, legalLinks: [{ label: 'P', href: '/p' }] } })
      for (const a of w.findAll('a')) expect(a.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
    })
    it('mega column titles are sentence case', () => {
      const w = mount(SiteFooter, { props: { variant: 'mega', columns: cols } })
      expect(w.find('[data-slot="site-footer-column-title"]').classes().join(' ')).not.toMatch(/uppercase|tracking|text-xs/)
    })
    it('no variant or tone uses arbitrary values, shadows or blur', () => {
      for (const variant of ['columns', 'simple', 'centered', 'minimal', 'newsletter', 'mega'] as const)
        for (const tone of ['default', 'dark'] as const) {
          const html = mount(SiteFooter, { props: { variant, tone, columns: cols, legal: 'l', newsletterTitle: 't' }, slots: { brand: '<b/>', social: '<i/>' } }).html()
          expect(html).not.toMatch(/\[minmax|shadow|blur|uppercase/)
        }
    })
  })
})
