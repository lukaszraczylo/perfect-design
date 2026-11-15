import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import ShowMore from './ShowMore.vue'
import { FakeResizeObserver, fireResize, heights, installLayout, uninstallLayout } from './layout-stub'

const LONG = 'This is sample text used to show a long block. '.repeat(30)
// onMounted measures and sets state, which Vue renders on the next tick. Re-render synchronously so tests can assert right after mounting.
const settle = <T extends { vm: object }>(w: T): T => {
  ;((w.vm as { $: unknown }).$ as { update: () => void }).update()
  return w
}
const mountMore = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  settle(mount(ShowMore, { props, slots: { default: () => h('p', LONG), ...(slots as object) }, attachTo: document.body }))
const toggle = (w: ReturnType<typeof mountMore>) => w.find('[data-slot="show-more-toggle"]')
const content = (w: ReturnType<typeof mountMore>) => w.find('[data-slot="show-more-content"]')

beforeEach(() => installLayout())
afterEach(() => {
  uninstallLayout()
  document.body.innerHTML = ''
})

describe('ShowMore', () => {
  it('renders the content collapsed to three lines, with a toggle when it overflows', async () => {
    const w = mountMore()
    await nextTick()
    expect(w.attributes('data-slot')).toBe('show-more')
    expect(w.element.tagName).toBe('DIV')
    expect(w.attributes('data-state')).toBe('collapsed')
    expect(w.attributes('data-overflowing')).toBe('')
    expect(content(w).classes()).toContain('line-clamp-3')
    expect(content(w).text()).toContain('sample text')
    const t = toggle(w)
    expect(t.exists()).toBe(true)
    expect(t.element.tagName).toBe('BUTTON')
    expect(t.attributes('type')).toBe('button')
    expect(t.text()).toBe('Show more')
    expect(t.attributes('aria-expanded')).toBe('false')
  })

  it('aria-controls points at the content id', () => {
    const w = mountMore()
    const id = content(w).attributes('id')
    expect(id).toBeTruthy()
    expect(toggle(w).attributes('aria-controls')).toBe(id)
    expect(document.getElementById(id!)).toBe(content(w).element)
  })

  it('gives every instance its own content id', () => {
    const w = mount({ components: { ShowMore }, template: '<div><ShowMore><p>a</p></ShowMore><ShowMore><p>b</p></ShowMore></div>' })
    const [a, b] = w.findAll('[data-slot="show-more-content"]')
    expect(a.attributes('id')).toBeTruthy()
    expect(a.attributes('id')).not.toBe(b.attributes('id'))
  })

  it('renders no toggle when the content fits', () => {
    installLayout({ full: 40, visible: 60 })
    const w = mountMore()
    expect(toggle(w).exists()).toBe(false)
    expect(w.attributes('data-overflowing')).toBeUndefined()
    expect(content(w).classes()).toContain('line-clamp-3')
  })

  it('ignores a one pixel rounding difference', () => {
    installLayout({ full: 61, visible: 60 })
    expect(toggle(mountMore()).exists()).toBe(false)
  })

  it('has no toggle in jsdom without layout (all heights 0) and survives', () => {
    installLayout({ full: 0, visible: 0 })
    expect(toggle(mountMore()).exists()).toBe(false)
  })

  describe('toggling', () => {
    it('expands and collapses, uncontrolled', async () => {
      const w = mountMore()
      await toggle(w).trigger('click')
      expect(w.attributes('data-state')).toBe('expanded')
      expect(toggle(w).attributes('aria-expanded')).toBe('true')
      expect(toggle(w).text()).toBe('Show less')
      expect(content(w).classes().some((c) => c.startsWith('line-clamp'))).toBe(false)
      await toggle(w).trigger('click')
      expect(w.attributes('data-state')).toBe('collapsed')
      expect(toggle(w).text()).toBe('Show more')
      expect(content(w).classes()).toContain('line-clamp-3')
      expect(w.emitted('update:expanded')).toEqual([[true], [false]])
    })

    it('keeps the toggle while expanded even though the unclamped content no longer reports overflow', async () => {
      const w = mountMore()
      await toggle(w).trigger('click')
      await flushPromises()
      fireResize()
      await nextTick()
      expect(toggle(w).exists()).toBe(true)
      expect(w.attributes('data-overflowing')).toBe('')
    })

    it('is controlled with v-model:expanded', async () => {
      const w = mountMore({ expanded: false, 'onUpdate:expanded': (v: boolean) => w.setProps({ expanded: v }) })
      await toggle(w).trigger('click')
      expect(w.attributes('data-state')).toBe('expanded')
      await w.setProps({ expanded: false })
      expect(w.attributes('data-state')).toBe('collapsed')
    })

    it('a controlled parent that does not update keeps the state', async () => {
      const w = mountMore({ expanded: false, 'onUpdate:expanded': () => {} })
      await toggle(w).trigger('click')
      expect(w.attributes('data-state')).toBe('collapsed')
      expect(w.emitted('update:expanded')).toEqual([[true]])
    })

    it('starts expanded', async () => {
      const w = mountMore({ expanded: true })
      await nextTick()
      expect(w.attributes('data-state')).toBe('expanded')
      expect(content(w).classes().some((c) => c.startsWith('line-clamp'))).toBe(false)
      // The collapsed height is unknown: the toggle stays so the reader can collapse.
      expect(toggle(w).text()).toBe('Show less')
      await toggle(w).trigger('click')
      expect(w.attributes('data-state')).toBe('collapsed')
      expect(toggle(w).exists()).toBe(true)
    })

    it('starts expanded with content that fits: collapsing removes the toggle', async () => {
      installLayout({ full: 30, visible: 60 })
      const w = mountMore({ expanded: true })
      await nextTick()
      await toggle(w).trigger('click')
      await flushPromises()
      expect(toggle(w).exists()).toBe(false)
    })

    it('rapid toggling ends in the right state', async () => {
      const w = mountMore()
      for (let i = 0; i < 7; i++) await toggle(w).trigger('click')
      expect(w.attributes('data-state')).toBe('expanded')
      expect(w.emitted('update:expanded')).toHaveLength(7)
    })

    it('the toggle is a focusable native button', () => {
      const w = mountMore()
      const el = toggle(w).element as HTMLButtonElement
      el.focus()
      expect(document.activeElement).toBe(el)
      expect(el.disabled).toBe(false)
      expect(toggle(w).attributes('tabindex')).toBeUndefined()
      expect(toggle(w).attributes('role')).toBeUndefined()
    })
  })

  describe('measuring', () => {
    it('observes the content element and disconnects on unmount', () => {
      const w = mountMore()
      expect(FakeResizeObserver.instances).toHaveLength(1)
      expect(FakeResizeObserver.instances[0].observed).toEqual([content(w).element])
      w.unmount()
      expect(FakeResizeObserver.instances[0].disconnected).toBe(true)
    })

    it('shows the toggle after content grows and hides it after content shrinks', async () => {
      installLayout({ full: 40, visible: 60 })
      const w = mountMore()
      expect(toggle(w).exists()).toBe(false)
      heights.full = 300
      fireResize()
      await nextTick()
      expect(toggle(w).exists()).toBe(true)
      expect(w.emitted('overflow')).toEqual([[true]])
      heights.full = 20
      fireResize()
      await nextTick()
      expect(toggle(w).exists()).toBe(false)
      expect(w.emitted('overflow')).toEqual([[true], [false]])
    })

    it('hides the toggle when the expanded content shrinks to the collapsed height', async () => {
      const w = mountMore()
      await toggle(w).trigger('click')
      await flushPromises()
      heights.full = 60
      fireResize()
      await nextTick()
      expect(toggle(w).exists()).toBe(false)
    })

    it('emits overflow once for the first measurement and not for unchanged measurements', async () => {
      const w = mountMore()
      fireResize()
      fireResize()
      await nextTick()
      expect(w.emitted('overflow')).toEqual([[true]])
    })

    it('does not emit overflow when content fits from the start', () => {
      installLayout({ full: 10, visible: 60 })
      const w = mountMore()
      fireResize()
      expect(w.emitted('overflow')).toBeUndefined()
    })

    it('remeasures when lines or maxHeight change', async () => {
      const w = mountMore({ lines: 3 })
      heights.visible = 500
      await w.setProps({ lines: 4 })
      await nextTick()
      expect(content(w).classes()).toContain('line-clamp-4')
      expect(toggle(w).exists()).toBe(false)
      heights.visible = 40
      await w.setProps({ maxHeight: 'sm' })
      await nextTick()
      expect(toggle(w).exists()).toBe(true)
    })

    it('a resize after unmount does nothing', async () => {
      const w = mountMore()
      const [observer] = FakeResizeObserver.instances
      w.unmount()
      expect(() => observer.fire()).not.toThrow()
    })

    it('works without ResizeObserver (older runtime): measures once', () => {
      vi.stubGlobal('ResizeObserver', undefined)
      const w = mountMore()
      expect(toggle(w).exists()).toBe(true)
      expect(() => w.unmount()).not.toThrow()
    })

    it('uses no timers and no window reads in the component source', () => {
      const src = readFileSync(resolve(process.cwd(), 'src/components/primitives/ShowMore/ShowMore.vue'), 'utf8')
      expect(src).not.toMatch(/setTimeout|setInterval|requestAnimationFrame|window\./)
    })

    it('mounts without layout reads before mount (server render safe)', async () => {
      const { renderToString } = await import('vue/server-renderer')
      const { createSSRApp } = await import('vue')
      const html = await renderToString(createSSRApp({ render: () => h(ShowMore, null, { default: () => h('p', LONG) }) }))
      expect(html).toContain('data-slot="show-more"')
      expect(html).not.toContain('show-more-toggle')
      expect(html).toContain('line-clamp-3')
    })
  })

  describe('lines and maxHeight', () => {
    it.each([1, 2, 3, 4, 5, 6])('lines %i uses line-clamp-%i', (n) => {
      expect(content(mountMore({ lines: n })).classes()).toContain(`line-clamp-${n}`)
    })
    it.each([
      [0, 'line-clamp-3'],
      [-4, 'line-clamp-3'],
      [Number.NaN, 'line-clamp-3'],
      [Number.NEGATIVE_INFINITY, 'line-clamp-3'],
      ['4', 'line-clamp-3'],
      [2.9, 'line-clamp-2'],
      [7, 'line-clamp-6'],
      [1000, 'line-clamp-6'],
      [Number.POSITIVE_INFINITY, 'line-clamp-6'],
    ])('lines %s resolves to %s', (lines, cls) => {
      const c = content(mountMore({ lines })).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => x.startsWith('line-clamp'))).toHaveLength(1)
    })
    it.each([
      ['xs', 'max-h-16'],
      ['sm', 'max-h-24'],
      ['md', 'max-h-32'],
      ['lg', 'max-h-48'],
      ['xl', 'max-h-64'],
    ] as const)('maxHeight %s uses %s and wins over lines', (maxHeight, cls) => {
      const w = mountMore({ maxHeight, lines: 2 })
      expect(content(w).classes()).toEqual(expect.arrayContaining([cls, 'overflow-hidden']))
      expect(content(w).classes().some((c) => c.startsWith('line-clamp'))).toBe(false)
      expect(w.attributes('data-clamp')).toBe('height')
    })
    it('unknown maxHeight is ignored', () => {
      const w = mountMore({ maxHeight: 'giant' as never })
      expect(content(w).classes()).toContain('line-clamp-3')
      expect(w.attributes('data-clamp')).toBe('lines')
    })
    it('a height clamp is removed when expanded', async () => {
      const w = mountMore({ maxHeight: 'sm' })
      await toggle(w).trigger('click')
      expect(content(w).classes().some((c) => c.startsWith('max-h'))).toBe(false)
    })
  })

  describe('labels, slots and icon', () => {
    it('custom labels', async () => {
      const w = mountMore({ moreLabel: 'Read the full note', lessLabel: 'Collapse the note' })
      expect(toggle(w).text()).toBe('Read the full note')
      await toggle(w).trigger('click')
      expect(toggle(w).text()).toBe('Collapse the note')
    })
    it('more and less slots replace the labels', async () => {
      const w = mountMore({}, { more: () => 'Open rest', less: () => 'Close rest' })
      expect(toggle(w).text()).toBe('Open rest')
      await toggle(w).trigger('click')
      expect(toggle(w).text()).toBe('Close rest')
    })
    it('chevron is decorative and turns when expanded', async () => {
      const w = mountMore()
      const svg = toggle(w).find('svg')
      expect(svg.exists()).toBe(true)
      expect(svg.attributes('aria-hidden')).toBe('true')
      expect(svg.classes()).not.toContain('rotate-180')
      expect(svg.classes()).toContain('motion-safe:transition-transform')
      await toggle(w).trigger('click')
      expect(toggle(w).find('svg').classes()).toContain('rotate-180')
    })
    it('icon=false removes the chevron', () => {
      expect(toggle(mountMore({ icon: false })).find('svg').exists()).toBe(false)
    })
    it('escapes hostile labels', () => {
      const w = mountMore({ moreLabel: '<img src=x onerror=alert(1)>' })
      expect(toggle(w).find('img').exists()).toBe(false)
      expect(toggle(w).text()).toBe('<img src=x onerror=alert(1)>')
    })
    it('handles RTL and very long labels', () => {
      expect(toggle(mountMore({ moreLabel: 'عرض المزيد' })).text()).toBe('عرض المزيد')
      expect(toggle(mountMore({ moreLabel: 'x'.repeat(3000) })).text()).toHaveLength(3000)
    })
  })

  describe('content edge cases', () => {
    it('empty slot renders without a toggle when nothing overflows', () => {
      installLayout({ full: 0, visible: 0 })
      const w = mountMore({}, { default: () => [] })
      expect(content(w).text()).toBe('')
      expect(toggle(w).exists()).toBe(false)
    })
    it('unbroken hostile text and markup are contained by the content element', () => {
      const w = mountMore({}, { default: () => h('p', `${'a'.repeat(5000)}<script>alert(1)</script>`) })
      expect(content(w).classes()).toContain('break-words')
      expect(content(w).classes()).toContain('min-w-0')
      expect(w.find('script').exists()).toBe(false)
    })
    it('RTL and unicode content', () => {
      const w = mountMore({}, { default: () => h('p', 'مرحبا بالعالم 你好 🙂'.repeat(20)) })
      expect(content(w).text()).toContain('مرحبا بالعالم')
    })
  })

  describe('customisation', () => {
    it('class wins and attrs fall through to the root', () => {
      const w = mountMore({ class: 'w-1/2 gap-6' }, {})
      expect(w.classes()).toEqual(expect.arrayContaining(['w-1/2', 'gap-6']))
      expect(w.classes()).not.toContain('w-full')
      expect(w.classes()).not.toContain('gap-1')
      const attrs = mount(ShowMore, { attrs: { id: 'note', 'aria-label': 'Note' }, slots: { default: () => 'x' } })
      expect(attrs.attributes('id')).toBe('note')
      expect(attrs.attributes('aria-label')).toBe('Note')
    })
    it('renders as another element', () => {
      expect(mountMore({ as: 'section' }).element.tagName).toBe('SECTION')
    })
    it('works in a parent with v-model and a reactive text change', async () => {
      const open = ref(false)
      const w = mount({ components: { ShowMore }, setup: () => ({ open, LONG }), template: '<ShowMore v-model:expanded="open"><p>{{ LONG }}</p></ShowMore>' })
      await nextTick()
      await w.find('[data-slot="show-more-toggle"]').trigger('click')
      expect(open.value).toBe(true)
      open.value = false
      await nextTick()
      expect(w.find('[data-slot="show-more"]').attributes('data-state')).toBe('collapsed')
    })
  })
})
