import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Table from '../Table/Table.vue'
import TableBody from '../Table/TableBody.vue'
import TableCaption from '../Table/TableCaption.vue'
import TableCell from '../Table/TableCell.vue'
import TableHead from '../Table/TableHead.vue'
import TableHeader from '../Table/TableHeader.vue'
import TableRow from '../Table/TableRow.vue'
import DataTable from './DataTable.vue'
import TableCardControls from './TableCardControls.vue'
import type { DataTableColumn, SortState } from './types'

type AnyWrapper = VueWrapper<any>
const options = [{ key: 'name', label: 'Name' }, { key: 'plan', label: 'Plan' }]
const mnt = (props: Record<string, unknown> = {}) => mount(TableCardControls as any, { props: { options, ...props } }) as AnyWrapper
const select = (w: AnyWrapper) => w.find('select')
const dirBtn = (w: AnyWrapper) => w.find('[data-slot=table-card-controls-direction]')
const box = (w: AnyWrapper) => w.find('input[type=checkbox]')
const status = (w: AnyWrapper) => w.find('[data-slot=table-card-controls-status]')
const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

afterEach(() => {
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('TableCardControls', () => {
  describe('rendering', () => {
    it('renders nothing without sortable options and without selection', () => {
      expect(mnt({ options: [] }).find('[data-slot=table-card-controls]').exists()).toBe(false)
      expect(mnt({ options: undefined }).find('[data-slot=table-card-controls]').exists()).toBe(false)
      expect(mnt({ options: 'nope' }).find('[data-slot=table-card-controls]').exists()).toBe(false)
    })
    it('is visible only below sm and wraps on narrow screens', () => {
      const root = mnt().find('[data-slot=table-card-controls]')
      expect(root.classes()).toEqual(expect.arrayContaining(['sm:hidden', 'flex', 'flex-wrap']))
    })
    it('class wins and attributes fall through', () => {
      const w = mnt({ class: 'mb-8', 'data-x': 'y' })
      const root = w.find('[data-slot=table-card-controls]')
      expect(root.classes()).toContain('mb-8')
      expect(root.attributes('data-x')).toBe('y')
    })
    it('offers the default order and every sortable column, ignoring invalid options', () => {
      const w = mnt({ options: [...options, { key: '', label: 'Empty key' }, null, { label: 'No key' }] })
      expect(select(w).findAll('option').map((o) => [o.attributes('value'), o.text()])).toEqual([['', 'Default order'], ['name', 'Name'], ['plan', 'Plan']])
    })
    it('shows only the sort control without selectable and only Select all without options', () => {
      const sortOnly = mnt()
      expect(sortOnly.find('select').exists()).toBe(true)
      expect(box(sortOnly).exists()).toBe(false)
      const selectOnly = mnt({ options: [], selectable: true })
      expect(selectOnly.find('select').exists()).toBe(false)
      expect(dirBtn(selectOnly).exists()).toBe(false)
      expect(box(selectOnly).exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('names the select by its visible label and the checkbox by its visible text', () => {
      const w = mnt({ selectable: true })
      const labels = (select(w).element as HTMLSelectElement).labels
      expect(labels).toHaveLength(1)
      expect(labels![0]!.textContent).toContain('Sort by')
      expect((box(w).element as HTMLInputElement).labels![0]!.textContent).toContain('Select all')
    })
    it('uses 16px text on small screens and 44px targets on coarse pointers', () => {
      const w = mnt({ selectable: true })
      expect(select(w).classes()).toEqual(expect.arrayContaining(['text-md', 'pointer-coarse:min-h-11']))
      expect(dirBtn(w).classes()).toContain('pointer-coarse:min-h-11')
      expect(w.find('[data-slot=table-card-controls-select-all]').classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
    })
    it('the direction button carries its state as text, an icon and a name that contains the visible text', () => {
      const w = mnt({ sort: { key: 'name', direction: 'desc' } })
      expect(dirBtn(w).text()).toBe('Descending')
      expect(dirBtn(w).attributes('aria-label')).toBe('Sort direction: Descending')
      expect(dirBtn(w).attributes('aria-label')).toContain(dirBtn(w).text())
      expect(dirBtn(w).find('svg').exists()).toBe(true)
      expect(dirBtn(w).attributes('data-direction')).toBe('desc')
    })
    it('announces the sort in a polite status region and clears it without a sort', async () => {
      const w = mnt({ sort: { key: 'plan', direction: 'asc' } })
      expect(status(w).attributes('role')).toBe('status')
      expect(status(w).classes()).toContain('sr-only')
      expect(status(w).text()).toBe('Sort by Plan, Ascending')
      await w.setProps({ sort: { key: 'plan', direction: 'desc' } })
      expect(status(w).text()).toBe('Sort by Plan, Descending')
      await w.setProps({ sort: null })
      expect(status(w).text()).toBe('')
    })
    it('announce=false renders no live region', () => {
      expect(status(mnt({ announce: false })).exists()).toBe(false)
    })
    it('uses logical properties only (RTL mirrors it)', () => {
      const html = mnt({ selectable: true }).html()
      expect(html).not.toMatch(/\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/)
      expect(html).toContain('end-3')
    })
    it('is usable inside an RTL region', () => {
      const w = mount(defineComponent({ render: () => h('div', { dir: 'rtl' }, [h(TableCardControls as any, { options, selectable: true })]) }))
      expect(w.find('[dir=rtl] [data-slot=table-card-controls]').exists()).toBe(true)
    })
    it('does not throw in strict mode and has no accessible-name violations', async () => {
      configureStrictMode('throw')
      const errors: unknown[] = []
      const w = mount(
        defineComponent({
          setup() {
            onErrorCaptured((e) => (errors.push(e), false))
            return () => h(TableCardControls as any, { options, selectable: true })
          },
        }),
        { attachTo: document.body },
      )
      await settle()
      expect(errors).toEqual([])
      w.unmount()
    })
  })

  describe('sort select', () => {
    it('reflects the current sort and shows the default order for an unknown key', async () => {
      const w = mnt({ sort: { key: 'plan', direction: 'asc' } })
      expect((select(w).element as HTMLSelectElement).value).toBe('plan')
      await w.setProps({ sort: { key: 'ghost', direction: 'asc' } })
      expect((select(w).element as HTMLSelectElement).value).toBe('')
      expect(dirBtn(w).attributes('disabled')).toBeDefined()
      expect(status(w).text()).toBe('')
    })
    it('a first choice sorts ascending', async () => {
      const w = mnt()
      await select(w).setValue('name')
      expect(w.emitted('update:sort')![0]).toEqual([{ key: 'name', direction: 'asc' }])
    })
    it('switching column keeps the chosen direction', async () => {
      const w = mnt({ sort: { key: 'name', direction: 'desc' } })
      await select(w).setValue('plan')
      expect(w.emitted('update:sort')![0]).toEqual([{ key: 'plan', direction: 'desc' }])
    })
    it('choosing the default order clears the sort', async () => {
      const w = mnt({ sort: { key: 'name', direction: 'asc' } })
      await select(w).setValue('')
      expect(w.emitted('update:sort')![0]).toEqual([null])
    })
    it('a controlled parent that ignores the change gets the select reset', async () => {
      const w = mnt({ sort: { key: 'name', direction: 'asc' }, 'onUpdate:sort': () => {} })
      await select(w).setValue('plan')
      await nextTick()
      expect((select(w).element as HTMLSelectElement).value).toBe('name')
    })
    it('works uncontrolled through v-model', async () => {
      const sort = ref<SortState | null>(null)
      const w = mount(defineComponent({ render: () => h(TableCardControls as any, { options, sort: sort.value, 'onUpdate:sort': (v: SortState | null) => (sort.value = v) }) }))
      await select(w as AnyWrapper).setValue('plan')
      expect(sort.value).toEqual({ key: 'plan', direction: 'asc' })
      expect((select(w as AnyWrapper).element as HTMLSelectElement).value).toBe('plan')
    })
    it('copes with one option, long labels and 200 options', () => {
      const one = mnt({ options: [{ key: 'a', label: 'Only column' }] })
      expect(select(one).findAll('option')).toHaveLength(2)
      const long = mnt({ options: [{ key: 'a', label: 'Quarterly maintenance schedule for the regional warehouse network '.repeat(4) }] })
      expect(long.find('[data-slot=table-card-controls-sort-select]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'w-full']))
      expect(long.find('[data-slot=table-card-controls-sort]').classes()).toContain('min-w-0')
      const many = mnt({ options: Array.from({ length: 200 }, (_, i) => ({ key: `k${i}`, label: `Column ${i}` })) })
      expect(select(many).findAll('option')).toHaveLength(201)
    })
    it('renders hostile labels as text', () => {
      const w = mnt({ options: [{ key: 'x', label: '<img src=x onerror=alert(1)>' }], sortByLabel: '<b>Sort</b>' })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('b').exists()).toBe(false)
      expect(select(w).findAll('option')[1]!.text()).toBe('<img src=x onerror=alert(1)>')
    })
  })

  describe('direction button', () => {
    it('is disabled until a column is sorted', () => {
      expect(dirBtn(mnt()).attributes('disabled')).toBeDefined()
      expect(dirBtn(mnt({ sort: { key: 'name', direction: 'asc' } })).attributes('disabled')).toBeUndefined()
    })
    it('flips between ascending and descending on the sorted column', async () => {
      const w = mnt({ sort: { key: 'plan', direction: 'asc' } })
      await dirBtn(w).trigger('click')
      expect(w.emitted('update:sort')![0]).toEqual([{ key: 'plan', direction: 'desc' }])
      await w.setProps({ sort: { key: 'plan', direction: 'desc' } })
      await dirBtn(w).trigger('click')
      expect(w.emitted('update:sort')![1]).toEqual([{ key: 'plan', direction: 'asc' }])
    })
    it('does nothing without a sorted column', async () => {
      const w = mnt()
      await dirBtn(w).trigger('click')
      expect(w.emitted('update:sort')).toBeUndefined()
    })
    it('treats a bad direction as ascending', () => {
      expect(dirBtn(mnt({ sort: { key: 'name', direction: 'sideways' } })).text()).toBe('Ascending')
    })
  })

  describe('select all', () => {
    it('reflects checked, indeterminate and disabled', async () => {
      const w = mnt({ options: [], selectable: true, allSelected: true })
      expect((box(w).element as HTMLInputElement).checked).toBe(true)
      await w.setProps({ allSelected: false, someSelected: true })
      expect((box(w).element as HTMLInputElement).indeterminate).toBe(true)
      await w.setProps({ someSelected: false, selectDisabled: true })
      expect((box(w).element as HTMLInputElement).indeterminate).toBe(false)
      expect(box(w).attributes('disabled')).toBeDefined()
    })
    it('emits select-all with the change event and resets a box the parent ignored', async () => {
      const w = mnt({ options: [], selectable: true })
      await box(w).setValue(true)
      expect(w.emitted('select-all')).toHaveLength(1)
      expect((w.emitted('select-all')![0]![0] as Event).type).toBe('change')
      await nextTick()
      expect((box(w).element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('labels', () => {
    it('every string can be replaced', () => {
      const w = mnt({
        selectable: true, sort: { key: 'name', direction: 'desc' },
        sortByLabel: 'Sortieren nach', sortDirectionLabel: 'Sortierrichtung', sortDefaultLabel: 'Standard',
        sortAscendingLabel: 'Aufsteigend', sortDescendingLabel: 'Absteigend', selectAllLabel: 'Alle auswählen',
      })
      expect(w.text()).toContain('Sortieren nach')
      expect(w.text()).toContain('Alle auswählen')
      expect(select(w).findAll('option')[0]!.text()).toBe('Standard')
      expect(dirBtn(w).text()).toBe('Absteigend')
      expect(dirBtn(w).attributes('aria-label')).toBe('Sortierrichtung: Absteigend')
      expect(status(w).text()).toBe('Sortieren nach Name, Absteigend')
    })
  })
})

describe('DataTable layout="cards" controls', () => {
  const cols: DataTableColumn<any>[] = [
    { key: 'name', header: 'Name', sortable: true, rowHeader: true },
    { key: 'plan', header: 'Plan', sortable: true },
    { key: 'seats', header: 'Seats', sortable: true, numeric: true },
    { key: 'note', header: 'Note' },
  ]
  const rows = () => [
    { id: 1, name: 'Item B', plan: 'Plan 2', seats: 40, note: 'x' },
    { id: 2, name: 'Item A', plan: 'Plan 1', seats: 12, note: 'y' },
    { id: 3, name: 'Item C', plan: 'Plan 3', seats: 3, note: 'z' },
  ]
  const mntDT = (props: Record<string, unknown> = {}) => mount(DataTable as any, { props: { columns: cols, rows: rows(), label: 'Items', layout: 'cards', ...props } }) as AnyWrapper
  const bar = (w: AnyWrapper) => w.find('[data-slot=table-card-controls]')
  const order = (w: AnyWrapper) => w.findAll('[data-slot=data-table-row] th[scope=row]').map((t) => t.text())

  describe('visibility', () => {
    it('is absent in the table layout, for an unknown layout and by default', () => {
      expect(bar(mntDT({ layout: 'table' })).exists()).toBe(false)
      expect(bar(mntDT({ layout: 'sideways' })).exists()).toBe(false)
      const w = mount(DataTable as any, { props: { columns: cols, rows: rows(), label: 'Items' } }) as AnyWrapper
      expect(bar(w).exists()).toBe(false)
    })
    it('is present in the cards layout with the sortable columns only', () => {
      const w = mntDT()
      expect(bar(w).exists()).toBe(true)
      expect(w.findAll('select option').map((o) => o.text())).toEqual(['Default order', 'Name', 'Plan', 'Seats'])
      expect(w.find('input[data-slot=table-card-controls-select-all-input]').exists()).toBe(false)
    })
    it('sits above the table inside the root and is hidden from sm up', () => {
      const w = mntDT()
      const kids = [...w.element.children].map((c) => c.getAttribute('data-slot'))
      expect(kids.indexOf('table-card-controls')).toBeLessThan(kids.indexOf('table-container'))
      expect(bar(w).classes()).toContain('sm:hidden')
    })
    it('cardControls=false hides it and keeps the header', () => {
      const w = mntDT({ cardControls: false, selectable: true })
      expect(bar(w).exists()).toBe(false)
      expect(w.find('[data-slot=data-table-select-all]').exists()).toBe(true)
      expect(w.find('thead button').exists()).toBe(true)
    })
    it('is absent with no sortable column and no selection', () => {
      expect(bar(mntDT({ columns: cols.map((c) => ({ ...c, sortable: false })) })).exists()).toBe(false)
    })
    it('shows only Select all when nothing is sortable', () => {
      const w = mntDT({ columns: cols.map((c) => ({ ...c, sortable: false })), selectable: true })
      expect(bar(w).exists()).toBe(true)
      expect(w.find('select').exists()).toBe(false)
      expect(w.find('[data-slot=table-card-controls-select-all]').text()).toBe('Select all')
    })
    it('works with one column and with a sortable column that has no header text (not offered)', () => {
      const one = mntDT({ columns: [{ key: 'name', header: 'Name', sortable: true }] })
      expect(one.findAll('select option')).toHaveLength(2)
      const none = mntDT({ columns: [{ key: 'name', header: '', sortable: true }] })
      expect(bar(none).exists()).toBe(false)
    })
    it('keeps the semantic table and the header sort buttons', () => {
      const w = mntDT({ selectable: true })
      expect(w.find('table').attributes('role')).toBe('table')
      expect(w.findAll('thead th button')).toHaveLength(3)
      expect(w.find('thead [data-slot=data-table-select-all]').exists()).toBe(true)
    })
    it('survives empty rows, loading and a wide row set', () => {
      expect(bar(mntDT({ rows: [], selectable: true })).exists()).toBe(true)
      expect((mntDT({ rows: [], selectable: true }).find('input[data-slot=table-card-controls-select-all-input]').element as HTMLInputElement).disabled).toBe(true)
      expect(bar(mntDT({ loading: true })).exists()).toBe(true)
      expect(bar(mntDT({ rows: Array.from({ length: 500 }, (_, i) => ({ id: i, name: `n${i}`, plan: 'p', seats: i })) })).exists()).toBe(true)
    })
  })

  describe('one source of truth with the header', () => {
    it('choosing a column sorts the rows, emits update:sort and sets aria-sort on the header', async () => {
      const w = mntDT()
      expect(order(w)).toEqual(['Item B', 'Item A', 'Item C'])
      await w.find('select').setValue('name')
      expect(w.emitted('update:sort')![0]).toEqual([{ key: 'name', direction: 'asc' }])
      expect(order(w)).toEqual(['Item A', 'Item B', 'Item C'])
      expect(w.findAll('thead th')[0]!.attributes('aria-sort')).toBe('ascending')
      expect(w.find('[data-slot=data-table-sort-status]').text()).toBe('Sorted by Name, ascending')
    })
    it('the direction button reverses the order and updates aria-sort and the announcement', async () => {
      const w = mntDT({ sort: { key: 'seats', direction: 'asc' } })
      expect(order(w)).toEqual(['Item C', 'Item A', 'Item B'])
      await w.find('[data-slot=table-card-controls-direction]').trigger('click')
      expect(w.emitted('update:sort')![0]).toEqual([{ key: 'seats', direction: 'desc' }])
      expect(order(w)).toEqual(['Item B', 'Item A', 'Item C'])
      expect(w.findAll('thead th')[2]!.attributes('aria-sort')).toBe('descending')
      expect(w.find('[data-slot=data-table-sort-status]').text()).toBe('Sorted by Seats, descending')
    })
    it('a header click is shown by the select and the button, and the default order clears aria-sort', async () => {
      const w = mntDT()
      await w.findAll('thead th')[1]!.find('button').trigger('click')
      await w.findAll('thead th')[1]!.find('button').trigger('click')
      expect((w.find('select').element as HTMLSelectElement).value).toBe('plan')
      expect(w.find('[data-slot=table-card-controls-direction]').text()).toBe('Descending')
      await w.find('select').setValue('')
      expect(w.emitted('update:sort')!.at(-1)).toEqual([null])
      expect(w.findAll('thead th').every((th) => th.attributes('aria-sort') === undefined)).toBe(true)
      expect(order(w)).toEqual(['Item B', 'Item A', 'Item C'])
    })
    it('has one live region (the table one), not two', () => {
      const w = mntDT({ sort: { key: 'name', direction: 'asc' } })
      expect(w.findAll('[role=status]')).toHaveLength(1)
      expect(w.find('[data-slot=table-card-controls-status]').exists()).toBe(false)
    })
    it('Select all selects every row of the page, updates the header box and clears again', async () => {
      const w = mntDT({ selectable: true, pageSize: 2 })
      const cardBox = () => w.find('input[data-slot=table-card-controls-select-all-input]')
      await cardBox().setValue(true)
      expect(w.emitted('update:selected')![0]).toEqual([[1, 2]])
      expect((w.find('[data-slot=data-table-select-all]').element as HTMLInputElement).checked).toBe(true)
      expect((cardBox().element as HTMLInputElement).checked).toBe(true)
      await cardBox().setValue(false)
      expect(w.emitted('update:selected')![1]).toEqual([[]])
    })
    it('shows the indeterminate state and keeps selections from other pages', async () => {
      const w = mntDT({ selectable: true, pageSize: 2, selected: [3] })
      await w.find('[data-slot=data-table-select-row]').setValue(true)
      expect((w.find('input[data-slot=table-card-controls-select-all-input]').element as HTMLInputElement).indeterminate).toBe(true)
      await w.find('input[data-slot=table-card-controls-select-all-input]').setValue(true)
      const last = w.emitted('update:selected')!.at(-1)![0] as number[]
      expect(new Set(last)).toEqual(new Set([1, 2, 3]))
    })
  })

  describe('labels', () => {
    it('relabels every string through props', () => {
      const w = mntDT({
        selectable: true, sort: { key: 'plan', direction: 'asc' },
        sortByLabel: 'Ordenar por', sortDirectionLabel: 'Sentido', sortDefaultLabel: 'Orden original',
        sortAscendingLabel: 'Ascendente', sortDescendingLabel: 'Descendente', selectAllLabel: 'Seleccionar todo',
      })
      const text = bar(w).text()
      for (const s of ['Ordenar por', 'Orden original', 'Ascendente', 'Seleccionar todo']) expect(text).toContain(s)
      expect(w.find('[data-slot=table-card-controls-direction]').attributes('aria-label')).toBe('Sentido: Ascendente')
    })
    it('copes with long, hostile and RTL content', () => {
      const w = mntDT({
        columns: [{ key: 'name', header: '<img src=x onerror=alert(1)> ' + 'very long column name '.repeat(10), sortable: true }],
        rows: [{ id: 1, name: 'a' }], selectable: true, selectAllLabel: 'x'.repeat(200),
      })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('select').element.closest('label')).not.toBeNull()
      const rtl = mount(defineComponent({ render: () => h('div', { dir: 'rtl' }, [h(DataTable as any, { columns: cols, rows: rows(), label: 'Items', layout: 'cards', selectable: true })]) }))
      expect(rtl.find('[dir=rtl] [data-slot=table-card-controls]').exists()).toBe(true)
    })
  })

  describe('strict mode', () => {
    beforeEach(() => configureStrictMode('throw'))
    it('the documented usage raises no contract error', async () => {
      const errors: unknown[] = []
      const w = mount(
        defineComponent({
          setup() {
            onErrorCaptured((e) => (errors.push(e), false))
            return () => h(DataTable as any, { columns: cols, rows: rows(), label: 'Items', layout: 'cards', selectable: true })
          },
        }),
        { attachTo: document.body },
      )
      await settle()
      expect(errors).toEqual([])
      w.unmount()
    })
    it('a missing table name still throws exactly as before', async () => {
      const errors: Error[] = []
      const w = mount(
        defineComponent({
          setup() {
            onErrorCaptured((e) => (errors.push(e as Error), false))
            return () => h(DataTable as any, { columns: cols, rows: rows(), layout: 'cards' })
          },
        }),
        { attachTo: document.body },
      )
      await settle()
      expect(errors.map((e) => e.message).join('\n')).toMatch(/DataTable/)
      w.unmount()
    })
  })
})

describe('Table layout="cards" with TableCardControls (hand-written table)', () => {
  const Demo = defineComponent({
    setup() {
      const sort = ref<SortState | null>(null)
      const data = [{ n: 'Item B', s: 40 }, { n: 'Item A', s: 12 }]
      const rows = () => (sort.value ? [...data].sort((a, b) => (sort.value!.direction === 'asc' ? 1 : -1) * (a.n < b.n ? -1 : 1)) : data)
      return () =>
        h('div', [
          h(TableCardControls as any, { options: [{ key: 'n', label: 'Item' }], sort: sort.value, 'onUpdate:sort': (v: SortState | null) => (sort.value = v) }),
          h(Table as any, { layout: 'cards' }, () => [
            h(TableCaption as any, { hidden: true }, () => 'Items'),
            h(TableHeader as any, () => h(TableRow as any, () => [h(TableHead as any, { 'aria-sort': sort.value ? (sort.value.direction === 'asc' ? 'ascending' : 'descending') : undefined }, () => 'Item')])),
            h(TableBody as any, () => rows().map((r) => h(TableRow as any, { key: r.n }, () => [h(TableCell as any, { label: 'Item' }, () => r.n)]))),
          ]),
        ])
    },
  })
  it('drives a plain Table through v-model:sort', async () => {
    const w = mount(Demo as any, { attachTo: document.body })
    expect(w.findAll('tbody td').map((t) => t.text())).toEqual(['ItemItem B', 'ItemItem A'])
    await w.find('select').setValue('n')
    expect(w.findAll('tbody td').map((t) => t.text().replace('Item', '')).map((t) => t.trim())).toEqual(['Item A', 'Item B'])
    expect(w.find('thead th').attributes('aria-sort')).toBe('ascending')
    expect(w.find('[data-slot=table-card-controls-status]').text()).toBe('Sort by Item, Ascending')
    w.unmount()
  })
})
