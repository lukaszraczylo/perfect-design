import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DataTable from './DataTable.vue'
import type { DataTableColumn } from './types'

interface Row {
  id: number
  name: string
  plan: string
  seats: number | null
}
const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true, rowHeader: true },
  { key: 'plan', header: 'Plan', sortable: true },
  { key: 'seats', header: 'Seats', sortable: true, numeric: true },
]
const rows = (): Row[] => [
  { id: 1, name: 'Item A', plan: 'Plan 1', seats: 12 },
  { id: 2, name: 'Item B', plan: 'Plan 2', seats: 40 },
  { id: 3, name: 'Item C', plan: 'Plan 3', seats: 3 },
]
type W = VueWrapper<any>
const mnt = (props: Record<string, unknown> = {}) => mount(DataTable as any, { props: { columns, rows: rows(), label: 'Sample data', ...props } }) as W
const table = (w: W) => w.find('table')

describe('DataTable variations', () => {
  describe('default output is unchanged', () => {
    it('keeps the table class, header and cell classes and adds no look attributes or roles', () => {
      const w = mnt()
      expect(table(w).attributes('class')).toBe('group/table w-full caption-bottom border-collapse text-sm')
      expect(table(w).attributes('data-density')).toBe('default')
      for (const a of ['data-size', 'data-variant', 'data-layout', 'data-striped', 'data-bordered', 'role']) expect(table(w).attributes(a), a).toBeUndefined()
      expect(w.find('tbody th').attributes('class')).toContain('h-auto p-3 font-medium whitespace-normal text-foreground')
      expect(w.find('tbody th').attributes('role')).toBeUndefined()
      expect(w.find('[data-slot=table-cell-label]').exists()).toBe(false)
      expect(w.find('tbody td').attributes('class')).toBe('p-3 align-middle group-data-[density=compact]/table:p-2 text-start')
    })
  })

  describe('density', () => {
    it('comfortable reaches the table, header cells, cells and the row header', () => {
      const w = mnt({ density: 'comfortable' })
      expect(table(w).attributes('data-density')).toBe('comfortable')
      expect(w.find('thead th').classes()).toEqual(expect.arrayContaining(['h-12', 'px-4']))
      expect(w.find('tbody td').classes()).toContain('p-4')
      expect(w.find('tbody th').classes()).toContain('p-4')
      expect(w.find('tbody th').classes()).not.toContain('p-3')
    })
    it('compact keeps working and unknown values fall back to default', () => {
      expect(table(mnt({ density: 'compact' })).attributes('data-density')).toBe('compact')
      const w = mnt({ density: 'tight' })
      expect(table(w).attributes('data-density')).toBe('default')
      expect(w.find('tbody th').classes()).toContain('p-3')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-xs'],
      ['lg', 'text-base'],
    ])('%s sets %s on the table, headers and cells', (size, text) => {
      const w = mnt({ size })
      expect(table(w).attributes('data-size')).toBe(size)
      for (const sel of ['table', 'thead th', 'tbody td']) expect(w.find(sel).classes(), sel).toContain(text)
      expect(table(w).classes()).not.toContain('text-sm')
    })
    it('md and unknown values keep the default text size', () => {
      for (const size of ['md', 'huge']) {
        const w = mnt({ size })
        expect(table(w).attributes('class')).toBe('group/table w-full caption-bottom border-collapse text-sm')
        expect(table(w).attributes('data-size')).toBeUndefined()
      }
    })
    it('tableClass wins over the size', () => {
      const w = mnt({ size: 'sm', tableClass: 'text-lg' })
      expect(table(w).classes()).toContain('text-lg')
      expect(table(w).classes()).not.toContain('text-xs')
    })
  })

  describe('variant, striped, bordered', () => {
    it('borderless makes body row rules transparent', () => {
      const w = mnt({ variant: 'borderless' })
      expect(table(w).attributes('data-variant')).toBe('borderless')
      for (const tr of w.findAll('[data-slot=data-table-row]')) expect(tr.classes()).toContain('in-[tbody]:border-transparent')
    })
    it('filled gives the header cells a muted band and keeps the sort buttons', () => {
      const w = mnt({ variant: 'filled' })
      expect(table(w).attributes('data-variant')).toBe('filled')
      expect(w.findAll('thead th').every((th) => th.classes().includes('bg-muted'))).toBe(true)
      expect(w.findAll('thead th button').length).toBe(3)
    })
    it('striped and bordered reach the table and the rows', () => {
      const w = mnt({ striped: true, bordered: true })
      expect(table(w).attributes('data-striped')).toBe('')
      expect(table(w).attributes('data-bordered')).toBe('')
      expect(w.find('[data-slot=data-table-row]').classes()).toContain('in-[tbody]:even:bg-muted/30')
      expect(w.find('[data-slot=table-container]').classes()).toContain('rounded-md')
    })
    it('unknown variant falls back to default', () => {
      const w = mnt({ variant: 'fancy' })
      expect(table(w).attributes('data-variant')).toBeUndefined()
      expect(w.find('[data-slot=data-table-row]').classes()).not.toContain('in-[tbody]:border-transparent')
    })
    it('a column class wins over the header band', () => {
      const w = mount(DataTable as any, { props: { columns: [{ key: 'a', header: 'A', class: 'bg-card' }], rows: [], label: 'x', variant: 'filled' } }) as W
      expect(w.find('th').classes()).toContain('bg-card')
      expect(w.find('th').classes()).not.toContain('bg-muted')
    })
    it('striped, borderless, compact and small text combine', () => {
      const w = mnt({ striped: true, variant: 'borderless', density: 'compact', size: 'sm' })
      const tr = w.find('[data-slot=data-table-row]').classes()
      expect(tr).toEqual(expect.arrayContaining(['in-[tbody]:border-transparent', 'in-[tbody]:even:bg-muted/30']))
      expect(table(w).attributes('data-density')).toBe('compact')
      expect(table(w).attributes('data-size')).toBe('sm')
    })
  })

  describe('layout cards', () => {
    it('labels every cell with its column header, hides labels from assistive tech and keeps table roles', () => {
      const w = mnt({ layout: 'cards' })
      expect(table(w).attributes('role')).toBe('table')
      expect(table(w).attributes('data-layout')).toBe('cards')
      const first = w.find('[data-slot=data-table-row]')
      expect(first.attributes('role')).toBe('row')
      expect(first.find('th').attributes('role')).toBe('rowheader')
      expect(first.find('th').find('[data-slot=table-cell-label]').exists()).toBe(false)
      const labels = first.findAll('[data-slot=table-cell-label]')
      expect(labels.map((l) => l.text())).toEqual(['Plan', 'Seats'])
      for (const l of labels) expect(l.attributes('aria-hidden')).toBe('true')
      expect(first.findAll('[data-slot=table-cell-value]').map((v) => v.text())).toEqual(['Plan 1', '12'])
      expect(w.findAll('thead th').map((th) => th.attributes('role'))).toEqual(['columnheader', 'columnheader', 'columnheader'])
    })
    it('turns the row header into the card title', () => {
      const w = mnt({ layout: 'cards' })
      const c = w.find('tbody th').classes()
      expect(c).toEqual(expect.arrayContaining(['max-sm:p-0', 'max-sm:pb-2', 'max-sm:text-base', 'max-sm:block']))
    })
    it('labels the selection cell and lets it size to content in cards', () => {
      const w = mnt({ layout: 'cards', selectable: true })
      const cell = w.find('[data-slot=data-table-select-row]').element.closest('td')!
      expect(cell.querySelector('[data-slot=table-cell-label]')?.textContent).toBe('Select')
      expect(cell.className).toContain('max-sm:w-auto')
      expect(cell.className).toContain('w-10')
    })
    it('does not add the cards classes to the default layout selection cell', () => {
      const w = mnt({ selectable: true })
      const cell = w.find('[data-slot=data-table-select-row]').element.closest('td')!
      expect(cell.className).not.toContain('max-sm:w-auto')
      expect(cell.querySelector('[data-slot=table-cell-label]')).toBeNull()
    })
    it('sorting still works and the header buttons stay in the accessibility tree', async () => {
      const w = mnt({ layout: 'cards' })
      const btn = w.findAll('thead th')[2]!.find('button')
      await btn.trigger('click')
      expect(w.emitted('update:sort')![0]).toEqual([{ key: 'seats', direction: 'asc' }])
      await nextTick()
      expect(w.findAll('thead th')[2]!.attributes('aria-sort')).toBe('ascending')
      expect(w.find('thead').classes()).toContain('max-sm:sr-only')
      expect(w.find('thead').classes()).toContain('max-sm:focus-within:not-sr-only')
      expect(w.find('[data-slot=data-table-sort-status]').text()).toBe('Sorted by Seats, ascending')
    })
    it('selection works per row and per page', async () => {
      const w = mnt({ layout: 'cards', selectable: true, pageSize: 2 })
      await w.find('[data-slot=data-table-select-row]').setValue(true)
      expect(w.emitted('update:selected')![0]).toEqual([[1]])
      await w.find('[data-slot=data-table-select-all]').setValue(true)
      expect(w.emitted('update:selected')!.at(-1)).toEqual([[1, 2]])
    })
    it('paginates and keeps the pager as a navigation landmark', async () => {
      const w = mnt({ layout: 'cards', pageSize: 2 })
      expect(w.findAll('[data-slot=data-table-row]')).toHaveLength(2)
      const next = w.findAll('nav button').find((b) => b.text() === 'Next')!
      await next.trigger('click')
      expect(w.emitted('update:page')!.at(-1)).toEqual([2])
      expect(w.find('nav').attributes('aria-label')).toBe('Pagination')
    })
    it('renders labelled skeleton cells while loading and sets aria-busy', () => {
      const w = mnt({ layout: 'cards', loading: true, loadingRows: 2, selectable: true })
      expect(table(w).attributes('aria-busy')).toBe('true')
      const skeletonRows = w.findAll('[data-slot=data-table-skeleton-row]')
      expect(skeletonRows).toHaveLength(2)
      expect(skeletonRows[0]!.findAll('[data-slot=table-cell-label]').map((l) => l.text())).toEqual(['Select', 'Name', 'Plan', 'Seats'])
      expect(skeletonRows[0]!.findAll('[data-slot=data-table-skeleton]')).toHaveLength(3)
    })
    it('shows the empty message with table roles when there are no rows', () => {
      const w = mnt({ layout: 'cards', rows: [] })
      const empty = w.find('[data-slot=table-empty]')
      expect(empty.attributes('role')).toBe('row')
      expect(empty.find('td').attributes('role')).toBe('cell')
      expect(empty.text()).toBe('No results')
      expect(empty.find('td').attributes('colspan')).toBe('3')
    })
    it('clickable rows still emit row-click and get the card styling', async () => {
      const w = mnt({ layout: 'cards', rowClickable: true })
      const row = w.find('[data-slot=data-table-row]')
      expect(row.attributes('tabindex')).toBe('0')
      expect(row.classes()).toContain('max-sm:in-[tbody]:rounded-lg')
      await row.trigger('click')
      expect(w.emitted('row-click')![0]![0]).toMatchObject({ id: 1 })
    })
    it('keeps custom cell slots inside the value element', () => {
      const w = mount(DataTable as any, {
        props: { columns, rows: rows(), label: 'x', layout: 'cards' },
        slots: { 'cell-plan': '<strong data-test="slot">custom</strong>' },
      }) as W
      const value = w.find('[data-slot=data-table-row]').findAll('[data-slot=table-cell-value]')[0]!
      expect(value.find('[data-test=slot]').text()).toBe('custom')
    })
    it('handles long header labels and long values', () => {
      const long = 'A very long column header '.repeat(10).trim()
      const w = mount(DataTable as any, { props: { columns: [{ key: 'a', header: long }], rows: [{ id: 1, a: 'x'.repeat(400) }], label: 'x', layout: 'cards' } }) as W
      expect(w.find('[data-slot=table-cell-label]').text()).toBe(long)
      expect(w.find('[data-slot=table-cell-value]').text()).toHaveLength(400)
    })
    it('unknown layout falls back to table', () => {
      const w = mnt({ layout: 'grid' })
      expect(table(w).attributes('data-layout')).toBeUndefined()
      expect(table(w).attributes('role')).toBeUndefined()
      expect(w.find('[data-slot=table-cell-label]').exists()).toBe(false)
    })
    it('the table keeps its accessible name in cards', () => {
      const w = mnt({ layout: 'cards' })
      expect(table(w).attributes('aria-label')).toBe('Sample data')
      expect(w.find('[data-slot=table-container]').attributes('role')).toBe('region')
    })
    it('combines with comfortable density, filled variant and large text', () => {
      const w = mnt({ layout: 'cards', density: 'comfortable', variant: 'filled', size: 'lg' })
      expect(w.find('tbody th').classes()).toEqual(expect.arrayContaining(['p-4', 'max-sm:p-0']))
      expect(w.find('thead th').classes()).toEqual(expect.arrayContaining(['bg-muted', 'text-base', 'max-sm:block']))
      expect(w.find('tbody td').classes()).toEqual(expect.arrayContaining(['p-4', 'text-base', 'max-sm:flex']))
    })
  })
})

describe('DataTable: actions column in cards', () => {
  const cols: DataTableColumn<Row>[] = [...columns, { key: 'actions', header: 'Actions', actions: true, accessor: () => null }]
  const withSlot = (props: Record<string, unknown> = {}) =>
    mount(DataTable as any, {
      props: { columns: cols, rows: rows(), label: 'Sample data', ...props },
      slots: { 'cell-actions': '<button type="button">Rename</button>' },
    }) as W
  const lastCell = (w: W) => w.find('[data-slot=data-table-row]').findAll('td').at(-1)!

  it('cards: no "Actions" label, the control stays, and the cell closes the card with a rule', () => {
    const w = withSlot({ layout: 'cards' })
    const cell = lastCell(w)
    expect(cell.find('[data-slot=table-cell-label]').exists()).toBe(false)
    expect(cell.text()).toBe('Rename')
    expect(cell.classes()).toEqual(expect.arrayContaining(['max-sm:justify-end', 'max-sm:border-t', 'max-sm:pt-2.5']))
    const first = w.find('[data-slot=data-table-row]')
    expect(first.findAll('[data-slot=table-cell-label]').map((l) => l.text())).toEqual(['Plan', 'Seats'])
  })
  it('the header stays in the table header for assistive tech', () => {
    expect(withSlot({ layout: 'cards' }).findAll('thead th').map((th) => th.text())).toContain('Actions')
  })
  it('table layout is unchanged: no label, no card classes', () => {
    const cell = lastCell(withSlot())
    expect(cell.find('[data-slot=table-cell-label]').exists()).toBe(false)
    expect(cell.classes().some((c) => c.startsWith('max-sm:'))).toBe(false)
  })
  it('without the flag the cards layout still labels the column (default unchanged)', () => {
    const w = mount(DataTable as any, { props: { columns: [...columns, { key: 'x', header: 'Extra', accessor: () => 'v' }], rows: rows(), label: 'S', layout: 'cards' } }) as W
    expect(w.find('[data-slot=data-table-row]').findAll('[data-slot=table-cell-label]').map((l) => l.text())).toContain('Extra')
  })
  it('loading skeleton rows do not label the actions column either', () => {
    const w = withSlot({ layout: 'cards', loading: true, loadingRows: 1 })
    const labels = w.find('[data-slot=data-table-skeleton-row]').findAll('[data-slot=table-cell-label]').map((l) => l.text())
    expect(labels).not.toContain('Actions')
    expect(labels).toContain('Plan')
  })
})

describe('DataTable cards row header in compact density', () => {
  it('drops the compact side padding and fixed height so it lines up with the field labels', () => {
    const w = mount(DataTable, {
      props: { layout: 'cards', density: 'compact', rows: [{ id: 1, name: 'Sample row' }], columns: [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'id', header: 'Id' }] },
    })
    const th = w.find('th[scope=row]')
    expect(th.classes()).toEqual(expect.arrayContaining(['max-sm:group-data-[density=compact]/table:px-0', 'group-data-[density=compact]/table:h-auto', 'max-sm:pb-2']))
  })
})
