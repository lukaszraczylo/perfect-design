import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Hero from './Hero.vue'
import { heroBackgrounds, heroDecorations, heroSubtitleVariants, heroTitleVariants, heroVariantNames, heroVariants } from './variants'

describe('Hero', () => {
  describe('good path', () => {
    it('renders a left-aligned section by default (slop rule: no centred default) with eyebrow, title, subtitle, actions', () => {
      const w = mount(Hero, {
        props: { eyebrow: 'New', title: 'Build faster', subtitle: 'With us' },
        slots: { actions: '<button>Go</button>' },
      })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('data-slot')).toBe('hero')
      expect(w.attributes('data-variant')).toBe('left')
      expect(w.classes()).toContain('text-start')
      expect(w.classes()).not.toContain('text-center')
      expect(w.find('[data-slot="hero-eyebrow"]').text()).toBe('New')
      expect(w.find('h1[data-slot="hero-title"]').text()).toBe('Build faster')
      expect(w.find('[data-slot="hero-subtitle"]').text()).toBe('With us')
      expect(w.find('[data-slot="hero-actions"] button').exists()).toBe(true)
    })
    it('split variant lays out two columns and renders media', () => {
      const w = mount(Hero, { props: { variant: 'split', title: 'T' }, slots: { media: '<img alt="" src="/a.png">' } })
      expect(w.attributes('data-variant')).toBe('split')
      expect(w.find('[data-slot="hero-inner"]').classes()).toContain('lg:grid-cols-2')
      expect(w.find('[data-slot="hero-media"] img').exists()).toBe(true)
      expect(heroVariants({ variant: 'split' })).toContain('text-start')
    })
    it('reverse swaps order in split', () => {
      const w = mount(Hero, { props: { variant: 'split', reverse: true }, slots: { media: 'm' } })
      expect(w.find('[data-slot="hero-content"]').classes()).toContain('lg:order-2')
      expect(w.find('[data-slot="hero-media"]').classes()).toContain('lg:order-1')
    })
    it.each(['grid', 'dots'] as const)('decoration %s is an aria-hidden svg pattern', (decoration) => {
      const w = mount(Hero, { props: { decoration } })
      const d = w.find('[data-slot="hero-decoration"]')
      expect(d.element.tagName.toLowerCase()).toBe('svg')
      expect(d.attributes('aria-hidden')).toBe('true')
      expect(d.attributes('data-pattern')).toBe(decoration)
      expect(d.classes().join(' ')).toContain(heroDecorations[decoration])
    })
    it('slots replace props', () => {
      const w = mount(Hero, { slots: { eyebrow: '<b>E</b>', title: '<i>T</i>', subtitle: '<u>S</u>', default: '<p id="extra">x</p>' } })
      expect(w.find('b').exists() && w.find('i').exists() && w.find('u').exists() && w.find('#extra').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last', () => {
      const w = mount(Hero, { props: { class: 'py-4 custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('py-4')
      expect(w.classes()).not.toContain('py-16')
    })
    it('passes attrs and supports as and level', () => {
      const w = mount(Hero, { props: { as: 'header', level: 2, title: 'x' }, attrs: { id: 'top' } })
      expect(w.element.tagName).toBe('HEADER')
      expect(w.attributes('id')).toBe('top')
      expect(w.find('h2').exists()).toBe(true)
    })
    it('custom decoration slot replaces the built-in', () => {
      const w = mount(Hero, { props: { decoration: 'grid' }, slots: { decoration: '<div id="mine" />' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.find('[data-slot="hero-decoration"]').exists()).toBe(false)
    })
  })

  describe('bad path', () => {
    it('renders with nothing and no optional parts', () => {
      const w = mount(Hero)
      for (const part of ['eyebrow', 'title', 'subtitle', 'actions', 'media', 'decoration'])
        expect(w.find(`[data-slot="hero-${part}"]`).exists()).toBe(false)
    })
    it('unknown decoration and level fall back safely', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Hero, { props: { decoration: 'nope', level: 12, title: 'x' } })
      expect(w.find('[data-slot="hero-decoration"]').exists()).toBe(false)
      expect(w.find('h1').exists()).toBe(true)
    })
    it('unknown variant is treated as left', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(Hero, { props: { variant: 'wide' } }).attributes('data-variant')).toBe('left')
    })
  })

  describe('edge cases', () => {
    it('handles very long and unicode text', () => {
      const w = mount(Hero, { props: { title: 'ä'.repeat(3000), subtitle: '🚀 שלום' } })
      expect(w.find('h1').text()).toHaveLength(3000)
      expect(w.text()).toContain('🚀')
    })
    it('reverse has no effect on centered', () => {
      const w = mount(Hero, { props: { variant: 'centered', reverse: true }, slots: { media: 'm' } })
      expect(w.find('[data-slot="hero-content"]').classes()).not.toContain('lg:order-2')
    })
  })
})

describe('Hero variants', () => {
  const media = { media: '<div id="m">media</div>' }

  it.each(heroVariantNames)('variant %s renders a section with data-variant and title', (variant) => {
    const w = mount(Hero, { props: { variant, title: 'T' }, slots: media })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.find('h1').text()).toBe('T')
    expect(w.find('#m').exists()).toBe(true)
    expect(heroVariants({ variant })).toMatch(/text-(start|center)/)
  })

  it.each(['split', 'split-reverse', 'left', 'terminal', 'code'] as const)('%s is left-aligned (text-start, RTL safe)', (variant) => {
    expect(mount(Hero, { props: { variant } }).classes()).toContain('text-start')
  })
  it.each(['centered', 'minimal', 'stacked-media', 'announcement', 'with-stats', 'with-logos', 'with-form', 'full-bleed', 'bento'] as const)(
    '%s is centred',
    (variant) => {
      expect(mount(Hero, { props: { variant } }).classes()).toContain('text-center')
    },
  )

  describe('split-reverse and left', () => {
    it('split-reverse puts media first without the reverse prop', () => {
      const w = mount(Hero, { props: { variant: 'split-reverse' }, slots: media })
      expect(w.find('[data-slot="hero-inner"]').classes()).toContain('lg:grid-cols-2')
      expect(w.find('[data-slot="hero-content"]').classes()).toContain('lg:order-2')
      expect(w.find('[data-slot="hero-media"]').classes()).toContain('lg:order-1')
    })
    it('left stacks left-aligned content and keeps actions at the start', () => {
      const w = mount(Hero, { props: { variant: 'left', title: 'x' }, slots: { actions: '<b>a</b>', ...media } })
      expect(w.find('[data-slot="hero-inner"]').classes()).toContain('items-start')
      expect(w.find('[data-slot="hero-inner"]').classes()).not.toContain('lg:grid-cols-2')
      expect(w.find('[data-slot="hero-actions"]').classes()).not.toContain('justify-center')
      expect(w.find('[data-slot="hero-media"]').classes()).not.toContain('mx-auto')
    })
  })

  describe('minimal and size', () => {
    it('minimal uses a compact headline and narrower content', () => {
      const w = mount(Hero, { props: { variant: 'minimal', title: 'x' } })
      expect(w.find('h1').classes()).toContain('text-2xl')
      expect(w.find('h1').classes()).not.toContain('text-4xl')
      expect(w.find('[data-slot="hero-content"]').classes()).toContain('max-w-2xl')
      expect(w.find('[data-slot="hero-inner"]').classes()).toContain('gap-6')
    })
    it.each([
      ['sm', 'py-10', 'text-3xl'],
      ['md', 'py-16', 'text-4xl'],
      ['lg', 'py-24', 'text-5xl'],
    ] as const)('size %s sets padding and type scale', (size, pad, text) => {
      const w = mount(Hero, { props: { size, title: 'x', subtitle: 's' } })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toContain(pad)
      expect(w.find('h1').classes()).toContain(text)
      expect(heroTitleVariants({ size })).toContain(text)
      expect(heroSubtitleVariants({ size })).toContain('text-')
    })
    it('unknown size falls back to md', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Hero, { props: { size: 'huge' } })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('py-16')
    })
  })

  describe('stacked-media and media frames', () => {
    it('stacked-media wraps media in a browser frame below the text', () => {
      const w = mount(Hero, { props: { variant: 'stacked-media', mediaTitle: 'example.com' }, slots: media })
      expect(w.find('[data-slot="hero-media"]').classes()).toContain('max-w-6xl')
      expect(w.find('[data-slot="media-frame"]').attributes('data-variant')).toBe('browser')
      expect(w.find('[data-slot="media-frame-title"]').text()).toBe('example.com')
      expect(w.find('#m').exists()).toBe(true)
    })
    it('mediaFrame overrides the default, including none', () => {
      const phone = mount(Hero, { props: { variant: 'stacked-media', mediaFrame: 'phone' }, slots: media })
      expect(phone.find('[data-slot="media-frame"]').attributes('data-variant')).toBe('phone')
      const none = mount(Hero, { props: { variant: 'stacked-media', mediaFrame: 'none' }, slots: media })
      expect(none.find('[data-slot="media-frame"]').exists()).toBe(false)
      expect(none.find('#m').exists()).toBe(true)
    })
    it('invalid mediaFrame falls back to the variant default', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Hero, { props: { variant: 'stacked-media', mediaFrame: 'tv' }, slots: media })
      expect(w.find('[data-slot="media-frame"]').attributes('data-variant')).toBe('browser')
      // @ts-expect-error deliberately invalid
      const c = mount(Hero, { props: { variant: 'centered', mediaFrame: 'tv' }, slots: media })
      expect(c.find('[data-slot="media-frame"]').exists()).toBe(false)
    })
    it('split can opt into a frame', () => {
      const w = mount(Hero, { props: { variant: 'split', mediaFrame: 'plain' }, slots: media })
      expect(w.find('[data-slot="media-frame"]').attributes('data-variant')).toBe('plain')
    })
  })

  describe('announcement', () => {
    it('renders a pill link with arrow when href is set', () => {
      const w = mount(Hero, { props: { variant: 'announcement', announcement: 'v2 is out', announcementHref: '/changelog', title: 'x' } })
      const a = w.find('a[data-slot="hero-announcement"]')
      expect(a.attributes('href')).toBe('/changelog')
      expect(a.text()).toContain('v2 is out')
      expect(a.find('svg').exists()).toBe(true)
    })
    it('renders a non-link pill without href', () => {
      const w = mount(Hero, { props: { variant: 'announcement', announcement: 'Beta' } })
      const el = w.find('[data-slot="hero-announcement"]')
      expect(el.element.tagName).toBe('DIV')
      expect(el.find('svg').exists()).toBe(false)
    })
    it('announcement slot replaces text', () => {
      const w = mount(Hero, { props: { variant: 'announcement' }, slots: { announcement: '<b id="x">Hot</b>' } })
      expect(w.find('[data-slot="hero-announcement"] #x').exists()).toBe(true)
    })
    it('missing announcement renders nothing; other variants ignore it', () => {
      expect(mount(Hero, { props: { variant: 'announcement' } }).find('[data-slot="hero-announcement"]').exists()).toBe(false)
      expect(mount(Hero, { props: { variant: 'centered', announcement: 'x' } }).find('[data-slot="hero-announcement"]').exists()).toBe(false)
    })
  })

  describe('with-stats', () => {
    const stats = [
      { value: '10k', label: 'Users' },
      { value: 99, label: 'Uptime' },
    ]
    it('renders a description list of stats', () => {
      const w = mount(Hero, { props: { variant: 'with-stats', stats } })
      expect(w.find('dl').exists()).toBe(true)
      expect(w.findAll('[data-slot="hero-stat"]')).toHaveLength(2)
      expect(w.find('[data-slot="hero-stat-value"]').text()).toBe('10k')
      expect(w.find('[data-slot="hero-stat-label"]').text()).toBe('Users')
    })
    it('stats slot replaces the list', () => {
      const w = mount(Hero, { props: { variant: 'with-stats', stats }, slots: { stats: '<div id="custom" />' } })
      expect(w.find('#custom').exists()).toBe(true)
      expect(w.find('dl').exists()).toBe(false)
    })
    it('empty, malformed or missing stats render no section', () => {
      expect(mount(Hero, { props: { variant: 'with-stats', stats: [] } }).find('[data-slot="hero-stats"]').exists()).toBe(false)
      // @ts-expect-error deliberately invalid
      const w = mount(Hero, { props: { variant: 'with-stats', stats: [null, { value: 1 }, { label: 'x' }, { value: null, label: 'y' }, { value: 0, label: 'Zero' }] } })
      expect(w.findAll('[data-slot="hero-stat"]')).toHaveLength(1)
      expect(w.find('[data-slot="hero-stat-value"]').text()).toBe('0')
      // @ts-expect-error deliberately invalid
      expect(mount(Hero, { props: { variant: 'with-stats', stats: 'nope' } }).find('[data-slot="hero-stats"]').exists()).toBe(false)
    })
    it('other variants ignore stats', () => {
      expect(mount(Hero, { props: { stats } }).find('[data-slot="hero-stats"]').exists()).toBe(false)
    })
  })

  describe('with-logos', () => {
    it('renders label and logo strip', () => {
      const w = mount(Hero, { props: { variant: 'with-logos', logosLabel: 'Trusted by' }, slots: { logos: '<img alt="A" src="/a.svg"><img alt="B" src="/b.svg">' } })
      expect(w.find('[data-slot="hero-logos-label"]').text()).toBe('Trusted by')
      expect(w.findAll('[data-slot="hero-logos"] img')).toHaveLength(2)
    })
    it('omits label when not provided and whole strip without slot', () => {
      const w = mount(Hero, { props: { variant: 'with-logos' }, slots: { logos: '<i />' } })
      expect(w.find('[data-slot="hero-logos-label"]').exists()).toBe(false)
      expect(mount(Hero, { props: { variant: 'with-logos', logosLabel: 'x' } }).find('[data-slot="hero-logos"]').exists()).toBe(false)
    })
  })

  describe('with-form', () => {
    it('renders the form slot between subtitle and actions', () => {
      const w = mount(Hero, {
        props: { variant: 'with-form', title: 'x' },
        slots: { form: '<form id="f"><input aria-label="Email"></form>', actions: '<button>go</button>' },
      })
      const html = w.html()
      expect(w.find('[data-slot="hero-form"] #f').exists()).toBe(true)
      expect(html.indexOf('hero-form')).toBeLessThan(html.indexOf('hero-actions'))
    })
    it('no form slot or other variant renders no form region', () => {
      expect(mount(Hero, { props: { variant: 'with-form' } }).find('[data-slot="hero-form"]').exists()).toBe(false)
      expect(mount(Hero, { slots: { form: '<i />' } }).find('[data-slot="hero-form"]').exists()).toBe(false)
    })
  })

  describe('terminal and code', () => {
    it('terminal wraps code in an inverted window frame with no blinking caret (WCAG 2.2.2)', () => {
      const w = mount(Hero, { props: { variant: 'terminal', code: '$ pnpm add x', mediaTitle: 'zsh' } })
      expect(w.find('[data-slot="media-frame"]').attributes('data-variant')).toBe('window')
      expect(w.find('[data-slot="media-frame-title"]').text()).toBe('zsh')
      expect(w.find('[data-slot="media-frame-content"]').classes()).toContain('bg-foreground')
      expect(w.find('[data-slot="hero-code"]').text()).toBe('$ pnpm add x')
      expect(w.find('[data-slot="hero-code"] span').exists()).toBe(false)
      expect(w.html()).not.toMatch(/animate-pulse|9611/)
      expect(w.find('[data-slot="hero-inner"]').classes()).toContain('lg:grid-cols-2')
    })
    it('the code block is a focusable, labelled scroll region (scrollable-region-focusable)', () => {
      const pre = mount(Hero, { props: { variant: 'terminal', code: 'x', mediaTitle: 'zsh' } }).find('[data-slot="hero-code"]')
      expect(pre.attributes('tabindex')).toBe('0')
      expect(pre.attributes('role')).toBe('region')
      expect(pre.attributes('aria-label')).toBe('zsh code')
      expect(pre.classes()).toContain('overflow-x-auto')
      expect(pre.classes()).toContain('focus-visible:outline-2')
      expect(pre.classes()).toContain('focus-visible:outline-solid')
      expect(mount(Hero, { props: { variant: 'code', code: 'x' } }).find('[data-slot="hero-code"]').attributes('aria-label')).toBe('Code sample')
      expect(mount(Hero, { props: { variant: 'code', code: 'x', codeLabel: 'Install', mediaTitle: 'a' } }).find('[data-slot="hero-code"]').attributes('aria-label')).toBe('Install')
      expect(mount(Hero, { props: { variant: 'code', code: 'x', mediaFrame: 'none' } }).find('[data-slot="hero-code"]').attributes('tabindex')).toBe('0')
    })
    it('code variant uses a card surface and no caret', () => {
      const w = mount(Hero, { props: { variant: 'code', code: 'const a = 1' } })
      expect(w.find('[data-slot="media-frame-content"]').classes()).toContain('bg-card')
      expect(w.find('[data-slot="hero-code"] span').exists()).toBe(false)
    })
    it('media slot wins over code', () => {
      const w = mount(Hero, { props: { variant: 'terminal', code: 'ignored' }, slots: media })
      expect(w.find('[data-slot="hero-code"]').exists()).toBe(false)
      expect(w.find('#m').exists()).toBe(true)
    })
    it('mediaFrame none renders bare code and no frame styling', () => {
      const w = mount(Hero, { props: { variant: 'code', code: 'x', mediaFrame: 'none' } })
      expect(w.find('[data-slot="media-frame"]').exists()).toBe(false)
      expect(w.find('[data-slot="hero-code"]').text()).toBe('x')
    })
    it('code works with a frame in other variants and preserves multi-line text', () => {
      const w = mount(Hero, { props: { variant: 'split', code: 'a\nb', mediaFrame: 'window' } })
      expect(w.find('[data-slot="hero-code"]').text()).toBe('a\nb')
      expect(w.find('[data-slot="media-frame-content"]').classes()).not.toContain('bg-foreground')
    })
  })

  describe('full-bleed and image background', () => {
    it('renders the image, a scrim overlay and puts the text on a solid panel (contrast never depends on the picture)', () => {
      const w = mount(Hero, { props: { variant: 'full-bleed', image: '/bg.jpg', title: 'x', subtitle: 's', eyebrow: 'e' } })
      const img = w.find('[data-slot="hero-background-image"] img')
      expect(img.attributes('src')).toBe('/bg.jpg')
      expect(img.attributes('alt')).toBe('')
      expect(w.find('[data-slot="hero-background-image"]').attributes('aria-hidden')).toBe('true')
      expect(w.find('[data-slot="hero-overlay"]').classes()).toContain('bg-scrim')
      expect(w.classes()).not.toContain('text-white')
      expect(w.find('[data-slot="hero-content"]').classes()).toEqual(expect.arrayContaining(['bg-background', 'text-foreground', 'rounded-lg', 'border']))
      expect(w.find('[data-slot="hero-subtitle"]').classes()).toContain('text-muted-foreground')
      expect(w.find('[data-slot="hero-eyebrow"]').classes()).toContain('text-primary')
    })
    it('without an image falls back to the primary surface with unfaded inverted text', () => {
      const w = mount(Hero, { props: { variant: 'full-bleed', title: 'x', subtitle: 's', eyebrow: 'e' } })
      expect(w.find('[data-slot="hero-background-image"]').exists()).toBe(false)
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-primary-foreground']))
      expect(w.find('[data-slot="hero-subtitle"]').classes()).toContain('text-current')
      expect(w.html()).not.toMatch(/text-current\/\d/)
    })
    it('background="image" on another variant also uses the image and solid panel', () => {
      const w = mount(Hero, { props: { variant: 'centered', background: 'image', image: '/x.jpg' } })
      expect(w.find('[data-slot="hero-background-image"]').exists()).toBe(true)
      expect(w.find('[data-slot="hero-decoration"]').exists()).toBe(false)
    })
    it('image prop alone does nothing for normal backgrounds', () => {
      const w = mount(Hero, { props: { image: '/x.jpg', background: 'grid' } })
      expect(w.find('[data-slot="hero-background-image"]').exists()).toBe(false)
      expect(w.classes()).not.toContain('bg-primary')
    })
  })

  describe('bento', () => {
    it('renders the tiles grid', () => {
      const w = mount(Hero, { props: { variant: 'bento' }, slots: { bento: '<div class="tile">1</div><div class="tile">2</div>' } })
      expect(w.findAll('[data-slot="hero-bento"] .tile')).toHaveLength(2)
      expect(w.find('[data-slot="hero-bento"]').classes()).toContain('lg:grid-cols-3')
    })
    it('missing bento slot renders nothing', () => {
      expect(mount(Hero, { props: { variant: 'bento' } }).find('[data-slot="hero-bento"]').exists()).toBe(false)
    })
  })

  describe('backgrounds', () => {
    it.each(['grid', 'dots'] as const)('background %s renders an aria-hidden, pointer-events-none svg pattern hidden in forced colors', (background) => {
      const w = mount(Hero, { props: { background } })
      const d = w.find('[data-slot="hero-decoration"]')
      expect(d.attributes('aria-hidden')).toBe('true')
      expect(d.classes()).toEqual(expect.arrayContaining(['pointer-events-none', 'forced-colors:hidden']))
      expect(d.classes().join(' ')).toContain(heroBackgrounds[background])
      expect(d.find('pattern').exists()).toBe(true)
      expect(d.find('rect').attributes('fill')).toMatch(/^url\(#.+\)$/)
    })
    it.each(['gradient', 'glow', 'spotlight'] as const)('removed background %s renders nothing (slop rule) and is gone from the map', (background) => {
      // @ts-expect-error removed value
      const w = mount(Hero, { props: { background } })
      expect(w.find('[data-slot="hero-decoration"]').exists()).toBe(false)
      expect(Object.keys(heroBackgrounds)).toEqual(['none', 'grid', 'dots', 'image'])
    })
    it('none renders nothing', () => {
      expect(mount(Hero, { props: { background: 'none' } }).find('[data-slot="hero-decoration"]').exists()).toBe(false)
    })
    it('backgrounds contain no gradient, glow or blur', () => {
      for (const background of ['grid', 'dots'] as const) expect(mount(Hero, { props: { background } }).html()).not.toMatch(/gradient|glow|blur|mask-image/)
    })
    it('background wins over the deprecated decoration alias; decoration still works alone', () => {
      expect(mount(Hero, { props: { background: 'dots', decoration: 'grid' } }).find('[data-slot="hero-decoration"]').attributes('data-pattern')).toBe('dots')
      expect(mount(Hero, { props: { decoration: 'grid' } }).find('[data-slot="hero-decoration"]').exists()).toBe(true)
      expect(heroDecorations).toBe(heroBackgrounds)
    })
    it('unknown background renders none', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(Hero, { props: { background: 'plasma' } }).find('[data-slot="hero-decoration"]').exists()).toBe(false)
    })
  })

  describe('slop and accessibility regressions', () => {
    it('eyebrow is plain sentence-case text, not an uppercase tracked pill', () => {
      const cls = mount(Hero, { props: { eyebrow: 'Docs' } }).find('[data-slot="hero-eyebrow"]').classes().join(' ')
      expect(cls).not.toMatch(/uppercase|tracking-wider|rounded-full|border/)
    })
    it('announcement keeps a link with a visible focus outline and no pill shape', () => {
      const a = mount(Hero, { props: { variant: 'announcement', announcement: 'News', announcementHref: '/changelog' } }).find('a')
      expect(a.classes()).toEqual(expect.arrayContaining(['rounded-md', 'focus-visible:outline-2', 'focus-visible:outline-solid', 'min-h-6']))
      expect(a.classes()).not.toContain('rounded-full')
    })
    it('no gradient, blur, glow, 2xl radius, arbitrary px or opacity-on-text in any variant', () => {
      for (const variant of heroVariantNames) {
        const html = mount(Hero, { props: { variant, title: 't', subtitle: 's', eyebrow: 'e', stats: [{ value: 1, label: 'l' }], logosLabel: 'l' }, slots: { logos: '<i/>', bento: '<i/>', form: '<i/>', media: '<i/>' } }).html()
        expect(html).not.toMatch(/gradient|backdrop-blur|blur-|rounded-(2xl|3xl)|\[\d+px\]|opacity-70|text-current\/|uppercase/)
      }
    })
    it('title and stats use semibold weight and tabular numbers, long words wrap', () => {
      const w = mount(Hero, { props: { variant: 'with-stats', title: 'x', stats: [{ value: 5, label: 'a' }] } })
      expect(w.find('h1').classes()).toEqual(expect.arrayContaining(['font-semibold', 'break-words']))
      expect(w.find('[data-slot="hero-stat-value"]').classes()).toContain('tabular-nums')
    })
    it('the cover image decodes asynchronously and stays decorative', () => {
      const img = mount(Hero, { props: { variant: 'full-bleed', image: '/a.jpg' } }).find('img')
      expect(img.attributes('decoding')).toBe('async')
      expect(img.attributes('alt')).toBe('')
    })
  })

  describe('customisation and edge cases', () => {
    it('class override wins on every variant', () => {
      for (const variant of heroVariantNames) {
        const w = mount(Hero, { props: { variant, class: 'py-2 custom' } })
        expect(w.classes()).toContain('custom')
        expect(w.classes()).toContain('py-2')
        expect(w.classes()).not.toContain('py-16')
      }
    })
    it('empty slots and no props never throw for any variant', () => {
      for (const variant of heroVariantNames) {
        const w = mount(Hero, { props: { variant } })
        expect(w.find('[data-slot="hero-inner"]').exists()).toBe(true)
        expect(w.find('[data-slot="hero-media"]').exists()).toBe(false)
      }
    })
    it('very long text and unicode in new regions', () => {
      const long = 'ж'.repeat(3000)
      const w = mount(Hero, {
        props: { variant: 'announcement', announcement: long, title: long, mediaTitle: long },
      })
      expect(w.find('[data-slot="hero-announcement"]').text()).toHaveLength(3000)
      const stats = mount(Hero, { props: { variant: 'with-stats', stats: [{ value: '🚀', label: long }] } })
      expect(stats.find('[data-slot="hero-stat-label"]').text()).toHaveLength(3000)
    })
    it('rapid variant switching keeps a consistent tree', async () => {
      const w = mount(Hero, { props: { variant: 'split', title: 'x' }, slots: media })
      for (const v of ['terminal', 'full-bleed', 'with-stats', 'centered', 'split-reverse', 'minimal'] as const) await w.setProps({ variant: v })
      expect(w.attributes('data-variant')).toBe('minimal')
      expect(w.findAll('[data-slot="hero-media"]')).toHaveLength(1)
    })
    it('level applies to the new compact title', () => {
      expect(mount(Hero, { props: { variant: 'minimal', title: 'x', level: 3 } }).find('h3').exists()).toBe(true)
    })
  })
})
