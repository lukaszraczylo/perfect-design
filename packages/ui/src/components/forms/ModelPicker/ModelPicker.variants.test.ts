import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ModelPicker from './ModelPicker.vue'
import { comboboxVariants } from '../Combobox/variants'
import { modelPickerVariants } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [{ id: 'a', label: 'Option A' }]
function make(props: Record<string, unknown> = {}) {
  const Host = defineComponent({ setup: () => () => h(ModelPicker, { options: OPTIONS, 'aria-label': 'Preset', ...props }) })
  wrapper = mount(Host, { attachTo: document.body })
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const input = () => q('input[data-slot="model-picker-input"]') as HTMLInputElement
const cls = () => new Set(input().className.split(/\s+/))

describe('ModelPicker variations', () => {
  it('default input classes equal the shared Combobox field look and add no status markup', () => {
    make()
    const c = cls()
    for (const k of ['w-full', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'h-9', 'text-md', 'md:text-sm', 'pe-9', 'py-1', 'pointer-coarse:min-h-11']) expect(c.has(k), k).toBe(true)
    for (const k of ['bg-muted', 'rounded-full', 'border-success', 'border-destructive', 'border-b-2']) expect(c.has(k), k).toBe(false)
    expect(c).toEqual(new Set(modelPickerVariants().split(/\s+/)))
    expect(modelPickerVariants()).toBe(comboboxVariants())
    expect(q('[data-slot="field-status"]')).toBeNull()
  })
  it.each([
    ['xs', ['h-7', 'px-2', 'md:text-xs']],
    ['sm', ['h-8', 'md:text-sm']],
    ['md', ['h-9', 'md:text-sm']],
    ['lg', ['h-11']],
  ])('size %s sets %j and keeps 16px text below md', (size, expected) => {
    make({ size })
    for (const k of expected) expect(cls().has(k), k).toBe(true)
    expect(cls().has('text-md')).toBe(true)
  })
  it('an unknown size, variant, shape and status fall back to the default', () => {
    make({ size: 'giant', variant: 'neon', shape: 'blob', status: 'lava' })
    expect(cls()).toEqual(new Set(modelPickerVariants().split(/\s+/)))
    expect(q('[data-slot="field-status"]')).toBeNull()
  })
  it.each([
    ['filled', 'bg-muted'],
    ['underline', 'border-b'],
    ['ghost', 'border-transparent'],
  ])('variant %s adds %s', (variant, klass) => {
    make({ variant })
    expect(cls().has(klass)).toBe(true)
  })
  it.each([
    ['pill', 'rounded-full'],
    ['square', 'rounded-none'],
  ])('shape %s adds %s', (shape, klass) => {
    make({ shape })
    expect(cls().has(klass)).toBe(true)
  })
  it('variant and size combine without conflict', () => {
    make({ variant: 'filled', size: 'lg', shape: 'pill' })
    for (const k of ['bg-muted', 'h-11', 'rounded-full']) expect(cls().has(k), k).toBe(true)
  })
  it.each([
    ['success', 'border-success', 'Valid'],
    ['warning', 'border-warning-foreground', 'Warning'],
    ['error', 'border-destructive', ''],
  ])('status %s adds the colour class, an icon, end padding and (success, warning) text', (status, klass, text) => {
    make({ status })
    expect(cls().has(klass)).toBe(true)
    expect(q('[data-slot="field-status"]')).not.toBeNull()
    expect(q('[data-slot="field-status"] svg')).not.toBeNull()
    expect(q('[data-slot="field-status"] .sr-only')?.textContent ?? '').toBe(text)
    expect(cls().has('pe-16')).toBe(true)
    expect(cls().has('pe-9')).toBe(false)
  })
  it('clearable keeps the buttons clear of the text, with and without status', () => {
    make({ clearable: true })
    expect(cls().has('pe-16')).toBe(true)
    wrapper!.unmount()
    make({ clearable: true, status: 'success' })
    expect(cls().has('pe-24')).toBe(true)
  })
  it('class goes to the root and wins over its internal classes', () => {
    make({ class: 'max-w-xs w-1/2' })
    const root = q('[data-slot="model-picker"]')!
    expect(root.classList.contains('max-w-xs')).toBe(true)
    expect(root.classList.contains('w-1/2')).toBe(true)
    expect(root.classList.contains('w-full')).toBe(false)
  })
  it('uses logical properties and no physical left/right utilities', () => {
    make({ clearable: true, defaultValue: 'a' })
    expect(document.body.innerHTML).toContain('end-2')
    expect(document.body.innerHTML).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/)
  })
})
