import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import CookieConsent from './CookieConsent.vue'
import { COOKIE_CONSENT_VARIANTS, cookieConsentActionsVariants, cookieConsentVariants } from './variants'

const categories = [
  { id: 'necessary', label: 'Necessary', necessary: true },
  { id: 'stats', label: 'Statistics' },
]
let wrappers: VueWrapper[] = []
const make = (props: Record<string, unknown> = {}) => {
  const w = mount(CookieConsent, { props: { categories, ...props }, attachTo: document.body })
  wrappers.push(w)
  return w
}
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
})
const panel = () => document.body.querySelector('[data-slot="cookie-consent"]') as HTMLElement
const tokens = (s: string) => s.split(' ').sort()

describe('CookieConsent variations', () => {
  it('documents every variant', () => expect([...COOKIE_CONSENT_VARIANTS]).toEqual(['banner', 'modal', 'inline']))

  describe('defaults keep one stable look', () => {
    it('is the banner: a full-width bordered bar with the categories collapsed', () => {
      make()
      expect(panel().tagName).toBe('SECTION')
      expect(panel().getAttribute('data-variant')).toBe('banner')
      expect(tokens(panel().className)).toEqual(tokens('flex w-full flex-col gap-4 border-y bg-card p-4 text-card-foreground sm:p-6'))
      expect(document.body.querySelector('[data-slot="cookie-consent-categories"]')).toBeNull()
    })
    it('the actions row stacks below sm and wraps from sm', () => {
      expect(tokens(cookieConsentActionsVariants())).toEqual(tokens('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'))
    })
  })

  describe('variant', () => {
    it('inline is a bordered rounded card with the categories always visible', () => {
      make({ variant: 'inline' })
      expect(panel().getAttribute('data-variant')).toBe('inline')
      expect(panel().classList.contains('rounded-lg')).toBe(true)
      expect(panel().classList.contains('border')).toBe(true)
      expect(panel().classList.contains('border-y')).toBe(false)
      expect(document.body.querySelector('[data-slot="cookie-consent-categories"]')).not.toBeNull()
      expect(document.body.querySelector('[data-slot="cookie-consent-manage"]')).toBeNull()
    })
    it('modal renders in a dialog with the categories always visible and a hidden-by-default surface of its own', async () => {
      make({ variant: 'modal' })
      await flushPromises()
      expect(panel().getAttribute('data-variant')).toBe('modal')
      expect(panel().tagName).toBe('DIV')
      expect(panel().closest('[role="dialog"]')).not.toBeNull()
      expect(panel().classList.contains('bg-card')).toBe(false)
      expect(document.body.querySelector('[data-slot="cookie-consent-categories"]')).not.toBeNull()
    })
    it('the three variants differ in markup', async () => {
      const html: string[] = []
      for (const variant of COOKIE_CONSENT_VARIANTS) {
        const w = make({ variant })
        await flushPromises()
        html.push(panel().outerHTML.replace(/ (id|for|aria-[a-z]+)="[^"]*"/g, ''))
        w.unmount()
        wrappers = wrappers.filter((x) => x !== w)
        document.body.innerHTML = ''
      }
      expect(new Set(html).size).toBe(3)
    })
    it('unknown values fall back to banner', () => {
      make({ variant: '__unknown__' })
      expect(panel().getAttribute('data-variant')).toBe('banner')
      expect(tokens(panel().className)).toEqual(tokens(cookieConsentVariants({ variant: 'banner' })))
    })
    it('the exported cva matches the rendered classes for banner and inline', () => {
      for (const variant of ['banner', 'inline'] as const) {
        make({ variant })
        expect(tokens(panel().className)).toEqual(tokens(cookieConsentVariants({ variant })))
        wrappers.pop()!.unmount()
        document.body.innerHTML = ''
      }
    })
    it.each(COOKIE_CONSENT_VARIANTS)('%s keeps accept and reject identical and every target at least 36px high', async (variant) => {
      make({ variant })
      await flushPromises()
      const buttons = [...document.body.querySelectorAll('[data-slot="cookie-consent-actions"] button')]
      const accept = buttons.find((b) => b.getAttribute('data-slot') === 'cookie-consent-accept')!
      const reject = buttons.find((b) => b.getAttribute('data-slot') === 'cookie-consent-reject')!
      expect(accept.className).toBe(reject.className)
      for (const b of buttons) expect(b.className).toMatch(/\bh-9\b/)
    })
  })
})
