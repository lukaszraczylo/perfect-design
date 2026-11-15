import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DataGrid from './DataGrid.vue'
import type { DataGridColumn } from './types'

type Row = { id: number; name: string; qty: number | null; status: string; note?: string }
const columns: DataGridColumn<Row>[] = [
  { key: 'name', label: 'Name', editable: true, sortable: true, width: 160 },
  { key: 'qty', label: 'Quantity', type: 'number', editable: true, sortable: true, width: 100 },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'note', label: 'Note', width: 140 },
]
const makeRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, qty: i * 2, status: 'open', note: `n${i}` }))

type W = VueWrapper<any>
let wrappers: W[] = []
const settle = async () => {
  for (let i = 0; i < 3; i++) await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
function mnt(props: Record<string, unknown> = {}): W {
  const w = mount(DataGrid as any, { props: { label: 'Sample items', columns, rows: makeRows(5), ...props }, attachTo: document.body }) as W
  wrappers.push(w)
  return w
}
const cell = (w: W, r: number, c: number) => w.find(`[data-row="${r}"][data-col="${c}"]`)
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
async function scrollTo(w: W, top: number) {
  const el = w.find('[role=grid]').element as HTMLElement
  Object.defineProperty(el, 'scrollTop', { value: top, configurable: true, writable: true })
  el.dispatchEvent(new Event('scroll'))
  await new Promise((r) => setTimeout(r, 40))
  await nextTick()
}
const rowIdx = (w: W) => w.findAll('[data-slot=data-grid-row]').map((r) => Number(r.attributes('data-index')))
const clip = vi.fn<(t: string) => Promise<void>>()

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  clip.mockReset()
  clip.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: clip }, configurable: true })
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('DataGrid selection', () => {
  it('adds a labelled checkbox column and aria-selected on rows', () => {
    const w = mnt({ selectable: true })
    expect(w.find('[role=grid]').attributes('aria-colcount')).toBe('5')
    expect(w.find('[role=grid]').attributes('aria-multiselectable')).toBe('true')
    expect(w.find('[data-slot=data-grid-select-all]').attributes('aria-label')).toBe('Select all rows')
    expect(w.find('[data-slot=data-grid-select-row]').attributes('aria-label')).toBe('Select row 1')
    expect(w.findAll('[data-slot=data-grid-row]').every((r) => r.attributes('aria-selected') === 'false')).toBe(true)
    expect(w.find('[role=grid]').attributes('aria-multiselectable')).toBe('true')
  })
  it('has no aria-selected on rows when not selectable', () => {
    const w = mnt()
    expect(w.find('[data-slot=data-grid-row]').attributes('aria-selected')).toBeUndefined()
    expect(w.find('[data-slot=data-grid-select-row]').exists()).toBe(false)
  })
  it('toggles a row with its checkbox and reports ids through v-model:selected', async () => {
    const onSel = vi.fn()
    const w = mnt({ selectable: true, 'onUpdate:selected': onSel })
    await w.findAll('[data-slot=data-grid-select-row]')[1].trigger('click')
    expect(onSel).toHaveBeenLastCalledWith([2])
    expect(w.findAll('[data-slot=data-grid-row]')[1].attributes('aria-selected')).toBe('true')
    expect(w.findAll('[data-slot=data-grid-row]')[1].attributes('data-state')).toBe('selected')
    await w.findAll('[data-slot=data-grid-select-row]')[1].trigger('click')
    expect(onSel).toHaveBeenLastCalledWith([])
  })
  it('selects a range with shift-click in the sorted order and deselects it the same way', async () => {
    const w = mnt({ selectable: true, rows: makeRows(8), sort: { key: 'qty', direction: 'desc' } })
    const boxes = () => w.findAll('[data-slot=data-grid-select-row]')
    await boxes()[1].trigger('click')
    await boxes()[4].trigger('click', { shiftKey: true })
    expect(w.findAll('[data-slot=data-grid-row][aria-selected=true]')).toHaveLength(4)
    expect(w.findAll('[data-slot=data-grid-row]').map((r) => r.attributes('aria-selected'))).toEqual(['false', 'true', 'true', 'true', 'true', 'false', 'false', 'false'])
    await boxes()[3].trigger('click', { shiftKey: true })
    expect(w.findAll('[data-slot=data-grid-row][aria-selected=true]')).toHaveLength(2)
  })
  it('Space toggles the row of the focused cell and Shift+Space selects a range', async () => {
    const w = mnt({ selectable: true, rows: makeRows(6) })
    await focus(w, 2, 1)
    await press(' ')
    await focus(w, 5, 1)
    await press(' ', { shiftKey: true })
    expect(w.findAll('[data-slot=data-grid-row]').map((r) => r.attributes('aria-selected'))).toEqual(['false', 'true', 'true', 'true', 'true', 'false'])
  })
  it('does not use Space for selection when the grid is not selectable', async () => {
    const w = mnt()
    await focus(w, 1, 0)
    const e = await press(' ')
    expect(e.defaultPrevented).toBe(false)
  })
  it('select all: unchecked, indeterminate, checked; toggles from the checkbox and from Space on the header cell', async () => {
    const w = mnt({ selectable: true })
    const all = () => w.find('[data-slot=data-grid-select-all]').element as HTMLInputElement
    expect(all().indeterminate).toBe(false)
    await w.findAll('[data-slot=data-grid-select-row]')[0].trigger('click')
    await nextTick()
    expect(all().indeterminate).toBe(true)
    expect(all().checked).toBe(false)
    await w.find('[data-slot=data-grid-select-all]').trigger('click')
    expect(all().checked).toBe(true)
    expect(all().indeterminate).toBe(false)
    expect(w.findAll('[data-slot=data-grid-row][aria-selected=true]')).toHaveLength(5)
    await focus(w, 0, 0)
    await press(' ')
    expect(w.findAll('[data-slot=data-grid-row][aria-selected=true]')).toHaveLength(0)
    await press('Enter')
    expect(w.findAll('[data-slot=data-grid-row][aria-selected=true]')).toHaveLength(5)
  })
  it('disables select all on an empty grid and keeps selection outside the list', async () => {
    const w = mnt({ selectable: true, rows: [] })
    expect((w.find('[data-slot=data-grid-select-all]').element as HTMLInputElement).disabled).toBe(true)
  })
  it('uses the row index when a row has no id and a rowKey function when given', async () => {
    const onSel = vi.fn()
    const w = mnt({ selectable: true, rows: [{ name: 'x' }, { name: 'y' }], 'onUpdate:selected': onSel })
    await w.findAll('[data-slot=data-grid-select-row]')[1].trigger('click')
    expect(onSel).toHaveBeenLastCalledWith([1])
    const w2 = mnt({ selectable: true, rowKey: (r: Row) => `k-${r.name}`, 'onUpdate:selected': onSel })
    await w2.findAll('[data-slot=data-grid-select-row]')[0].trigger('click')
    expect(onSel).toHaveBeenLastCalledWith(['k-Item 1'])
  })
  it('controls the selection from outside', async () => {
    const w = mnt({ selectable: true, selected: [1, 3] })
    expect(w.findAll('[data-slot=data-grid-row]').map((r) => r.attributes('aria-selected'))).toEqual(['true', 'false', 'true', 'false', 'false'])
  })
})

describe('DataGrid column resize', () => {
  const handle = (w: W, c: number) => w.find(`[data-col="${c}"][role=columnheader] [role=separator]`)
  const widthOf = (w: W, c: number) => Number(handle(w, c).attributes('aria-valuenow'))

  it('renders a labelled vertical separator with value, min and max', () => {
    const w = mnt()
    const h = handle(w, 1)
    expect(h.attributes('aria-orientation')).toBe('vertical')
    expect(h.attributes('aria-label')).toBe('Resize Quantity column')
    expect([h.attributes('aria-valuenow'), h.attributes('aria-valuemin'), h.attributes('aria-valuemax')]).toEqual(['100', '48', '1000'])
    expect(h.attributes('style')).toContain('width: 24px')
  })
  it('is a tab stop only for the active header cell', async () => {
    const w = mnt()
    expect(handle(w, 0).attributes('tabindex')).toBe('0')
    expect(handle(w, 1).attributes('tabindex')).toBe('-1')
    await focus(w, 0, 2)
    expect(handle(w, 2).attributes('tabindex')).toBe('0')
    expect(handle(w, 0).attributes('tabindex')).toBe('-1')
    await focus(w, 2, 2)
    expect(handle(w, 2).attributes('tabindex')).toBe('-1')
  })
  it('resizes with ArrowRight/ArrowLeft by 10, Shift by 50, Home and End to the limits, and emits column-resize', async () => {
    const onResize = vi.fn()
    const w = mnt({ onColumnResize: onResize })
    const h = () => handle(w, 1).element as HTMLElement
    h().focus()
    await press('ArrowRight', {}, h())
    expect(widthOf(w, 1)).toBe(110)
    await press('ArrowRight', { shiftKey: true }, h())
    expect(widthOf(w, 1)).toBe(160)
    await press('ArrowLeft', {}, h())
    expect(widthOf(w, 1)).toBe(150)
    await press('Home', {}, h())
    expect(widthOf(w, 1)).toBe(48)
    await press('ArrowLeft', {}, h())
    expect(widthOf(w, 1)).toBe(48)
    await press('End', {}, h())
    expect(widthOf(w, 1)).toBe(1000)
    expect(onResize).toHaveBeenCalledWith({ key: 'qty', width: 110 })
    expect(onResize).toHaveBeenLastCalledWith({ key: 'qty', width: 1000 })
    expect(w.find('[data-slot=data-grid-header-row]').attributes('style')).toContain('1000px')
    expect(w.find('[data-slot=data-grid-status]').text()).toContain('Quantity column 1000 pixels wide')
  })
  it('flips the arrows in right-to-left and does not move grid focus', async () => {
    const w = mnt({ dir: 'rtl' })
    const h = () => handle(w, 1).element as HTMLElement
    h().focus()
    await press('ArrowLeft', {}, h())
    expect(widthOf(w, 1)).toBe(110)
    await press('ArrowRight', {}, h())
    expect(widthOf(w, 1)).toBe(100)
    expect(document.activeElement).toBe(h())
    await press('PageDown', {}, h())
    await press('ArrowDown', {}, h())
    expect(document.activeElement).toBe(h())
  })
  it('Escape on the handle returns focus to its header cell; other keys are left alone', async () => {
    const w = mnt()
    const h = handle(w, 2).element as HTMLElement
    h.focus()
    const tab = await press('Tab', {}, h)
    expect(tab.defaultPrevented).toBe(false)
    await press('Escape', {}, h)
    expect(pos()).toEqual({ row: 0, col: 2 })
  })
  it('respects per-column min and max and the resizable flag', async () => {
    const w = mnt({ columns: [{ key: 'name', label: 'Name', width: 100, minWidth: 90, maxWidth: 120 }, { key: 'qty', label: 'Qty', resizable: false }] })
    const h = handle(w, 0).element as HTMLElement
    h.focus()
    await press('Home', {}, h)
    expect(widthOf(w, 0)).toBe(90)
    await press('End', {}, h)
    expect(widthOf(w, 0)).toBe(120)
    expect(handle(w, 1).exists()).toBe(false)
  })
  it('resizes by dragging and emits once at the end, with RTL reversed', async () => {
    const onResize = vi.fn()
    const w = mnt({ onColumnResize: onResize })
    const h = handle(w, 0)
    await h.trigger('pointerdown', { clientX: 200, button: 0, pointerId: 1 })
    await h.trigger('pointermove', { clientX: 260, pointerId: 1 })
    expect(widthOf(w, 0)).toBe(220)
    await h.trigger('pointermove', { clientX: 20, pointerId: 1 })
    expect(widthOf(w, 0)).toBe(48)
    await h.trigger('pointermove', { clientX: 230, pointerId: 1 })
    expect(onResize).not.toHaveBeenCalled()
    await h.trigger('pointerup', { clientX: 230, pointerId: 1 })
    expect(onResize).toHaveBeenCalledTimes(1)
    expect(onResize).toHaveBeenCalledWith({ key: 'name', width: 190 })
    await h.trigger('pointermove', { clientX: 999, pointerId: 1 })
    expect(widthOf(w, 0)).toBe(190)

    const r = mnt({ dir: 'rtl' })
    const rh = handle(r, 0)
    await rh.trigger('pointerdown', { clientX: 200, button: 0, pointerId: 1 })
    await rh.trigger('pointermove', { clientX: 160, pointerId: 1 })
    expect(widthOf(r, 0)).toBe(200)
    await rh.trigger('pointercancel', { pointerId: 1 })
  })
  it('ignores a secondary button, tolerates a missing pointer capture and keeps the sort button out of the drag', async () => {
    const w = mnt()
    const h = handle(w, 0)
    ;(h.element as HTMLElement).setPointerCapture = () => {
      throw new Error('no capture')
    }
    await h.trigger('pointerdown', { clientX: 10, button: 2, pointerId: 1 })
    await h.trigger('pointermove', { clientX: 90, pointerId: 1 })
    expect(widthOf(w, 0)).toBe(160)
    await h.trigger('pointerdown', { clientX: 10, button: 0, pointerId: 1 })
    await h.trigger('pointermove', { clientX: 20, pointerId: 1 })
    expect(widthOf(w, 0)).toBe(170)
    await h.trigger('pointerup', { pointerId: 1 })
    await h.trigger('click')
    expect(w.find('[data-col="0"][role=columnheader]').attributes('aria-sort')).toBeUndefined()
  })
})

describe('DataGrid pinned columns', () => {
  const pinnedCols: DataGridColumn<Row>[] = [
    { key: 'note', label: 'Note', width: 100, pinned: 'end' },
    { key: 'qty', label: 'Quantity', width: 90 },
    { key: 'name', label: 'Name', width: 120, pinned: 'start' },
    { key: 'status', label: 'Status', width: 110 },
  ]
  it('moves pinned columns to the edges and sticks them with logical offsets', () => {
    const w = mnt({ columns: pinnedCols, selectable: true })
    expect(w.findAll('[role=columnheader]').map((h) => h.attributes('data-column') ?? 'select')).toEqual(['select', 'name', 'qty', 'status', 'note'])
    const style = (c: number) => cell(w, 1, c).attributes('style') ?? ''
    expect(style(0)).toContain('inset-inline-start: 0px')
    expect(style(1)).toContain('inset-inline-start: 44px')
    expect(style(2)).not.toContain('inset-inline')
    expect(style(4)).toContain('inset-inline-end: 0px')
    expect(cell(w, 1, 1).classes()).toContain('sticky')
    expect(cell(w, 1, 4).classes()).toContain('sticky')
    expect(cell(w, 1, 2).classes()).not.toContain('sticky')
    expect(w.find('[role=columnheader][data-column=name]').classes()).toContain('sticky')
  })
  it('keeps a sticky header row above the body', () => {
    const w = mnt()
    expect(w.find('[data-slot=data-grid-header]').classes()).toEqual(expect.arrayContaining(['sticky', 'top-0']))
  })
  it('keeps the focus away from sticky columns with scroll padding', () => {
    const w = mnt({ columns: pinnedCols })
    const style = w.find('[role=grid]').attributes('style') ?? ''
    expect(style).toContain('scroll-padding-inline: 120px 100px')
    expect(style).toContain('scroll-padding-top: 36px')
  })
  it('keeps pinned cells opaque on striped and selected rows', () => {
    const w = mnt({ columns: pinnedCols, variant: 'striped', selectable: true, selected: [2], rows: makeRows(4) })
    expect(cell(w, 2, 1).classes()).toContain('bg-muted')
    expect(cell(w, 1, 1).classes().join(' ')).toContain('bg-background')
    expect(cell(w, 2, 1).classes().join(' ')).not.toContain('after:bg-muted/30')
    expect(cell(w, 4, 1).classes().join(' ')).toContain('after:bg-muted/30')
  })
})

describe('DataGrid copy as TSV', () => {
  const lastCopy = () => clip.mock.calls.at(-1)?.[0]
  const wait = async () => {
    await settle()
    await settle()
  }

  it('copies the focused cell with Ctrl+C and announces it', async () => {
    const onCopy = vi.fn()
    const w = mnt({ onCopy })
    await focus(w, 2, 0)
    const e = await press('c', { ctrlKey: true })
    await wait()
    expect(e.defaultPrevented).toBe(true)
    expect(lastCopy()).toBe('Item 2')
    expect(onCopy).toHaveBeenCalledWith({ text: 'Item 2', cells: 1 })
    expect(w.find('[data-slot=data-grid-status]').text()).toBe('Copied 1 cell')
  })
  it('copies a rectangle made with Shift+Arrow, Cmd+C works, and Escape clears the range', async () => {
    const w = mnt()
    await focus(w, 1, 0)
    await press('ArrowDown', { shiftKey: true })
    await press('ArrowRight', { shiftKey: true })
    expect(cell(w, 1, 0).attributes('aria-selected')).toBe('true')
    expect(cell(w, 2, 1).attributes('aria-selected')).toBe('true')
    expect(cell(w, 3, 1).attributes('aria-selected')).toBeUndefined()
    await press('c', { metaKey: true })
    await wait()
    expect(lastCopy()).toBe('Item 1\t0\nItem 2\t2')
    expect(w.find('[data-slot=data-grid-status]').text()).toBe('Copied 4 cells')
    await press('Escape')
    expect(cell(w, 1, 0).attributes('aria-selected')).toBeUndefined()
  })
  it('extends a range with shift-click and drops it on a plain click', async () => {
    const w = mnt()
    await focus(w, 1, 0)
    await cell(w, 3, 1).trigger('mousedown', { shiftKey: true })
    await settle()
    expect(cell(w, 2, 1).attributes('aria-selected')).toBe('true')
    await cell(w, 2, 2).trigger('mousedown')
    expect(cell(w, 2, 1).attributes('aria-selected')).toBeUndefined()
  })
  it('does not start a range from the header and keeps ranges off the checkbox column', async () => {
    const w = mnt({ selectable: true })
    await focus(w, 0, 1)
    await press('ArrowDown', { shiftKey: true })
    expect(w.findAll('[aria-selected=true][role=gridcell]')).toHaveLength(0)
    await focus(w, 1, 1)
    await press('ArrowDown', { shiftKey: true })
    await press('ArrowLeft', { shiftKey: true })
    await press('c', { ctrlKey: true })
    await wait()
    expect(lastCopy()).toBe('Item 1\nItem 2')
  })
  it('copies the selected rows (all data columns) when no range exists', async () => {
    const w = mnt({ selectable: true, rows: makeRows(4), selected: [2, 4] })
    await focus(w, 1, 1)
    await press('c', { ctrlKey: true })
    await wait()
    expect(lastCopy()).toBe('Item 2\t2\topen\tn1\nItem 4\t6\topen\tn3')
  })
  it('does nothing on a header cell or the checkbox cell', async () => {
    const w = mnt({ selectable: true })
    await focus(w, 0, 1)
    await press('c', { ctrlKey: true })
    await focus(w, 1, 0)
    await press('c', { ctrlKey: true })
    await wait()
    expect(clip).not.toHaveBeenCalled()
  })
  it('escapes tabs, newlines and quotes and neutralises formulas, or leaves them with neutralizeFormulas off', async () => {
    const rows = [{ id: 1, name: 'a\tb', qty: 1, status: '=cmd|\' /C calc\'!A0', note: 'say "hi"\nbye' }]
    const w = mnt({ rows, selectable: true, selected: [1] })
    await focus(w, 1, 1)
    await press('c', { ctrlKey: true })
    await wait()
    expect(lastCopy()).toBe(`"a\tb"\t1\t'=cmd|' /C calc'!A0\t"say ""hi""\nbye"`)
    const w2 = mnt({ rows, neutralizeFormulas: false })
    await focus(w2, 1, 2)
    await press('c', { ctrlKey: true })
    await wait()
    expect(lastCopy()).toBe(`=cmd|' /C calc'!A0`)
  })
  it('copies numbers unquoted (negatives included), formatter output and empty cells for null', async () => {
    const rows = [{ id: 1, name: null, qty: -5, status: 'x', note: undefined }]
    const w = mnt({ rows, selectable: true, selected: [1], columns: [...columns.slice(0, 2), { ...columns[2], formatter: (v: unknown) => `<${v}>` }, columns[3]] })
    await focus(w, 1, 1)
    await press('c', { ctrlKey: true })
    await wait()
    expect(lastCopy()).toBe('\t-5\t<x>\t')
  })
  it('reports a failed copy', async () => {
    clip.mockRejectedValue(new Error('denied'))
    const w = mnt()
    await focus(w, 1, 0)
    await press('c', { ctrlKey: true })
    await wait()
    expect(w.find('[data-slot=data-grid-status]').text()).toBe('Copy failed')
  })
})

describe('DataGrid hostile content', () => {
  const hostile = ['<img src=x onerror="window.__pwned=1">', '<script>window.__pwned=1</script>', '"><svg onload=alert(1)>', 'javascript:alert(1)', '\u0000‮ evil‬', 'مرحبا <b>بالعالم</b>', '=HYPERLINK("http://x","y")']
  it('renders every cell, header and label as text, never as markup', () => {
    const rows = hostile.map((t, i) => ({ id: i, name: t, qty: i, status: t, note: t }))
    const w = mnt({ rows, label: hostile[0], columns: [{ key: 'name', label: hostile[1], editable: true }, { key: 'status', label: hostile[2] }, { key: 'note', label: 'Note' }] })
    expect(w.element.querySelectorAll('img, script, svg[onload], b').length).toBe(0)
    expect((window as any).__pwned).toBeUndefined()
    expect(w.find('[data-row="1"][data-col="0"]').text()).toBe(hostile[0])
    expect(w.find('[role=grid]').attributes('aria-label')).toBe(hostile[0])
    expect(w.find('[role=columnheader]').text()).toContain(hostile[1])
  })
  it('keeps hostile text in the editor, the error message and the announcement as text', async () => {
    const w = mnt({ validate: (v: unknown) => `bad: ${String(v)}` })
    await focus(w, 1, 0)
    await press('Enter')
    const input = w.find('[data-slot=data-grid-editor]')
    await input.setValue('<img src=x onerror=alert(1)>')
    await press('Enter', {}, input.element as HTMLElement)
    expect(w.find('[data-slot=data-grid-error]').text()).toBe('bad: <img src=x onerror=alert(1)>')
    expect(w.element.querySelector('img')).toBeNull()
  })
  it('truncates a huge cell instead of growing the row', () => {
    const huge = 'W'.repeat(200000)
    const w = mnt({ rows: [{ id: 1, name: huge, qty: 1, status: 's', note: 'n' }] })
    const span = w.find('[data-row="1"][data-col="0"] span')
    expect(span.classes()).toContain('truncate')
    expect(span.text().length).toBe(200000)
    expect(w.find('[data-slot=data-grid-row]').attributes('style')).toContain('height: 36px')
  })
  it('survives odd values: objects, booleans, bigint-like strings, NaN and Invalid Date', () => {
    const w = mnt({ rows: [{ id: 1, name: { a: 1 }, qty: NaN, status: true, note: new Date('nope') }], nullText: '-' })
    expect(w.find('[data-row="1"][data-col="0"]').text()).toBe('[object Object]')
    expect(w.find('[data-row="1"][data-col="1"]').text()).toBe('NaN')
    expect(w.find('[data-row="1"][data-col="2"]').text()).toBe('true')
    expect(w.find('[data-row="1"][data-col="3"]').text()).toBe('-')
  })
  it('does not throw on missing rows, columns or malformed entries', () => {
    expect(() => mnt({ rows: undefined, columns: undefined })).not.toThrow()
    expect(() => mnt({ rows: [null, undefined, 3], columns: [null, { key: 'name', label: 'Name' }] })).not.toThrow()
  })
})

describe('DataGrid virtualization', () => {
  it('renders a small window of a 10k grid with correct ARIA counts and positions', () => {
    const w = mnt({ rows: makeRows(10000) })
    const rows = w.findAll('[data-slot=data-grid-row]')
    expect(w.attributes('data-virtual')).toBe('true')
    expect(rows.length).toBeLessThan(40)
    expect(rows.length).toBeGreaterThan(5)
    expect(w.find('[role=grid]').attributes('aria-rowcount')).toBe('10001')
    expect(rows[0].attributes('aria-rowindex')).toBe('2')
    expect(rows[0].attributes('style')).toContain('top: 0px')
    expect(w.find('[data-slot=data-grid-body]').attributes('style')).toContain('height: 360000px')
    expect(w.find('[role=grid]').attributes('style')).toContain('height: 480px')
  })
  it('windows around the scroll position and keeps row positions consistent', async () => {
    const w = mnt({ rows: makeRows(10000) })
    await scrollTo(w, 36 * 5000)
    const idx = rowIdx(w)
    expect(idx.length).toBeLessThan(40)
    expect(idx[0]).toBeGreaterThan(4980)
    expect(idx).toContain(5000)
    const row = w.find('[data-index="5000"]')
    expect(row.attributes('aria-rowindex')).toBe('5002')
    expect(row.attributes('style')).toContain(`top: ${5000 * 36}px`)
    expect(row.find('[data-col="0"]').text()).toBe('Item 5001')
  })
  it('uses the auto threshold and the explicit switch', () => {
    expect(mnt({ rows: makeRows(200) }).attributes('data-virtual')).toBeUndefined()
    expect(mnt({ rows: makeRows(201) }).attributes('data-virtual')).toBe('true')
    expect(mnt({ rows: makeRows(300), virtual: false }).findAll('[data-slot=data-grid-row]')).toHaveLength(300)
    expect(mnt({ rows: makeRows(60), virtual: true }).findAll('[data-slot=data-grid-row]').length).toBeLessThan(60)
  })
  it('sizes rows by density and honours the height prop', () => {
    const w = mnt({ density: 'compact', height: 200, rows: makeRows(1000) })
    expect(w.find('[data-slot=data-grid-row]').attributes('style')).toContain('height: 28px')
    expect(w.find('[role=grid]').attributes('style')).toContain('height: 200px')
    expect(mnt({ density: 'comfortable', height: '50vh' }).find('[role=grid]').attributes('style')).toContain('height: 50vh')
    expect(mnt({ density: 'comfortable' }).find('[data-slot=data-grid-row]').attributes('style')).toContain('height: 48px')
  })
  it('Ctrl+End jumps to the last row, renders it and focuses it; Ctrl+Home returns', async () => {
    const w = mnt({ rows: makeRows(10000) })
    await focus(w, 1, 0)
    await press('End', { ctrlKey: true })
    expect(pos()).toEqual({ row: 10000, col: 3 })
    expect(active().textContent).toBe('n9999')
    expect(rowIdx(w)).toContain(9999)
    expect(rowIdx(w).length).toBeLessThan(40)
    await press('Home', { ctrlKey: true })
    expect(pos()).toEqual({ row: 0, col: 0 })
    await press('ArrowDown')
    expect(pos()).toEqual({ row: 1, col: 0 })
    expect(rowIdx(w)).toContain(0)
  })
  it('PageDown moves by the visible rows and ArrowDown steps across the window edge', async () => {
    const w = mnt({ rows: makeRows(10000) })
    await focus(w, 1, 0)
    await press('PageDown')
    const page = pos().row - 1
    expect(page).toBeGreaterThanOrEqual(10)
    expect(page).toBeLessThanOrEqual(13)
    for (let i = 0; i < 40; i++) await press('ArrowDown')
    expect(pos().row).toBe(page + 1 + 40)
    expect(active().dataset.row).toBe(String(page + 41))
    expect(rowIdx(w)).toContain(page + 40)
    await press('PageUp')
    expect(pos().row).toBe(page + 41 - page)
  })
  it('keeps the focused row mounted when the user scrolls it out of the window', async () => {
    const w = mnt({ rows: makeRows(10000) })
    await focus(w, 5, 1)
    await scrollTo(w, 36 * 6000)
    expect(rowIdx(w)).toContain(4)
    expect(rowIdx(w)).toContain(6000)
    expect(rowIdx(w).filter((i) => i < 100)).toEqual([4])
    expect(document.activeElement).toBe(cell(w, 5, 1).element)
    expect(w.findAll('[data-slot=data-grid-row]').map((r) => r.attributes('aria-rowindex')).map(Number)).toEqual([...w.findAll('[data-slot=data-grid-row]').map((r) => r.attributes('aria-rowindex')).map(Number)].sort((a, b) => a - b))
  })
  it('keeps the roving tabindex on exactly one mounted cell across the window', async () => {
    const w = mnt({ rows: makeRows(10000) })
    await focus(w, 1, 0)
    await press('End', { ctrlKey: true })
    expect(w.findAll('[role=gridcell][tabindex="0"], [role=columnheader][tabindex="0"]')).toHaveLength(1)
  })
  it('sorting a virtual grid sorts the whole data set, not the window', async () => {
    const w = mnt({ rows: makeRows(10000), sort: { key: 'qty', direction: 'desc' } })
    expect(w.find('[data-row="1"][data-col="0"]').text()).toBe('Item 10000')
    await scrollTo(w, 36 * 9990)
    expect(w.find('[data-index="9999"] [data-col="0"]').text()).toBe('Item 1')
  })
  it('cancels a pending animation frame on unmount and handles an empty virtual grid', () => {
    const w = mnt({ rows: [], virtual: true })
    ;(w.find('[role=grid]').element as HTMLElement).dispatchEvent(new Event('scroll'))
    expect(() => w.unmount()).not.toThrow()
    wrappers = []
  })
})

describe('DataGrid performance with 10k rows', () => {
  it('mounts quickly, sorts, navigates and scrolls inside generous budgets', async () => {
    const rows = makeRows(10000)
    let t = performance.now()
    const w = mnt({ rows })
    const mountMs = performance.now() - t
    expect(w.findAll('[data-slot=data-grid-row]').length).toBeLessThan(40)
    expect(mountMs).toBeLessThan(1500)

    t = performance.now()
    await w.find('[data-col="1"][role=columnheader] button').trigger('click')
    await w.find('[data-col="1"][role=columnheader] button').trigger('click')
    expect(performance.now() - t).toBeLessThan(2500)
    expect(w.find('[data-row="1"][data-col="0"]').text()).toBe('Item 10000')

    await focus(w, 1, 0)
    t = performance.now()
    for (let i = 0; i < 30; i++) await press('ArrowDown')
    for (let i = 0; i < 10; i++) await press('PageDown')
    await press('End', { ctrlKey: true })
    expect(performance.now() - t).toBeLessThan(5000)
    for (let i = 0; i < 50; i++) await scrollTo(w, i * 3600)
    expect(w.findAll('[data-slot=data-grid-row]').length).toBeLessThan(40)
  }, 30000)
})
