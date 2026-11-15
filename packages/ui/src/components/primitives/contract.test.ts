/**
 * Contract tests for the primitives: every documented requirement throws a ContractError in strict mode, is satisfied by
 * each accepted alternative, and stays quiet for normal usage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import { faCheck, faXmark } from '../../lib/icons'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { Button } from './Button'
import { Chip } from './Chip'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { Link } from './Link'
import { Progress } from './Progress'
import { ProgressRing } from './ProgressRing'
import { Toggle } from './Toggle'
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const mounted = (root: () => VNodeChild) => {
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body },
  )
  return settle()
}
const messages = () => errors.map((e) => e.message)

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('Button', () => {
  it.each(['icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const)('throws for an icon-only `%s` button without a name', async (size) => {
    await mounted(() => h(Button, { size }, () => h(Icon, { icon: faCheck })))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Button: needs an accessible name')
    expect(errors[0].message).toContain('IconButton')
  })
  it('is satisfied by aria-label, aria-labelledby or visible text', async () => {
    await mounted(() => [
      h('span', { id: 'btn-name' }, 'Close panel'),
      h(Button, { size: 'icon', 'aria-label': 'Close' }, () => h(Icon, { icon: faXmark })),
      h(Button, { size: 'icon-sm', 'aria-labelledby': 'btn-name' }, () => h(Icon, { icon: faXmark })),
      h(Button, { size: 'icon' }, () => 'Close'),
    ])
    expect(errors).toEqual([])
  })
  it('does not ask a text button to carry an aria-label', async () => {
    await mounted(() => [h(Button, null, () => 'Save'), h(Button, { size: 'sm' }, () => h(Icon, { icon: faCheck }))])
    expect(errors).toEqual([])
  })
  it('checks the child with asChild', async () => {
    await mounted(() => h(Button, { size: 'icon', asChild: true }, () => h('a', { href: '/x' }, h(Icon, { icon: faCheck }))))
    expect(errors).toHaveLength(1)
    wrapper?.unmount()
    errors.length = 0
    await mounted(() => h(Button, { size: 'icon', asChild: true }, () => h('a', { href: '/x', 'aria-label': 'Next' }, h(Icon, { icon: faCheck }))))
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('off')
    await mounted(() => h(Button, { size: 'icon' }, () => h(Icon, { icon: faCheck })))
    expect(errors).toEqual([])
    wrapper?.unmount()
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(Button, { size: 'icon' }, () => h(Icon, { icon: faCheck })))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Button: needs an accessible name'))
    spy.mockRestore()
  })
})

describe('IconButton', () => {
  it('throws when `label` is missing or blank, once', async () => {
    await mounted(() => [h(IconButton, { icon: faCheck } as never), h(IconButton, { icon: faCheck, label: '  ' })])
    expect(messages()).toHaveLength(2)
    expect(messages().every((m) => m.includes('IconButton: requires a non-empty `label`'))).toBe(true)
  })
  it('throws when it has neither an icon nor slot content', async () => {
    await mounted(() => h(IconButton, { label: 'Delete row' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('IconButton: requires an `icon`')
  })
  it('is satisfied by a label with an icon or with slot content', async () => {
    await mounted(() => [h(IconButton, { label: 'Delete row', icon: faXmark }), h(IconButton, { label: 'Confirm' }, () => h(Icon, { icon: faCheck }))])
    expect(errors).toEqual([])
  })
  it('does not throw in off mode and logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(IconButton, { label: '', icon: faCheck }))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('IconButton: requires a non-empty `label`'))
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(IconButton, { label: '', icon: faCheck }))
    expect(errors).toEqual([])
  })
})

describe('Toggle', () => {
  it('throws for an icon-only toggle without a name', async () => {
    await mounted(() => h(Toggle, null, () => h(Icon, { icon: faCheck })))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Toggle: needs an accessible name')
  })
  it('is satisfied by aria-label, aria-labelledby or visible text', async () => {
    await mounted(() => [
      h('span', { id: 'tg-name' }, 'Bold'),
      h(Toggle, { 'aria-label': 'Bold' }, () => h(Icon, { icon: faCheck })),
      h(Toggle, { 'aria-labelledby': 'tg-name' }, () => h(Icon, { icon: faCheck })),
      h(Toggle, null, () => 'Mute'),
    ])
    expect(errors).toEqual([])
  })
  it('does not check an element that takes no name from content', async () => {
    await mounted(() => h(Toggle, { as: 'div' }, () => h(Icon, { icon: faCheck })))
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(Toggle, null, () => h(Icon, { icon: faCheck })))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(Toggle, null, () => h(Icon, { icon: faCheck })))
    expect(errors).toEqual([])
  })
})

describe('ToggleGroup', () => {
  const item = (value: string, text?: string) => h(ToggleGroupItem, { value }, () => text ?? h(Icon, { icon: faCheck }))

  it('throws when the group has no label', async () => {
    await mounted(() => h(ToggleGroup, null, () => [item('a', 'A'), item('b', 'B')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ToggleGroup: requires `aria-label` or `aria-labelledby`')
  })
  it('is satisfied by aria-label or aria-labelledby, and not by an empty label', async () => {
    await mounted(() => [
      h('span', { id: 'grp-name' }, 'Alignment'),
      h(ToggleGroup, { 'aria-label': 'Alignment' }, () => item('a', 'A')),
      h(ToggleGroup, { 'aria-labelledby': 'grp-name' }, () => item('a', 'A')),
    ])
    expect(errors).toEqual([])
    wrapper?.unmount()
    await mounted(() => h(ToggleGroup, { 'aria-label': '' }, () => item('a', 'A')))
    expect(errors).toHaveLength(1)
  })
  it('throws for an icon-only item without a name, in either selection mode', async () => {
    await mounted(() => [
      h(ToggleGroup, { 'aria-label': 'One', type: 'single' }, () => item('a')),
      h(ToggleGroup, { 'aria-label': 'Many', type: 'multiple' }, () => item('b')),
    ])
    expect(errors).toHaveLength(2)
    expect(errors[0].message).toContain('ToggleGroupItem: needs an accessible name')
  })
  it('accepts named icon-only items', async () => {
    await mounted(() =>
      h(ToggleGroup, { 'aria-label': 'Alignment' }, () => [
        h(ToggleGroupItem, { value: 'left', 'aria-label': 'Align left' }, () => h(Icon, { icon: faCheck })),
        h(ToggleGroupItem, { value: 'right', 'aria-label': 'Align right' }, () => h(Icon, { icon: faCheck })),
      ]),
    )
    expect(errors).toEqual([])
  })
  it('throws for a blank value and for a value used twice', async () => {
    await mounted(() => h(ToggleGroup, { 'aria-label': 'Sizes' }, () => [item('', 'Blank')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ToggleGroupItem: requires a non-empty `value`')
    wrapper?.unmount()
    errors.length = 0
    await mounted(() => h(ToggleGroup, { 'aria-label': 'Sizes' }, () => [item('s', 'Small'), item('s', 'Also small'), item('l', 'Large')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ToggleGroupItem: value "s" is used by more than one item')
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(ToggleGroup, null, () => item('a', 'A')))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('ToggleGroup: requires'))
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(ToggleGroup, null, () => item('a', 'A')))
    expect(errors).toEqual([])
  })
})

describe('Chip', () => {
  it('throws when a removable chip has no label', async () => {
    await mounted(() => [h(Chip, { removable: true }, () => 'Design'), h(Chip, { removable: true, label: ' ' })])
    expect(errors).toHaveLength(2)
    expect(errors[0].message).toContain('Chip: requires a non-empty `label`')
  })
  it('is satisfied by a label, and a plain chip needs none', async () => {
    await mounted(() => [h(Chip, { removable: true, label: 'Design' }), h(Chip, null, () => 'Plain')])
    expect(errors).toEqual([])
  })
  it('throws when a selectable chip has no text, accepts a label or slot', async () => {
    await mounted(() => h(Chip, { selectable: true }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Chip: needs an accessible name')
    wrapper?.unmount()
    errors.length = 0
    await mounted(() => [h(Chip, { selectable: true, label: 'Open' }), h(Chip, { selectable: true }, () => 'Closed')])
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(Chip, { removable: true }))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Chip: requires a non-empty `label`'))
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(Chip, { removable: true }))
    expect(errors).toEqual([])
  })
})

describe('Avatar and AvatarGroup', () => {
  it('throws when an avatar has neither name nor alt', async () => {
    await mounted(() => h(Avatar, { fallback: 'AB' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Avatar: requires a `name` or an `alt`')
  })
  it('treats a blank name like a missing one', async () => {
    await mounted(() => h(Avatar, { name: '   ' }))
    expect(errors).toHaveLength(1)
  })
  it('is satisfied by name, alt, or an explicitly empty alt (decorative)', async () => {
    await mounted(() => [h(Avatar, { name: 'Ada Lovelace' }), h(Avatar, { src: '/a.png', alt: 'Ada at her desk' }), h(Avatar, { alt: '', fallback: 'AB' })])
    expect(errors).toEqual([])
  })
  it('requires every AvatarGroup item to be named', async () => {
    await mounted(() => h(AvatarGroup, { items: [{ name: 'Ada Lovelace' }, { src: '/b.png' }, { fallback: 'C' }] }))
    expect(errors).toHaveLength(2)
    expect(errors.every((e) => e.message.includes('Avatar: requires a `name` or an `alt`'))).toBe(true)
  })
  it('accepts named group items and named slotted avatars', async () => {
    await mounted(() =>
      h(AvatarGroup, { items: [{ name: 'Ada Lovelace' }, { alt: 'Grace' }], max: 1 }, () => h(Avatar, { name: 'Alan Turing' })),
    )
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(Avatar))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Avatar: requires a `name` or an `alt`'))
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(Avatar))
    expect(errors).toEqual([])
  })
})

describe('Progress and ProgressRing', () => {
  it('throws when a progress bar is not named', async () => {
    await mounted(() => h(Progress, { modelValue: 40 }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Progress: requires `label` or `aria-label` or `aria-labelledby`')
  })
  it('is satisfied by label, aria-label or aria-labelledby', async () => {
    await mounted(() => [
      h('span', { id: 'bar-name' }, 'Upload'),
      h(Progress, { modelValue: 40, label: 'Uploading' }),
      h(Progress, { modelValue: 40, 'aria-label': 'Uploading' }),
      h(Progress, { modelValue: 40, 'aria-labelledby': 'bar-name' }),
    ])
    expect(errors).toEqual([])
  })
  it('throws when a progress ring is not named', async () => {
    await mounted(() => h(ProgressRing, { value: 40 }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ProgressRing: requires `label` or `aria-label` or `aria-labelledby`')
  })
  it('accepts a named ring and still renders a fallback name when unnamed', async () => {
    await mounted(() => [h('span', { id: 'ring-name' }, 'Storage'), h(ProgressRing, { value: 40, label: 'Storage used' }), h(ProgressRing, { value: 1, 'aria-labelledby': 'ring-name' })])
    expect(errors).toEqual([])
    expect(document.querySelectorAll('[role=meter]')[0].getAttribute('aria-label')).toBe('Storage used')
    expect(document.querySelectorAll('[role=meter]')[1].getAttribute('aria-label')).toBeNull()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(ProgressRing, { value: 40 }))
    expect(document.querySelector('[role=meter]')?.getAttribute('aria-label')).toBe('Progress')
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => [h(Progress, { modelValue: 1 }), h(ProgressRing, { value: 1 })])
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledTimes(2)
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => [h(Progress, { modelValue: 1 }), h(ProgressRing, { value: 1 })])
    expect(errors).toEqual([])
  })
})

describe('Link', () => {
  it('throws when a plain link has no href', async () => {
    await mounted(() => h(Link, null, () => 'Docs'))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Link: requires an `href`')
    expect(errors[0].message).toContain('Button')
  })
  it('treats a blank href like a missing one', async () => {
    await mounted(() => h(Link, { href: '  ' }, () => 'Docs'))
    expect(errors).toHaveLength(1)
  })
  it('is satisfied by an href, a disabled link, or `as` a component that navigates', async () => {
    const RouterLinkLike = defineComponent({ props: { to: String }, setup: (p, { slots }) => () => h('a', { href: p.to }, slots.default?.()) })
    await mounted(() => [
      h(Link, { href: '/docs' }, () => 'Docs'),
      h(Link, { disabled: true }, () => 'Soon'),
      h(Link, { as: RouterLinkLike, to: '/docs' } as never, () => 'Router'),
    ])
    expect(errors).toEqual([])
  })
  it('with asChild needs a child that has an href', async () => {
    await mounted(() => h(Link, { asChild: true }, () => h('a', null, 'Nowhere')))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Link: with `asChild` needs a child that navigates')
    wrapper?.unmount()
    errors.length = 0
    await mounted(() => h(Link, { asChild: true }, () => h('a', { href: '/x' }, 'Somewhere')))
    expect(errors).toEqual([])
  })
  it('throws for an icon-only link without a name, accepts an aria-label', async () => {
    await mounted(() => h(Link, { href: '/x' }, () => h(Icon, { icon: faCheck })))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Link: needs an accessible name')
    wrapper?.unmount()
    errors.length = 0
    await mounted(() => h(Link, { href: '/x', 'aria-label': 'Next page' }, () => h(Icon, { icon: faCheck })))
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(Link, null, () => 'Docs'))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Link: requires an `href`'))
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(Link, null, () => 'Docs'))
    expect(errors).toEqual([])
  })
})

describe('Icon', () => {
  it.each([
    ['null', null],
    ['an empty object', {}],
    ['a short tuple', { prefix: 'fas', iconName: 'x', icon: [512, 512] }],
    ['no dimensions', { prefix: 'fas', iconName: 'x', icon: ['a', 'b', [], '', 'M0 0h1'] }],
    ['no path data', { prefix: 'fas', iconName: 'x', icon: [512, 512, [], '', ''] }],
    ['an empty path list', { prefix: 'fas', iconName: 'x', icon: [512, 512, [], '', []] }],
  ])('throws for a malformed icon (%s)', async (_name, icon) => {
    await mounted(() => h(Icon, { icon } as never))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Icon: requires a valid `icon` definition')
  })
  it('accepts real icons, including duotone path lists', async () => {
    await mounted(() => [h(Icon, { icon: faCheck }), h(Icon, { icon: { prefix: 'fad', iconName: 'x', icon: [512, 512, [], '', ['M0 0h1', 'M1 1h1']] } })])
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted(() => h(Icon, { icon: {} } as never))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Icon: requires a valid `icon` definition'))
    spy.mockRestore()
    wrapper?.unmount()
    configureStrictMode('off')
    await mounted(() => h(Icon, { icon: {} } as never))
    expect(errors).toEqual([])
  })
})
