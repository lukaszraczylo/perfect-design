import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Rating from './Rating.vue'

const { errors, mountTree } = useStrictHarness()

describe('Rating contract', () => {
  it('throws when nothing says what is rated (the fallback "Rating" does not count), saying how to fix it', async () => {
    await mountTree(() => h(Rating, { modelValue: 3 }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Rating: needs an accessible name')
    expect(errors[0].message).toContain('Field')
    expect(errors[0].message).toContain('aria-label')
  })
  it('a blank aria-label is not a name', async () => {
    await mountTree(() => h(Rating, { 'aria-label': ' ' }))
    expect(errors).toHaveLength(1)
  })
  it.each([
    ['aria-label', () => h(Rating, { 'aria-label': 'Product rating' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Product rating'), h(Rating, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Your rating', required: true }, () => h(Rating))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Your rating', default: () => h(Rating) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Your rating'), default: () => h(Rating) })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('readonly, disabled and invalid variants need the same name, nothing more', async () => {
    await mountTree(() => [
      h(Rating, { readonly: true, modelValue: 3.5, allowHalf: true, 'aria-label': 'Average' }),
      h(Rating, { disabled: true, 'aria-label': 'Disabled' }),
      h(Rating, { invalid: true, name: 'score', 'aria-label': 'Invalid' }),
    ])
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Rating))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Rating: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Rating))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('Rating variations keep the contract', () => {
  const variations: [string, Record<string, unknown>][] = [
    ['tone and size', { tone: 'success', size: 'lg' }],
    ['heart icon with quarter precision', { icon: 'heart', precision: 0.25 }],
    ['an icon definition', { icon: { prefix: 'fas', iconName: 'sample', icon: [24, 24, [], 'f000', 'M0 0h24v24z'] } }],
  ]
  it.each(variations)('still throws for an unnamed rating with %s', async (_n, props) => {
    await mountTree(() => h(Rating, { modelValue: 3, ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Rating: needs an accessible name')
  })
  it.each(variations)('is silent for a named rating with %s', async (_n, props) => {
    await mountTree(() => h(Rating, { 'aria-label': 'Product rating', modelValue: 3, ...props }))
    expect(errors).toEqual([])
  })
})
