import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { ScrollAreaRoot } from 'reka-ui'
import ScrollArea from './ScrollArea.vue'
import ScrollBar from './ScrollBar.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function mountArea(props: Record<string, unknown> = {}, slot: string | (() => unknown) = 'Content', attrs: Record<string, unknown> = {}) {
  wrapper = mount(ScrollArea, {
    props,
    attrs,
    slots: { default: slot as never },
    attachTo: document.body,
  }) as unknown as VueWrapper
  return wrapper
}

const bars = (w: VueWrapper) => w.findAll('[data-slot="scroll-area-scrollbar"]')

describe('ScrollArea', () => {
  describe('good path', () => {
    it('renders root and viewport with slot content', () => {
      const w = mountArea()
      expect(w.find('[data-slot="scroll-area"]').exists()).toBe(true)
      const vp = w.find('[data-slot="scroll-area-viewport"]')
      expect(vp.exists()).toBe(true)
      expect(vp.text()).toBe('Content')
      expect(vp.attributes('data-reka-scroll-area-viewport')).toBeDefined()
    })

    it('root is relative + overflow-hidden, viewport fills it', () => {
      const w = mountArea()
      expect(w.find('[data-slot="scroll-area"]').classes()).toEqual(expect.arrayContaining(['relative', 'overflow-hidden']))
      expect(w.find('[data-slot="scroll-area-viewport"]').classes()).toContain('size-full')
    })

    it('renders a vertical scrollbar by default (type=always)', () => {
      const w = mountArea({ type: 'always' })
      expect(bars(w)).toHaveLength(1)
      expect(bars(w)[0]!.attributes('data-orientation')).toBe('vertical')
      expect(bars(w)[0]!.classes()).toContain('w-2.5')
      expect(w.find('[data-slot="scroll-area-thumb"]').exists()).toBe(true)
    })

    it('horizontal adds a horizontal bar and a corner', () => {
      const w = mountArea({ type: 'always', horizontal: true })
      expect(bars(w).map((b) => b.attributes('data-orientation')).sort()).toEqual(['horizontal', 'vertical'])
      expect(bars(w).find((b) => b.attributes('data-orientation') === 'horizontal')!.classes()).toContain('h-2.5')
    })

    it('vertical=false with horizontal renders only the horizontal bar', () => {
      const w = mountArea({ type: 'always', vertical: false, horizontal: true })
      expect(bars(w)).toHaveLength(1)
      expect(bars(w)[0]!.attributes('data-orientation')).toBe('horizontal')
    })

    it('vertical=false and horizontal=false renders no bars', () => {
      expect(bars(mountArea({ type: 'always', vertical: false }))).toHaveLength(0)
    })

    it.each(['hover', 'scroll', 'auto', 'always'] as const)('type %s mounts without error', (type) => {
      const w = mountArea({ type })
      expect(w.find('[data-slot="scroll-area"]').exists()).toBe(true)
      expect(w.find('[data-slot="scroll-area-viewport"]').exists()).toBe(true)
    })

    it('hover type hides the bar until hovered', () => {
      expect(bars(mountArea({ type: 'hover' }))).toHaveLength(0)
    })
  })

  describe('customisation', () => {
    it('merges class on root and lets it override', () => {
      const w = mountArea({ class: 'h-48 overflow-auto custom-x' })
      const root = w.find('[data-slot="scroll-area"]')
      expect(root.classes()).toContain('custom-x')
      expect(root.classes()).toContain('h-48')
      expect(root.classes()).toContain('overflow-auto')
      expect(root.classes()).not.toContain('overflow-hidden')
    })

    it('viewportClass lands on the viewport', () => {
      const w = mountArea({ viewportClass: 'max-h-64 p-4' })
      const vp = w.find('[data-slot="scroll-area-viewport"]')
      expect(vp.classes()).toContain('max-h-64')
      expect(vp.classes()).toContain('p-4')
    })

    it('passes attributes through to the root', () => {
      const w = mountArea({}, 'x', { id: 'sa', 'data-test': 'y', 'aria-label': 'Log' })
      const root = w.find('[data-slot="scroll-area"]')
      expect(root.attributes('id')).toBe('sa')
      expect(root.attributes('data-test')).toBe('y')
      expect(root.attributes('aria-label')).toBe('Log')
    })

    it('`as` swaps the root element', () => {
      expect(mountArea({ as: 'section' }).find('[data-slot="scroll-area"]').element.tagName).toBe('SECTION')
    })

    it('scrollHideDelay is accepted', () => {
      expect(mountArea({ scrollHideDelay: 0 }).find('[data-slot="scroll-area"]').exists()).toBe(true)
    })

    it('renders arbitrary slot elements', () => {
      const w = mountArea({}, () => [h('ul', [h('li', 'a'), h('li', 'b')])])
      expect(w.findAll('li')).toHaveLength(2)
    })
  })

  describe('bad path', () => {
    it('unknown type does not throw', () => {
      expect(() => mountArea({ type: 'bogus' })).not.toThrow()
    })

    it('empty slot still renders root and viewport', () => {
      const w = mountArea({}, '')
      expect(w.find('[data-slot="scroll-area-viewport"]').exists()).toBe(true)
      expect(w.find('[data-slot="scroll-area-viewport"]').text()).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles very long content and unicode', () => {
      const w = mountArea({}, 'لا '.repeat(5000) + '日本語')
      expect(w.find('[data-slot="scroll-area-viewport"]').text().endsWith('日本語')).toBe(true)
    })

    it('unmounts cleanly', () => {
      mountArea({ type: 'always', horizontal: true })
      expect(() => wrapper!.unmount()).not.toThrow()
      wrapper = undefined
    })

    it('toggling horizontal at runtime adds and removes the bar', async () => {
      const w = mountArea({ type: 'always' })
      await w.setProps({ horizontal: true })
      expect(bars(w)).toHaveLength(2)
      await w.setProps({ horizontal: false })
      expect(bars(w)).toHaveLength(1)
    })
  })
})

describe('ScrollBar', () => {
  function mountBar(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
    wrapper = mount(
      defineComponent({
        setup: () => () => h(ScrollAreaRoot, { type: 'always' }, { default: () => h(ScrollBar, { forceMount: true, ...props, ...attrs }) }),
      }),
      { attachTo: document.body },
    ) as unknown as VueWrapper
    return wrapper.find('[data-slot="scroll-area-scrollbar"]')
  }

  it('defaults to vertical', () => {
    const bar = mountBar()
    expect(bar.attributes('data-orientation')).toBe('vertical')
    expect(bar.classes()).toContain('w-2.5')
    expect(bar.find('[data-slot="scroll-area-thumb"]').exists()).toBe(true)
  })

  it('horizontal orientation uses horizontal sizing', () => {
    const bar = mountBar({ orientation: 'horizontal' })
    expect(bar.attributes('data-orientation')).toBe('horizontal')
    expect(bar.classes()).toContain('h-2.5')
    expect(bar.classes()).toContain('flex-col')
  })

  it('merges class last', () => {
    const bar = mountBar({ class: 'w-4 custom-x' })
    expect(bar.classes()).toContain('custom-x')
    expect(bar.classes()).toContain('w-4')
    expect(bar.classes()).not.toContain('w-2.5')
  })

  it('passes attributes through', () => {
    expect(mountBar({}, { id: 'bar', 'data-test': 'z' }).attributes('id')).toBe('bar')
  })
})

describe('ScrollArea keyboard access (WCAG 2.1.1)', () => {
  it('the viewport is always a tab stop so overflowing content can be scrolled with the keyboard', () => {
    const w = mountArea()
    expect(w.find('[data-slot="scroll-area-viewport"]').attributes('tabindex')).toBe('0')
  })

  it('label names the viewport as a region', () => {
    const w = mountArea({ label: 'Log' })
    const vp = w.find('[data-slot="scroll-area-viewport"]')
    expect(vp.attributes('role')).toBe('region')
    expect(vp.attributes('aria-label')).toBe('Log')
    expect(vp.classes()).toContain('focus-visible:ring-3')
    expect(vp.classes()).toContain('focus-visible:ring-inset')
  })

  it('without label there is no nameless region', () => {
    const vp = mountArea().find('[data-slot="scroll-area-viewport"]')
    expect(vp.attributes('role')).toBeUndefined()
    expect(vp.attributes('aria-label')).toBeUndefined()
  })
})
