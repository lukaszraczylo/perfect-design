import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import NewsletterSignup from './NewsletterSignup.vue'
import {
  NEWSLETTER_SHAPES,
  NEWSLETTER_SIZES,
  NEWSLETTER_VARIANTS,
  newsletterSignupButtonVariants,
  newsletterSignupDescriptionVariants,
  newsletterSignupFieldVariants,
  newsletterSignupFormVariants,
  newsletterSignupHeaderVariants,
  newsletterSignupSideVariants,
  newsletterSignupTitleVariants,
  newsletterSignupVariants,
} from './variants'

const copy = { title: 'Release notes', description: 'Sent when a version ships.' }
const signup = (props: Record<string, unknown> = {}) => mount(NewsletterSignup, { props: { ...copy, ...props }, attrs: { onSubscribe: () => {} } })
const input = (w: VueWrapper) => w.find('input')
const button = (w: VueWrapper) => w.find('button')
const tokens = (s: string) => s.split(' ').sort()

describe('NewsletterSignup variations', () => {
  describe('defaults keep the original output', () => {
    it('root, form, field, button, title and description keep the original class sets', () => {
      const w = signup()
      expect(w.classes().sort()).toEqual(tokens('flex flex-col gap-4 w-full'))
      expect(w.find('form').classes().sort()).toEqual(tokens('flex w-full gap-2 flex-col sm:flex-row sm:items-start'))
      expect(w.find('h2').classes().sort()).toEqual(tokens('text-balance text-xl font-semibold tracking-tight sm:text-2xl'))
      expect(w.find('[data-slot="newsletter-signup-description"]').classes().sort()).toEqual(tokens('text-pretty text-sm text-muted-foreground sm:text-base'))
      expect(w.find('[data-slot="newsletter-signup-header"]').classes().sort()).toEqual(tokens('flex flex-col gap-2'))
      expect(input(w).classes()).toEqual(expect.arrayContaining(['h-11', 'flex-1', 'text-start', 'rounded-md']))
      expect(button(w).classes()).toEqual(expect.arrayContaining(['h-11', 'px-6', 'rounded-md', 'shrink-0']))
    })
    it('the other layouts keep their original classes', () => {
      expect(tokens(newsletterSignupVariants({ variant: 'stacked' }))).toEqual(tokens('flex flex-col mx-auto w-full max-w-md items-center text-center gap-4'))
      expect(tokens(newsletterSignupVariants({ variant: 'card' }))).toEqual(tokens('flex flex-col w-full rounded-lg border bg-card text-card-foreground gap-4 p-6 sm:p-8'))
    })
    it('reports the default dimensions as data attributes', () => {
      const w = signup()
      expect([w.attributes('data-variant'), w.attributes('data-size'), w.attributes('data-shape')]).toEqual(['inline', 'md', 'rounded'])
    })
  })

  describe('variant: split', () => {
    it('is a two-column grid from lg with the copy left and the form right', () => {
      const w = signup({ variant: 'split' })
      expect(w.attributes('data-variant')).toBe('split')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'w-full', 'items-start', 'gap-4', 'lg:grid-cols-2', 'lg:gap-x-10']))
      expect(w.classes()).not.toContain('flex')
      expect(w.find('[data-slot="newsletter-signup-header"]').classes()).toEqual(expect.arrayContaining(['lg:col-start-1', 'lg:row-span-3', 'lg:row-start-1']))
      expect(w.find('form').classes()).toEqual(expect.arrayContaining(['lg:col-start-2', 'flex-col', 'sm:flex-row']))
    })
    it('keeps the DOM order copy, form, messages', async () => {
      const w = signup({ variant: 'split', status: 'success' })
      const order = Array.from((w.element as Element).children).map((c) => c.getAttribute('data-slot'))
      expect(order).toEqual(['newsletter-signup-header', 'newsletter-signup-form', 'newsletter-signup-status'])
      await input(w).setValue('bad')
      await w.find('form').trigger('submit')
      const next = Array.from((w.element as Element).children).map((c) => c.getAttribute('data-slot'))
      expect(next).toEqual(['newsletter-signup-header', 'newsletter-signup-form', 'newsletter-signup-error', 'newsletter-signup-status'])
    })
    it('error and status messages sit in the form column', async () => {
      const w = signup({ variant: 'split', status: 'success' })
      expect(w.find('[data-slot="newsletter-signup-status"]').classes()).toContain('lg:col-start-2')
      await input(w).setValue('bad')
      await w.find('form').trigger('submit')
      expect(w.find('[data-slot="newsletter-signup-error"]').classes()).toContain('lg:col-start-2')
    })
    it('without any copy the form is not pushed to the right column', () => {
      const w = signup({ variant: 'split', title: undefined, description: undefined })
      expect(w.find('[data-slot="newsletter-signup-header"]').exists()).toBe(false)
      expect(w.find('form').classes()).not.toContain('lg:col-start-2')
    })
    it('title and description slots count as copy', () => {
      const w = mount(NewsletterSignup, { props: { variant: 'split' }, attrs: { onSubscribe: () => {} }, slots: { title: 'Slot title' } })
      expect(w.find('form').classes()).toContain('lg:col-start-2')
    })
    it('other layouts never get the column classes', () => {
      for (const variant of ['inline', 'stacked', 'card'] as const) {
        const w = signup({ variant })
        expect(w.html()).not.toContain('lg:col-start')
      }
      expect(newsletterSignupHeaderVariants()).toBe('flex flex-col gap-2')
      expect(newsletterSignupSideVariants({ variant: 'split', header: false })).toBe('')
      expect(newsletterSignupFormVariants({ variant: 'split' })).toContain('sm:flex-row')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'gap-3', 'h-9', 'text-lg'],
      ['md', 'gap-4', 'h-11', 'text-xl'],
      ['lg', 'gap-5', 'h-12', 'text-2xl'],
    ] as const)('%s: root %s, controls %s, title %s', (size, gap, h, title) => {
      const w = signup({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toContain(gap)
      expect(input(w).classes()).toContain(h)
      expect(input(w).classes().filter((c) => /^h-\d/.test(c))).toHaveLength(1)
      expect(button(w).classes()).toContain(h)
      expect(button(w).classes().filter((c) => /^h-\d/.test(c))).toHaveLength(1)
      expect(w.find('h2').classes()).toContain(title)
    })
    it('the description scales with the size', () => {
      expect(signup({ size: 'sm' }).find('[data-slot="newsletter-signup-description"]').classes()).toEqual(expect.arrayContaining(['text-sm']))
      expect(signup({ size: 'sm' }).find('[data-slot="newsletter-signup-description"]').classes()).not.toContain('sm:text-base')
      expect(signup({ size: 'lg' }).find('[data-slot="newsletter-signup-description"]').classes()).toEqual(expect.arrayContaining(['text-base', 'sm:text-lg']))
      expect(newsletterSignupTitleVariants({ size: 'lg' })).toContain('sm:text-3xl')
      expect(newsletterSignupDescriptionVariants({ size: 'lg' })).toContain('text-base')
    })
    it('the card padding follows the size', () => {
      expect(signup({ variant: 'card', size: 'sm' }).classes()).toEqual(expect.arrayContaining(['p-4', 'sm:p-6']))
      expect(signup({ variant: 'card', size: 'md' }).classes()).toEqual(expect.arrayContaining(['p-6', 'sm:p-8']))
      expect(signup({ variant: 'card', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['p-8', 'sm:p-10']))
      expect(signup({ variant: 'inline', size: 'lg' }).classes().some((c) => /^p-\d/.test(c))).toBe(false)
    })
    it('every size keeps 16px field text on small screens and the 44px touch minimum', () => {
      for (const size of NEWSLETTER_SIZES) {
        expect(input(signup({ size })).classes().some((c) => c === 'text-md' || c.startsWith('text-md'))).toBe(true)
        const coarse = size === 'sm' ? ['pointer-coarse:min-h-11'] : []
        expect(input(signup({ size })).classes()).toEqual(expect.arrayContaining(coarse))
        expect(button(signup({ size })).classes()).toEqual(expect.arrayContaining(coarse))
      }
    })
    it('unknown values fall back to md', () => {
      for (const size of ['xl', '', 'LG', 2, null]) {
        const w = signup({ size })
        expect(w.attributes('data-size')).toBe('md')
        expect(input(w).classes()).toContain('h-11')
      }
    })
  })

  describe('shape', () => {
    it.each([
      ['rounded', 'rounded-md', 'rounded-md'],
      ['pill', 'rounded-full', 'rounded-full'],
      ['square', 'rounded-none', 'rounded-none'],
    ] as const)('%s uses %s on the field and %s on the button', (shape, field, btn) => {
      const w = signup({ shape })
      expect(w.attributes('data-shape')).toBe(shape)
      expect(input(w).classes()).toContain(field)
      expect(input(w).classes().filter((c) => /^rounded-/.test(c))).toHaveLength(1)
      expect(button(w).classes()).toContain(btn)
      expect(button(w).classes().filter((c) => /^rounded-/.test(c))).toHaveLength(1)
    })
    it('pill widens the inline padding of the field only', () => {
      expect(input(signup({ shape: 'pill' })).classes()).toContain('px-5')
      expect(input(signup({ shape: 'pill' })).classes()).not.toContain('px-3')
      expect(input(signup({ shape: 'rounded' })).classes()).toContain('px-3')
    })
    it('the field keeps its border, focus ring and invalid styling in every shape', () => {
      for (const shape of NEWSLETTER_SHAPES) {
        const c = input(signup({ shape })).classes()
        expect(c).toEqual(expect.arrayContaining(['border', 'border-input', 'focus-visible:ring-3', 'aria-invalid:border-destructive', 'forced-colors:aria-invalid:border-dashed']))
      }
    })
    it('the card surface keeps its own radius whatever the shape', () => {
      for (const shape of NEWSLETTER_SHAPES) expect(signup({ variant: 'card', shape }).classes()).toContain('rounded-lg')
    })
    it('unknown values fall back to rounded', () => {
      const w = signup({ shape: 'oval' })
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(input(w).classes()).toContain('rounded-md')
      expect(newsletterSignupFieldVariants({ shape: 'pill' })).toContain('rounded-full')
      expect(newsletterSignupButtonVariants({ size: 'lg' })).toBe('shrink-0 h-12')
    })
  })

  describe('combinations, overrides and behaviour', () => {
    it('variant x size x shape keeps one label, one email field and one submit button', () => {
      for (const variant of NEWSLETTER_VARIANTS)
        for (const size of NEWSLETTER_SIZES)
          for (const shape of NEWSLETTER_SHAPES) {
            const w = signup({ variant, size, shape })
            expect(w.findAll('input'), `${variant}/${size}/${shape}`).toHaveLength(1)
            expect(w.findAll('label')).toHaveLength(1)
            expect(w.find('label').attributes('for')).toBe(input(w).attributes('id'))
            expect(w.findAll('button[type="submit"]')).toHaveLength(1)
            expect(input(w).attributes('type')).toBe('email')
            expect(w.find('form').attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'))
          }
    })
    it('the class prop wins over variant classes', () => {
      const w = signup({ variant: 'card', size: 'lg', class: 'p-1 custom' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-1', 'custom']))
      expect(w.classes()).not.toContain('p-8')
    })
    it('submit, validation and status still work in the split layout with size and shape', async () => {
      const w = mount(NewsletterSignup, { props: { variant: 'split', size: 'lg', shape: 'pill', ...copy } })
      await input(w).setValue('  jane@example.com ')
      await w.find('form').trigger('submit')
      expect(w.emitted('subscribe')).toEqual([['jane@example.com']])
      await input(w).setValue('bad')
      await w.find('form').trigger('submit')
      expect(input(w).attributes('aria-invalid')).toBe('true')
      expect(w.find('[data-slot="newsletter-signup-error"]').attributes('role')).toBe('alert')
      expect(input(w).attributes('aria-describedby')).toBe(w.find('[data-slot="newsletter-signup-error"]').attributes('id'))
    })
    it('loading keeps the button busy and the input read-only in every size and shape', async () => {
      for (const size of NEWSLETTER_SIZES)
        for (const shape of NEWSLETTER_SHAPES) {
          const w = signup({ size, shape, status: 'loading' })
          expect(button(w).attributes('aria-busy')).toBe('true')
          expect(button(w).attributes('disabled')).toBeDefined()
          expect(input(w).attributes('readonly')).toBeDefined()
        }
    })
    it('success and error keep their live regions in every variant', () => {
      for (const variant of NEWSLETTER_VARIANTS) {
        const ok = signup({ variant, status: 'success' })
        expect(ok.find('[data-slot="newsletter-signup-status"]').attributes('role')).toBe('status')
        expect(ok.find('[data-slot="newsletter-signup-status"]').text()).toBe('Thanks for subscribing!')
        const bad = signup({ variant, status: 'error' })
        expect(bad.find('[data-slot="newsletter-signup-error"]').attributes('role')).toBe('alert')
      }
    })
    it('no variation adds a shadow, gradient or hover lift', () => {
      for (const variant of NEWSLETTER_VARIANTS) {
        const html = signup({ variant, size: 'lg', shape: 'pill' }).find('[data-slot="newsletter-signup-header"]').html()
        expect(html).not.toMatch(/gradient|translate|scale-/)
      }
      expect(newsletterSignupVariants({ variant: 'card', size: 'lg' })).not.toMatch(/shadow|rounded-xl/)
    })
    it('long titles wrap in the split layout', () => {
      const long = 'x'.repeat(300)
      const w = signup({ variant: 'split', title: long })
      expect(w.find('h2').text()).toBe(long)
      expect(w.find('h2').classes()).toContain('text-balance')
    })
  })

  describe('contract stays enforced', () => {
    const t = strictMount()
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => {
      t.reset()
      configureStrictMode('off')
    })
    it('a missing subscribe handler and a blank label still throw with the new props', async () => {
      await t.mount(() => el(NewsletterSignup, { variant: 'split', size: 'sm', shape: 'pill' }))
      expect(t.errors).toHaveLength(1)
      expect(t.errors[0].message).toContain('NewsletterSignup: requires a `@subscribe` handler')
      t.reset()
      await t.mount(() => el(NewsletterSignup, { variant: 'split', size: 'lg', shape: 'square', label: '', onSubscribe: () => {} }))
      // A blank label also leaves the Input without a name; only the component's own report is asserted.
      const own = t.errors.filter((e) => e.message.includes('NewsletterSignup:'))
      expect(own).toHaveLength(1)
      expect(own[0].message).toContain('NewsletterSignup: requires a non-empty `label`')
    })
    it('a handler satisfies the contract in the split layout', async () => {
      await t.mount(() => el(NewsletterSignup, { variant: 'split', ...copy, onSubscribe: () => {} }))
      expect(t.errors).toEqual([])
    })
  })
})
