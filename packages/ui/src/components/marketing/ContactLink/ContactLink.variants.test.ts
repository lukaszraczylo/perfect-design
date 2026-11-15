import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import ContactLink from './ContactLink.vue'
import {
  CONTACT_LINK_SHAPES,
  CONTACT_LINK_SIZES,
  CONTACT_LINK_TONES,
  CONTACT_LINK_VARIANTS,
  contactLinkIconTileVariants,
  contactLinkInteractiveVariants,
  contactLinkVariants,
} from './variants'

const link = (props: Record<string, unknown> = {}) => mount(ContactLink, { props: { value: 'name@example.com', ...props } })
const tokens = (s: string) => s.split(' ').sort()
const BUTTONS = ['button', 'outline', 'ghost'] as const

describe('ContactLink variations', () => {
  describe('defaults keep the original output', () => {
    it('inline, button and card keep their original class sets', () => {
      expect(link().classes().sort()).toEqual(tokens('items-center font-medium inline-flex min-h-6 rounded-sm pointer-coarse:min-h-11 gap-2 text-sm text-primary hover:underline outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'))
      const button = link({ variant: 'button' }).classes()
      expect(button).toEqual(expect.arrayContaining(tokens('items-center font-medium inline-flex justify-center rounded-md pointer-coarse:min-h-11 gap-2 text-sm min-h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90')))
      const card = link({ variant: 'card' }).classes()
      expect(card).toEqual(expect.arrayContaining(tokens('items-center font-medium flex w-full rounded-lg border bg-card text-card-foreground gap-3 p-4 transition-colors hover:bg-accent hover:text-accent-foreground')))
      expect(contactLinkIconTileVariants()).toBe('flex shrink-0 items-center justify-center text-primary size-10')
    })
    it('a non-link span keeps its original classes', () => {
      expect(mount(ContactLink, { props: { label: 'No value' } }).classes().sort()).toEqual(tokens('items-center font-medium inline-flex min-h-6 rounded-sm pointer-coarse:min-h-11 gap-2 text-sm'))
    })
    it('reports the default dimensions as data attributes', () => {
      const w = link()
      expect([w.attributes('data-variant'), w.attributes('data-tone'), w.attributes('data-shape')]).toEqual(['inline', 'primary', 'rounded'])
    })
  })

  describe('variant: outline and ghost', () => {
    it('outline is a bordered button with a hover fill', () => {
      const w = link({ variant: 'outline' })
      expect(w.attributes('data-variant')).toBe('outline')
      expect(w.classes()).toEqual(expect.arrayContaining(['inline-flex', 'justify-center', 'rounded-md', 'min-h-9', 'px-4', 'border', 'bg-background', 'hover:bg-accent', 'hover:text-accent-foreground', 'border-primary', 'text-primary', 'pointer-coarse:min-h-11']))
      expect(w.classes()).not.toContain('bg-primary')
    })
    it('ghost has no border or fill at rest, a hover fill and a forced-colors border', () => {
      const w = link({ variant: 'ghost' })
      expect(w.attributes('data-variant')).toBe('ghost')
      expect(w.classes()).toEqual(expect.arrayContaining(['inline-flex', 'justify-center', 'rounded-md', 'min-h-9', 'px-4', 'text-primary', 'hover:bg-accent', 'hover:text-accent-foreground', 'forced-colors:border', 'pointer-coarse:min-h-11']))
      expect(w.classes()).not.toContain('border')
      expect(w.classes().some((c) => /^bg-/.test(c))).toBe(false)
    })
    it.each(BUTTONS)('%s scales its height and padding with size', (variant) => {
      for (const [size, cls] of [['sm', ['min-h-8', 'px-3']], ['md', ['min-h-9', 'px-4']], ['lg', ['min-h-11', 'px-6']]] as const) {
        expect(link({ variant, size }).classes()).toEqual(expect.arrayContaining([...cls]))
      }
    })
    it('a non-link outline or ghost span has no border or fill', () => {
      for (const variant of ['outline', 'ghost'] as const) {
        const w = mount(ContactLink, { props: { variant, label: 'Plain' } })
        expect(w.element.tagName).toBe('SPAN')
        expect(w.classes()).not.toContain('border')
        expect(w.classes()).not.toContain('hover:bg-accent')
      }
    })
    it('both keep the focus ring', () => {
      for (const variant of ['outline', 'ghost'] as const) expect(link({ variant }).classes().some((c) => c.startsWith('focus-visible:ring'))).toBe(true)
    })
  })

  describe('tone', () => {
    it.each([
      ['inline', 'primary', ['text-primary', 'hover:underline']],
      ['inline', 'neutral', ['text-foreground', 'underline', 'underline-offset-4']],
      ['inline', 'muted', ['text-muted-foreground', 'underline', 'underline-offset-4', 'hover:text-foreground']],
      ['button', 'primary', ['bg-primary', 'text-primary-foreground']],
      ['button', 'neutral', ['bg-foreground', 'text-background']],
      ['button', 'muted', ['bg-secondary', 'text-secondary-foreground']],
      ['outline', 'primary', ['border-primary', 'text-primary']],
      ['outline', 'neutral', ['border-input', 'text-foreground']],
      ['outline', 'muted', ['text-muted-foreground']],
      ['ghost', 'primary', ['text-primary']],
      ['ghost', 'neutral', ['text-foreground']],
      ['ghost', 'muted', ['text-muted-foreground']],
    ] as const)('%s %s uses %j', (variant, tone, cls) => {
      const w = link({ variant, tone })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
    })
    it('card tone colours the icon only', () => {
      expect(link({ variant: 'card', tone: 'neutral' }).find('[data-slot="contact-link-icon"]').classes()).toContain('text-foreground')
      expect(link({ variant: 'card', tone: 'muted' }).find('[data-slot="contact-link-icon"]').classes()).toContain('text-muted-foreground')
      expect(link({ variant: 'card', tone: 'primary' }).find('[data-slot="contact-link-icon"]').classes()).toContain('text-primary')
      const root = link({ variant: 'card', tone: 'muted' }).classes()
      expect(root).toContain('text-card-foreground')
      expect(root).not.toContain('text-muted-foreground')
    })
    it('never mixes two text colours or two fills in any variant and tone', () => {
      for (const variant of CONTACT_LINK_VARIANTS)
        for (const tone of CONTACT_LINK_TONES) {
          const c = link({ variant, tone }).classes()
          expect(c.filter((x) => /^bg-(primary|foreground|secondary|background|card)$/.test(x)).length, `${variant}/${tone}`).toBeLessThanOrEqual(1)
          expect(c.filter((x) => /^text-(primary|foreground|muted-foreground|primary-foreground|background|secondary-foreground|card-foreground)$/.test(x)).length, `${variant}/${tone}`).toBeLessThanOrEqual(1)
        }
    })
    it('a non-link span ignores the tone colours but reports the tone', () => {
      const w = mount(ContactLink, { props: { label: 'Plain', tone: 'muted' } })
      expect(w.attributes('data-tone')).toBe('muted')
      expect(w.classes()).not.toContain('text-muted-foreground')
    })
    it('unknown values fall back to primary', () => {
      const w = link({ tone: 'danger' })
      expect(w.attributes('data-tone')).toBe('primary')
      expect(w.classes()).toContain('text-primary')
      expect(contactLinkInteractiveVariants({ variant: 'button' })).toContain('bg-primary')
    })
  })

  describe('shape', () => {
    it.each([
      ['inline', 'rounded-sm'],
      ['button', 'rounded-md'],
      ['outline', 'rounded-md'],
      ['ghost', 'rounded-md'],
      ['card', 'rounded-lg'],
    ] as const)('%s rounded keeps %s', (variant, cls) => {
      const c = link({ variant, shape: 'rounded' }).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => /^rounded-/.test(x))).toHaveLength(1)
    })
    it('pill and square replace the radius in every variant', () => {
      for (const variant of CONTACT_LINK_VARIANTS) {
        const pill = link({ variant, shape: 'pill' })
        expect(pill.attributes('data-shape')).toBe('pill')
        expect(pill.classes().filter((x) => /^rounded-/.test(x))).toEqual(['rounded-full'])
        const square = link({ variant, shape: 'square' })
        expect(square.classes().filter((x) => /^rounded-/.test(x))).toEqual(['rounded-none'])
      }
    })
    it('the shape also applies to the non-link span', () => {
      expect(mount(ContactLink, { props: { variant: 'button', label: 'Plain', shape: 'pill' } }).classes()).toContain('rounded-full')
    })
    it('unknown values fall back to rounded', () => {
      const w = link({ variant: 'button', shape: 'oval' })
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(w.classes()).toContain('rounded-md')
    })
  })

  describe('combinations, overrides and a11y', () => {
    it('variant x size x tone x shape keeps the link, its href and its accessible text', () => {
      for (const variant of CONTACT_LINK_VARIANTS)
        for (const size of CONTACT_LINK_SIZES)
          for (const tone of CONTACT_LINK_TONES)
            for (const shape of CONTACT_LINK_SHAPES) {
              const w = link({ variant, size, tone, shape, label: 'Email us' })
              expect(w.element.tagName).toBe('A')
              expect(w.attributes('href')).toBe('mailto:name@example.com')
              expect(w.text()).toContain('Email us')
              expect(w.find('svg').attributes('aria-hidden')).toBe('true')
            }
    })
    it('a tel link keeps its dialable href in every new variant', () => {
      for (const variant of ['outline', 'ghost'] as const) expect(link({ variant, type: 'tel', value: '+1 (555) 0100' }).attributes('href')).toBe('tel:+15550100')
    })
    it('the class prop wins over variant, tone and shape classes', () => {
      const w = link({ variant: 'outline', tone: 'neutral', shape: 'pill', class: 'rounded-none text-red-500 custom' })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'text-red-500', 'custom']))
      expect(w.classes()).not.toContain('rounded-full')
      expect(w.classes()).not.toContain('text-foreground')
    })
    it('keeps the 24px minimum and the 44px coarse target in every variant', () => {
      for (const variant of ['inline', ...BUTTONS] as const) expect(link({ variant }).classes()).toContain('pointer-coarse:min-h-11')
      expect(link({ variant: 'card', shape: 'pill' }).classes()).toContain('p-4') // the card is padded, so it is taller than 44px with its two text lines
      expect(contactLinkVariants({ variant: 'ghost', size: 'sm' })).toContain('min-h-8')
    })
    it('hides the icon with noIcon in the new variants and keeps the text name', () => {
      for (const variant of ['outline', 'ghost'] as const) {
        const w = link({ variant, noIcon: true, label: 'Write to us' })
        expect(w.find('svg').exists()).toBe(false)
        expect(w.text()).toBe('Write to us')
      }
    })
    it('uses no shadow, gradient or lift in any variant', () => {
      for (const variant of CONTACT_LINK_VARIANTS) expect(link({ variant, tone: 'muted', shape: 'pill' }).html()).not.toMatch(/shadow|gradient|translate|scale-|rounded-(xl|2xl|3xl)/)
    })
  })

  describe('contract stays enforced', () => {
    const t = strictMount()
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => {
      t.reset()
      configureStrictMode('off')
    })
    it('a link without any text still throws with the new variant, tone and shape', async () => {
      await t.mount(() => el(ContactLink, { variant: 'ghost', tone: 'muted', shape: 'pill', noIcon: true }))
      expect(t.errors).toHaveLength(1)
      expect(t.errors[0].message).toContain('ContactLink: requires a `value`')
      t.reset()
      await t.mount(() => el(ContactLink, { variant: 'outline', value: 'name@example.com' }))
      expect(t.errors).toEqual([])
    })
  })
})
