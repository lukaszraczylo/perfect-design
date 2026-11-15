import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import Pagination from './Pagination.vue'
import { PAGINATION_SHAPES, PAGINATION_SIZES, PAGINATION_VARIANTS, paginationEllipsisVariants, paginationSummaryVariants } from './index'

const make = (props: Record<string, unknown> = {}) => mount(Pagination, { props: { page: 5, total: 200, pageSize: 10, ...props } })
const slot = (w: ReturnType<typeof make>, name: string) => w.get(`[data-slot="pagination-${name}"]`)
const pages = (w: ReturnType<typeof make>) => w.findAll('[data-slot="pagination-page"]')

describe('Pagination variants', () => {
  describe('variant', () => {
    it('numbered is the default: page buttons, edges, summary hidden from sm up', () => {
      const w = make()
      expect(w.attributes('data-variant')).toBe('numbered')
      expect(w.attributes('data-compact')).toBeUndefined()
      expect(pages(w).length).toBeGreaterThan(0)
      expect(w.find('[data-slot="pagination-first"]').exists()).toBe(true)
      expect(slot(w, 'summary').classes()).toContain('sm:hidden')
      expect(slot(w, 'prev').attributes('aria-label')).toBe('Previous page')
      expect(slot(w, 'prev').classes()).toContain('size-8')
    })

    it('compact shows the summary at every width and drops the page list, like the compact prop', () => {
      const w = make({ variant: 'compact' })
      expect(w.attributes('data-variant')).toBe('compact')
      expect(w.attributes('data-compact')).toBe('')
      expect(pages(w)).toHaveLength(0)
      expect(w.find('[data-slot="pagination-list"]').exists()).toBe(false)
      expect(slot(w, 'summary').classes()).not.toContain('sm:hidden')
      expect(slot(w, 'summary').text()).toBe('Page 5 of 20')
      expect(w.find('[data-slot="pagination-first"]').exists()).toBe(true)
      const legacy = make({ compact: true })
      expect(legacy.attributes('data-compact')).toBe('')
      expect(pages(legacy)).toHaveLength(0)
    })

    it('simple renders text buttons around the summary, with no page or edge buttons', () => {
      const w = make({ variant: 'simple' })
      expect(w.attributes('data-variant')).toBe('simple')
      expect(pages(w)).toHaveLength(0)
      expect(w.find('[data-slot="pagination-first"]').exists()).toBe(false)
      expect(w.find('[data-slot="pagination-last"]').exists()).toBe(false)
      expect(slot(w, 'prev').text()).toBe('Previous page')
      expect(slot(w, 'next').text()).toBe('Next page')
      expect(slot(w, 'prev').classes()).toContain('border')
      expect(slot(w, 'summary').text()).toBe('Page 5 of 20')
      expect(slot(w, 'summary').classes()).not.toContain('sm:hidden')
    })

    it('simple buttons are named by their visible text and use localised labels', () => {
      const w = make({ variant: 'simple', labels: { previous: 'Zurück', next: 'Weiter', summary: 'Seite {page} von {total}' } })
      expect(slot(w, 'prev').attributes('aria-label')).toBeUndefined()
      expect(slot(w, 'prev').text()).toBe('Zurück')
      expect(slot(w, 'next').text()).toBe('Weiter')
      expect(slot(w, 'summary').text()).toBe('Seite 5 von 20')
    })

    it('simple still pages, clamps at both ends and disables the right button', async () => {
      const w = make({ variant: 'simple', page: undefined, defaultPage: 1, total: 30 })
      expect(slot(w, 'prev').attributes('disabled')).toBeDefined()
      await slot(w, 'next').trigger('click')
      await slot(w, 'next').trigger('click')
      expect(slot(w, 'summary').text()).toBe('Page 3 of 3')
      expect(slot(w, 'next').attributes('disabled')).toBeDefined()
      expect(w.emitted('update:page')).toEqual([[2], [3]])
    })

    it('simple moves focus to Previous when Next disables on the last page', async () => {
      const w = mount(Pagination, { props: { defaultPage: 2, total: 30, variant: 'simple' }, attachTo: document.body })
      const next = slot(w, 'next').element as HTMLButtonElement
      next.focus()
      await slot(w, 'next').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(document.activeElement).toBe(slot(w, 'prev').element)
      w.unmount()
    })

    it('simple ignores showEdges and does not require edge labels', () => {
      configureStrictMode('throw')
      try {
        expect(() => make({ variant: 'simple', showEdges: true, labels: { first: '', last: '' } })).not.toThrow()
      } finally {
        configureStrictMode('off')
      }
    })

    it('an unknown variant falls back to numbered', () => {
      const w = make({ variant: 'fancy' })
      expect(w.attributes('data-variant')).toBe('numbered')
      expect(pages(w).length).toBeGreaterThan(0)
    })

    it('each variant renders different markup', () => {
      expect(new Set(PAGINATION_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(3)
    })

    it('the compact prop wins when combined with another variant', () => {
      const w = make({ variant: 'numbered', compact: true })
      expect(pages(w)).toHaveLength(0)
    })

    it('stays disabled as a whole', () => {
      for (const variant of PAGINATION_VARIANTS) {
        const w = make({ variant, disabled: true })
        for (const b of w.findAll('button')) expect(b.attributes('disabled'), variant).toBeDefined()
      }
    })
  })

  describe('size', () => {
    it('md is the default (32px buttons)', () => {
      const w = make()
      expect(w.attributes('data-size')).toBe('md')
      expect(slot(w, 'prev').classes()).toContain('size-8')
      expect(slot(w, 'summary').classes()).toContain('text-sm')
      expect(paginationSummaryVariants()).toBe('px-2 text-sm text-muted-foreground tabular-nums')
      expect(paginationEllipsisVariants()).toBe('inline-flex size-8 items-center justify-center text-muted-foreground')
    })

    it('sm uses 24px buttons that still grow on coarse pointers', () => {
      const w = make({ size: 'sm' })
      expect(w.attributes('data-size')).toBe('sm')
      for (const b of [slot(w, 'prev'), slot(w, 'next'), ...pages(w)]) {
        expect(b.classes()).toContain('size-6')
        expect(b.classes()).toContain('pointer-coarse:size-10')
      }
      expect(slot(w, 'summary').classes()).toContain('text-xs')
      expect(slot(w, 'summary').classes()).not.toContain('text-sm')
    })

    it('lg uses 44px buttons and larger text', () => {
      const w = make({ size: 'lg' })
      for (const b of [slot(w, 'prev'), slot(w, 'first'), ...pages(w)]) expect(b.classes()).toContain('size-11')
      expect(slot(w, 'summary').classes()).toContain('text-base')
    })

    it('scales the ellipsis placeholder with the buttons', () => {
      expect(mount(Pagination, { props: { page: 10, total: 1000, size: 'sm' } }).get('[data-slot="pagination-ellipsis"]').classes()).toContain('size-6')
      const lg = mount(Pagination, { props: { page: 10, total: 1000, size: 'lg' } }).get('[data-slot="pagination-ellipsis"]')
      expect(lg.classes()).toContain('size-11')
      expect(lg.classes()).not.toContain('size-8')
      expect(lg.attributes('aria-hidden')).toBe('true')
    })

    it('simple text buttons scale xs / sm / md', () => {
      expect(slot(make({ variant: 'simple', size: 'sm' }), 'prev').classes()).toContain('h-6')
      expect(slot(make({ variant: 'simple', size: 'md' }), 'prev').classes()).toContain('h-8')
      expect(slot(make({ variant: 'simple', size: 'lg' }), 'prev').classes()).toContain('h-9')
    })

    it('unknown size falls back to md and every size differs', () => {
      expect(make({ size: 'xl' }).attributes('data-size')).toBe('md')
      expect(slot(make({ size: 'xl' }), 'prev').classes()).toContain('size-8')
      expect(new Set(PAGINATION_SIZES.map((size) => make({ size }).html())).size).toBe(3)
    })
  })

  describe('shape', () => {
    it('rounded is the default (rounded-md)', () => {
      const w = make()
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(slot(w, 'prev').classes()).toContain('rounded-md')
    })

    it('pill and square change every button', () => {
      const pill = make({ shape: 'pill' })
      for (const b of pill.findAll('button')) expect(b.classes(), b.html()).toContain('rounded-full')
      const square = make({ shape: 'square' })
      for (const b of square.findAll('button')) expect(b.classes()).toContain('rounded-none')
      expect(square.attributes('data-shape')).toBe('square')
    })

    it('applies to the simple variant buttons too', () => {
      expect(slot(make({ variant: 'simple', shape: 'pill' }), 'next').classes()).toContain('rounded-full')
    })

    it('unknown shape falls back to rounded', () => {
      const w = make({ shape: 'blob' })
      expect(w.attributes('data-shape')).toBe('rounded')
      expect(slot(w, 'prev').classes()).toContain('rounded-md')
      expect(new Set(PAGINATION_SHAPES.map((shape) => slot(make({ shape }), 'prev').classes().join(' '))).size).toBe(3)
    })
  })

  describe('combinations', () => {
    it.each([
      ['simple', 'sm', 'pill'],
      ['compact', 'lg', 'square'],
      ['numbered', 'lg', 'pill'],
      ['numbered', 'sm', 'square'],
    ])('%s + %s + %s keep every dimension and the nav name', (variant, size, shape) => {
      const w = make({ variant, size, shape })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.attributes('data-size')).toBe(size)
      expect(w.attributes('data-shape')).toBe(shape)
      expect(w.attributes('aria-label')).toBe('Pagination')
      expect(w.get('[data-slot="pagination-summary"]').attributes('aria-live')).toBe('polite')
    })

    it('class on the nav wins and the row keeps wrapping for reflow at 320px', () => {
      const w = make({ class: 'justify-end custom-x' })
      expect(w.classes()).toContain('justify-end')
      expect(w.classes()).not.toContain('justify-center')
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('flex-wrap')
    })

    it('page buttons keep tabular numbers and current-page semantics in every size', () => {
      for (const size of PAGINATION_SIZES) {
        const w = make({ size })
        const current = pages(w).find((p) => p.attributes('aria-current') === 'page')!
        expect(current.text()).toBe('5')
        expect(current.classes()).toContain('tabular-nums')
        expect(current.attributes('aria-label')).toBe('Page 5')
      }
    })

    it('handles one page and an empty list in every variant', () => {
      for (const variant of PAGINATION_VARIANTS) {
        const w = make({ variant, total: 0, page: 1 })
        expect(w.get('[data-slot="pagination-summary"]').text()).toBe('Page 1 of 1')
        expect(w.get('[data-slot="pagination-next"]').attributes('disabled')).toBeDefined()
      }
    })
  })
})
