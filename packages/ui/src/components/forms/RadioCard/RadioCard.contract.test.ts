import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { faCheck } from '../../../lib/icons'
import { useStrictHarness, settle } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Fieldset from '../Fieldset/Fieldset.vue'
import RadioCard from './RadioCard.vue'
import RadioCardGroup from './RadioCardGroup.vue'

const { errors, mountTree } = useStrictHarness()
const card = (props: Record<string, unknown> = {}, slots?: unknown) => h(RadioCard, { value: 'a', title: 'Starter', ...props } as never, slots as never)
const group = (props: Record<string, unknown> = {}, children: () => unknown = () => [card(), card({ value: 'b', title: 'Team' })]) =>
  h(RadioCardGroup, { 'aria-label': 'Plan', ...props }, children as never)

describe('RadioCard group', () => {
  it('throws when the card is not inside a RadioCardGroup, saying how to fix it', async () => {
    await mountTree(() => card())
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('RadioCard: requires a surrounding RadioCardGroup')
    expect(errors[0].message).toContain('<RadioCardGroup v-model')
  })
  it('is satisfied by a RadioCardGroup, also through wrapper components', async () => {
    await mountTree(() => group({}, () => h('div', null, [card(), card({ value: 'b' })])))
    expect(errors).toEqual([])
  })
})

describe('RadioCard accessible name', () => {
  it('throws when the card has no text at all, saying how to fix it', async () => {
    await mountTree(() => group({}, () => card({ title: undefined, icon: faCheck })))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioCard: needs an accessible name')
    expect(errors[0].message).toContain('title')
  })
  it.each([
    ['the title prop', () => card()],
    ['the title slot', () => card({ title: undefined }, { title: () => 'Starter' })],
    ['the description alone', () => card({ title: undefined, description: 'Free forever' })],
    ['default slot text', () => card({ title: undefined }, () => 'Starter')],
    ['visually hidden default slot text', () => card({ title: undefined, icon: faCheck }, () => h(VisuallyHidden, null, () => 'Starter'))],
    ['aria-label', () => card({ title: undefined, icon: faCheck, 'aria-label': 'Starter' })],
  ])('is satisfied by %s', async (_n, item) => {
    await mountTree(() => group({}, item))
    expect(errors).toEqual([])
  })
})

describe('RadioCardGroup name', () => {
  it('throws when nothing names the group, saying how to fix it', async () => {
    await mountTree(() => group({ 'aria-label': undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioCardGroup: needs an accessible name')
    expect(errors[0].message).toContain('Fieldset')
  })
  it.each([
    ['aria-label', () => group()],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Plan'), group({ 'aria-label': undefined, 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Plan' }, () => group({ 'aria-label': undefined }))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Plan', default: () => group({ 'aria-label': undefined }) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Plan'), default: () => group({ 'aria-label': undefined }) })],
    ['a Fieldset legend', () => h(Fieldset, { legend: 'Plan' }, () => group({ 'aria-label': undefined }))],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
})

describe('RadioCard value', () => {
  it('throws when the value is empty', async () => {
    await mountTree(() => group({}, () => [card({ value: '' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioCard: requires a non-empty string `value` inside RadioCardGroup')
  })
  it('throws when the value is missing', async () => {
    await mountTree(() => group({}, () => [card({ value: undefined })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a non-empty string `value`')
  })
  it('throws once when two cards share a value, naming it', async () => {
    await mountTree(() => group({}, () => [card(), card({ title: 'Again' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioCard: requires a unique `value` inside RadioCardGroup, but "a" is used by another card')
  })
  it('a duplicate that unmounts before the check does not report', async () => {
    const seen: Error[] = []
    const w = mount(
      defineComponent({
        setup() {
          onErrorCaptured((e) => {
            seen.push(e as Error)
            return false
          })
          return () => group({}, () => [card(), card({ title: 'Again' })])
        },
      }),
    )
    w.unmount()
    await settle()
    expect(seen).toEqual([])
  })
})

describe('RadioCard modes', () => {
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => card({ title: undefined, icon: faCheck }))
    expect(errors).toEqual([])
    const logged = spy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((m) => m.includes('RadioCard: requires a surrounding RadioCardGroup'))).toBe(true)
    expect(logged.some((m) => m.includes('RadioCard: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => card({ title: undefined, icon: faCheck }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
