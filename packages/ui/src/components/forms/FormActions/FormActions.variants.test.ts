import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import FormActions from './FormActions.vue'
import { formActionsVariants, FORM_ACTIONS_LAYOUTS, FORM_ACTIONS_SIZES, FORM_ACTIONS_VARIANTS } from './index'

const make = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mount(FormActions, { props: { submitLabel: 'Save', cancelLabel: 'Cancel', ...props }, slots: slots as never })
const classes = (w: ReturnType<typeof mount>) => new Set((w.attributes('class') ?? '').split(/\s+/))

describe('FormActions variations', () => {
  describe('defaults', () => {
    it('keeps the default stacked, end-aligned, plain bar', () => {
      const c = classes(make())
      for (const k of ['flex', 'gap-2', 'flex-col', 'items-stretch', 'sm:flex-row', 'sm:flex-wrap', 'sm:items-center', 'sm:justify-end', '*:w-full', 'sm:*:w-auto']) expect(c.has(k), k).toBe(true)
      for (const k of ['sticky', 'border-t', 'bg-background', 'px-4', 'py-3', 'rounded-md', 'border', 'sm:*:first:not-last:me-auto']) expect(c.has(k), k).toBe(false)
    })
    it('the exported variants function matches the rendered default', () => {
      expect(classes(make())).toEqual(new Set(formActionsVariants().split(/\s+/)))
    })
    it('built-in buttons keep their default size', () => {
      const w = make()
      expect(w.find('[data-slot=form-actions-submit]').classes()).toContain('h-9')
      expect(w.find('[data-slot=form-actions-cancel]').classes()).toContain('h-9')
    })
  })

  describe('layout', () => {
    it('stacked stacks below sm and rows from sm', () => {
      const c = classes(make({ layout: 'stacked' }))
      for (const k of ['flex-col', 'sm:flex-row', '*:w-full', 'sm:*:w-auto']) expect(c.has(k), k).toBe(true)
    })
    it('inline is a wrapping row at every width, with no full-width buttons', () => {
      const c = classes(make({ layout: 'inline' }))
      for (const k of ['flex-row', 'flex-wrap', 'items-center', 'justify-end']) expect(c.has(k), k).toBe(true)
      for (const k of ['flex-col', '*:w-full', 'sm:flex-row', 'sm:justify-end']) expect(c.has(k), k).toBe(false)
    })
    it('split pushes the first action to the start from sm and keeps the others at the end', () => {
      const c = classes(make({ layout: 'split' }))
      for (const k of ['flex-col', 'sm:flex-row', 'sm:justify-end', 'sm:*:first:not-last:me-auto', '*:w-full']) expect(c.has(k), k).toBe(true)
    })
    it('split ignores align', () => {
      const c = classes(make({ layout: 'split', align: 'center' }))
      expect(c.has('sm:justify-center')).toBe(false)
      expect(c.has('sm:justify-end')).toBe(true)
    })
    it('split keeps DOM order: cancel first, then submit, with no order utilities', () => {
      const w = make({ layout: 'split' })
      expect(w.findAll('button').map((b) => b.text())).toEqual(['Cancel', 'Save'])
      expect(w.html()).not.toMatch(/\border-/)
    })
    it('the legacy stacked=false is the inline layout, and only for the default layout', () => {
      expect(classes(make({ stacked: false }))).toEqual(classes(make({ layout: 'inline' })))
      expect(classes(make({ stacked: false, layout: 'split' })).has('sm:*:first:not-last:me-auto')).toBe(true)
    })
    it('an unknown layout falls back to stacked', () => {
      expect(classes(make({ layout: 'diagonal' }))).toEqual(classes(make()))
    })
  })

  describe('align', () => {
    it.each([
      ['start', 'sm:justify-start'],
      ['center', 'sm:justify-center'],
      ['end', 'sm:justify-end'],
      ['between', 'sm:justify-between'],
    ])('stacked + %s uses %s', (align, expected) => {
      expect(classes(make({ align })).has(expected)).toBe(true)
    })
    it.each([
      ['start', 'justify-start'],
      ['center', 'justify-center'],
      ['end', 'justify-end'],
      ['between', 'justify-between'],
    ])('inline + %s uses %s at every width', (align, expected) => {
      expect(classes(make({ layout: 'inline', align })).has(expected)).toBe(true)
    })
    it('an unknown align falls back to end', () => {
      expect(classes(make({ align: 'middle' })).has('sm:justify-end')).toBe(true)
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'gap-1.5', 'h-8'],
      ['md', 'gap-2', 'h-9'],
      ['lg', 'gap-3', 'h-11'],
    ])('%s sets the gap %s and the built-in buttons to %s', (size, gap, height) => {
      const w = make({ size })
      expect(classes(w).has(gap)).toBe(true)
      expect(w.find('[data-slot=form-actions-submit]').classes()).toContain(height)
      expect(w.find('[data-slot=form-actions-cancel]').classes()).toContain(height)
    })
    it('buttons in the default slot keep their own size', () => {
      const w = make({ size: 'lg' }, { default: '<button class="mine h-7">Go</button>' })
      expect(w.find('.mine').classes()).toContain('h-7')
      expect(classes(w).has('gap-3')).toBe(true)
    })
    it.each([
      ['sm', 'px-3', 'py-2'],
      ['md', 'px-4', 'py-3'],
      ['lg', 'px-5', 'py-4'],
    ])('a %s bar scales its padding to %s %s', (size, px, py) => {
      const c = classes(make({ size, variant: 'bar' }))
      expect(c.has(px)).toBe(true)
      expect(c.has(py)).toBe(true)
    })
    it('an unknown size falls back to md', () => {
      const w = make({ size: 'giant' })
      expect(classes(w).has('gap-2')).toBe(true)
      expect(w.find('[data-slot=form-actions-submit]').classes()).toContain('h-9')
    })
  })

  describe('variant', () => {
    it('plain has no surface', () => {
      const c = classes(make({ variant: 'plain' }))
      for (const k of ['border-t', 'border', 'bg-background', 'px-4', 'rounded-md']) expect(c.has(k), k).toBe(false)
    })
    it('bar is a full-width footer with a top border on an opaque background', () => {
      const c = classes(make({ variant: 'bar' }))
      for (const k of ['border-t', 'bg-background', 'px-4', 'py-3']) expect(c.has(k), k).toBe(true)
      expect(c.has('rounded-md')).toBe(false)
      expect(c.has('sticky')).toBe(false)
    })
    it('boxed is a bordered rounded panel on an opaque background', () => {
      const c = classes(make({ variant: 'boxed' }))
      for (const k of ['rounded-md', 'border', 'bg-background', 'px-4', 'py-3']) expect(c.has(k), k).toBe(true)
      expect(c.has('border-t')).toBe(false)
    })
    it('never uses blur or transparency', () => {
      for (const variant of FORM_ACTIONS_VARIANTS) {
        expect(make({ variant, sticky: true }).attributes('class'), variant).not.toMatch(/backdrop|blur|bg-background\//)
      }
    })
    it('an unknown variant falls back to plain', () => {
      expect(classes(make({ variant: 'neon' }))).toEqual(classes(make()))
    })
  })

  describe('sticky', () => {
    it('a plain sticky bar gets the bar surface and keeps its data attribute', () => {
      const w = make({ sticky: true })
      const c = classes(w)
      for (const k of ['sticky', 'bottom-0', 'z-(--z-sticky)', 'border-t', 'bg-background', 'px-4', 'py-3']) expect(c.has(k), k).toBe(true)
      expect(w.attributes('data-sticky')).toBe('')
    })
    it('sticky + boxed keeps the box and sticks', () => {
      const c = classes(make({ sticky: true, variant: 'boxed' }))
      for (const k of ['sticky', 'rounded-md', 'border', 'bg-background']) expect(c.has(k), k).toBe(true)
    })
    it('sticky padding follows the size', () => {
      expect(classes(make({ sticky: true, size: 'lg' })).has('px-5')).toBe(true)
    })
    it('a not sticky bar has no data-sticky', () => {
      expect(make().attributes('data-sticky')).toBeUndefined()
    })
  })

  describe('combinations and overrides', () => {
    it('split + boxed + lg combine', () => {
      const c = classes(make({ layout: 'split', variant: 'boxed', size: 'lg' }))
      for (const k of ['sm:*:first:not-last:me-auto', 'rounded-md', 'border', 'gap-3', 'px-5', 'py-4']) expect(c.has(k), k).toBe(true)
    })
    it('inline + bar + between + sm combine', () => {
      const c = classes(make({ layout: 'inline', variant: 'bar', align: 'between', size: 'sm' }))
      for (const k of ['flex-row', 'justify-between', 'border-t', 'gap-1.5', 'px-3']) expect(c.has(k), k).toBe(true)
    })
    it('the class prop wins over the variation classes', () => {
      const c = classes(make({ variant: 'bar', size: 'lg', class: 'px-8 bg-card gap-1' }))
      for (const k of ['px-8', 'bg-card', 'gap-1']) expect(c.has(k), k).toBe(true)
      for (const k of ['px-5', 'bg-background', 'gap-3']) expect(c.has(k), k).toBe(false)
    })
    it('the exported function resolves conflicts for plain elements', () => {
      const out = formActionsVariants({ layout: 'inline', align: 'between', sticky: true, size: 'sm', class: 'py-6' }).split(/\s+/)
      for (const k of ['justify-between', 'sticky', 'px-3', 'py-6']) expect(out, k).toContain(k)
      expect(out).not.toContain('py-2')
    })
    it('exposes every layout, size and variant', () => {
      expect([...FORM_ACTIONS_LAYOUTS]).toEqual(['stacked', 'inline', 'split'])
      expect([...FORM_ACTIONS_SIZES]).toEqual(['sm', 'md', 'lg'])
      expect([...FORM_ACTIONS_VARIANTS]).toEqual(['plain', 'bar', 'boxed'])
    })
  })

  describe('behaviour does not change', () => {
    it.each(FORM_ACTIONS_LAYOUTS)('%s: submit and cancel still emit, loading and disabled still apply', async (layout) => {
      const w = make({ layout, loading: true })
      await w.find('[data-slot=form-actions-cancel]').trigger('click')
      expect(w.emitted('cancel')).toHaveLength(1)
      expect(w.find('[data-slot=form-actions-submit]').attributes('aria-busy')).toBe('true')
      const d = make({ layout, submitDisabled: true })
      expect(d.find('[data-slot=form-actions-submit]').attributes('disabled')).toBeDefined()
    })
    it('role=group still needs a name in every variant', () => {
      expect(mount(FormActions, { props: { variant: 'bar', submitLabel: 'Save' } }).attributes('role')).toBeUndefined()
      expect(mount(FormActions, { props: { variant: 'bar', submitLabel: 'Save' }, attrs: { 'aria-label': 'Actions' } }).attributes('role')).toBe('group')
    })
    it('an empty slot with a surface still renders the surface only', () => {
      expect(mount(FormActions, { props: { variant: 'boxed' } }).element.children).toHaveLength(0)
    })
  })
})

describe('FormActions contract in every variation', () => {
  const { errors, mountTree } = useStrictHarness()
  it.each([
    ['split', { layout: 'split' }],
    ['inline', { layout: 'inline' }],
    ['bar', { variant: 'bar' }],
    ['boxed + sticky', { variant: 'boxed', sticky: true }],
    ['lg', { size: 'lg' }],
  ])('a %s bar with no actions still throws', async (_n: string, props: Record<string, unknown>) => {
    configureStrictMode('throw')
    await mountTree(() => h(FormActions, props))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('FormActions: renders no actions')
  })
  it('a bar with actions in a variation raises nothing', async () => {
    await mountTree(() => h(FormActions, { submitLabel: 'Save', layout: 'split', variant: 'bar', size: 'sm' }))
    expect(errors).toEqual([])
  })
})
