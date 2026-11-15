import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import Slider from './Slider.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('dir')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Mounts the slider inside a plain wrapper so the ancestor direction can be set. */
async function make(props: Record<string, unknown> = {}, ancestorDir?: string) {
  const attrs = ancestorDir ? { dir: ancestorDir } : {}
  wrapper = mount(
    defineComponent({ render: () => h('div', { id: 'holder', ...attrs }, [h(Slider, { modelValue: [30], 'aria-label': 'Sample level', ...props })]) }),
    { attachTo: document.body },
  ) as unknown as VueWrapper
  await nextTick()
  await nextTick()
  return wrapper
}
const root = (w: VueWrapper) => w.find('[data-slot="slider"]')
const thumbEls = (w: VueWrapper) => w.findAll('[role=slider]')
const range = (w: VueWrapper) => w.find('[data-slot="slider-range"]')
const marks = (w: VueWrapper) => w.findAll('[data-slot="slider-mark"]').map((m) => m.attributes('style'))
const edge = (w: VueWrapper, i = 0) => thumbEls(w)[i]!.attributes('style')!
const press = async (el: Element, key: string) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await nextTick()
}

describe('Slider direction (dir)', () => {
  describe('left to right (unchanged)', () => {
    it('with no direction anywhere the slider runs from the left', async () => {
      const w = await make({ marks: [0, 25] })
      expect(root(w).attributes('dir')).toBe('ltr')
      expect(edge(w)).toContain('left: calc(30%')
      expect(range(w).attributes('style')).toContain('left: 0%')
      expect(range(w).attributes('style')).toContain('right: 70%')
      expect(marks(w)).toEqual(['left: 0%;', 'left: 25%;'])
    })

    it('ArrowRight raises and ArrowLeft lowers the value', async () => {
      const w = await make()
      await press(thumbEls(w)[0]!.element, 'ArrowRight')
      await press(thumbEls(w)[0]!.element, 'ArrowLeft')
      await press(thumbEls(w)[0]!.element, 'ArrowLeft')
      expect(w.findComponent(Slider).emitted('update:modelValue')).toEqual([[[31]], [[30]], [[29]]])
    })
  })

  describe('right to left from the ancestor', () => {
    it('an ancestor with dir="rtl" puts the minimum at the right edge after mount', async () => {
      const w = await make({ marks: [0, 25] }, 'rtl')
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(edge(w)).toContain('right: calc(30%')
      expect(edge(w)).not.toContain('left:')
    })

    it('the fill grows from the right: its own edges are the same percentages, anchored the other way round', async () => {
      const w = await make({ modelValue: [30, 70] }, 'rtl')
      expect(range(w).attributes('style')).toContain('right: 30%')
      expect(range(w).attributes('style')).toContain('left: 30%')
      const single = await make({ modelValue: [30] }, 'rtl')
      expect(range(single).attributes('style')).toContain('right: 0%')
      expect(range(single).attributes('style')).toContain('left: 70%')
    })

    it('marks mirror: a mark at 25% sits 75% from the left edge', async () => {
      const w = await make({ marks: [0, 25, 100] }, 'rtl')
      expect(marks(w)).toEqual(['left: 100%;', 'left: 75%;', 'left: 0%;'])
    })

    it('marks line up with the thumb: a thumb on a mark and the mark share the same distance from the start edge', async () => {
      const w = await make({ modelValue: [25], marks: [25] }, 'rtl')
      expect(edge(w)).toContain('right: calc(25%')
      expect(marks(w)).toEqual(['left: 75%;'])
    })

    it('ArrowLeft raises the value and ArrowRight lowers it (the arrows follow the thumb on screen)', async () => {
      const w = await make({}, 'rtl')
      const t = thumbEls(w)[0]!.element
      await press(t, 'ArrowLeft')
      await press(t, 'ArrowRight')
      await press(t, 'ArrowRight')
      expect(w.findComponent(Slider).emitted('update:modelValue')).toEqual([[[31]], [[30]], [[29]]])
    })

    it('ArrowUp and ArrowDown, Home, End and PageUp keep their meaning', async () => {
      const w = await make({ modelValue: [50] }, 'rtl')
      const t = () => thumbEls(w)[0]!.element
      await press(t(), 'ArrowUp')
      await press(t(), 'End')
      await press(t(), 'Home')
      await press(t(), 'PageUp')
      expect(w.findComponent(Slider).emitted('update:modelValue')).toEqual([[[51]], [[100]], [[0]], [[10]]])
    })

    it('a range keeps its thumbs in value order and the value bubbles show the same numbers', async () => {
      const w = await make({ modelValue: [20, 80], showValue: true }, 'rtl')
      expect(thumbEls(w).map((t) => t.attributes('aria-valuenow'))).toEqual(['20', '80'])
      expect(edge(w, 0)).toContain('right: calc(20%')
      expect(edge(w, 1)).toContain('right: calc(80%')
      expect(w.findAll('[data-slot="slider-value"]').map((b) => b.text())).toEqual(['20', '80'])
    })

    it('inverted flips an rtl slider back to the left', async () => {
      const w = await make({ marks: [0, 25], inverted: true }, 'rtl')
      expect(edge(w)).toContain('left: calc(30%')
      expect(marks(w)).toEqual(['left: 0%;', 'left: 25%;'])
      await press(thumbEls(w)[0]!.element, 'ArrowRight')
      expect(w.findComponent(Slider).emitted('update:modelValue')).toEqual([[[31]]])
    })

    it('inverted in ltr still mirrors the marks the way it did before', async () => {
      const w = await make({ marks: [0, 25], inverted: true })
      expect(marks(w)).toEqual(['left: 100%;', 'left: 75%;'])
    })

    it('a vertical slider keeps bottom-based marks and mirrors only the sides of the bubble and marks', async () => {
      const w = await make({ orientation: 'vertical', marks: [0, 25], showValue: true }, 'rtl')
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(marks(w)).toEqual(['bottom: 0%;', 'bottom: 25%;'])
      expect(root(w).classes()).toEqual(expect.arrayContaining(['ps-12', 'pe-12']))
    })

    it('a disabled rtl slider ignores the keyboard', async () => {
      const w = await make({ disabled: true }, 'rtl')
      await press(thumbEls(w)[0]!.element, 'ArrowLeft')
      expect(w.findComponent(Slider).emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('the dir prop', () => {
    it('dir="rtl" works on a left-to-right page', async () => {
      const w = await make({ dir: 'rtl', marks: [25] })
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(edge(w)).toContain('right: calc(30%')
      expect(marks(w)).toEqual(['left: 75%;'])
    })

    it('dir="ltr" wins over a right-to-left ancestor', async () => {
      const w = await make({ dir: 'ltr', marks: [25] }, 'rtl')
      expect(root(w).attributes('dir')).toBe('ltr')
      expect(edge(w)).toContain('left: calc(30%')
      expect(marks(w)).toEqual(['left: 25%;'])
    })

    it('an unknown value is ignored and the ancestor decides', async () => {
      const w = await make({ dir: 'sideways' as never }, 'rtl')
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(edge(w)).toContain('right: calc(30%')
    })

    it('an explicit direction is used on the very first render, with no ancestor lookup needed', () => {
      wrapper = mount(Slider, { props: { modelValue: [30], dir: 'rtl', 'aria-label': 'Sample level' } as never })
      expect(wrapper.attributes('dir')).toBe('rtl')
    })
  })

  describe('the document direction', () => {
    it('falls back to the document dir when no ancestor sets one', async () => {
      document.documentElement.setAttribute('dir', 'rtl')
      const w = await make({ marks: [25] })
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(marks(w)).toEqual(['left: 75%;'])
    })

    it('a nearer ltr region wins over an rtl document', async () => {
      document.documentElement.setAttribute('dir', 'rtl')
      const w = await make({ marks: [25] }, 'ltr')
      expect(root(w).attributes('dir')).toBe('ltr')
      expect(marks(w)).toEqual(['left: 25%;'])
    })

    it('follows a runtime switch of the ancestor direction and back', async () => {
      const w = await make({ marks: [25] }, 'ltr')
      expect(marks(w)).toEqual(['left: 25%;'])
      document.getElementById('holder')!.setAttribute('dir', 'rtl')
      await new Promise((r) => setTimeout(r, 0))
      await nextTick()
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(marks(w)).toEqual(['left: 75%;'])
      document.getElementById('holder')!.setAttribute('dir', 'ltr')
      await new Promise((r) => setTimeout(r, 0))
      await nextTick()
      expect(marks(w)).toEqual(['left: 25%;'])
    })

    it('follows a runtime switch of the document direction', async () => {
      const w = await make({ marks: [25] })
      document.documentElement.setAttribute('dir', 'rtl')
      await new Promise((r) => setTimeout(r, 0))
      await nextTick()
      expect(root(w).attributes('dir')).toBe('rtl')
    })

    it('stops watching on unmount', async () => {
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
      const w = await make({}, 'rtl')
      w.unmount()
      wrapper = undefined
      expect(disconnect).toHaveBeenCalled()
    })

    it('an explicit dir prop never starts an observer-driven change', async () => {
      const w = await make({ dir: 'rtl' })
      document.documentElement.setAttribute('dir', 'ltr')
      await new Promise((r) => setTimeout(r, 0))
      await nextTick()
      expect(root(w).attributes('dir')).toBe('rtl')
    })
  })

  describe('environments without the lookup', () => {
    it('a detached slider (no parent element) stays left to right and does not throw', async () => {
      wrapper = mount(Slider, { props: { modelValue: [30], 'aria-label': 'Sample level', marks: [25] } as never })
      await nextTick()
      expect(wrapper.attributes('dir')).toBe('ltr')
      expect(wrapper.findAll('[data-slot="slider-mark"]')[0]!.attributes('style')).toBe('left: 25%;')
    })

    it('without MutationObserver the direction is still read once', async () => {
      vi.stubGlobal('MutationObserver', undefined)
      const w = await make({ marks: [25] }, 'rtl')
      expect(root(w).attributes('dir')).toBe('rtl')
      expect(marks(w)).toEqual(['left: 75%;'])
    })
  })

  describe('a11y and attributes', () => {
    it('does not change names, roles or aria values in rtl', async () => {
      const w = await make({ modelValue: [40], min: 10, max: 90 }, 'rtl')
      const t = thumbEls(w)[0]!
      expect(t.attributes('aria-label')).toBe('Sample level')
      expect(t.attributes('aria-valuenow')).toBe('40')
      expect(t.attributes('aria-valuemin')).toBe('10')
      expect(t.attributes('aria-valuemax')).toBe('90')
      expect(t.attributes('aria-orientation')).toBe('horizontal')
    })

    it('marks stay decorative and the value bubble stays aria-hidden in rtl', async () => {
      const w = await make({ marks: [0, 50], showValue: true }, 'rtl')
      expect(w.find('[data-slot="slider-marks"]').attributes('aria-hidden')).toBe('true')
      expect(w.find('[data-slot="slider-value"]').attributes('aria-hidden')).toBe('true')
    })

    it('hostile right-to-left labels are rendered as text', async () => {
      const w = await make({ marks: [{ value: 50, label: '<b>منخفض</b> ‏עברית' }] }, 'rtl')
      expect(w.find('[data-slot="slider-mark-label"]').text()).toBe('<b>منخفض</b> ‏עברית')
      expect(w.find('[data-slot="slider-mark-label"] b').exists()).toBe(false)
    })

    it('class still wins on the root in rtl', async () => {
      const w = await make({ class: 'mx-9' }, 'rtl')
      expect(root(w).classes()).toContain('mx-9')
    })
  })
})
