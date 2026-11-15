import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Field from '../Field/Field.vue'
import { useStrictHarness } from '../testing'
import TagsInput from './TagsInput.vue'
import { tagsInputVariants, TAGS_INPUT_SIZES } from './index'

let wrapper: VueWrapper | undefined
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, field?: Record<string, unknown>) {
  const all = { ariaLabel: 'Skills', defaultValue: ['vue'], ...props }
  wrapper = field
    ? mount({ render: () => h(Field, field, () => h(TagsInput, { ...all, ...attrs })) }, { attachTo: document.body })
    : mount(TagsInput, { props: all, attrs, attachTo: document.body })
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})
const root = () => document.body.querySelector('[data-slot=tags-input]') as HTMLElement
const input = () => document.body.querySelector('input[data-slot=tags-input-input]') as HTMLInputElement
const icon = () => document.body.querySelector('[data-slot=field-status]') as HTMLElement | null
const cls = (el: Element) => new Set(el.className.split(/\s+/))

describe('TagsInput variations', () => {
  describe('defaults', () => {
    it('keeps the default container and input classes with no status markup', () => {
      make()
      const c = cls(root())
      for (const k of ['flex', 'flex-wrap', 'min-h-9', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'px-2', 'py-1', 'gap-1.5', 'focus-within:ring-3', 'pointer-coarse:min-h-11']) expect(c.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'rounded-full', 'relative', 'pe-9', 'border-success', 'border-b-2']) expect(c.has(k), k).toBe(false)
      const i = cls(input())
      for (const k of ['text-md', 'md:text-base', 'min-w-24', 'flex-1']) expect(i.has(k), k).toBe(true)
      expect(icon()).toBeNull()
      expect(input().getAttribute('aria-describedby')).toBeNull()
    })
    it('the exported variants function matches the rendered default', () => {
      make()
      expect(cls(root())).toEqual(new Set(tagsInputVariants().split(/\s+/)))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['min-h-7', 'px-1.5', 'py-0.5'], 'md:text-xs'],
      ['sm', ['min-h-8'], 'md:text-sm'],
      ['md', ['min-h-9'], 'md:text-base'],
      ['lg', ['min-h-11', 'px-3'], undefined],
    ])('%s sets the container %j and the input text %s', (size, expected, text) => {
      make({ size })
      for (const k of expected) expect(cls(root()).has(k), k).toBe(true)
      if (text) expect(cls(input()).has(text)).toBe(true)
      else expect(input().className).not.toContain('md:text-')
      expect(cls(input()).has('text-md')).toBe(true)
    })
    it('keeps the 44px touch height below lg', () => {
      for (const size of ['xs', 'sm', 'md']) {
        wrapper?.unmount()
        make({ size })
        expect(cls(root()).has('pointer-coarse:min-h-11'), size).toBe(true)
      }
    })
    it('keeps 24px remove buttons at the smallest size', () => {
      make({ size: 'xs' })
      expect(document.body.querySelector('[data-slot=tags-input-item-delete]')!.className).toContain('size-6')
    })
    it('an unknown size falls back to md', () => {
      make({ size: 'giant' })
      expect(cls(root()).has('min-h-9')).toBe(true)
    })
    it('exposes the size map', () => expect(Object.keys(TAGS_INPUT_SIZES)).toEqual(['xs', 'sm', 'md', 'lg']))
  })

  describe('variant', () => {
    it('filled uses a muted fill without a shadow', () => {
      make({ variant: 'filled' })
      expect(cls(root()).has('bg-muted')).toBe(true)
      expect(cls(root()).has('dark:bg-card')).toBe(true)
      expect(cls(root()).has('dark:bg-muted')).toBe(false)
      expect(cls(root()).has('shadow-none')).toBe(true)
      expect(cls(root()).has('bg-transparent')).toBe(false)
    })
    it('underline keeps only a bottom rule that thickens while focus is inside, with a forced-colors fallback', () => {
      make({ variant: 'underline' })
      const c = cls(root())
      for (const k of ['rounded-none', 'border-0', 'border-b', 'px-0', 'focus-within:border-b-2', 'focus-within:ring-0', 'forced-colors:border-b-[ButtonText]']) expect(c.has(k), k).toBe(true)
      expect(c.has('rounded-md')).toBe(false)
    })
    it('ghost hides the border until hover and keeps the focus-within ring', () => {
      make({ variant: 'ghost' })
      const c = cls(root())
      for (const k of ['border-transparent', 'hover:border-input', 'focus-within:ring-3', 'focus-within:bg-background', 'forced-colors:border-[ButtonText]']) expect(c.has(k), k).toBe(true)
    })
    it('an unknown variant falls back to outline', () => {
      make({ variant: 'neon' })
      expect(cls(root()).has('border-input')).toBe(true)
      expect(cls(root()).has('bg-muted')).toBe(false)
    })
  })

  describe('shape', () => {
    it('pill is a large radius box, not a full pill, so wrapped tags are not clipped', () => {
      make({ shape: 'pill' })
      expect(cls(root()).has('rounded-xl')).toBe(true)
      expect(cls(root()).has('rounded-full')).toBe(false)
      expect(cls(root()).has('px-4')).toBe(true)
    })
    it('square removes the radius', () => {
      make({ shape: 'square' })
      expect(cls(root()).has('rounded-none')).toBe(true)
    })
    it('an unknown shape falls back to rounded', () => {
      make({ shape: 'blob' })
      expect(cls(root()).has('rounded-md')).toBe(true)
    })
  })

  describe('status', () => {
    it.each([
      ['success', 'border-success', 'focus-within:ring-success/30'],
      ['warning', 'border-warning-foreground', 'focus-within:ring-warning-foreground/30'],
      ['error', 'border-destructive', 'focus-within:ring-destructive/30'],
    ])('%s colours the border and the focus ring, and renders an aria-hidden icon inside the container', (status, border, ring) => {
      make({ status })
      expect(cls(root()).has(border)).toBe(true)
      expect(cls(root()).has(ring)).toBe(true)
      expect(icon()!.parentElement).toBe(root())
      expect(icon()!.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    })
    it('reserves end padding and positions the icon against the container', () => {
      make({ status: 'success' })
      expect(cls(root()).has('relative')).toBe(true)
      expect(cls(root()).has('pe-9')).toBe(true)
      expect(cls(icon()!).has('absolute')).toBe(true)
    })
    it.each([
      ['xs', 'top-1.5'],
      ['sm', 'top-2'],
      ['md', 'top-2.5'],
      ['lg', 'top-3.5'],
    ])('keeps the icon on the first row at size %s (%s)', (size, top) => {
      make({ status: 'success', size })
      expect(cls(icon()!).has(top)).toBe(true)
      expect(cls(icon()!).has('translate-y-0')).toBe(true)
    })
    it.each([
      ['success', 'Valid'],
      ['warning', 'Warning'],
    ])('%s adds hidden text that the text input references', (status, text) => {
      make({ status })
      const sr = document.getElementById(input().getAttribute('aria-describedby')!)!
      expect(sr.textContent).toBe(text)
      expect(sr.className).toContain('sr-only')
    })
    it('error sets aria-invalid on the input and adds no hidden text', () => {
      make({ status: 'error' })
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(input().getAttribute('aria-describedby')).toBeNull()
      expect(icon()!.querySelector('.sr-only')).toBeNull()
    })
    it('merges the Field description and an author aria-describedby with the status text', () => {
      make({ status: 'warning' }, { 'aria-describedby': 'mine' }, { label: 'Skills', hint: 'A hint' })
      const ids = input().getAttribute('aria-describedby')!.split(' ')
      expect(ids[0]).toBe('mine')
      expect(ids).toHaveLength(3)
      expect(ids.slice(1).every((id) => document.getElementById(id))).toBe(true)
    })
    it('an unknown status falls back to default', () => {
      make({ status: 'loud' })
      expect(icon()).toBeNull()
      expect(cls(root()).has('relative')).toBe(false)
    })
  })

  describe('combinations and overrides', () => {
    it('underline + pill stays square-cornered and keeps the icon room', () => {
      make({ variant: 'underline', shape: 'pill', status: 'success' })
      const c = cls(root())
      expect(c.has('rounded-none')).toBe(true)
      expect(c.has('rounded-xl')).toBe(false)
      expect(c.has('pe-9')).toBe(true)
      expect(c.has('px-0')).toBe(true)
    })
    it('filled + pill + success + xs combine', () => {
      make({ variant: 'filled', shape: 'pill', status: 'success', size: 'xs' })
      for (const k of ['bg-muted', 'rounded-xl', 'border-success', 'min-h-7']) expect(cls(root()).has(k), k).toBe(true)
    })
    it('the class prop wins over the variation classes', () => {
      make({ variant: 'filled', shape: 'pill', size: 'lg', class: 'bg-card rounded-sm min-h-20' })
      const c = cls(root())
      for (const k of ['bg-card', 'rounded-sm', 'min-h-20']) expect(c.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'rounded-xl', 'min-h-11']) expect(c.has(k), k).toBe(false)
    })
    it('the exported function resolves conflicts for plain elements', () => {
      const out = tagsInputVariants({ shape: 'square', size: 'lg', class: 'min-h-20' }).split(/\s+/)
      expect(out).toContain('rounded-none')
      expect(out).not.toContain('rounded-md')
      expect(out).toContain('min-h-20')
      expect(out).not.toContain('min-h-11')
    })
    it('invalid keeps the destructive ring in a variation', () => {
      make({ invalid: true, variant: 'filled' })
      expect(cls(root()).has('border-destructive')).toBe(true)
      expect(input().getAttribute('aria-invalid')).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('disabled keeps the variation and disables the input', () => {
      make({ variant: 'filled', status: 'warning', disabled: true })
      expect(input().disabled).toBe(true)
      expect(cls(root()).has('bg-muted')).toBe(true)
      expect(icon()).not.toBeNull()
    })
    it('no tags and a placeholder: the empty field still shows the icon', () => {
      make({ status: 'success', defaultValue: [], placeholder: 'Add' })
      expect(input().placeholder).toBe('Add')
      expect(icon()).not.toBeNull()
    })
    it('many long tags wrap in the container with the icon in the first row', async () => {
      make({ status: 'success', defaultValue: ['a-very-long-tag-name-one', 'a-very-long-tag-name-two', 'a-very-long-tag-name-three'] })
      expect(cls(root()).has('flex-wrap')).toBe(true)
      expect(document.body.querySelectorAll('[data-slot=tags-input-item]')).toHaveLength(3)
      expect(cls(icon()!).has('top-2.5')).toBe(true)
    })
    it('still adds a tag with Enter in a variation', async () => {
      const w = make({ variant: 'underline', status: 'warning' })
      input().value = 'new'
      await w.find('input[data-slot=tags-input-input]').trigger('input')
      await w.find('input[data-slot=tags-input-input]').trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual([['vue', 'new']])
    })
  })
})

describe('TagsInput contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
    ['status error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('an unnamed %s field still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(TagsInput, { modelValue: ['vue'], ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('TagsInput: needs an accessible name')
  })
  it('a named field in a variation raises nothing', async () => {
    await mountTree(() => h(TagsInput, { ariaLabel: 'Skills', variant: 'ghost', shape: 'pill', status: 'success' }))
    expect(errors).toEqual([])
  })
})
