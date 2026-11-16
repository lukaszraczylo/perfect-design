import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import ScrollArea from './ScrollArea.vue'
import { scrollBarVariants } from './variants'
import { useFocusableScrollers } from './scrollable'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('ScrollArea RTL', () => {
  it('the vertical bar uses a logical border', () => {
    const classes = scrollBarVariants({ orientation: 'vertical' }).split(' ')
    expect(classes).toContain('border-s')
    expect(classes).not.toContain('border-l')
  })

  it('passes dir to the root', () => {
    const w = mount(ScrollArea, { props: { dir: 'rtl' }, slots: { default: 'x' } })
    expect(w.attributes('dir')).toBe('rtl')
  })
})

describe('useFocusableScrollers', () => {
  it('picks up elements added after mount and stops observing on unmount', async () => {
    const disconnects: number[] = []
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() { disconnects.push(1) } })
    const Comp = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useFocusableScrollers(root)
        return () => h('div', { ref: root, id: 'root' })
      },
    })
    const w = mount(Comp, { attachTo: document.body })
    const pre = document.createElement('pre')
    Object.defineProperty(pre, 'scrollWidth', { value: 500 })
    Object.defineProperty(pre, 'clientWidth', { value: 100 })
    w.element.appendChild(pre)
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(pre.getAttribute('tabindex')).toBe('0')
    w.unmount()
    const late = document.createElement('pre')
    Object.defineProperty(late, 'scrollWidth', { value: 500 })
    Object.defineProperty(late, 'clientWidth', { value: 100 })
    document.body.appendChild(late)
    await new Promise((r) => setTimeout(r, 0))
    expect(late.hasAttribute('tabindex')).toBe(false)
  })
})
