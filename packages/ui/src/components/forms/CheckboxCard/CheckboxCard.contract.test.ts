import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { faCheck } from '../../../lib/icons'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Icon from '../../primitives/Icon/Icon.vue'
import Field from '../Field/Field.vue'
import Fieldset from '../Fieldset/Fieldset.vue'
import CheckboxCard from './CheckboxCard.vue'
import CheckboxCardGroup from './CheckboxCardGroup.vue'

const { errors, mountTree } = useStrictHarness()
const card = (props: Record<string, unknown> = {}, slots?: Record<string, unknown>) => h(CheckboxCard, { title: 'Email', ...props }, slots as never)
const group = (props: Record<string, unknown> = {}, children: () => unknown = () => [card({ value: 'email' }), card({ value: 'sms', title: 'SMS' })]) =>
  h(CheckboxCardGroup, { 'aria-label': 'Channels', ...props }, children as never)

describe('CheckboxCard accessible name', () => {
  it('throws when the card has no text at all, saying how to fix it', async () => {
    await mountTree(() => h(CheckboxCard, { icon: faCheck }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('CheckboxCard: needs an accessible name')
    expect(errors[0].message).toContain('title')
  })
  it.each([
    ['the title prop', () => h(CheckboxCard, { title: 'Email' })],
    ['the title slot', () => h(CheckboxCard, null, { title: () => 'Email' })],
    ['the description alone', () => h(CheckboxCard, { description: 'Send me email' })],
    ['default slot text', () => h(CheckboxCard, null, () => 'Email')],
    ['visually hidden default slot text', () => h(CheckboxCard, { icon: faCheck }, () => h(VisuallyHidden, null, () => 'Email'))],
    ['aria-label', () => h(CheckboxCard, { icon: faCheck, 'aria-label': 'Email' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Email'), h(CheckboxCard, { icon: faCheck, 'aria-labelledby': 'n' })]],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('an icon slot alone is not a name', async () => {
    await mountTree(() => h(CheckboxCard, null, { icon: () => h(Icon, { icon: faCheck }) }))
    expect(errors).toHaveLength(1)
  })
})

describe('CheckboxCardGroup name', () => {
  it('throws when nothing names the group, saying how to fix it', async () => {
    await mountTree(() => group({ 'aria-label': undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CheckboxCardGroup: needs an accessible name')
    expect(errors[0].message).toContain('Fieldset')
  })
  it.each([
    ['aria-label', () => group()],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Channels'), group({ 'aria-label': undefined, 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Channels' }, () => group({ 'aria-label': undefined }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Channels', default: () => group({ 'aria-label': undefined }) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Channels'), default: () => group({ 'aria-label': undefined }) })],
    ['a Fieldset legend', () => h(Fieldset, { legend: 'Channels' }, () => group({ 'aria-label': undefined }))],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('CheckboxCard value inside a group', () => {
  it('throws when a card has no value, because it would not join the group', async () => {
    await mountTree(() => group({}, () => [card({ value: 'email' }), card({ title: 'SMS' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CheckboxCard: requires a non-empty string `value` inside CheckboxCardGroup')
  })
  it('throws when the value is empty', async () => {
    await mountTree(() => group({}, () => [card({ value: '' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a non-empty string `value`')
  })
  it('throws once when two cards share a value, naming it', async () => {
    await mountTree(() => group({}, () => [card({ value: 'email' }), card({ value: 'email', title: 'Again' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CheckboxCard: requires a unique `value` inside CheckboxCardGroup, but "email" is used by another card')
  })
  it('accepts unique values, including cards added later', async () => {
    await mountTree(() => group())
    expect(errors).toEqual([])
  })
  it('does not need a value outside a group', async () => {
    await mountTree(() => card())
    expect(errors).toEqual([])
  })
})

describe('CheckboxCard modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    const bad = () => h(CheckboxCardGroup, null, () => [h(CheckboxCard, { icon: faCheck, value: '' })])
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(bad)
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('CheckboxCardGroup: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('CheckboxCard: needs an accessible name'))).toBe(true)
    expect(logged.some((m) => m.includes('CheckboxCard: requires a non-empty string `value`'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(bad)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
