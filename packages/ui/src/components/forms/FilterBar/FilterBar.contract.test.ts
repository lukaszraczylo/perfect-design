import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import FilterBar from './FilterBar.vue'
import FilterChip from './FilterChip.vue'
import { FIELDS, ITEMS } from './testing'

const { errors, mountTree } = useStrictHarness()
const messages = () => errors.map((e) => e.message)

describe('FilterBar contract', () => {
  it('passes with the documented usage', async () => {
    await mountTree(() => h(FilterBar, { fields: FIELDS, modelValue: ITEMS() }))
    expect(messages()).toEqual([])
  })

  it('throws a ContractError when fields are missing or empty', async () => {
    await mountTree(() => h(FilterBar))
    expect(messages().join('\n')).toMatch(/FilterBar: requires at least one entry in `fields`/)
    expect(errors[0].name).toBe('ContractError')
    await mountTree(() => h(FilterBar, { fields: [] }))
    expect(messages()).toHaveLength(1)
  })

  it('throws when a field has no id or a repeated id', async () => {
    await mountTree(() => h(FilterBar, { fields: [{ id: '', label: 'A' }] }))
    expect(messages().join('\n')).toMatch(/requires a non-empty string `value` on every field `id`/)
    await mountTree(() => h(FilterBar, { fields: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] }))
    expect(messages().join('\n')).toMatch(/requires a unique `value` on every field `id`, but "a" is used more than once/)
  })

  it('throws when a field has no label', async () => {
    await mountTree(() => h(FilterBar, { fields: [{ id: 'a', label: '' }] }))
    expect(messages().join('\n')).toMatch(/requires a non-empty `fields\[\]\.label \(field "a"\)`/)
  })

  it('throws when a select or multi-select field has no options', async () => {
    await mountTree(() => h(FilterBar, { fields: [{ id: 'a', label: 'A', type: 'select' }] }))
    expect(messages().join('\n')).toMatch(/requires `options` .* on the select field "a"/)
    await mountTree(() => h(FilterBar, { fields: [{ id: 'a', label: 'A', type: 'multi-select', options: [] }] }))
    expect(messages().join('\n')).toMatch(/multi-select field "a"/)
    await mountTree(() => h(FilterBar, { fields: [{ id: 'a', label: 'A', type: 'select', options: [{ value: 'x', label: 'X' }] }] }))
    expect(messages()).toEqual([])
  })

  it('throws when an applied filter has no id or a repeated id', async () => {
    await mountTree(() => h(FilterBar, { fields: FIELDS, modelValue: [{ id: '', field: 'status', value: 'booked' }] }))
    expect(messages().join('\n')).toMatch(/every filter `id`/)
    await mountTree(() => h(FilterBar, { fields: FIELDS, defaultValue: [{ id: 'x', field: 'status', value: 'booked' }, { id: 'x', field: 'status', value: 'held' }] }))
    expect(messages().join('\n')).toMatch(/unique `value` on every filter `id`, but "x"/)
  })

  it('throws when a FilterChip has no label text, and accepts slot text', async () => {
    await mountTree(() => h(FilterChip))
    expect(messages().join('\n')).toMatch(/FilterChip: requires a non-empty `label`/)
    await mountTree(() => h(FilterChip, { label: '   ' }))
    expect(messages()).toHaveLength(1)
    await mountTree(() => h(FilterChip, null, () => 'Slot text'))
    expect(messages()).toEqual([])
    await mountTree(() => h(FilterChip, { label: 'Status is Open' }))
    expect(messages()).toEqual([])
  })

  it('logs without throwing in warn mode and is silent when off', async () => {
    const calls: unknown[] = []
    const original = console.error
    console.error = (...a: unknown[]) => void calls.push(a[0])
    try {
      configureStrictMode('warn')
      await mountTree(() => h(FilterBar))
      expect(errors).toHaveLength(0)
      expect(String(calls[0])).toContain('requires at least one entry in `fields`')
      calls.length = 0
      configureStrictMode('off')
      await mountTree(() => h(FilterBar))
      expect(calls).toHaveLength(0)
    } finally {
      console.error = original
    }
  })
})
