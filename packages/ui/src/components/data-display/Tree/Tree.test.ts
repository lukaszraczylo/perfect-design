import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faFolder } from '@fortawesome/free-solid-svg-icons'
import Tree from './Tree.vue'
import { branchIds, checkState, connectorGuides, flattenTree, leafIds, type TreeItem } from './flatten'
import { TREE_DENSITIES, treeCheckboxVariants, treeItemVariants, treeMetrics, treeVariants } from './variants'

const items: TreeItem[] = [
  { id: 'src', label: 'src', children: [{ id: 'a', label: 'a.ts' }, { id: 'lib', label: 'lib', children: [{ id: 'b', label: 'b.ts' }] }] },
  { id: 'docs', label: 'docs', children: [{ id: 'readme', label: 'README' }] },
  { id: 'pkg', label: 'package.json' },
]

let wrapper: ReturnType<typeof mount> | null = null
const make = (props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => {
  wrapper = mount(Tree, { props: { items, ...props }, attachTo: document.body, ...opts })
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})
const ids = (w: ReturnType<typeof mount>) => w.findAll('[role="treeitem"]').map((n) => n.attributes('data-id'))
const item = (w: ReturnType<typeof mount>, id: string) => w.find(`[data-id="${id}"]`)

describe('flattenTree / branchIds (pure)', () => {
  it('skips children of collapsed nodes and computes aria metadata', () => {
    const flat = flattenTree(items, new Set(['src']))
    expect(flat.map((n) => n.item.id)).toEqual(['src', 'a', 'lib', 'docs', 'pkg'])
    expect(flat[1]).toMatchObject({ level: 2, parentId: 'src', posinset: 1, setsize: 2, hasChildren: false })
    expect(flat[0]).toMatchObject({ level: 1, parentId: null, posinset: 1, setsize: 3, hasChildren: true })
  })
  it('ignores duplicate ids, shared objects and junk', () => {
    const shared: TreeItem = { id: 's', label: 's' }
    const cyc: TreeItem = { id: 'c', label: 'c', children: [] }
    cyc.children!.push(cyc)
    const flat = flattenTree(
      [{ id: 'x', label: '1' }, { id: 'x', label: '2' }, shared, shared, cyc, null as never, { id: 'y', label: 'y', children: 'nope' as never }],
      new Set(['c', 'x']),
    )
    expect(flat.map((n) => n.item.id)).toEqual(['x', 's', 'c', 'y'])
    expect(flat.find((n) => n.item.id === 'y')!.hasChildren).toBe(false)
  })
  it('drops an id that already appeared elsewhere', () => {
    const flat = flattenTree([{ id: 'a', label: 'a', children: [{ id: 'a', label: 'dup' }] }], new Set(['a']))
    expect(flat).toHaveLength(1)
  })
  it('handles empty / invalid input', () => {
    expect(flattenTree([], new Set())).toEqual([])
    expect(flattenTree(undefined as never, new Set())).toEqual([])
    expect(branchIds(undefined as never)).toEqual([])
  })
  it('branchIds lists nodes with children, guarding cycles', () => {
    const cyc: TreeItem = { id: 'c', label: 'c', children: [] }
    cyc.children!.push(cyc, null as never)
    expect(branchIds(items)).toEqual(['src', 'lib', 'docs'])
    expect(branchIds([cyc])).toEqual(['c'])
  })
})

describe('checkState / leafIds / connectorGuides (pure)', () => {
  it('leafIds returns leaves only, guarding cycles and junk', () => {
    expect(leafIds(items[0]!)).toEqual(['a', 'b'])
    expect(leafIds(items[2]!)).toEqual(['pkg'])
    const cyc: TreeItem = { id: 'c', label: 'c', children: [] }
    cyc.children!.push(cyc, null as never, { id: 'k', label: 'k' })
    expect(leafIds(cyc)).toEqual(['k'])
    expect(leafIds(null as never)).toEqual([])
  })
  it('checkState derives branch state from leaves', () => {
    expect(checkState(items[0]!, new Set())).toBe('unchecked')
    expect(checkState(items[0]!, new Set(['a']))).toBe('indeterminate')
    expect(checkState(items[0]!, new Set(['a', 'b']))).toBe('checked')
    expect(checkState(items[2]!, new Set(['pkg']))).toBe('checked')
    expect(checkState(items[0]!, new Set(['src']))).toBe('unchecked')
  })
  it('connectorGuides: continuing rules, elbows on last children, none at the root', () => {
    const g = connectorGuides(flattenTree(items, new Set(['src', 'lib'])))
    expect(g.get('src')).toEqual([])
    expect(g.get('a')).toEqual([{ depth: 1, half: false }])
    expect(g.get('lib')).toEqual([{ depth: 1, half: true }])
    expect(g.get('b')).toEqual([{ depth: 2, half: true }])
    expect(g.get('docs')).toEqual([])
    const open = connectorGuides(flattenTree([{ id: 'p', label: 'p', children: [{ id: 'q', label: 'q', children: [{ id: 'r', label: 'r' }] }, { id: 's', label: 's' }] }], new Set(['p', 'q'])))
    expect(open.get('r')).toEqual([{ depth: 1, half: false }, { depth: 2, half: true }])
  })
})

describe('Tree', () => {
  describe('good path', () => {
    it('renders a tree with only top-level nodes collapsed', () => {
      const w = make()
      expect(w.attributes('role')).toBe('tree')
      expect(w.attributes('data-slot')).toBe('tree')
      expect(ids(w)).toEqual(['src', 'docs', 'pkg'])
      expect(item(w, 'src').attributes('aria-expanded')).toBe('false')
      expect(item(w, 'pkg').attributes('aria-expanded')).toBeUndefined()
      expect(item(w, 'src').attributes('aria-level')).toBe('1')
    })

    it('click on a branch selects and toggles it (uncontrolled)', async () => {
      const w = make()
      await item(w, 'src').trigger('click')
      expect(ids(w)).toEqual(['src', 'a', 'lib', 'docs', 'pkg'])
      expect(item(w, 'src').attributes('aria-selected')).toBe('true')
      expect(item(w, 'src').attributes('data-state')).toBe('selected')
      expect(w.emitted('update:selected')?.[0]).toEqual(['src'])
      expect(w.emitted('update:expanded')?.[0]).toEqual([['src']])
      expect(w.emitted('select')?.[0]).toEqual([items[0]])
      await item(w, 'src').trigger('click')
      expect(ids(w)).toEqual(['src', 'docs', 'pkg'])
    })

    it('clicking the chevron toggles without selecting', async () => {
      const w = make()
      await item(w, 'docs').find('[data-slot="tree-toggle"]').trigger('click')
      expect(ids(w)).toContain('readme')
      expect(w.emitted('update:selected')).toBeUndefined()
    })

    it('chevron on a leaf does nothing', async () => {
      const w = make()
      await item(w, 'pkg').find('[data-slot="tree-toggle"]').trigger('click')
      expect(w.emitted('update:expanded')).toBeUndefined()
    })

    it('is controlled via v-model:expanded and v-model:selected', async () => {
      const w = make({ expanded: ['src', 'lib'], selected: 'b' })
      expect(ids(w)).toEqual(['src', 'a', 'lib', 'b', 'docs', 'pkg'])
      expect(item(w, 'b').attributes('aria-selected')).toBe('true')
      expect(item(w, 'b').attributes('aria-level')).toBe('3')
      await w.setProps({ expanded: [], selected: null })
      expect(ids(w)).toEqual(['src', 'docs', 'pkg'])
    })

    it('renders icons and the item slot', () => {
      const w = make({ items: [{ id: 'f', label: 'Folder', icon: faFolder }] })
      expect(item(w, 'f').find('svg').exists()).toBe(true)
      const s = make({}, { slots: { item: '<template #item="{ item: i, level }"><b class="x">{{ i.label }}-{{ level }}</b></template>' } })
      expect(s.find('.x').text()).toBe('src-1')
    })

    it('expandAll / collapseAll via exposed methods', async () => {
      const w = make()
      ;(w.vm as unknown as { expandAll(): void }).expandAll()
      await w.vm.$nextTick()
      expect(ids(w)).toEqual(['src', 'a', 'lib', 'b', 'docs', 'readme', 'pkg'])
      ;(w.vm as unknown as { collapseAll(): void }).collapseAll()
      await w.vm.$nextTick()
      expect(ids(w)).toEqual(['src', 'docs', 'pkg'])
    })
  })

  describe('keyboard', () => {
    const press = async (w: ReturnType<typeof mount>, id: string, key: string) => {
      await item(w, id).trigger('keydown', { key })
      await w.vm.$nextTick()
    }

    it('roving tabindex: only the first (or selected) item is tabbable initially', () => {
      const w = make()
      expect(item(w, 'src').attributes('tabindex')).toBe('0')
      expect(item(w, 'docs').attributes('tabindex')).toBe('-1')
      expect(item(make({ selected: 'pkg' }), 'pkg').attributes('tabindex')).toBe('0')
    })

    it('ArrowDown / ArrowUp / Home / End move focus', async () => {
      const w = make()
      await press(w, 'src', 'ArrowDown')
      expect(document.activeElement).toBe(item(w, 'docs').element)
      expect(item(w, 'docs').attributes('tabindex')).toBe('0')
      await press(w, 'docs', 'End')
      expect(document.activeElement).toBe(item(w, 'pkg').element)
      await press(w, 'pkg', 'ArrowDown')
      expect(document.activeElement).toBe(item(w, 'pkg').element)
      await press(w, 'pkg', 'ArrowUp')
      expect(document.activeElement).toBe(item(w, 'docs').element)
      await press(w, 'docs', 'Home')
      expect(document.activeElement).toBe(item(w, 'src').element)
      await press(w, 'src', 'ArrowUp')
      expect(document.activeElement).toBe(item(w, 'src').element)
    })

    it('ArrowRight expands, then moves to the first child; ArrowLeft goes to parent / collapses', async () => {
      const w = make()
      await press(w, 'src', 'ArrowRight')
      expect(ids(w)).toContain('a')
      await press(w, 'src', 'ArrowRight')
      expect(document.activeElement).toBe(item(w, 'a').element)
      await press(w, 'a', 'ArrowLeft')
      expect(document.activeElement).toBe(item(w, 'src').element)
      await press(w, 'src', 'ArrowLeft')
      expect(ids(w)).not.toContain('a')
      await press(w, 'src', 'ArrowLeft') // root, collapsed: nothing happens
      expect(document.activeElement).toBe(item(w, 'src').element)
    })

    it('ArrowRight on a leaf does nothing and keeps default handling', async () => {
      const w = make()
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      item(w, 'pkg').element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    })

    it('Enter and Space select (and toggle branches)', async () => {
      const w = make()
      await press(w, 'pkg', 'Enter')
      expect(w.emitted('update:selected')?.[0]).toEqual(['pkg'])
      await press(w, 'src', ' ')
      expect(w.emitted('update:selected')?.[1]).toEqual(['src'])
      expect(ids(w)).toContain('a')
    })

    it('prevents default for handled keys and ignores others', async () => {
      const w = make()
      const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      item(w, 'src').element.dispatchEvent(arrow)
      expect(arrow.defaultPrevented).toBe(true)
      const other = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true })
      item(w, 'src').element.dispatchEvent(other)
      expect(other.defaultPrevented).toBe(false)
    })
  })

  describe('bad path', () => {
    it('disabled nodes cannot be selected or toggled but stay focusable', async () => {
      const w = make({ items: [{ id: 'd', label: 'Locked', disabled: true, children: [{ id: 'k', label: 'kid' }] }] })
      const d = item(w, 'd')
      expect(d.attributes('aria-disabled')).toBe('true')
      expect(d.attributes('tabindex')).toBe('0')
      await d.trigger('click')
      await d.trigger('keydown', { key: 'Enter' })
      await d.trigger('keydown', { key: 'ArrowRight' })
      await d.find('[data-slot="tree-toggle"]').trigger('click')
      expect(w.emitted('update:selected')).toBeUndefined()
      expect(w.emitted('update:expanded')).toBeUndefined()
      expect(ids(w)).toEqual(['d'])
    })

    it('disabled expanded node cannot be collapsed with ArrowLeft', async () => {
      const w = make({ expanded: ['d'], items: [{ id: 'd', label: 'Locked', disabled: true, children: [{ id: 'k', label: 'kid' }] }] })
      await item(w, 'd').trigger('keydown', { key: 'ArrowLeft' })
      expect(ids(w)).toEqual(['d', 'k'])
    })

    it('unknown ids in expanded / selected are ignored', () => {
      const w = make({ expanded: ['ghost', 'src'], selected: 'ghost' })
      expect(ids(w)).toEqual(['src', 'a', 'lib', 'docs', 'pkg'])
      expect(item(w, 'src').attributes('tabindex')).toBe('0')
      expect(w.findAll('[aria-selected="true"]')).toHaveLength(0)
    })

    it('non-array expanded falls back to empty', () => {
      expect(ids(make({ expanded: 'src' as never }))).toEqual(['src', 'docs', 'pkg'])
    })

    it('empty items render an empty tree and keys do nothing', async () => {
      const w = make({ items: [] })
      expect(ids(w)).toEqual([])
      await w.trigger('keydown', { key: 'ArrowDown' })
      expect(w.emitted('update:selected')).toBeUndefined()
    })

    it('duplicate ids render once without Vue key warnings', () => {
      const w = make({ items: [{ id: 'x', label: 'one' }, { id: 'x', label: 'two' }] })
      expect(ids(w)).toEqual(['x'])
    })
  })

  describe('customisation + edge cases', () => {
    it('merges class and passes attributes (aria-label)', () => {
      const w = make({ class: 'gap-4 custom' }, { attrs: { 'aria-label': 'Files' } })
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-0.5')
      expect(w.attributes('aria-label')).toBe('Files')
    })

    it('indents deeper levels', () => {
      const w = make({ expanded: ['src', 'lib'] })
      expect(item(w, 'src').attributes('style')).toContain('padding-inline-start: 0.25rem')
      expect(item(w, 'b').attributes('style')).toContain('padding-inline-start: 2.25rem')
    })

    it('handles unicode/RTL labels and a deep, wide tree', () => {
      const deep: TreeItem = { id: 'r0', label: 'مرحبا 🎉' }
      let cur = deep
      for (let i = 1; i < 200; i++) {
        const next: TreeItem = { id: `r${i}`, label: String(i) }
        cur.children = [next]
        cur = next
      }
      const wide = Array.from({ length: 2000 }, (_, i) => ({ id: `w${i}`, label: `w${i}` }))
      const w = make({ items: [deep, ...wide], expanded: Array.from({ length: 200 }, (_, i) => `r${i}`) })
      expect(w.findAll('[role="treeitem"]')).toHaveLength(2200)
      expect(item(w, 'r0').text()).toBe('مرحبا 🎉')
      expect(item(w, 'r199').attributes('aria-level')).toBe('200')
    })
  })

  describe('default output (backward compatibility)', () => {
    it('adds nothing for plain usage', () => {
      const w = make({ expanded: ['src'] })
      expect(w.classes()).toEqual(['flex', 'flex-col', 'text-sm', 'gap-0.5'])
      expect(item(w, 'src').attributes('aria-checked')).toBeUndefined()
      expect(item(w, 'src').classes()).not.toContain('relative')
      expect(w.find('[data-slot="tree-checkbox"]').exists()).toBe(false)
      expect(w.find('[data-slot="tree-guide"]').exists()).toBe(false)
      expect(w.find('[data-slot="tree-toggle"]').classes()).toContain('size-4')
      expect(item(w, 'src').classes()).toEqual(expect.arrayContaining(['gap-1.5', 'py-1', 'pe-2']))
    })
  })

  describe('compact density', () => {
    it('tightens gap, text, rows, toggle and indentation', () => {
      const w = make({ density: 'compact', expanded: ['src'] })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-0', 'text-xs']))
      expect(w.classes()).not.toContain('text-sm')
      expect(item(w, 'src').classes()).toEqual(expect.arrayContaining(['gap-1', 'py-0.5', 'pe-1.5']))
      expect(item(w, 'src').classes()).not.toContain('py-1')
      expect(item(w, 'src').find('[data-slot="tree-toggle"]').classes()).toContain('size-3.5')
      expect(item(w, 'src').attributes('style')).toContain('padding-inline-start: 0.25rem')
      expect(item(w, 'a').attributes('style')).toContain('padding-inline-start: 1rem')
    })
    it('unknown density falls back to default', () => {
      const w = make({ density: 'huge' as never })
      expect(w.classes()).toContain('gap-0.5')
      expect(item(w, 'src').classes()).toContain('py-1')
    })
    it('compact keeps behaviour (selection, keyboard)', async () => {
      const w = make({ density: 'compact' })
      await item(w, 'src').trigger('click')
      expect(ids(w)).toContain('a')
      await item(w, 'src').trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(item(w, 'a').element)
    })
    it('class overrides the density classes', () => {
      expect(make({ density: 'compact', class: 'text-base gap-2' }).classes()).toEqual(expect.arrayContaining(['text-base', 'gap-2']))
    })
    it('exports helpers', () => {
      expect(TREE_DENSITIES).toEqual(['default', 'compact'])
      expect(treeVariants({ density: 'compact' })).toContain('text-xs')
      expect(treeItemVariants({ density: 'compact' })).toContain('py-0.5')
      expect(treeMetrics.compact.step).toBe(0.75)
    })
  })

  describe('checkboxes', () => {
    const box = (w: ReturnType<typeof mount>, id: string) => item(w, id).find('[data-slot="tree-checkbox"]')

    it('renders an aria-hidden visual checkbox per node and aria-checked on the treeitem', () => {
      const w = make({ checkboxes: true, expanded: ['src'] })
      expect(w.findAll('[data-slot="tree-checkbox"]')).toHaveLength(ids(w).length)
      expect(box(w, 'a').attributes('aria-hidden')).toBe('true')
      expect(box(w, 'a').attributes('data-state')).toBe('unchecked')
      expect(item(w, 'a').attributes('aria-checked')).toBe('false')
      expect(item(w, 'a').attributes('aria-selected')).toBe('false')
    })

    it('uncontrolled: clicking a checkbox toggles a leaf without selecting or expanding', async () => {
      const w = make({ checkboxes: true, expanded: ['src'] })
      await box(w, 'a').trigger('click')
      expect(w.emitted('update:checked')?.[0]).toEqual([['a']])
      expect(box(w, 'a').attributes('data-state')).toBe('checked')
      expect(item(w, 'a').attributes('aria-checked')).toBe('true')
      expect(box(w, 'a').find('svg').exists()).toBe(true)
      expect(w.emitted('update:selected')).toBeUndefined()
      await box(w, 'a').trigger('click')
      expect(w.emitted('update:checked')?.[1]).toEqual([[]])
      expect(box(w, 'a').find('svg').exists()).toBe(false)
    })

    it('branch shows indeterminate when some leaves are checked and mixed on aria-checked', () => {
      const w = make({ checkboxes: true, checked: ['a'] })
      expect(box(w, 'src').attributes('data-state')).toBe('indeterminate')
      expect(item(w, 'src').attributes('aria-checked')).toBe('mixed')
      expect(box(w, 'src').find('svg').exists()).toBe(true)
      expect(box(w, 'docs').attributes('data-state')).toBe('unchecked')
    })

    it('toggling a branch checks all leaves (even in collapsed subtrees), then clears them', async () => {
      const w = make({ checkboxes: true })
      await box(w, 'src').trigger('click')
      expect(new Set(w.emitted('update:checked')![0]![0] as string[])).toEqual(new Set(['a', 'b']))
      expect(box(w, 'src').attributes('data-state')).toBe('checked')
      expect(ids(w)).toEqual(['src', 'docs', 'pkg'])
      await box(w, 'src').trigger('click')
      expect(w.emitted('update:checked')![1]![0]).toEqual([])
    })

    it('an indeterminate branch completes to fully checked on click', async () => {
      const w = make({ checkboxes: true, checked: ['a'] })
      await box(w, 'src').trigger('click')
      expect(new Set(w.emitted('update:checked')![0]![0] as string[])).toEqual(new Set(['a', 'b']))
    })

    it('is controlled via v-model:checked', async () => {
      const w = make({ checkboxes: true, checked: ['pkg'], expanded: ['src'] })
      expect(box(w, 'pkg').attributes('data-state')).toBe('checked')
      await w.setProps({ checked: ['a', 'b'] })
      expect(box(w, 'src').attributes('data-state')).toBe('checked')
      expect(box(w, 'pkg').attributes('data-state')).toBe('unchecked')
    })

    it('Space toggles the checkbox (not expansion); Enter still activates', async () => {
      const w = make({ checkboxes: true })
      await item(w, 'pkg').trigger('keydown', { key: ' ' })
      expect(w.emitted('update:checked')?.[0]).toEqual([['pkg']])
      expect(w.emitted('update:selected')).toBeUndefined()
      await item(w, 'src').trigger('keydown', { key: ' ' })
      expect(ids(w)).toEqual(['src', 'docs', 'pkg'])
      await item(w, 'src').trigger('keydown', { key: 'Enter' })
      expect(ids(w)).toContain('a')
      expect(w.emitted('update:selected')?.[0]).toEqual(['src'])
    })

    it('without checkboxes Space still selects and toggles, and checked is inert', async () => {
      const w = make({ checked: ['pkg'] })
      await item(w, 'src').trigger('keydown', { key: ' ' })
      expect(ids(w)).toContain('a')
      expect(w.emitted('update:checked')).toBeUndefined()
      expect(item(w, 'pkg').attributes('aria-checked')).toBeUndefined()
    })

    it('disabled nodes cannot be checked; disabled leaves are skipped by their branch', async () => {
      const data: TreeItem[] = [{ id: 'g', label: 'g', children: [{ id: 'x', label: 'x' }, { id: 'y', label: 'y', disabled: true }] }, { id: 'd', label: 'd', disabled: true }]
      const w = make({ checkboxes: true, items: data })
      await box(w, 'd').trigger('click')
      expect(w.emitted('update:checked')).toBeUndefined()
      await box(w, 'g').trigger('click')
      expect(w.emitted('update:checked')![0]![0]).toEqual(['x', 'y'])
    })

    it('unknown / non-array checked values are ignored', () => {
      const w = make({ checkboxes: true, checked: ['ghost'] })
      expect(w.findAll('[data-state="checked"]')).toHaveLength(0)
      const bad = make({ checkboxes: true, checked: 'a' as never })
      expect(bad.findAll('[data-state="checked"]')).toHaveLength(0)
    })

    it('checkbox classes per state and density; compact uses a smaller box', () => {
      expect(treeCheckboxVariants({ state: 'checked' })).toContain('bg-primary')
      expect(treeCheckboxVariants({ state: 'unchecked' })).toContain('border-input')
      const w = make({ checkboxes: true, density: 'compact', checked: ['pkg'] })
      expect(box(w, 'pkg').classes()).toEqual(expect.arrayContaining(['size-3.5', 'bg-primary']))
    })

    it('works with a custom item slot and empty items', () => {
      const w = make({ checkboxes: true }, { slots: { item: '<template #item="{ item: i }"><b class="x">{{ i.label }}</b></template>' } })
      expect(w.find('.x').exists()).toBe(true)
      expect(box(w, 'src').exists()).toBe(true)
      expect(ids(make({ checkboxes: true, items: [] }))).toEqual([])
    })
  })

  describe('connector lines', () => {
    it('renders vertical rules and elbows for nested rows only', () => {
      const w = make({ lines: true, expanded: ['src', 'lib'] })
      expect(w.classes()).toContain('gap-0')
      expect(w.classes()).not.toContain('gap-0.5')
      expect(item(w, 'src').classes()).toContain('relative')
      expect(item(w, 'src').find('[data-slot="tree-guide"]').exists()).toBe(false)
      expect(item(w, 'src').find('[data-slot="tree-elbow"]').exists()).toBe(false)
      const a = item(w, 'a')
      expect(a.findAll('[data-slot="tree-guide"]')).toHaveLength(1)
      expect(a.find('[data-slot="tree-guide"]').classes()).toContain('bottom-0')
      expect(a.find('[data-slot="tree-elbow"]').exists()).toBe(true)
      expect(a.find('[data-slot="tree-guide"]').attributes('aria-hidden')).toBe('true')
    })

    it('the last child ends its rule at mid-row (elbow); nested rules continue only through non-last parents', () => {
      const w = make({ lines: true, expanded: ['src', 'lib'] })
      expect(item(w, 'lib').find('[data-slot="tree-guide"]').classes()).toContain('h-1/2')
      expect(item(w, 'b').findAll('[data-slot="tree-guide"]')).toHaveLength(1)
      expect(item(w, 'b').find('[data-slot="tree-guide"]').classes()).toContain('h-1/2')
    })

    it('positions rules from the toggle centre using logical (RTL-safe) offsets', () => {
      const w = make({ lines: true, expanded: ['src'] })
      expect(item(w, 'a').find('[data-slot="tree-guide"]').attributes('style')).toContain('inset-inline-start: 0.75rem')
      expect(item(w, 'a').find('[data-slot="tree-elbow"]').attributes('style')).toContain('width: 0.5rem')
      const c = make({ lines: true, density: 'compact', expanded: ['src'] })
      expect(item(c, 'a').find('[data-slot="tree-guide"]').attributes('style')).toContain('inset-inline-start: 0.6875rem')
    })

    it('lines combine with checkboxes and compact', () => {
      const w = make({ lines: true, checkboxes: true, density: 'compact', expanded: ['src'] })
      expect(item(w, 'a').find('[data-slot="tree-checkbox"]').exists()).toBe(true)
      expect(item(w, 'a').find('[data-slot="tree-guide"]').exists()).toBe(true)
    })

    it('no guides when lines is off, and collapsing removes the child rules', async () => {
      const w = make({ lines: true, expanded: ['src'] })
      expect(w.findAll('[data-slot="tree-guide"]').length).toBeGreaterThan(0)
      await w.setProps({ expanded: [] })
      expect(w.findAll('[data-slot="tree-guide"]')).toHaveLength(0)
      expect(make({ expanded: ['src'] }).findAll('[data-slot="tree-guide"]')).toHaveLength(0)
    })

    it('rules do not break keyboard navigation or aria', async () => {
      const w = make({ lines: true, expanded: ['src'] })
      await item(w, 'src').trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(item(w, 'a').element)
      expect(item(w, 'a').attributes('aria-level')).toBe('2')
    })
  })

  describe('accessibility', () => {
    it('can be named with `label`', () => {
      expect(make({ label: 'Project files' }).attributes('aria-label')).toBe('Project files')
      expect(make().attributes('aria-label')).toBeUndefined()
    })

    it('the selected row gets a forced-colors outline and the chevron respects reduced motion', () => {
      const w = make({ selected: 'src', expanded: ['src'] })
      expect(item(w, 'src').classes()).toContain('forced-colors:outline-2')
      expect(item(w, 'src').find('[data-slot="tree-toggle"] svg').classes()).toContain('motion-reduce:transition-none')
    })

    it('uses logical end padding', () => {
      expect(item(make(), 'src').classes()).toContain('pe-2')
      expect(item(make(), 'src').classes()).not.toContain('pr-2')
    })
  })
})
