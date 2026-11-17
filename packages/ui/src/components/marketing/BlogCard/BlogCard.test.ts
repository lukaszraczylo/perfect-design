import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BlogCard from './BlogCard.vue'
import { blogCardVariants } from './variants'
import { formatIsoDate, isIsoDate } from './date'

const post = {
  title: 'Shipping v2',
  excerpt: 'What changed and why.',
  href: '/blog/v2',
  image: 'https://x.dev/cover.png',
  imageAlt: 'Cover',
  category: 'Release',
  author: 'Author name',
  date: '2024-03-01',
  readTime: 5,
}

describe('BlogCard', () => {
  describe('good path', () => {
    it('renders an article with all parts', () => {
      const w = mount(BlogCard, { props: post })
      expect(w.element.tagName).toBe('ARTICLE')
      expect(w.attributes('data-slot')).toBe('blog-card')
      expect(w.find('h3').text()).toBe('Shipping v2')
      expect(w.find('[data-slot="blog-card-excerpt"]').text()).toBe('What changed and why.')
      expect(w.find('[data-slot="blog-card-category"]').text()).toBe('Release')
      expect(w.find('[data-slot="blog-card-author"]').text()).toBe('Author name')
      expect(w.find('[data-slot="blog-card-read-time"]').text()).toBe('5 min read')
      const img = w.find('img')
      expect(img.attributes('src')).toBe(post.image)
      expect(img.attributes('alt')).toBe('Cover')
      expect(img.attributes('loading')).toBe('lazy')
    })
    it('stretched link: title is the only link and covers the card', () => {
      const w = mount(BlogCard, { props: post })
      expect(w.findAll('a')).toHaveLength(1)
      const a = w.find('h3 a')
      expect(a.attributes('href')).toBe('/blog/v2')
      expect(a.classes()).toContain('after:absolute')
      expect(a.classes()).toContain('after:inset-0')
      expect(w.classes()).toContain('relative')
    })
    it('no href renders a plain title without a link', () => {
      const w = mount(BlogCard, { props: { ...post, href: undefined } })
      expect(w.find('a').exists()).toBe(false)
      expect(w.find('h3').text()).toBe('Shipping v2')
    })
    it('valid ISO date renders <time datetime> with a formatted label', () => {
      const w = mount(BlogCard, { props: post })
      const t = w.find('time')
      expect(t.attributes('datetime')).toBe('2024-03-01')
      expect(t.text()).toBe('Mar 1, 2024')
    })
    it('accepts ISO datetimes and trims whitespace', () => {
      const w = mount(BlogCard, { props: { ...post, date: ' 2024-03-01T23:30:00Z ' } })
      expect(w.find('time').attributes('datetime')).toBe('2024-03-01T23:30:00Z')
      expect(w.find('time').text()).toBe('Mar 1, 2024')
    })
    it('locale formats the date', () => {
      const w = mount(BlogCard, { props: { ...post, locale: 'de-DE' } })
      expect(w.find('time').text()).toBe(formatIsoDate('2024-03-01', 'de-DE'))
      expect(w.find('time').text()).not.toBe('Mar 1, 2024')
    })
    it('unsupported locale falls back to en-US', () => {
      expect(mount(BlogCard, { props: { ...post, locale: 'not_a_locale' } }).find('time').text()).toBe('Mar 1, 2024')
    })
    it('readTime string is shown as given; separators only between present parts', () => {
      const w = mount(BlogCard, { props: { title: 'T', author: 'A', date: '2024-03-01', readTime: '12 minutes' } })
      expect(w.find('[data-slot="blog-card-read-time"]').text()).toBe('12 minutes')
      expect(w.findAll('[data-slot="blog-card-meta"] [aria-hidden="true"]')).toHaveLength(2)
      const only = mount(BlogCard, { props: { title: 'T', readTime: 3 } })
      expect(only.findAll('[data-slot="blog-card-meta"] [aria-hidden="true"]')).toHaveLength(0)
      const authorTime = mount(BlogCard, { props: { title: 'T', author: 'A', readTime: 3 } })
      expect(authorTime.findAll('[data-slot="blog-card-meta"] [aria-hidden="true"]')).toHaveLength(1)
      const dateOnly = mount(BlogCard, { props: { title: 'T', author: 'A', date: '2024-03-01' } })
      expect(dateOnly.findAll('[data-slot="blog-card-meta"] [aria-hidden="true"]')).toHaveLength(1)
    })
    it.each([
      ['vertical', 'flex-col', undefined],
      ['horizontal', 'sm:flex-row', 'sm:w-64'],
      ['featured', 'lg:flex-row', 'lg:w-3/5'],
    ] as const)('variant %s', (variant, rootCls, imgCls) => {
      const w = mount(BlogCard, { props: { ...post, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toContain(rootCls)
      if (imgCls) expect(w.find('[data-slot="blog-card-image"]').classes()).toContain(imgCls)
      expect(blogCardVariants({ variant })).toContain(rootCls)
    })
    it('featured uses a larger title', () => {
      expect(mount(BlogCard, { props: { ...post, variant: 'featured' } }).find('h3').classes()).toContain('text-2xl')
      expect(mount(BlogCard, { props: { ...post, variant: 'vertical' } }).find('h3').classes()).toContain('text-lg')
    })
    it('level changes the heading element', () => {
      expect(mount(BlogCard, { props: { ...post, level: 2 } }).find('h2').exists()).toBe(true)
      expect(mount(BlogCard, { props: { ...post, level: 5 } }).find('h5').exists()).toBe(true)
    })
    it('image and default slots override', () => {
      const w = mount(BlogCard, { props: post, slots: { image: '<picture id="p" />', default: 'Custom <b>excerpt</b>' } })
      expect(w.find('#p').exists()).toBe(true)
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-excerpt"] b').text()).toBe('excerpt')
    })
    it('image slot renders even without an image prop', () => {
      const w = mount(BlogCard, { props: { title: 'T' }, slots: { image: '<picture id="p" />' } })
      expect(w.find('[data-slot="blog-card-image"] #p').exists()).toBe(true)
    })
  })

  describe('slop and accessibility regressions', () => {
    it('uses the card radius, no shadow, no hover scale or lift', () => {
      const w = mount(BlogCard, { props: { ...post, variant: 'featured' } })
      expect(w.classes()).toContain('rounded-lg')
      expect(w.html()).not.toMatch(/shadow-|hover:(scale|shadow|-translate)|group-hover|rounded-xl|rounded-2xl|backdrop-blur/)
    })
    it('separators never end a line: each sits inside the no-wrap item it precedes', () => {
      const w = mount(BlogCard, { props: post })
      const meta = w.find('[data-slot="blog-card-meta"]')
      expect(meta.findAll(':scope > [data-slot="blog-card-sep"]')).toHaveLength(0)
      const seps = meta.findAll('[data-slot="blog-card-sep"]')
      expect(seps).toHaveLength(2)
      seps.forEach((s) => {
        const part = s.element.parentElement!
        expect(part.getAttribute('data-slot')).toBe('blog-card-meta-part')
        expect(part.classList.contains('whitespace-nowrap')).toBe(true)
        expect(part.firstElementChild).toBe(s.element)
      })
    })
    it('separators are decorative aria-hidden shapes, not glyphs', () => {
      const w = mount(BlogCard, { props: post })
      const seps = w.findAll('[data-slot="blog-card-sep"]')
      expect(seps).toHaveLength(2)
      seps.forEach((s) => {
        expect(s.attributes('aria-hidden')).toBe('true')
        expect(s.text()).toBe('')
      })
      expect(w.text()).not.toContain('\u00b7')
    })
    it('keeps a visible focus indicator in forced-colors mode', () => {
      const w = mount(BlogCard, { props: post })
      expect(w.classes()).toContain('forced-colors:has-[a:focus-visible]:outline-2')
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(BlogCard, { props: { ...post, class: 'rounded-none custom' }, attrs: { id: 'b', 'data-x': '1' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-xl')
      expect(w.attributes('id')).toBe('b')
      expect(w.attributes('data-x')).toBe('1')
    })
  })

  describe('bad path', () => {
    it.each(['yesterday', '2024-13-01', '2024-02-31', '2024-3-1', '', '   ', '01/03/2024', '2024-03-01T25:00:00Z x'])('invalid date %j renders plain text without datetime', (date) => {
      const w = mount(BlogCard, { props: { title: 'T', date } })
      expect(w.find('time').exists()).toBe(false)
      if (date.trim()) {
        const el = w.find('[data-slot="blog-card-date"]')
        expect(el.element.tagName).toBe('SPAN')
        expect(el.text()).toBe(date.trim())
      } else {
        expect(w.find('[data-slot="blog-card-date"]').exists()).toBe(false)
      }
    })
    it('leap day is valid, non-leap is not', () => {
      expect(isIsoDate('2024-02-29')).toBe(true)
      expect(isIsoDate('2023-02-29')).toBe(false)
      expect(isIsoDate(20240301)).toBe(false)
      expect(isIsoDate(undefined)).toBe(false)
      expect(isIsoDate('2024-03-01 10:00')).toBe(true)
      expect(isIsoDate('2024-03-01T10:00:00.123+02:00')).toBe(true)
    })
    it('unknown variant falls back to vertical', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(BlogCard, { props: { ...post, variant: 'wide' } })
      expect(w.attributes('data-variant')).toBe('vertical')
      expect(w.classes()).toContain('flex-col')
    })
    it('invalid level falls back to h3', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(BlogCard, { props: { ...post, level: 7 } }).find('h3').exists()).toBe(true)
    })
    it('invalid readTime renders nothing', () => {
      for (const readTime of [0, -3, Number.NaN, Infinity, '']) {
        const w = mount(BlogCard, { props: { title: 'T', readTime } })
        expect(w.find('[data-slot="blog-card-read-time"]').exists()).toBe(false)
      }
    })
    it('minimal post renders just a title', () => {
      const w = mount(BlogCard, { props: { title: 'Only title' } })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-image"]').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-meta"]').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-excerpt"]').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-category"]').exists()).toBe(false)
    })
    it('empty title renders no heading', () => {
      expect(mount(BlogCard, { props: { title: '', href: '/x' } }).find('a').exists()).toBe(false)
    })
    it('broken image leaves the placeholder, resets when src changes', async () => {
      const w = mount(BlogCard, { props: post })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-image"]').classes()).toContain('bg-muted')
      await w.setProps({ image: 'https://x.dev/other.png' })
      expect(w.find('img').attributes('src')).toBe('https://x.dev/other.png')
    })
    it('image alt defaults to empty (decorative)', () => {
      expect(mount(BlogCard, { props: { title: 'T', image: '/a.png' } }).find('img').attributes('alt')).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles very long unbroken text', () => {
      const long = 'W'.repeat(3000)
      const w = mount(BlogCard, { props: { title: long, excerpt: long, author: long, category: long } })
      expect(w.find('h3').text()).toHaveLength(3000)
      expect(w.find('h3').classes().join(' ')).toContain('overflow-wrap:anywhere')
      expect(w.find('[data-slot="blog-card-excerpt"]').classes().join(' ')).toContain('overflow-wrap:anywhere')
    })
    it('handles unicode and RTL', () => {
      const w = mount(BlogCard, { props: { title: 'مرحبا بالعالم 😀', author: '李雷', excerpt: 'Zażółć gęślą jaźń', category: 'Новости' } })
      expect(w.find('h3').text()).toBe('مرحبا بالعالم 😀')
      expect(w.find('[data-slot="blog-card-author"]').text()).toBe('李雷')
    })
    it('escapes HTML in text', () => {
      const w = mount(BlogCard, { props: { title: '<b>x</b>', excerpt: '<i>y</i>', author: '<u>z</u>' } })
      expect(w.find('h3 b').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-excerpt"] i').exists()).toBe(false)
      expect(w.find('[data-slot="blog-card-author"] u').exists()).toBe(false)
    })
    it('date formatting is timezone-stable (UTC)', () => {
      expect(formatIsoDate('2024-12-31')).toBe('Dec 31, 2024')
      expect(formatIsoDate('2024-01-01T00:00:00Z')).toBe('Jan 1, 2024')
    })
    it('rapid variant toggles and unmount', async () => {
      const w = mount(BlogCard, { props: post })
      for (const v of ['featured', 'horizontal', 'vertical', 'featured'] as const) {
        await w.setProps({ variant: v })
        expect(w.attributes('data-variant')).toBe(v)
      }
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
