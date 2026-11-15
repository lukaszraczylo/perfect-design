import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Input from '../Input/Input.vue'
import Textarea from '../Textarea/Textarea.vue'
import NativeSelect from '../NativeSelect/NativeSelect.vue'
import RadioGroup from '../RadioGroup/RadioGroup.vue'
import RadioGroupItem from '../RadioGroup/RadioGroupItem.vue'
import Field from './Field.vue'

const { errors, mountTree } = useStrictHarness()
const names = () => errors.map((e) => e.message)

describe('Field contract', () => {
  it('throws when it wraps an unnamed control and has no label', async () => {
    await mountTree(() => h(Field, { hint: 'Hint' }, () => h(Input)))
    expect(names().some((m) => m.includes('Field: requires a `label`'))).toBe(true)
    expect(names().find((m) => m.startsWith('[perfect-design] Field'))).toContain('VisuallyHidden')
  })
  it.each([
    ['a label prop', () => h(Field, { label: 'Name' }, () => h(Input))],
    ['a label slot', () => h(Field, null, { label: () => 'Name', default: () => h(Input) })],
    ['an aria-label on the Field', () => h(Field, { 'aria-label': 'Name' }, () => h(Input))],
    ['an aria-labelledby on the Field', () => h(Field, { 'aria-labelledby': 'x' }, () => h(Input))],
    ['a control that carries its own name', () => h(Field, { hint: 'Hint' }, () => h(Input, { 'aria-label': 'Name' }))],
    ['a Field with no control inside', () => h(Field, { hint: 'Only text' }, () => h('p', 'Text'))],
    ['a labelled textarea', () => h(Field, { label: 'Notes' }, () => h(Textarea))],
    ['a labelled native select', () => h(Field, { label: 'Country' }, () => h(NativeSelect, null, () => h('option', { value: 'pl' }, 'Poland')))],
    ['a labelled radio group (named by aria-labelledby)', () => h(Field, { label: 'Plan' }, () => h(RadioGroup, null, () => h(RadioGroupItem, { value: 'a', label: 'A' })))],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(names().filter((m) => m.startsWith('[perfect-design] Field'))).toEqual([])
  })
  it('throws when the control uses a different id than the label points at', async () => {
    await mountTree(() => h(Field, { label: 'Name' }, () => h(Input, { id: 'other' })))
    const msg = names().find((m) => m.startsWith('[perfect-design] Field'))
    expect(msg).toContain('its label points at id')
    expect(msg).toContain('<Field id="...">')
  })
  it('is satisfied when the Field and the control share an explicit id', async () => {
    await mountTree(() => h(Field, { label: 'Name', id: 'shared' }, () => h(Input, { id: 'shared' })))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Field, null, () => h(Input)))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Field: requires a `label`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Field, null, () => h(Input)))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
