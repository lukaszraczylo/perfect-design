import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Tree from './Tree.vue'
import type { TreeItem } from './flatten'
import { TREE_SIZES, TREE_VARIANTS, treeCheckboxVariants, treeSizeMetrics, treeVariants } from './variants'

const items: TreeItem[] = [
  { id: 'src', label: 'src', children: [{ id: 'a', label: 'a.ts' }, { id: 'lib', label: 'lib', children: [{ id: 'b', label: 'b.ts' }] }] },
  { id: 'docs', label: 'docs', children: [{ id: 'readme', label: 'README' }] },
  { id: 'pkg', label: 'package.json' },
]

let wrapper: ReturnType<typeof mount> | null = null
const make = (props: Record<string, unknown> = {}) => {
  wrapper = mount(Tree, { props: { items, label: 'Project files', expanded: ['src', 'lib'], ...props }, attachTo: document.body })
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})
type W = ReturnType<typeof mount>
const row = (w: W, id: string) => w.find(`[data-id="${id}"]`)
const press = async (w: W, id: string, key: string) => {
  await row(w, id).trigger('keydown', { key })
  await nextTick()
}

describe('Tree variations', () => {
  describe('default output is unchanged', () => {
    it('keeps the exact root, row, toggle and checkbox classes and adds no look attributes', () => {
      const w = make({ checkboxes: true })
      expect(w.attributes('class')).toBe('flex flex-col text-sm gap-0.5')
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(row(w, 'src').attributes('class')).toContain('flex cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground gap-1.5 py-1 pe-2')
      expect(row(w, 'src').find('[data-slot=tree-toggle]').classes()).toContain('size-4')
      expect(row(w, 'src').find('[data-slot=tree-checkbox]').classes()).toContain('size-4')
      expect(row(w, 'a').attributes('style')).toContain('padding-inline-start: 1.25rem')
    })
    it('compact alone keeps the small scale it always had', () => {
      const w = make({ density: 'compact', checkboxes: true })
      expect(w.attributes('class')).toBe('flex flex-col gap-0 text-xs')
      expect(w.attributes('data-size')).toBeUndefined()
      expect(row(w, 'src').find('[data-slot=tree-toggle]').classes()).toContain('size-3.5')
      expect(row(w, 'src').find('[data-slot=tree-checkbox]').classes()).toContain('size-3.5')
      expect(row(w, 'a').attributes('style')).toContain('padding-inline-start: 1rem')
    })
    it('exports the value lists and the geometry per size', () => {
      expect(TREE_SIZES).toEqual(['sm', 'md', 'lg'])
      expect(TREE_VARIANTS).toEqual(['default', 'lines', 'boxed'])
      expect(treeSizeMetrics.sm).toEqual({ step: 0.75, toggle: 0.875, pad: 0.25 })
      expect(treeSizeMetrics.md).toEqual({ step: 1, toggle: 1, pad: 0.25 })
      expect(treeSizeMetrics.lg.step).toBeGreaterThan(treeSizeMetrics.md.step)
      expect(treeVariants()).toBe('flex flex-col text-sm gap-0.5')
      expect(treeVariants({ boxed: true })).toContain('border')
      expect(treeCheckboxVariants({ size: 'lg' })).toContain('size-5')
      expect(treeCheckboxVariants({ size: 'lg' })).not.toContain('size-4')
      expect(treeCheckboxVariants()).toContain('size-4')
    })
  })

  describe('size', () => {
    it('sm uses the small type, toggle and checkbox size and indentation', () => {
      const w = make({ size: 'sm', checkboxes: true })
      expect(w.attributes('data-size')).toBe('sm')
      expect(w.classes()).toContain('text-xs')
      expect(w.classes()).not.toContain('text-sm')
      expect(w.classes()).toContain('gap-0.5')
      expect(row(w, 'a').find('[data-slot=tree-toggle]').classes()).toContain('size-3.5')
      expect(row(w, 'a').find('[data-slot=tree-checkbox]').classes()).toContain('size-3.5')
      expect(row(w, 'a').attributes('style')).toContain('padding-inline-start: 1rem')
    })
    it('lg uses the large type, toggle and checkbox size and indentation', () => {
      const w = make({ size: 'lg', checkboxes: true })
      expect(w.attributes('data-size')).toBe('lg')
      expect(w.classes()).toContain('text-base')
      expect(w.classes()).not.toContain('text-sm')
      expect(row(w, 'a').find('[data-slot=tree-toggle]').classes()).toContain('size-5')
      expect(row(w, 'a').find('[data-slot=tree-checkbox]').classes()).toContain('size-5')
      expect(row(w, 'a').find('[data-slot=tree-checkbox]').classes()).not.toContain('size-4')
      expect(row(w, 'a').attributes('style')).toContain('padding-inline-start: 1.5rem')
    })
    it('md is the default look and sets no attribute', () => {
      const w = make({ size: 'md' })
      expect(w.attributes('class')).toBe('flex flex-col text-sm gap-0.5')
      expect(w.attributes('data-size')).toBeUndefined()
    })
    it('unknown sizes behave as unset', () => {
      const w = make({ size: 'huge' })
      expect(w.attributes('class')).toBe('flex flex-col text-sm gap-0.5')
      expect(w.attributes('data-size')).toBeUndefined()
      const c = make({ size: 'huge', density: 'compact' })
      expect(c.attributes('class')).toBe('flex flex-col gap-0 text-xs')
    })
    it('an explicit size wins over the type scale density implies', () => {
      const lg = make({ size: 'lg', density: 'compact' })
      expect(lg.classes()).toContain('text-base')
      expect(lg.classes()).not.toContain('text-xs')
      expect(lg.classes()).toContain('gap-0')
      expect(row(lg, 'src').classes()).toContain('py-0.5')
      const md = make({ size: 'md', density: 'compact' })
      expect(md.classes()).toContain('text-sm')
      expect(md.classes()).not.toContain('text-xs')
    })
    it('class wins over the size', () => {
      const w = make({ size: 'lg', class: 'text-xs' })
      expect(w.classes()).toContain('text-xs')
      expect(w.classes()).not.toContain('text-base')
    })
    it('connector lines follow the size geometry', () => {
      const w = make({ size: 'lg', variant: 'lines' })
      expect(row(w, 'a').find('[data-slot=tree-guide]').attributes('style')).toContain('inset-inline-start: 0.875rem')
      expect(row(w, 'a').find('[data-slot=tree-elbow]').attributes('style')).toContain('width: 0.625rem')
      const s = make({ size: 'sm', lines: true })
      expect(row(s, 'a').find('[data-slot=tree-guide]').attributes('style')).toContain('inset-inline-start: 0.6875rem')
    })
  })

  describe('variant', () => {
    it('lines draws the same guides as the lines prop', () => {
      const a = make({ variant: 'lines' })
      const html = (w: W) => w.findAll('[data-slot=tree-guide],[data-slot=tree-elbow]').map((e) => e.html())
      expect(a.attributes('data-variant')).toBe('lines')
      expect(a.classes()).toContain('gap-0')
      expect(row(a, 'a').classes()).toContain('relative')
      const guidesFromVariant = html(a)
      expect(guidesFromVariant.length).toBeGreaterThan(0)
      a.unmount()
      const b = make({ lines: true })
      expect(html(b)).toEqual(guidesFromVariant)
    })
    it('boxed frames the tree in a bordered card surface', () => {
      const w = make({ variant: 'boxed' })
      expect(w.attributes('data-variant')).toBe('boxed')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'border-border', 'bg-card', 'p-1']))
      expect(w.attributes('role')).toBe('tree')
    })
    it('boxed sets the selected row in a heavier weight in addition to the tint, and only in boxed', () => {
      const boxed = make({ variant: 'boxed', selected: 'a' })
      expect(row(boxed, 'a').classes()).toEqual(expect.arrayContaining(['font-medium', 'bg-accent', 'forced-colors:outline-2']))
      expect(row(boxed, 'b').classes()).not.toContain('font-medium')
      boxed.unmount()
      const plain = make({ selected: 'a' })
      expect(row(plain, 'a').classes()).not.toContain('font-medium')
      expect(row(plain, 'a').classes()).toContain('bg-accent')
    })
    it('boxed combines with lines, size, checkboxes and compact', () => {
      const w = make({ variant: 'boxed', lines: true, size: 'lg', checkboxes: true, density: 'compact' })
      expect(w.classes()).toEqual(expect.arrayContaining(['border', 'text-base', 'gap-0']))
      expect(row(w, 'a').find('[data-slot=tree-guide]').exists()).toBe(true)
      expect(row(w, 'a').find('[data-slot=tree-checkbox]').exists()).toBe(true)
      expect(row(w, 'a').find('[data-slot=tree-toggle]').classes()).toContain('size-5')
    })
    it('default sets no variant attribute and no frame', () => {
      const w = make({ variant: 'default' })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).not.toContain('border')
    })
    it('unknown variants fall back to default', () => {
      const w = make({ variant: 'fancy' })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.attributes('class')).toBe('flex flex-col text-sm gap-0.5')
      expect(w.findAll('[data-slot=tree-guide]')).toHaveLength(0)
    })
    it('class wins over the boxed frame', () => {
      const w = make({ variant: 'boxed', class: 'rounded-none p-3' })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
      expect(w.classes()).toContain('p-3')
      expect(w.classes()).not.toContain('p-1')
    })
  })

  describe('ARIA semantics and keyboard map are the same in every look', () => {
    it.each([
      { size: 'sm' },
      { size: 'lg' },
      { variant: 'lines' },
      { variant: 'boxed' },
      { variant: 'boxed', size: 'lg', density: 'compact', checkboxes: true },
    ])('keeps tree roles, levels and roving tabindex for %o', (props) => {
      const w = make(props)
      expect(w.attributes('role')).toBe('tree')
      expect(w.attributes('aria-label')).toBe('Project files')
      const a = row(w, 'a')
      expect(a.attributes('role')).toBe('treeitem')
      expect(a.attributes('aria-level')).toBe('2')
      expect(a.attributes('aria-posinset')).toBe('1')
      expect(a.attributes('aria-setsize')).toBe('2')
      expect(row(w, 'src').attributes('aria-expanded')).toBe('true')
      expect(row(w, 'src').attributes('tabindex')).toBe('0')
      expect(a.attributes('tabindex')).toBe('-1')
      for (const guide of w.findAll('[data-slot=tree-guide],[data-slot=tree-elbow],[data-slot=tree-checkbox],[data-slot=tree-toggle]')) expect(guide.attributes('aria-hidden')).toBe('true')
    })
    it('moves focus, expands and collapses with the keyboard in a boxed, large tree', async () => {
      const w = make({ variant: 'boxed', size: 'lg', expanded: [] })
      await press(w, 'src', 'ArrowRight')
      expect(row(w, 'src').attributes('aria-expanded')).toBe('true')
      await press(w, 'src', 'ArrowRight')
      expect(document.activeElement).toBe(row(w, 'a').element)
      await press(w, 'a', 'ArrowLeft')
      expect(document.activeElement).toBe(row(w, 'src').element)
      await press(w, 'src', 'End')
      expect(document.activeElement).toBe(row(w, 'pkg').element)
      await press(w, 'pkg', 'Home')
      expect(document.activeElement).toBe(row(w, 'src').element)
      await press(w, 'src', 'ArrowLeft')
      expect(row(w, 'src').attributes('aria-expanded')).toBe('false')
    })
    it('selects with Enter and keeps aria-selected in boxed', async () => {
      const w = make({ variant: 'boxed' })
      await press(w, 'a', 'Enter')
      expect(row(w, 'a').attributes('aria-selected')).toBe('true')
      expect(row(w, 'a').attributes('data-state')).toBe('selected')
      expect(row(w, 'a').classes()).toContain('font-medium')
      expect(w.emitted('select')![0]![0]).toMatchObject({ id: 'a' })
    })
    it('Space toggles checkboxes with every size', async () => {
      const w = make({ size: 'lg', checkboxes: true })
      await press(w, 'a', ' ')
      expect(row(w, 'a').attributes('aria-checked')).toBe('true')
      expect(row(w, 'src').attributes('aria-checked')).toBe('mixed')
    })
  })

  describe('edge cases', () => {
    it('renders an empty boxed tree', () => {
      const w = make({ items: [], variant: 'boxed', size: 'lg' })
      expect(w.findAll('[role=treeitem]')).toHaveLength(0)
      expect(w.classes()).toContain('border')
    })
    it('truncates long labels inside the row at every size', () => {
      const long = 'x'.repeat(300)
      const w = make({ items: [{ id: 'l', label: long }], size: 'lg', variant: 'boxed' })
      expect(w.find('[data-slot=tree-label]').text()).toBe(long)
      expect(w.find('[data-slot=tree-label]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
    })
  })
})
