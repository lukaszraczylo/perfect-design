import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import TimeRangePicker from './TimeRangePicker.vue'

const { errors, mountTree } = useStrictHarness()
const VALUE = { from: '2024-05-01T10:00:00.000Z', to: '2024-05-01T11:00:00.000Z' }

describe('TimeRangePicker contract: accessible name', () => {
  it.each(['popover', 'inline', 'segmented'])('throws in the %s variant when nothing names it, saying how to fix it', async (variant) => {
    await mountTree(() => h(TimeRangePicker, { variant: variant as never, modelValue: VALUE }))
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('TimeRangePicker: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })

  it('throws for an aria-labelledby that points at nothing, or only at the trigger and its value', async () => {
    await mountTree(() => h(TimeRangePicker, { 'aria-labelledby': 'missing' }))
    expect(errors).toHaveLength(1)
    await mountTree(() => h(TimeRangePicker, { id: 'self', 'aria-labelledby': 'self' }))
    expect(errors).toHaveLength(1)
  })

  it.each([
    ['aria-label', () => h(TimeRangePicker, { 'aria-label': 'Window' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Window'), h(TimeRangePicker, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Window', required: true }, () => h(TimeRangePicker, { clearable: true, modelValue: VALUE }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Window', default: () => h(TimeRangePicker) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Window'), default: () => h(TimeRangePicker) })],
    ['a Label for the id', () => [h(Label, { for: 't' }, () => 'Window'), h(TimeRangePicker, { id: 't' })]],
    ['a wrapping label', () => h('label', null, ['Window', h(TimeRangePicker)])],
  ])('the popover is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })

  it.each([
    ['aria-label', () => h(TimeRangePicker, { variant: 'inline', 'aria-label': 'Window' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Window'), h(TimeRangePicker, { variant: 'segmented', 'aria-labelledby': 'n' })]],
    ['a Field label', () => h(Field, { label: 'Window' }, () => h(TimeRangePicker, { variant: 'inline' }))],
    ['a Field label for the segmented variant', () => h(Field, { label: 'Window' }, () => h(TimeRangePicker, { variant: 'segmented' }))],
  ])('the inline and segmented variants are satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('TimeRangePicker contract: texts and values', () => {
  it.each(['presetsLabel', 'fromLabel', 'toLabel', 'applyLabel'])('throws on a blank %s', async (prop) => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', [prop]: '  ' }))
    expect(errors.some((e) => e.message.includes(`TimeRangePicker: requires a non-empty \`${prop}\``))).toBe(true)
  })

  it('throws on a blank dialogLabel, and on a blank clearLabel only with clearable', async () => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', dialogLabel: ' ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeRangePicker: requires a non-empty `dialogLabel`')
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', clearLabel: '' }))
    expect(errors).toEqual([])
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', clearable: true, clearLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeRangePicker: requires a non-empty `clearLabel`')
  })

  it('throws when timeZone is not an IANA zone, saying what is shown instead', async () => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', timeZone: 'Mars/Base' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeRangePicker: requires `timeZone` to be an IANA zone name')
    expect(errors[0].message).toContain('"Mars/Base"')
    expect(errors[0].message).toContain('UTC')
  })

  it('a hostile timeZone is reported without echoing all of it', async () => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', timeZone: 'x'.repeat(10_000) }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message.length).toBeLessThan(400)
  })

  it.each(['UTC', 'Europe/Warsaw', 'America/New_York', 'Asia/Kolkata', 'utc'])('accepts the zone %s', async (timeZone) => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', timeZone }))
    expect(errors).toEqual([])
  })

  it('throws for a preset id that does not exist', async () => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', presets: ['today', 'last-9-years'] as never }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TimeRangePicker: requires every entry of `presets` to be one of')
    expect(errors[0].message).toContain('last-30-days')
  })

  it('accepts every documented preset id, in any order', async () => {
    await mountTree(() => h(TimeRangePicker, { 'aria-label': 'Window', presets: ['custom', 'yesterday', 'today', 'last-30-days', 'last-7-days', 'last-24-hours', 'last-6-hours', 'last-1-hour', 'last-30-minutes', 'last-15-minutes'] }))
    expect(errors).toEqual([])
  })
})

describe('TimeRangePicker contract: no false positives', () => {
  it.each(['popover', 'inline', 'segmented'])('the %s variant with an open dropdown, a range and every part adds no violation', async (variant) => {
    await mountTree(() => h(TimeRangePicker, { variant: variant as never, 'aria-label': 'Window', open: true, modelValue: VALUE, clearable: true, required: true, status: 'success', timeZone: 'Europe/Warsaw' }))
    expect(document.body.querySelector('[data-slot=time-range-picker-content]')).not.toBeNull()
    expect(errors).toEqual([])
  })

  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(TimeRangePicker, { timeZone: 'Mars/Base' }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TimeRangePicker: needs an accessible name'))).toBe(true)
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TimeRangePicker: requires `timeZone`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(TimeRangePicker, { timeZone: 'Mars/Base', presets: ['x'] as never }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
