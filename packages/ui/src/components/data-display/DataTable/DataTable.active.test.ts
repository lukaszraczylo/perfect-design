import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DataTable from './DataTable.vue'

type AnyWrapper = VueWrapper<any>
const columns = [
  { key: 'name', header: 'Name', sortable: true, rowHeader: true },
  { key: 'note', header: 'Note' },
]
const rows = () => [
  { id: 'a', name: 'Alpha', note: 'one' },
  { id: 'b', name: 'Bravo', note: 'two' },
  { id: 'c', name: 'Charlie', note: 'three' },
]
const trs = (w: AnyWrapper) => w.findAll('[data-slot=data-table-row]')
const mnt = (props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => {
  const w: AnyWrapper = mount(DataTable as any, {
    attachTo: document.body,
    props: {
      columns,
      rows: rows(),
      label: 'Sample directory',
      activeKey: null,
      'onUpdate:activeKey': (v: unknown) => w.setProps({ activeKey: v }),
      ...props,
    },
    ...extra,
  })
  return w
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DataTable active row', () => {
  it('ArrowDown moves active row and updates v-model', async () => {
    const w = mnt({ activeKey: 'a' })
    await trs(w)[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('update:activeKey')!.at(-1)).toEqual(['b'])
    await nextTick()
    expect(trs(w)[1]!.attributes('aria-current')).toBe('true')
    expect(trs(w)[1]!.attributes('data-active')).toBe('')
    expect(trs(w)[1]!.attributes('data-state')).toBeUndefined()
    expect(document.activeElement).toBe(trs(w)[1]!.element)
    expect(trs(w)[0]!.attributes('aria-current')).toBeUndefined()
  })

  it('ArrowUp, Home and End move without wrapping', async () => {
    const w = mnt({ activeKey: 'a' })
    await trs(w)[0]!.trigger('keydown', { key: 'ArrowUp' })
    expect(w.props('activeKey')).toBe('a')
    await trs(w)[0]!.trigger('keydown', { key: 'End' })
    expect(w.props('activeKey')).toBe('c')
    await trs(w)[2]!.trigger('keydown', { key: 'ArrowDown' })
    expect(w.props('activeKey')).toBe('c')
    await trs(w)[2]!.trigger('keydown', { key: 'ArrowUp' })
    expect(w.props('activeKey')).toBe('b')
    await trs(w)[1]!.trigger('keydown', { key: 'Home' })
    expect(w.props('activeKey')).toBe('a')
  })

  it('starts from the focused row when none is active', async () => {
    const w = mnt()
    await trs(w)[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(w.props('activeKey')).toBe('b')
  })

  it('Enter emits row-activate with row and key', async () => {
    const w = mnt({ activeKey: 'b' })
    await trs(w)[1]!.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('row-activate')![0]).toEqual([rows()[1], 'b'])
  })

  it('click sets the row active and emits row-activate', async () => {
    const w = mnt()
    await trs(w)[2]!.trigger('click')
    expect(w.props('activeKey')).toBe('c')
    expect(w.emitted('row-activate')![0]).toEqual([rows()[2], 'c'])
  })

  it('click on a button inside a cell does not activate', async () => {
    const w = mnt({}, { slots: { 'cell-note': '<button type="button">Open</button>' } })
    await trs(w)[0]!.find('button').trigger('click')
    expect(w.emitted('row-activate')).toBeUndefined()
  })

  it('uses roving tabindex and native roles when bound', () => {
    const w = mnt({ activeKey: 'b' })
    expect(trs(w).map((r) => r.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(w.find('table').attributes('role')).toBeUndefined()
    const none = mnt()
    expect(trs(none).map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
  })

  it('active row follows key across sort and page', async () => {
    const w = mnt({ activeKey: 'a', sort: { key: 'name', direction: 'desc' } })
    expect(trs(w)[2]!.attributes('aria-current')).toBe('true')
    await w.setProps({ sort: null, pageSize: 2, page: 2, activeKey: 'a' })
    expect(w.find('[aria-current=true]').exists()).toBe(false)
    expect(trs(w)).toHaveLength(1)
    expect(trs(w)[0]!.attributes('tabindex')).toBe('0')
  })

  it('arrow keys inside interactive cell content are ignored', async () => {
    const w = mnt({ activeKey: 'a' }, { slots: { 'cell-note': '<input aria-label="Note" />' } })
    await trs(w)[0]!.find('input').trigger('keydown', { key: 'ArrowDown' })
    await trs(w)[0]!.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:activeKey')).toBeUndefined()
    expect(w.emitted('row-activate')).toBeUndefined()
  })

  it('ignores other keys', async () => {
    const w = mnt({ activeKey: 'a' })
    await trs(w)[0]!.trigger('keydown', { key: 'x' })
    expect(w.emitted('update:activeKey')).toBeUndefined()
  })

  it('also emits row-click on Enter and click when rowClickable', async () => {
    const w = mnt({ rowClickable: true, activeKey: 'a' })
    await trs(w)[0]!.trigger('keydown', { key: 'Enter' })
    await trs(w)[1]!.trigger('click')
    expect(w.emitted('row-click')).toHaveLength(2)
    expect(w.emitted('row-activate')).toHaveLength(2)
  })

  it('uses a custom rowKey function', async () => {
    const w = mnt({ rowKey: (r: { name: string }) => r.name, activeKey: 'Bravo' })
    expect(trs(w)[1]!.attributes('aria-current')).toBe('true')
  })

  it('without activeKey binding, rows keep tabindex=0 and row-click', async () => {
    const w: AnyWrapper = mount(DataTable as any, { props: { columns, rows: rows(), label: 'Sample', rowClickable: true } })
    expect(trs(w).map((r) => r.attributes('tabindex'))).toEqual(['0', '0', '0'])
    expect(w.find('table').attributes('role')).toBeUndefined()
    expect(w.find('[aria-current]').exists()).toBe(false)
    expect(w.find('[data-active]').exists()).toBe(false)
    await trs(w)[1]!.trigger('keydown', { key: 'ArrowDown' })
    await trs(w)[1]!.trigger('click')
    expect(w.emitted('row-click')).toHaveLength(1)
    expect(w.emitted('row-activate')).toBeUndefined()
    expect(w.emitted('update:activeKey')).toBeUndefined()
  })

  it('without rowClickable and activeKey, rows have no tabindex', () => {
    const w: AnyWrapper = mount(DataTable as any, { props: { columns, rows: rows(), label: 'Sample' } })
    expect(trs(w)[0]!.attributes('tabindex')).toBeUndefined()
  })

  it('cards layout keeps role table when bound', () => {
    expect(mnt({ layout: 'cards' }).find('table').attributes('role')).toBe('table')
  })

  it('active and checked are independent', async () => {
    const w = mnt({ activeKey: 'a', selectable: true, selected: ['a', 'b'] })
    expect(trs(w)[0]!.attributes('data-state')).toBe('selected')
    expect(trs(w)[0]!.attributes('data-active')).toBe('')
    expect(trs(w)[1]!.attributes('data-state')).toBe('selected')
    expect(trs(w)[1]!.attributes('data-active')).toBeUndefined()
  })

  it('v-model:activeKey bound to undefined ref still enables navigation', async () => {
    const w = mnt({ activeKey: undefined })
    expect(trs(w).map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    await trs(w)[0]!.trigger('keydown', { key: 'ArrowDown' })
    expect(w.props('activeKey')).toBe('b')
  })

  it('only the update handler also counts as bound', async () => {
    const w: AnyWrapper = mount(DataTable as any, { props: { columns, rows: rows(), label: 'S', 'onUpdate:activeKey': () => {} } })
    expect(trs(w)[1]!.attributes('tabindex')).toBe('-1')
  })

  it('arrow keys inside button content and role widgets are ignored', async () => {
    const w = mnt({ activeKey: 'a' }, { slots: { 'cell-note': '<button type="button"><span>Open</span></button><div role="textbox" tabindex="0">x</div>' } })
    await trs(w)[0]!.find('span').trigger('keydown', { key: 'ArrowDown' })
    await trs(w)[0]!.find('[role=textbox]').trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('update:activeKey')).toBeUndefined()
  })

  it('ignores keys with modifiers', async () => {
    const w = mnt({ activeKey: 'a' })
    await trs(w)[0]!.trigger('keydown', { key: 'ArrowDown', ctrlKey: true })
    await trs(w)[0]!.trigger('keydown', { key: 'Enter', metaKey: true })
    await trs(w)[0]!.trigger('keydown', { key: 'Home', altKey: true })
    expect(w.emitted('update:activeKey')).toBeUndefined()
    expect(w.emitted('row-activate')).toBeUndefined()
  })
})
