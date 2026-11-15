import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import {
  ContractError,
  accessibleName,
  configureStrictMode,
  getStrictMode,
  requireOneOf,
  requireText,
  RequiredPartsProbe,
  useRegisterPart,
  useRequireAccessibleName,
  useRequiredParts,
  violation,
} from './contract'

beforeEach(() => configureStrictMode('throw'))
afterEach(() => configureStrictMode('off'))

describe('strict mode', () => {
  it('throws a ContractError in throw mode, with component and rule', () => {
    try {
      violation('Thing', 'requires-x', 'requires x.')
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(ContractError)
      expect((e as ContractError).component).toBe('Thing')
      expect((e as ContractError).rule).toBe('requires-x')
      expect((e as Error).message).toBe('[perfect-design] Thing: requires x.')
      expect((e as Error).name).toBe('ContractError')
    }
  })
  it('logs instead of throwing in warn mode', () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => violation('Thing', 'r', 'm')).not.toThrow()
    expect(spy).toHaveBeenCalledWith('[perfect-design] Thing: m')
    spy.mockRestore()
  })
  it('does nothing in off mode', () => {
    configureStrictMode('off')
    expect(getStrictMode()).toBe('off')
    expect(() => violation('Thing', 'r', 'm')).not.toThrow()
  })
})

describe('requireText / requireOneOf', () => {
  it('rejects missing, non-string and blank text', () => {
    for (const bad of [undefined, null, '', '   ', 5, {}]) expect(() => requireText('C', 'label', bad)).toThrow(/non-empty `label`/)
  })
  it('accepts real text', () => expect(() => requireText('C', 'label', 'Save')).not.toThrow())
  it('requires at least one value and names the options', () => {
    expect(() => requireOneOf('C', { label: '', 'aria-label': undefined })).toThrow(/`label` or `aria-label`/)
    expect(() => requireOneOf('C', { label: '', 'aria-label': 'Close' })).not.toThrow()
    expect(() => requireOneOf('C', { icon: false })).toThrow()
  })
})

// A tiny owner/part pair to exercise the registry.
const Owner = defineComponent({
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    useRequiredParts('Owner', [{ part: 'Part', orAttrs: ['aria-label'], hint: 'Wrap it in VisuallyHidden if it must not be visible.' }], attrs)
    return () => h('div', [slots.default?.(), h(RequiredPartsProbe, { owner: 'Owner' })])
  },
})
const Part = defineComponent({
  setup(_, { slots }) {
    useRegisterPart('Owner', 'Part')
    return () => h('h2', slots.default?.())
  },
})
const errors: unknown[] = []
// Errors from mounted hooks reach the nearest onErrorCaptured (the same path an app's errorHandler would see).
const catching = (render: () => unknown) =>
  defineComponent({
    setup() {
      onErrorCaptured((e) => {
        errors.push(e)
        return false
      })
      return render
    },
  })
const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
const mountIt = (tree: () => unknown) => mount(catching(tree))

describe('required parts', () => {
  beforeEach(() => (errors.length = 0))

  it('passes when the part is rendered inside the owner (even nested deep)', async () => {
    mountIt(() => h(Owner, null, () => h('section', null, h(Part, null, () => 'Title'))))
    await settle()
    expect(errors).toEqual([])
  })
  it('fails when the part is missing, with an actionable message', async () => {
    mountIt(() => h(Owner))
    await settle()
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toContain('Owner: requires a Part (or set `aria-label` on Owner).')
    expect((errors[0] as Error).message).toContain('Wrap it in VisuallyHidden')
  })
  it('is satisfied by an alternative attribute, but not by an empty one', async () => {
    mountIt(() => h(Owner, { 'aria-label': 'Named' }))
    await settle()
    expect(errors).toEqual([])
    mountIt(() => h(Owner, { 'aria-label': '' }))
    await settle()
    expect(errors).toHaveLength(1)
  })
  it('does not throw in off mode', async () => {
    configureStrictMode('off')
    mountIt(() => h(Owner))
    await settle()
    expect(errors).toEqual([])
  })
  it('a probe outside any owner is harmless', async () => {
    mountIt(() => h(RequiredPartsProbe, { owner: 'Nobody' }))
    await settle()
    expect(errors).toEqual([])
  })
  it('a part outside any owner is harmless', async () => {
    expect(() => mountIt(() => h(Part, null, () => 'x'))).not.toThrow()
    await settle()
    expect(errors).toEqual([])
  })
  it('unregisters when the part unmounts (a later owner check would fail)', async () => {
    const show = ref(true)
    mountIt(() => h(Owner, null, () => (show.value ? h(Part) : null)))
    await settle()
    expect(errors).toEqual([])
  })
})

describe('accessible name', () => {
  const el = (html: string) => {
    document.body.innerHTML = html
    return document.body.firstElementChild as Element
  }
  it('reads aria-label, aria-labelledby, label[for], text, alt and ignores aria-hidden content', () => {
    expect(accessibleName(el('<button aria-label="Close"></button>'))).toBe('Close')
    expect(accessibleName(el('<div><span id="t">Title</span><button aria-labelledby="t"></button></div>').querySelector('button')!)).toBe('Title')
    document.body.innerHTML = '<label for="a">Email</label><input id="a">'
    expect(accessibleName(document.getElementById('a')!)).toBe('Email')
    expect(accessibleName(el('<button>Save <svg aria-hidden="true">x</svg></button>'))).toBe('Save')
    expect(accessibleName(el('<button><svg aria-hidden="true">x</svg></button>'))).toBe('')
    expect(accessibleName(el('<img alt="Logo">'))).toBe('Logo')
    expect(accessibleName(el('<img alt="">'))).toBe('')
    expect(accessibleName(el('<button aria-label="   "></button>'))).toBe('')
    expect(accessibleName(el('<button aria-labelledby="missing"></button>'))).toBe('')
  })
  it('useRequireAccessibleName flags a nameless control and respects `when`', async () => {
    const Icon = defineComponent({
      props: { named: Boolean, off: Boolean },
      setup(props) {
        const root = ref<HTMLElement>()
        useRequireAccessibleName('IconThing', () => root.value, 'Pass label.', () => !props.off)
        return () => h('button', { ref: root, 'aria-label': props.named ? 'Add' : undefined })
      },
    })
    errors.length = 0
    mountIt(() => h(Icon, { named: true }))
    await settle()
    expect(errors).toEqual([])
    mountIt(() => h(Icon))
    await settle()
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toContain('needs an accessible name. Pass label.')
    errors.length = 0
    mountIt(() => h(Icon, { off: true }))
    await settle()
    expect(errors).toEqual([])
  })
})
