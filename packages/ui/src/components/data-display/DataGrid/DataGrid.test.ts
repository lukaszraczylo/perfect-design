import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import DataGrid from './DataGrid.vue'
import type { DataGridColumn } from './types'

type Row = { id: number; name: string; qty: number | null; status: string; note?: string }
const STATUS = [{ value: 'open', label: 'Open' }, { value: 'done', label: 'Done' }, 'hold']

const columns: DataGridColumn<Row>[] = [
  { key: 'name', label: 'Name', editable: true, sortable: true, width: 160 },
  { key: 'qty', label: 'Quantity', type: 'number', editable: true, sortable: true, width: 100 },
  { key: 'status', label: 'Status', type: 'select', editable: true, options: STATUS, width: 120 },
  { key: 'note', label: 'Note', width: 140 },
]
const makeRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, qty: i * 2, status: 'open', note: `n${i}` }))

type W = VueWrapper<any>
let wrappers: W[] = []
const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
function mnt(props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}): W {
  const w = mount(DataGrid as any, { props: { label: 'Sample items', columns, rows: makeRows(5), ...props }, attachTo: document.body, ...opts }) as W
  wrappers.push(w)
  return w
}
const cell = (w: W, r: number, c: number) => w.find(`[data-row="${r}"][data-col="${c}"]`)
const text = (w: W, r: number, c: number) => cell(w, r, c).text()
const active = () => document.activeElement as HTMLElement
const pos = () => ({ row: Number(active()?.dataset?.row), col: Number(active()?.dataset?.col) })
async function focus(w: W, r: number, c: number) {
  ;(cell(w, r, c).element as HTMLElement).focus()
  await settle()
}
async function press(key: string, init: KeyboardEventInit = {}, el: HTMLElement = active()) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(e)
  await settle()
  return e
}
const names = (w: W) => w.findAll('[data-slot=data-grid-row]').map((r) => r.find('[data-col="0"]').text())

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('DataGrid structure', () => {
  it('renders an ARIA grid with named header cells, rows and cells', () => {
    const w = mnt()
    const grid = w.find('[role=grid]')
    expect(w.attributes('data-slot')).toBe('data-grid')
    expect(grid.attributes('aria-label')).toBe('Sample items')
    expect(grid.attributes('aria-rowcount')).toBe('6')
    expect(grid.attributes('aria-colcount')).toBe('4')
    expect(w.findAll('[role=columnheader]').map((h) => h.find('span').text())).toEqual(['Name', 'Quantity', 'Status', 'Note'])
    expect(w.findAll('[role=row]').map((r) => r.attributes('aria-rowindex'))).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(text(w, 1, 0)).toBe('Item 1')
    expect(text(w, 1, 2)).toBe('Open')
    expect(w.findAll('[role=rowgroup]')).toHaveLength(2)
  })
  it('puts every part on a data-slot', () => {
    const w = mnt({ selectable: true })
    for (const slot of ['data-grid', 'data-grid-viewport', 'data-grid-header', 'data-grid-body', 'data-grid-row', 'data-grid-cell', 'data-grid-header-cell', 'data-grid-resize-handle', 'data-grid-status', 'data-grid-select-all', 'data-grid-select-row']) {
      expect(w.find(`[data-slot=${slot}]`).exists(), slot).toBe(true)
    }
  })
  it('merges class last and passes attributes: aria to the grid, the rest to the root', () => {
    const w = mnt({ class: 'zz-extra', 'data-testid': 'x', 'aria-describedby': 'help', id: 'g1' })
    expect(w.classes()).toContain('zz-extra')
    expect(w.attributes('data-testid')).toBe('x')
    expect(w.attributes('id')).toBe('g1')
    expect(w.find('[role=grid]').attributes('aria-describedby')).toBe('help')
    expect(w.attributes('aria-describedby')).toBeUndefined()
  })
  it('lets aria-label replace the label prop and aria-labelledby name the grid', () => {
    const w = mnt({ label: undefined, 'aria-label': 'From attribute' })
    expect(w.find('[role=grid]').attributes('aria-label')).toBe('From attribute')
    const w2 = mnt({ label: undefined, 'aria-labelledby': 'title-1' })
    expect(w2.find('[role=grid]').attributes('aria-labelledby')).toBe('title-1')
  })
  it('marks the grid read-only when no column is editable and not otherwise', () => {
    expect(mnt({ columns: columns.map((c) => ({ ...c, editable: false })) }).find('[role=grid]').attributes('aria-readonly')).toBe('true')
    expect(mnt().find('[role=grid]').attributes('aria-readonly')).toBeUndefined()
  })
  it('renders the formatter, the null text and select labels', () => {
    const w = mnt({
      nullText: 'none',
      columns: [
        { key: 'qty', label: 'Qty', type: 'number', formatter: (v: unknown) => `${v} pcs` },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', type: 'select', options: STATUS },
      ],
      rows: [{ id: 1, qty: 3, name: null, status: 'done' }, { id: 2, qty: 4, name: 'x', status: 'unknown' }],
    })
    expect(text(w, 1, 0)).toBe('3 pcs')
    expect(text(w, 1, 1)).toBe('none')
    expect(text(w, 1, 2)).toBe('Done')
    expect(text(w, 2, 2)).toBe('unknown')
  })
  it('uses the cell and header slots', () => {
    const w = mnt({}, { slots: { 'cell-name': '<template #cell-name="{ value, rowIndex }"><b>{{ rowIndex }}:{{ value }}</b></template>', 'header-qty': '<template #header-qty="{ column }">#{{ column.label }}</template>' } })
    expect(text(w, 2, 0)).toBe('1:Item 2')
    expect(w.find('[data-col="1"][role=columnheader]').text()).toContain('#Quantity')
  })
  it('falls back to defaults for unknown variant, size and density', () => {
    const w = mnt({ variant: 'nope', size: 'huge', density: 'dense' })
    expect(w.attributes('data-variant')).toBe('bordered')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.attributes('data-density')).toBe('default')
  })
  it('right-aligns number columns logically and pins nothing by default', () => {
    const w = mnt()
    expect(cell(w, 1, 1).classes()).toContain('text-end')
    expect(cell(w, 1, 1).classes()).toContain('tabular-nums')
    expect(cell(w, 1, 0).element.getAttribute('style') ?? '').not.toContain('inset-inline')
  })
})

describe('DataGrid empty and loading', () => {
  it('shows the empty text in a status inside a spanning cell', () => {
    const w = mnt({ rows: [], emptyText: 'No items yet' })
    const empty = w.find('[data-slot=data-grid-empty]')
    expect(empty.attributes('role')).toBe('gridcell')
    expect(empty.attributes('aria-colspan')).toBe('4')
    expect(empty.find('[role=status]').text()).toBe('No items yet')
    expect(w.find('[role=grid]').attributes('aria-rowcount')).toBe('1')
  })
  it('renders the empty slot', () => {
    const w = mnt({ rows: [] }, { slots: { empty: '<em>Nothing here</em>' } })
    expect(w.find('[data-slot=data-grid-empty] em').text()).toBe('Nothing here')
  })
  it('sets aria-busy and shows placeholders while loading, and announces it once', async () => {
    const w = mnt({ loading: true })
    expect(w.find('[role=grid]').attributes('aria-busy')).toBe('true')
    expect(w.findAll('[data-slot=data-grid-loading-row]')).toHaveLength(5)
    expect(w.find('[data-slot=data-grid-row]').exists()).toBe(false)
    await w.setProps({ loading: false })
    expect(w.find('[role=grid]').attributes('aria-busy')).toBeUndefined()
    expect(w.find('[data-slot=data-grid-status]').text()).toBe('Rows loaded')
    expect(w.findAll('[data-slot=data-grid-row]')).toHaveLength(5)
  })
  it('keeps the header navigable on an empty grid', async () => {
    const w = mnt({ rows: [] })
    await focus(w, 0, 0)
    await press('ArrowDown')
    await press('End', { ctrlKey: true })
    expect(pos()).toEqual({ row: 0, col: 3 })
  })
})

describe('DataGrid roving tabindex and keyboard navigation', () => {
  it('has exactly one cell in the tab order and it follows focus', async () => {
    const w = mnt()
    const stops = () => w.findAll('[role=gridcell][tabindex="0"], [role=columnheader][tabindex="0"]')
    expect(stops()).toHaveLength(1)
    expect(stops()[0].attributes('data-row')).toBe('0')
    await focus(w, 3, 2)
    expect(stops()).toHaveLength(1)
    expect(stops()[0].attributes('data-row')).toBe('3')
    expect(stops()[0].attributes('data-col')).toBe('2')
  })
  it('moves with the arrow keys and stops at the edges', async () => {
    const w = mnt()
    await focus(w, 1, 0)
    await press('ArrowRight')
    await press('ArrowDown')
    expect(pos()).toEqual({ row: 2, col: 1 })
    await press('ArrowLeft')
    await press('ArrowLeft')
    expect(pos()).toEqual({ row: 2, col: 0 })
    await press('ArrowUp')
    await press('ArrowUp')
    await press('ArrowUp')
    expect(pos()).toEqual({ row: 0, col: 0 })
  })
  it('Home, End, Ctrl+Home, Ctrl+End, PageDown and PageUp', async () => {
    const w = mnt({ rows: makeRows(60), virtual: false })
    await focus(w, 5, 1)
    await press('End')
    expect(pos()).toEqual({ row: 5, col: 3 })
    await press('Home')
    expect(pos()).toEqual({ row: 5, col: 0 })
    await press('End', { ctrlKey: true })
    expect(pos()).toEqual({ row: 60, col: 3 })
    await press('Home', { ctrlKey: true })
    expect(pos()).toEqual({ row: 0, col: 0 })
    await press('PageDown')
    expect(pos().row).toBeGreaterThan(5)
    const after = pos().row
    await press('PageUp')
    expect(pos().row).toBe(Math.max(0, after - after))
  })
  it('treats Cmd like Ctrl for Cmd+End', async () => {
    const w = mnt()
    await focus(w, 1, 0)
    await press('End', { metaKey: true })
    expect(pos()).toEqual({ row: 5, col: 3 })
  })
  it('swaps the arrows in right-to-left', async () => {
    const w = mnt({ dir: 'rtl' })
    expect(w.attributes('dir')).toBe('rtl')
    await focus(w, 1, 1)
    await press('ArrowRight')
    expect(pos()).toEqual({ row: 1, col: 0 })
    await press('ArrowLeft')
    expect(pos()).toEqual({ row: 1, col: 1 })
  })
  it('reads the direction from a dir attribute on an ancestor', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const w = mnt()
    await settle()
    await focus(w, 1, 1)
    await press('ArrowRight')
    expect(pos()).toEqual({ row: 1, col: 0 })
    document.documentElement.removeAttribute('dir')
  })
  it('does not trap Tab: the grid keeps a single stop and Tab is not prevented', async () => {
    const w = mnt()
    await focus(w, 2, 1)
    const e = await press('Tab')
    expect(e.defaultPrevented).toBe(false)
  })
  it('ignores keys with no meaning and keys during IME composition', async () => {
    const w = mnt()
    await focus(w, 1, 0)
    const e = await press('q')
    expect(e.defaultPrevented).toBe(false)
    const ime = await press('ArrowDown', { isComposing: true })
    expect(ime.defaultPrevented).toBe(false)
    expect(pos()).toEqual({ row: 1, col: 0 })
  })
  it('moves the active cell when the user clicks and focuses another one', async () => {
    const w = mnt()
    await focus(w, 4, 3)
    expect(cell(w, 4, 3).attributes('tabindex')).toBe('0')
    expect(cell(w, 1, 0).attributes('tabindex')).toBe('-1')
  })
  it('clamps the active cell when rows disappear', async () => {
    const w = mnt({ rows: makeRows(10) })
    await focus(w, 10, 0)
    await w.setProps({ rows: makeRows(2) })
    expect(w.findAll('[role=gridcell][tabindex="0"], [role=columnheader][tabindex="0"]')).toHaveLength(1)
    expect(cell(w, 2, 0).attributes('tabindex')).toBe('0')
  })
  it('exposes focusCell and scrollToRow', async () => {
    const w = mnt({ rows: makeRows(500) })
    ;(w.vm as any).focusCell(3, 2)
    await settle()
    expect(pos()).toEqual({ row: 3, col: 2 })
    ;(w.vm as any).scrollToRow(400)
    await settle()
    expect(w.find('[data-index="400"]').exists()).toBe(true)
    ;(w.vm as any).scrollToRow(-4)
    ;(w.vm as any).scrollToRow(NaN)
  })
})

describe('DataGrid sorting', () => {
  it('cycles ascending, descending, none with aria-sort and announces it', async () => {
    const w = mnt({ rows: [{ id: 1, name: 'b', qty: 2 }, { id: 2, name: 'a', qty: 3 }, { id: 3, name: 'c', qty: 1 }] })
    const header = () => w.find('[role=columnheader][data-col="0"]')
    expect(header().attributes('aria-sort')).toBeUndefined()
    await header().find('button').trigger('click')
    expect(header().attributes('aria-sort')).toBe('ascending')
    expect(names(w)).toEqual(['a', 'b', 'c'])
    expect(w.find('[data-slot=data-grid-status]').text()).toBe('Sorted by Name, ascending')
    await header().find('button').trigger('click')
    expect(header().attributes('aria-sort')).toBe('descending')
    expect(names(w)).toEqual(['c', 'b', 'a'])
    await header().find('button').trigger('click')
    expect(header().attributes('aria-sort')).toBeUndefined()
    expect(names(w)).toEqual(['b', 'a', 'c'])
    expect(w.find('[data-slot=data-grid-status]').text()).toBe('Sort cleared for Name')
  })
  it('sorts from the keyboard with Enter and Space on the header cell', async () => {
    const w = mnt()
    await focus(w, 0, 1)
    await press('Enter')
    expect(w.find('[data-col="1"][role=columnheader]').attributes('aria-sort')).toBe('ascending')
    await press(' ')
    expect(w.find('[data-col="1"][role=columnheader]').attributes('aria-sort')).toBe('descending')
  })
  it('sorts numbers numerically, text naturally, with missing values last in both directions', async () => {
    const rows = [{ id: 1, name: 'item 10', qty: 10 }, { id: 2, name: 'item 2', qty: null }, { id: 3, name: 'Item 1', qty: 9 }]
    const w = mnt({ rows, sort: { key: 'qty', direction: 'asc' } })
    expect(names(w)).toEqual(['Item 1', 'item 10', 'item 2'])
    await w.setProps({ sort: { key: 'qty', direction: 'desc' } })
    expect(names(w)).toEqual(['item 10', 'Item 1', 'item 2'])
    await w.setProps({ sort: { key: 'name', direction: 'asc' } })
    expect(names(w)).toEqual(['Item 1', 'item 2', 'item 10'])
  })
  it('does not sort non-sortable columns, ignores a sort on an unknown key and is controlled by v-model:sort', async () => {
    const onSort = vi.fn()
    const w = mnt({ 'onUpdate:sort': onSort })
    expect(w.find('[data-col="3"][role=columnheader] button').exists()).toBe(false)
    await focus(w, 0, 3)
    await press('Enter')
    expect(onSort).not.toHaveBeenCalled()
    await w.setProps({ sort: { key: 'ghost', direction: 'asc' } })
    expect(names(w)).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'])
    await w.find('[data-col="0"][role=columnheader] button').trigger('click')
    expect(onSort).toHaveBeenCalledWith({ key: 'name', direction: 'asc' })
  })
  it('keeps an edited row where it is until the next sort', async () => {
    const w = mnt({ columns, rows: [{ id: 1, name: 'b', qty: 1 }, { id: 2, name: 'a', qty: 2 }], sort: { key: 'name', direction: 'asc' }, 'onUpdate:rows': (r: Row[]) => w.setProps({ rows: r }) })
    expect(names(w)).toEqual(['a', 'b'])
    await focus(w, 1, 0)
    await press('F2')
    await w.find('[data-slot=data-grid-editor]').setValue('z')
    await press('Enter', {}, w.find('[data-slot=data-grid-editor]').element as HTMLElement)
    expect(names(w)).toEqual(['z', 'b'])
    await w.setProps({ sort: { key: 'name', direction: 'desc' } })
    expect(names(w)).toEqual(['z', 'b'])
    await w.setProps({ sort: { key: 'name', direction: 'asc' } })
    expect(names(w)).toEqual(['b', 'z'])
  })
})

describe('DataGrid editing', () => {
  const input = (w: W) => w.find('[data-slot=data-grid-editor]')
  const edit = async (w: W, r: number, c: number, key = 'Enter') => {
    await focus(w, r, c)
    await press(key)
  }

  it('opens a focused editor on Enter, F2 and double click, only for editable cells', async () => {
    const w = mnt()
    await edit(w, 1, 0)
    expect(input(w).exists()).toBe(true)
    expect(document.activeElement).toBe(input(w).element)
    expect(input(w).attributes('aria-label')).toBe('Edit Name')
    await press('Escape', {}, input(w).element as HTMLElement)
    expect(input(w).exists()).toBe(false)
    await edit(w, 2, 0, 'F2')
    expect(input(w).exists()).toBe(true)
    await press('Escape', {}, input(w).element as HTMLElement)
    await cell(w, 3, 0).trigger('dblclick')
    expect(input(w).exists()).toBe(true)
    await press('Escape', {}, input(w).element as HTMLElement)
    await edit(w, 1, 3) // note: not editable
    expect(input(w).exists()).toBe(false)
    await cell(w, 1, 3).trigger('dblclick')
    expect(input(w).exists()).toBe(false)
  })
  it('commits text on Enter, emits cell-edit and the new rows, and returns focus to the cell', async () => {
    const onEdit = vi.fn()
    const onRows = vi.fn()
    const w = mnt({ onCellEdit: onEdit, 'onUpdate:rows': onRows })
    await edit(w, 2, 0)
    await input(w).setValue('Renamed')
    const e = await press('Enter', {}, input(w).element as HTMLElement)
    expect(e.defaultPrevented).toBe(true)
    expect(onEdit).toHaveBeenCalledTimes(1)
    const detail = onEdit.mock.calls[0][0]
    expect(detail).toMatchObject({ rowKey: 2, rowIndex: 1, value: 'Renamed', previousValue: 'Item 2' })
    expect(detail.column.key).toBe('name')
    expect(onRows.mock.calls[0][0][1].name).toBe('Renamed')
    expect(onRows.mock.calls[0][0][0].name).toBe('Item 1')
    expect(text(w, 2, 0)).toBe('Item 2') // controlled: the parent decides whether to apply the new rows
    expect(pos()).toEqual({ row: 2, col: 0 })
  })
  it('updates its own copy when the parent passes rows but does not listen (uncontrolled)', async () => {
    const w = mnt()
    await edit(w, 2, 0)
    await input(w).setValue('Local')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(text(w, 2, 0)).toBe('Local')
  })
  it('does not mutate the rows it was given', async () => {
    const rows = makeRows(3)
    const snapshot = JSON.stringify(rows)
    const w = mnt({ rows })
    await edit(w, 1, 0)
    await input(w).setValue('x')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(JSON.stringify(rows)).toBe(snapshot)
  })
  it('Escape cancels without emitting and restores focus', async () => {
    const onEdit = vi.fn()
    const w = mnt({ onCellEdit: onEdit })
    await edit(w, 1, 0)
    await input(w).setValue('discard me')
    await press('Escape', {}, input(w).element as HTMLElement)
    expect(onEdit).not.toHaveBeenCalled()
    expect(text(w, 1, 0)).toBe('Item 1')
    expect(pos()).toEqual({ row: 1, col: 0 })
  })
  it('emits nothing when the value did not change', async () => {
    const onEdit = vi.fn()
    const w = mnt({ onCellEdit: onEdit })
    await edit(w, 1, 0)
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(onEdit).not.toHaveBeenCalled()
  })
  it('keeps arrows, Space, F2 and Ctrl+C inside the editor instead of moving the grid or copying cells', async () => {
    const w = mnt()
    await edit(w, 1, 0)
    for (const init of [{ key: 'ArrowDown' }, { key: 'ArrowLeft' }, { key: 'Home' }, { key: 'PageDown' }, { key: ' ' }, { key: 'F2' }, { key: 'c', ctrlKey: true }]) {
      await press(init.key, init, input(w).element as HTMLElement)
      expect(input(w).exists()).toBe(true)
    }
    expect(document.activeElement).toBe(input(w).element)
  })
  it('ignores Enter and Escape while an IME composition is active', async () => {
    const w = mnt()
    await edit(w, 1, 0)
    await press('Enter', { isComposing: true }, input(w).element as HTMLElement)
    await press('Enter', { keyCode: 229 }, input(w).element as HTMLElement)
    await press('Escape', { isComposing: true }, input(w).element as HTMLElement)
    expect(input(w).exists()).toBe(true)
  })
  it('parses numbers, allows an empty number as null and rejects text with a visible, described error', async () => {
    const onEdit = vi.fn()
    const w = mnt({ onCellEdit: onEdit })
    await edit(w, 1, 1)
    await input(w).setValue('abc')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(input(w).attributes('aria-invalid')).toBe('true')
    const err = w.find('[data-slot=data-grid-error]')
    expect(err.text()).toBe('Enter a number')
    expect(input(w).attributes('aria-describedby')).toBe(err.attributes('id'))
    expect(cell(w, 1, 1).attributes('aria-invalid')).toBe('true')
    expect(w.find('[data-slot=data-grid-status]').text()).toContain('Enter a number')
    await input(w).setValue('12.5')
    expect(w.find('[data-slot=data-grid-error]').exists()).toBe(false)
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(onEdit.mock.calls[0][0].value).toBe(12.5)
    await edit(w, 2, 1)
    await input(w).setValue('  ')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(onEdit.mock.calls[1][0].value).toBeNull()
    await edit(w, 3, 1)
    await input(w).setValue('Infinity')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(input(w).exists()).toBe(true)
  })
  it('edits a select, commits the typed option value and rejects an unknown one', async () => {
    const onEdit = vi.fn()
    const w = mnt({ onCellEdit: onEdit })
    await edit(w, 1, 2)
    const select = w.find('select[data-slot=data-grid-editor]')
    expect(select.findAll('option').map((o) => o.text())).toEqual(['Open', 'Done', 'hold'])
    await select.setValue('done')
    await press('Enter', {}, select.element as HTMLElement)
    expect(onEdit.mock.calls[0][0].value).toBe('done')
    expect(text(w, 1, 2)).toBe('Done')
    await edit(w, 2, 2)
    ;(w.vm as any).$.setupState
    await w.find('select').setValue('hold')
    await press('Enter', {}, w.find('select').element as HTMLElement)
    expect(onEdit.mock.calls[1][0].value).toBe('hold')
  })
  it('keeps a numeric select value numeric', async () => {
    const onEdit = vi.fn()
    const w = mnt({ onCellEdit: onEdit, columns: [{ key: 'level', label: 'Level', type: 'select', editable: true, options: [1, 2, 3] }], rows: [{ id: 1, level: 1 }] })
    await edit(w, 1, 0)
    await w.find('select').setValue('3')
    await press('Enter', {}, w.find('select').element as HTMLElement)
    expect(onEdit.mock.calls[0][0].value).toBe(3)
  })
  it('runs the validate callback with context; an error keeps the editor open, Escape then cancels', async () => {
    const validate = vi.fn((value: unknown, _ctx?: unknown) => (String(value).length < 3 ? 'At least 3 characters' : undefined))
    const onEdit = vi.fn()
    const w = mnt({ validate, onCellEdit: onEdit })
    await edit(w, 1, 0)
    await input(w).setValue('ab')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(validate.mock.calls[0][1]).toMatchObject({ rowKey: 1, rowIndex: 0, previousValue: 'Item 1' })
    expect(w.find('[data-slot=data-grid-error]').text()).toBe('At least 3 characters')
    expect(input(w).exists()).toBe(true)
    expect(onEdit).not.toHaveBeenCalled()
    await input(w).setValue('abc')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(onEdit).toHaveBeenCalledTimes(1)
    await edit(w, 2, 0)
    await input(w).setValue('x')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(w.find('[data-slot=data-grid-error]').exists()).toBe(true)
    await press('Escape', {}, input(w).element as HTMLElement)
    expect(input(w).exists()).toBe(false)
    expect(text(w, 2, 0)).toBe('Item 2')
  })
  it('treats blank and null validation results as valid', async () => {
    const w = mnt({ validate: () => '   ' })
    await edit(w, 1, 0)
    await input(w).setValue('ok')
    await press('Enter', {}, input(w).element as HTMLElement)
    expect(input(w).exists()).toBe(false)
  })
  it('Tab commits a valid value and does not prevent the move; an invalid value blocks Tab', async () => {
    const w = mnt({ validate: (v: unknown) => (v === 'bad' ? 'Not allowed' : null) })
    await edit(w, 1, 0)
    await input(w).setValue('bad')
    const blocked = await press('Tab', {}, input(w).element as HTMLElement)
    expect(blocked.defaultPrevented).toBe(true)
    expect(input(w).exists()).toBe(true)
    await input(w).setValue('good')
    const e = await press('Tab', {}, input(w).element as HTMLElement)
    expect(e.defaultPrevented).toBe(false)
    expect(input(w).exists()).toBe(false)
    expect(text(w, 1, 0)).toBe('good')
  })
  it('commits on blur when valid and stays open when invalid', async () => {
    const w = mnt({ validate: (v: unknown) => (v === 'bad' ? 'Not allowed' : null) })
    await edit(w, 1, 0)
    await input(w).setValue('fine')
    await input(w).trigger('blur')
    expect(input(w).exists()).toBe(false)
    expect(text(w, 1, 0)).toBe('fine')
    await edit(w, 2, 0)
    await input(w).setValue('bad')
    await input(w).trigger('blur')
    expect(input(w).exists()).toBe(true)
  })
  it('reads Date and null values into the editor as text', async () => {
    const w = mnt({ columns: [{ key: 'when', label: 'When', editable: true }], rows: [{ id: 1, when: new Date('2025-01-02T03:04:05Z') }, { id: 2, when: null }] })
    await edit(w, 1, 0)
    expect((input(w).element as HTMLInputElement).value).toBe('2025-01-02T03:04:05.000Z')
    await press('Escape', {}, input(w).element as HTMLElement)
    await edit(w, 2, 0)
    expect((input(w).element as HTMLInputElement).value).toBe('')
  })
  it('drops an open editor when new rows arrive from outside', async () => {
    const w = mnt()
    await edit(w, 1, 0)
    await w.setProps({ rows: makeRows(3) })
    expect(input(w).exists()).toBe(false)
  })
  it('does nothing for a cell edit on a row that vanished', async () => {
    const w = mnt({ rows: makeRows(1) })
    await edit(w, 1, 0)
    await w.setProps({ rows: [] })
    expect(input(w).exists()).toBe(false)
  })
  it('works controlled with v-model:rows through a parent', async () => {
    const Parent = defineComponent({
      setup() {
        const data = ref(makeRows(3))
        return () => h(DataGrid as any, { label: 'p', columns, rows: data.value, 'onUpdate:rows': (r: Row[]) => (data.value = r) })
      },
    })
    const w = mount(Parent, { attachTo: document.body })
    wrappers.push(w as unknown as W)
    await edit(w as unknown as W, 1, 0)
    await w.find('[data-slot=data-grid-editor]').setValue('Via model')
    await press('Enter', {}, w.find('[data-slot=data-grid-editor]').element as HTMLElement)
    expect(w.find('[data-row="1"][data-col="0"]').text()).toBe('Via model')
  })
})

describe('DataGrid focus indicator', () => {
  // `outline-hidden` sets the outline style to none, so `focus-visible:outline-2` alone draws nothing; the ring must be used.
  const drawsRing = (el: { classes: () => string[] }) => {
    const c = el.classes()
    expect(c).toContain('focus-visible:ring-3')
    expect(c).toContain('focus-visible:ring-ring/40')
    expect(c).toContain('forced-colors:focus-visible:outline-solid')
    expect(c).not.toContain('focus-visible:outline-2')
  }
  it('header cells, sort buttons, resize handles and body cells show a focus ring', () => {
    const w = mnt({ resizable: true })
    drawsRing(w.find('[data-slot="data-grid-header-cell"]'))
    drawsRing(w.find('[data-slot="data-grid-sort"]'))
    drawsRing(w.find('[data-slot="data-grid-resize-handle"]'))
    drawsRing(w.find('[data-slot="data-grid-cell"]'))
  })
  it('the selection checkbox and select header cell show a focus ring', () => {
    const w = mnt({ selectable: true })
    drawsRing(w.find('[data-slot="data-grid-header-cell"]'))
    expect(w.find('input[type="checkbox"]').classes()).toContain('focus-visible:ring-3')
  })
})
