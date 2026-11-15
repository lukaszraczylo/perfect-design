import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import Banner from './Banner.vue'
import { bannerVariants } from './variants'
import { BANNER_STORAGE_PREFIX, isBannerDismissed, persistBannerDismissal } from './storage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Banner', () => {
  describe('good path', () => {
    it('renders content, data-slot and status role', () => {
      const w = mount(Banner, { slots: { default: 'Maintenance tonight' } })
      expect(w.attributes('data-slot')).toBe('banner')
      expect(w.attributes('role')).toBe('status')
      expect(w.text()).toContain('Maintenance tonight')
    })

    it.each(['default', 'info', 'success', 'warning', 'destructive'] as const)('supports %s variant', (variant) => {
      expect(mount(Banner, { props: { variant } }).attributes('data-variant')).toBe(variant)
    })

    it('warning and destructive use role=alert', () => {
      expect(mount(Banner, { props: { variant: 'warning' } }).attributes('role')).toBe('alert')
      expect(mount(Banner, { props: { variant: 'destructive' } }).attributes('role')).toBe('alert')
    })

    it('renders icon and action slot', () => {
      const w = mount(Banner, { props: { icon: faCircleInfo }, slots: { action: '<button>Go</button>' } })
      expect(w.find('[data-slot="banner-icon"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="banner-action"]').text()).toBe('Go')
    })

    it('omits the action wrapper when there is no action slot', () => {
      expect(mount(Banner).find('[data-slot="banner-action"]').exists()).toBe(false)
    })

    it('sticky adds sticky positioning', () => {
      expect(mount(Banner, { props: { sticky: true } }).classes()).toContain('sticky')
      expect(mount(Banner).classes()).not.toContain('sticky')
    })

    it('dismiss hides and emits once', async () => {
      const w = mount(Banner, { props: { dismissible: true } })
      await w.find('[data-slot="banner-dismiss"]').trigger('click')
      expect(w.emitted('dismiss')).toHaveLength(1)
      expect(w.find('[data-slot="banner"]').exists()).toBe(false)
    })
  })

  describe('persistence', () => {
    it('stores dismissal under storageKey and stays hidden on next mount', async () => {
      const w = mount(Banner, { props: { dismissible: true, storageKey: 'promo' } })
      await w.find('[data-slot="banner-dismiss"]').trigger('click')
      expect(localStorage.getItem(`${BANNER_STORAGE_PREFIX}promo`)).toBe('1')
      const again = mount(Banner, { props: { dismissible: true, storageKey: 'promo' } })
      expect(again.find('[data-slot="banner"]').exists()).toBe(false)
    })

    it('does not persist without storageKey', async () => {
      const w = mount(Banner, { props: { dismissible: true } })
      await w.find('[data-slot="banner-dismiss"]').trigger('click')
      expect(localStorage.length).toBe(0)
      expect(mount(Banner).find('[data-slot="banner"]').exists()).toBe(true)
    })

    it('different keys are independent', async () => {
      persistBannerDismissal('a')
      expect(isBannerDismissed('a')).toBe(true)
      expect(isBannerDismissed('b')).toBe(false)
      expect(isBannerDismissed(undefined)).toBe(false)
      expect(isBannerDismissed('')).toBe(false)
    })

    it('survives a throwing localStorage (privacy mode)', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota')
      })
      const w = mount(Banner, { props: { dismissible: true, storageKey: 'k' } })
      expect(w.find('[data-slot="banner"]').exists()).toBe(true)
      await w.find('[data-slot="banner-dismiss"]').trigger('click')
      expect(w.emitted('dismiss')).toHaveLength(1)
      expect(w.find('[data-slot="banner"]').exists()).toBe(false)
    })

    it('survives an inaccessible window.localStorage getter', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new Error('SecurityError')
      })
      expect(isBannerDismissed('k')).toBe(false)
      expect(() => persistBannerDismissal('k')).not.toThrow()
    })
  })

  describe('customisation', () => {
    it('merges class last', () => {
      const w = mount(Banner, { props: { class: 'px-10 extra' } })
      expect(w.classes()).toContain('extra')
      expect(w.classes()).toContain('px-10')
      expect(w.classes()).not.toContain('px-4')
    })

    it('passes attrs and honours role/dismissLabel props', () => {
      const w = mount(Banner, { props: { dismissible: true, dismissLabel: 'Hide', role: 'note' }, attrs: { id: 'b' } })
      expect(w.attributes('id')).toBe('b')
      expect(w.attributes('role')).toBe('note')
      expect(w.find('[data-slot="banner-dismiss"]').attributes('aria-label')).toBe('Hide')
    })
  })

  describe('bad path and edge cases', () => {
    it('unknown variant falls back to default', () => {
      expect(mount(Banner, { props: { variant: 'nope' as never } }).attributes('data-variant')).toBe('default')
    })

    it('double dismiss emits once', async () => {
      const w = mount(Banner, { props: { dismissible: true } })
      const btn = w.find('[data-slot="banner-dismiss"]')
      await btn.trigger('click')
      ;(btn.element as HTMLButtonElement).click()
      expect(w.emitted('dismiss')).toHaveLength(1)
    })

    it('empty banner and very long unicode text render', () => {
      expect(mount(Banner).find('[data-slot="banner-content"]').text()).toBe('')
      const long = 'ä'.repeat(4000) + ' 🎉 שלום'
      expect(mount(Banner, { slots: { default: long } }).text()).toContain('שלום')
    })
  })

  describe('placement', () => {
    it('default usage is unchanged: top strip, no extra data attributes', () => {
      const w = mount(Banner)
      expect(w.attributes('data-placement')).toBeUndefined()
      expect(w.attributes('data-appearance')).toBeUndefined()
      expect(w.attributes('class')).toBe('relative flex w-full items-center gap-3 px-4 py-2.5 text-sm bg-primary text-primary-foreground')
    })

    it('top + sticky keeps the original sticky classes', () => {
      expect(mount(Banner, { props: { sticky: true } }).classes()).toEqual(expect.arrayContaining(['sticky', 'top-0']))
    })

    it('bottom has a top border and sticky anchors to the bottom edge', () => {
      const w = mount(Banner, { props: { placement: 'bottom' } })
      expect(w.attributes('data-placement')).toBe('bottom')
      expect(w.classes()).toContain('border-t')
      expect(w.classes()).not.toContain('sticky')
      const sticky = mount(Banner, { props: { placement: 'bottom', sticky: true } }).classes()
      expect(sticky).toEqual(expect.arrayContaining(['sticky', 'bottom-0', 'top-auto']))
      expect(sticky).not.toContain('top-0')
    })

    it('floating is fixed, centred, rounded and elevated; sticky is ignored', () => {
      const w = mount(Banner, { props: { placement: 'floating', sticky: true } })
      expect(w.attributes('data-placement')).toBe('floating')
      expect(w.classes()).toEqual(expect.arrayContaining(['fixed', 'bottom-4', 'rounded-lg', 'shadow-lg', 'max-w-2xl', 'left-1/2']))
      expect(w.classes()).not.toContain('sticky')
      expect(w.classes()).not.toContain('relative')
      expect(w.classes()).not.toContain('w-full')
      expect(w.classes()).not.toContain('top-0')
    })

    it('inline is rounded, in-flow and ignores sticky', () => {
      const w = mount(Banner, { props: { placement: 'inline', sticky: true } })
      expect(w.attributes('data-placement')).toBe('inline')
      expect(w.classes()).toContain('rounded-lg')
      expect(w.classes()).not.toContain('sticky')
      expect(w.classes()).toContain('relative')
    })

    it('unknown placement falls back to top', () => {
      const w = mount(Banner, { props: { placement: 'left' as never } })
      expect(w.attributes('data-placement')).toBeUndefined()
      expect(w.classes()).not.toContain('rounded-lg')
    })

    it('bannerVariants works standalone', () => {
      expect(bannerVariants({ placement: 'bottom', sticky: true }).split(' ')).not.toContain('top-0')
      expect(bannerVariants()).toContain('bg-primary')
      expect(bannerVariants({ class: 'px-9' })).toContain('px-9')
    })
  })

  describe('appearance (tones)', () => {
    it.each([
      ['default', 'bg-muted'],
      ['info', 'bg-info/10'],
      ['success', 'bg-success/10'],
      ['warning', 'bg-warning/15'],
      ['destructive', 'bg-destructive/10'],
    ] as const)('soft %s is tinted, not solid', (variant, bg) => {
      const w = mount(Banner, { props: { appearance: 'soft', variant } })
      expect(w.attributes('data-appearance')).toBe('soft')
      expect(w.classes()).toContain(bg)
      expect(w.classes()).toContain('border')
      expect(w.classes()).toContain('text-foreground')
      expect(w.classes()).not.toContain(`bg-${variant === 'default' ? 'primary' : variant}`)
    })

    it('solid keeps the filled tone with its foreground', () => {
      const cls = mount(Banner, { props: { variant: 'info', appearance: 'solid' } }).classes()
      expect(cls).toEqual(expect.arrayContaining(['bg-info', 'text-info-foreground']))
    })

    it('soft keeps role semantics; unknown appearance falls back to solid', () => {
      expect(mount(Banner, { props: { appearance: 'soft', variant: 'warning' } }).attributes('role')).toBe('alert')
      const w = mount(Banner, { props: { appearance: 'glass' as never } })
      expect(w.attributes('data-appearance')).toBeUndefined()
      expect(w.classes()).toContain('bg-primary')
    })

    it('combines placement, appearance and class override', () => {
      const w = mount(Banner, { props: { placement: 'inline', appearance: 'soft', variant: 'info', class: 'rounded-none' } })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })
  })

  describe('call to action', () => {
    it('renders a button for actionLabel and emits action', async () => {
      const w = mount(Banner, { props: { actionLabel: 'Upgrade' } })
      const cta = w.find('[data-slot="banner-cta"]')
      expect(cta.element.tagName).toBe('BUTTON')
      expect(cta.attributes('type')).toBe('button')
      expect(cta.text()).toBe('Upgrade')
      await cta.trigger('click')
      expect(w.emitted('action')).toHaveLength(1)
      expect(w.find('[data-slot="banner-action"]').exists()).toBe(true)
    })

    it('renders a link when actionHref is set', async () => {
      const w = mount(Banner, { props: { actionLabel: 'Read more', actionHref: '/changelog' } })
      const cta = w.find('[data-slot="banner-cta"]')
      expect(cta.element.tagName).toBe('A')
      expect(cta.attributes('href')).toBe('/changelog')
      cta.element.addEventListener('click', (e) => e.preventDefault())
      await cta.trigger('click')
      expect(w.emitted('action')).toHaveLength(1)
    })

    it('the action slot overrides the built-in CTA', () => {
      const w = mount(Banner, { props: { actionLabel: 'Ignored' }, slots: { action: '<i id="mine">x</i>' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.find('[data-slot="banner-cta"]').exists()).toBe(false)
    })

    it('blank or missing actionLabel renders no CTA and no action area', () => {
      expect(mount(Banner, { props: { actionLabel: '   ' } }).find('[data-slot="banner-action"]').exists()).toBe(false)
      expect(mount(Banner, { props: { actionHref: '/x' } }).find('[data-slot="banner-cta"]').exists()).toBe(false)
    })

    it('CTA coexists with dismiss and does not dismiss itself', async () => {
      const w = mount(Banner, { props: { actionLabel: 'Go', dismissible: true } })
      await w.find('[data-slot="banner-cta"]').trigger('click')
      expect(w.emitted('dismiss')).toBeUndefined()
      expect(w.find('[data-slot="banner"]').exists()).toBe(true)
    })

    it('CTA has a visible focus ring and unicode labels render', () => {
      const w = mount(Banner, { props: { actionLabel: 'Ulepsz teraz 🚀 日本語' } })
      expect(w.find('[data-slot="banner-cta"]').classes().join(' ')).toContain('focus-visible:ring-3')
      expect(w.text()).toContain('日本語')
    })
  })

  it('dismiss button and call to action are larger on coarse pointers', () => {
    const w = mount(Banner, { props: { dismissible: true, actionLabel: 'Go' } })
    expect(w.find('[data-slot="banner-dismiss"]').classes()).toEqual(expect.arrayContaining(['-me-2', 'pointer-coarse:size-10']))
    expect(w.find('[data-slot="banner-cta"]').classes()).toContain('pointer-coarse:h-10')
  })
})
