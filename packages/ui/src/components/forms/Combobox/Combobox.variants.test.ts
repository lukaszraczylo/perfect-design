import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Field from '../Field/Field.vue'
import { useStrictHarness } from '../testing'
import Combobox from './Combobox.vue'
import { comboboxVariants } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
]
const flush = async () => {
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 10))
  await nextTick()
}
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, field?: Record<string, unknown>) {
  const comp = () => h(Combobox, { options: OPTIONS, 'aria-label': 'Fruit', ...props, ...attrs })
  const Host = defineComponent({ setup: () => () => (field ? h(Field, field, () => comp()) : comp()) })
  wrapper = mount(Host, { attachTo: document.body })
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const input = () => q('input[data-slot="combobox-input"]') as HTMLInputElement
const root = () => q('[data-slot="combobox"]')!
const statusIcon = () => q('[data-slot="field-status"]')
const cls = (el: Element) => new Set(el.className.split(/\s+/))

describe('Combobox variations', () => {
  describe('defaults', () => {
    it('keeps the default input classes and adds no status markup', () => {
      make()
      const c = cls(input())
      for (const k of ['w-full', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'h-9', 'text-md', 'md:text-sm', 'pe-9', 'py-1', 'pointer-coarse:min-h-11']) expect(c.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'rounded-full', 'border-success', 'border-destructive', 'border-b-2']) expect(c.has(k), k).toBe(false)
      expect(statusIcon()).toBeNull()
      expect(input().getAttribute('aria-describedby')).toBeNull()
      expect(input().getAttribute('aria-invalid')).toBeNull()
    })
    it('clearable keeps pe-16', () => {
      make({ clearable: true })
      expect(cls(input()).has('pe-16')).toBe(true)
      expect(cls(input()).has('pe-9')).toBe(false)
    })
    it('the exported variants function matches the rendered default', () => {
      make()
      expect(cls(input())).toEqual(new Set(comboboxVariants().split(/\s+/)))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['h-7', 'px-2', 'md:text-xs']],
      ['sm', ['h-8', 'md:text-sm']],
      ['md', ['h-9', 'md:text-sm']],
      ['lg', ['h-11']],
    ])('%s sets %j', (size, expected) => {
      make({ size })
      for (const k of expected) expect(cls(input()).has(k), k).toBe(true)
    })
    it('lg keeps text-md with no md downsize; every size keeps text-md', () => {
      make({ size: 'lg' })
      expect(cls(input()).has('md:text-sm')).toBe(false)
      expect(cls(input()).has('text-md')).toBe(true)
    })
    it('xs keeps the end padding for the toggle even though it sets side padding', () => {
      make({ size: 'xs' })
      expect(cls(input()).has('pe-9')).toBe(true)
    })
    it('an unknown size falls back to md', () => {
      make({ size: 'giant' })
      expect(cls(input()).has('h-9')).toBe(true)
    })
  })

  describe('variant', () => {
    it('filled uses a muted fill without a shadow', () => {
      make({ variant: 'filled' })
      expect(cls(input()).has('bg-muted')).toBe(true)
      expect(cls(input()).has('shadow-none')).toBe(true)
      expect(cls(input()).has('bg-transparent')).toBe(false)
    })
    it('underline draws a bottom rule that thickens on focus, with a forced-colors fallback', () => {
      make({ variant: 'underline' })
      const c = cls(input())
      for (const k of ['rounded-none', 'border-0', 'border-b', 'px-0', 'focus-visible:border-b-2', 'focus-visible:ring-0', 'forced-colors:border-b-[ButtonText]']) expect(c.has(k), k).toBe(true)
      expect(c.has('pe-9')).toBe(true)
    })
    it('ghost hides the border until hover and keeps the focus ring', () => {
      make({ variant: 'ghost' })
      const c = cls(input())
      for (const k of ['border-transparent', 'hover:border-input', 'focus-visible:ring-3', 'forced-colors:border-[ButtonText]']) expect(c.has(k), k).toBe(true)
    })
    it('an unknown variant falls back to outline', () => {
      make({ variant: 'neon' })
      expect(cls(input()).has('bg-muted')).toBe(false)
      expect(cls(input()).has('border-input')).toBe(true)
    })
  })

  describe('shape', () => {
    it('pill rounds fully but keeps the end padding for the buttons', () => {
      make({ shape: 'pill' })
      const c = cls(input())
      expect(c.has('rounded-full')).toBe(true)
      expect(c.has('px-4')).toBe(true)
      expect(c.has('pe-9')).toBe(true)
      expect(c.has('rounded-md')).toBe(false)
    })
    it('square removes the radius', () => {
      make({ shape: 'square' })
      expect(cls(input()).has('rounded-none')).toBe(true)
    })
    it('an unknown shape falls back to rounded', () => {
      make({ shape: 'blob' })
      expect(cls(input()).has('rounded-md')).toBe(true)
    })
  })

  describe('status', () => {
    it.each([
      ['success', 'border-success'],
      ['warning', 'border-warning-foreground'],
      ['error', 'border-destructive'],
    ])('%s colours the border and renders an aria-hidden icon in the anchor', (status, border) => {
      make({ status })
      expect(cls(input()).has(border)).toBe(true)
      const icon = statusIcon()!
      expect(icon.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
      expect(icon.parentElement!.getAttribute('data-slot')).toBe('combobox-anchor')
    })
    it('adds room for the icon: pe-16 (pe-24 when clearable) and an icon left of the buttons', () => {
      make({ status: 'success' })
      expect(cls(input()).has('pe-16')).toBe(true)
      expect(cls(statusIcon()!).has('end-10')).toBe(true)
      wrapper!.unmount()
      make({ status: 'success', clearable: true })
      expect(cls(input()).has('pe-24')).toBe(true)
      expect(cls(statusIcon()!).has('end-16')).toBe(true)
    })
    it('uses larger offsets on coarse pointers', () => {
      make({ status: 'warning' })
      expect(cls(statusIcon()!).has('pointer-coarse:end-12')).toBe(true)
      expect(cls(input()).has('pointer-coarse:pe-20')).toBe(true)
    })
    it.each([
      ['success', 'Valid'],
      ['warning', 'Warning'],
    ])('%s adds hidden text that aria-describedby references', (status, text) => {
      make({ status })
      const id = input().getAttribute('aria-describedby')!
      const sr = document.getElementById(id)!
      expect(sr.textContent).toBe(text)
      expect(sr.className).toContain('sr-only')
    })
    it('error sets aria-invalid and adds no hidden text', () => {
      make({ status: 'error' })
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(input().getAttribute('aria-describedby')).toBeNull()
      expect(statusIcon()!.querySelector('.sr-only')).toBeNull()
    })
    it('merges the Field description and an author aria-describedby with the status text', () => {
      make({ status: 'warning' }, { 'aria-describedby': 'mine' }, { label: 'Fruit', hint: 'A hint' })
      const ids = input().getAttribute('aria-describedby')!.split(' ')
      expect(ids[0]).toBe('mine')
      expect(ids).toHaveLength(3)
      expect(ids.slice(1).every((id) => document.getElementById(id))).toBe(true)
    })
    it('an unknown status falls back to default', () => {
      make({ status: 'loud' })
      expect(statusIcon()).toBeNull()
      expect(cls(input()).has('pe-9')).toBe(true)
    })
  })

  describe('combinations and overrides', () => {
    it('underline + pill stays square-cornered and keeps the end padding', () => {
      make({ variant: 'underline', shape: 'pill', status: 'success' })
      const c = cls(input())
      expect(c.has('rounded-none')).toBe(true)
      expect(c.has('rounded-full')).toBe(false)
      expect(c.has('pe-16')).toBe(true)
      expect(c.has('px-0')).toBe(true)
    })
    it('filled + pill + success + xs + clearable combine', () => {
      make({ variant: 'filled', shape: 'pill', status: 'success', size: 'xs', clearable: true })
      const c = cls(input())
      for (const k of ['bg-muted', 'rounded-full', 'border-success', 'h-7', 'pe-24']) expect(c.has(k), k).toBe(true)
    })
    it('the class prop styles the root and does not leak onto the input', () => {
      make({ variant: 'filled', class: 'w-64' })
      expect(cls(root()).has('w-64')).toBe(true)
      expect(cls(input()).has('w-64')).toBe(false)
    })
    it('the exported function lets a later class win', () => {
      const out = comboboxVariants({ shape: 'pill', size: 'lg', class: 'h-20 rounded-sm' }).split(/\s+/)
      expect(out).toContain('rounded-sm')
      expect(out).not.toContain('rounded-full')
      expect(out).toContain('h-20')
      expect(out).not.toContain('h-11')
    })
  })

  describe('edge cases', () => {
    it('disabled keeps the variation and disables the input and toggle', () => {
      make({ variant: 'filled', status: 'success', disabled: true })
      expect(input().disabled).toBe(true)
      expect(cls(input()).has('bg-muted')).toBe(true)
      expect(statusIcon()).not.toBeNull()
    })
    it('opens and filters with a variation in place', async () => {
      make({ variant: 'underline', status: 'warning' })
      input().focus()
      await flush()
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(2)
    })
    it('an empty options list still renders the variation', () => {
      make({ options: [], variant: 'ghost', status: 'error' })
      expect(cls(input()).has('border-destructive')).toBe(true)
    })
  })
})

describe('Combobox contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
    ['status error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('an unnamed %s combobox still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(Combobox, { options: OPTIONS, ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Combobox: needs an accessible name')
  })
  it('a duplicate option value still throws in a variation', async () => {
    await mountTree(() => h(Combobox, { 'aria-label': 'Fruit', variant: 'filled', options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'B' }] }))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('unique')])
  })
  it('a named combobox in a variation raises nothing', async () => {
    await mountTree(() => h(Combobox, { 'aria-label': 'Fruit', options: OPTIONS, variant: 'ghost', shape: 'pill', status: 'success' }))
    expect(errors).toEqual([])
  })
})
