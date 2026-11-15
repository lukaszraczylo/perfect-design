import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import DataTable from './DataTable.vue'
import SortHeaderButton from './SortHeaderButton.vue'
import type { DataTableColumn, SortState } from './types'

interface Person {
  id: number | string | null | undefined
  name: string
  age: number | null | undefined
  joined?: Date
}

const columns: DataTableColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'right', width: '6rem' },
  { key: 'joined', header: 'Joined', class: 'text-xs' },
]
const people = (): Person[] => [
  { id: 1, name: 'Carol', age: 41, joined: new Date(2020, 0, 5) },
  { id: 2, name: 'alice', age: 30 },
  { id: 3, name: 'Bob', age: null },
  { id: 4, name: 'dave', age: 30 },
]

type AnyWrapper = VueWrapper<any>
const names = (w: AnyWrapper) => w.findAll('[data-slot=data-table-row]').map((r) => r.findAll('td').find((td) => !td.find('input').exists())!.text())
const bodyRows = (w: AnyWrapper) => w.findAll('[data-slot=data-table-row]')
const headBtn = (w: AnyWrapper, i: number) => w.findAll('th')[i]!.find('button')
const mnt = (props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
  mount(DataTable as any, { props: { columns, rows: people(), ...props }, ...extra }) as AnyWrapper

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('DataTable', () => {
  describe('good path', () => {
    it('renders root, table, headers and rows', () => {
      const w = mnt()
      expect(w.attributes('data-slot')).toBe('data-table')
      expect(w.find('table').attributes('data-slot')).toBe('table')
      expect(w.findAll('th').map((t) => t.text())).toEqual(['Name', 'Age', 'Joined'])
      expect(names(w)).toEqual(['Carol', 'alice', 'Bob', 'dave'])
      expect(w.findAll('th')[1]!.attributes('style')).toContain('width: 6rem')
      expect(w.findAll('th')[1]!.classes()).toContain('text-end')
      expect(w.find('[data-slot=data-table-pager]').exists()).toBe(false)
    })

    it('formats null as nullText, Dates via toLocaleDateString, others via String', () => {
      const w = mnt({ nullText: 'n/a' })
      const rows = bodyRows(w)
      expect(rows[2]!.findAll('td')[1]!.text()).toBe('n/a')
      expect(rows[0]!.findAll('td')[2]!.text()).toBe(new Date(2020, 0, 5).toLocaleDateString())
      expect(rows[0]!.findAll('td')[1]!.text()).toBe('41')
      expect(rows[1]!.findAll('td')[2]!.text()).toBe('n/a')
    })

    it('invalid Date renders nullText', () => {
      const w = mnt({ rows: [{ id: 1, name: 'x', age: 1, joined: new Date('x') }] })
      expect(w.findAll('td')[2]!.text()).toBe('–')
    })

    it('accessor overrides row[key]', () => {
      const w = mnt({ columns: [{ key: 'name', header: 'N', accessor: (r: Person) => r.name.toUpperCase() }] })
      expect(names(w)[0]).toBe('CAROL')
    })

    it('caption and label props', () => {
      const w = mnt({ caption: 'People list', label: 'People' })
      expect(w.find('caption').text()).toBe('People list')
      expect(w.find('caption').classes()).toContain('sr-only')
      expect(w.find('table').attributes('aria-label')).toBe('People')
    })

    it('density, stickyHeader, containerClass, tableClass reach the Table', () => {
      const w = mnt({ density: 'compact', stickyHeader: true, containerClass: 'max-h-96', tableClass: 'bg-card', class: 'mt-8' })
      expect(w.find('table').attributes('data-density')).toBe('compact')
      expect(w.find('table').attributes('data-sticky')).toBeDefined()
      expect(w.find('[data-slot=table-container]').classes()).toContain('max-h-96')
      expect(w.find('table').classes()).toContain('bg-card')
      expect(w.classes()).toContain('mt-8')
    })

    it('footer slot renders in tfoot; absent otherwise', () => {
      expect(mnt().find('tfoot').exists()).toBe(false)
      const w = mnt({}, { slots: { footer: () => h('tr', [h('td', 'Totals')]) } })
      expect(w.find('tfoot').text()).toBe('Totals')
    })
  })

  describe('cell and header slots', () => {
    it('cell-<key> overrides, generic cell is a fallback, with scoped props', () => {
      const cellName = vi.fn()
      const w = mnt(
        {},
        {
          slots: {
            'cell-name': (p: any) => {
              cellName(p)
              return h('b', { class: 'n' }, p.value)
            },
            cell: (p: any) => h('i', `${p.column.key}:${p.index}`),
          },
        },
      )
      expect(w.findAll('b.n').map((b) => b.text())).toEqual(['Carol', 'alice', 'Bob', 'dave'])
      expect(w.findAll('i')[0]!.text()).toBe('age:0')
      expect(cellName.mock.calls[0]![0]).toMatchObject({ row: { id: 1 }, index: 0, column: { key: 'name' } })
    })

    it('slot index is the source index even after sorting', async () => {
      const w = mnt({ sort: { key: 'name', direction: 'desc' } }, { slots: { 'cell-name': (p: any) => `${p.value}@${p.index}` } })
      expect(names(w)[0]).toBe('dave@3')
    })

    it('header-<key> replaces label, also inside the sort button', () => {
      const w = mnt({}, { slots: { 'header-name': (p: any) => h('em', `Custom ${p.column.header}`), 'header-joined': () => 'When' } })
      expect(headBtn(w, 0).find('em').text()).toBe('Custom Name')
      expect(w.findAll('th')[2]!.text()).toBe('When')
    })
  })

  describe('sorting', () => {
    it('is not applied by default and non-sortable headers have no button/aria-sort', () => {
      const w = mnt()
      expect(w.findAll('th')[2]!.find('button').exists()).toBe(false)
      expect(w.findAll('th')[2]!.attributes('aria-sort')).toBeUndefined()
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBeUndefined()
    })

    it('cycles asc -> desc -> none (uncontrolled) with aria-sort and emits', async () => {
      const w = mnt()
      await headBtn(w, 0).trigger('click')
      expect(names(w)).toEqual(['alice', 'Bob', 'Carol', 'dave'])
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBe('ascending')
      expect(headBtn(w, 0).attributes('data-direction')).toBe('asc')
      await headBtn(w, 0).trigger('click')
      expect(names(w)).toEqual(['dave', 'Carol', 'Bob', 'alice'])
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBe('descending')
      await headBtn(w, 0).trigger('click')
      expect(names(w)).toEqual(['Carol', 'alice', 'Bob', 'dave'])
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBeUndefined()
      expect(w.emitted('update:sort')).toEqual([[{ key: 'name', direction: 'asc' }], [{ key: 'name', direction: 'desc' }], [null]])
    })

    it('stable ties and nulls last in both directions', async () => {
      const w = mnt()
      await headBtn(w, 1).trigger('click')
      expect(names(w)).toEqual(['alice', 'dave', 'Carol', 'Bob'])
      await headBtn(w, 1).trigger('click')
      expect(names(w)).toEqual(['Carol', 'alice', 'dave', 'Bob'])
    })

    it('clicking another column restarts at asc', async () => {
      const w = mnt()
      await headBtn(w, 0).trigger('click')
      await headBtn(w, 1).trigger('click')
      expect(w.emitted('update:sort')!.at(-1)).toEqual([{ key: 'age', direction: 'asc' }])
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBeUndefined()
    })

    it('initial sort via prop (uncontrolled start) applies', () => {
      const w = mnt({ sort: { key: 'age', direction: 'desc' } })
      expect(names(w)[0]).toBe('Carol')
    })

    it('fully controlled: parent owns state; unchanged when parent ignores update', async () => {
      const w = mnt({ sort: null, 'onUpdate:sort': () => {} })
      await headBtn(w, 0).trigger('click')
      expect(names(w)).toEqual(['Carol', 'alice', 'Bob', 'dave'])
      expect(w.emitted('update:sort')).toHaveLength(1)
      await w.setProps({ sort: { key: 'name', direction: 'asc' } })
      expect(names(w)[0]).toBe('alice')
    })

    it('v-model:sort in a parent', async () => {
      const sort = ref<SortState | null>({ key: 'name', direction: 'desc' })
      const Parent = defineComponent({
        setup: () => () =>
          h(DataTable as any, { columns, rows: people(), sort: sort.value, 'onUpdate:sort': (v: SortState | null) => (sort.value = v) }),
      })
      const w = mount(Parent)
      expect(names(w as AnyWrapper)[0]).toBe('dave')
      await w.findAll('th')[0]!.find('button').trigger('click')
      expect(sort.value).toBeNull()
    })

    it('sort key with no matching column falls back to row[key]', () => {
      const w = mnt({ sort: { key: 'id', direction: 'desc' } })
      expect(names(w)[0]).toBe('dave')
    })

    it('sort uses the column accessor', () => {
      const w = mnt({
        columns: [{ key: 'n', header: 'N', sortable: true, accessor: (r: Person) => r.name.length }],
        sort: { key: 'n', direction: 'asc' },
        rows: [{ id: 1, name: 'ccc', age: 0 }, { id: 2, name: 'a', age: 0 }],
      })
      expect(w.findAll('td').map((t) => t.text())).toEqual(['1', '3'])
    })
  })

  describe('row keys', () => {
    it('duplicate and missing keys render all rows without Vue warnings', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const rows: Person[] = [
        { id: 1, name: 'a', age: 1 },
        { id: 1, name: 'b', age: 2 },
        { id: undefined, name: 'c', age: 3 },
        { id: null, name: 'd', age: 4 },
        { id: 'x', name: 'e', age: 5 },
        { id: 'x', name: 'f', age: 6 },
      ]
      const w = mnt({ rows })
      expect(names(w)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
      expect(warn).not.toHaveBeenCalled()
    })

    it('rowKey as property name and as function', async () => {
      const rows = [{ sku: 'a', name: 'A' }, { sku: 'b', name: 'B' }]
      const cols = [{ key: 'name', header: 'N' }]
      const w1 = mnt({ rows, columns: cols, rowKey: 'sku', selectable: true })
      await w1.findAll('input')[2]!.setValue(true)
      expect(w1.emitted('update:selected')![0]).toEqual([['b']])
      const w2 = mnt({ rows, columns: cols, rowKey: (r: { sku: string }, i: number) => `${r.sku}-${i}`, selectable: true })
      await w2.findAll('input')[1]!.setValue(true)
      expect(w2.emitted('update:selected')![0]).toEqual([['a-0']])
    })

    it('missing key falls back to index for selection', async () => {
      const w = mnt({ rows: [{ id: undefined, name: 'x', age: 1 }, { id: undefined, name: 'y', age: 2 }], selectable: true })
      await w.findAll('input')[2]!.setValue(true)
      expect(w.emitted('update:selected')![0]).toEqual([[1]])
    })
  })

  describe('selection', () => {
    it('renders header + row checkboxes with labels', () => {
      const w = mnt({ selectable: true })
      expect(w.findAll('input[type=checkbox]')).toHaveLength(5)
      expect(w.find('[data-slot=data-table-select-all]').attributes('aria-label')).toBe('Select all rows')
      expect(w.find('[data-slot=data-table-select-row]').attributes('aria-label')).toBe('Select row 1')
      expect(w.findAll('th')).toHaveLength(4)
      expect(mnt().find('input').exists()).toBe(false)
    })

    it('selects/deselects a row (uncontrolled), sets data-state and checked', async () => {
      const w = mnt({ selectable: true })
      const cb = w.findAll('[data-slot=data-table-select-row]')
      await cb[1]!.setValue(true)
      expect(bodyRows(w)[1]!.attributes('data-state')).toBe('selected')
      expect((w.findAll('[data-slot=data-table-select-row]')[1]!.element as HTMLInputElement).checked).toBe(true)
      expect(w.emitted('update:selected')![0]).toEqual([[2]])
      await w.findAll('[data-slot=data-table-select-row]')[1]!.setValue(false)
      expect(bodyRows(w)[1]!.attributes('data-state')).toBeUndefined()
      expect(w.emitted('update:selected')![1]).toEqual([[]])
    })

    it('header checkbox: none -> indeterminate -> all -> none', async () => {
      const w = mnt({ selectable: true })
      const header = () => w.find('[data-slot=data-table-select-all]').element as HTMLInputElement
      expect(header().checked).toBe(false)
      expect(header().indeterminate).toBe(false)
      await w.findAll('[data-slot=data-table-select-row]')[0]!.setValue(true)
      await nextTick()
      expect(header().indeterminate).toBe(true)
      expect(header().checked).toBe(false)
      await w.find('[data-slot=data-table-select-all]').setValue(true)
      expect(w.emitted('update:selected')!.at(-1)).toEqual([[1, 2, 3, 4]])
      await nextTick()
      expect(header().checked).toBe(true)
      expect(header().indeterminate).toBe(false)
      await w.find('[data-slot=data-table-select-all]').setValue(false)
      expect(w.emitted('update:selected')!.at(-1)).toEqual([[]])
      expect(header().checked).toBe(false)
    })

    it('select-all is per page and preserves selections on other pages', async () => {
      const w = mnt({ selectable: true, pageSize: 2, selected: [4] })
      await w.find('[data-slot=data-table-select-all]').setValue(true)
      expect(w.emitted('update:selected')!.at(-1)).toEqual([[4, 1, 2]])
      // go to page 2: only [3] page-selected? id 4 selected -> indeterminate, header not checked
      await w.findAll('button').find((b) => b.text() === 'Next')!.trigger('click')
      await nextTick()
      expect(names(w)).toEqual(['Bob', 'dave'])
      const header = w.find('[data-slot=data-table-select-all]').element as HTMLInputElement
      expect(header.indeterminate).toBe(true)
      await w.find('[data-slot=data-table-select-all]').setValue(true)
      expect(w.emitted('update:selected')!.at(-1)![0]).toEqual(expect.arrayContaining([1, 2, 3, 4]))
      await w.find('[data-slot=data-table-select-all]').setValue(false)
      const last = w.emitted('update:selected')!.at(-1)![0] as number[]
      expect(last).toEqual(expect.arrayContaining([1, 2]))
      expect(last).not.toContain(3)
      expect(last).not.toContain(4)
    })

    it('controlled selected reflects prop and resets DOM when parent ignores updates', async () => {
      const w = mnt({ selectable: true, selected: [2], 'onUpdate:selected': () => {} })
      expect(bodyRows(w)[1]!.attributes('data-state')).toBe('selected')
      const cb = w.findAll('[data-slot=data-table-select-row]')[0]!
      ;(cb.element as HTMLInputElement).checked = true
      await cb.trigger('change')
      await nextTick()
      await nextTick()
      expect((cb.element as HTMLInputElement).checked).toBe(false)
      expect(w.emitted('update:selected')![0]).toEqual([[2, 1]])
      await w.setProps({ selected: [1, 2, 3, 4] })
      expect((w.find('[data-slot=data-table-select-all]').element as HTMLInputElement).checked).toBe(true)
    })

    it('header resets after ignored select-all in controlled mode', async () => {
      const w = mnt({ selectable: true, selected: [], 'onUpdate:selected': () => {} })
      const h = w.find('[data-slot=data-table-select-all]')
      ;(h.element as HTMLInputElement).checked = true
      await h.trigger('change')
      await nextTick()
      await nextTick()
      expect((h.element as HTMLInputElement).checked).toBe(false)
    })

    it('no rows -> header checkbox disabled', () => {
      const w = mnt({ selectable: true, rows: [] })
      expect(w.find('[data-slot=data-table-select-all]').attributes('disabled')).toBeDefined()
    })

    it('selected ids not in the rows are kept', async () => {
      const w = mnt({ selectable: true, selected: [99] })
      await w.findAll('[data-slot=data-table-select-row]')[0]!.setValue(true)
      expect(w.emitted('update:selected')![0]).toEqual([[99, 1]])
    })

    it('clicking a checkbox does not fire row-click', async () => {
      const w = mnt({ selectable: true, rowClickable: true })
      await w.findAll('[data-slot=data-table-select-row]')[0]!.trigger('click')
      expect(w.emitted('row-click')).toBeUndefined()
    })
  })

  describe('pagination', () => {
    const many = (n: number): Person[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `n${i + 1}`, age: i }))

    it('shows the page slice, range text, page x of y and nav', async () => {
      const w = mnt({ rows: many(25), pageSize: 10 })
      const nav = w.find('nav')
      expect(nav.attributes('aria-label')).toBe('Pagination')
      expect(nav.attributes('data-slot')).toBe('data-table-pager')
      expect(nav.text()).toContain('Showing 1–10 of 25')
      expect(nav.text()).toContain('Page 1 of 3')
      expect(names(w)).toHaveLength(10)
      const [prev, next] = nav.findAll('button')
      expect(prev!.attributes('disabled')).toBeDefined()
      await next!.trigger('click')
      await next!.trigger('click')
      expect(nav.text()).toContain('Showing 21–25 of 25')
      expect(names(w)).toHaveLength(5)
      expect(nav.findAll('button')[1]!.attributes('disabled')).toBeDefined()
      expect(w.emitted('update:page')).toEqual([[2], [3]])
      await nav.findAll('button')[0]!.trigger('click')
      expect(nav.text()).toContain('Page 2 of 3')
    })

    it('controlled page', async () => {
      const w = mnt({ rows: many(25), pageSize: 10, page: 2, 'onUpdate:page': () => {} })
      expect(names(w)[0]).toBe('n11')
      await w.find('nav').findAll('button')[1]!.trigger('click')
      expect(names(w)[0]).toBe('n11')
      expect(w.emitted('update:page')![0]).toEqual([3])
      await w.setProps({ page: 3 })
      expect(names(w)[0]).toBe('n21')
    })

    it('page beyond range is clamped and emitted', async () => {
      const w = mnt({ rows: many(25), pageSize: 10, page: 99 })
      expect(names(w)[0]).toBe('n21')
      expect(w.emitted('update:page')![0]).toEqual([3])
      expect(w.find('nav').text()).toContain('Page 3 of 3')
    })

    it.each([0, -5, NaN, undefined])('page %s clamps to 1', (p) => {
      const w = mnt({ rows: many(25), pageSize: 10, page: p })
      expect(names(w)[0]).toBe('n1')
    })

    it('page shrinks when rows shrink', async () => {
      const w = mnt({ rows: many(25), pageSize: 10, page: 3 })
      await w.setProps({ rows: many(5) })
      expect(w.emitted('update:page')!.at(-1)).toEqual([1])
      expect(names(w)).toHaveLength(5)
    })

    it.each([undefined, 0, -1, NaN, Infinity, 0.4])('pageSize %s disables pagination', (pageSize) => {
      const w = mnt({ rows: many(25), pageSize })
      expect(w.find('nav').exists()).toBe(false)
      expect(names(w)).toHaveLength(25)
      expect(w.emitted('update:page')).toBeUndefined()
    })

    it('non-integer pageSize is floored', () => {
      const w = mnt({ rows: many(25), pageSize: 10.9 })
      expect(names(w)).toHaveLength(10)
    })

    it('single page: pager shown with both buttons disabled; no pager when empty', () => {
      const w = mnt({ rows: many(3), pageSize: 10 })
      expect(w.find('nav').text()).toContain('Showing 1–3 of 3')
      expect(w.find('nav').findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
      expect(mnt({ rows: [], pageSize: 10 }).find('nav').exists()).toBe(false)
    })

    it('sorts before paging', async () => {
      const w = mnt({ rows: many(25), pageSize: 10, sort: { key: 'age', direction: 'desc' } })
      expect(names(w)[0]).toBe('n25')
    })
  })

  describe('loading and empty', () => {
    it('loading shows skeleton rows, aria-busy and hides data and pager', () => {
      const w = mnt({ loading: true, loadingRows: 3, pageSize: 2 })
      expect(w.findAll('[data-slot=data-table-skeleton-row]')).toHaveLength(3)
      expect(w.findAll('[data-slot=data-table-skeleton]')).toHaveLength(9)
      expect(w.find('[data-slot=data-table-skeleton]').classes()).toEqual(expect.arrayContaining(['bg-muted', 'h-4', 'motion-safe:animate-pulse']))
      expect(w.find('table').attributes('aria-busy')).toBe('true')
      expect(bodyRows(w)).toHaveLength(0)
      expect(w.find('nav').exists()).toBe(false)
      expect(w.find('[data-slot=table-empty]').exists()).toBe(false)
    })

    it('default skeleton count is pageSize, else 5; invalid loadingRows -> 5', () => {
      expect(mnt({ loading: true, pageSize: 4 }).findAll('[data-slot=data-table-skeleton-row]')).toHaveLength(4)
      expect(mnt({ loading: true }).findAll('[data-slot=data-table-skeleton-row]')).toHaveLength(5)
      expect(mnt({ loading: true, loadingRows: -2 }).findAll('[data-slot=data-table-skeleton-row]')).toHaveLength(5)
    })

    it('skeleton includes the checkbox column when selectable', () => {
      const w = mnt({ loading: true, loadingRows: 1, selectable: true })
      expect(w.find('[data-slot=data-table-skeleton-row]').findAll('td')).toHaveLength(4)
    })

    it('not loading -> no aria-busy', () => {
      expect(mnt().find('table').attributes('aria-busy')).toBeUndefined()
    })

    it('empty rows show default text spanning all columns', () => {
      const w = mnt({ rows: [], selectable: true })
      expect(w.find('[data-slot=table-empty]').text()).toBe('No results')
      expect(w.find('[data-slot=table-empty-cell]').attributes('colspan')).toBe('4')
    })

    it('emptyText and empty slot', () => {
      expect(mnt({ rows: [], emptyText: 'Nobody here' }).text()).toContain('Nobody here')
      const w = mnt({ rows: [] }, { slots: { empty: () => h('span', { class: 'custom' }, 'Add someone') } })
      expect(w.find('.custom').text()).toBe('Add someone')
    })
  })

  describe('row click', () => {
    it('is off by default', async () => {
      const w = mnt()
      await bodyRows(w)[0]!.trigger('click')
      expect(w.emitted('row-click')).toBeUndefined()
      expect(bodyRows(w)[0]!.attributes('tabindex')).toBeUndefined()
      expect(bodyRows(w)[0]!.classes()).not.toContain('cursor-pointer')
      await bodyRows(w)[0]!.trigger('keydown', { key: 'Enter' })
      expect(w.emitted('row-click')).toBeUndefined()
    })

    it('emits row-click(row, event) with tabindex and cursor-pointer', async () => {
      const w = mnt({ rowClickable: true })
      const row = bodyRows(w)[1]!
      expect(row.attributes('tabindex')).toBe('0')
      expect(row.classes()).toContain('cursor-pointer')
      await row.find('td').trigger('click')
      const [r, e] = w.emitted('row-click')![0] as [Person, Event]
      expect(r.name).toBe('alice')
      expect(e).toBeInstanceOf(MouseEvent)
    })

    it('ignores clicks from interactive elements inside the row', async () => {
      const w = mnt(
        { rowClickable: true },
        {
          slots: {
            'cell-name': () => [
              h('button', { class: 'b' }, 'edit'),
              h('a', { class: 'a', href: '#' }, 'l'),
              h('span', { class: 'ignore', 'data-no-row-click': '' }, h('i', { class: 'inner' }, 'x')),
              h('span', { class: 'plain' }, 'p'),
            ],
          },
        },
      )
      for (const sel of ['.b', '.a', '.inner']) await w.find(sel).trigger('click')
      expect(w.emitted('row-click')).toBeUndefined()
      await w.find('.plain').trigger('click')
      expect(w.emitted('row-click')).toHaveLength(1)
    })

    it('Enter and Space on the row trigger it; other keys and bubbled keys do not', async () => {
      const w = mnt({ rowClickable: true, selectable: true })
      const row = bodyRows(w)[0]!
      await row.trigger('keydown', { key: 'Enter' })
      await row.trigger('keydown', { key: ' ' })
      await row.trigger('keydown', { key: 'a' })
      await row.find('input').trigger('keydown', { key: 'Enter' })
      expect(w.emitted('row-click')).toHaveLength(2)
      expect((w.emitted('row-click')![0] as unknown[])[1]).toBeInstanceOf(KeyboardEvent)
    })
  })

  describe('bad path and edge cases', () => {
    it('empty columns and rows do not throw', () => {
      expect(() => mnt({ columns: [], rows: [] })).not.toThrow()
      expect(mnt({ columns: [], rows: people() }).findAll('th')).toHaveLength(0)
    })

    it('non-array rows/columns are treated as empty', () => {
      const w = mnt({ rows: null, columns: undefined })
      expect(w.text()).toContain('No results')
    })

    it('single row', () => {
      expect(names(mnt({ rows: [people()[0]] }))).toEqual(['Carol'])
    })

    it('null/undefined rows entries do not crash default accessors', () => {
      const w = mnt({ rows: [null, undefined, { id: 1, name: 'z', age: 1 }], sort: { key: 'name', direction: 'asc' } })
      expect(bodyRows(w)).toHaveLength(3)
      expect(bodyRows(w)[0]!.findAll('td')[0]!.text()).toBe('z')
    })

    it('NaN / Infinity cells display and sort', () => {
      const rows = [{ id: 1, name: 'a', age: NaN }, { id: 2, name: 'b', age: Infinity }, { id: 3, name: 'c', age: -Infinity }]
      const w = mnt({ rows, sort: { key: 'age', direction: 'asc' } })
      expect(names(w)).toEqual(['c', 'b', 'a'])
      expect(bodyRows(w)[2]!.findAll('td')[1]!.text()).toBe('NaN')
    })

    it('unicode and RTL text', () => {
      const rows = [{ id: 1, name: 'مرحبا بالعالم', age: 1 }, { id: 2, name: '日本語 😀', age: 2 }, { id: 3, name: 'שלום', age: 3 }]
      const w = mnt({ rows, sort: { key: 'name', direction: 'asc' } })
      expect(names(w)).toHaveLength(3)
      expect(w.text()).toContain('مرحبا بالعالم')
      expect(w.text()).toContain('😀')
    })

    it('attrs fall through to the root', () => {
      const w = mnt({}, { attrs: { id: 'dt', 'data-test': 'x' } })
      expect(w.attributes('id')).toBe('dt')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('10k rows with pageSize 50 render only one page, fast', () => {
      const rows = Array.from({ length: 10_000 }, (_, i) => ({ id: i, name: `n${i}`, age: (i * 31) % 97 }))
      const t = performance.now()
      const w = mnt({ rows, pageSize: 50, sort: { key: 'age', direction: 'asc' } })
      const ms = performance.now() - t
      expect(bodyRows(w)).toHaveLength(50)
      expect(w.find('nav').text()).toContain('of 10000')
      expect(ms).toBeLessThan(3000)
    })
  })
})

describe('SortHeaderButton', () => {
  it('renders a button with label and decorative icon, emits click', async () => {
    const w = mount(SortHeaderButton, { slots: { default: 'Name' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.attributes('data-slot')).toBe('sort-header-button')
    expect(w.attributes('data-direction')).toBe('none')
    expect(w.text()).toBe('Name')
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('icon changes with direction', () => {
    const icons = (['asc', 'desc', null] as const).map((direction) => {
      const w = mount(SortHeaderButton, { props: { direction } })
      return { d: w.find('path').attributes('d'), faded: w.find('svg').classes().includes('opacity-50') }
    })
    expect(new Set(icons.map((i) => i.d)).size).toBe(3)
    expect(icons.map((i) => i.faded)).toEqual([false, false, true])
  })

  it('align classes, focus ring and class merged last', () => {
    expect(mount(SortHeaderButton, { props: { align: 'right' } }).classes()).toContain('justify-end')
    expect(mount(SortHeaderButton, { props: { align: 'center' } }).classes()).toContain('justify-center')
    expect(mount(SortHeaderButton, { props: { align: 'bogus' as never } }).classes()).toContain('justify-start')
    const w = mount(SortHeaderButton, { props: { class: 'h-12' } })
    expect(w.classes()).toContain('h-12')
    expect(w.classes()).not.toContain('h-8')
    expect(w.classes().join(' ')).toContain('focus-visible:ring-3')
  })

  it('passes attrs', () => {
    expect(mount(SortHeaderButton, { attrs: { 'aria-label': 'Sort by name' } }).attributes('aria-label')).toBe('Sort by name')
  })

  describe('accessibility (WCAG 2.2)', () => {
    const cols: DataTableColumn<Person>[] = [
      { key: 'name', header: 'Name', sortable: true, rowHeader: true },
      { key: 'age', header: 'Age', sortable: true, numeric: true },
      { key: 'joined', header: 'Joined' },
    ]

    it('rowHeader renders the column body cells as <th scope="row">', () => {
      const w = mnt({}, {}) as AnyWrapper
      expect(w.findAll('tbody th')).toHaveLength(0)
      const rh = mount(DataTable as any, { props: { columns: cols, rows: people() } }) as AnyWrapper
      const ths = rh.findAll('tbody th')
      expect(ths).toHaveLength(4)
      expect(ths[0]!.attributes('scope')).toBe('row')
      expect(ths[0]!.text()).toBe('Carol')
      expect(rh.findAll('tbody tr')[0]!.findAll('td')).toHaveLength(2)
    })

    it('numeric columns are right-aligned with tabular figures, in the header too', () => {
      const w = mount(DataTable as any, { props: { columns: cols, rows: people() } }) as AnyWrapper
      const cell = w.findAll('tbody tr')[0]!.findAll('td')[0]!
      expect(cell.classes()).toEqual(expect.arrayContaining(['tabular-nums', 'text-end']))
      expect(w.findAll('thead th')[1]!.classes()).toContain('text-end')
      // align:'right' alone also gets tabular figures
      expect(mnt().findAll('tbody tr')[0]!.findAll('td')[1]!.classes()).toContain('tabular-nums')
      // plain columns do not
      expect(cell.element.parentElement!.querySelectorAll('td')[1]!.classList.contains('tabular-nums')).toBe(false)
    })

    it('only the sorted column has aria-sort; unsorted sortable columns have none', async () => {
      const w = mnt()
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBeUndefined()
      await headBtn(w, 0).trigger('click')
      expect(w.findAll('th')[0]!.attributes('aria-sort')).toBe('ascending')
      expect(w.findAll('th')[1]!.attributes('aria-sort')).toBeUndefined()
      expect(w.html()).not.toContain('aria-sort="none"')
    })

    it('announces the sort in one polite status element and keeps focus on the header button', async () => {
      const w = mnt({}, { attachTo: document.body })
      const status = () => w.find('[data-slot="data-table-sort-status"]')
      expect(status().attributes('role')).toBe('status')
      expect(status().text()).toBe('')
      headBtn(w, 0).element.focus()
      await headBtn(w, 0).trigger('click')
      expect(status().text()).toBe('Sorted by Name, ascending')
      await headBtn(w, 0).trigger('click')
      expect(status().text()).toBe('Sorted by Name, descending')
      expect(document.activeElement).toBe(headBtn(w, 0).element)
      await headBtn(w, 0).trigger('click')
      expect(status().text()).toBe('')
    })

    it('row checkboxes are named after the row header, else the row position', () => {
      const withHeader = mount(DataTable as any, { props: { columns: cols, rows: people(), selectable: true } }) as AnyWrapper
      const boxes = withHeader.findAll('[data-slot=data-table-select-row]')
      expect(boxes.map((b) => b.attributes('aria-label'))).toEqual(['Select Carol', 'Select alice', 'Select Bob', 'Select dave'])
      expect(withHeader.find('[data-slot=data-table-select-all]').attributes('aria-label')).toBe('Select all rows')
      const plain = mnt({ selectable: true, pageSize: 2, page: 2 })
      expect(plain.findAll('[data-slot=data-table-select-row]').map((b) => b.attributes('aria-label'))).toEqual(['Select row 3', 'Select row 4'])
      const empty = mount(DataTable as any, { props: { columns: cols, rows: [{ id: 1, name: null, age: 1 }], selectable: true } }) as AnyWrapper
      expect(empty.find('[data-slot=data-table-select-row]').attributes('aria-label')).toBe('Select row 1')
    })

    it('checkboxes are at least 20px', () => {
      const w = mnt({ selectable: true })
      expect(w.find('[data-slot=data-table-select-row]').classes()).toContain('size-5')
    })

    it('the scroll region is focusable and named by label, else by caption', async () => {
      const labelled = mnt({ label: 'People' })
      await nextTick()
      const c = labelled.find('[data-slot="table-container"]')
      expect(c.attributes('tabindex')).toBe('0')
      expect(c.attributes('role')).toBe('region')
      expect(c.attributes('aria-label')).toBe('People')
      const captioned = mnt({ caption: 'Directory' })
      await nextTick()
      expect(captioned.find('[data-slot="table-container"]').attributes('aria-labelledby')).toBe(captioned.find('caption').attributes('id'))
    })

    it('the pager figures are tabular and the page text is a polite live region', () => {
      const w = mnt({ pageSize: 2 })
      expect(w.find('[data-slot=data-table-pager] p').classes()).toContain('tabular-nums')
      const page = w.find('[data-slot=data-table-pager] span')
      expect(page.classes()).toContain('tabular-nums')
      expect(page.attributes('aria-live')).toBe('polite')
    })

    it('the empty-value placeholder is an en dash, not an em dash', () => {
      expect(mnt().findAll('td')[2]!.text()).toMatch(/\d|–/)
      const w = mount(DataTable as any, { props: { columns: cols, rows: [{ id: 1, name: 'x', age: null }] } }) as AnyWrapper
      expect(w.findAll('td')[0]!.text()).toBe('–')
    })
  })
})
