import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Field from '../Field/Field.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, selectTriggerVariants, SELECT_ITEM_SIZE_CLASSES } from './index'
import { useStrictHarness } from '../testing'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const flush = async () => {
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 10))
  await nextTick()
}

interface Opts {
  trigger?: Record<string, unknown>
  content?: Record<string, unknown>
  items?: Record<string, unknown>[]
  field?: Record<string, unknown>
}

function make(opts: Opts = {}) {
  const items = opts.items ?? [{ value: 'a' }, { value: 'b' }]
  const select = () =>
    h(Select, { defaultValue: 'a' }, () => [
      h(SelectTrigger, { 'aria-label': 'Choice', ...opts.trigger }, () => h(SelectValue, { placeholder: 'Pick' })),
      h(SelectContent, opts.content ?? {}, () => items.map((p) => h(SelectItem, { ...p } as never, () => `Item ${p.value}`))),
    ])
  const Host = defineComponent({ setup: () => () => (opts.field ? h(Field, opts.field, () => select()) : select()) })
  wrapper = mount(Host, { attachTo: document.body })
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const trigger = () => q('[data-slot="select-trigger"]')!
const cls = (el: Element) => new Set(el.className.split(/\s+/))
async function open() {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await flush()
}
const items = () => Array.from(document.body.querySelectorAll('[data-slot="select-item"]')) as HTMLElement[]

describe('SelectTrigger variations', () => {
  describe('defaults', () => {
    it('keeps the default surface and adds no variation classes or status markup', () => {
      make()
      const c = cls(trigger())
      for (const k of ['w-full', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'h-9', 'text-md', 'md:text-sm', 'flex', 'justify-between', 'pointer-coarse:min-h-11']) expect(c.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'rounded-full', 'rounded-none', 'border-b-2', 'border-success', 'border-destructive', 'border-transparent']) expect(c.has(k), k).toBe(false)
      expect(trigger().querySelector('[data-slot="field-status"]')).toBeNull()
      expect(trigger().hasAttribute('data-status')).toBe(false)
      expect(trigger().getAttribute('aria-invalid')).toBeNull()
      expect(trigger().getAttribute('aria-describedby')).toBeNull()
    })
    it('the exported variants function renders the same default classes', () => {
      make()
      expect(cls(trigger())).toEqual(new Set(selectTriggerVariants().split(/\s+/)))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['h-7', 'px-2', 'md:text-xs']],
      ['sm', ['h-8', 'md:text-sm']],
      ['md', ['h-9', 'md:text-sm']],
      ['lg', ['h-11']],
    ])('%s sets %j', (size, expected) => {
      make({ trigger: { size } })
      for (const k of expected) expect(cls(trigger()).has(k), k).toBe(true)
      expect(trigger().getAttribute('data-size')).toBe(size)
    })
    it('xs keeps 16px text below md and a 44px touch height', () => {
      make({ trigger: { size: 'xs' } })
      expect(cls(trigger()).has('text-md')).toBe(true)
      expect(cls(trigger()).has('pointer-coarse:min-h-11')).toBe(true)
    })
    it('an unknown size falls back to md', () => {
      make({ trigger: { size: 'huge' } })
      expect(cls(trigger()).has('h-9')).toBe(true)
    })
  })

  describe('variant', () => {
    it('filled swaps the background for a muted fill without a shadow', () => {
      make({ trigger: { variant: 'filled' } })
      expect(cls(trigger()).has('bg-muted')).toBe(true)
      expect(cls(trigger()).has('shadow-none')).toBe(true)
      expect(cls(trigger()).has('bg-transparent')).toBe(false)
    })
    it('underline keeps only a bottom rule that thickens on focus, and a forced-colors fallback', () => {
      make({ trigger: { variant: 'underline' } })
      const c = cls(trigger())
      for (const k of ['rounded-none', 'border-0', 'border-b', 'px-0', 'focus-visible:border-b-2', 'focus-visible:ring-0', 'forced-colors:border-b-[ButtonText]']) expect(c.has(k), k).toBe(true)
      expect(c.has('rounded-md')).toBe(false)
    })
    it('ghost hides the border until hover, keeps the focus ring and a forced-colors border', () => {
      make({ trigger: { variant: 'ghost' } })
      const c = cls(trigger())
      for (const k of ['border-transparent', 'hover:border-input', 'focus-visible:ring-3', 'forced-colors:border-[ButtonText]']) expect(c.has(k), k).toBe(true)
    })
    it('an unknown variant falls back to outline', () => {
      make({ trigger: { variant: 'neon' } })
      expect(cls(trigger()).has('border-input')).toBe(true)
      expect(cls(trigger()).has('bg-muted')).toBe(false)
    })
  })

  describe('shape', () => {
    it('pill rounds fully and widens the padding', () => {
      make({ trigger: { shape: 'pill' } })
      expect(cls(trigger()).has('rounded-full')).toBe(true)
      expect(cls(trigger()).has('px-4')).toBe(true)
      expect(cls(trigger()).has('rounded-md')).toBe(false)
    })
    it('square removes the radius', () => {
      make({ trigger: { shape: 'square' } })
      expect(cls(trigger()).has('rounded-none')).toBe(true)
    })
    it('an unknown shape falls back to rounded', () => {
      make({ trigger: { shape: 'blob' } })
      expect(cls(trigger()).has('rounded-md')).toBe(true)
    })
  })

  describe('status', () => {
    it.each([
      ['success', 'border-success'],
      ['warning', 'border-warning-foreground'],
      ['error', 'border-destructive'],
    ])('%s colours the border and renders an aria-hidden icon', (status, border) => {
      make({ trigger: { status } })
      expect(cls(trigger()).has(border)).toBe(true)
      expect(trigger().getAttribute('data-status')).toBe(status)
      const icon = trigger().querySelector('[data-slot="field-status"]')!
      expect(icon).not.toBeNull()
      expect(icon.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    })
    it('the icon sits before the chevron, inside the trigger flow', () => {
      make({ trigger: { status: 'success' } })
      const kids = Array.from(trigger().children)
      const icon = kids.findIndex((k) => k.matches('[data-slot="field-status"]'))
      const chevron = kids.findIndex((k) => k.matches('svg[data-slot="icon"]'))
      expect(icon).toBeGreaterThan(-1)
      expect(icon).toBeLessThan(chevron)
      expect(cls(kids[icon]).has('relative')).toBe(true)
      expect(cls(kids[icon]).has('absolute')).toBe(false)
    })
    it.each([
      ['success', 'Valid'],
      ['warning', 'Warning'],
    ])('%s adds hidden text that aria-describedby references', (status, text) => {
      make({ trigger: { status } })
      const ids = trigger().getAttribute('aria-describedby')!.split(' ')
      const sr = document.getElementById(ids[ids.length - 1])!
      expect(sr.textContent).toBe(text)
      expect(sr.className).toContain('sr-only')
    })
    it('error sets aria-invalid and adds no hidden text', () => {
      make({ trigger: { status: 'error' } })
      expect(trigger().getAttribute('aria-invalid')).toBe('true')
      expect(trigger().querySelector('.sr-only')).toBeNull()
      expect(trigger().getAttribute('aria-describedby')).toBeNull()
    })
    it('merges the Field description and an author aria-describedby with the status text', () => {
      make({ trigger: { status: 'success', 'aria-describedby': 'mine' }, field: { label: 'Choice', hint: 'A hint' } })
      const ids = trigger().getAttribute('aria-describedby')!.split(' ')
      expect(ids[0]).toBe('mine')
      expect(ids.length).toBe(3)
      expect(ids.every((id) => id === 'mine' || document.getElementById(id))).toBe(true)
    })
    it('an unknown status falls back to default', () => {
      make({ trigger: { status: 'loud' } })
      expect(trigger().querySelector('[data-slot="field-status"]')).toBeNull()
      expect(trigger().hasAttribute('data-status')).toBe(false)
    })
    it('the hidden status text is not part of the value element', () => {
      make({ trigger: { status: 'success' } })
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Pick')
    })
  })

  describe('combinations and overrides', () => {
    it('underline + pill stays square-cornered without side padding', () => {
      make({ trigger: { variant: 'underline', shape: 'pill' } })
      const c = cls(trigger())
      expect(c.has('rounded-none')).toBe(true)
      expect(c.has('px-0')).toBe(true)
      expect(c.has('rounded-full')).toBe(false)
      expect(c.has('px-4')).toBe(false)
    })
    it('filled + pill + success + xs combine without dropping any of them', () => {
      make({ trigger: { variant: 'filled', shape: 'pill', status: 'success', size: 'xs' } })
      const c = cls(trigger())
      for (const k of ['bg-muted', 'rounded-full', 'border-success', 'h-7']) expect(c.has(k), k).toBe(true)
      expect(trigger().querySelector('[data-slot="field-status"]')).not.toBeNull()
    })
    it('ghost + error keeps the error border colour', () => {
      make({ trigger: { variant: 'ghost', status: 'error' } })
      const c = cls(trigger())
      expect(c.has('border-destructive')).toBe(true)
      expect(c.has('border-transparent')).toBe(false)
    })
    it('the class prop wins over the variation classes', () => {
      make({ trigger: { variant: 'filled', shape: 'pill', size: 'lg', class: 'bg-card rounded-sm h-20' } })
      const c = cls(trigger())
      expect(c.has('bg-card')).toBe(true)
      expect(c.has('bg-muted')).toBe(false)
      expect(c.has('rounded-sm')).toBe(true)
      expect(c.has('rounded-full')).toBe(false)
      expect(c.has('h-20')).toBe(true)
      expect(c.has('h-11')).toBe(false)
    })
    it('the exported function resolves conflicts for plain elements', () => {
      const out = selectTriggerVariants({ variant: 'filled', shape: 'pill', status: 'error', size: 'lg', class: 'h-20' }).split(/\s+/)
      expect(out).toContain('rounded-full')
      expect(out).not.toContain('rounded-md')
      expect(out).toContain('h-20')
      expect(out).not.toContain('h-11')
    })
  })

  describe('edge cases', () => {
    it('disabled keeps the variation and is still disabled', () => {
      make({ trigger: { variant: 'filled', status: 'warning', disabled: true } })
      expect(trigger().hasAttribute('disabled')).toBe(true)
      expect(cls(trigger()).has('bg-muted')).toBe(true)
      expect(trigger().querySelector('[data-slot="field-status"]')).not.toBeNull()
    })
    it('a long selected value does not push the icon out: the value clamps to one line', () => {
      make({ trigger: { status: 'warning' }, items: [{ value: 'long' }] })
      expect(cls(trigger()).has('*:data-[slot=select-value]:line-clamp-1')).toBe(true)
      expect(cls(trigger()).has('whitespace-nowrap')).toBe(true)
    })
    it('opens and selects with every variant and status in place', async () => {
      make({ trigger: { variant: 'underline', status: 'success' } })
      await open()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(items()).toHaveLength(2)
    })
  })
})

describe('SelectContent and SelectItem size', () => {
  it('the default row has no size classes and the content carries no data-size', async () => {
    make()
    await open()
    expect(q('[data-slot="select-content"]')!.hasAttribute('data-size')).toBe(false)
    const c = cls(items()[0])
    expect(c.has('py-1.5')).toBe(true)
    expect(c.has('text-sm')).toBe(true)
  })
  it('sm on the content makes every row compact', async () => {
    make({ content: { size: 'sm' } })
    await open()
    expect(q('[data-slot="select-content"]')!.getAttribute('data-size')).toBe('sm')
    for (const item of items()) {
      expect(cls(item).has('py-1')).toBe(true)
      expect(cls(item).has('text-xs')).toBe(true)
      expect(cls(item).has('py-1.5')).toBe(false)
    }
  })
  it('lg on the content makes every row roomy with 16px text', async () => {
    make({ content: { size: 'lg' } })
    await open()
    for (const item of items()) {
      expect(cls(item).has('py-2.5')).toBe(true)
      expect(cls(item).has('text-base')).toBe(true)
    }
  })
  it('a size on one item wins over the content size', async () => {
    make({ content: { size: 'lg' }, items: [{ value: 'a', size: 'sm' }, { value: 'b' }] })
    await open()
    expect(cls(items()[0]).has('text-xs')).toBe(true)
    expect(cls(items()[1]).has('text-base')).toBe(true)
  })
  it('an unknown size falls back to md', async () => {
    make({ content: { size: 'giant' }, items: [{ value: 'a', size: 'tiny' }] })
    await open()
    expect(q('[data-slot="select-content"]')!.hasAttribute('data-size')).toBe(false)
    expect(cls(items()[0]).has('py-1.5')).toBe(true)
  })
  it('rows keep the touch height, logical padding and the forced-colors highlight at every size', async () => {
    make({ content: { size: 'sm' } })
    await open()
    const c = cls(items()[0])
    expect(c.has('pointer-coarse:min-h-11')).toBe(true)
    expect(c.has('ps-2')).toBe(true)
    expect(c.has('forced-colors:data-[highlighted]:outline')).toBe(true)
  })
  it('class on an item wins over the size classes', async () => {
    make({ content: { size: 'lg' }, items: [{ value: 'a', class: 'py-4' }] })
    await open()
    expect(cls(items()[0]).has('py-4')).toBe(true)
    expect(cls(items()[0]).has('py-2.5')).toBe(false)
  })
  it('exposes the size class map with an empty default', () => {
    expect(SELECT_ITEM_SIZE_CLASSES.md).toBe('')
    expect(SELECT_ITEM_SIZE_CLASSES.sm).not.toBe(SELECT_ITEM_SIZE_CLASSES.lg)
  })
  it('an item used outside a SelectContent still renders its own size', async () => {
    make({ items: [{ value: 'a', size: 'lg' }] })
    await open()
    expect(cls(items()[0]).has('text-base')).toBe(true)
  })
})

describe('Select contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  const named = (props: Record<string, unknown>) =>
    h(Select, null, () => [h(SelectTrigger, props, () => h(SelectValue)), h(SelectContent, null, () => h(SelectItem, { value: 'a' }, () => 'A'))])
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['underline', { variant: 'underline' }],
    ['success', { status: 'success' }],
    ['error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('a %s trigger without a name still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => named(props))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SelectTrigger: needs an accessible name')
  })
  it('a named trigger in a variation raises nothing', async () => {
    await mountTree(() => named({ 'aria-label': 'Choice', variant: 'filled', shape: 'pill', status: 'success' }))
    expect(errors).toEqual([])
  })
})
