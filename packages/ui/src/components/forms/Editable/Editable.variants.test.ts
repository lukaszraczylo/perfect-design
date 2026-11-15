import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Editable from './Editable.vue'
import { editableVariants, EDITABLE_SIZES, EDITABLE_VARIANTS } from './index'

type W = ReturnType<typeof mount>
const preview = (w: W) => w.find('[data-slot=editable-preview]')
const field = (w: W) => w.find('[data-slot=editable-input]')
const make = (props: Record<string, unknown> = {}) => mount(Editable, { props: { modelValue: 'Quarterly report', ariaLabel: 'Title', ...props }, attachTo: document.body })
const classes = (el: { attributes: (n: string) => string | undefined }) => new Set((el.attributes('class') ?? '').split(/\s+/))
const edit = async (w: W) => {
  await preview(w).trigger('click')
  await flushPromises()
}
afterEach(() => (document.body.innerHTML = ''))

describe('Editable variations', () => {
  describe('defaults', () => {
    it('keeps the default plain preview and editing classes', async () => {
      const w = make()
      const p = classes(preview(w))
      for (const k of ['block', 'min-h-8', 'w-full', 'rounded-md', 'border', 'border-transparent', 'px-2', 'py-1', 'text-md', 'md:text-base', 'cursor-text', 'hover:border-input', 'hover:bg-accent/50', 'pointer-coarse:min-h-11', 'focus-visible:ring-3']) expect(p.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'border-input', 'border-b', 'rounded-none']) expect(p.has(k), k).toBe(false)
      await edit(w)
      const e = classes(field(w))
      for (const k of ['border-input', 'bg-transparent', 'shadow-xs', 'rounded-md', 'focus-visible:ring-3']) expect(e.has(k), k).toBe(true)
      expect(e.has('bg-muted')).toBe(false)
    })
    it('the exported variants function matches the rendered default', () => {
      expect(classes(preview(make()))).toEqual(new Set(editableVariants().split(/\s+/)))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['min-h-7', 'py-0.5', 'md:text-xs']],
      ['sm', ['min-h-8', 'md:text-sm']],
      ['md', ['min-h-8', 'md:text-base']],
      ['lg', ['text-lg']],
    ])('%s sets the preview %j', (size, expected) => {
      const p = classes(preview(make({ size })))
      for (const k of expected) expect(p.has(k), k).toBe(true)
    })
    it('xs keeps 16px text on small screens and the 44px touch height', () => {
      const p = classes(preview(make({ size: 'xs' })))
      expect(p.has('text-md')).toBe(true)
      expect(p.has('pointer-coarse:min-h-11')).toBe(true)
    })
    it('the editing control uses the same size', async () => {
      const w = make({ size: 'xs' })
      await edit(w)
      expect(classes(field(w)).has('md:text-xs')).toBe(true)
      expect(classes(field(w)).has('min-h-7')).toBe(true)
    })
    it('an unknown size falls back to md', () => {
      expect(classes(preview(make({ size: 'giant' }))).has('md:text-base')).toBe(true)
    })
    it('exposes every size and variant', () => {
      expect([...EDITABLE_SIZES]).toEqual(['xs', 'sm', 'md', 'lg'])
      expect([...EDITABLE_VARIANTS]).toEqual(['plain', 'outline', 'filled', 'underline'])
    })
  })

  describe('variant', () => {
    it('outline always shows a border, with no hover fill', async () => {
      const w = make({ variant: 'outline' })
      const p = classes(preview(w))
      expect(p.has('border-input')).toBe(true)
      expect(p.has('border-transparent')).toBe(false)
      expect(p.has('hover:bg-transparent')).toBe(true)
      expect(p.has('forced-colors:border-[ButtonText]')).toBe(true)
      await edit(w)
      expect(classes(field(w)).has('border-input')).toBe(true)
    })
    it('filled shows a muted fill at rest and while editing', async () => {
      const w = make({ variant: 'filled' })
      const p = classes(preview(w))
      expect(p.has('bg-muted')).toBe(true)
      expect(p.has('hover:bg-muted')).toBe(true)
      expect(p.has('forced-colors:border-[ButtonText]')).toBe(true)
      await edit(w)
      const e = classes(field(w))
      expect(e.has('bg-muted')).toBe(true)
      expect(e.has('shadow-none')).toBe(true)
      expect(e.has('bg-transparent')).toBe(false)
    })
    it('underline shows a bottom rule at rest and a thicker one while editing', async () => {
      const w = make({ variant: 'underline' })
      const p = classes(preview(w))
      for (const k of ['rounded-none', 'border-0', 'border-b', 'border-input', 'px-0', 'forced-colors:border-b-[ButtonText]']) expect(p.has(k), k).toBe(true)
      expect(p.has('rounded-md')).toBe(false)
      await edit(w)
      const e = classes(field(w))
      for (const k of ['rounded-none', 'border-b', 'focus-visible:border-b-2', 'focus-visible:ring-0', 'shadow-none', 'forced-colors:border-b-[ButtonText]']) expect(e.has(k), k).toBe(true)
    })
    it('plain stays borderless at rest', () => {
      const p = classes(preview(make({ variant: 'plain' })))
      expect(p.has('border-transparent')).toBe(true)
      expect(p.has('border-input')).toBe(false)
    })
    it('an unknown variant falls back to plain', () => {
      const p = classes(preview(make({ variant: 'neon' })))
      expect(p.has('border-transparent')).toBe(true)
      expect(p.has('bg-muted')).toBe(false)
    })
  })

  describe('states', () => {
    it('keeps a visible focus ring on the preview in every variant', () => {
      for (const variant of EDITABLE_VARIANTS) {
        const p = classes(preview(make({ variant })))
        expect(p.has('focus-visible:border-ring'), variant).toBe(true)
        expect(p.has('focus-visible:ring-3'), variant).toBe(true)
      }
    })
    it('readonly keeps the resting look and drops hover feedback', () => {
      for (const variant of EDITABLE_VARIANTS) {
        const w = make({ variant, readonly: true })
        const p = classes(preview(w))
        expect(preview(w).attributes('role'), variant).toBeUndefined()
        expect(p.has('data-[readonly]:cursor-default'), variant).toBe(true)
      }
      expect(classes(preview(make({ variant: 'outline', readonly: true }))).has('data-[readonly]:hover:border-input')).toBe(true)
      expect(classes(preview(make({ variant: 'underline', readonly: true }))).has('data-[readonly]:hover:border-b-input')).toBe(true)
      expect(classes(preview(make({ variant: 'filled', readonly: true }))).has('data-[readonly]:hover:bg-muted')).toBe(true)
    })
    it('disabled keeps the variant and the dimmed styling', () => {
      const w = make({ variant: 'filled', disabled: true })
      expect(preview(w).attributes('aria-disabled')).toBe('true')
      expect(classes(preview(w)).has('bg-muted')).toBe(true)
      expect(classes(preview(w)).has('aria-disabled:opacity-50')).toBe(true)
    })
    it('an empty value shows the muted placeholder in every variant', () => {
      for (const variant of EDITABLE_VARIANTS) {
        const w = make({ variant, modelValue: '', placeholder: 'Untitled' })
        expect(preview(w).text(), variant).toBe('Untitled')
        expect(classes(preview(w)).has('data-[empty]:text-muted-foreground'), variant).toBe(true)
      }
    })
    it('invalid keeps the destructive styling on the editing control', async () => {
      const w = make({ variant: 'filled', invalid: true })
      await edit(w)
      expect(field(w).attributes('aria-invalid')).toBe('true')
      expect(classes(field(w)).has('aria-invalid:border-destructive')).toBe(true)
    })
  })

  describe('combinations and overrides', () => {
    it('underline + xs combine', async () => {
      const w = make({ variant: 'underline', size: 'xs' })
      const p = classes(preview(w))
      for (const k of ['border-b', 'min-h-7', 'md:text-xs', 'px-0']) expect(p.has(k), k).toBe(true)
    })
    it('multiline editing keeps the variant and the resize handle', async () => {
      const w = make({ variant: 'filled', multiline: true, size: 'lg' })
      await edit(w)
      const e = classes(field(w))
      expect(field(w).element.tagName).toBe('TEXTAREA')
      for (const k of ['bg-muted', 'text-lg', 'resize-y']) expect(e.has(k), k).toBe(true)
    })
    it('the class prop styles the root, not the preview', () => {
      const w = make({ variant: 'filled', class: 'max-w-sm' })
      expect(w.classes()).toContain('max-w-sm')
      expect(classes(preview(w)).has('max-w-sm')).toBe(false)
    })
    it('the exported function lets a later class win and resolves conflicts', () => {
      const out = editableVariants({ variant: 'underline', size: 'xs', class: 'min-h-12 rounded-sm' }).split(/\s+/)
      expect(out).toContain('rounded-sm')
      expect(out).not.toContain('rounded-none')
      expect(out).toContain('min-h-12')
      expect(out).not.toContain('min-h-7')
    })
  })

  describe('behaviour does not change', () => {
    it.each(EDITABLE_VARIANTS)('%s: click edits, Enter saves, Escape cancels', async (variant) => {
      const w = make({ variant })
      await edit(w)
      await field(w).setValue('New title')
      await field(w).trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['New title'])
      await edit(w)
      await field(w).setValue('Discarded')
      await field(w).trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(w.emitted('cancel')).toHaveLength(1)
      expect(preview(w).text()).toBe('New title')
    })
    it('the preview name still contains its visible text in a variant', () => {
      expect(preview(make({ variant: 'outline' })).attributes('aria-label')).toBe('Title: Quarterly report')
    })
  })
})

describe('Editable contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['outline', { variant: 'outline' }],
    ['filled', { variant: 'filled' }],
    ['underline', { variant: 'underline' }],
    ['xs', { size: 'xs' }],
  ])('an unnamed %s editable still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(Editable, { modelValue: 'Text', ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Editable: needs an accessible name')
  })
  it('a named editable in a variation raises nothing', async () => {
    await mountTree(() => h(Editable, { ariaLabel: 'Title', variant: 'underline', size: 'xs' }))
    expect(errors).toEqual([])
  })
})
