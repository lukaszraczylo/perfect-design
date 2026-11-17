import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CtaBand from './CtaBand.vue'
import { ctaBandActionsVariants, ctaBandHeadlineVariants, ctaBandInnerVariants, ctaBandSubtextVariants, ctaBandTextVariants, ctaBandToneNames, ctaBandVariantNames, ctaBandVariants } from './variants'

describe('CtaBand', () => {
  describe('good path', () => {
    it('renders headline, subtext and actions', () => {
      const w = mount(CtaBand, { props: { headline: 'Join us', subtext: 'Today' }, slots: { actions: '<button>Go</button>' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('data-slot')).toBe('cta-band')
      expect(w.find('h2[data-slot="cta-band-headline"]').text()).toBe('Join us')
      expect(w.find('[data-slot="cta-band-subtext"]').text()).toBe('Today')
      expect(w.find('[data-slot="cta-band-actions"] button').exists()).toBe(true)
    })
    it.each([
      ['primary', 'bg-primary'],
      ['muted', 'bg-muted'],
      ['inverted', 'bg-foreground'],
    ] as const)('tone %s', (tone, cls) => {
      expect(mount(CtaBand, { props: { tone } }).classes()).toContain(cls)
      expect(ctaBandVariants({ tone })).toContain(cls)
    })
    it('slots replace props', () => {
      const w = mount(CtaBand, { slots: { headline: '<b>H</b>', subtext: '<i>S</i>' } })
      expect(w.find('b').exists() && w.find('i').exists()).toBe(true)
    })
  })
  describe('customisation', () => {
    it('merges class last, attrs, as, level', () => {
      const w = mount(CtaBand, { props: { class: 'bg-red-500 custom', as: 'aside', level: 3, headline: 'x' }, attrs: { id: 'c' } })
      expect(w.classes()).toContain('bg-red-500')
      expect(w.classes()).not.toContain('bg-primary')
      expect(w.element.tagName).toBe('ASIDE')
      expect(w.attributes('id')).toBe('c')
      expect(w.find('h3').exists()).toBe(true)
    })
  })
  describe('bad path', () => {
    it('renders empty band without parts', () => {
      const w = mount(CtaBand)
      expect(w.find('[data-slot="cta-band-inner"]').element.children).toHaveLength(0)
      expect(w.find('[data-slot="cta-band-text"]').exists()).toBe(false)
    })
    it('unknown tone falls back to primary (was: no tone classes); invalid level -> h2', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(CtaBand, { props: { tone: 'neon', level: 7, headline: 'x' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.attributes('data-tone')).toBe('primary')
      expect(w.find('h2').exists()).toBe(true)
    })
  })
  describe('edge cases', () => {
    it('long unicode text', () => {
      const w = mount(CtaBand, { props: { headline: '界'.repeat(4000), subtext: '🎉' } })
      expect(w.find('h2').text()).toHaveLength(4000)
    })
  })
})

describe('CtaBand variants', () => {
  const full = { props: { headline: 'H', subtext: 'S' }, slots: { actions: '<button>go</button>' } }

  it.each(ctaBandVariantNames)('variant %s renders all parts and data attributes', (variant) => {
    const w = mount(CtaBand, { props: { ...full.props, variant }, slots: full.slots })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.attributes('data-tone')).toBe('primary')
    expect(w.find('[data-slot="cta-band-headline"]').text()).toBe('H')
    expect(w.find('[data-slot="cta-band-subtext"]').text()).toBe('S')
    expect(w.find('[data-slot="cta-band-actions"] button').exists()).toBe(true)
    expect(ctaBandInnerVariants({ variant })).toContain('mx-auto')
    expect(ctaBandHeadlineVariants({ variant })).toContain('font-')
    expect(ctaBandSubtextVariants({ variant })).toContain('text-')
    expect(ctaBandActionsVariants({ variant })).toContain('flex')
  })

  it('default variant is a rounded-lg card (rounded-2xl is banned by the slop rules)', () => {
    const w = mount(CtaBand)
    expect(w.attributes('data-variant')).toBe('card')
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'px-6', 'py-12', 'bg-primary']))
    expect(w.classes()).not.toContain('rounded-2xl')
  })
  it('band is full width, square and centred', () => {
    const w = mount(CtaBand, { props: { variant: 'band' } })
    expect(w.classes()).toContain('w-full')
    expect(w.classes()).not.toContain('rounded-lg')
    expect(w.find('[data-slot="cta-band-inner"]').classes()).toEqual(expect.arrayContaining(['flex-col', 'text-center']))
  })
  it('inline is a compact one-liner with actions on the right', () => {
    const w = mount(CtaBand, { props: { variant: 'inline', headline: 'H', subtext: 'S' }, slots: { actions: '<b>x</b>' } })
    expect(w.classes()).toContain('py-4')
    expect(w.find('[data-slot="cta-band-inner"]').classes()).toEqual(expect.arrayContaining(['sm:flex-row', 'sm:justify-between']))
    expect(w.find('[data-slot="cta-band-text"]').classes()).toEqual(expect.arrayContaining(['flex', 'flex-col']))
    expect(w.find('h2').classes()).toContain('text-lg')
    expect(w.find('[data-slot="cta-band-actions"]').classes()).toContain('sm:justify-end')
  })

  describe('split', () => {
    it('renders text left and media right', () => {
      const w = mount(CtaBand, { props: { variant: 'split', headline: 'H' }, slots: { media: '<img id="m" alt="">', actions: '<b />' } })
      expect(w.find('[data-slot="cta-band-inner"]').classes()).toContain('lg:grid-cols-2')
      expect(w.find('[data-slot="cta-band-inner"]').classes()).toContain('text-start')
      expect(w.find('[data-slot="cta-band-media"] #m').exists()).toBe(true)
      expect(w.find('[data-slot="cta-band-media"]').classes()).toContain('lg:col-start-2')
    })
    it('renders the form slot in the aside, with or without media', () => {
      const w = mount(CtaBand, { props: { variant: 'split' }, slots: { form: '<form id="f" />' } })
      expect(w.find('[data-slot="cta-band-media"] #f').exists()).toBe(true)
      const both = mount(CtaBand, { props: { variant: 'split' }, slots: { form: '<form id="f" />', media: '<i id="m" />' } })
      expect(both.find('[data-slot="cta-band-media"] #m').exists() && both.find('[data-slot="cta-band-media"] #f').exists()).toBe(true)
    })
    it('no media or form means no aside', () => {
      expect(mount(CtaBand, { props: { variant: 'split', headline: 'x' } }).find('[data-slot="cta-band-media"]').exists()).toBe(false)
    })
    it('media is ignored by other variants', () => {
      expect(mount(CtaBand, { props: { variant: 'card' }, slots: { media: '<i />' } }).find('[data-slot="cta-band-media"]').exists()).toBe(false)
    })
  })

  describe('newsletter', () => {
    it('renders the form between subtext and actions', () => {
      const w = mount(CtaBand, {
        props: { variant: 'newsletter', headline: 'H', subtext: 'S' },
        slots: { form: '<form id="f"><input aria-label="Email"></form>', actions: '<small>no spam</small>' },
      })
      const html = w.html()
      expect(w.find('[data-slot="cta-band-form"] #f').exists()).toBe(true)
      expect(html.indexOf('cta-band-subtext')).toBeLessThan(html.indexOf('cta-band-form'))
      expect(html.indexOf('cta-band-form')).toBeLessThan(html.indexOf('cta-band-actions'))
      expect(w.find('[data-slot="cta-band-inner"]').classes()).toContain('max-w-2xl')
    })
    it('missing form renders no form region; form is ignored by card/band/inline', () => {
      expect(mount(CtaBand, { props: { variant: 'newsletter' } }).find('[data-slot="cta-band-form"]').exists()).toBe(false)
      for (const variant of ['card', 'band', 'inline'] as const)
        expect(mount(CtaBand, { props: { variant }, slots: { form: '<i />' } }).find('[data-slot="cta-band-form"]').exists()).toBe(false)
    })
  })

  describe('tones', () => {
    it.each([
      ['primary', 'bg-primary'],
      ['muted', 'bg-muted'],
      ['inverted', 'bg-foreground'],
    ] as const)('tone %s works with every variant', (tone, cls) => {
      for (const variant of ctaBandVariantNames) {
        const w = mount(CtaBand, { props: { variant, tone } })
        expect(w.classes()).toContain(cls)
        expect(w.attributes('data-tone')).toBe(tone)
      }
    })
    it('the gradient tone was removed (slop rule): it falls back to the flat primary tone', () => {
      expect(ctaBandToneNames).toEqual(['primary', 'muted', 'inverted'])
      // @ts-expect-error removed value
      const w = mount(CtaBand, { props: { tone: 'gradient' } })
      expect(w.attributes('data-tone')).toBe('primary')
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-primary-foreground']))
      expect(w.html()).not.toMatch(/gradient|from-|to-primary/)
    })
    it('subtext is not faded with opacity so contrast is the token pair (color-contrast 4.48 regression)', () => {
      for (const variant of ctaBandVariantNames) {
        expect(ctaBandSubtextVariants({ variant })).not.toMatch(/opacity/)
        expect(mount(CtaBand, { props: { variant, subtext: 's' } }).find('[data-slot="cta-band-subtext"]').classes().join(' ')).not.toMatch(/opacity/)
      }
    })
  })

  describe('bad path and customisation', () => {
    it('unknown variant falls back to card', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(CtaBand, { props: { variant: 'hero', headline: 'x' } })
      expect(w.attributes('data-variant')).toBe('card')
      expect(w.classes()).toContain('rounded-lg')
    })
    it('every variant renders an empty inner with no content', () => {
      for (const variant of ctaBandVariantNames) {
        expect(mount(CtaBand, { props: { variant } }).find('[data-slot="cta-band-inner"]').element.children).toHaveLength(0)
      }
    })
    it('class merges last and overrides variant padding/rounding', () => {
      const w = mount(CtaBand, { props: { variant: 'band', class: 'py-4 rounded-none custom' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['py-4', 'rounded-none', 'custom']))
      expect(w.classes()).not.toContain('py-16')
    })
    it('level applies to inline and split headlines', () => {
      for (const variant of ['inline', 'split'] as const) expect(mount(CtaBand, { props: { variant, headline: 'x', level: 4 } }).find('h4').exists()).toBe(true)
    })
  })

  describe('slop regressions', () => {
    it('no variant uses rounded-2xl or larger, gradients, blur or arbitrary values', () => {
      for (const variant of ctaBandVariantNames) {
        const html = mount(CtaBand, { props: { variant, headline: 'h', subtext: 's' }, slots: { actions: '<b />' } }).html()
        expect(html).not.toMatch(/rounded-(2xl|3xl)|gradient|blur|\[|opacity-80/)
      }
    })
    it('headline is semibold and wraps long words; text wrapper is a column only for inline', () => {
      const w = mount(CtaBand, { props: { headline: 'h' } })
      expect(w.find('h2').classes()).toEqual(expect.arrayContaining(['font-semibold', 'break-words']))
      expect(ctaBandTextVariants({ variant: 'card' })).toBe('contents')
      expect(ctaBandTextVariants({ variant: 'inline' })).toContain('flex-col')
    })
    it('split and inline use text-start so RTL mirrors', () => {
      expect(ctaBandInnerVariants({ variant: 'split' })).toContain('text-start')
      expect(ctaBandInnerVariants({ variant: 'inline' })).toContain('text-start')
      expect(ctaBandInnerVariants({ variant: 'split' })).not.toContain('text-left')
    })
  })

  describe('edge cases', () => {
    it('very long unicode text in every variant', () => {
      const long = '字'.repeat(3000)
      for (const variant of ctaBandVariantNames) {
        const w = mount(CtaBand, { props: { variant, headline: long, subtext: long } })
        expect(w.find('h2').text()).toHaveLength(3000)
      }
    })
    it('rapid variant switching keeps one inner and updates classes', async () => {
      const w = mount(CtaBand, { props: { headline: 'x' }, slots: { actions: '<b />', form: '<i />', media: '<u />' } })
      for (const v of ['split', 'inline', 'newsletter', 'band', 'card'] as const) await w.setProps({ variant: v })
      expect(w.findAll('[data-slot="cta-band-inner"]')).toHaveLength(1)
      expect(w.attributes('data-variant')).toBe('card')
      expect(ctaBandVariants({ variant: 'inline' })).toContain('rounded-lg')
    })
  })
})

describe('CtaBand inverted examples', () => {
  it('pair the action with the background token, never an outline Button (grey on the light panel in dark mode)', async () => {
    const { default: doc } = await import('./CtaBand.docs')
    const inverted = (doc.examples ?? []).filter((e) => e.code.includes('tone="inverted"'))
    expect(inverted.length).toBeGreaterThan(0)
    for (const e of inverted) {
      expect(e.code).not.toContain('variant="outline"')
      expect(e.code).toContain('bg-background text-foreground')
    }
  })
})
