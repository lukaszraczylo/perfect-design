import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Testimonial from './Testimonial.vue'
import { TESTIMONIAL_VARIANTS, normalizeRating, resolveTestimonialVariant, testimonialVariants } from './variants'

describe('Testimonial slop and contrast regressions', () => {
  it.each(['card', 'quote', 'inline', 'with-rating', 'avatar-left', 'featured'] as const)('%s: no shadow, glow, tinted ring or oversized radius', (variant) => {
    const w = mount(Testimonial, { props: { quote: 'Sample quote.', author: 'Customer name', variant, avatar: '/a.png', rating: 4 } })
    expect(w.classes().join(' ')).not.toMatch(/shadow|ring-|rounded-(xl|2xl|3xl)|primary\//)
  })
  it('featured variant keeps a solid primary border on a card surface (no tint, no glow)', () => {
    const w = mount(Testimonial, { props: { quote: 'q', variant: 'featured' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['border-primary', 'bg-card', 'rounded-lg']))
  })
  it('filled stars use the foreground token (the warning token is reserved for caution)', () => {
    const w = mount(Testimonial, { props: { quote: 'q', rating: 3.5 } })
    const filled = w.findAll('[data-slot="testimonial-star"][data-fill="full"] > span')
    expect(filled).toHaveLength(3)
    expect(w.html()).not.toContain('text-warning')
    expect(filled[0].classes()).toContain('text-foreground')
    expect(w.find('[data-slot="testimonial-rating"]').attributes('aria-label')).toBe('3.5 out of 5')
  })
})

describe('Testimonial', () => {
  describe('good path', () => {
    it('renders figure, blockquote, name and role', () => {
      const w = mount(Testimonial, { props: { quote: 'Great', author: 'Customer name', role: 'Engineer' } })
      expect(w.element.tagName).toBe('FIGURE')
      expect(w.attributes('data-slot')).toBe('testimonial')
      expect(w.find('blockquote').text()).toBe('“Great”')
      expect(w.find('figcaption').exists()).toBe(true)
      expect(w.find('[data-slot="testimonial-name"]').text()).toBe('Customer name')
      expect(w.find('[data-slot="testimonial-role"]').text()).toBe('Engineer')
    })
    it('shows initials when there is no avatar', () => {
      const w = mount(Testimonial, { props: { quote: 'q', author: 'Customer name' } })
      const a = w.find('[data-slot="testimonial-avatar"]')
      expect(a.element.tagName).toBe('SPAN')
      expect(a.text()).toBe('CN')
      expect(a.attributes('aria-hidden')).toBe('true')
    })
    it('shows the image when provided', () => {
      const w = mount(Testimonial, { props: { author: 'A', avatar: '/a.png', avatarAlt: 'Ada' } })
      const img = w.find('img')
      expect(img.attributes('src')).toBe('/a.png')
      expect(img.attributes('alt')).toBe('Ada')
    })
    it('slots override content', () => {
      const w = mount(Testimonial, { slots: { default: '<p id="q">x</p>', avatar: '<i id="av"/>', author: '<b id="au"/>' } })
      expect(w.find('#q').exists() && w.find('#av').exists() && w.find('#au').exists()).toBe(true)
    })
  })
  describe('customisation', () => {
    it('merges class, attrs and supports as', () => {
      const w = mount(Testimonial, { props: { quote: 'q', as: 'div', class: 'p-2 custom' }, attrs: { id: 't' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('p-6')
      expect(w.attributes('id')).toBe('t')
    })
  })
  describe('bad path', () => {
    it('renders empty root with no props', () => {
      const w = mount(Testimonial)
      expect(w.find('blockquote').exists()).toBe(false)
      expect(w.find('figcaption').exists()).toBe(false)
    })
    it('a broken image falls back to initials and recovers on a new src', async () => {
      const w = mount(Testimonial, { props: { author: 'Customer name', avatar: '/missing.png' } })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="testimonial-avatar"]').text()).toBe('CN')
      await w.setProps({ avatar: '/ok.png' })
      expect(w.find('img').attributes('src')).toBe('/ok.png')
    })
    it('no author and no avatar renders no avatar element', () => {
      expect(mount(Testimonial, { props: { quote: 'q', role: 'CEO' } }).find('[data-slot="testimonial-avatar"]').exists()).toBe(false)
    })
  })
  describe('edge cases', () => {
    it('single-word name gives one initial; unicode and emoji work', () => {
      expect(mount(Testimonial, { props: { author: 'madonna' } }).find('[data-slot="testimonial-avatar"]').text()).toBe('M')
      expect(mount(Testimonial, { props: { author: '😀 Émile  Zola' } }).find('[data-slot="testimonial-avatar"]').text()).toBe('😀Z')
    })
    it('very long quote', () => {
      expect(mount(Testimonial, { props: { quote: 'q'.repeat(10000) } }).find('blockquote').text()).toHaveLength(10002)
    })
  })

  describe('variants', () => {
    const base = { quote: 'Great', author: 'Customer name', role: 'Engineer' }
    it.each([
      ['card', 'rounded-lg'],
      ['quote', 'text-center'],
      ['inline', 'border-s-2'],
      ['with-rating', 'rounded-lg'],
      ['avatar-left', 'grid-cols-[auto_1fr]'],
      ['featured', 'border-primary'],
    ] as const)('variant %s sets data-variant and its classes', (variant, cls) => {
      const w = mount(Testimonial, { props: { ...base, variant, avatar: '/a.png' } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toContain(cls)
    })
    it('default variant is card', () => {
      expect(mount(Testimonial, { props: base }).attributes('data-variant')).toBe('card')
    })
    it('quote variant uses the large quote text and centres the author', () => {
      const w = mount(Testimonial, { props: { ...base, variant: 'quote' } })
      expect(w.find('blockquote').classes()).toContain('text-2xl')
      expect(w.find('figcaption').classes()).toContain('justify-center')
    })
    it('inline variant uses a smaller avatar', () => {
      const w = mount(Testimonial, { props: { ...base, variant: 'inline' } })
      expect(w.find('[data-slot="testimonial-avatar"]').classes()).toContain('size-8')
    })
    it('featured variant enlarges quote and avatar', () => {
      const w = mount(Testimonial, { props: { ...base, variant: 'featured' } })
      expect(w.find('blockquote').classes()).toContain('text-xl')
      expect(w.find('[data-slot="testimonial-avatar"]').classes()).toContain('size-12')
    })
    it('avatar-left puts the avatar before the quote, outside the figcaption', () => {
      const w = mount(Testimonial, { props: { ...base, variant: 'avatar-left', rating: 5 } })
      const children = Array.from((w.element as Element).children).map((c) => c.getAttribute('data-slot'))
      expect(children).toEqual(['testimonial-avatar', 'testimonial-rating', 'testimonial-quote', 'testimonial-author'])
      expect(w.find('figcaption [data-slot="testimonial-avatar"]').exists()).toBe(false)
      expect(w.find('[data-slot="testimonial-avatar"]').classes()).toContain('row-span-3')
    })
    it('avatar-left spans only the rows that exist', () => {
      expect(mount(Testimonial, { props: { quote: 'q', author: 'A B', variant: 'avatar-left' } }).find('[data-slot="testimonial-avatar"]').classes()).toContain('row-span-2')
      expect(mount(Testimonial, { props: { author: 'A B', variant: 'avatar-left' } }).find('[data-slot="testimonial-avatar"]').classes()).toContain('row-span-1')
      expect(mount(Testimonial, { props: { variant: 'avatar-left' }, slots: { avatar: '<i id="av" />' } }).find('#av').exists()).toBe(true)
    })
    it('avatar-left without any avatar degrades to the card layout', () => {
      const w = mount(Testimonial, { props: { quote: 'q', role: 'CEO', variant: 'avatar-left' } })
      expect(w.attributes('data-variant')).toBe('avatar-left')
      expect(w.classes()).toContain('flex-col')
      expect(w.classes()).not.toContain('grid')
    })
    it('avatar-left with an image shows it', () => {
      const w = mount(Testimonial, { props: { ...base, variant: 'avatar-left', avatar: '/a.png', avatarAlt: 'Ada' } })
      expect(w.find('img').attributes('alt')).toBe('Ada')
    })
    it('unknown variant falls back to card', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Testimonial, { props: { ...base, variant: 'nope' } })
      expect(w.attributes('data-variant')).toBe('card')
      expect(w.classes()).toContain('rounded-lg')
    })
    it('exports a cva usable outside the component', () => {
      expect(testimonialVariants({ variant: 'quote' })).toContain('text-center')
      expect(TESTIMONIAL_VARIANTS).toHaveLength(6)
      expect(resolveTestimonialVariant(undefined)).toBe('card')
      expect(resolveTestimonialVariant('featured')).toBe('featured')
    })
    it('class override wins in every variant', () => {
      for (const variant of TESTIMONIAL_VARIANTS) {
        const w = mount(Testimonial, { props: { ...base, variant, class: 'p-1 custom' } })
        expect(w.classes()).toContain('custom')
        expect(w.classes()).not.toContain('p-6')
        expect(w.classes()).not.toContain('p-8')
      }
    })
  })

  describe('rating', () => {
    const stars = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="testimonial-star"]').map((s) => s.attributes('data-fill'))
    it('renders 5 stars with an accessible label', () => {
      const w = mount(Testimonial, { props: { quote: 'q', variant: 'with-rating', rating: 4 } })
      const r = w.find('[data-slot="testimonial-rating"]')
      expect(r.attributes('role')).toBe('img')
      expect(r.attributes('aria-label')).toBe('4 out of 5')
      expect(stars(w)).toEqual(['full', 'full', 'full', 'full', 'empty'])
      expect(w.findAll('[data-slot="testimonial-star"]').every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
    })
    it('supports half stars', () => {
      const w = mount(Testimonial, { props: { quote: 'q', rating: 4.5 } })
      expect(w.find('[data-slot="testimonial-rating"]').attributes('aria-label')).toBe('4.5 out of 5')
      expect(stars(w)).toEqual(['full', 'full', 'full', 'full', 'half'])
    })
    it('rounds to the nearest half', () => {
      expect(normalizeRating(3.3)).toBe(3.5)
    })
    it('clamps 7 to 5 and -1 to 0', () => {
      const hi = mount(Testimonial, { props: { quote: 'q', rating: 7 } })
      expect(hi.find('[data-slot="testimonial-rating"]').attributes('aria-label')).toBe('5 out of 5')
      expect(stars(hi)).toEqual(Array(5).fill('full'))
      const lo = mount(Testimonial, { props: { quote: 'q', rating: -1 } })
      expect(lo.find('[data-slot="testimonial-rating"]').attributes('aria-label')).toBe('0 out of 5')
      expect(stars(lo)).toEqual(Array(5).fill('empty'))
    })
    it.each([Number.NaN, Infinity, -Infinity, '4', null, undefined, {}])('invalid rating %s renders no stars', (rating) => {
      // @ts-expect-error deliberately invalid
      const w = mount(Testimonial, { props: { quote: 'q', variant: 'with-rating', rating } })
      expect(w.find('[data-slot="testimonial-rating"]').exists()).toBe(false)
    })
    it('shows stars above the quote in other variants too', () => {
      const w = mount(Testimonial, { props: { quote: 'q', variant: 'featured', rating: 5 } })
      expect(w.element.firstElementChild?.getAttribute('data-slot')).toBe('testimonial-rating')
    })
    it('rating updates reactively', async () => {
      const w = mount(Testimonial, { props: { quote: 'q', rating: 1 } })
      await w.setProps({ rating: 3 })
      expect(stars(w)).toEqual(['full', 'full', 'full', 'empty', 'empty'])
    })
    it('normalizeRating helper', () => {
      expect(normalizeRating(2.74)).toBe(2.5)
      expect(normalizeRating(2.76)).toBe(3)
      expect(normalizeRating(0)).toBe(0)
      expect(normalizeRating('3')).toBeNull()
    })
  })

  describe('variant edge cases', () => {
    it('very long quote and unicode work in every variant', () => {
      for (const variant of TESTIMONIAL_VARIANTS) {
        const w = mount(Testimonial, { props: { quote: '数'.repeat(5000), author: 'Émile Zola', variant } })
        expect(w.find('blockquote').text()).toHaveLength(5002)
      }
    })
    it('switching variants reactively swaps classes', async () => {
      const w = mount(Testimonial, { props: { quote: 'q', author: 'A B', variant: 'card' } })
      for (let n = 0; n < 10; n++) await w.setProps({ variant: n % 2 ? 'quote' : 'inline' })
      expect(w.attributes('data-variant')).toBe('quote')
      expect(w.classes()).toContain('text-center')
    })
    it('a broken avatar in avatar-left falls back to initials and unmounts cleanly', async () => {
      const w = mount(Testimonial, { props: { author: 'Customer name', avatar: '/x.png', variant: 'avatar-left' } })
      await w.find('img').trigger('error')
      expect(w.find('[data-slot="testimonial-avatar"]').text()).toBe('CN')
      w.unmount()
    })
  })
})
