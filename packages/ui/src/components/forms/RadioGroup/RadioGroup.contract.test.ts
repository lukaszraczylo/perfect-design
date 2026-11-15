import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Fieldset from '../Fieldset/Fieldset.vue'
import RadioGroup from './RadioGroup.vue'
import RadioGroupItem from './RadioGroupItem.vue'

const { errors, mountTree } = useStrictHarness()
const items = () => [h(RadioGroupItem, { value: 'a', label: 'Alpha' }), h(RadioGroupItem, { value: 'b', label: 'Beta' })]
const group = (props: Record<string, unknown> = {}, children: () => unknown = items) => h(RadioGroup, props, children as never)

describe('RadioGroup accessible name', () => {
  it('throws when nothing names the group, saying how to fix it', async () => {
    await mountTree(() => group())
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('RadioGroup: needs an accessible name')
    expect(errors[0].message).toContain('Field')
    expect(errors[0].message).toContain('Fieldset')
  })
  it.each([
    ['aria-label', () => group({ 'aria-label': 'Size' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Size'), group({ 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Size' }, () => group())],
    ['a Field label slot', () => h(Field, null, { label: () => 'Size', default: () => group() })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Size'), default: () => group() })],
    ['a Fieldset legend', () => h(Fieldset, { legend: 'Size' }, () => group())],
    ['a named role=group ancestor', () => h('div', { role: 'group', 'aria-label': 'Size' }, [group()])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('an unnamed role=group ancestor does not count', async () => {
    await mountTree(() => h('div', { role: 'group' }, [group()]))
    expect(errors).toHaveLength(1)
  })
})

describe('RadioGroupItem', () => {
  const named = { 'aria-label': 'Size' }
  it('throws when the value is empty', async () => {
    await mountTree(() => group(named, () => [h(RadioGroupItem, { value: '', label: 'None' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('RadioGroupItem: requires a non-empty `value`')
  })
  it('throws when the value is missing', async () => {
    await mountTree(() => group(named, () => [h(RadioGroupItem, { label: 'No value' } as never)]))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('RadioGroupItem: requires a non-empty `value`')])
  })
  it('throws when the item has no label, saying how to fix it', async () => {
    await mountTree(() => group(named, () => [h(RadioGroupItem, { value: 'a' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioGroupItem: needs an accessible name')
    expect(errors[0].message).toContain('label')
  })
  it.each([
    ['the label prop', () => h(RadioGroupItem, { value: 'a', label: 'Alpha' })],
    ['the default slot', () => h(RadioGroupItem, { value: 'a' }, () => 'Alpha')],
    ['rich default slot content', () => h(RadioGroupItem, { value: 'a' }, () => [h('strong', null, 'Alpha'), ' (default)'])],
    ['aria-label', () => h(RadioGroupItem, { value: 'a', 'aria-label': 'Alpha' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Alpha'), h(RadioGroupItem, { value: 'a', 'aria-labelledby': 'n' })]],
    ['a wrapping label', () => h('label', null, ['Alpha', h(RadioGroupItem, { value: 'a' })])],
  ])('is satisfied by %s', async (_n, item) => {
    await mountTree(() => group(named, () => item()))
    expect(errors).toEqual([])
  })
})

describe('variations keep every requirement', () => {
  const variant = { size: 'lg', tone: 'success', labelPosition: 'start' }
  it('an unnamed group still throws with a size, tone and label position', async () => {
    await mountTree(() => group(variant))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioGroup: needs an accessible name')
  })
  it('an item with a variation still needs a value and a name', async () => {
    await mountTree(() => group({ 'aria-label': 'Size' }, () => [h(RadioGroupItem, { value: '', label: 'None', tone: 'danger', size: 'sm' })]))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('RadioGroupItem: requires a non-empty `value`')])
    await mountTree(() => group({ 'aria-label': 'Size' }, () => [h(RadioGroupItem, { value: 'a', description: 'Only a description', tone: 'danger', labelPosition: 'start' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioGroupItem: needs an accessible name')
  })
  it('a fully varied, correctly named group passes', async () => {
    await mountTree(() => group({ 'aria-label': 'Size', ...variant }, () => [h(RadioGroupItem, { value: 'a', label: 'Alpha', description: 'First option', size: 'sm', tone: 'info' })]))
    expect(errors).toEqual([])
  })
})

describe('RadioGroup modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    const bad = () => group({}, () => [h(RadioGroupItem, { value: '' })])
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(bad)
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('RadioGroup: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('RadioGroupItem: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('RadioGroupItem: requires a non-empty `value`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(bad)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
