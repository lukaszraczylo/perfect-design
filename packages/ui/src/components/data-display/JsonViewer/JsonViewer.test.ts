import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { JsonViewer, jsonViewerValueVariants, jsonViewerVariants } from './index'
import { JSON_VIEWER_MAX_ROWS, buildRows, collectExpandablePaths, propertyPath, type JsonViewerBuildOptions } from './jsonTree'

const mounted: VueWrapper[] = []
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(JsonViewer, { props: props as never, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}
const rowsOf = (w: VueWrapper) => w.findAll('[data-slot="json-viewer-row"]')
const rowText = (w: VueWrapper, path: string) => w.find(`[data-row-key='${path}']`).text()
const opts = (o: Partial<JsonViewerBuildOptions> = {}): JsonViewerBuildOptions => ({ expanded: null, defaultDepth: 1, maxItems: 100, maxStringLength: 120, extra: new Map(), ...o })

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('JsonViewer', () => {
  describe('good path', () => {
    it('renders a tree with treeitems and aria metadata', () => {
      const w = make({ value: { a: 1, b: [1, 2], c: { d: 'x' } }, defaultExpandDepth: 2 })
      expect(w.attributes('data-slot')).toBe('json-viewer')
      expect(w.attributes('role')).toBe('tree')
      expect(w.attributes('aria-label')).toBe('JSON')
      const items = rowsOf(w)
      expect(items.map((r) => r.attributes('role'))).toEqual(Array(items.length).fill('treeitem'))
      const root = w.find('[data-row-key="$"]')
      expect(root.attributes('aria-level')).toBe('1')
      expect(root.attributes('aria-expanded')).toBe('true')
      const b = w.find('[data-row-key="$.b"]')
      expect(b.attributes('aria-level')).toBe('2')
      expect(b.attributes('aria-posinset')).toBe('2')
      expect(b.attributes('aria-setsize')).toBe('3')
      expect(b.attributes('aria-expanded')).toBe('true')
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBeUndefined()
    })

    it('shows type coloured values with data-type', () => {
      const w = make({ value: { s: 'hi', n: 3, t: true, z: null, u: undefined }, defaultExpandDepth: 1 })
      const type = (p: string) => w.find(`[data-row-key="${p}"] [data-slot="json-viewer-value"]`)
      expect(type('$.s').attributes('data-type')).toBe('string')
      expect(type('$.s').text()).toBe('"hi"')
      expect(type('$.s').classes()).toContain('text-success')
      expect(type('$.n').classes()).toContain('text-info')
      expect(type('$.t').classes()).toContain('text-primary')
      expect(type('$.z').text()).toBe('null')
      expect(type('$.u').text()).toBe('undefined')
    })

    it('summarises collapsed containers', () => {
      const w = make({ value: { arr: [1, 2, 3], obj: { a: 1 }, empty: {}, none: [] } })
      expect(rowText(w, '$.arr')).toContain('[3]')
      expect(rowText(w, '$.obj')).toContain('{1}')
      expect(w.find('[data-row-key="$.arr"]').attributes('aria-expanded')).toBe('false')
      expect(w.find('[data-row-key="$.empty"]').attributes('aria-expanded')).toBeUndefined()
      expect(rowText(w, '$.none')).toContain('[0]')
    })

    it('defaultExpandDepth controls how deep it opens', () => {
      const value = { a: { b: { c: { d: 1 } } } }
      expect(rowsOf(make({ value, defaultExpandDepth: 0 }))).toHaveLength(1)
      expect(rowsOf(make({ value, defaultExpandDepth: 1 }))).toHaveLength(2)
      expect(rowsOf(make({ value, defaultExpandDepth: 3 }))).toHaveLength(4)
      expect(rowsOf(make({ value, defaultExpandDepth: 99 }))).toHaveLength(5)
    })

    it('toggles on click and emits update:expanded', async () => {
      const w = make({ value: { a: { b: 1 } } })
      expect(rowsOf(w)).toHaveLength(2)
      await w.find('[data-row-key="$.a"]').trigger('click')
      expect(rowsOf(w)).toHaveLength(3)
      expect(w.emitted('update:expanded')!.at(-1)).toEqual([['$', '$.a']])
      await w.find('[data-row-key="$.a"]').trigger('click')
      expect(rowsOf(w)).toHaveLength(2)
      expect(w.emitted('update:expanded')!.at(-1)).toEqual([['$']])
    })

    it('shows the root label and renders primitive roots', () => {
      const w = make({ value: 42, rootLabel: 'answer' })
      expect(rowsOf(w)).toHaveLength(1)
      expect(w.text()).toContain('answer')
      expect(w.text()).toContain('42')
      expect(w.find('[data-slot="json-viewer-toggle"]').text()).toBe('')
    })

    it('updates when the value is replaced', async () => {
      const w = make({ value: { a: 1 } })
      await w.setProps({ value: { a: 1, b: 2 } })
      expect(rowsOf(w)).toHaveLength(3)
    })
  })

  describe('v-model:expanded', () => {
    it('is controlled by the given paths', async () => {
      const w = make({ value: { a: { b: 1 }, c: [1] }, expanded: ['$', '$.c'] })
      expect(w.find('[data-row-key="$.c"]').attributes('aria-expanded')).toBe('true')
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('false')
      expect(w.find('[data-row-key="$.c[0]"]').exists()).toBe(true)
      await w.setProps({ expanded: [] })
      expect(rowsOf(w)).toHaveLength(1)
      expect(w.find('[data-row-key="$"]').attributes('aria-expanded')).toBe('false')
    })

    it('emits a new array when toggled while controlled, keeping other paths', async () => {
      const w = make({ value: { a: { b: 1 }, c: [1] }, expanded: ['$', '$.c'] })
      await w.find('[data-row-key="$.a"]').trigger('click')
      expect(w.emitted('update:expanded')![0]).toEqual([['$', '$.c', '$.a']])
    })

    it('works with a real parent v-model', async () => {
      const open = ref<string[]>(['$'])
      const w = mount({ components: { JsonViewer }, setup: () => ({ open }), template: '<JsonViewer :value="{ a: { b: 1 } }" v-model:expanded="open" />' }, { attachTo: document.body })
      mounted.push(w as unknown as VueWrapper)
      await w.find('[data-row-key="$.a"]').trigger('click')
      expect(open.value).toEqual(['$', '$.a'])
      expect(w.findAll('[data-slot="json-viewer-row"]')).toHaveLength(3)
    })

    it('expandAll / collapseAll via exposed methods', async () => {
      const w = make({ value: { a: { b: { c: 1 } }, d: [1] } })
      ;(w.vm as unknown as { expandAll(): void }).expandAll()
      await nextTick()
      expect(rowsOf(w)).toHaveLength(6)
      ;(w.vm as unknown as { collapseAll(): void }).collapseAll()
      await nextTick()
      expect(rowsOf(w)).toHaveLength(1)
    })
  })

  describe('copy path', () => {
    let writeText: ReturnType<typeof vi.fn>
    beforeEach(() => {
      writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    })

    it('copy button writes the JSON path, shows feedback and emits copy', async () => {
      vi.useFakeTimers()
      const w = make({ value: { users: [{ name: 'a' }] }, defaultExpandDepth: 3 })
      const btn = w.find('[data-row-key="$.users[0].name"] [data-slot="json-viewer-copy"]')
      expect(btn.attributes('aria-label')).toBe('Copy path $.users[0].name')
      await btn.trigger('click')
      await flushPromises()
      expect(writeText).toHaveBeenCalledWith('$.users[0].name')
      expect(w.emitted('copy')).toEqual([[{ path: '$.users[0].name', ok: true }]])
      expect(btn.classes()).toContain('text-success')
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(btn.classes()).not.toContain('text-success')
    })

    it('copy click does not toggle the row', async () => {
      const w = make({ value: { a: { b: 1 } } })
      await w.find('[data-row-key="$.a"] [data-slot="json-viewer-copy"]').trigger('click')
      await flushPromises()
      expect(w.emitted('update:expanded')).toBeUndefined()
    })

    it('reports ok=false when the clipboard rejects', async () => {
      writeText.mockRejectedValue(new Error('denied'))
      const w = make({ value: { a: 1 } })
      await w.find('[data-row-key="$.a"] [data-slot="json-viewer-copy"]').trigger('click')
      await flushPromises()
      expect(w.emitted('copy')).toEqual([[{ path: '$.a', ok: false }]])
      expect(w.find('[data-row-key="$.a"] [data-slot="json-viewer-copy"]').classes()).not.toContain('text-success')
    })

    it('showCopy=false removes the buttons but the c key still copies', async () => {
      const w = make({ value: { a: 1 }, showCopy: false })
      expect(w.find('[data-slot="json-viewer-copy"]').exists()).toBe(false)
      await w.find('[data-row-key="$.a"]').trigger('keydown', { key: 'c' })
      await flushPromises()
      expect(writeText).toHaveBeenCalledWith('$.a')
    })

    it('quotes keys that are not identifiers', async () => {
      const w = make({ value: { 'my key': 1, 'a.b': { c: 2 }, '': 3 }, defaultExpandDepth: 2 })
      expect(w.find('[data-row-key=\'$["my key"]\']').exists()).toBe(true)
      expect(w.find('[data-row-key=\'$["a.b"].c\']').exists()).toBe(true)
      expect(w.find('[data-row-key=\'$[""]\']').exists()).toBe(true)
    })
  })

  describe('keyboard', () => {
    const press = async (w: VueWrapper, path: string, key: string, init: KeyboardEventInit = {}) => {
      const el = w.find(`[data-row-key='${path}']`)
      await el.trigger('keydown', { key, ...init })
      await nextTick()
      await nextTick()
    }
    const active = () => (document.activeElement as HTMLElement | null)?.getAttribute('data-row-key')

    it('roving tabindex: one tab stop, first row by default', () => {
      const w = make({ value: { a: 1, b: 2 } })
      expect(rowsOf(w).map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    })

    it('ArrowDown/ArrowUp/Home/End move focus and clamp at the ends', async () => {
      const w = make({ value: { a: 1, b: 2 } })
      await press(w, '$', 'ArrowDown')
      expect(active()).toBe('$.a')
      expect(w.find('[data-row-key="$.a"]').attributes('tabindex')).toBe('0')
      await press(w, '$.a', 'End')
      expect(active()).toBe('$.b')
      await press(w, '$.b', 'ArrowDown')
      expect(active()).toBe('$.b')
      await press(w, '$.b', 'ArrowUp')
      expect(active()).toBe('$.a')
      await press(w, '$.a', 'Home')
      expect(active()).toBe('$')
      await press(w, '$', 'ArrowUp')
      expect(active()).toBe('$')
    })

    it('ArrowRight expands a closed node, then enters it; ArrowLeft collapses, then goes to parent', async () => {
      const w = make({ value: { a: { b: 1 } } })
      await press(w, '$.a', 'ArrowRight')
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('true')
      await press(w, '$.a', 'ArrowRight')
      expect(active()).toBe('$.a.b')
      await press(w, '$.a.b', 'ArrowRight') // leaf: nothing
      expect(active()).toBe('$.a.b')
      await press(w, '$.a.b', 'ArrowLeft')
      expect(active()).toBe('$.a')
      await press(w, '$.a', 'ArrowLeft')
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('false')
      await press(w, '$', 'ArrowLeft') // collapses root
      expect(rowsOf(w)).toHaveLength(1)
      await press(w, '$', 'ArrowLeft') // collapsed root without parent: no-op
      expect(rowsOf(w)).toHaveLength(1)
    })

    it('Enter and Space toggle containers and prevent default', async () => {
      const w = make({ value: { a: { b: 1 } } })
      const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      w.find('[data-row-key="$.a"]').element.dispatchEvent(e)
      await nextTick()
      expect(e.defaultPrevented).toBe(true)
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('true')
      await press(w, '$.a', ' ')
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('false')
      await press(w, '$', 'Enter')
      expect(rowsOf(w)).toHaveLength(1)
    })

    it('leaves unrelated keys and modified keys alone', async () => {
      const w = make({ value: { a: { b: 1 } } })
      const e = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true })
      w.find('[data-row-key="$.a"]').element.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
      await press(w, '$.a', 'ArrowRight', { ctrlKey: true })
      await press(w, '$.a', 'ArrowRight', { altKey: true })
      await press(w, '$.a', 'ArrowRight', { metaKey: true })
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('false')
    })

    it('ignores keydown from the copy button and from outside any row', async () => {
      const w = make({ value: { a: { b: 1 } } })
      await w.find('[data-row-key="$.a"] [data-slot="json-viewer-copy"]').trigger('keydown', { key: 'Enter' })
      expect(w.find('[data-row-key="$.a"]').attributes('aria-expanded')).toBe('false')
      await w.trigger('keydown', { key: 'ArrowDown' })
      expect(w.emitted('update:expanded')).toBeUndefined()
    })

    it('focus falls back to the first row when the focused row disappears', async () => {
      const w = make({ value: { a: { b: 1 } }, defaultExpandDepth: 2 })
      await press(w, '$', 'End')
      expect(w.find('[data-row-key="$.a.b"]').attributes('tabindex')).toBe('0')
      await w.setProps({ value: { z: 1 } })
      expect(w.find('[data-row-key="$"]').attributes('tabindex')).toBe('0')
    })

    it('focusin on a row updates the tab stop', async () => {
      const w = make({ value: { a: 1, b: 2 } })
      ;(w.find('[data-row-key="$.b"]').element as HTMLElement).focus()
      await nextTick()
      expect(w.find('[data-row-key="$.b"]').attributes('tabindex')).toBe('0')
      expect(w.find('[data-row-key="$"]').attributes('tabindex')).toBe('-1')
    })
  })

  describe('customisation', () => {
    it('merges class last and falls attrs through', () => {
      const w = make({ value: 1, class: 'p-8 custom' }, { 'data-testid': 'jv', 'aria-label': 'Response body' })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('p-8')
      expect(w.classes()).not.toContain('p-2')
      expect(w.attributes('data-testid')).toBe('jv')
      expect(w.attributes('aria-label')).toBe('Response body')
    })

    it.each([
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ] as const)('size %s', (size, cls) => {
      expect(make({ value: 1, size }).classes()).toContain(cls)
    })

    it('variants default and plain', () => {
      expect(make({ value: 1 }).classes()).toContain('border')
      expect(make({ value: 1, variant: 'plain' }).classes()).not.toContain('border')
    })

    it('exports reusable variant helpers', () => {
      expect(jsonViewerVariants({ size: 'lg' })).toContain('text-base')
      expect(jsonViewerValueVariants({ type: 'string' })).toContain('text-success')
      expect(jsonViewerValueVariants()).toContain('text-muted-foreground')
    })
  })

  describe('big and hostile data', () => {
    it('truncates 10 000 items to maxItems with a show-more row', async () => {
      const value = Array.from({ length: 10_000 }, (_, i) => i)
      const w = make({ value })
      expect(w.find('[data-row-key="$"]').attributes('aria-setsize')).toBe('1')
      expect(rowsOf(w)).toHaveLength(1 + 100 + 1)
      const more = w.find('[data-kind="more"]')
      expect(more.text()).toContain('Show 100 more')
      expect(more.text()).toContain('9900 left')
      await more.trigger('click')
      expect(rowsOf(w)).toHaveLength(1 + 200 + 1)
      expect(w.find('[data-kind="more"]').text()).toContain('9800 left')
    })

    it('the last chunk is smaller and the more row disappears when everything is shown', async () => {
      const w = make({ value: Array.from({ length: 130 }, (_, i) => i), maxItems: 100 })
      await w.find('[data-kind="more"]').trigger('click')
      expect(rowsOf(w)).toHaveLength(1 + 130)
      expect(w.find('[data-kind="more"]').exists()).toBe(false)
    })

    it('show-more with the keyboard moves focus to the first revealed item', async () => {
      const w = make({ value: Array.from({ length: 12 }, (_, i) => i), maxItems: 5 })
      const more = w.find('[data-kind="more"]')
      await more.trigger('keydown', { key: 'Enter' })
      await nextTick()
      await nextTick()
      expect((document.activeElement as HTMLElement).getAttribute('data-row-key')).toBe('$[5]')
      expect(w.findAll('[data-kind="more"]')).toHaveLength(1)
    })

    it('show-more by mouse also restores focus', async () => {
      const w = make({ value: Array.from({ length: 12 }, (_, i) => i), maxItems: 5 })
      await w.find('[data-kind="more"]').trigger('click')
      await nextTick()
      await nextTick()
      expect((document.activeElement as HTMLElement).getAttribute('data-row-key')).toBe('$[5]')
    })

    it('ArrowLeft on a more row goes to the owning container; copy key ignores it', async () => {
      const w = make({ value: Array.from({ length: 12 }, (_, i) => i), maxItems: 5 })
      const more = w.find('[data-kind="more"]')
      await more.trigger('keydown', { key: 'c' })
      await more.trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('copy')).toBeUndefined()
      await more.trigger('keydown', { key: 'ArrowLeft' })
      await nextTick()
      expect((document.activeElement as HTMLElement).getAttribute('data-row-key')).toBe('$')
    })

    it('renders circular references with a marker and never loops', () => {
      const a: Record<string, unknown> = { name: 'a' }
      a.self = a
      a.child = { parent: a, list: [a] }
      const w = make({ value: a, defaultExpandDepth: 10 })
      const circ = w.findAll('[data-type="circular"]')
      expect(circ).toHaveLength(3)
      expect(circ[0].text()).toBe('[Circular]')
      expect(w.find('[data-row-key="$.self"]').text()).toContain('→ $')
      expect(w.find('[data-row-key="$.child.list[0]"]').exists()).toBe(true)
      expect(w.find('[data-row-key="$.self"]').attributes('aria-expanded')).toBeUndefined()
    })

    it('a shared (non-circular) reference is rendered twice', () => {
      const shared = { v: 1 }
      const w = make({ value: { x: shared, y: shared }, defaultExpandDepth: 5 })
      expect(w.findAll('[data-type="circular"]')).toHaveLength(0)
      expect(w.find('[data-row-key="$.x.v"]').exists()).toBe(true)
      expect(w.find('[data-row-key="$.y.v"]').exists()).toBe(true)
    })

    it('circular Map/Set/array graphs terminate', () => {
      const m = new Map<unknown, unknown>()
      m.set('me', m)
      const s = new Set<unknown>()
      s.add(s)
      const arr: unknown[] = []
      arr.push(arr)
      const w = make({ value: { m, s, arr }, defaultExpandDepth: 10 })
      expect(w.findAll('[data-type="circular"]')).toHaveLength(3)
    })

    it('expandAll on circular data terminates', async () => {
      const a: Record<string, unknown> = {}
      a.a = a
      a.b = { a }
      const w = make({ value: a })
      ;(w.vm as unknown as { expandAll(): void }).expandAll()
      await nextTick()
      expect(rowsOf(w).length).toBeLessThan(10)
    })

    it('caps default expansion depth at 32 for infinitely deep generated data', () => {
      const gen = (): Record<string, unknown> => ({
        get next() {
          return gen()
        },
      })
      const w = make({ value: gen(), defaultExpandDepth: Infinity })
      expect(rowsOf(w).length).toBeLessThanOrEqual(34)
    })

    it('stops at the global row budget with a notice', () => {
      const w = make({ value: Array.from({ length: JSON_VIEWER_MAX_ROWS + 50 }, (_, i) => i), maxItems: Infinity })
      expect(rowsOf(w)).toHaveLength(JSON_VIEWER_MAX_ROWS + 1)
      expect(w.find('[data-slot="json-viewer-note"]').text()).toContain('truncated')
    }, 30_000) // renders ~JSON_VIEWER_MAX_ROWS rows in jsdom: slow under parallel load or coverage instrumentation

    it('truncates long strings and exposes the full text as a title', () => {
      const long = 'x'.repeat(5000)
      const w = make({ value: { s: long }, maxStringLength: 20 })
      const v = w.find('[data-row-key="$.s"] [data-slot="json-viewer-value"]')
      expect(v.text()).toBe(`"${'x'.repeat(20)}…"`)
      expect(v.attributes('data-truncated')).toBe('true')
      expect(v.attributes('title')!.length).toBeLessThan(1100)
    })

    it('copes with 10 000 nested primitives collapsed quickly', () => {
      const t = performance.now()
      make({ value: { big: Array.from({ length: 10_000 }, (_, i) => ({ i })) }, defaultExpandDepth: 3 })
      expect(performance.now() - t).toBeLessThan(5000)
    })

    it('invalid maxItems / maxStringLength / defaultExpandDepth fall back to sane values', () => {
      const w = make({ value: Array.from({ length: 150 }, () => 'y'.repeat(200)), maxItems: NaN, maxStringLength: -3, defaultExpandDepth: NaN })
      expect(rowsOf(w)).toHaveLength(1 + 100 + 1)
      expect(w.find('[data-row-key="$[0]"] [data-slot="json-viewer-value"]').text().length).toBe(120 + 3)
      expect(make({ value: { a: { b: 1 } }, defaultExpandDepth: -5 }).findAll('[data-slot="json-viewer-row"]')).toHaveLength(1)
    })

    it('unmount cleans up the clipboard timer', async () => {
      vi.useFakeTimers()
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true })
      const w = make({ value: { a: 1 } })
      await w.find('[data-row-key="$.a"] [data-slot="json-viewer-copy"]').trigger('click')
      await flushPromises()
      w.unmount()
      mounted.pop()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('exotic types', () => {
    const typeText = (w: VueWrapper, path: string) => w.find(`[data-row-key='${path}'] [data-slot="json-viewer-value"]`).text()

    it('Date, Invalid Date, bigint, symbol, function, -0, NaN, Infinity, Error', () => {
      const w = make({
        value: {
          d: new Date(Date.UTC(2024, 1, 29, 12)),
          bad: new Date(NaN),
          big: 12345678901234567890n,
          sym: Symbol('tag'),
          fn: function named() {},
          anon: (() => () => {})(),
          neg: -0,
          nan: NaN,
          inf: -Infinity,
          err: new TypeError('boom'),
        },
      })
      expect(typeText(w, '$.d')).toBe('2024-02-29T12:00:00.000Z')
      expect(typeText(w, '$.bad')).toBe('Invalid Date')
      expect(typeText(w, '$.big')).toBe('12345678901234567890n')
      expect(typeText(w, '$.sym')).toBe('Symbol(tag)')
      expect(typeText(w, '$.fn')).toBe('ƒ named()')
      expect(typeText(w, '$.anon')).toBe('ƒ anonymous()')
      expect(typeText(w, '$.neg')).toBe('-0')
      expect(typeText(w, '$.nan')).toBe('NaN')
      expect(typeText(w, '$.inf')).toBe('-Infinity')
      expect(typeText(w, '$.err')).toBe('TypeError: boom')
    })

    it('Map and Set are expandable with typed paths', async () => {
      const obj = { k: 1 }
      const w = make({ value: { m: new Map<unknown, unknown>([['a', 1], [2, 'two'], [obj, 'objkey'], [null, 0], [5n, 1], [Symbol.for('s'), 1], [true, 1], [undefined, 1]]), s: new Set([1, 'x']) }, defaultExpandDepth: 3 })
      expect(rowText(w, '$.m')).toContain('Map(8)')
      expect(w.find('[data-row-key=\'$.m.get("a")\']').exists()).toBe(true)
      expect(w.find("[data-row-key='$.m.get(2)']").exists()).toBe(true)
      expect(w.find("[data-row-key='$.m.get(#2)']").text()).toContain('#2')
      expect(w.find("[data-row-key='$.m.get(null)']").exists()).toBe(true)
      expect(w.find("[data-row-key='$.m.get(5n)']").exists()).toBe(true)
      expect(w.find("[data-row-key='$.m.get(Symbol(s))']").exists()).toBe(true)
      expect(w.find("[data-row-key='$.m.get(true)']").exists()).toBe(true)
      expect(w.find("[data-row-key='$.m.get(undefined)']").exists()).toBe(true)
      expect(rowText(w, '$.s')).toContain('Set(2)')
      expect(typeText(w, '$.s.values()[1]')).toBe('"x"')
    })

    it('typed arrays render as arrays', () => {
      const w = make({ value: { u: new Uint8Array([1, 2, 3]), dv: new DataView(new ArrayBuffer(2)) }, defaultExpandDepth: 2 })
      expect(rowText(w, '$.u')).toContain('Uint8Array [3]')
      expect(typeText(w, '$.u[2]')).toBe('3')
      expect(rowText(w, '$.dv')).toContain('DataView')
    })

    it('class instances show their constructor name; null-prototype objects work', () => {
      class Point {
        x = 1
      }
      const bare = Object.create(null) as Record<string, number>
      bare.z = 1
      const w = make({ value: { p: new Point(), bare } })
      expect(rowText(w, '$.p')).toContain('Point {1}')
      expect(rowText(w, '$.bare')).toContain('{1}')
    })

    it('throwing getters and revoked proxies render as unreadable instead of crashing', () => {
      const bad = {
        get boom(): unknown {
          throw new Error('nope')
        },
        ok: 1,
      }
      const revocable = Proxy.revocable({}, {})
      revocable.revoke()
      const w = make({ value: { bad, dead: revocable.proxy }, defaultExpandDepth: 2 })
      expect(typeText(w, '$.bad.boom')).toBe('[unreadable]')
      expect(typeText(w, '$.bad.ok')).toBe('1')
      expect(typeText(w, '$.dead')).toBe('[unreadable]')
      expect(w.find('[data-row-key="$.dead"] [data-slot="json-viewer-value"]').attributes('data-type')).toBe('unreadable')
    })

    it('handles undefined / missing value, unicode, RTL and empty keys', () => {
      expect(make({}).text()).toContain('undefined')
      const w = make({ value: { 'ключ-🚀': 'שלום' } })
      expect(rowText(w, '$["ключ-🚀"]')).toContain('"שלום"')
    })

    it('sparse arrays render holes as undefined', () => {
      // eslint-disable-next-line no-sparse-arrays
      const w = make({ value: [1, , 3] })
      expect(typeText(w, '$[1]')).toBe('undefined')
    })
  })
})

describe('jsonTree', () => {
  it('propertyPath chooses dot or bracket notation', () => {
    expect(propertyPath('$', 'a')).toBe('$.a')
    expect(propertyPath('$', '$ref')).toBe('$.$ref')
    expect(propertyPath('$', '1a')).toBe('$["1a"]')
    expect(propertyPath('$', 'a"b')).toBe('$["a\\"b"]')
  })

  it('buildRows returns just the root for primitives and honours expanded sets', () => {
    expect(buildRows(null, opts())).toHaveLength(1)
    const rows = buildRows({ a: { b: 1 } }, opts({ expanded: new Set(['$.a']) }))
    expect(rows.map((r) => r.path)).toEqual(['$'])
    expect(buildRows({ a: { b: 1 } }, opts({ expanded: new Set(['$', '$.a']) })).map((r) => r.path)).toEqual(['$', '$.a', '$.a.b'])
  })

  it('collectExpandablePaths respects depth, skips leaves/circular and has ceilings', () => {
    expect(collectExpandablePaths(5, 3)).toEqual([])
    expect(collectExpandablePaths({ a: { b: {} }, c: [] }, 1)).toEqual(['$'])
    expect(collectExpandablePaths({ a: { b: { c: 1 } } }, Infinity)).toEqual(['$', '$.a', '$.a.b'])
    const loop: Record<string, unknown> = {}
    loop.me = loop
    expect(collectExpandablePaths(loop, Infinity)).toEqual(['$'])
    const wide = Array.from({ length: 6000 }, () => ({ x: 1 }))
    expect(collectExpandablePaths(wide, Infinity).length).toBe(5000)
    const gen = (): Record<string, unknown> => ({ get n() { return gen() } })
    expect(collectExpandablePaths(gen(), Infinity).length).toBeLessThanOrEqual(5000)
    const flat = Array.from({ length: 60_000 }, () => [1])
    expect(collectExpandablePaths(flat, Infinity).length).toBeLessThanOrEqual(5000)
  })

  describe('accessibility', () => {
    it('the tree name defaults to JSON and can be set with `label`', () => {
      expect(make({ value: { a: 1 } }).attributes('aria-label')).toBe('JSON')
      expect(make({ value: { a: 1 }, label: 'Response body' }).attributes('aria-label')).toBe('Response body')
    })

    it('copy buttons are 24px targets on a logical edge with the path in their name', () => {
      const btn = make({ value: { a: 1 }, defaultExpandDepth: 2 }).find('[data-slot="json-viewer-copy"]')
      expect(btn.classes()).toEqual(expect.arrayContaining(['size-6', 'ms-auto']))
      expect(btn.attributes('aria-label')).toBe('Copy path $')
    })

    it('symbol and function values use the foreground colour, which always meets contrast', () => {
      expect(jsonViewerValueVariants({ type: 'symbol' })).toContain('text-foreground')
      expect(jsonViewerValueVariants({ type: 'function' })).toContain('text-foreground')
      expect(jsonViewerValueVariants({ type: 'function' })).not.toContain('chart-4')
    })
  })
})
