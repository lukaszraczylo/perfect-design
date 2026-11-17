import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBolt } from '@fortawesome/free-solid-svg-icons'
import FeatureCard from './FeatureCard.vue'
import {
  FEATURE_CARD_VARIANTS,
  featureCardBodyVariants,
  featureCardIconVariants,
  featureCardVariants,
  resolveFeatureCardAlign,
  resolveFeatureCardVariant,
} from './variants'

describe('FeatureCard', () => {
  describe('good path', () => {
    it('renders icon, title, description', () => {
      const w = mount(FeatureCard, { props: { icon: faBolt, title: 'Fast', description: 'Very fast' } })
      expect(w.attributes('data-slot')).toBe('feature-card')
      expect(w.find('[data-slot="feature-card-icon"] svg').exists()).toBe(true)
      expect(w.find('h3[data-slot="feature-card-title"]').text()).toBe('Fast')
      expect(w.find('[data-slot="feature-card-description"]').text()).toBe('Very fast')
    })
    it('renders a link whose default label names its target (no generic invitation)', () => {
      const w = mount(FeatureCard, { props: { title: 'Tokens', href: '/docs' } })
      const a = w.find('a[data-slot="feature-card-link"]')
      expect(a.attributes('href')).toBe('/docs')
      expect(a.text()).toBe('Read about Tokens')
      expect(a.attributes('target')).toBeUndefined()
      expect(a.find('svg').exists()).toBe(false)
      expect(mount(FeatureCard, { props: { href: '/docs' } }).find('a').text()).toBe('Read more')
    })
    it('external link is safe', () => {
      const w = mount(FeatureCard, { props: { href: 'https://x.dev', external: true, linkLabel: 'Visit' } })
      const a = w.find('a')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
      expect(a.text()).toBe('Visit (opens in a new tab)')
      expect(a.find('svg').exists()).toBe(true)
      expect(a.find('.sr-only').text()).toBe('(opens in a new tab)')
    })
    it('uses slots', () => {
      const w = mount(FeatureCard, { slots: { icon: '<i id="i"/>', title: '<b>T</b>', default: '<u>D</u>' } })
      expect(w.find('#i').exists() && w.find('b').exists() && w.find('u').exists()).toBe(true)
    })
    it('supports heading level', () => {
      expect(mount(FeatureCard, { props: { title: 'x', level: 2 } }).find('h2').exists()).toBe(true)
    })
  })
  describe('customisation', () => {
    it('merges class and passes attrs', () => {
      const w = mount(FeatureCard, { props: { class: 'p-2 custom' }, attrs: { 'data-test': 'k', role: 'listitem' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('p-2')
      expect(w.classes()).not.toContain('p-6')
      expect(w.attributes('data-test')).toBe('k')
      expect(w.attributes('role')).toBe('listitem')
    })
  })
  describe('bad path', () => {
    it('renders an empty card without optional parts', () => {
      const w = mount(FeatureCard)
      expect(w.element.children).toHaveLength(0)
    })
    it('invalid level falls back to h3', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(FeatureCard, { props: { title: 'x', level: 0 } }).find('h3').exists()).toBe(true)
    })
    it('icon slot without icon prop still renders', () => {
      expect(mount(FeatureCard, { slots: { icon: 'x' } }).find('[data-slot="feature-card-icon"]').exists()).toBe(true)
    })
  })
  describe('edge cases', () => {
    it('long and unicode strings', () => {
      const w = mount(FeatureCard, { props: { title: 'ß'.repeat(2000), description: '日本語 🎉 مرحبا' } })
      expect(w.find('h3').text()).toHaveLength(2000)
      expect(w.text()).toContain('🎉')
    })
  })

  describe('variants', () => {
    const base = { icon: faBolt, title: 'T', description: 'D', href: '/x' }
    it('defaults to the card look', () => {
      const w = mount(FeatureCard, { props: base })
      expect(w.attributes('data-variant')).toBe('card')
      expect(w.attributes('data-align')).toBe('left')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'p-6', 'flex-col']))
    })
    it('default card has no tinted icon tile and no shadow or hover effect (slop rules)', () => {
      const w = mount(FeatureCard, { props: base })
      const icon = w.find('[data-slot="feature-card-icon"]')
      expect(icon.classes()).toContain('text-primary')
      expect(icon.classes().join(' ')).not.toMatch(/bg-|rounded|ring|shadow|size-1/)
      expect(w.classes().join(' ')).not.toMatch(/shadow|hover:|transition|group/)
    })
    const expectations: Record<string, string[]> = {
      card: ['bg-card', 'border'],
      bordered: ['border-2', 'bg-transparent'],
      flat: ['bg-muted'],
      'icon-left': ['flex-row', 'items-start'],
      'icon-top': ['flex-col', 'bg-card'],
      'icon-badge': ['flex-col', 'p-2'],
      minimal: ['flex-col', 'gap-2'],
      highlight: ['border-primary', 'border-2'],
    }
    it.each(FEATURE_CARD_VARIANTS)('variant %s renders and keeps all parts', (variant) => {
      const w = mount(FeatureCard, { props: { ...base, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toEqual(expect.arrayContaining(expectations[variant]))
      expect(featureCardVariants({ variant })).toContain(expectations[variant][0])
      expect(w.find('[data-slot="feature-card-icon"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="feature-card-body"] h3').text()).toBe('T')
      expect(w.find('[data-slot="feature-card-description"]').text()).toBe('D')
      expect(w.find('a[data-slot="feature-card-link"]').exists()).toBe(true)
    })
    it('only the opt-in icon-badge variant draws a tinted tile', () => {
      const cls = (variant: string) => mount(FeatureCard, { props: { ...base, variant: variant as 'card' } }).find('[data-slot="feature-card-icon"]').classes()
      expect(cls('icon-badge')).toEqual(expect.arrayContaining(['size-12', 'rounded-md', 'bg-primary/10']))
      expect(cls('icon-badge')).not.toContain('ring-1')
      for (const v of FEATURE_CARD_VARIANTS.filter((x) => x !== 'icon-badge')) {
        expect(cls(v).join(' ')).not.toMatch(/bg-|rounded|ring/)
        expect(featureCardIconVariants({ variant: v })).not.toMatch(/bg-|rounded/)
      }
    })
    it('uses larger glyphs for icon-top, icon-badge and minimal', () => {
      const size = (variant: 'card' | 'minimal') => mount(FeatureCard, { props: { icon: faBolt, variant } }).find('svg').classes()
      expect(size('card')).toContain('size-5')
      expect(size('minimal')).toContain('size-6')
    })
    it('align center centres content; icon-left keeps text left', () => {
      const c = mount(FeatureCard, { props: { ...base, align: 'center' } })
      expect(c.attributes('data-align')).toBe('center')
      expect(c.classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
      expect(c.find('[data-slot="feature-card-body"]').classes()).toContain('items-center')
      const l = mount(FeatureCard, { props: { ...base, variant: 'icon-left', align: 'center' } })
      expect(l.classes()).toContain('text-start')
      expect(l.classes()).not.toContain('text-center')
      expect(l.find('[data-slot="feature-card-body"]').classes()).toContain('items-start')
      expect(featureCardBodyVariants({ align: 'left' })).not.toContain('items-center')
    })
    it('variant classes are overridable via class', () => {
      const w = mount(FeatureCard, { props: { variant: 'flat', class: 'bg-secondary rounded-none' }, slots: { default: 'x' } })
      expect(w.classes()).toContain('bg-secondary')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('bg-muted')
      expect(w.classes()).not.toContain('rounded-lg')
    })
    it('keeps the link at the bottom of a stretched card (body grows)', () => {
      const w = mount(FeatureCard, { props: base })
      expect(w.find('[data-slot="feature-card-body"]').classes()).toContain('flex-1')
      expect(w.find('a').classes()).toContain('mt-auto')
    })
    it('the link meets target size (24px, 44px on coarse pointers), has a focus ring and no hover translate', () => {
      const a = mount(FeatureCard, { props: base }).find('a')
      expect(a.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
      expect(a.classes().join(' ')).toContain('focus-visible:ring-3')
      expect(a.html()).not.toMatch(/translate/)
    })
    it('no variant uses rounded-xl or larger, shadows, gradients or arbitrary values', () => {
      for (const variant of FEATURE_CARD_VARIANTS) {
        const html = mount(FeatureCard, { props: { ...base, variant } }).html()
        expect(html).not.toMatch(/rounded-(xl|2xl|3xl)|shadow|gradient|\[|ring-1/)
      }
    })
  })
  describe('variants: bad path', () => {
    it('unknown variant and align fall back without crashing', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FeatureCard, { props: { title: 'x', variant: 'neon', align: 'justify' } })
      expect(w.attributes('data-variant')).toBe('card')
      expect(w.attributes('data-align')).toBe('left')
      expect(w.classes()).toContain('bg-card')
    })
    it('resolvers fall back on junk', () => {
      for (const v of [undefined, null, 5, {}, 'CARD']) expect(resolveFeatureCardVariant(v)).toBe('card')
      for (const v of [undefined, null, 'right', 1]) expect(resolveFeatureCardAlign(v)).toBe('left')
      expect(resolveFeatureCardVariant('minimal')).toBe('minimal')
      expect(resolveFeatureCardAlign('center')).toBe('center')
    })
    it('every variant renders an empty card with no children', () => {
      for (const variant of FEATURE_CARD_VARIANTS) expect(mount(FeatureCard, { props: { variant } }).element.children).toHaveLength(0)
    })
    it('missing icon prop renders no icon tile in any variant', () => {
      for (const variant of FEATURE_CARD_VARIANTS) expect(mount(FeatureCard, { props: { variant, title: 'x' } }).find('[data-slot="feature-card-icon"]').exists()).toBe(false)
    })
  })
  describe('variants: edge cases', () => {
    it('very long unbroken text and unicode in every variant', () => {
      for (const variant of FEATURE_CARD_VARIANTS) {
        const w = mount(FeatureCard, { props: { variant, title: 'W'.repeat(5000), description: 'مرحبا 日本語 🎉' } })
        expect(w.find('h3').text()).toHaveLength(5000)
        expect(w.text()).toContain('🎉')
        expect(w.find('[data-slot="feature-card-body"]').classes()).toContain('min-w-0')
      }
    })
    it('reactively switching variant updates classes', async () => {
      const w = mount(FeatureCard, { props: { title: 'x', variant: 'card' } })
      await w.setProps({ variant: 'highlight' })
      expect(w.classes()).toContain('border-primary')
      await w.setProps({ variant: 'nope' as never })
      expect(w.classes()).toContain('bg-card')
    })
    it('unmounts cleanly', () => {
      const w = mount(FeatureCard, { props: { title: 'x', variant: 'icon-left' } })
      expect(() => w.unmount()).not.toThrow()
    })
  })
})

describe('FeatureCard icon alignment', () => {
  it.each(['card', 'bordered', 'flat', 'icon-top', 'icon-badge', 'minimal', 'highlight'] as const)('%s: left-aligned icon starts with the text instead of centring over it', (variant) => {
    const w = mount(FeatureCard, { props: { title: 'T', icon: faBolt, variant } })
    expect(w.find('[data-slot="feature-card-icon"]').classes()).toContain('self-start')
  })
  it('center alignment leaves the icon centred', () => {
    const w = mount(FeatureCard, { props: { title: 'T', icon: faBolt, variant: 'icon-top', align: 'center' } })
    expect(w.find('[data-slot="feature-card-icon"]').classes()).not.toContain('self-start')
  })
})
