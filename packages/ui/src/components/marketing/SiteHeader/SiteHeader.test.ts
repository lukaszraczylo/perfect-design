import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SiteHeader from './SiteHeader.vue'
import { siteHeaderBarVariants, siteHeaderVariantNames, siteHeaderVariants } from './variants'
import { trackStickyOffset } from './sticky-offset'

const links = [
  { label: 'Docs', href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'GitHub', href: 'https://github.com/x', external: true },
]
let w: ReturnType<typeof mount> | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  document.body.innerHTML = ''
})
const toggle = () => w!.find('[data-slot="site-header-toggle"]')

describe('SiteHeader', () => {
  describe('good path', () => {
    it('renders a sticky header with brand, nav links and cta', () => {
      w = mount(SiteHeader, { props: { brand: 'Example', links }, slots: { cta: '<button id="cta">Sign up</button>' } })
      expect(w.element.tagName).toBe('HEADER')
      expect(w.attributes('data-slot')).toBe('site-header')
      expect(w.classes()).toContain('sticky')
      expect(w.find('[data-slot="site-header-logo"] a').text()).toBe('Example')
      expect(w.find('[data-slot="site-header-logo"] a').attributes('href')).toBe('/')
      expect(w.find('nav').attributes('aria-label')).toBe('Main')
      expect(w.findAll('[data-slot="site-header-link"]')).toHaveLength(3)
      expect(w.find('#cta').exists()).toBe(true)
    })
    it('marks the active link with aria-current', () => {
      w = mount(SiteHeader, { props: { links, activeHref: '/pricing' } })
      const a = w.findAll('[data-slot="site-header-link"]')
      expect(a.map((l) => l.attributes('aria-current'))).toEqual([undefined, 'page', undefined])
      expect(a[1].attributes('data-active')).toBeDefined()
    })
    it('link.active overrides activeHref', () => {
      w = mount(SiteHeader, { props: { links: [{ label: 'A', href: '/a', active: true }, { label: 'B', href: '/b', active: false }], activeHref: '/b' } })
      expect(w.findAll('a[aria-current="page"]')).toHaveLength(1)
      expect(w.find('a[aria-current="page"]').text()).toBe('A')
    })
    it('external links open safely', () => {
      w = mount(SiteHeader, { props: { links } })
      const gh = w.findAll('[data-slot="site-header-link"]')[2]
      expect(gh.attributes('target')).toBe('_blank')
      expect(gh.attributes('rel')).toBe('noopener noreferrer')
    })
    it('mobile toggle opens the menu with correct aria and closes on link click', async () => {
      w = mount(SiteHeader, { props: { links } })
      expect(toggle().attributes('aria-expanded')).toBe('false')
      expect(toggle().attributes('aria-label')).toBe('Menu')
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
      await toggle().trigger('click')
      expect(toggle().attributes('aria-expanded')).toBe('true')
      expect(toggle().attributes('aria-label')).toBe('Menu') // changed from Open menu / Close menu: a name that flips with aria-expanded is announced twice
      const panel = w.find('[data-slot="site-header-mobile"]')
      expect(toggle().attributes('aria-controls')).toBe(panel.attributes('id'))
      expect(w.findAll('[data-slot="site-header-mobile-link"]')).toHaveLength(3)
      await w.find('[data-slot="site-header-mobile-link"]').trigger('click')
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
      expect(w.emitted('navigate')![0][0]).toMatchObject({ label: 'Docs' })
      expect(w.emitted('update:modelValue')).toEqual([[true], [false]])
    })
    it('Escape closes the menu and returns focus to the toggle', async () => {
      w = mount(SiteHeader, { props: { links }, attachTo: document.body })
      await toggle().trigger('click')
      await w.find('[data-slot="site-header-mobile-link"]').trigger('keydown', { key: 'Escape' })
      await nextTick()
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
      expect(document.activeElement).toBe(toggle().element)
    })
    it('v-model controls the menu', async () => {
      w = mount(SiteHeader, { props: { links, modelValue: true } })
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(true)
      await w.setProps({ modelValue: false })
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
    })
    it('desktop link click emits navigate', async () => {
      w = mount(SiteHeader, { props: { links } })
      await w.find('[data-slot="site-header-link"]').trigger('click')
      expect(w.emitted('navigate')).toHaveLength(1)
    })
    it('scroll adds the scrolled state, and the listener is removed on unmount', async () => {
      w = mount(SiteHeader, { props: { links } })
      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()
      expect(w.attributes('data-scrolled')).toBeDefined()
      expect(w.classes().join(' ')).not.toMatch(/shadow/)
      w.unmount()
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      w = undefined
    })
    it('mobile cta renders in the open panel', async () => {
      w = mount(SiteHeader, { props: { links }, slots: { cta: '<b>x</b>' } })
      await toggle().trigger('click')
      expect(w.find('[data-slot="site-header-mobile-cta"] b').exists()).toBe(true)
    })
  })
  describe('customisation', () => {
    it('merges class, supports non-sticky, attrs, slots', () => {
      w = mount(SiteHeader, { props: { sticky: false, class: 'h-20 custom' }, attrs: { id: 'hdr' }, slots: { logo: '<svg id="lg"/>', links: '<a id="x">x</a>' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('relative')
      expect(w.classes()).not.toContain('sticky')
      expect(w.attributes('id')).toBe('hdr')
      expect(w.find('#lg').exists()).toBe(true)
      expect(w.find('#x').exists()).toBe(true)
    })
    it('custom labels', () => {
      w = mount(SiteHeader, { props: { links, navLabel: 'Haupt', openLabel: 'Menü' } })
      expect(w.find('nav').attributes('aria-label')).toBe('Haupt')
      expect(toggle().attributes('aria-label')).toBe('Menü')
    })
  })
  describe('bad path', () => {
    it('no links means no nav and no toggle', () => {
      w = mount(SiteHeader, { props: { brand: 'A' } })
      expect(w.find('nav').exists()).toBe(false)
      expect(toggle().exists()).toBe(false)
    })
    it('Escape when closed does nothing', async () => {
      w = mount(SiteHeader, { props: { links } })
      await w.trigger('keydown', { key: 'Escape' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
    it('no cta slot renders no cta region', async () => {
      w = mount(SiteHeader, { props: { links } })
      await toggle().trigger('click')
      expect(w.find('[data-slot="site-header-cta"]').exists()).toBe(false)
      expect(w.find('[data-slot="site-header-mobile-cta"]').exists()).toBe(false)
    })
    it('no activeHref means nothing is active', () => {
      w = mount(SiteHeader, { props: { links } })
      expect(w.findAll('[aria-current]')).toHaveLength(0)
    })
  })
  describe('edge cases', () => {
    it('rapid toggling ends in a consistent state', async () => {
      w = mount(SiteHeader, { props: { links } })
      for (let i = 0; i < 11; i++) await toggle().trigger('click')
      expect(toggle().attributes('aria-expanded')).toBe('true')
    })
    it('long labels, unicode, 1 and 100 links', () => {
      const many = Array.from({ length: 100 }, (_, i) => ({ label: `L${i}`, href: `/${i}` }))
      w = mount(SiteHeader, { props: { links: many } })
      expect(w.findAll('[data-slot="site-header-link"]')).toHaveLength(100)
      w.unmount()
      w = mount(SiteHeader, { props: { links: [{ label: '文'.repeat(500), href: '/x' }], brand: '🚀' } })
      expect(w.find('[data-slot="site-header-link"]').text()).toHaveLength(500)
    })
  })
})

const setScroll = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}
afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})

describe('SiteHeader variants', () => {
  it.each(siteHeaderVariantNames)('variant %s renders brand, nav, cta and toggle', async (variant) => {
    w = mount(SiteHeader, { props: { variant, brand: 'Example', links, announcement: 'News' }, slots: { cta: '<button id="cta">x</button>' } })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.find('[data-slot="site-header-logo"]').text()).toBe('Example')
    expect(w.find('#cta').exists()).toBe(true)
    expect(toggle().exists()).toBe(true)
    await toggle().trigger('click')
    expect(w.findAll('[data-slot="site-header-mobile-link"]')).toHaveLength(3)
    expect(siteHeaderBarVariants({ variant })).toContain('mx-auto')
    expect(siteHeaderVariants({ variant })).toContain('top-')
  })

  it('default is sticky with an opaque surface (no blur) and desktop nav', () => {
    w = mount(SiteHeader, { props: { links } })
    expect(w.attributes('data-variant')).toBe('default')
    expect(w.classes()).toEqual(expect.arrayContaining(['sticky', 'bg-background', 'border-b', 'border-border']))
    expect(w.classes().join(' ')).not.toMatch(/backdrop|bg-background\//)
    expect(w.find('[data-slot="site-header-nav"]').classes()).toContain('md:flex')
  })

  describe('centered', () => {
    it('puts the logo in the centre column, nav left and actions right', () => {
      w = mount(SiteHeader, { props: { variant: 'centered', links, brand: 'A' }, slots: { cta: '<b>x</b>' } })
      expect(w.find('[data-slot="site-header-bar"]').classes()).toContain('grid-cols-3')
      expect(w.find('[data-slot="site-header-bar"]').attributes('style')).toContain('grid-template-columns: minmax(0px, 1fr) auto minmax(0px, 1fr)')
      expect(w.find('[data-slot="site-header-logo"]').classes()).toEqual(expect.arrayContaining(['col-start-2', 'justify-self-center']))
      expect(w.find('[data-slot="site-header-nav"]').classes()).toContain('col-start-1')
      // links beside the centred logo stay on one line and the side columns share the space the logo leaves
      expect(w.find('[data-slot="site-header-nav"]').classes()).toContain('flex-nowrap')
      expect(w.find('[data-slot="site-header-nav"]').classes()).not.toContain('flex-wrap')
      expect(w.find('[data-slot="site-header-cta"]').element.parentElement!.classList.contains('col-start-3')).toBe(true)
    })
    it('works with no links or cta', () => {
      w = mount(SiteHeader, { props: { variant: 'centered', brand: 'A' } })
      expect(w.find('[data-slot="site-header-nav"]').exists()).toBe(false)
      expect(toggle().exists()).toBe(false)
    })
  })

  describe('minimal', () => {
    it('hides the desktop nav and always shows the menu button', async () => {
      w = mount(SiteHeader, { props: { variant: 'minimal', links } })
      expect(w.find('[data-slot="site-header-nav"]').exists()).toBe(false)
      expect(toggle().classes()).not.toContain('md:hidden')
      expect(w.classes()).not.toContain('backdrop-blur')
      expect(w.find('[data-slot="site-header-bar"]').classes()).toContain('min-h-14')
      await toggle().trigger('click')
      expect(w.find('[data-slot="site-header-mobile"]').classes()).not.toContain('md:hidden')
    })
    it('other variants keep the toggle mobile-only', async () => {
      w = mount(SiteHeader, { props: { links } })
      expect(toggle().classes()).toContain('md:hidden')
      await toggle().trigger('click')
      expect(w.find('[data-slot="site-header-mobile"]').classes()).toContain('md:hidden')
    })
  })

  describe('transparent', () => {
    it('overlays the page: fixed when sticky, absolute when not', () => {
      w = mount(SiteHeader, { props: { variant: 'transparent', links } })
      expect(w.classes()).toEqual(expect.arrayContaining(['fixed', 'border-transparent']))
      expect(w.classes()).not.toContain('bg-background')
      expect(w.classes()).toContain('bg-transparent')
      w.unmount()
      w = mount(SiteHeader, { props: { variant: 'transparent', sticky: false } })
      expect(w.classes()).toContain('absolute')
      expect(w.classes()).not.toContain('fixed')
      expect(w.classes()).not.toContain('relative')
    })
    it('turns solid after scrolling and transparent again at the top', async () => {
      w = mount(SiteHeader, { props: { variant: 'transparent', links } })
      setScroll(120)
      await nextTick()
      expect(w.attributes('data-scrolled')).toBeDefined()
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-background', 'border-border']))
      expect(w.classes().join(' ')).not.toMatch(/backdrop|blur|shadow/)
      setScroll(0)
      await nextTick()
      expect(w.attributes('data-scrolled')).toBeUndefined()
      expect(w.classes()).not.toContain('bg-background')
    })
    it('is solid while the mobile menu is open even at the top', async () => {
      w = mount(SiteHeader, { props: { variant: 'transparent', links } })
      await toggle().trigger('click')
      expect(w.classes()).toContain('bg-background')
      await toggle().trigger('click')
      expect(w.classes()).not.toContain('bg-background')
    })
    it('starts solid when mounted already scrolled', async () => {
      Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
      w = mount(SiteHeader, { props: { variant: 'transparent' } })
      await nextTick()
      expect(w.classes()).toContain('bg-background')
    })
    it('adds a single passive scroll listener and removes the same one on unmount', () => {
      const add = vi.spyOn(window, 'addEventListener')
      const remove = vi.spyOn(window, 'removeEventListener')
      w = mount(SiteHeader, { props: { variant: 'transparent' } })
      const added = add.mock.calls.filter((c) => c[0] === 'scroll')
      expect(added).toHaveLength(1)
      expect(added[0][2]).toEqual({ passive: true })
      w.unmount()
      w = undefined
      const removed = remove.mock.calls.filter((c) => c[0] === 'scroll')
      expect(removed).toHaveLength(1)
      expect(removed[0][1]).toBe(added[0][1])
    })
    it('rapid scroll events settle on the last position and never throw', async () => {
      w = mount(SiteHeader, { props: { variant: 'transparent' } })
      for (let i = 0; i < 200; i++) setScroll(i % 2 ? 0 : 300)
      setScroll(300)
      await nextTick()
      expect(w.attributes('data-scrolled')).toBeDefined()
      setScroll(8)
      await nextTick()
      expect(w.attributes('data-scrolled')).toBeUndefined()
    })
    it('scroll events after unmount do not update anything', async () => {
      w = mount(SiteHeader, { props: { variant: 'transparent' } })
      const el = w.element
      w.unmount()
      w = undefined
      setScroll(400)
      await nextTick()
      expect(el.getAttribute('data-scrolled')).toBeNull()
    })
  })

  describe('floating', () => {
    it('is a bordered rounded-lg panel (no pill, no shadow, no blur) that keeps its shape when the menu opens', async () => {
      w = mount(SiteHeader, { props: { variant: 'floating', links } })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-background', 'sticky', 'top-4', 'max-w-5xl', 'w-11/12']))
      expect(w.classes().join(' ')).not.toMatch(/rounded-full|rounded-3xl|shadow|blur|\[/)
      await toggle().trigger('click')
      expect(w.classes()).toContain('rounded-lg')
      expect(w.find('[data-slot="site-header-mobile"]').classes()).toContain('rounded-b-lg')
    })
    it('non-sticky floating is relative', () => {
      w = mount(SiteHeader, { props: { variant: 'floating', sticky: false } })
      expect(w.classes()).toContain('relative')
      expect(w.classes()).not.toContain('sticky')
    })
  })

  describe('with-announcement', () => {
    it('renders a top bar above the main bar', () => {
      w = mount(SiteHeader, { props: { variant: 'with-announcement', announcement: 'v2 launched', links } })
      const bar = w.find('[data-slot="site-header-announcement"]')
      expect(bar.text()).toBe('v2 launched')
      expect(bar.find('a').exists()).toBe(false)
      expect(w.html().indexOf('site-header-announcement')).toBeLessThan(w.html().indexOf('site-header-bar'))
    })
    it('links the text when announcementHref is set', () => {
      w = mount(SiteHeader, { props: { variant: 'with-announcement', announcement: 'Read more', announcementHref: '/blog' } })
      expect(w.find('[data-slot="site-header-announcement"] a').attributes('href')).toBe('/blog')
    })
    it('announcement slot replaces the text', () => {
      w = mount(SiteHeader, { props: { variant: 'with-announcement' }, slots: { announcement: '<b id="x">Hot</b>' } })
      expect(w.find('[data-slot="site-header-announcement"] #x').exists()).toBe(true)
    })
    it('no announcement content renders no bar; other variants ignore it', () => {
      w = mount(SiteHeader, { props: { variant: 'with-announcement' } })
      expect(w.find('[data-slot="site-header-announcement"]').exists()).toBe(false)
      w.unmount()
      w = mount(SiteHeader, { props: { announcement: 'x' } })
      expect(w.find('[data-slot="site-header-announcement"]').exists()).toBe(false)
    })
  })

  describe('link groups', () => {
    const linkGroups = [
      { title: 'Product', links: [{ label: 'Features', href: '/f' }, { label: 'Pricing', href: '/p' }] },
      { title: 'Company', links: [{ label: 'About', href: '/a' }] },
    ]
    it('renders groups inline on desktop as labelled groups without dropdowns', () => {
      w = mount(SiteHeader, { props: { links, linkGroups } })
      const groups = w.findAll('[data-slot="site-header-group"]')
      expect(groups.map((g) => g.attributes('aria-label'))).toEqual(['Product', 'Company'])
      expect(groups.every((g) => g.attributes('role') === 'group')).toBe(true)
      expect(w.findAll('[data-slot="site-header-link"]')).toHaveLength(6)
      expect(w.find('[aria-haspopup]').exists()).toBe(false)
    })
    it('renders groups with headings in the mobile menu and closes on click', async () => {
      w = mount(SiteHeader, { props: { linkGroups } })
      await toggle().trigger('click')
      expect(w.findAll('[data-slot="site-header-mobile-group-title"]').map((t) => t.text())).toEqual(['Product', 'Company'])
      expect(w.findAll('[data-slot="site-header-mobile-link"]')).toHaveLength(3)
      await w.findAll('[data-slot="site-header-mobile-link"]')[1].trigger('click')
      expect(w.emitted('navigate')![0][0]).toMatchObject({ label: 'Pricing' })
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
    })
    it('groups alone provide nav and toggle; active state applies inside groups', () => {
      w = mount(SiteHeader, { props: { linkGroups, activeHref: '/a' } })
      expect(w.find('nav').exists()).toBe(true)
      expect(toggle().exists()).toBe(true)
      expect(w.find('a[aria-current="page"]').text()).toBe('About')
    })
    it('ungrouped links are not wrapped in a group role', () => {
      w = mount(SiteHeader, { props: { links } })
      expect(w.find('[role="group"]').exists()).toBe(false)
    })
    it('skips malformed or empty groups', () => {
      // @ts-expect-error deliberately invalid
      w = mount(SiteHeader, { props: { linkGroups: [null, { title: 'x' }, { title: 'Empty', links: [] }, linkGroups[1]] } })
      expect(w.findAll('[data-slot="site-header-group"]')).toHaveLength(1)
    })
    it('non-array links/groups are tolerated', () => {
      // @ts-expect-error deliberately invalid
      w = mount(SiteHeader, { props: { links: 'nope', linkGroups: 'nope' } })
      expect(w.find('nav').exists()).toBe(false)
    })
    it('custom links slot replaces both lists', () => {
      w = mount(SiteHeader, { props: { links, linkGroups }, slots: { links: '<a id="custom">c</a>' } })
      expect(w.findAll('#custom')).toHaveLength(1)
      expect(w.find('[data-slot="site-header-group"]').exists()).toBe(false)
    })
  })

  describe('bad path and customisation', () => {
    it('unknown variant falls back to default', () => {
      // @ts-expect-error deliberately invalid
      w = mount(SiteHeader, { props: { variant: 'mega', links } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.classes()).toContain('sticky')
    })
    it('class override wins in every variant', () => {
      for (const variant of siteHeaderVariantNames) {
        const h = mount(SiteHeader, { props: { variant, class: 'z-50 custom' } })
        expect(h.classes()).toEqual(expect.arrayContaining(['custom', 'z-50']))
        expect(h.classes()).not.toContain('z-(--z-sticky)')
        h.unmount()
      }
    })
    it('Escape closes the menu in the minimal variant and focus returns to the toggle', async () => {
      w = mount(SiteHeader, { props: { variant: 'minimal', links }, attachTo: document.body })
      await toggle().trigger('click')
      await w.trigger('keydown', { key: 'Escape' })
      await nextTick()
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
      expect(document.activeElement).toBe(toggle().element)
    })
    it('every variant starts with no scrolled marker and no mobile panel', () => {
      for (const variant of siteHeaderVariantNames) {
        const h = mount(SiteHeader, { props: { variant, links } })
        expect(h.attributes('data-scrolled')).toBeUndefined()
        expect(h.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
        h.unmount()
      }
    })
  })

  describe('edge cases', () => {
    it('very long announcement and unicode brand', () => {
      w = mount(SiteHeader, { props: { variant: 'with-announcement', announcement: '界'.repeat(3000), brand: '🚀' } })
      expect(w.find('[data-slot="site-header-announcement"]').text()).toHaveLength(3000)
    })
    it('switching variants live keeps one header and one scroll listener', async () => {
      const add = vi.spyOn(window, 'addEventListener')
      w = mount(SiteHeader, { props: { links } })
      for (const v of ['transparent', 'floating', 'centered', 'minimal', 'with-announcement', 'default'] as const) await w.setProps({ variant: v })
      expect(w.attributes('data-variant')).toBe('default')
      expect(add.mock.calls.filter((c) => c[0] === 'scroll')).toHaveLength(1)
    })
  })

  describe('accessibility and slop regressions', () => {
    it('no variant uses backdrop blur, translucent fills, shadows, rounded-3xl or arbitrary values', () => {
      for (const variant of siteHeaderVariantNames) {
        const h = mount(SiteHeader, { props: { variant, links, brand: 'A', announcement: 'x' }, attachTo: document.body })
        expect(h.html()).not.toMatch(/backdrop|blur|bg-background\/|shadow|rounded-(3xl|full)|\[calc|\[1fr/)
        h.unmount()
      }
    })
    it('the toggle name is constant ("Menu", localisable) and the state lives in aria-expanded', async () => {
      w = mount(SiteHeader, { props: { links, menuLabel: 'Menü' } })
      expect(toggle().attributes('aria-label')).toBe('Menü')
      await toggle().trigger('click')
      expect(toggle().attributes('aria-label')).toBe('Menü')
      expect(toggle().attributes('aria-expanded')).toBe('true')
    })
    it('openLabel / closeLabel still switch the name when a consumer sets them (back-compat)', async () => {
      w = mount(SiteHeader, { props: { links, openLabel: 'Open nav', closeLabel: 'Close nav' } })
      expect(toggle().attributes('aria-label')).toBe('Open nav')
      await toggle().trigger('click')
      expect(toggle().attributes('aria-label')).toBe('Close nav')
      w.unmount()
      w = mount(SiteHeader, { props: { links, openLabel: 'Open nav' } })
      await toggle().trigger('click')
      expect(toggle().attributes('aria-label')).toBe('Close menu')
    })
    it('links, brand and toggle meet target size (24px, 44px on coarse pointers)', () => {
      w = mount(SiteHeader, { props: { links, brand: 'A' } })
      for (const el of [...w.findAll('[data-slot="site-header-link"]'), w.find('[data-slot="site-header-logo"] a')]) expect(el.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
      expect(toggle().classes()).toEqual(expect.arrayContaining(['size-10', 'pointer-coarse:size-11']))
    })
    it('the current page is not colour alone: it is underlined as well as aria-current', () => {
      w = mount(SiteHeader, { props: { links, activeHref: '/docs' } })
      const cur = w.find('a[aria-current="page"]')
      expect(cur.classes()).toEqual(expect.arrayContaining(['underline', 'underline-offset-4']))
      expect(w.findAll('[data-slot="site-header-link"]')[1].classes()).not.toContain('underline')
    })
    it('the bar has a minimum height so large text reflows, and the nav can wrap', () => {
      w = mount(SiteHeader, { props: { links } })
      const bar = w.find('[data-slot="site-header-bar"]').classes()
      expect(bar).toContain('min-h-16')
      expect(bar).not.toContain('h-16')
      expect(w.find('[data-slot="site-header-nav"]').classes()).toEqual(expect.arrayContaining(['flex-wrap', 'min-w-0']))
    })
    it('group separators and offsets use logical properties', () => {
      w = mount(SiteHeader, { props: { linkGroups: [{ title: 'G', links: [{ label: 'A', href: '/a' }] }] } })
      const g = w.find('[data-slot="site-header-group"]')
      expect(g.classes()).toEqual(expect.arrayContaining(['ms-2', 'border-s', 'ps-2']))
      expect(g.classes().join(' ')).not.toMatch(/\b(ml|pl)-|border-l/)
    })
    it('mobile group titles are sentence case, not tracked uppercase', async () => {
      w = mount(SiteHeader, { props: { linkGroups: [{ title: 'Guides', links: [{ label: 'A', href: '/a' }] }], modelValue: true } })
      const t = w.find('[data-slot="site-header-mobile-group-title"]')
      expect(t.classes().join(' ')).not.toMatch(/uppercase|tracking/)
    })
    it('the mobile panel scrolls inside the viewport (dvh) instead of overflowing the page', async () => {
      w = mount(SiteHeader, { props: { links, modelValue: true } })
      expect(w.find('[data-slot="site-header-mobile"]').classes()).toEqual(expect.arrayContaining(['max-h-dvh', 'overflow-y-auto']))
    })
    it('no brand text and no logo slot renders no empty link', () => {
      w = mount(SiteHeader, { props: { links } })
      expect(w.find('[data-slot="site-header-logo"] a').exists()).toBe(false)
    })
    it('without links the cta stays visible at every width and there is no toggle or panel', () => {
      w = mount(SiteHeader, { props: { modelValue: true }, slots: { cta: '<b>x</b>' } })
      const cta = w.find('[data-slot="site-header-cta"]')
      expect(cta.classes()).toContain('flex')
      expect(cta.classes()).not.toContain('hidden')
      expect(toggle().exists()).toBe(false)
      expect(w.find('[data-slot="site-header-mobile"]').exists()).toBe(false)
    })
    it('with links the cta is hidden below sm (it lives in the mobile panel)', () => {
      w = mount(SiteHeader, { props: { links }, slots: { cta: '<b>x</b>' } })
      expect(w.find('[data-slot="site-header-cta"]').classes()).toEqual(expect.arrayContaining(['hidden', 'sm:flex']))
    })
    it('the distinct navLabel names the landmark and the mobile list', async () => {
      w = mount(SiteHeader, { props: { links, navLabel: 'Docs header', modelValue: true } })
      expect(w.find('[data-slot="site-header-nav"]').attributes('aria-label')).toBe('Docs header')
      expect(w.find('[data-slot="site-header-mobile"] nav').attributes('aria-label')).toBe('Docs header (mobile)')
    })
    it('Escape with the menu closed does nothing', async () => {
      w = mount(SiteHeader, { props: { links }, attachTo: document.body })
      await w.trigger('keydown', { key: 'Escape' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('sticky header does not obscure focus (WCAG 2.4.11)', () => {
    const rect = (height: number) => ({ height, top: 0, bottom: height, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
    afterEach(() => {
      document.documentElement.style.scrollPaddingTop = ''
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })
    it('sets the page scroll-padding-top to the header height while sticky and restores it on unmount', () => {
      document.documentElement.style.scrollPaddingTop = '3px'
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect(64))
      w = mount(SiteHeader, { props: { links }, attachTo: document.body })
      expect(document.documentElement.style.scrollPaddingTop).toBe('64px')
      w.unmount()
      w = undefined
      expect(document.documentElement.style.scrollPaddingTop).toBe('3px')
    })
    it('does nothing when not sticky, and follows the sticky prop', async () => {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect(64))
      w = mount(SiteHeader, { props: { links, sticky: false }, attachTo: document.body })
      expect(document.documentElement.style.scrollPaddingTop).toBe('')
      await w.setProps({ sticky: true })
      expect(document.documentElement.style.scrollPaddingTop).toBe('64px')
      await w.setProps({ sticky: false })
      expect(document.documentElement.style.scrollPaddingTop).toBe('')
    })
    it('adds the sticky top offset (floating variant) and re-measures when the header resizes', () => {
      let resize: () => void = () => {}
      const disconnect = vi.fn()
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(cb: () => void) {
            resize = cb
          }
          observe() {}
          disconnect = disconnect
        },
      )
      const el = document.createElement('div')
      el.style.top = '16px'
      document.body.appendChild(el)
      const rectSpy = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(56))
      const stop = trackStickyOffset(el)
      expect(document.documentElement.style.scrollPaddingTop).toBe('72px') // 56px high + top-4 (16px)
      rectSpy.mockReturnValue(rect(120))
      resize()
      expect(document.documentElement.style.scrollPaddingTop).toBe('136px')
      stop()
      expect(disconnect).toHaveBeenCalled()
      expect(document.documentElement.style.scrollPaddingTop).toBe('')
    })
    it('is a safe no-op without an element', () => {
      const stop = trackStickyOffset(null)
      expect(() => stop()).not.toThrow()
      expect(document.documentElement.style.scrollPaddingTop).toBe('')
    })
  })
})
