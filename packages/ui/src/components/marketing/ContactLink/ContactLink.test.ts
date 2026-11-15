import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import ContactLink from './ContactLink.vue'
import { CONTACT_LINK_SIZES, CONTACT_LINK_VARIANTS, contactLinkIconTileVariants, contactLinkInteractiveVariants, contactLinkVariants } from './variants'

describe('ContactLink', () => {
  describe('good path', () => {
    it('renders a mailto link with icon and the address as text', () => {
      const w = mount(ContactLink, { props: { value: 'hi@example.com' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('data-slot')).toBe('contact-link')
      expect(w.attributes('href')).toBe('mailto:hi@example.com')
      expect(w.attributes('data-type')).toBe('email')
      expect(w.text()).toBe('hi@example.com')
      expect(w.find('svg').exists()).toBe(true)
    })
    it('renders a tel link with a dialable href but readable text', () => {
      const w = mount(ContactLink, { props: { type: 'tel', value: '+48 (22) 123-45-67' } })
      expect(w.attributes('href')).toBe('tel:+48221234567')
      expect(w.text()).toBe('+48 (22) 123-45-67')
      expect(w.attributes('data-type')).toBe('tel')
    })
    it('label overrides the text; subject is encoded', () => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', label: 'Email us', subject: 'Hello & welcome' } })
      expect(w.text()).toBe('Email us')
      expect(w.attributes('href')).toBe('mailto:a@b.co?subject=Hello%20%26%20welcome')
    })
    it('slot overrides the text', () => {
      expect(mount(ContactLink, { props: { value: 'a@b.co' }, slots: { default: 'Write to us' } }).text()).toBe('Write to us')
    })
  })
  describe('variants and sizes', () => {
    it('inline is the default text link', () => {
      const w = mount(ContactLink, { props: { value: 'a@b.co' } })
      expect(w.attributes('data-variant')).toBe('inline')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toEqual(expect.arrayContaining(['inline-flex', 'text-primary', 'text-sm', 'hover:underline']))
      expect(w.find('[data-slot="contact-link-icon"]').exists()).toBe(false)
    })
    it('button is a filled primary button with a height per size', () => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', variant: 'button' } })
      expect(w.element.tagName).toBe('A')
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-primary-foreground', 'min-h-9', 'px-4', 'rounded-md', 'justify-center']))
      expect(w.classes()).not.toContain('text-primary')
      expect(w.classes()).not.toContain('hover:underline')
      expect(w.text()).toBe('a@b.co')
    })
    it.each([
      ['sm', 'min-h-8', 'text-xs'],
      ['md', 'min-h-9', 'text-sm'],
      ['lg', 'min-h-11', 'text-base'],
    ] as const)('button size %s', (size, h, text) => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', variant: 'button', size } })
      expect(w.classes()).toEqual(expect.arrayContaining([h, text]))
      expect(w.attributes('data-size')).toBe(size)
    })
    it.each([
      ['sm', 'text-xs', 'size-3.5'],
      ['md', 'text-sm', 'size-4'],
      ['lg', 'text-base', 'size-5'],
    ] as const)('inline size %s scales text and icon', (size, text, icon) => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', size } })
      expect(w.classes()).toContain(text)
      expect(w.find('svg').classes()).toContain(icon)
    })
    it('card shows an icon tile, the label as headline and the value beneath', () => {
      const w = mount(ContactLink, { props: { value: 'hello@example.com', label: 'Email us', variant: 'card' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('mailto:hello@example.com')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'w-full', 'rounded-lg', 'border', 'bg-card', 'p-4', 'hover:bg-accent']))
      expect(w.find('[data-slot="contact-link-icon"]').classes()).toEqual(expect.arrayContaining(['size-10', 'text-primary']))
      expect(w.find('[data-slot="contact-link-icon"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="contact-link-label"]').text()).toBe('Email us')
      expect(w.find('[data-slot="contact-link-value"]').text()).toBe('hello@example.com')
    })
    it('card without a distinct label shows the value once', () => {
      const w = mount(ContactLink, { props: { value: 'hi@x.io', variant: 'card' } })
      expect(w.find('[data-slot="contact-link-label"]').text()).toBe('hi@x.io')
      expect(w.find('[data-slot="contact-link-value"]').exists()).toBe(false)
      const same = mount(ContactLink, { props: { value: 'hi@x.io', label: 'hi@x.io', variant: 'card' } })
      expect(same.find('[data-slot="contact-link-value"]').exists()).toBe(false)
    })
    it('card with tel, custom icon, noIcon and slot', () => {
      const t = mount(ContactLink, { props: { type: 'tel', value: '+48 22 123 45 67', label: 'Call us', variant: 'card', icon: faGlobe } })
      expect(t.attributes('href')).toBe('tel:+48221234567')
      expect(t.find('[data-slot="contact-link-value"]').text()).toBe('+48 22 123 45 67')
      const n = mount(ContactLink, { props: { value: 'a@b.co', variant: 'card', noIcon: true } })
      expect(n.find('[data-slot="contact-link-icon"]').exists()).toBe(false)
      expect(n.find('svg').exists()).toBe(false)
      const s = mount(ContactLink, { props: { value: 'a@b.co', variant: 'card' }, slots: { default: 'Write to us' } })
      expect(s.find('[data-slot="contact-link-label"]').text()).toBe('Write to us')
    })
    it.each([
      ['sm', 'p-3', 'size-8'],
      ['md', 'p-4', 'size-10'],
      ['lg', 'p-5', 'size-12'],
    ] as const)('card size %s', (size, pad, tile) => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', variant: 'card', size } })
      expect(w.classes()).toContain(pad)
      expect(w.find('[data-slot="contact-link-icon"]').classes()).toContain(tile)
    })
    it.each(CONTACT_LINK_VARIANTS)('%s: class merges last and attrs fall through', (variant) => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', variant, class: 'rounded-none custom' }, attrs: { id: 'c', 'aria-label': 'Mail' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('rounded-sm')
      expect(w.classes()).not.toContain('rounded-md')
      expect(w.classes()).not.toContain('rounded-lg')
      expect(w.attributes('id')).toBe('c')
      expect(w.attributes('aria-label')).toBe('Mail')
    })
    it.each(CONTACT_LINK_VARIANTS)('%s: a missing value renders a non-link span without link styling', (variant) => {
      const w = mount(ContactLink, { props: { variant } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('href')).toBeUndefined()
      expect(w.classes()).not.toContain('bg-primary')
      expect(w.classes()).not.toContain('text-primary')
      expect(w.classes()).not.toContain('hover:bg-accent')
    })
    it.each(CONTACT_LINK_VARIANTS)('%s: links expose a focus ring and keep their href', (variant) => {
      const w = mount(ContactLink, { props: { type: 'tel', value: '+1 555 0100', variant } })
      expect(w.classes().some((c) => c.includes('focus-visible:ring'))).toBe(true)
      expect(w.attributes('href')).toBe('tel:+15550100')
    })
    it('exposes class helpers', () => {
      expect(contactLinkVariants({ variant: 'button', size: 'lg' })).toContain('min-h-11')
      expect(contactLinkVariants()).toContain('inline-flex')
      expect(contactLinkInteractiveVariants({ variant: 'card' })).toContain('hover:bg-accent')
      expect(contactLinkInteractiveVariants()).toContain('text-primary')
      expect(contactLinkIconTileVariants({ size: 'lg' })).toContain('size-12')
      expect(CONTACT_LINK_SIZES).toEqual(['sm', 'md', 'lg'])
    })
  })
  describe('customisation', () => {
    it('merges class, attrs; custom icon; noIcon', () => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', icon: faGlobe, class: 'text-red-500 custom' }, attrs: { id: 'c', 'aria-label': 'Mail' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('text-red-500')
      expect(w.classes()).not.toContain('text-primary')
      expect(w.attributes('id')).toBe('c')
      expect(mount(ContactLink, { props: { value: 'a@b.co', noIcon: true } }).find('svg').exists()).toBe(false)
    })
  })
  describe('bad path', () => {
    it('unknown variant and size fall back to inline / md', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(ContactLink, { props: { value: 'a@b.co', variant: 'pill', size: 'xl' } })
      expect(w.attributes('data-variant')).toBe('inline')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('text-primary')
      // @ts-expect-error deliberately invalid
      const n = mount(ContactLink, { props: { value: 'a@b.co', variant: null, size: null } })
      expect(n.attributes('data-variant')).toBe('inline')
    })
    it('empty/whitespace value renders a non-link span', () => {
      for (const value of ['', '   ', undefined]) {
        const w = mount(ContactLink, { props: { value } })
        expect(w.element.tagName).toBe('SPAN')
        expect(w.attributes('href')).toBeUndefined()
      }
    })
    it('phone with no digits is not a link', () => {
      const w = mount(ContactLink, { props: { type: 'tel', value: 'call us' } })
      expect(w.element.tagName).toBe('SPAN')
    })
    it('unknown type falls back to email', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(ContactLink, { props: { type: 'fax', value: 'a@b.co' } }).attributes('href')).toBe('mailto:a@b.co')
    })
  })
  describe('edge cases', () => {
    it('trims and strips whitespace from email; keeps extension characters in tel', () => {
      expect(mount(ContactLink, { props: { value: '  a @b.co ' } }).attributes('href')).toBe('mailto:a@b.co')
      expect(mount(ContactLink, { props: { type: 'tel', value: '+1 555 0100;ext=5,#' } }).attributes('href')).toBe('tel:+15550100;5,#')
    })
    it.each(CONTACT_LINK_VARIANTS)('%s: very long unicode label and rapid variant toggling', async (variant) => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', label: '連絡先📧'.repeat(300), variant } })
      expect(w.text()).toContain('連絡先')
      for (let i = 0; i < 20; i++) await w.setProps({ variant: CONTACT_LINK_VARIANTS[i % 3], size: CONTACT_LINK_SIZES[i % 3] })
      expect(w.attributes('href')).toBe('mailto:a@b.co')
    })
    it('very long and unicode values', () => {
      const w = mount(ContactLink, { props: { value: `${'ü'.repeat(300)}@例え.jp` } })
      expect(w.attributes('href')!.startsWith('mailto:')).toBe(true)
      expect(w.text()).toHaveLength(306)
    })
  })

  describe('accessibility and slop regressions', () => {
    it('the card icon is bare: no tinted tile', () => {
      const tile = mount(ContactLink, { props: { value: 'a@b.co', variant: 'card' } }).find('[data-slot="contact-link-icon"]')
      expect(tile.classes().join(' ')).not.toMatch(/bg-|rounded/)
    })
    it('every variant meets target size: min 24px, 44px on coarse pointers', () => {
      for (const variant of ['inline', 'button'] as const) {
        const cls = mount(ContactLink, { props: { value: 'a@b.co', variant } }).classes()
        expect(cls).toContain('pointer-coarse:min-h-11')
      }
      expect(mount(ContactLink, { props: { value: 'a@b.co', variant: 'card' } }).classes()).toContain('p-4')
      expect(mount(ContactLink, { props: { value: 'a@b.co' } }).classes()).toContain('min-h-6')
    })
    it('buttons use a minimum, not a fixed height, so large text does not clip', () => {
      const cls = mount(ContactLink, { props: { value: 'a@b.co', variant: 'button' } }).classes().join(' ')
      expect(cls).not.toMatch(/(^| )h-(8|9|11)( |$)/)
    })
    it('card label and value wrap instead of being truncated (reflow at 320px)', () => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', label: 'Email', variant: 'card' } })
      expect(w.find('[data-slot="contact-link-label"]').classes()).toContain('break-words')
      expect(w.find('[data-slot="contact-link-value"]').classes()).toContain('break-words')
      expect(w.html()).not.toContain('truncate')
    })
    it('no variant uses rounded-xl, shadows or a coloured tile', () => {
      for (const variant of CONTACT_LINK_VARIANTS) expect(mount(ContactLink, { props: { value: 'a@b.co', variant } }).html()).not.toMatch(/rounded-(xl|2xl)|shadow|bg-primary\/10/)
    })
    it('the icon is aria-hidden and the link is named by its visible text', () => {
      const w = mount(ContactLink, { props: { value: 'a@b.co', label: 'Email us' } })
      expect(w.find('svg').attributes('aria-hidden')).toBe('true')
      expect(w.text()).toBe('Email us')
    })
  })
})
