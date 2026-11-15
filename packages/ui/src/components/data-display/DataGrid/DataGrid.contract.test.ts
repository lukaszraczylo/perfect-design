import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { ContractError, configureStrictMode } from '../../../lib/contract'
import DataGrid from './DataGrid.vue'

const columns = [{ key: 'name', label: 'Name' }, { key: 'qty', label: 'Qty', type: 'number' }]
const rows = [{ id: 1, name: 'a', qty: 1 }, { id: 2, name: 'b', qty: 2 }]

beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  configureStrictMode('off')
  vi.restoreAllMocks()
})

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

async function errorsFor(props: Record<string, unknown>, attrs: Record<string, unknown> = {}) {
  const errors: Error[] = []
  const Wrapper = defineComponent({
    setup() {
      onErrorCaptured((e) => {
        errors.push(e as Error)
        return false
      })
      return () => h(DataGrid as any, { label: 'Sample', columns, rows, ...props, ...attrs })
    },
  })
  const w = mount(Wrapper)
  await settle()
  w.unmount()
  return errors
}

describe('DataGrid contract (strict mode)', () => {
  it('passes with the documented minimum', async () => {
    expect(await errorsFor({})).toEqual([])
  })

  it('throws a ContractError when the grid has no accessible name', async () => {
    const errors = await errorsFor({ label: undefined })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toBeInstanceOf(ContractError)
    expect(errors[0].message).toMatch(/DataGrid: needs an accessible name/)
  })
  it.each([[{ 'aria-label': 'By attribute' }], [{ 'aria-labelledby': 'heading' }]])('accepts %j instead of label', async (attrs) => {
    expect(await errorsFor({ label: undefined }, attrs)).toEqual([])
  })

  it('throws when columns is empty or missing', async () => {
    for (const bad of [[], undefined]) {
      const errors = await errorsFor({ columns: bad })
      expect(errors[0].message).toMatch(/requires a non-empty `columns` array/)
    }
  })
  it('throws when a column has no key, a duplicate key or no label', async () => {
    expect((await errorsFor({ columns: [{ key: '', label: 'A' }] }))[0].message).toMatch(/non-empty string `key`/)
    expect((await errorsFor({ columns: [{ key: 'a', label: 'A' }, { key: 'a', label: 'B' }] }))[0].message).toMatch(/must be unique, but "a"/)
    expect((await errorsFor({ columns: [{ key: 'a', label: '  ' }] }))[0].message).toMatch(/column "a" needs a `label`/)
  })
  it('throws when a select column has no options', async () => {
    expect((await errorsFor({ columns: [{ key: 'a', label: 'A', type: 'select' }] }))[0].message).toMatch(/needs a non-empty `options`/)
    expect(await errorsFor({ columns: [{ key: 'a', label: 'A', type: 'select', options: ['x'] }] })).toEqual([])
  })
  it('with selectable, throws for a missing or duplicate row id and accepts rowKey', async () => {
    expect((await errorsFor({ selectable: true, rows: [{ name: 'x' }] }))[0].message).toMatch(/row 1 has no string or number id/)
    expect((await errorsFor({ selectable: true, rows: [{ id: 1 }, { id: 1 }] }))[0].message).toMatch(/must be unique, but "1"/)
    expect(await errorsFor({ selectable: true, rows: [{ k: 1 }, { k: 2 }], rowKey: 'k' })).toEqual([])
    expect(await errorsFor({ rows: [{ name: 'x' }, { name: 'y' }] })).toEqual([])
  })
  it('checks again when rows arrive later', async () => {
    const errors: Error[] = []
    const Wrapper = defineComponent({
      props: { data: { type: Array, default: () => rows } },
      setup(p) {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(DataGrid as any, { label: 'Sample', columns, rows: p.data, selectable: true })
      },
    })
    const w = mount(Wrapper)
    await settle()
    expect(errors).toEqual([])
    await w.setProps({ data: [{ id: 1 }, { id: 1 }] })
    await settle()
    expect(errors.length).toBeGreaterThan(0)
    w.unmount()
  })
  it('warn mode logs without throwing and off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await errorsFor({ label: undefined })).toEqual([])
    expect(spy.mock.calls[0][0]).toMatch(/DataGrid: needs an accessible name/)
    spy.mockClear()
    configureStrictMode('off')
    expect(await errorsFor({ label: undefined })).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
})
