import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import BlogCard from './BlogCard.vue'
import {
  BLOG_APPEARANCES,
  BLOG_SHAPES,
  BLOG_SIZES,
  blogCardBodyVariants,
  blogCardExcerptVariants,
  blogCardMetaVariants,
  blogCardTitleVariants,
  blogCardVariants,
} from './variants'

const post = { title: 'Shipping v2', excerpt: 'What changed and why.', href: '/blog/v2', image: 'data:image/svg+xml;utf8,x', imageAlt: '', category: 'Release', author: 'Author name', date: '2024-03-01', readTime: 5 }
const root = (props: Record<string, unknown> = {}) => mount(BlogCard, { props: { ...post, ...props } })
const body = (w: ReturnType<typeof root>) => w.find('[data-slot="blog-card-body"]')

describe('BlogCard variations', () => {
  describe('defaults keep the original output', () => {
    it('root keeps the exact original class set', () => {
      expect([...root().classes()].sort()).toEqual(
        [...'group relative flex overflow-hidden rounded-lg border bg-card text-card-foreground has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/40 forced-colors:has-[a:focus-visible]:outline-2 forced-colors:has-[a:focus-visible]:outline-offset-2 flex-col'.split(' ')].sort(),
      )
    })
    it('body, title, excerpt and meta keep their original classes', () => {
      const w = root()
      expect(body(w).classes().sort()).toEqual('flex min-w-0 flex-1 flex-col gap-3 p-5'.split(' ').sort())
      expect(w.find('h3').classes().sort()).toEqual('text-balance font-semibold tracking-tight [overflow-wrap:anywhere] text-lg'.split(' ').sort())
      expect(w.find('[data-slot="blog-card-excerpt"]').classes().sort()).toEqual('text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere]'.split(' ').sort())
      expect(w.find('[data-slot="blog-card-meta"]').classes().sort()).toEqual('mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground'.split(' ').sort())
      expect(w.find('[data-slot="blog-card-author"]').classes().sort()).toEqual('font-medium text-foreground [overflow-wrap:anywhere]'.split(' ').sort())
      expect(w.find('[data-slot="blog-card-category"]').classes()).toContain('bg-secondary')
    })
    it('reports the default dimensions as data attributes', () => {
      const w = root()
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(w.attributes('data-appearance')).toBe('card')
    })
    it('helpers called with no arguments equal the explicit defaults', () => {
      expect(blogCardVariants()).toBe(blogCardVariants({ variant: 'vertical', shape: 'rounded', appearance: 'card' }))
      expect(blogCardBodyVariants()).toBe(blogCardBodyVariants({ variant: 'vertical', size: 'md' }))
      expect(blogCardTitleVariants()).toBe(blogCardTitleVariants({ variant: 'vertical', size: 'md' }))
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'p-4', 'gap-2', 'text-base'],
      ['md', 'p-5', 'gap-3', 'text-lg'],
      ['lg', 'p-6', 'gap-4', 'text-xl'],
    ] as const)('%s sets padding %s, gap %s and a %s title', (size, pad, gap, title) => {
      const w = root({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(body(w).classes()).toEqual(expect.arrayContaining([pad, gap]))
      expect(w.find('h3').classes()).toContain(title)
    })
    it('sm and lg scale the excerpt and meta text', () => {
      expect(root({ size: 'sm' }).find('[data-slot="blog-card-excerpt"]').classes()).toContain('text-sm')
      expect(root({ size: 'lg' }).find('[data-slot="blog-card-excerpt"]').classes()).toContain('text-base')
      expect(root({ size: 'sm' }).find('[data-slot="blog-card-meta"]').classes()).toContain('text-xs')
      expect(root({ size: 'lg' }).find('[data-slot="blog-card-meta"]').classes()).toContain('text-sm')
    })
    it.each([
      ['sm', 'p-4 lg:justify-center lg:p-8', 'text-xl lg:text-2xl'],
      ['md', 'p-6 lg:justify-center lg:p-10', 'text-2xl lg:text-3xl'],
      ['lg', 'p-8 lg:justify-center lg:p-12', 'text-3xl lg:text-4xl'],
    ] as const)('featured at %s pads and sizes the title responsively', (size, pad, title) => {
      const w = root({ variant: 'featured', size })
      expect(body(w).classes()).toEqual(expect.arrayContaining(pad.split(' ')))
      expect(w.find('h3').classes()).toEqual(expect.arrayContaining(title.split(' ')))
    })
    it('only one padding token and one title size are present', () => {
      for (const size of BLOG_SIZES) {
        expect(body(root({ size })).classes().filter((c) => /^p-\d/.test(c))).toHaveLength(1)
        expect(root({ size }).find('h3').classes().filter((c) => /^text-(base|lg|xl|2xl|3xl|4xl)$/.test(c))).toHaveLength(1)
      }
    })
    it('unknown and wrong-typed values fall back to md', () => {
      for (const size of ['xl', '', 'SM', 3, null, {}]) {
        const w = root({ size })
        expect(w.attributes('data-size')).toBe('md')
        expect(body(w).classes()).toContain('p-5')
      }
    })
  })

  describe('shape', () => {
    it('rounded keeps rounded-lg, square removes the radius', () => {
      expect(root({ shape: 'rounded' }).classes()).toContain('rounded-lg')
      const square = root({ shape: 'square' })
      expect(square.attributes('data-shape')).toBe('square')
      expect(square.classes()).toContain('rounded-none')
      expect(square.classes()).not.toContain('rounded-lg')
    })
    it('the cover is clipped by the root in both shapes (overflow-hidden)', () => {
      for (const shape of BLOG_SHAPES) expect(root({ shape }).classes()).toContain('overflow-hidden')
    })
    it('unknown values fall back to rounded', () => {
      const w = root({ shape: 'pill' })
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(w.classes()).toContain('rounded-lg')
    })
  })

  describe('appearance', () => {
    it('card is the original bordered surface', () => {
      const c = root({ appearance: 'card' }).classes()
      expect(c).toEqual(expect.arrayContaining(['border', 'bg-card', 'text-card-foreground']))
    })
    it('plain has no fill, a transparent border and foreground text', () => {
      const w = root({ appearance: 'plain' })
      expect(w.attributes('data-appearance')).toBe('plain')
      expect(w.classes()).toEqual(expect.arrayContaining(['border', 'border-transparent', 'bg-transparent', 'text-foreground']))
      expect(w.classes()).not.toContain('bg-card')
      expect(w.find('[data-slot="blog-card-excerpt"]').classes()).toContain('text-muted-foreground')
    })
    it('filled uses the secondary pair for the surface, text, excerpt, meta and author', () => {
      const w = root({ appearance: 'filled' })
      expect(w.attributes('data-appearance')).toBe('filled')
      expect(w.classes()).toEqual(expect.arrayContaining(['border-transparent', 'bg-secondary', 'text-secondary-foreground']))
      expect(w.classes()).not.toContain('bg-card')
      for (const slot of ['excerpt', 'meta', 'author']) {
        const cls = w.find(`[data-slot="blog-card-${slot}"]`).classes()
        expect(cls, slot).toContain('text-secondary-foreground')
        expect(cls, slot).not.toContain('text-muted-foreground')
        expect(cls, slot).not.toContain('text-foreground')
      }
    })
    it('the category badge takes the page surface on filled so it stays visible, and keeps self-start', () => {
      const badge = root({ appearance: 'filled' }).find('[data-slot="blog-card-category"]')
      expect(badge.classes()).toEqual(expect.arrayContaining(['bg-background', 'text-foreground', 'self-start']))
      expect(badge.classes()).not.toContain('bg-secondary')
      expect(root({ appearance: 'plain' }).find('[data-slot="blog-card-category"]').classes()).toContain('bg-secondary')
    })
    it('every appearance keeps the 1px border box (no layout shift) and the focus styles', () => {
      for (const appearance of BLOG_APPEARANCES) {
        const c = root({ appearance }).classes()
        expect(c, appearance).toContain('border')
        expect(c, appearance).toEqual(expect.arrayContaining(['has-[a:focus-visible]:border-ring', 'has-[a:focus-visible]:ring-3', 'forced-colors:has-[a:focus-visible]:outline-2']))
      }
    })
    it('unknown values fall back to card', () => {
      const w = root({ appearance: 'glass' })
      expect(w.attributes('data-appearance')).toBe('card')
      expect(w.classes()).toContain('bg-card')
    })
  })

  describe('combinations and overrides', () => {
    it('size x shape x appearance x variant never produce two radii, two fills or two paddings', () => {
      for (const variant of ['vertical', 'horizontal', 'featured'] as const)
        for (const size of BLOG_SIZES)
          for (const shape of BLOG_SHAPES)
            for (const appearance of BLOG_APPEARANCES) {
              const w = root({ variant, size, shape, appearance })
              const c = w.classes()
              expect(c.filter((x) => /^rounded-/.test(x)), `${variant}/${size}/${shape}/${appearance}`).toHaveLength(1)
              expect(c.filter((x) => /^bg-/.test(x))).toHaveLength(1)
              expect(c.filter((x) => /^text-(card-foreground|foreground|secondary-foreground)$/.test(x))).toHaveLength(1)
              expect(body(w).classes().filter((x) => /^p-\d/.test(x))).toHaveLength(1)
              expect(w.findAll('a')).toHaveLength(1)
            }
    })
    it('the class prop wins over variant classes', () => {
      const w = root({ shape: 'square', appearance: 'filled', class: 'rounded-xl bg-card custom' })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-xl', 'bg-card', 'custom']))
      expect(w.classes()).not.toContain('rounded-none')
      expect(w.classes()).not.toContain('bg-secondary')
    })
    it('helpers accept a class override', () => {
      expect(blogCardVariants({ shape: 'square', class: 'rounded-md' })).toContain('rounded-md')
      expect(blogCardExcerptVariants({ appearance: 'filled' })).toContain('text-secondary-foreground')
      expect(blogCardMetaVariants({ size: 'lg' })).toContain('text-sm')
    })
  })

  describe('accessibility in every variation', () => {
    it('keeps one stretched title link, the heading level and the article root', () => {
      for (const size of BLOG_SIZES)
        for (const appearance of BLOG_APPEARANCES) {
          const w = root({ size, appearance, shape: 'square', level: 2 })
          expect(w.element.tagName).toBe('ARTICLE')
          expect(w.find('h2 a').attributes('href')).toBe('/blog/v2')
          expect(w.find('h2 a').classes()).toContain('after:inset-0')
          expect(w.find('img').attributes('alt')).toBe('')
        }
    })
    it('the title link underlines on keyboard focus as well as hover, so the focused element itself changes (the card ring is on its parent)', () => {
      for (const appearance of BLOG_APPEARANCES) expect(root({ appearance }).find('h3 a').classes()).toEqual(expect.arrayContaining(['hover:underline', 'focus-visible:underline']))
    })
    it('long unbroken text still wraps at every size', () => {
      const long = 'x'.repeat(200)
      for (const size of BLOG_SIZES) {
        const w = root({ size, title: long, excerpt: long, author: long })
        expect(w.find('h3').classes().join(' ')).toContain('overflow-wrap:anywhere')
        expect(w.find('[data-slot="blog-card-excerpt"]').classes().join(' ')).toContain('overflow-wrap:anywhere')
        expect(w.find('[data-slot="blog-card-author"]').classes().join(' ')).toContain('overflow-wrap:anywhere')
      }
    })
    it('a card without meta, image or excerpt renders in every size', () => {
      for (const size of BLOG_SIZES) {
        const w = mount(BlogCard, { props: { title: 'Only a title', size, appearance: 'filled' } })
        expect(w.find('[data-slot="blog-card-meta"]').exists()).toBe(false)
        expect(w.find('[data-slot="blog-card-excerpt"]').exists()).toBe(false)
        expect(w.find('[data-slot="blog-card-image"]').exists()).toBe(false)
      }
    })
  })

  describe('contract stays enforced', () => {
    const t = strictMount()
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => {
      t.reset()
      configureStrictMode('off')
    })
    it('a missing title and a missing imageAlt still throw with size, shape and appearance set', async () => {
      await t.mount(() => el(BlogCard, { size: 'lg', shape: 'square', appearance: 'plain' }))
      expect(t.errors).toHaveLength(1)
      expect(t.errors[0].message).toContain('BlogCard: requires a non-empty `title`')
      t.reset()
      await t.mount(() => el(BlogCard, { title: 'Post', image: '/c.jpg', size: 'sm', appearance: 'filled' }))
      expect(t.errors[0].message).toContain('BlogCard: requires an `imageAlt` string')
    })
  })
})
