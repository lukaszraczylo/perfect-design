import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import MultiSelect from './MultiSelect.vue'

const { errors, mountTree } = useStrictHarness()
const options = [
  { value: 'ts', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
]
const multi = (props: Record<string, unknown> = {}) => h(MultiSelect, { options, ...props })

describe('MultiSelect trigger accessible name', () => {
  it('throws when nothing names the trigger, saying how to fix it', async () => {
    await mountTree(() => multi())
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('MultiSelect: needs an accessible name for its trigger')
    expect(errors[0].message).toContain('Field')
  })
  it('the chips and the placeholder are not a name', async () => {
    await mountTree(() => multi({ placeholder: 'Languages', defaultValue: ['ts'] }))
    expect(errors).toHaveLength(1)
  })
  it('a blank aria-label is not a name', async () => {
    await mountTree(() => multi({ 'aria-label': '  ' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => multi({ 'aria-label': 'Languages' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Languages'), multi({ 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Languages' }, () => multi())],
    ['a Field label slot', () => h(Field, null, { label: () => 'Languages', default: () => multi() })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Languages'), default: () => multi() })],
    ['a Label for the id', () => [h(Label, { for: 'm' }, () => 'Languages'), multi({ id: 'm' })]],
    ['a wrapping label', () => h('label', null, ['Languages', multi()])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('MultiSelect option values', () => {
  const named = { 'aria-label': 'Languages' }
  it('throws for an empty value', async () => {
    await mountTree(() => multi({ ...named, options: [{ value: '', label: 'None' }, ...options] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('MultiSelect: requires a non-empty string `value` on every option')
  })
  it('throws for a value that is not a string (it would be dropped silently)', async () => {
    await mountTree(() => multi({ ...named, options: [{ value: 1, label: 'One' }] }))
    expect(errors).toHaveLength(1)
  })
  it('throws for a duplicate value, naming it', async () => {
    await mountTree(() => multi({ ...named, options: [...options, { value: 'go', label: 'Golang' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('MultiSelect: requires a unique `value` on every option, but "go" is used more than once')
  })
  it('accepts unique non-empty values and an empty list', async () => {
    await mountTree(() => multi(named))
    expect(errors).toEqual([])
    await mountTree(() => multi({ ...named, options: [] }))
    expect(errors).toEqual([])
  })
})

describe('MultiSelect modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => multi({ options: [{ value: '', label: 'None' }] }))
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('MultiSelect: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('MultiSelect: requires a non-empty string `value`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => multi({ options: [{ value: '', label: 'None' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
