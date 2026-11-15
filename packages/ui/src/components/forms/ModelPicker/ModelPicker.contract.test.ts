import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import ModelPicker from './ModelPicker.vue'

const { errors, mountTree } = useStrictHarness()
const options = [
  { id: 'draft', label: 'Draft - fast' },
  { id: 'review', label: 'Review - careful' },
]
const picker = (props: Record<string, unknown> = {}) => h(ModelPicker, { options, ...props })
const named = { 'aria-label': 'Preset' }

describe('ModelPicker accessible name', () => {
  it('throws when nothing names the input, saying how to fix it', async () => {
    await mountTree(() => picker({ placeholder: 'Preset' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('ModelPicker: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => picker(named)],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Preset'), picker({ 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Preset' }, () => picker())],
    ['a Field label slot', () => h(Field, null, { label: () => 'Preset', default: () => picker() })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Preset'), default: () => picker() })],
    ['a Label for the id', () => [h(Label, { for: 'c' }, () => 'Preset'), picker({ id: 'c' })]],
    ['a wrapping label', () => h('label', null, ['Preset', picker()])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('ModelPicker option ids and labels', () => {
  it('throws for an empty id, saying what it is reserved for', async () => {
    await mountTree(() => picker({ ...named, options: [{ id: '', label: 'None' }, ...options] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ModelPicker: requires a non-empty string `id` on every option')
    expect(errors[0].message).toContain('nothing selected')
  })
  it('throws for a missing id and for a non-string id', async () => {
    await mountTree(() => picker({ ...named, options: [{ label: 'No id' }] }))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('requires a non-empty string `id`')])
    await mountTree(() => picker({ ...named, options: [{ id: 5, label: 'Number' }] }))
    expect(errors).toHaveLength(1)
  })
  it('throws for an option that is not an object', async () => {
    await mountTree(() => picker({ ...named, options: ['draft'] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a non-empty string `id`')
  })
  it('throws for a duplicate id, naming it, also across groups', async () => {
    await mountTree(() => picker({ ...named, options: [...options, { id: 'draft', label: 'Again' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ModelPicker: requires a unique `id` on every option, but "draft" is used more than once')
    await mountTree(() => picker({ ...named, options: [{ label: 'A', options: [options[0]] }, { label: 'B', options: [options[0]] }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('"draft" is used more than once')
  })
  it('throws for an option without a label, naming its id', async () => {
    await mountTree(() => picker({ ...named, options: [{ id: 'x', label: '  ' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ModelPicker: requires a non-empty `label` on every option, but "x" has none')
    await mountTree(() => picker({ ...named, options: [{ id: 'y' }] }))
    expect(errors).toHaveLength(1)
  })
  it('accepts unique ids with labels, groups, group keys and an empty list', async () => {
    await mountTree(() => picker(named))
    expect(errors).toEqual([])
    await mountTree(() => picker({ ...named, options: [] }))
    expect(errors).toEqual([])
    await mountTree(() => picker({ ...named, options: [{ label: 'Group', options }, { id: 'z', label: 'Z', group: 'Other' }] }))
    expect(errors).toEqual([])
  })
})

describe('ModelPicker group labels', () => {
  it('throws for a group without a label, saying how to fix it', async () => {
    await mountTree(() => picker({ ...named, options: [{ label: '', options }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ModelPicker: requires a non-empty `label` on every group')
    await mountTree(() => picker({ ...named, options: [{ options }] }))
    expect(errors).toHaveLength(1)
  })
})

describe('ModelPicker modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => picker({ options: [{ id: '', label: 'None' }] }))
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('ModelPicker: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('ModelPicker: requires a non-empty string `id`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => picker({ options: [{ id: '', label: 'None' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
