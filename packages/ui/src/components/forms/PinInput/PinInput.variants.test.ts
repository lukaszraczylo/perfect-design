import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Field from '../Field/Field.vue'
import { useStrictHarness } from '../testing'
import PinInput from './PinInput.vue'
import { pinInputCellVariants, PIN_INPUT_SIZES } from './index'

let wrapper: VueWrapper | undefined
async function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, field?: Record<string, unknown>) {
  const all = { length: 4, 'aria-label': 'Code', ...props }
  wrapper = field
    ? mount({ render: () => h(Field, field, () => h(PinInput, { ...all, ...attrs })) }, { attachTo: document.body })
    : mount(PinInput, { props: all, attrs, attachTo: document.body })
  await flushPromises()
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})
const cells = () => Array.from(document.body.querySelectorAll('input[data-slot=pin-input-cell]')) as HTMLInputElement[]
const root = () => document.body.querySelector('[data-slot=pin-input]') as HTMLElement
const icon = () => document.body.querySelector('[data-slot=field-status]') as HTMLElement | null
const cls = (el: Element) => new Set(el.className.split(/\s+/))

describe('PinInput variations', () => {
  describe('defaults', () => {
    it('keeps the default cell classes on every cell and adds no status markup', async () => {
      await make()
      expect(cells()).toHaveLength(4)
      for (const cell of cells()) {
        const c = cls(cell)
        for (const k of ['h-10', 'w-10', 'min-w-0', 'px-0', 'text-center', 'text-lg', 'tabular-nums', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'pointer-coarse:h-11', 'pointer-coarse:w-11']) expect(c.has(k), k).toBe(true)
        for (const k of ['bg-muted', 'rounded-full', 'border-success', 'border-b-2']) expect(c.has(k), k).toBe(false)
      }
      expect(icon()).toBeNull()
      expect(root().getAttribute('aria-describedby')).toBeNull()
    })
    it('the exported cell variants function matches the rendered default', async () => {
      await make()
      expect(cls(cells()[0])).toEqual(new Set(pinInputCellVariants().split(/\s+/)))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['h-8', 'w-8', 'md:text-sm', 'pointer-coarse:h-11']],
      ['sm', ['h-9', 'w-9', 'md:text-base', 'pointer-coarse:w-11']],
      ['md', ['h-10', 'w-10', 'text-lg']],
      ['lg', ['h-12', 'w-12', 'text-xl']],
    ])('%s sets every cell to %j', async (size, expected) => {
      await make({ size })
      for (const cell of cells()) for (const k of expected) expect(cls(cell).has(k), k).toBe(true)
    })
    it('keeps 16px text on small screens and a 44px touch target below lg', () => {
      for (const [size, text] of Object.entries(PIN_INPUT_SIZES)) {
        expect(text, size).toMatch(/text-(md|lg|xl)/)
        if (size !== 'lg') expect(text, size).toContain('pointer-coarse:h-11')
      }
    })
    it('an unknown size falls back to md', async () => {
      await make({ size: 'giant' })
      expect(cls(cells()[0]).has('h-10')).toBe(true)
    })
    it('cellClass wins over the size', async () => {
      await make({ size: 'lg', cellClass: 'size-14' })
      expect(cls(cells()[0]).has('size-14')).toBe(true)
      expect(cls(cells()[0]).has('h-12')).toBe(false)
    })
  })

  describe('variant', () => {
    it('filled uses a muted fill per cell', async () => {
      await make({ variant: 'filled' })
      for (const cell of cells()) {
        expect(cls(cell).has('bg-muted')).toBe(true)
        expect(cls(cell).has('dark:bg-card')).toBe(true)
        expect(cls(cell).has('dark:bg-muted')).toBe(false)
        expect(cls(cell).has('bg-transparent')).toBe(false)
      }
    })
    it('underline keeps a bottom rule per cell that thickens on focus, with a forced-colors fallback', async () => {
      await make({ variant: 'underline' })
      for (const cell of cells()) {
        const c = cls(cell)
        for (const k of ['rounded-none', 'border-0', 'border-b', 'focus-visible:border-b-2', 'focus-visible:ring-0', 'forced-colors:border-b-[ButtonText]']) expect(c.has(k), k).toBe(true)
        expect(c.has('rounded-md')).toBe(false)
      }
    })
    it('ghost hides the border until hover and keeps the focus ring', async () => {
      await make({ variant: 'ghost' })
      const c = cls(cells()[0])
      for (const k of ['border-transparent', 'hover:border-input', 'focus-visible:ring-3', 'forced-colors:border-[ButtonText]']) expect(c.has(k), k).toBe(true)
    })
    it('an unknown variant falls back to outline', async () => {
      await make({ variant: 'neon' })
      expect(cls(cells()[0]).has('border-input')).toBe(true)
      expect(cls(cells()[0]).has('bg-muted')).toBe(false)
    })
  })

  describe('shape', () => {
    it('pill makes every cell a circle without squeezing the digit', async () => {
      await make({ shape: 'pill' })
      for (const cell of cells()) {
        expect(cls(cell).has('rounded-full')).toBe(true)
        expect(cls(cell).has('px-0')).toBe(true)
        expect(cls(cell).has('px-4')).toBe(false)
        expect(cls(cell).has('rounded-md')).toBe(false)
      }
    })
    it('square removes the radius', async () => {
      await make({ shape: 'square' })
      expect(cls(cells()[0]).has('rounded-none')).toBe(true)
    })
    it('an unknown shape falls back to rounded', async () => {
      await make({ shape: 'blob' })
      expect(cls(cells()[0]).has('rounded-md')).toBe(true)
    })
  })

  describe('status', () => {
    it.each([
      ['success', 'border-success'],
      ['warning', 'border-warning-foreground'],
      ['error', 'border-destructive'],
    ])('%s colours every cell and adds ONE aria-hidden icon after the last cell', async (status, border) => {
      await make({ status })
      for (const cell of cells()) expect(cls(cell).has(border)).toBe(true)
      expect(document.body.querySelectorAll('[data-slot=field-status]')).toHaveLength(1)
      expect(icon()!.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
      expect(icon()!.previousElementSibling).toBe(cells()[3])
      expect(cls(icon()!).has('relative')).toBe(true)
      expect(cls(icon()!).has('absolute')).toBe(false)
    })
    it.each([
      ['success', 'Valid'],
      ['warning', 'Warning'],
    ])('%s adds hidden text that the group references', async (status, text) => {
      await make({ status })
      const sr = document.getElementById(root().getAttribute('aria-describedby')!)!
      expect(sr.textContent).toBe(text)
      expect(sr.className).toContain('sr-only')
    })
    it('error sets aria-invalid on every cell and adds no hidden text', async () => {
      await make({ status: 'error' })
      for (const cell of cells()) expect(cell.getAttribute('aria-invalid')).toBe('true')
      expect(root().getAttribute('aria-describedby')).toBeNull()
      expect(icon()!.querySelector('.sr-only')).toBeNull()
    })
    it('merges the Field description and an author aria-describedby with the status text', async () => {
      await make({ status: 'warning' }, { 'aria-describedby': 'mine' }, { label: 'Code', hint: 'A hint' })
      const ids = root().getAttribute('aria-describedby')!.split(' ')
      expect(ids[0]).toBe('mine')
      expect(ids).toHaveLength(3)
      expect(ids.slice(1).every((id) => document.getElementById(id))).toBe(true)
    })
    it('an unknown status falls back to default', async () => {
      await make({ status: 'loud' })
      expect(icon()).toBeNull()
      expect(cells()[0].getAttribute('aria-invalid')).toBeNull()
    })
  })

  describe('combinations and overrides', () => {
    it('underline + pill stays square-cornered', async () => {
      await make({ variant: 'underline', shape: 'pill' })
      expect(cls(cells()[0]).has('rounded-none')).toBe(true)
      expect(cls(cells()[0]).has('rounded-full')).toBe(false)
    })
    it('filled + pill + success + xs combine on every cell', async () => {
      await make({ variant: 'filled', shape: 'pill', status: 'success', size: 'xs' })
      for (const cell of cells()) for (const k of ['bg-muted', 'rounded-full', 'border-success', 'h-8']) expect(cls(cell).has(k), k).toBe(true)
    })
    it('cellClass wins over the variation classes, class stays on the root', async () => {
      await make({ variant: 'filled', shape: 'pill', cellClass: 'bg-card rounded-sm', class: 'gap-4' })
      for (const cell of cells()) {
        expect(cls(cell).has('bg-card')).toBe(true)
        expect(cls(cell).has('bg-muted')).toBe(false)
        expect(cls(cell).has('rounded-sm')).toBe(true)
        expect(cls(cell).has('rounded-full')).toBe(false)
      }
      expect(cls(root()).has('gap-4')).toBe(true)
      expect(cls(root()).has('gap-2')).toBe(false)
    })
    it('the exported function resolves conflicts for plain inputs', () => {
      const out = pinInputCellVariants({ shape: 'pill', size: 'lg', class: 'h-20' }).split(/\s+/)
      expect(out).toContain('rounded-full')
      expect(out).not.toContain('rounded-md')
      expect(out).toContain('h-20')
      expect(out).not.toContain('h-12')
    })
  })

  describe('edge cases', () => {
    it('the root can shrink: cells keep min-w-0 and the root max-w-full at every size', async () => {
      await make({ size: 'lg', status: 'success', length: 8 })
      expect(cells()).toHaveLength(8)
      expect(cls(root()).has('max-w-full')).toBe(true)
      for (const cell of cells()) expect(cls(cell).has('min-w-0')).toBe(true)
    })
    it('disabled keeps the variation and disables every cell', async () => {
      await make({ variant: 'filled', status: 'warning', disabled: true })
      for (const cell of cells()) {
        expect(cell.disabled).toBe(true)
        expect(cls(cell).has('bg-muted')).toBe(true)
      }
      expect(icon()).not.toBeNull()
    })
    it('a single cell still renders its icon', async () => {
      await make({ length: 1, status: 'success' })
      expect(cells()).toHaveLength(1)
      expect(icon()!.previousElementSibling).toBe(cells()[0])
    })
    it('typing still fills cells and completes in a variation', async () => {
      const w = await make({ length: 2, variant: 'underline', status: 'warning' })
      for (const [i, ch] of ['1', '2'].entries()) {
        cells()[i].value = ch
        cells()[i].dispatchEvent(new InputEvent('input', { data: ch, bubbles: true }))
        await flushPromises()
      }
      expect(w.emitted('complete')!.at(-1)).toEqual(['12'])
    })
  })
})

describe('PinInput contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
    ['status error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('an unnamed %s group still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(PinInput, { length: 4, ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('PinInput: needs an accessible name')
  })
  it('a blank cellLabel still throws in a variation', async () => {
    await mountTree(() => h(PinInput, { length: 4, 'aria-label': 'Code', cellLabel: ' ', variant: 'ghost' }))
    expect(errors.map((e) => e.message)).toEqual([expect.stringContaining('cellLabel')])
  })
  it('a named group in a variation raises nothing', async () => {
    await mountTree(() => h(PinInput, { length: 4, 'aria-label': 'Code', variant: 'ghost', shape: 'pill', status: 'success' }))
    expect(errors).toEqual([])
  })
})
