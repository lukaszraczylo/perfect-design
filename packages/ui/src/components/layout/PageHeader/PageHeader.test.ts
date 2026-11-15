import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'
import { pageHeaderTitleVariants, pageHeaderVariants } from './variants'

describe('PageHeader', () => {
  describe('good path', () => {
    it('renders title in an h1 and description', () => {
      const w = mount(PageHeader, { props: { title: 'Projects', description: 'All your projects' } })
      expect(w.element.tagName).toBe('HEADER')
      expect(w.attributes('data-slot')).toBe('page-header')
      expect(w.find('h1').text()).toBe('Projects')
      expect(w.find('h1').attributes('data-slot')).toBe('page-header-title')
      expect(w.find('[data-slot="page-header-description"]').text()).toBe('All your projects')
    })

    it('renders breadcrumb above the title and actions at the right', () => {
      const w = mount(PageHeader, {
        props: { title: 'T' },
        slots: { breadcrumb: '<nav id="bc">crumbs</nav>', actions: '<button id="act">New</button>' },
      })
      const html = w.html()
      expect(w.find('[data-slot="page-header-breadcrumb"] #bc').exists()).toBe(true)
      expect(w.find('[data-slot="page-header-actions"] #act').exists()).toBe(true)
      expect(html.indexOf('crumbs')).toBeLessThan(html.indexOf('>T<'))
      expect(html.indexOf('>T<')).toBeLessThan(html.indexOf('New'))
    })

    it('title and description slots override props', () => {
      const w = mount(PageHeader, {
        props: { title: 'prop', description: 'prop-d' },
        slots: { title: '<em>Slot title</em>', description: '<b>Slot desc</b>' },
      })
      expect(w.find('h1 em').text()).toBe('Slot title')
      expect(w.find('[data-slot="page-header-description"] b').text()).toBe('Slot desc')
      expect(w.text()).not.toContain('prop')
    })

    it('titleAs changes the element', () => {
      const w = mount(PageHeader, { props: { title: 'T', titleAs: 'h2' } })
      expect(w.find('h1').exists()).toBe(false)
      expect(w.find('h2').text()).toBe('T')
    })

    it('has responsive stacking classes', () => {
      const w = mount(PageHeader, { props: { title: 'T' }, slots: { actions: 'a' } })
      expect(w.find('.flex-col.sm\\:flex-row').exists()).toBe(true)
    })

    it('non-sticky by default', () => {
      const w = mount(PageHeader, { props: { title: 'T' } })
      expect(w.classes()).not.toContain('sticky')
      expect(w.attributes('data-sticky')).toBeUndefined()
    })

    it('sticky adds sticky classes and data-sticky', () => {
      const w = mount(PageHeader, { props: { title: 'T', sticky: true } })
      expect(w.classes()).toEqual(expect.arrayContaining(['sticky', 'top-0', 'border-b', 'bg-background']))
      // Regression: no translucent blurred background.
      expect(w.classes().join(' ')).not.toMatch(/backdrop|bg-background\//)
      expect(w.classes().join(' ')).toContain('z-(--z-sticky)')
      expect(w.attributes('data-sticky')).toBeDefined()
    })

    it('exports variants', () => {
      expect(pageHeaderVariants({ sticky: true })).toContain('sticky')
      expect(pageHeaderVariants({ variant: 'hero', background: 'muted' })).toContain('bg-muted')
      expect(pageHeaderVariants({ variant: 'hero', background: 'gradient' as never })).not.toContain('from-primary')
      expect(pageHeaderTitleVariants({ variant: 'compact' })).toContain('text-lg')
    })

    it('default variant keeps the original DOM: no data-variant, no extra wrappers', () => {
      const w = mount(PageHeader, { props: { title: 'T' } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-3', 'pb-4']))
      expect(w.find('h1').classes()).toEqual(expect.arrayContaining(['text-2xl', 'font-semibold', 'tracking-tight', 'text-balance']))
      expect(w.find('[data-slot="page-header-back"]').exists()).toBe(false)
      expect(w.find('[data-slot="page-header-tabs"]').exists()).toBe(false)
      expect(w.find('img').exists()).toBe(false)
    })
  })

  describe('variants', () => {
    const full = { title: 'T', description: 'D' }
    const slots = { actions: '<button>A</button>' }

    it('centered: centres header, heading and actions, no sm:flex-row', () => {
      const w = mount(PageHeader, { props: { ...full, variant: 'centered' }, slots })
      expect(w.attributes('data-variant')).toBe('centered')
      expect(w.classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
      expect(w.find('[data-slot="page-header-heading"]').classes()).toContain('items-center')
      expect(w.find('[data-slot="page-header-actions"]').classes()).toContain('justify-center')
      expect(w.find('[data-slot="page-header-description"]').classes()).toContain('max-w-2xl')
      expect(w.find('.sm\\:flex-row').exists()).toBe(false)
    })

    it('align=center centres any variant', () => {
      const w = mount(PageHeader, { props: { ...full, align: 'center', variant: 'compact' }, slots })
      expect(w.find('[data-slot="page-header-heading"]').classes()).toContain('items-center')
      expect(w.find('.sm\\:flex-row').exists()).toBe(false)
    })

    it('compact: tighter spacing and smaller title', () => {
      const w = mount(PageHeader, { props: { ...full, variant: 'compact' } })
      expect(w.attributes('data-variant')).toBe('compact')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-3')
      expect(w.classes()).toContain('pb-2')
      expect(w.classes()).not.toContain('pb-4')
      expect(w.find('h1').classes()).toContain('text-lg')
      expect(w.find('h1').classes()).not.toContain('text-2xl')
    })

    it('compact + sticky tightens the sticky padding', () => {
      const w = mount(PageHeader, { props: { title: 'T', variant: 'compact', sticky: true } })
      expect(w.classes()).toEqual(expect.arrayContaining(['sticky', 'py-2']))
      expect(w.classes()).not.toContain('py-3')
    })

    it('hero: banner on a flat muted background by default (no gradient)', () => {
      const w = mount(PageHeader, { props: { ...full, variant: 'hero' } })
      expect(w.attributes('data-variant')).toBe('hero')
      expect(w.classes()).toEqual(expect.arrayContaining(['relative', 'isolate', 'overflow-hidden', 'rounded-lg', 'border', 'bg-muted', 'sm:py-14']))
      expect(w.classes().some((c) => /gradient|bg-linear|^from-|^via-/.test(c))).toBe(false)
      expect(w.classes()).not.toContain('pb-4')
      expect(w.find('h1').classes()).toEqual(expect.arrayContaining(['text-3xl', 'sm:text-4xl']))
      expect(w.find('img').exists()).toBe(false)
    })

    it.each([
      ['muted', 'bg-muted'],
      ['primary', 'bg-primary'],
    ] as const)('hero background %s', (background, cls) => {
      const w = mount(PageHeader, { props: { ...full, variant: 'hero', background } })
      expect(w.classes()).toContain(cls)
      expect(w.classes().some((c) => /bg-linear|gradient/.test(c))).toBe(false)
    })

    it('hero primary uses primary-foreground text everywhere, including description and breadcrumb', () => {
      const w = mount(PageHeader, { props: { ...full, variant: 'hero', background: 'primary' }, slots: { breadcrumb: 'bc', back: '<a>b</a>' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-primary-foreground', 'border-transparent']))
      expect(w.classes()).not.toContain('border-border')
      expect(w.find('[data-slot="page-header-description"]').classes()).toContain('text-primary-foreground')
      expect(w.find('[data-slot="page-header-description"]').classes()).not.toContain('text-muted-foreground')
      expect(w.find('[data-slot="page-header-breadcrumb"]').classes()).toContain('text-primary-foreground')
    })

    it('hero image: img (decorative) plus overlay, backgroundImage alone selects it', () => {
      const w = mount(PageHeader, { props: { ...full, variant: 'hero', backgroundImage: '/hero.jpg' } })
      const img = w.find('[data-slot="page-header-background-image"]')
      expect(img.element.tagName).toBe('IMG')
      expect(img.attributes('src')).toBe('/hero.jpg')
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('aria-hidden')).toBe('true')
      expect(img.classes()).toEqual(expect.arrayContaining(['absolute', 'inset-0', 'object-cover']))
      expect(w.find('[data-slot="page-header-overlay"]').classes()).toContain('bg-background/70')
      expect(w.classes()).toContain('bg-muted')
    })

    it('hero image with an explicit non-image background keeps that background and shows the image', () => {
      const w = mount(PageHeader, { props: { variant: 'hero', background: 'primary', backgroundImage: '/x.jpg' } })
      expect(w.find('img').exists()).toBe(true)
      expect(w.classes()).toContain('bg-primary')
    })

    it('hero background slot renders custom art', () => {
      const w = mount(PageHeader, { props: { variant: 'hero' }, slots: { background: '<svg id="art" />' } })
      expect(w.find('[data-slot="page-header-background"] #art').exists()).toBe(true)
      expect(w.find('[data-slot="page-header-background"]').classes()).toContain('-z-10')
    })

    it('hero sticky does not get relative (it would break sticky)', () => {
      const w = mount(PageHeader, { props: { title: 'T', variant: 'hero', sticky: true } })
      expect(w.classes()).toContain('sticky')
      expect(w.classes()).not.toContain('relative')
    })

    it('hero + center combine', () => {
      const w = mount(PageHeader, { props: { ...full, variant: 'hero', align: 'center' }, slots })
      expect(w.find('[data-slot="page-header-actions"]').classes()).toContain('justify-center')
      expect(w.classes()).toContain('isolate')
    })
  })

  describe('back link', () => {
    it('renders an anchor with chevron and default label', () => {
      const w = mount(PageHeader, { props: { title: 'T', backHref: '/projects' } })
      const a = w.find('a[data-slot="page-header-back"]')
      expect(a.attributes('href')).toBe('/projects')
      expect(a.text()).toBe('Back')
      expect(a.find('svg').attributes('aria-hidden')).toBe('true')
      expect(a.classes()).toEqual(expect.arrayContaining(['text-muted-foreground', 'focus-visible:ring-3']))
    })

    it('custom label', () => {
      expect(mount(PageHeader, { props: { backHref: '/x', backLabel: 'All projects' } }).find('a').text()).toBe('All projects')
    })

    it('comes before the breadcrumb and the title', () => {
      const w = mount(PageHeader, { props: { title: 'TTT', backHref: '/x' }, slots: { breadcrumb: 'BBB' } })
      const t = w.text()
      expect(t.indexOf('Back')).toBeLessThan(t.indexOf('BBB'))
      expect(t.indexOf('BBB')).toBeLessThan(t.indexOf('TTT'))
    })

    it('back slot replaces the link', () => {
      const w = mount(PageHeader, { props: { backHref: '/x' }, slots: { back: '<a id="rl">Router</a>' } })
      expect(w.find('[data-slot="page-header-back"] #rl').exists()).toBe(true)
      expect(w.findAll('[data-slot="page-header-back"]')).toHaveLength(1)
      expect(w.find('a[href="/x"]').exists()).toBe(false)
    })

    it('empty backHref renders nothing', () => {
      expect(mount(PageHeader, { props: { title: 'T', backHref: '' } }).find('[data-slot="page-header-back"]').exists()).toBe(false)
    })

    it('uses the muted-foreground on primary heroes inverted', () => {
      const w = mount(PageHeader, { props: { variant: 'hero', background: 'primary', backHref: '/x' } })
      expect(w.find('a').classes()).toContain('text-primary-foreground')
    })

    it('is centred in centered mode', () => {
      expect(mount(PageHeader, { props: { variant: 'centered' }, slots: { back: '<a>b</a>' } }).find('[data-slot="page-header-back"]').classes()).toContain('justify-center')
    })
  })

  describe('tabs slot', () => {
    it('renders below the heading in a scrollable wrapper', () => {
      const w = mount(PageHeader, { props: { title: 'TTT' }, slots: { tabs: '<div id="tabs">tabs</div>', actions: 'ACT' } })
      const wrap = w.find('[data-slot="page-header-tabs"]')
      expect(wrap.find('#tabs').exists()).toBe(true)
      expect(wrap.classes()).toEqual(expect.arrayContaining(['min-w-0', 'overflow-x-auto']))
      expect(w.text().indexOf('ACT')).toBeLessThan(w.text().indexOf('tabs'))
    })

    it('stretches in centered mode', () => {
      expect(mount(PageHeader, { props: { variant: 'centered' }, slots: { tabs: 't' } }).find('[data-slot="page-header-tabs"]').classes()).toContain('self-stretch')
    })

    it('is omitted when no slot is given', () => {
      expect(mount(PageHeader, { props: { title: 'T' } }).find('[data-slot="page-header-tabs"]').exists()).toBe(false)
    })
  })

  describe('customisation', () => {
    it('class wins', () => {
      const w = mount(PageHeader, { props: { class: 'pb-0 custom' } })
      expect(w.classes()).toContain('pb-0')
      expect(w.classes()).not.toContain('pb-4')
      expect(w.classes()).toContain('custom')
    })

    it('as and attrs', () => {
      const w = mount(PageHeader, { props: { as: 'div' }, attrs: { id: 'ph', 'data-x': '1' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('id')).toBe('ph')
      expect(w.attributes('data-x')).toBe('1')
    })
  })

  describe('bad path', () => {
    it('unknown variant falls back to default', () => {
      const w = mount(PageHeader, { props: { title: 'T', variant: 'wat' as never } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('pb-4')
      expect(mount(PageHeader, { props: { variant: 'toString' as never } }).attributes('data-variant')).toBeUndefined()
    })

    it('unknown align falls back to start', () => {
      const w = mount(PageHeader, { props: { title: 'T', align: 'right' as never }, slots: { actions: 'a' } })
      expect(w.find('.sm\\:flex-row').exists()).toBe(true)
    })

    it('unknown hero background (including the removed gradient) falls back to muted', () => {
      expect(mount(PageHeader, { props: { variant: 'hero', background: 'neon' as never } }).classes()).toContain('bg-muted')
      expect(mount(PageHeader, { props: { variant: 'hero', background: 'gradient' as never } }).classes()).toContain('bg-muted')
    })

    it('hero background=image without an image falls back to muted', () => {
      const w = mount(PageHeader, { props: { variant: 'hero', background: 'image' } })
      expect(w.classes()).toContain('bg-muted')
      expect(w.find('img').exists()).toBe(false)
    })

    it('background props are ignored outside hero', () => {
      const w = mount(PageHeader, { props: { title: 'T', background: 'primary', backgroundImage: '/x.jpg' }, slots: { background: 'art' } })
      expect(w.classes()).not.toContain('bg-primary')
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="page-header-background"]').exists()).toBe(false)
    })

    it('renders neither title, description, breadcrumb nor actions wrappers when empty', () => {
      const w = mount(PageHeader)
      expect(w.find('h1').exists()).toBe(false)
      expect(w.find('[data-slot="page-header-description"]').exists()).toBe(false)
      expect(w.find('[data-slot="page-header-breadcrumb"]').exists()).toBe(false)
      expect(w.find('[data-slot="page-header-actions"]').exists()).toBe(false)
    })

    it('empty-string title and description render nothing', () => {
      const w = mount(PageHeader, { props: { title: '', description: '' } })
      expect(w.find('h1').exists()).toBe(false)
      expect(w.find('[data-slot="page-header-description"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('very long, unicode and RTL titles render verbatim', () => {
      const long = 'x'.repeat(500)
      expect(mount(PageHeader, { props: { title: long } }).find('h1').text()).toBe(long)
      expect(mount(PageHeader, { props: { title: 'مرحبا 🌍 שלום' } }).find('h1').text()).toBe('مرحبا 🌍 שלום')
    })

    it('escapes HTML in props', () => {
      const w = mount(PageHeader, { props: { title: '<script>x</script>' } })
      expect(w.find('h1 script').exists()).toBe(false)
      expect(w.find('h1').text()).toBe('<script>x</script>')
    })

    it('class overrides variant classes', () => {
      const w = mount(PageHeader, { props: { variant: 'hero', class: 'rounded-none py-4 bg-card' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'py-4', 'bg-card']))
      expect(w.classes()).not.toContain('rounded-xl')
    })

    it('everything together renders every region once', () => {
      const w = mount(PageHeader, {
        props: { title: 'T', description: 'D', variant: 'hero', backHref: '/b', backgroundImage: '/i.jpg', sticky: true },
        slots: { breadcrumb: 'bc', actions: 'ac', tabs: 'tb', background: 'bg' },
      })
      for (const slot of ['back', 'breadcrumb', 'heading', 'title', 'description', 'actions', 'tabs', 'background', 'background-image', 'overlay']) {
        expect(w.findAll(`[data-slot="page-header-${slot}"]`), slot).toHaveLength(1)
      }
    })

    it('title via slot only', () => {
      expect(mount(PageHeader, { slots: { title: 'Only slot' } }).find('h1').text()).toBe('Only slot')
    })

    it('description only', () => {
      const w = mount(PageHeader, { props: { description: 'd' } })
      expect(w.find('h1').exists()).toBe(false)
      expect(w.text()).toBe('d')
    })
  })
})

describe('PageHeader tabs row accessibility', () => {
  function mountTabs(props: Record<string, unknown> = {}) {
    const cbs: Array<() => void> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          cbs.push(cb)
        }
        observe() {}
        disconnect() {}
      },
    )
    const w = mount(PageHeader, { props: { title: 'T', ...props }, slots: { tabs: '<span>x</span>' }, attachTo: document.body })
    const el = w.find('[data-slot="page-header-tabs"]').element
    const set = (over: boolean) => {
      Object.defineProperty(el, 'scrollWidth', { configurable: true, value: over ? 900 : 100 })
      Object.defineProperty(el, 'clientWidth', { configurable: true, value: 100 })
      cbs.forEach((cb) => cb())
    }
    return { w, set }
  }
  afterEach(() => vi.unstubAllGlobals())

  it('is not a tab stop (or a nameless region) while the tabs fit', () => {
    const { w } = mountTabs()
    const tabs = w.find('[data-slot="page-header-tabs"]')
    expect(tabs.attributes('tabindex')).toBeUndefined()
    expect(tabs.attributes('role')).toBeUndefined()
    expect(tabs.attributes('aria-label')).toBeUndefined()
  })

  it('becomes a focusable labelled region only while it overflows', async () => {
    const { w, set } = mountTabs({ tabsLabel: 'Project sections' })
    set(true)
    await nextTick()
    const tabs = w.find('[data-slot="page-header-tabs"]')
    expect(tabs.attributes('tabindex')).toBe('0')
    expect(tabs.attributes('role')).toBe('region')
    expect(tabs.attributes('aria-label')).toBe('Project sections')
    set(false)
    await nextTick()
    expect(tabs.attributes('tabindex')).toBeUndefined()
  })
})
