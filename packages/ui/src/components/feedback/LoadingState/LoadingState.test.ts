import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from './LoadingState.vue'
import { clampCount } from './count'
import { LOADING_STATE_VARIANTS, loadingStateVariants } from './variants'

const bones = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="loading-state-skeleton"]')

describe('LoadingState', () => {
  describe('good path', () => {
    it('spinner variant: busy status region with spinner and label', () => {
      const w = mount(LoadingState)
      expect(w.attributes('data-slot')).toBe('loading-state')
      expect(w.attributes('role')).toBe('status')
      expect(w.attributes('aria-busy')).toBeUndefined()
      expect(w.attributes('data-variant')).toBe('spinner')
      expect(w.find('svg[data-slot="spinner"]').exists()).toBe(true)
      expect(w.find('[data-slot="loading-state-label"]').text()).toBe('Loading…')
    })

    it('custom label and slot override', () => {
      expect(mount(LoadingState, { props: { label: 'Fetching users' } }).text()).toContain('Fetching users')
      expect(mount(LoadingState, { slots: { default: '<b>Hold on</b>' } }).find('b').exists()).toBe(true)
    })

    it('text variant renders `rows` skeleton lines with an sr-only label', () => {
      const w = mount(LoadingState, { props: { variant: 'text', rows: 4 } })
      expect(bones(w)).toHaveLength(4)
      expect(w.find('[data-slot="loading-state-label"]').classes()).toContain('sr-only')
      expect(w.find('svg[data-slot="spinner"]').exists()).toBe(false)
    })

    it('card variant renders a media block plus lines', () => {
      const w = mount(LoadingState, { props: { variant: 'card', rows: 2 } })
      expect(bones(w)).toHaveLength(3)
    })

    it('table variant renders header + rows x columns', () => {
      const w = mount(LoadingState, { props: { variant: 'table', rows: 3, columns: 5 } })
      expect(w.findAll('[data-slot="loading-state-row"]')).toHaveLength(3)
      expect(bones(w)).toHaveLength(5 + 3 * 5)
    })

    it('fullPage fills the viewport', () => {
      expect(mount(LoadingState, { props: { fullPage: true } }).classes()).toContain('min-h-dvh')
      expect(mount(LoadingState).classes()).not.toContain('min-h-dvh')
      expect(mount(LoadingState, { props: { fullPage: true, variant: 'text' } }).classes()).toContain('max-w-2xl')
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(LoadingState, { props: { class: 'py-2 mine' }, attrs: { id: 'l' } })
      expect(w.classes()).toContain('mine')
      expect(w.classes()).not.toContain('py-12')
      expect(w.attributes('id')).toBe('l')
    })
  })

  describe('bad path', () => {
    it('unknown variant falls back to spinner', () => {
      expect(mount(LoadingState, { props: { variant: 'wat' as never } }).attributes('data-variant')).toBe('spinner')
    })

    it.each([[0, 1], [-5, 1], [Number.NaN, 3], [Infinity, 3], [2.9, 2], [10_000, 50]])('rows=%s renders %s lines', (rows, expected) => {
      expect(bones(mount(LoadingState, { props: { variant: 'text', rows } }))).toHaveLength(expected)
    })

    it('columns are clamped to 1..12', () => {
      expect(mount(LoadingState, { props: { variant: 'table', rows: 1, columns: 999 } }).findAll('[data-slot="loading-state-row"] > *')).toHaveLength(12)
      expect(mount(LoadingState, { props: { variant: 'table', rows: 1, columns: 0 } }).findAll('[data-slot="loading-state-row"] > *')).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('single text row is full width (no short last line)', () => {
      const w = mount(LoadingState, { props: { variant: 'text', rows: 1 } })
      expect(bones(w)[0].classes()).toContain('w-full')
    })

    it('last of several lines is shorter; alternating widths', () => {
      const w = mount(LoadingState, { props: { variant: 'text', rows: 3 } })
      expect(bones(w)[2].classes()).toContain('w-2/3')
      expect(bones(w)[1].classes()).toContain('w-11/12')
    })

    it('unicode / long label', () => {
      const w = mount(LoadingState, { props: { label: 'Ładowanie… ' + 'x'.repeat(2000) + ' 日本語' } })
      expect(w.text()).toContain('日本語')
    })
  })

  describe('LoadingState (continued)', () => {
  describe('extended skeleton shapes', () => {
    const SKELETONS = ['list', 'avatar-text', 'kpi-grid', 'form'] as const

    it('lists every variant', () => {
      expect([...LOADING_STATE_VARIANTS]).toEqual(['spinner', 'text', 'card', 'table', 'list', 'avatar-text', 'kpi-grid', 'form'])
    })

    it.each(SKELETONS)('%s is a busy status region with an sr-only label, aria-hidden bones and no spinner', (variant) => {
      const w = mount(LoadingState, { props: { variant, label: 'Loading stuff' } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.attributes('role')).toBe('status')
      expect(w.attributes('aria-busy')).toBeUndefined()
      expect(w.find('[data-slot="loading-state-label"]').classes()).toContain('sr-only')
      expect(w.find('[data-slot="loading-state-label"]').text()).toBe('Loading stuff')
      expect(w.find('svg[data-slot="spinner"]').exists()).toBe(false)
      expect(bones(w).length).toBeGreaterThan(0)
      for (const b of bones(w)) expect(b.classes()).toEqual(expect.arrayContaining(['animate-pulse', 'motion-reduce:animate-none', 'bg-muted']))
      expect(w.find('[aria-hidden="true"]').exists()).toBe(true)
    })

    it('list renders `rows` rows of marker + line + trailing value', () => {
      const w = mount(LoadingState, { props: { variant: 'list', rows: 4 } })
      expect(w.findAll('[data-slot="loading-state-row"]')).toHaveLength(4)
      expect(bones(w)).toHaveLength(12)
    })

    it('avatar-text renders `rows` avatars (round) with two lines each', () => {
      const w = mount(LoadingState, { props: { variant: 'avatar-text', rows: 2 } })
      expect(w.findAll('[data-slot="loading-state-row"]')).toHaveLength(2)
      expect(bones(w)).toHaveLength(6)
      expect(w.findAll('.rounded-full')).toHaveLength(2)
    })

    it('kpi-grid renders `columns` tiles with three bones each', () => {
      const w = mount(LoadingState, { props: { variant: 'kpi-grid', columns: 3 } })
      expect(w.findAll('[data-slot="loading-state-tile"]')).toHaveLength(3)
      expect(bones(w)).toHaveLength(9)
      expect(mount(LoadingState, { props: { variant: 'kpi-grid' } }).findAll('[data-slot="loading-state-tile"]')).toHaveLength(4)
    })

    it('form renders `rows` fields plus a submit button bone', () => {
      const w = mount(LoadingState, { props: { variant: 'form', rows: 3 } })
      expect(w.findAll('[data-slot="loading-state-field"]')).toHaveLength(3)
      expect(bones(w)).toHaveLength(3 * 2 + 1)
    })

    it('counts are clamped for the new shapes', () => {
      expect(mount(LoadingState, { props: { variant: 'list', rows: 0 } }).findAll('[data-slot="loading-state-row"]')).toHaveLength(1)
      expect(mount(LoadingState, { props: { variant: 'form', rows: 9999 } }).findAll('[data-slot="loading-state-field"]')).toHaveLength(50)
      expect(mount(LoadingState, { props: { variant: 'avatar-text', rows: Number.NaN } }).findAll('[data-slot="loading-state-row"]')).toHaveLength(3)
      expect(mount(LoadingState, { props: { variant: 'kpi-grid', columns: 99 } }).findAll('[data-slot="loading-state-tile"]')).toHaveLength(12)
      expect(mount(LoadingState, { props: { variant: 'kpi-grid', columns: -1 } }).findAll('[data-slot="loading-state-tile"]')).toHaveLength(1)
    })

    it('fullPage constrains width per shape', () => {
      for (const variant of ['list', 'avatar-text', 'form'] as const) {
        const cls = mount(LoadingState, { props: { variant, fullPage: true } }).classes()
        expect(cls).toEqual(expect.arrayContaining(['min-h-dvh', 'max-w-2xl', 'mx-auto']))
      }
      expect(mount(LoadingState, { props: { variant: 'kpi-grid', fullPage: true } }).classes()).toContain('max-w-5xl')
      expect(mount(LoadingState, { props: { variant: 'list' } }).classes()).not.toContain('max-w-2xl')
    })

    it('default slot replaces the sr-only label', () => {
      const w = mount(LoadingState, { props: { variant: 'form' }, slots: { default: '<b>Preparing form</b>' } })
      expect(w.find('[data-slot="loading-state-label"] b').text()).toBe('Preparing form')
    })

    it('class override and attrs work on the new shapes', () => {
      const w = mount(LoadingState, { props: { variant: 'list', class: 'gap-1 mine' }, attrs: { id: 'x' } })
      expect(w.classes()).toContain('gap-1')
      expect(w.classes()).not.toContain('gap-3')
      expect(w.attributes('id')).toBe('x')
    })

    it('loadingStateVariants works standalone for new shapes', () => {
      expect(loadingStateVariants({ variant: 'kpi-grid' })).toContain('flex-col')
      expect(loadingStateVariants({ variant: 'form', fullPage: true })).toContain('max-w-2xl')
      expect(loadingStateVariants({ variant: 'avatar-text' })).toContain('gap-4')
    })
  })
})

describe('clampCount', () => {
    it('handles non-numbers', () => {
      expect(clampCount('5', 3)).toBe(3)
      expect(clampCount(undefined, 3)).toBe(3)
      expect(clampCount(7, 3, 5)).toBe(5)
    })
  })
})
