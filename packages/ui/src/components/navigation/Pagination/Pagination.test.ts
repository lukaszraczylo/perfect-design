import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'
import { clampInt, getPaginationRange } from './index'

const pages = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="pagination-page"]').map((b) => b.text())
const btn = (w: ReturnType<typeof mount>, slot: string) => w.find(`[data-slot="pagination-${slot}"]`)

describe('getPaginationRange', () => {
  it('lists every page when they fit', () => {
    expect(getPaginationRange(1, 1)).toEqual([1])
    expect(getPaginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('collapses the end, the start, and both sides with a constant length', () => {
    expect(getPaginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
    expect(getPaginationRange(20, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20])
    expect(getPaginationRange(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20])
    for (let p = 1; p <= 20; p++) expect(getPaginationRange(p, 20)).toHaveLength(7)
  })
  it('honours siblings and never shows a one-page gap as an ellipsis', () => {
    expect(getPaginationRange(10, 30, 2)).toEqual([1, 'ellipsis-start', 8, 9, 10, 11, 12, 'ellipsis-end', 30])
    expect(getPaginationRange(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10])
    expect(getPaginationRange(1, 10, 0)).toEqual([1, 2, 3, 'ellipsis-end', 10])
  })
  it('sanitises bad input', () => {
    expect(getPaginationRange(Number.NaN, Number.NaN)).toEqual([1])
    expect(getPaginationRange(-5, 3)).toEqual([1, 2, 3])
    expect(getPaginationRange(99, 3)).toEqual([1, 2, 3])
    expect(getPaginationRange(1, 20, Number.NaN)).toHaveLength(7)
  })
  it('clampInt handles non-numbers and infinities', () => {
    expect(clampInt('x', 1, 5, 2)).toBe(2)
    expect(clampInt(Infinity, 1, 5, 9)).toBe(5)
    expect(clampInt(3.9, 1, 5, 1)).toBe(3)
    expect(clampInt(-1, 1, 5, 1)).toBe(1)
  })
})

describe('Pagination', () => {
  describe('good path', () => {
    it('renders a labelled nav with page buttons and data-slots', () => {
      const w = mount(Pagination, { props: { page: 1, total: 50, pageSize: 10 } })
      expect(w.element.tagName).toBe('NAV')
      expect(w.attributes('aria-label')).toBe('Pagination')
      expect(w.attributes('data-slot')).toBe('pagination')
      expect(pages(w)).toEqual(['1', '2', '3', '4', '5'])
    })

    it('marks the current page with aria-current', () => {
      const w = mount(Pagination, { props: { page: 3, total: 50 } })
      const current = w.findAll('[aria-current="page"]')
      expect(current).toHaveLength(1)
      expect(current[0].text()).toBe('3')
      expect(w.find('[data-slot="pagination-page"][aria-label="Page 3"]').exists()).toBe(true)
    })

    it('emits update:page when a page, next, previous, first or last is clicked', async () => {
      const w = mount(Pagination, { props: { page: 3, total: 100 } })
      await w.findAll('[data-slot="pagination-page"]').find((b) => b.text() === '4')!.trigger('click')
      await btn(w, 'next').trigger('click')
      await btn(w, 'prev').trigger('click')
      await btn(w, 'first').trigger('click')
      await btn(w, 'last').trigger('click')
      expect(w.emitted('update:page')!.map((e) => e[0])).toEqual([4, 4, 2, 1, 10])
    })

    it('works uncontrolled with defaultPage', async () => {
      const w = mount(Pagination, { props: { defaultPage: 2, total: 50 } })
      expect(w.find('[aria-current="page"]').text()).toBe('2')
      await btn(w, 'next').trigger('click')
      expect(w.find('[aria-current="page"]').text()).toBe('3')
    })

    it('controlled mode does not move until the parent updates', async () => {
      const w = mount(Pagination, { props: { page: 1, total: 50 } })
      await btn(w, 'next').trigger('click')
      expect(w.find('[aria-current="page"]').text()).toBe('1')
      await w.setProps({ page: 2 })
      expect(w.find('[aria-current="page"]').text()).toBe('2')
    })

    it('renders ellipses for long ranges and a compact summary', () => {
      const w = mount(Pagination, { props: { page: 10, total: 200 } })
      expect(w.findAll('[data-slot="pagination-ellipsis"]')).toHaveLength(2)
      expect(w.find('[data-slot="pagination-summary"]').text()).toBe('Page 10 of 20')
    })

    it('compact mode hides the page list and always shows the summary', () => {
      const w = mount(Pagination, { props: { page: 2, total: 100, compact: true } })
      expect(w.find('[data-slot="pagination-list"]').exists()).toBe(false)
      expect(w.find('[data-slot="pagination-summary"]').classes()).not.toContain('sm:hidden')
      expect(w.attributes('data-compact')).toBeDefined()
    })

    it('showEdges=false removes first/last', () => {
      const w = mount(Pagination, { props: { page: 2, total: 100, showEdges: false } })
      expect(btn(w, 'first').exists()).toBe(false)
      expect(btn(w, 'last').exists()).toBe(false)
    })
  })

  describe('customisation', () => {
    it('merges class and passes attrs', () => {
      const w = mount(Pagination, { props: { page: 1, total: 10, class: 'justify-end custom-x' }, attrs: { id: 'pg' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('justify-end')
      expect(w.classes()).not.toContain('justify-center')
      expect(w.attributes('id')).toBe('pg')
    })

    it('custom labels', () => {
      const w = mount(Pagination, {
        props: { page: 2, total: 100, labels: { nav: 'Seiten', next: 'Weiter', page: 'Seite', summary: '{page}/{total}' } },
      })
      expect(w.attributes('aria-label')).toBe('Seiten')
      expect(btn(w, 'next').attributes('aria-label')).toBe('Weiter')
      expect(w.find('[data-slot="pagination-page"]').attributes('aria-label')).toBe('Seite 1')
      expect(w.find('[data-slot="pagination-summary"]').text()).toBe('2/10')
      expect(btn(w, 'prev').attributes('aria-label')).toBe('Previous page')
    })

    it('siblings widens the window', () => {
      const w = mount(Pagination, { props: { page: 10, total: 300, siblings: 2 } })
      expect(pages(w)).toEqual(['1', '8', '9', '10', '11', '12', '30'])
    })
  })

  describe('bad path', () => {
    it('disables prev/first on page 1 and next/last on the last page', () => {
      const first = mount(Pagination, { props: { page: 1, total: 50 } })
      expect(btn(first, 'prev').attributes('disabled')).toBeDefined()
      expect(btn(first, 'first').attributes('disabled')).toBeDefined()
      expect(btn(first, 'next').attributes('disabled')).toBeUndefined()
      const last = mount(Pagination, { props: { page: 5, total: 50 } })
      expect(btn(last, 'next').attributes('disabled')).toBeDefined()
      expect(btn(last, 'last').attributes('disabled')).toBeDefined()
    })

    it('does not emit from disabled edge buttons', async () => {
      const w = mount(Pagination, { props: { page: 1, total: 50 } })
      await btn(w, 'prev').trigger('click')
      expect(w.emitted('update:page')).toBeUndefined()
    })

    it('clamps an out-of-range page and re-emits the corrected value', () => {
      const high = mount(Pagination, { props: { page: 99, total: 50 } })
      expect(high.find('[aria-current="page"]').text()).toBe('5')
      expect(high.emitted('update:page')![0]).toEqual([5])
      const low = mount(Pagination, { props: { page: -4, total: 50 } })
      expect(low.find('[aria-current="page"]').text()).toBe('1')
      expect(low.emitted('update:page')![0]).toEqual([1])
    })

    it('treats NaN page as 1', () => {
      const w = mount(Pagination, { props: { page: Number.NaN, total: 50 } })
      expect(w.find('[aria-current="page"]').text()).toBe('1')
    })

    it('re-clamps when total shrinks below the current page', async () => {
      const w = mount(Pagination, { props: { page: 8, total: 100 } })
      await w.setProps({ total: 30 })
      expect(w.emitted('update:page')!.at(-1)).toEqual([3])
    })

    it('negative, NaN or missing total gives a single page', () => {
      for (const total of [-10, Number.NaN, undefined]) {
        const w = mount(Pagination, { props: { page: 1, total: total as number } })
        expect(pages(w)).toEqual(['1'])
        expect(btn(w, 'next').attributes('disabled')).toBeDefined()
      }
    })

    it('invalid pageSize falls back to 10', () => {
      for (const pageSize of [0, -5, Number.NaN]) {
        expect(pages(mount(Pagination, { props: { page: 1, total: 30, pageSize } }))).toEqual(['1', '2', '3'])
      }
    })

    it('disabled blocks every control', async () => {
      const w = mount(Pagination, { props: { page: 3, total: 100, disabled: true } })
      for (const b of w.findAll('button')) expect(b.attributes('disabled')).toBeDefined()
      await w.find('[data-slot="pagination-page"]').trigger('click')
      expect(w.emitted('update:page')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('a single page renders one inert button', () => {
      const w = mount(Pagination, { props: { page: 1, total: 5 } })
      expect(pages(w)).toEqual(['1'])
      for (const slot of ['first', 'prev', 'next', 'last']) expect(btn(w, slot).attributes('disabled')).toBeDefined()
    })

    it('1000 pages keep a constant number of buttons', () => {
      const w = mount(Pagination, { props: { page: 500, total: 10000, pageSize: 10 } })
      expect(pages(w)).toEqual(['1', '499', '500', '501', '1000'])
      expect(w.find('[data-slot="pagination-summary"]').text()).toBe('Page 500 of 1000')
    })

    it('clicking the current page does not emit', async () => {
      const w = mount(Pagination, { props: { page: 3, total: 100 } })
      await w.find('[aria-current="page"]').trigger('click')
      expect(w.emitted('update:page')).toBeUndefined()
    })

    it('rapid next clicks uncontrolled stop at the last page', async () => {
      const w = mount(Pagination, { props: { defaultPage: 1, total: 30 } })
      for (let i = 0; i < 10; i++) await btn(w, 'next').trigger('click')
      expect(w.find('[aria-current="page"]').text()).toBe('3')
      expect(w.emitted('update:page')!.map((e) => e[0])).toEqual([2, 3])
    })

    it('fractional page values are truncated', () => {
      expect(mount(Pagination, { props: { page: 2.7, total: 100 } }).find('[aria-current="page"]').text()).toBe('2')
    })

    it('ignores setProps with undefined page after controlled use', async () => {
      const w = mount(Pagination, { props: { page: 2, total: 100 } })
      await w.setProps({ page: undefined })
      expect(w.find('[aria-current="page"]').text()).toBe('2')
    })
  })
})
