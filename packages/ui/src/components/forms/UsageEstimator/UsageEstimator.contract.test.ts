import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import UsageEstimator from './UsageEstimator.vue'
import type { UsageDimension } from './estimate'

const { errors, mountTree } = useStrictHarness()
const ok: UsageDimension = { id: 'requests', label: 'Sample requests', unit: 'requests', rate: 0.4, per: 1000, max: 1000 }
const mountWith = (dimensions: unknown) => mountTree(() => h(UsageEstimator, { dimensions: dimensions as UsageDimension[] }))

describe('UsageEstimator contract', () => {
  it('is satisfied by a correct dimension, tiers and a min', async () => {
    await mountWith([ok, { id: 'gb', label: 'Sample storage', unit: 'GB', rate: 0, tiers: [{ upTo: 10, rate: 1 }, { upTo: null, rate: 0.5 }], min: 2, max: 100 }])
    expect(errors).toEqual([])
  })

  it('throws when a dimension has an empty id', async () => {
    await mountWith([{ ...ok, id: ' ' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('UsageEstimator: requires a non-empty string `id` on every dimension')
  })

  it('throws when two dimensions share an id', async () => {
    await mountWith([ok, { ...ok, label: 'Another' }])
    expect(errors[0]!.message).toContain('requires a unique `id`')
    expect(errors[0]!.message).toContain('"requests"')
  })

  it('throws when a dimension has an empty label', async () => {
    await mountWith([{ ...ok, label: '' }])
    expect(errors[0]!.message).toContain('requires a non-empty `label` on dimension "requests"')
  })

  it.each([
    ['max is missing', { ...ok, max: undefined }],
    ['max is NaN', { ...ok, max: NaN }],
    ['max equals min', { ...ok, min: 10, max: 10 }],
    ['max is below min', { ...ok, min: 10, max: 5 }],
    ['max is Infinity', { ...ok, max: Infinity }],
  ])('throws when %s', async (_n, dimension) => {
    await mountWith([dimension])
    expect(errors[0]!.message).toContain('requires `max` on dimension "requests" to be a finite number above `min`')
  })

  it.each([
    ['rate is negative', { ...ok, rate: -1 }],
    ['rate is NaN', { ...ok, rate: NaN }],
    ['a tier rate is negative', { ...ok, tiers: [{ upTo: null, rate: -2 }] }],
  ])('throws when %s', async (_n, dimension) => {
    await mountWith([dimension])
    expect(errors[0]!.message).toContain('requires `rate` on dimension "requests"')
  })

  it('does not check the rate when tiers replace it', async () => {
    await mountWith([{ ...ok, rate: NaN, tiers: [{ upTo: null, rate: 1 }] }])
    expect(errors).toEqual([])
  })

  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountWith([{ ...ok, id: '' }])
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('UsageEstimator: requires a non-empty string `id`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountWith([{ ...ok, id: '' }])
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
