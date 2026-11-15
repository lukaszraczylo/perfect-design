import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Field from '../Field/Field.vue'
import { useStrictHarness } from '../testing'
import MultiSelect from './MultiSelect.vue'
import { multiSelectTriggerVariants, MULTI_SELECT_SIZES } from './index'

const mounted: VueWrapper[] = []
const mount = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, field?: Record<string, unknown>) => {
  const comp = () => h(MultiSelect, { options: OPTIONS, 'aria-label': 'Fruit', ...props, ...attrs })
  const w = field ? vtuMount({ render: () => h(Field, field, () => comp()) }, { attachTo: document.body }) : vtuMount(MultiSelect, { props: { options: OPTIONS, 'aria-label': 'Fruit', ...props, ...attrs }, attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
]
const trigger = (w: VueWrapper) => w.find('[data-slot="multi-select-trigger"]')
const classes = (w: VueWrapper) => new Set((trigger(w).attributes('class') ?? '').split(/\s+/))
const icon = (w: VueWrapper) => w.find('[data-slot="field-status"]')

describe('MultiSelect variations', () => {
  describe('defaults', () => {
    it('keeps the default trigger classes and adds no status markup', () => {
      const w = mount()
      const c = classes(w)
      for (const k of ['w-full', 'rounded-md', 'border', 'border-input', 'bg-transparent', 'min-h-9', 'px-3', 'py-1.5', 'text-md', 'md:text-sm', 'pointer-coarse:min-h-11', 'cursor-pointer']) expect(c.has(k), k).toBe(true)
      for (const k of ['bg-muted', 'rounded-full', 'border-success', 'border-destructive', 'border-b-2']) expect(c.has(k), k).toBe(false)
      expect(icon(w).exists()).toBe(false)
      expect(trigger(w).attributes('aria-describedby')).toBeUndefined()
      expect(trigger(w).attributes('aria-invalid')).toBeUndefined()
    })
    it('the exported variants function matches the rendered default', () => {
      expect(classes(mount())).toEqual(new Set(multiSelectTriggerVariants().split(/\s+/)))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['min-h-7', 'px-2', 'py-0.5', 'md:text-xs']],
      ['sm', ['min-h-8', 'px-2.5', 'md:text-sm']],
      ['md', ['min-h-9', 'px-3']],
      ['lg', ['min-h-10', 'px-4', 'py-2']],
    ])('%s sets %j', (size, expected) => {
      const c = classes(mount({ size }))
      for (const k of expected) expect(c.has(k), k).toBe(true)
    })
    it('keeps the 44px touch height at every size', () => {
      for (const size of Object.keys(MULTI_SELECT_SIZES)) expect(classes(mount({ size })).has('pointer-coarse:min-h-11'), size).toBe(true)
    })
    it('an unknown size falls back to md', () => {
      expect(classes(mount({ size: 'giant' })).has('min-h-9')).toBe(true)
    })
  })

  describe('variant', () => {
    it('filled uses a muted fill without a shadow', () => {
      const c = classes(mount({ variant: 'filled' }))
      expect(c.has('bg-muted')).toBe(true)
      expect(c.has('shadow-none')).toBe(true)
      expect(c.has('bg-transparent')).toBe(false)
    })
    it('underline draws a bottom rule that thickens on focus, with a forced-colors fallback', () => {
      const c = classes(mount({ variant: 'underline' }))
      for (const k of ['rounded-none', 'border-0', 'border-b', 'px-0', 'focus-visible:border-b-2', 'focus-visible:ring-0', 'forced-colors:border-b-[ButtonText]']) expect(c.has(k), k).toBe(true)
      expect(c.has('rounded-md')).toBe(false)
    })
    it('ghost hides the border until hover and keeps a focus ring', () => {
      const c = classes(mount({ variant: 'ghost' }))
      for (const k of ['border-transparent', 'hover:border-input', 'focus-visible:ring-3', 'forced-colors:border-[ButtonText]']) expect(c.has(k), k).toBe(true)
    })
    it('an unknown variant falls back to outline', () => {
      const c = classes(mount({ variant: 'neon' }))
      expect(c.has('border-input')).toBe(true)
      expect(c.has('bg-muted')).toBe(false)
    })
  })

  describe('shape', () => {
    it('pill rounds fully with wider padding', () => {
      const c = classes(mount({ shape: 'pill' }))
      expect(c.has('rounded-full')).toBe(true)
      expect(c.has('px-4')).toBe(true)
      expect(c.has('rounded-md')).toBe(false)
    })
    it('square removes the radius', () => {
      expect(classes(mount({ shape: 'square' })).has('rounded-none')).toBe(true)
    })
    it('an unknown shape falls back to rounded', () => {
      expect(classes(mount({ shape: 'blob' })).has('rounded-md')).toBe(true)
    })
  })

  describe('status', () => {
    it.each([
      ['success', 'border-success'],
      ['warning', 'border-warning-foreground'],
      ['error', 'border-destructive'],
    ])('%s colours the border and renders an aria-hidden icon before the chevron', (status, border) => {
      const w = mount({ status })
      expect(classes(w).has(border)).toBe(true)
      expect(icon(w).find('svg').attributes('aria-hidden')).toBe('true')
      const kids = trigger(w).element.children
      const at = Array.from(kids).findIndex((k) => k.getAttribute('data-slot') === 'field-status')
      expect(at).toBeGreaterThan(0)
      expect(kids[at + 1].tagName.toLowerCase()).toBe('svg')
    })
    it.each([
      ['success', 'Valid'],
      ['warning', 'Warning'],
    ])('%s adds hidden text that aria-describedby references', (status, text) => {
      const w = mount({ status })
      const sr = document.getElementById(trigger(w).attributes('aria-describedby')!)!
      expect(sr.textContent).toBe(text)
      expect(sr.className).toContain('sr-only')
    })
    it('error sets aria-invalid and adds no hidden text', () => {
      const w = mount({ status: 'error' })
      expect(trigger(w).attributes('aria-invalid')).toBe('true')
      expect(trigger(w).attributes('aria-describedby')).toBeUndefined()
      expect(icon(w).find('.sr-only').exists()).toBe(false)
    })
    it('merges the Field description and an author aria-describedby with the status text', () => {
      const w = mount({ status: 'success' }, { 'aria-describedby': 'mine' }, { label: 'Fruit', hint: 'A hint' })
      const ids = trigger(w).attributes('aria-describedby')!.split(' ')
      expect(ids[0]).toBe('mine')
      expect(ids).toHaveLength(3)
      expect(ids.slice(1).every((id) => document.getElementById(id))).toBe(true)
    })
    it('the status text is not part of the trigger name', () => {
      const w = mount({ status: 'success', 'aria-label': 'Fruit' })
      const labelledby = trigger(w).attributes('aria-labelledby')!.split(' ')
      expect(labelledby).toHaveLength(2)
      expect(labelledby.every((id) => document.getElementById(id)!.textContent !== 'Valid')).toBe(true)
    })
    it('an unknown status falls back to default', () => {
      const w = mount({ status: 'loud' })
      expect(icon(w).exists()).toBe(false)
      expect(classes(w).has('border-input')).toBe(true)
    })
  })

  describe('combinations and overrides', () => {
    it('underline + pill stays square-cornered without side padding', () => {
      const c = classes(mount({ variant: 'underline', shape: 'pill' }))
      expect(c.has('rounded-none')).toBe(true)
      expect(c.has('px-0')).toBe(true)
      expect(c.has('rounded-full')).toBe(false)
      expect(c.has('px-4')).toBe(false)
    })
    it('filled + pill + success + xs combine', () => {
      const w = mount({ variant: 'filled', shape: 'pill', status: 'success', size: 'xs' })
      for (const k of ['bg-muted', 'rounded-full', 'border-success', 'min-h-7']) expect(classes(w).has(k), k).toBe(true)
      expect(icon(w).exists()).toBe(true)
    })
    it('clearable with a selection keeps pe-14 in a pill', () => {
      const c = classes(mount({ shape: 'pill', clearable: true, defaultValue: ['apple'] }))
      expect(c.has('pe-14')).toBe(true)
      expect(c.has('rounded-full')).toBe(true)
    })
    it('the class prop styles the root, not the trigger', () => {
      const w = mount({ variant: 'filled', class: 'w-64' })
      expect(w.classes()).toContain('w-64')
      expect(classes(w).has('w-64')).toBe(false)
    })
    it('the exported function lets a later class win and resolves conflicts', () => {
      const out = multiSelectTriggerVariants({ shape: 'pill', size: 'lg', class: 'min-h-20 rounded-sm' }).split(/\s+/)
      expect(out).toContain('rounded-sm')
      expect(out).not.toContain('rounded-full')
      expect(out).toContain('min-h-20')
      expect(out).not.toContain('min-h-10')
    })
  })

  describe('edge cases', () => {
    it('disabled keeps the variation and blocks opening', async () => {
      const w = mount({ variant: 'filled', status: 'warning', disabled: true })
      expect(trigger(w).attributes('disabled')).toBeDefined()
      expect(classes(w).has('bg-muted')).toBe(true)
      await trigger(w).trigger('click')
      expect(w.find('[data-slot="multi-select-content"]').exists()).toBe(false)
    })
    it('many chips and the +N more overflow still render with an icon', () => {
      const w = mount({ status: 'success', maxVisible: 1, defaultValue: ['apple', 'banana'] })
      expect(w.findAll('[data-slot="multi-select-chip"]')).toHaveLength(1)
      expect(w.find('[data-slot="multi-select-overflow"]').text()).toBe('+1 more')
      expect(icon(w).exists()).toBe(true)
    })
    it('opens and selects with a variation in place', async () => {
      const w = mount({ variant: 'underline', status: 'warning' })
      await trigger(w).trigger('click')
      await nextTick()
      expect(w.findAll('[data-slot="multi-select-option"]')).toHaveLength(2)
      await w.findAll('[data-slot="multi-select-option"]')[0].trigger('click')
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual([['apple']])
    })
  })
})

describe('MultiSelect contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['pill', { shape: 'pill' }],
    ['filled', { variant: 'filled' }],
    ['status success', { status: 'success' }],
    ['status error', { status: 'error' }],
    ['xs', { size: 'xs' }],
  ])('an unnamed %s trigger still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(MultiSelect, { options: OPTIONS, ...props }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('MultiSelect: needs an accessible name for its trigger')
  })
  it('a named trigger in a variation raises nothing', async () => {
    await mountTree(() => h(MultiSelect, { options: OPTIONS, 'aria-label': 'Fruit', variant: 'ghost', shape: 'pill', status: 'success' }))
    expect(errors).toEqual([])
  })
})
