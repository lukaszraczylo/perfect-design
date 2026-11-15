import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import ComparisonTable from './ComparisonTable.vue'

const { errors, open, messages } = useContractHarness()
const columns = [{ title: 'Plan A' }, { title: 'Plan B', highlighted: true }]
const rows = [{ label: 'Projects', values: ['1', '10'] }]

describe('ComparisonTable contract', () => {
  it('throws a ContractError when the table has no name, naming the fix', async () => {
    await open(ComparisonTable, { columns, rows })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('ComparisonTable: requires `caption` or `aria-label` or `aria-labelledby`')
    expect(messages()[0]).toContain('caption="Plan comparison"')
  })
  it('does not accept an empty caption', async () => {
    await open(ComparisonTable, { columns, rows, caption: '  ' })
    expect(errors).toHaveLength(1)
  })
  it('accepts caption, aria-label and aria-labelledby', async () => {
    await open(ComparisonTable, { columns, rows, caption: 'Plans' })
    expect(errors).toEqual([])
    await open(ComparisonTable, { columns, rows, 'aria-label': 'Plans' })
    expect(errors).toEqual([])
    await open(ComparisonTable, { columns, rows, 'aria-labelledby': 'heading' })
    expect(errors).toEqual([])
  })
  it('throws when a column has an empty title, once, naming the index', async () => {
    await open(ComparisonTable, { columns: [{ title: 'A' }, { title: '' }, { title: ' ' }], rows, caption: 'Plans' })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('ComparisonTable: requires a non-empty `columns[1].title`')
  })
  it('accepts an untitled column when the column-header slot renders the header', async () => {
    await open(ComparisonTable, { columns: [{ title: '' }], rows, caption: 'Plans' }, { 'column-header': () => h('span', 'Custom') })
    expect(errors).toEqual([])
  })
  it('keeps a fallback name in the DOM when the contract is off', async () => {
    configureStrictMode('off')
    const w = await open(ComparisonTable, { columns, rows })
    expect(w.find('[data-slot="comparison-table"]').attributes('aria-label')).toBe('Comparison table')
    expect(w.find('caption').text()).toBe('Comparison table')
  })
  it('does not complain about normal usage', async () => {
    await open(ComparisonTable, { columns, rows, caption: 'Plan comparison', variant: 'striped' })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(ComparisonTable, { columns, rows })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('ComparisonTable: requires `caption`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(ComparisonTable, { columns, rows })
    expect(spy).not.toHaveBeenCalled()
  })
})
