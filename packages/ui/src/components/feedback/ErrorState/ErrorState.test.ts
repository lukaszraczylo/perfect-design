import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import ErrorState from './ErrorState.vue'
import { ERROR_STATE_PRESETS, getErrorStatePreset } from './presets'
import {
  errorStateActionsVariants,
  errorStateCodeVariants,
  errorStateDetailsVariants,
  errorStateIconVariants,
  errorStateMessageVariants,
  errorStateTitleVariants,
  errorStateVariants,
} from './variants'

const VARIANTS = ['default', 'card', 'inline', 'page'] as const

describe('ErrorState', () => {
  describe('good path', () => {
    it('renders alert with default title, message and retry', () => {
      const w = mount(ErrorState, { props: { message: 'Could not load users' } })
      expect(w.attributes('data-slot')).toBe('error-state')
      expect(w.attributes('role')).toBe('alert')
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Something went wrong')
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('Could not load users')
      expect(w.find('[data-slot="error-state-retry"]').text()).toContain('Try again')
    })

    it('retry emits retry', async () => {
      const w = mount(ErrorState)
      await w.find('[data-slot="error-state-retry"]').trigger('click')
      expect(w.emitted('retry')).toHaveLength(1)
    })

    it('details are collapsible (native <details>) and closed by default', () => {
      const w = mount(ErrorState, { props: { details: 'Error: 500\n  at fetch' } })
      const d = w.find('details[data-slot="error-state-details"]')
      expect(d.exists()).toBe(true)
      expect(d.attributes('open')).toBeUndefined()
      expect(d.find('summary').text()).toBe('Technical details')
      expect(d.find('pre').text()).toContain('at fetch')
    })

    it('custom labels, title, icon, actions slot and default slot', () => {
      const w = mount(ErrorState, {
        props: { title: 'Nope', retryLabel: 'Again', detailsLabel: 'More', details: 'd', icon: faBan },
        slots: { default: '<em>rich</em>', actions: '<a id="home">Home</a>' },
      })
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Nope')
      expect(w.find('[data-slot="error-state-retry"]').text()).toContain('Again')
      expect(w.find('summary').text()).toBe('More')
      expect(w.find('[data-slot="error-state-message"] em').exists()).toBe(true)
      expect(w.find('#home').exists()).toBe(true)
      expect(w.find('[data-slot="error-state-icon"] svg path').attributes('d')).toBe(faBan.icon[4])
    })
  })

  describe('retrying', () => {
    it('shows busy state, disables retry and does not emit', async () => {
      const w = mount(ErrorState, { props: { retrying: true } })
      const btn = w.find('[data-slot="error-state-retry"]')
      expect(w.attributes('aria-busy')).toBeUndefined()
      expect(btn.attributes('disabled')).toBeDefined()
      expect(btn.attributes('aria-busy')).toBe('true')
      await btn.trigger('click')
      expect(w.emitted('retry')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(ErrorState, { props: { class: 'py-2 mine' }, attrs: { id: 'err' } })
      expect(w.classes()).toContain('mine')
      expect(w.classes()).not.toContain('py-12')
      expect(w.attributes('id')).toBe('err')
    })

    it('retryable=false hides the button; actions slot still renders', () => {
      const w = mount(ErrorState, { props: { retryable: false }, slots: { actions: '<b>x</b>' } })
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(false)
      expect(w.find('[data-slot="error-state-actions"] b').exists()).toBe(true)
      expect(mount(ErrorState, { props: { retryable: false } }).find('[data-slot="error-state-actions"]').exists()).toBe(false)
    })
  })

  describe('bad path / edge cases', () => {
    it('empty or whitespace title falls back to the default heading', () => {
      for (const title of ['', '   ']) {
        expect(mount(ErrorState, { props: { title } }).find('[data-slot="error-state-title"]').text()).toBe('Something went wrong')
      }
    })

    it('empty / whitespace details render no details block; no message renders no message', () => {
      expect(mount(ErrorState, { props: { details: '  ' } }).find('details').exists()).toBe(false)
      expect(mount(ErrorState).find('[data-slot="error-state-message"]').exists()).toBe(false)
    })

    it('very long unicode message and details, no html injection', () => {
      const w = mount(ErrorState, { props: { message: 'é'.repeat(3000) + ' 日本語', details: '<script>alert(1)</script>' } })
      expect(w.text()).toContain('日本語')
      expect(w.find('script').exists()).toBe(false)
      expect(w.find('pre').text()).toBe('<script>alert(1)</script>')
    })

    it('rapid retry clicks emit each time (parent controls retrying)', async () => {
      const w = mount(ErrorState)
      const btn = w.find('[data-slot="error-state-retry"]')
      await btn.trigger('click')
      await btn.trigger('click')
      expect(w.emitted('retry')).toHaveLength(2)
    })
  })

  describe('variants', () => {
    it('default usage is unchanged (exact class strings, no data-variant)', () => {
      const w = mount(ErrorState, { props: { message: 'm', details: 'd' }, slots: { actions: '<b>a</b>' } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.attributes('class')).toBe('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center')
      expect(w.find('[data-slot="error-state-icon"]').attributes('class')).toBe('flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive [&_svg]:size-5')
      const title = w.find('[data-slot="error-state-title"]')
      expect(title.element.tagName).toBe('H3')
      expect(title.attributes('class')).toBe('text-base font-semibold tracking-tight break-words')
      expect(w.find('[data-slot="error-state-message"]').attributes('class')).toBe('max-w-md text-sm text-muted-foreground break-words')
      expect(w.find('[data-slot="error-state-actions"]').attributes('class')).toBe('mt-1 flex flex-wrap items-center justify-center gap-2')
      expect(w.find('[data-slot="error-state-details"]').attributes('class')).toBe('w-full max-w-xl text-left')
    })

    it.each(VARIANTS)('%s renders alert role and every part', (variant) => {
      const w = mount(ErrorState, { props: { variant, message: 'm', details: 'd' } })
      expect(w.attributes('role')).toBe('alert')
      expect(w.attributes('data-variant')).toBe(variant === 'default' ? undefined : variant)
      for (const part of ['icon', 'title', 'message', 'actions', 'details']) expect(w.find(`[data-slot="error-state-${part}"]`).exists()).toBe(true)
    })

    it('card is a bordered surface', () => {
      expect(mount(ErrorState, { props: { variant: 'card' } }).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'shadow-xs']))
    })

    it('inline is a left-aligned tinted grid row with retry on the right', () => {
      const w = mount(ErrorState, { props: { variant: 'inline', message: 'm', details: 'd' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'text-left', 'px-4', 'py-3', 'rounded-lg', 'border-destructive/30']))
      expect(w.classes()).not.toContain('py-12')
      expect(w.classes()).not.toContain('text-center')
      expect(w.find('[data-slot="error-state-icon"]').classes()).toEqual(expect.arrayContaining(['size-9', 'row-span-2']))
      expect(w.find('[data-slot="error-state-title"]').classes()).toEqual(expect.arrayContaining(['text-sm', 'col-start-2']))
      expect(w.find('[data-slot="error-state-message"]').classes()).toEqual(expect.arrayContaining(['text-xs', 'col-start-2', 'max-w-none']))
      expect(w.find('[data-slot="error-state-actions"]').classes()).toEqual(expect.arrayContaining(['col-start-3', 'justify-end']))
      expect(w.find('[data-slot="error-state-details"]').classes()).toContain('col-span-full')
    })

    it('page fills the viewport, uses an h1 and bigger type', () => {
      const w = mount(ErrorState, { props: { variant: 'page', message: 'm' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['min-h-dvh', 'py-16']))
      expect(w.classes()).not.toContain('py-12')
      const title = w.find('[data-slot="error-state-title"]')
      expect(title.element.tagName).toBe('H1')
      expect(title.classes()).toContain('text-2xl')
      expect(title.classes()).not.toContain('text-base')
      expect(w.find('[data-slot="error-state-icon"]').classes()).toContain('size-16')
    })

    it('unknown variant falls back to default', () => {
      const w = mount(ErrorState, { props: { variant: 'toast' as never } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('py-12')
    })

    it('class prop overrides variant classes', () => {
      const w = mount(ErrorState, { props: { variant: 'page', class: 'min-h-0 py-4' } })
      expect(w.classes()).toContain('min-h-0')
      expect(w.classes()).not.toContain('min-h-dvh')
      expect(w.classes()).not.toContain('py-16')
    })

    it('retry works in every variant and respects retrying', async () => {
      for (const variant of VARIANTS) {
        const w = mount(ErrorState, { props: { variant } })
        await w.find('[data-slot="error-state-retry"]').trigger('click')
        expect(w.emitted('retry')).toHaveLength(1)
        const busy = mount(ErrorState, { props: { variant, retrying: true } })
        await busy.find('[data-slot="error-state-retry"]').trigger('click')
        expect(busy.emitted('retry')).toBeUndefined()
      }
    })

    it('titleAs overrides the heading element; invalid values fall back', () => {
      expect(mount(ErrorState, { props: { titleAs: 'h2' } }).find('[data-slot="error-state-title"]').element.tagName).toBe('H2')
      expect(mount(ErrorState, { props: { titleAs: 'p' } }).find('[data-slot="error-state-title"]').element.tagName).toBe('P')
      expect(mount(ErrorState, { props: { titleAs: 'script' as never } }).find('[data-slot="error-state-title"]').element.tagName).toBe('H3')
      expect(mount(ErrorState, { props: { variant: 'page', titleAs: 'script' as never } }).find('[data-slot="error-state-title"]').element.tagName).toBe('H1')
    })

    it('standalone helpers return merged strings', () => {
      expect(errorStateVariants({ variant: 'page' })).not.toContain('py-12')
      expect(errorStateVariants()).toContain('py-12')
      expect(errorStateIconVariants({ variant: 'page' })).not.toContain('size-12')
      expect(errorStateTitleVariants({ variant: 'page' })).not.toContain('text-base')
      expect(errorStateMessageVariants({ variant: 'page' })).not.toContain('text-sm')
      expect(errorStateActionsVariants({ variant: 'page' })).not.toContain('mt-1')
      expect(errorStateDetailsVariants({ variant: 'inline' })).not.toContain('max-w-xl')
      expect(errorStateCodeVariants()).toContain('text-5xl')
    })
  })

  describe('status presets (404 / 500 pages)', () => {
    it('404 fills code, title, message and hides retry', () => {
      const w = mount(ErrorState, { props: { status: 404, variant: 'page' } })
      expect(w.find('[data-slot="error-state-code"]').text()).toBe('404')
      expect(w.find('[data-slot="error-state-code"]').classes()).toContain('text-7xl')
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Page not found')
      expect(w.find('[data-slot="error-state-message"]').text()).toContain('does not exist')
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(false)
      expect(w.find('[data-slot="error-state-icon"]').exists()).toBe(false)
    })

    it('500 fills copy and keeps retry', () => {
      const w = mount(ErrorState, { props: { status: '500', variant: 'page' } })
      expect(w.find('[data-slot="error-state-code"]').text()).toBe('500')
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Server error')
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(true)
    })

    it.each(Object.keys(ERROR_STATE_PRESETS))('preset %s is complete', (key) => {
      const p = getErrorStatePreset(key)!
      expect(p.title.length).toBeGreaterThan(3)
      expect(p.message.length).toBeGreaterThan(10)
      const w = mount(ErrorState, { props: { status: Number(key) } })
      expect(w.find('[data-slot="error-state-title"]').text()).toBe(p.title)
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(p.retryable)
    })

    it('explicit props override the preset', () => {
      const w = mount(ErrorState, { props: { status: 404, title: 'Gone', message: 'Custom', code: 'E404', retryable: true } })
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Gone')
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('Custom')
      expect(w.find('[data-slot="error-state-code"]').text()).toBe('E404')
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(true)
    })

    it('blank title falls through to the preset title', () => {
      expect(mount(ErrorState, { props: { status: 404, title: '   ' } }).find('[data-slot="error-state-title"]').text()).toBe('Page not found')
    })

    it('an unknown status shows its code with the generic copy', () => {
      const w = mount(ErrorState, { props: { status: 418 } })
      expect(w.find('[data-slot="error-state-code"]').text()).toBe('418')
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Something went wrong')
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(true)
    })

    it('code alone (no status) replaces the icon in every variant', () => {
      for (const variant of VARIANTS) {
        const w = mount(ErrorState, { props: { variant, code: 'E_TIMEOUT' } })
        expect(w.find('[data-slot="error-state-code"]').text()).toBe('E_TIMEOUT')
        expect(w.find('[data-slot="error-state-icon"]').exists()).toBe(false)
      }
      expect(mount(ErrorState, { props: { variant: 'inline', code: 500 } }).find('[data-slot="error-state-code"]').classes()).toContain('row-span-2')
    })

    it('blank code or null status keep the icon', () => {
      expect(mount(ErrorState, { props: { code: '  ' } }).find('[data-slot="error-state-icon"]').exists()).toBe(true)
      expect(mount(ErrorState, { props: { status: undefined } }).find('[data-slot="error-state-code"]').exists()).toBe(false)
    })

    it('presets ignore inherited object keys and nullish input', () => {
      expect(getErrorStatePreset('constructor')).toBeUndefined()
      expect(getErrorStatePreset('__proto__')).toBeUndefined()
      expect(getErrorStatePreset(null)).toBeUndefined()
      expect(getErrorStatePreset(undefined)).toBeUndefined()
      expect(getErrorStatePreset(404)).toBe(ERROR_STATE_PRESETS['404'])
    })

    it('the default slot still overrides the preset message', () => {
      const w = mount(ErrorState, { props: { status: 404 }, slots: { default: '<em>mine</em>' } })
      expect(w.find('[data-slot="error-state-message"] em').exists()).toBe(true)
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('mine')
    })

    it('actions slot gives a 404 page a way home even without retry', () => {
      const w = mount(ErrorState, { props: { status: 404 }, slots: { actions: '<a id="home" href="/">Home</a>' } })
      expect(w.find('[data-slot="error-state-actions"] #home').exists()).toBe(true)
      expect(w.find('[data-slot="error-state-retry"]').exists()).toBe(false)
    })
  })

describe('ErrorState accessibility', () => {
  it('makes the scrollable details block keyboard focusable and labelled', () => {
    const w = mount(ErrorState, { props: { details: 'GET /x -> 500', detailsLabel: 'Request details' } })
    const pre = w.find('[data-slot="error-state-details"] pre')
    expect(pre.attributes('tabindex')).toBe('0')
    expect(pre.attributes('role')).toBe('region')
    expect(pre.attributes('aria-label')).toBe('Request details')
  })

  it('the status code keeps readable contrast (no opacity modifier) and heading level is configurable', () => {
    expect(errorStateCodeVariants()).not.toContain('/50')
    expect(mount(ErrorState, { props: { variant: 'page', titleAs: 'h2' } }).find('h2').exists()).toBe(true)
    expect(mount(ErrorState, { props: { variant: 'page' } }).find('h1').exists()).toBe(true)
  })
})
})
