import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './index'

const { errors, mountTree } = useStrictHarness()

const trigger = (props: Record<string, unknown> = {}) => h(SelectTrigger, props, () => h(SelectValue, { placeholder: 'Pick one' }))
const content = () => h(SelectContent, null, () => [h(SelectItem, { value: 'a' }, () => 'Alpha'), h(SelectItem, { value: 'b' }, () => 'Beta')])
const select = (triggerProps: Record<string, unknown> = {}, selectProps: Record<string, unknown> = {}) =>
  h(Select, selectProps, () => [trigger(triggerProps), content()])

describe('SelectTrigger accessible name', () => {
  it('throws when nothing names the trigger, saying how to fix it', async () => {
    await mountTree(() => select())
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('SelectTrigger: needs an accessible name')
    expect(errors[0].message).toContain('Field')
    expect(errors[0].message).toContain('aria-label')
  })
  it('the selected value is not a name', async () => {
    await mountTree(() => select({}, { defaultValue: 'a' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => select({ 'aria-label': 'Choice' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Choice'), select({ 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Choice' }, () => select())],
    ['a Field label slot', () => h(Field, null, { label: () => 'Choice', default: () => select() })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Choice'), default: () => select() })],
    ['a Label for the id', () => [h(Label, { for: 't' }, () => 'Choice'), select({ id: 't' })]],
    ['a wrapping label', () => h('label', null, ['Choice', select()])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('Select required parts', () => {
  const named = { 'aria-label': 'Choice' }
  it('throws when there is no SelectTrigger', async () => {
    await mountTree(() => h(Select, null, () => content()))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('Select: requires a SelectTrigger')])
  })
  it('throws when the trigger has no SelectValue', async () => {
    await mountTree(() => h(Select, null, () => [h(SelectTrigger, named), content()]))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('Select: requires a SelectValue')])
    expect(errors[0].message).toContain('placeholder')
  })
  it('throws when there is no SelectContent', async () => {
    await mountTree(() => h(Select, null, () => trigger(named)))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('Select: requires a SelectContent')])
  })
  it('is satisfied by the documented composition', async () => {
    await mountTree(() => select(named))
    expect(errors).toEqual([])
  })
})

describe('SelectItem value', () => {
  const withItem = (props: Record<string, unknown>) =>
    h(Select, null, () => [trigger({ 'aria-label': 'Choice' }), h(SelectContent, null, () => [h(SelectItem, props as never, () => 'None'), h(SelectItem, { value: 'b' }, () => 'Beta')])])
  it('throws a ContractError for an empty value instead of crashing the renderer', async () => {
    await mountTree(() => withItem({ value: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('SelectItem: requires a non-empty `value`')
    expect(errors[0].message).toContain('placeholder')
  })
  it('throws when the value is missing', async () => {
    await mountTree(() => withItem({}))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('SelectItem: requires a non-empty `value`')])
  })
  it('accepts a real value', async () => {
    await mountTree(() => withItem({ value: 'a' }))
    expect(errors).toEqual([])
  })
})

describe('Select modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Select, null, () => [h(SelectTrigger), h(SelectContent, null, () => h(SelectItem, { value: '' }, () => 'x'))]))
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('SelectTrigger: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('Select: requires a SelectValue'))).toBe(true)
    expect(logged.some((m) => m.includes('SelectItem: requires a non-empty `value`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Select, null, () => [h(SelectTrigger), h(SelectContent, null, () => h(SelectItem, { value: '' }, () => 'x'))]))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
