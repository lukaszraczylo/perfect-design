import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Testimonial from './Testimonial.vue'
import {
  TESTIMONIAL_VARIANTS,
  resolveTestimonialShape,
  resolveTestimonialSize,
  resolveTestimonialTone,
  testimonialAvatarVariants,
  testimonialQuoteVariants,
  testimonialRoleVariants,
  testimonialStarFillVariants,
  testimonialStarVariants,
  testimonialVariants,
} from './variants'

const base = { quote: 'Sample quote.', author: 'Customer name', role: 'Role', rating: 4 }
const m = (props: Record<string, unknown> = {}) => mount(Testimonial, { props: { ...base, ...props } })

describe('Testimonial size, tone and shape', () => {
  describe('defaults keep the original output', () => {
    it('card default class strings and data attributes', () => {
      const w = m()
      expect(w.classes().join(' ')).toBe('flex flex-col gap-6 rounded-lg border bg-card p-6 text-card-foreground')
      expect(w.find('blockquote').attributes('class')).toBe('text-pretty text-lg leading-relaxed')
      expect(w.find('[data-slot="testimonial-role"]').attributes('class')).toBe('truncate text-sm text-muted-foreground')
      expect(w.find('[data-slot="testimonial-star"]').attributes('class')).toBe('relative inline-block size-4 text-muted-foreground/40')
      expect(w.find('[data-slot="testimonial-star"] > span').attributes('class')).toBe('absolute inset-y-0 start-0 overflow-hidden text-foreground w-full')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.attributes('data-shape')).toBe('rounded')
    })
    it.each(TESTIMONIAL_VARIANTS)('%s: the exported cva with no size, tone or shape equals the md/default output', (variant) => {
      expect(testimonialVariants({ variant })).toBe(testimonialVariants({ variant, size: 'md', tone: 'default', shape: 'rounded' }))
      expect(testimonialQuoteVariants({ variant })).toBe(testimonialQuoteVariants({ variant, size: 'md' }))
    })
  })

  describe('size', () => {
    it.each([
      ['card', 'sm', 'p-4', 'text-base'],
      ['card', 'lg', 'p-8', 'text-xl'],
      ['with-rating', 'sm', 'p-4', 'text-base'],
      ['avatar-left', 'lg', 'p-8', 'text-xl'],
      ['featured', 'sm', 'p-6', 'text-lg'],
      ['featured', 'lg', 'p-10', 'text-2xl'],
    ] as const)('%s size %s sets padding %s and quote %s', (variant, size, padding, text) => {
      const w = m({ variant, size, avatar: 'data:,' })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes().filter((c) => /^p-\d/.test(c))).toEqual([padding])
      expect(w.find('blockquote').classes()).toContain(text)
    })
    it('quote and inline scale their text without gaining padding', () => {
      expect(m({ variant: 'quote', size: 'lg' }).find('blockquote').classes()).toEqual(expect.arrayContaining(['text-3xl', 'sm:text-4xl']))
      expect(m({ variant: 'quote', size: 'sm' }).find('blockquote').classes()).toEqual(expect.arrayContaining(['text-xl', 'sm:text-2xl']))
      expect(m({ variant: 'inline', size: 'sm' }).find('blockquote').classes()).toContain('text-sm')
      expect(m({ variant: 'inline', size: 'lg' }).find('blockquote').classes()).toContain('text-lg')
      expect(m({ variant: 'inline', size: 'lg' }).classes().join(' ')).not.toMatch(/\bp-\d/)
    })
    it('md equals the original text size of every variant', () => {
      expect(m({ variant: 'quote' }).find('blockquote').classes()).toEqual(expect.arrayContaining(['text-2xl', 'sm:text-3xl']))
      expect(m({ variant: 'featured' }).find('blockquote').classes()).toEqual(expect.arrayContaining(['text-xl', 'sm:text-2xl']))
    })
    it('unknown size falls back to md', () => {
      const w = m({ size: 'giant' })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('p-6')
      expect(resolveTestimonialSize(7)).toBe('md')
    })
  })

  describe('tone', () => {
    it.each([
      ['muted', 'bg-muted', 'text-foreground', 'text-muted-foreground'],
      ['primary', 'bg-primary', 'text-primary-foreground', 'text-primary-foreground'],
      ['inverted', 'bg-foreground', 'text-background', 'text-background'],
    ] as const)('%s paints %s and recolours the role line to %s', (tone, surface, text, role) => {
      const w = m({ tone })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(w.classes()).toEqual(expect.arrayContaining([surface, text]))
      expect(w.classes()).not.toContain('bg-card')
      expect(w.classes()).not.toContain('text-card-foreground')
      expect(w.find('[data-slot="testimonial-role"]').classes()).toContain(role)
    })
    it('filled tones draw stars in the surface text colour; the rating keeps its text name', () => {
      for (const tone of ['primary', 'inverted'] as const) {
        const w = m({ tone, rating: 3.5 })
        const stars = w.findAll('[data-slot="testimonial-star"]')
        expect(stars[0].classes()).toContain('text-current/40')
        expect(stars[0].classes()).not.toContain('text-muted-foreground/40')
        expect(w.find('[data-slot="testimonial-star"] > span').classes()).toContain('text-current')
        expect(w.find('[data-slot="testimonial-star"] > span').classes()).not.toContain('text-foreground')
        expect(w.find('[data-slot="testimonial-rating"]').attributes('aria-label')).toBe('3.5 out of 5')
      }
      expect(m({ tone: 'muted' }).find('[data-slot="testimonial-star"] > span').classes()).toContain('text-foreground')
    })
    it('the initials avatar uses a token pair covered by the contrast test on every tone', () => {
      expect(m({ tone: 'default' }).find('[data-slot="testimonial-avatar"]').classes()).toEqual(expect.arrayContaining(['bg-primary/10', 'text-primary']))
      for (const [tone, text] of [['muted', 'text-primary'], ['primary', 'text-primary'], ['inverted', 'text-foreground']] as const) {
        const avatar = m({ tone }).find('[data-slot="testimonial-avatar"]')
        expect(avatar.classes()).toEqual(expect.arrayContaining(['bg-background', text]))
        expect(avatar.classes()).not.toContain('bg-primary/10')
        expect(avatar.attributes('aria-hidden')).toBe('true')
      }
    })
    it('quote and inline gain a padded rounded box only when a tone is set', () => {
      expect(m({ variant: 'quote' }).classes()).not.toContain('rounded-lg')
      const quote = m({ variant: 'quote', tone: 'muted' })
      expect(quote.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'px-6', 'py-8', 'bg-muted']))
      expect(quote.classes()).not.toContain('px-4')
      const inline = m({ variant: 'inline', tone: 'inverted' })
      expect(inline.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border-s-0', 'px-4', 'py-3', 'bg-foreground']))
      expect(inline.classes()).not.toContain('border-s-2')
      expect(inline.classes()).not.toContain('ps-4')
      expect(m({ variant: 'inline' }).classes()).toEqual(expect.arrayContaining(['border-s-2', 'ps-4']))
    })
    it('featured keeps its primary border on a tone', () => {
      const w = m({ variant: 'featured', tone: 'muted' })
      expect(w.classes()).toEqual(expect.arrayContaining(['border-primary', 'bg-muted']))
    })
    it('unknown tone falls back to default', () => {
      const w = m({ tone: 'neon' })
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.classes()).toContain('bg-card')
      expect(resolveTestimonialTone(undefined)).toBe('default')
    })
  })

  describe('shape', () => {
    it('square removes the radius of the card and the avatar', () => {
      const w = m({ shape: 'square' })
      expect(w.attributes('data-shape')).toBe('square')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
      const avatar = w.find('[data-slot="testimonial-avatar"]')
      expect(avatar.classes()).toContain('rounded-none')
      expect(avatar.classes()).not.toContain('rounded-full')
    })
    it('square also applies to an image avatar and wins over the tone radius', () => {
      const w = m({ shape: 'square', avatar: 'data:,', variant: 'quote', tone: 'primary' })
      expect(w.find('img').classes()).toContain('rounded-none')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })
    it('rounded keeps the circular avatar; unknown falls back', () => {
      expect(m().find('[data-slot="testimonial-avatar"]').classes()).toContain('rounded-full')
      expect(m({ shape: 'blob' }).attributes('data-shape')).toBe('rounded')
      expect(resolveTestimonialShape(null)).toBe('rounded')
    })
  })

  describe('combinations, overrides and accessibility', () => {
    it('size, tone, shape and variant together do not conflict', () => {
      const w = m({ variant: 'featured', size: 'lg', tone: 'inverted', shape: 'square' })
      const classes = w.classes()
      expect(classes.filter((c) => /^bg-/.test(c))).toEqual(['bg-foreground'])
      expect(classes.filter((c) => /^p-\d/.test(c))).toEqual(['p-10'])
      expect(classes.filter((c) => /^rounded/.test(c))).toEqual(['rounded-none'])
    })
    it('the class prop wins over size, tone and shape', () => {
      const w = m({ size: 'lg', tone: 'primary', shape: 'square', class: 'p-1 bg-card rounded-md' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-1', 'bg-card', 'rounded-md']))
      expect(w.classes()).not.toContain('p-8')
      expect(w.classes()).not.toContain('bg-primary')
    })
    it('the exported cva helpers are conflict-free on plain elements', () => {
      const cls = testimonialVariants({ tone: 'primary', size: 'sm', shape: 'square', class: 'x' })
      expect(cls.split(' ').filter((c) => /^bg-/.test(c))).toEqual(['bg-primary'])
      expect(testimonialAvatarVariants({ tone: 'primary', shape: 'square' })).toContain('rounded-none')
      expect(testimonialRoleVariants({ tone: 'inverted' })).toContain('text-background')
      expect(testimonialStarVariants({ tone: 'primary' })).toContain('text-current/40')
      expect(testimonialStarFillVariants({ tone: 'inverted' })).toContain('text-current')
    })
    it.each(['sm', 'lg'] as const)('semantic markup and the author name survive size %s on a filled tone', (size) => {
      const w = m({ size, tone: 'primary', shape: 'square' })
      expect(w.element.tagName).toBe('FIGURE')
      expect(w.find('blockquote').text()).toBe('“Sample quote.”')
      expect(w.find('figcaption [data-slot="testimonial-name"]').text()).toBe('Customer name')
      expect(w.find('[data-slot="testimonial-role"]').classes()).toContain('truncate')
    })
    it('tone works with slots, no quote and long text', () => {
      const long = 'x'.repeat(2000)
      const w = mount(Testimonial, { props: { author: 'A B', tone: 'inverted', size: 'sm' }, slots: { default: long } })
      expect(w.find('blockquote').text()).toHaveLength(2000)
      expect(mount(Testimonial, { props: { tone: 'muted' } }).find('blockquote').exists()).toBe(false)
    })
  })
})
