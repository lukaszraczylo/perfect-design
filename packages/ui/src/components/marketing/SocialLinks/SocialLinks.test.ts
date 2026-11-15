import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faEnvelope, faRss } from '@fortawesome/free-solid-svg-icons'
import SocialLinks from './SocialLinks.vue'
import { SOCIAL_LINKS_ALIGNS, SOCIAL_LINKS_ORIENTATIONS, SOCIAL_LINKS_SIZES, SOCIAL_LINKS_VARIANTS, socialLinksLinkVariants, socialLinksVariants } from './variants'

const links = [
  { label: 'Email', href: 'mailto:a@b.co', icon: faEnvelope },
  { label: 'RSS', href: '/rss.xml', icon: faRss },
]

describe('SocialLinks', () => {
  describe('good path', () => {
    it('renders a labelled icon link per entry', () => {
      const w = mount(SocialLinks, { props: { links } })
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('data-slot')).toBe('social-links')
      const a = w.findAll('a')
      expect(a).toHaveLength(2)
      expect(a[0].attributes('aria-label')).toBe('Email')
      expect(a[0].attributes('href')).toBe('mailto:a@b.co')
      expect(a[0].find('svg').attributes('aria-hidden')).toBe('true')
    })
    it('opens in a new tab safely by default and can opt out', () => {
      const a = mount(SocialLinks, { props: { links } }).find('a')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
      const b = mount(SocialLinks, { props: { links, newTab: false } }).find('a')
      expect(b.attributes('target')).toBeUndefined()
      expect(b.attributes('rel')).toBeUndefined()
    })
    it.each([
      ['sm', 'size-8'],
      ['md', 'size-10'],
      ['lg', 'size-12'],
    ] as const)('size %s', (size, cls) => {
      expect(mount(SocialLinks, { props: { links, size } }).find('a').classes()).toContain(cls)
    })
  })
  describe('variants, align and orientation', () => {
    it('defaults: ghost look, md, row aligned to the start', () => {
      const w = mount(SocialLinks, { props: { links } })
      expect(w.attributes('data-variant')).toBe('ghost')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-row', 'flex-wrap', 'items-center', 'gap-2', 'justify-start']))
      expect(w.find('a').classes()).toEqual(expect.arrayContaining(['rounded-md', 'text-muted-foreground', 'hover:bg-accent']))
    })
    it.each([
      ['plain', ['text-muted-foreground', 'hover:text-foreground'], ['hover:bg-accent', 'border', 'bg-primary']],
      ['outline', ['border', 'border-border', 'bg-background', 'hover:bg-accent'], ['bg-primary']],
      ['filled', ['bg-primary', 'text-primary-foreground', 'hover:bg-primary/90'], ['border', 'text-muted-foreground']],
      ['ghost', ['text-muted-foreground', 'hover:bg-accent'], ['border', 'bg-primary']],
    ] as const)('variant %s', (variant, has, hasNot) => {
      const w = mount(SocialLinks, { props: { links, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      const a = w.find('a')
      expect(a.classes()).toEqual(expect.arrayContaining([...has]))
      for (const c of hasNot) expect(a.classes()).not.toContain(c)
    })
    it.each([
      ['sm', 'size-8', 'size-3.5'],
      ['md', 'size-10', 'size-4'],
      ['lg', 'size-12', 'size-5'],
    ] as const)('size %s scales box and icon', (size, box, icon) => {
      const a = mount(SocialLinks, { props: { links, size } }).find('a')
      expect(a.classes()).toContain(box)
      expect(a.find('svg').classes()).toContain(icon)
    })
    it.each([
      ['start', 'justify-start'],
      ['center', 'justify-center'],
      ['end', 'justify-end'],
    ] as const)('align %s in a row', (align, cls) => {
      expect(mount(SocialLinks, { props: { links, align } }).classes()).toContain(cls)
    })
    it.each([
      ['start', 'items-start'],
      ['center', 'items-center'],
      ['end', 'items-end'],
    ] as const)('align %s in a column', (align, cls) => {
      const w = mount(SocialLinks, { props: { links, align, orientation: 'vertical' } })
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex-col', cls]))
      expect(w.classes()).not.toContain('flex-row')
      expect(w.classes()).not.toContain('flex-wrap')
    })
    it.each(SOCIAL_LINKS_VARIANTS)('%s: links stay accessible, safe and focusable', (variant) => {
      const w = mount(SocialLinks, { props: { links, variant } })
      const a = w.find('a')
      expect(a.attributes('aria-label')).toBe('Email')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
      expect(a.find('svg').attributes('aria-hidden')).toBe('true')
      expect(a.classes().some((c) => c.includes('focus-visible:ring'))).toBe(true)
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('role')).toBe('list')
    })
    it.each(SOCIAL_LINKS_VARIANTS)('%s: class merges last and attrs fall through', (variant) => {
      const w = mount(SocialLinks, { props: { links, variant, class: 'gap-6 custom' }, attrs: { id: 's', 'aria-label': 'Follow' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-2')
      expect(w.attributes('id')).toBe('s')
      expect(w.attributes('aria-label')).toBe('Follow')
    })
    it('exposes class helpers', () => {
      expect(socialLinksVariants({ orientation: 'vertical', align: 'end' })).toContain('items-end')
      expect(socialLinksVariants()).toContain('justify-start')
      expect(socialLinksLinkVariants({ variant: 'filled', size: 'lg' })).toContain('bg-primary')
      expect(socialLinksLinkVariants()).toContain('size-10')
      expect(SOCIAL_LINKS_SIZES).toHaveLength(3)
      expect(SOCIAL_LINKS_ALIGNS).toHaveLength(3)
      expect(SOCIAL_LINKS_ORIENTATIONS).toHaveLength(2)
    })
  })
  describe('customisation', () => {
    it('merges class and attrs', () => {
      const w = mount(SocialLinks, { props: { links, class: 'gap-6 custom' }, attrs: { 'aria-label': 'Follow us' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-2')
      expect(w.attributes('aria-label')).toBe('Follow us')
    })
  })
  describe('bad path', () => {
    it('unknown variant, align and orientation fall back to defaults; null too', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SocialLinks, { props: { links, variant: 'neon', align: 'middle', orientation: 'diagonal' } })
      expect(w.attributes('data-variant')).toBe('ghost')
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(w.classes()).toContain('justify-start')
      // @ts-expect-error deliberately invalid
      const n = mount(SocialLinks, { props: { links, variant: null, align: null, orientation: null, size: null } })
      expect(n.attributes('data-variant')).toBe('ghost')
      expect(n.attributes('data-size')).toBe('md')
    })
    it.each(SOCIAL_LINKS_VARIANTS)('%s with empty links renders an empty list', (variant) => {
      expect(mount(SocialLinks, { props: { links: [], variant, orientation: 'vertical' } }).findAll('li')).toHaveLength(0)
    })
    it('empty links renders an empty list', () => {
      expect(mount(SocialLinks, { props: { links: [] } }).findAll('li')).toHaveLength(0)
    })
    it('skips entries without href or label (an unnamed icon link is inaccessible)', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SocialLinks, { props: { links: [{ label: '', href: '/x', icon: faRss }, { label: 'X', href: '', icon: faRss }, null, links[0]] } })
      expect(w.findAll('a')).toHaveLength(1)
    })
    it('unknown size falls back to md', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(SocialLinks, { props: { links, size: 'huge' } }).find('a').classes()).toContain('size-10')
    })
  })
  describe('edge cases', () => {
    it.each(SOCIAL_LINKS_VARIANTS)('%s: 100 links, very long label, rapid toggling', async (variant) => {
      const many = Array.from({ length: 100 }, (_, i) => ({ ...links[0], label: `L${i}` }))
      const w = mount(SocialLinks, { props: { links: many, variant } })
      expect(w.findAll('a')).toHaveLength(100)
      const long = mount(SocialLinks, { props: { links: [{ ...links[0], label: 'x'.repeat(5000) }], variant } })
      expect(long.find('a').attributes('aria-label')).toHaveLength(5000)
      for (let i = 0; i < 20; i++) await w.setProps({ variant: SOCIAL_LINKS_VARIANTS[i % 4], size: SOCIAL_LINKS_SIZES[i % 3], orientation: SOCIAL_LINKS_ORIENTATIONS[i % 2] })
      expect(w.findAll('a')).toHaveLength(100)
    })
    it('1 and 100 links with duplicate labels', () => {
      expect(mount(SocialLinks, { props: { links: [links[0]] } }).findAll('a')).toHaveLength(1)
      const many = Array.from({ length: 100 }, () => links[0])
      expect(mount(SocialLinks, { props: { links: many } }).findAll('a')).toHaveLength(100)
    })
    it('unicode labels', () => {
      expect(mount(SocialLinks, { props: { links: [{ ...links[0], label: 'メール 📧' }] } }).find('a').attributes('aria-label')).toBe('メール 📧')
    })
  })

  describe('accessibility and slop regressions', () => {
    it('links are rounded-md (rounded-full is for avatars and dots) in every variant', () => {
      for (const variant of SOCIAL_LINKS_VARIANTS) {
        const a = mount(SocialLinks, { props: { links, variant } }).find('a')
        expect(a.classes()).toContain('rounded-md')
        expect(a.classes()).not.toContain('rounded-full')
      }
    })
    it('small and medium links grow to 44px on coarse pointers; large already exceeds it', () => {
      expect(socialLinksLinkVariants({ size: 'sm' })).toContain('pointer-coarse:size-11')
      expect(socialLinksLinkVariants({ size: 'md' })).toContain('pointer-coarse:size-11')
      expect(socialLinksLinkVariants({ size: 'lg' })).toContain('size-12')
    })
    it('a non-array links value renders an empty list instead of throwing', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(SocialLinks, { props: { links: null } }).findAll('li')).toHaveLength(0)
      // @ts-expect-error deliberately invalid
      expect(mount(SocialLinks, { props: { links: 'x' } }).findAll('li')).toHaveLength(0)
    })
    it('is a native list whose links are named and have a focus ring; icons are aria-hidden', () => {
      const w = mount(SocialLinks, { props: { links } })
      expect(w.element.tagName).toBe('UL')
      const a = w.find('a')
      expect(a.attributes('aria-label')).toBe(links[0].label)
      expect(a.classes().join(' ')).toContain('focus-visible:ring-3')
      expect(a.find('svg').attributes('aria-hidden')).toBe('true')
    })
  })
})
