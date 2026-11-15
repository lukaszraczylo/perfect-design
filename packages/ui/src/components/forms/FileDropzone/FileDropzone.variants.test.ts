import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Field from '../Field/Field.vue'
import { useStrictHarness } from '../testing'
import FileDropzone from './FileDropzone.vue'
import { fileDropzoneVariants, FILE_DROPZONE_SIZES, FILE_DROPZONE_VARIANTS } from './index'

let wrapper: VueWrapper | undefined
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, field?: Record<string, unknown>) {
  wrapper = field
    ? mount({ render: () => h(Field, field, () => h(FileDropzone, { ...props, ...attrs })) }, { attachTo: document.body })
    : mount(FileDropzone, { props, attrs, attachTo: document.body })
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const area = () => q('[data-slot=file-dropzone-area]')!
const root = () => q('[data-slot=file-dropzone]')!
const icon = () => q('[data-slot=field-status]')
const cls = (el: Element) => new Set(el.className.split(/\s+/))

describe('FileDropzone variations', () => {
  describe('defaults', () => {
    it('keeps the default dashed area and adds no status markup', () => {
      make()
      const c = cls(area())
      for (const k of ['min-h-32', 'py-8', 'px-4', 'sm:px-6', 'gap-2', 'rounded-lg', 'border-2', 'border-dashed', 'border-input', 'bg-transparent', 'text-sm', 'text-muted-foreground', 'hover:border-ring/60', 'data-dragging:border-primary', 'focus-visible:ring-3']) expect(c.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'border-solid', 'border-success', 'border-destructive']) expect(c.has(k), k).toBe(false)
      expect(icon()).toBeNull()
      expect(cls(root()).has('relative')).toBe(false)
      expect(area().getAttribute('aria-describedby')).toBeNull()
      expect(area().getAttribute('aria-invalid')).toBeNull()
    })
    it('the exported variants function matches the rendered default', () => {
      make()
      expect(cls(area())).toEqual(new Set(fileDropzoneVariants().split(/\s+/)))
    })
    it('the default upload icon is the xl icon', () => {
      make()
      expect(area().querySelector('svg')!.getAttribute('class')).toContain('size-6')
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['min-h-16', 'py-3', 'gap-1', 'text-xs'], 'size-4'],
      ['sm', ['min-h-24', 'py-5'], 'size-5'],
      ['md', ['min-h-32', 'py-8'], 'size-6'],
      ['lg', ['min-h-48', 'py-12', 'gap-3', 'text-base'], 'size-6'],
    ])('%s sets the area %j and the default icon %s', (size, expected, iconSize) => {
      make({ size })
      for (const k of expected) expect(cls(area()).has(k), k).toBe(true)
      expect(area().querySelector('svg')!.getAttribute('class')).toContain(iconSize)
    })
    it('xs replaces the default text size and padding', () => {
      make({ size: 'xs' })
      expect(cls(area()).has('text-sm')).toBe(false)
      expect(cls(area()).has('py-8')).toBe(false)
    })
    it('an unknown size falls back to md', () => {
      make({ size: 'giant' })
      expect(cls(area()).has('min-h-32')).toBe(true)
    })
    it('exposes every size', () => expect(Object.keys(FILE_DROPZONE_SIZES)).toEqual(['xs', 'sm', 'md', 'lg']))
  })

  describe('variant', () => {
    it('solid draws a continuous border instead of a dashed one', () => {
      make({ variant: 'solid' })
      expect(cls(area()).has('border-solid')).toBe(true)
      expect(cls(area()).has('border-dashed')).toBe(false)
      expect(cls(area()).has('border-input')).toBe(true)
    })
    it('filled swaps the dashed border for a muted fill and keeps a forced-colors border', () => {
      make({ variant: 'filled' })
      const c = cls(area())
      for (const k of ['bg-muted', 'border-solid', 'border-transparent', 'hover:bg-muted', 'forced-colors:border-[ButtonText]']) expect(c.has(k), k).toBe(true)
      for (const k of ['border-dashed', 'bg-transparent', 'border-input']) expect(c.has(k), k).toBe(false)
    })
    it('ghost hides the border at rest and keeps the hover border, a forced-colors border and the drag highlight', () => {
      make({ variant: 'ghost' })
      const c = cls(area())
      for (const k of ['border-transparent', 'hover:border-ring/60', 'forced-colors:border-[ButtonText]', 'data-dragging:border-primary']) expect(c.has(k), k).toBe(true)
      expect(c.has('border-input')).toBe(false)
    })
    it.each(FILE_DROPZONE_VARIANTS)('%s keeps the focus ring', (variant) => {
      make({ variant })
      expect(cls(area()).has('focus-visible:ring-3')).toBe(true)
      expect(cls(area()).has('focus-visible:border-ring')).toBe(true)
    })
    it('an unknown variant falls back to outline', () => {
      make({ variant: 'neon' })
      expect(cls(area()).has('border-dashed')).toBe(true)
      expect(cls(area()).has('bg-muted')).toBe(false)
    })
  })

  describe('status', () => {
    it.each([
      ['success', 'border-success'],
      ['warning', 'border-warning-foreground'],
      ['error', 'border-destructive'],
    ])('%s colours the border and renders an aria-hidden icon in the root', (status, border) => {
      make({ status })
      expect(cls(area()).has(border)).toBe(true)
      expect(icon()!.parentElement).toBe(root())
      expect(icon()!.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
      expect(cls(root()).has('relative')).toBe(true)
      expect(cls(icon()!).has('top-3')).toBe(true)
      expect(cls(icon()!).has('translate-y-0')).toBe(true)
    })
    it('keeps the status colour on hover', () => {
      make({ status: 'success' })
      expect(cls(area()).has('hover:border-success')).toBe(true)
    })
    it.each([
      ['success', 'Valid'],
      ['warning', 'Warning'],
    ])('%s adds hidden text outside the button, so it does not change the accessible name', (status, text) => {
      make({ status })
      const sr = document.getElementById(area().getAttribute('aria-describedby')!)!
      expect(sr.textContent).toBe(text)
      expect(sr.className).toContain('sr-only')
      expect(area().contains(sr)).toBe(false)
      expect(area().textContent).not.toContain(text)
    })
    it('error sets aria-invalid and adds no hidden text', () => {
      make({ status: 'error' })
      expect(area().getAttribute('aria-invalid')).toBe('true')
      expect(area().getAttribute('aria-describedby')).toBeNull()
      expect(icon()!.querySelector('.sr-only')).toBeNull()
    })
    it('merges the Field description, an author aria-describedby and the status text', () => {
      make({ status: 'success' }, { 'aria-describedby': 'mine' }, { label: 'Upload', hint: 'A hint' })
      const ids = area().getAttribute('aria-describedby')!.split(' ')
      expect(ids[0]).toBe('mine')
      expect(ids).toHaveLength(3)
      expect(ids.slice(1).every((id) => document.getElementById(id))).toBe(true)
    })
    it('a rejection message and the status text are both described', async () => {
      const w = make({ status: 'warning', accept: '.pdf' })
      const input = q('input[type=file]') as HTMLInputElement
      Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.txt', { type: 'text/plain' })], configurable: true })
      await w.find('input[type=file]').trigger('change')
      const ids = area().getAttribute('aria-describedby')!.split(' ')
      expect(ids).toHaveLength(2)
      expect(document.getElementById(ids[0])!.getAttribute('role')).toBe('alert')
      expect(document.getElementById(ids[1])!.textContent).toBe('Warning')
    })
    it('xs and sm leave room for the icon beside the prompt', () => {
      make({ status: 'success', size: 'xs' })
      expect(cls(area()).has('px-9')).toBe(true)
      expect(cls(area()).has('sm:px-9')).toBe(true)
      wrapper!.unmount()
      make({ status: 'success', size: 'md' })
      expect(cls(area()).has('px-9')).toBe(false)
    })
    it('an unknown status falls back to default', () => {
      make({ status: 'loud' })
      expect(icon()).toBeNull()
      expect(cls(root()).has('relative')).toBe(false)
    })
  })

  describe('combinations and overrides', () => {
    it('filled + success + xs combine', () => {
      make({ variant: 'filled', status: 'success', size: 'xs' })
      for (const k of ['bg-muted', 'border-success', 'min-h-16', 'px-9']) expect(cls(area()).has(k), k).toBe(true)
      expect(cls(area()).has('border-transparent')).toBe(false)
    })
    it('ghost + error shows the destructive border', () => {
      make({ variant: 'ghost', status: 'error' })
      expect(cls(area()).has('border-destructive')).toBe(true)
      expect(cls(area()).has('border-transparent')).toBe(false)
    })
    it('the class prop styles the root, not the area', () => {
      make({ variant: 'filled', class: 'w-96' })
      expect(cls(root()).has('w-96')).toBe(true)
      expect(cls(root()).has('w-full')).toBe(false)
      expect(cls(area()).has('w-96')).toBe(false)
    })
    it('the exported function lets a later class win and resolves conflicts', () => {
      const out = fileDropzoneVariants({ variant: 'filled', size: 'lg', class: 'min-h-20 bg-card' }).split(/\s+/)
      expect(out).toContain('bg-card')
      expect(out).not.toContain('bg-muted')
      expect(out).toContain('min-h-20')
      expect(out).not.toContain('min-h-48')
    })
    it('invalid keeps the destructive border in a variation', () => {
      make({ invalid: true, variant: 'filled' })
      expect(cls(area()).has('border-destructive')).toBe(true)
      expect(area().getAttribute('aria-invalid')).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('disabled keeps the variation and disables the area', () => {
      make({ variant: 'filled', status: 'warning', disabled: true })
      expect((area() as HTMLButtonElement).disabled).toBe(true)
      expect(cls(area()).has('bg-muted')).toBe(true)
      expect(cls(area()).has('disabled:hover:bg-muted')).toBe(true)
    })
    it('a custom slot keeps working with the icon outside the button', () => {
      wrapper = mount(FileDropzone, { props: { status: 'success', size: 'sm' }, slots: { default: () => h('span', 'Drop a photo') }, attachTo: document.body })
      expect(area().textContent).toBe('Drop a photo')
      expect(icon()).not.toBeNull()
      expect(area().querySelector('svg')).toBeNull()
    })
    it('a long accepted file name still lists with the status icon', async () => {
      const w = make({ status: 'success', multiple: true })
      const name = `${'long-name-'.repeat(12)}.pdf`
      const input = q('input[type=file]') as HTMLInputElement
      Object.defineProperty(input, 'files', { value: [new File(['x'], name, { type: 'application/pdf' })], configurable: true })
      await w.find('input[type=file]').trigger('change')
      expect(q('[data-slot=file-dropzone-item] span')!.className).toContain('truncate')
      expect(icon()).not.toBeNull()
    })
  })
})

describe('FileDropzone hidden input focus', () => {
  it('moves focus to the visible area when the hidden input is focused (native required validation)', () => {
    make({ variant: 'ghost', status: 'warning', required: true })
    ;(q('input[type=file]') as HTMLInputElement).focus()
    expect(document.activeElement).toBe(area())
  })
  it('does nothing visible when the area is disabled', () => {
    make({ disabled: true })
    ;(q('input[type=file]') as HTMLInputElement).focus()
    expect(document.activeElement).not.toBe(area())
  })
})

describe('FileDropzone contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  const iconOnly = { default: () => h('span', { 'aria-hidden': 'true' }) }
  it.each([
    ['solid', { variant: 'solid' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
    ['status error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('an icon-only %s dropzone still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(FileDropzone, props, iconOnly))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('FileDropzone: needs an accessible name')
  })
  it('the default prompt names every variation', async () => {
    await mountTree(() => h(FileDropzone, { variant: 'ghost', status: 'success', size: 'lg' }))
    expect(errors).toEqual([])
  })
})
