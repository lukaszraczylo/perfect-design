import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBolt } from '@fortawesome/free-solid-svg-icons'
import FeatureCard from './FeatureCard.vue'
import {
  featureCardDescriptionVariants,
  featureCardIconVariants,
  featureCardLinkVariants,
  featureCardTitleVariants,
  featureCardVariants,
  resolveFeatureCardShape,
  resolveFeatureCardSize,
  resolveFeatureCardTone,
} from './variants'

const base = { icon: faBolt, title: 'Title', description: 'Description', href: '/docs', linkLabel: 'Open the docs' }
const mountCard = (props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => mount(FeatureCard, { props: { ...base, ...props }, ...extra })

describe('FeatureCard size, tone and shape', () => {
  describe('defaults keep the original output', () => {
    it('card root, title, description and link class strings are unchanged', () => {
      const w = mountCard()
      expect(w.classes().join(' ')).toBe('relative flex text-card-foreground flex-col gap-3 rounded-lg border bg-card p-6')
      expect(w.find('h3').attributes('class')).toBe('text-lg font-semibold tracking-tight')
      expect(w.find('[data-slot="feature-card-description"]').attributes('class')).toBe('text-sm text-muted-foreground')
      expect(w.find('a').classes()).toEqual(expect.arrayContaining(['mt-auto', 'text-primary', 'text-sm', 'font-medium', 'hover:underline']))
      expect(w.find('a').classes()).not.toContain('text-primary-foreground')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.attributes('data-shape')).toBe('rounded')
    })
    it('exported cva with no props equals the component default', () => {
      expect(featureCardVariants()).toBe('relative flex text-card-foreground flex-col gap-3 rounded-lg border bg-card p-6')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'p-4', 'text-base'],
      ['md', 'p-6', 'text-lg'],
      ['lg', 'p-8', 'text-xl'],
    ] as const)('%s sets padding %s and title %s', (size, padding, title) => {
      const w = mountCard({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toContain(padding)
      expect(w.classes().filter((c) => /^p-\d/.test(c))).toEqual([padding])
      expect(w.find('h3').classes()).toContain(title)
    })
    it('lg raises the description to 16px; sm and md stay 14px', () => {
      expect(mountCard({ size: 'lg' }).find('[data-slot="feature-card-description"]').classes()).toContain('text-base')
      expect(mountCard({ size: 'sm' }).find('[data-slot="feature-card-description"]').classes()).toContain('text-sm')
    })
    it('scales every boxed variant and leaves icon-badge padding alone', () => {
      for (const variant of ['bordered', 'flat', 'icon-left', 'icon-top', 'highlight'] as const) {
        expect(mountCard({ variant, size: 'sm' }).classes()).toContain('p-4')
        expect(mountCard({ variant, size: 'lg' }).classes()).toContain('p-8')
      }
      expect(mountCard({ variant: 'icon-badge', size: 'lg' }).classes()).toContain('p-2')
      expect(mountCard({ variant: 'minimal', size: 'lg' }).classes().join(' ')).not.toMatch(/\bp-\d/)
    })
    it('unknown size falls back to md', () => {
      const w = mountCard({ size: 'huge' })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('p-6')
      expect(resolveFeatureCardSize(undefined)).toBe('md')
    })
  })

  describe('tone', () => {
    it.each([
      ['muted', 'bg-muted', 'text-foreground', 'text-muted-foreground'],
      ['primary', 'bg-primary', 'text-primary-foreground', 'text-primary-foreground'],
      ['inverted', 'bg-foreground', 'text-background', 'text-background'],
    ] as const)('%s paints %s with %s text and a matching description', (tone, surface, text, description) => {
      const w = mountCard({ tone })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(w.classes()).toEqual(expect.arrayContaining([surface, text]))
      expect(w.classes()).not.toContain('bg-card')
      expect(w.find('[data-slot="feature-card-description"]').classes()).toContain(description)
    })
    it('filled tones recolour the icon and the link, and keep the link underlined (not colour alone)', () => {
      for (const [tone, text] of [['primary', 'text-primary-foreground'], ['inverted', 'text-background']] as const) {
        const w = mountCard({ tone })
        expect(w.find('[data-slot="feature-card-icon"]').classes()).toContain(text)
        expect(w.find('[data-slot="feature-card-icon"]').classes()).not.toContain('text-primary')
        expect(w.find('a').classes()).toEqual(expect.arrayContaining([text, 'underline']))
        expect(w.find('a').classes()).not.toContain('text-primary')
      }
    })
    it('muted keeps the accent icon and link (muted surface is covered by the contrast test)', () => {
      const w = mountCard({ tone: 'muted' })
      expect(w.find('[data-slot="feature-card-icon"]').classes()).toContain('text-primary')
      expect(w.find('a').classes()).toContain('text-primary')
    })
    it('unboxed variants gain padding and radius only when a tone is set', () => {
      for (const variant of ['minimal', 'icon-badge'] as const) {
        expect(mountCard({ variant }).classes()).not.toContain('rounded-lg')
        const toned = mountCard({ variant, tone: 'muted' })
        expect(toned.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'p-6', 'bg-muted']))
      }
      expect(mountCard({ variant: 'minimal', tone: 'muted', size: 'sm' }).classes()).toContain('p-4')
      expect(mountCard({ variant: 'minimal', tone: 'muted', size: 'lg' }).classes()).toContain('p-8')
    })
    it('the icon-badge tile drops its tint on filled surfaces', () => {
      const icon = mountCard({ variant: 'icon-badge', tone: 'primary' }).find('[data-slot="feature-card-icon"]')
      expect(icon.classes()).toContain('bg-transparent')
      expect(icon.classes()).not.toContain('bg-primary/10')
    })
    it('replaces the variant surface for bordered, flat and highlight', () => {
      expect(mountCard({ variant: 'bordered', tone: 'primary' }).classes()).toEqual(expect.arrayContaining(['bg-primary']))
      expect(mountCard({ variant: 'bordered', tone: 'primary' }).classes()).not.toContain('bg-transparent')
      expect(mountCard({ variant: 'flat', tone: 'inverted' }).classes()).not.toContain('bg-muted')
      expect(mountCard({ variant: 'highlight', tone: 'muted' }).classes()).toContain('border-primary')
    })
    it('unknown tone falls back to default', () => {
      const w = mountCard({ tone: 'neon' })
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.classes()).toContain('bg-card')
      expect(resolveFeatureCardTone(null)).toBe('default')
    })
  })

  describe('shape', () => {
    it('square removes the radius of the card and of the icon-badge tile', () => {
      const w = mountCard({ shape: 'square' })
      expect(w.attributes('data-shape')).toBe('square')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
      const badge = mountCard({ variant: 'icon-badge', shape: 'square' })
      expect(badge.find('[data-slot="feature-card-icon"]').classes()).toEqual(expect.arrayContaining(['rounded-none', 'bg-primary/10']))
      expect(badge.find('[data-slot="feature-card-icon"]').classes()).not.toContain('rounded-md')
    })
    it('square wins over the radius a tone adds to an unboxed variant', () => {
      const w = mountCard({ variant: 'minimal', tone: 'muted', shape: 'square' })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })
    it('unknown shape falls back to rounded', () => {
      expect(mountCard({ shape: 'blob' }).classes()).toContain('rounded-lg')
      expect(resolveFeatureCardShape('x')).toBe('rounded')
    })
  })

  describe('combinations and class override', () => {
    it('tone, size and shape together do not conflict', () => {
      const w = mountCard({ tone: 'inverted', size: 'lg', shape: 'square', variant: 'flat', align: 'center' })
      const classes = w.classes()
      expect(classes).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'p-8', 'rounded-none', 'items-center', 'text-center']))
      expect(classes.filter((c) => /^bg-/.test(c))).toEqual(['bg-foreground'])
      expect(classes.filter((c) => /^rounded/.test(c))).toEqual(['rounded-none'])
    })
    it('the class prop wins over size, tone and shape classes', () => {
      const w = mountCard({ size: 'lg', tone: 'primary', shape: 'square', class: 'p-2 bg-card rounded-md' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-2', 'bg-card', 'rounded-md']))
      expect(w.classes()).not.toContain('p-8')
      expect(w.classes()).not.toContain('bg-primary')
      expect(w.classes()).not.toContain('rounded-none')
    })
    it('the exported cva helpers resolve conflicts on plain elements', () => {
      const cls = featureCardVariants({ tone: 'primary', size: 'sm', shape: 'square', class: 'extra' })
      expect(cls.split(' ').filter((c) => /^bg-/.test(c))).toEqual(['bg-primary'])
      expect(cls).toEqual(expect.stringContaining('extra'))
      expect(featureCardIconVariants({ tone: 'inverted' })).not.toContain('text-primary ')
      expect(featureCardTitleVariants({ size: 'lg' })).toContain('text-xl')
      expect(featureCardDescriptionVariants({ tone: 'primary' })).toContain('text-primary-foreground')
      expect(featureCardLinkVariants({ tone: 'inverted' })).toContain('underline')
      expect(featureCardLinkVariants()).toBe('')
    })
  })

  describe('contracts and accessibility in every variation', () => {
    it.each([
      ['sm', 'muted', 'rounded'],
      ['md', 'primary', 'square'],
      ['lg', 'inverted', 'square'],
    ] as const)('size %s, tone %s, shape %s keeps heading, link name and decorative icon', (size, tone, shape) => {
      const w = mountCard({ size, tone, shape, external: true })
      expect(w.find('h3').text()).toBe('Title')
      expect(w.find('a').attributes('href')).toBe('/docs')
      expect(w.find('a').text()).toContain('Open the docs')
      expect(w.find('a .sr-only').text()).toBe('(opens in a new tab)')
      expect(w.find('a').classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11', 'focus-visible:ring-3']))
      expect(w.find('[data-slot="feature-card-icon"] svg').attributes('aria-hidden')).toBe('true')
    })
    it('long unbroken text and empty slots do not break any tone', () => {
      const long = 'x'.repeat(500)
      const w = mountCard({ tone: 'primary', size: 'sm', title: long, description: long })
      expect(w.find('h3').text()).toHaveLength(500)
      expect(w.find('[data-slot="feature-card-body"]').classes()).toContain('min-w-0')
      const empty = mount(FeatureCard, { props: { tone: 'muted', size: 'lg' } })
      expect(empty.element.children).toHaveLength(0)
    })
  })
})
