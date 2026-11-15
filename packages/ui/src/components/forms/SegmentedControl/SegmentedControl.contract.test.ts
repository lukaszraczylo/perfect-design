import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { faCheck } from '../../../lib/icons'
import { settle, useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Icon from '../../primitives/Icon/Icon.vue'
import Field from '../Field/Field.vue'
import Fieldset from '../Fieldset/Fieldset.vue'
import SegmentedControl from './SegmentedControl.vue'

const { errors, mountTree } = useStrictHarness()
const options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
]
const segmented = (props: Record<string, unknown> = {}, slots?: Record<string, unknown>) => h(SegmentedControl, { options, ...props }, slots as never)

describe('SegmentedControl group name', () => {
  it('throws when nothing names the group, saying how to fix it', async () => {
    await mountTree(() => segmented())
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('SegmentedControl: needs an accessible name')
    expect(errors[0].message).toContain('Field')
  })
  it.each([
    ['aria-label', () => segmented({ 'aria-label': 'Range' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Range'), segmented({ 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Range' }, () => segmented())],
    ['a Field label slot', () => h(Field, null, { label: () => 'Range', default: () => segmented() })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Range'), default: () => segmented() })],
    ['a Fieldset legend', () => h(Fieldset, { legend: 'Range' }, () => segmented())],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('SegmentedControl options', () => {
  const named = { 'aria-label': 'Range' }
  it('throws when an option has no text label, naming it', async () => {
    await mountTree(() => segmented({ ...named, options: [{ value: 'day', label: '' }, { value: 'week', label: 'Week' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SegmentedControl: requires a text `label` on every option, but "day" has none')
    expect(errors[0].message).toContain('Icon-only')
  })
  it('an icon alone is not a label', async () => {
    await mountTree(() => segmented({ ...named, options: [{ value: 'day', label: '', icon: faCheck }] }))
    expect(errors).toHaveLength(1)
  })
  it('an icon with a label passes', async () => {
    await mountTree(() => segmented({ ...named, options: [{ value: 'day', label: 'Day', icon: faCheck }] }))
    expect(errors).toEqual([])
  })
  it('the option slot may supply the text, visually hidden or not', async () => {
    const options = [{ value: 'day', label: '' }]
    await mountTree(() => segmented({ ...named, options }, { option: () => [h(Icon, { icon: faCheck }), h(VisuallyHidden, null, () => 'Day')] }))
    expect(errors).toEqual([])
    await mountTree(() => segmented({ ...named, options }, { option: () => h(Icon, { icon: faCheck }) }))
    expect(errors).toHaveLength(1)
  })
  it('throws for an empty value', async () => {
    await mountTree(() => segmented({ ...named, options: [{ value: '', label: 'None' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SegmentedControl: requires a non-empty string `value` on every option')
  })
  it('throws for a duplicate value, naming it', async () => {
    await mountTree(() => segmented({ ...named, options: [...options, { value: 'day', label: 'Again' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SegmentedControl: requires a unique `value` on every option, but "day" is used more than once')
  })
  it('tolerates options that are not an array', async () => {
    await mountTree(() => segmented({ ...named, options: null as never }))
    expect(errors).toEqual([])
  })
  it('does nothing when it unmounts before the check runs', async () => {
    mount(SegmentedControl, { props: { options } }).unmount()
    await settle()
    expect(errors).toEqual([])
  })
  it('accepts no options at all', async () => {
    await mountTree(() => segmented({ ...named, options: [] }))
    expect(errors).toEqual([])
  })
})

describe('SegmentedControl modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    const bad = () => segmented({ options: [{ value: '', label: '' }] })
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(bad)
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('SegmentedControl: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('SegmentedControl: requires a non-empty string `value`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(bad)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
