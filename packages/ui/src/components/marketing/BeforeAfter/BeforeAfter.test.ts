import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BeforeAfter from './BeforeAfter.vue'
import { BEFORE_AFTER_ORIENTATIONS, beforeAfterHandleVariants, beforeAfterLabelVariants, beforeAfterLineVariants, beforeAfterVariants } from './variants'

const base = { before: '/b.jpg', after: '/a.jpg' }
const slider = (w: ReturnType<typeof mount>) => w.find('[role="slider"]')
const now = (w: ReturnType<typeof mount>) => Number(slider(w).attributes('aria-valuenow'))

function mountSized(props: Record<string, unknown> = {}) {
  const w = mount(BeforeAfter, { props: { ...base, ...props }, attachTo: document.body })
  vi.spyOn(w.element, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 200, top: 50, right: 300, bottom: 450, height: 400, x: 100, y: 50, toJSON: () => ({}) })
  return w
}
const ptr = (type: string, clientX: number, extra: Record<string, unknown> = {}, clientY = 0) => {
  const { button = 0, ...rest } = extra
  const e = new MouseEvent(type, { clientX, clientY, bubbles: true, button: button as number })
  Object.assign(e, { pointerId: 1, ...rest })
  return e
}

describe('BeforeAfter', () => {
  describe('good path', () => {
    it('renders both images and an accessible slider at 50', () => {
      const w = mount(BeforeAfter, { props: base })
      expect(w.attributes('data-slot')).toBe('before-after')
      expect(w.find('[data-slot="before-after-before"]').attributes('src')).toBe('/b.jpg')
      expect(w.find('[data-slot="before-after-after"]').attributes('src')).toBe('/a.jpg')
      const s = slider(w)
      expect(s.attributes('tabindex')).toBe('0')
      expect(s.attributes('aria-valuemin')).toBe('0')
      expect(s.attributes('aria-valuemax')).toBe('100')
      expect(s.attributes('aria-valuenow')).toBe('50')
      expect(s.attributes('aria-valuetext')).toBe('50% Before, 50% After')
      expect(s.attributes('aria-label')).toBe('Image comparison slider')
      expect(w.find('[data-slot="before-after-after-layer"]').attributes('style')).toContain('inset(0px 0px 0px 50%)')
    })
    it('arrow keys move by step, shift moves by 5x, emits v-model', async () => {
      const w = mount(BeforeAfter, { props: base })
      await slider(w).trigger('keydown', { key: 'ArrowRight' })
      expect(now(w)).toBe(52)
      await slider(w).trigger('keydown', { key: 'ArrowLeft' })
      await slider(w).trigger('keydown', { key: 'ArrowLeft' })
      expect(now(w)).toBe(48)
      await slider(w).trigger('keydown', { key: 'ArrowUp', shiftKey: true })
      expect(now(w)).toBe(58)
      await slider(w).trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      expect(now(w)).toBe(48)
      await slider(w).trigger('keydown', { key: 'PageUp' })
      expect(now(w)).toBe(58)
      await slider(w).trigger('keydown', { key: 'PageDown' })
      expect(now(w)).toBe(48)
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual([48])
    })
    it('Home and End jump to the ends', async () => {
      const w = mount(BeforeAfter, { props: base })
      await slider(w).trigger('keydown', { key: 'End' })
      expect(now(w)).toBe(100)
      await slider(w).trigger('keydown', { key: 'Home' })
      expect(now(w)).toBe(0)
    })
    it('pointer drag moves the divider relative to the element', async () => {
      const w = mountSized()
      const el = w.element
      el.dispatchEvent(ptr('pointerdown', 150))
      await w.vm.$nextTick()
      expect(now(w)).toBe(25)
      expect(w.attributes('data-dragging')).toBeDefined()
      el.dispatchEvent(ptr('pointermove', 250))
      await w.vm.$nextTick()
      expect(now(w)).toBe(75)
      el.dispatchEvent(ptr('pointerup', 250))
      el.dispatchEvent(ptr('pointermove', 100))
      await w.vm.$nextTick()
      expect(now(w)).toBe(75)
      expect(w.attributes('data-dragging')).toBeUndefined()
      w.unmount()
    })
    it('controlled modelValue drives the position', async () => {
      const w = mount(BeforeAfter, { props: { ...base, modelValue: 30 } })
      expect(now(w)).toBe(30)
      await w.setProps({ modelValue: 80 })
      expect(now(w)).toBe(80)
    })
    it('start sets the initial position; labels customise', () => {
      const w = mount(BeforeAfter, { props: { ...base, start: 20, beforeLabel: 'Old', afterLabel: 'New', label: 'Compare' } })
      expect(now(w)).toBe(20)
      expect(slider(w).attributes('aria-valuetext')).toBe('20% Old, 80% New')
      expect(slider(w).attributes('aria-label')).toBe('Compare')
      expect(w.find('[data-slot="before-after-before"]').attributes('alt')).toBe('Old')
    })
    it('custom alt text wins over labels', () => {
      const w = mount(BeforeAfter, { props: { ...base, beforeAlt: 'Dirty kitchen', afterAlt: 'Clean kitchen' } })
      expect(w.find('[data-slot="before-after-before"]').attributes('alt')).toBe('Dirty kitchen')
      expect(w.find('[data-slot="before-after-after"]').attributes('alt')).toBe('Clean kitchen')
    })
  })
  describe('orientation and labels', () => {
    it('horizontal is the default and reports data-orientation / aria-orientation', () => {
      const w = mount(BeforeAfter, { props: base })
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(slider(w).attributes('aria-orientation')).toBe('horizontal')
      expect(w.classes()).toEqual(expect.arrayContaining(['cursor-ew-resize', 'touch-pan-y']))
      expect(slider(w).attributes('style')).toContain('left: 50%')
      expect(w.find('[data-slot="before-after-before-label"]').classes()).toContain('left-3')
      expect(w.find('[data-slot="before-after-after-label"]').classes()).toContain('right-3')
    })
    it('vertical clips the after layer from the top, moves the handle by top and flips the cursor', () => {
      const w = mount(BeforeAfter, { props: { ...base, orientation: 'vertical', start: 30 } })
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(slider(w).attributes('aria-orientation')).toBe('vertical')
      expect(w.classes()).toEqual(expect.arrayContaining(['cursor-ns-resize', 'touch-pan-x']))
      expect(w.classes()).not.toContain('cursor-ew-resize')
      expect(w.find('[data-slot="before-after-after-layer"]').attributes('style')).toContain('inset(30% 0px 0px')
      expect(slider(w).attributes('style')).toContain('top: 30%')
      expect(slider(w).attributes('style')).not.toContain('left')
      expect(slider(w).classes()).toContain('h-10')
      expect(w.find('[data-slot="before-after-after-label"]').classes()).toContain('bottom-3')
      // knob shows icons (no text glyphs); vertical stacks them
      expect(w.find('[data-slot="before-after-knob"]').text()).toBe('')
      expect(w.find('[data-slot="before-after-knob"]').classes()).toContain('flex-col')
    })
    it('knob is aria-hidden, built from two svg icons, with a forced-colors focus outline and no shadow/blur', () => {
      const w = mount(BeforeAfter, { props: base })
      const knob = w.find('[data-slot="before-after-knob"]')
      expect(knob.attributes('aria-hidden')).toBe('true')
      expect(knob.findAll('svg')).toHaveLength(2)
      expect(knob.text()).toBe('')
      expect(knob.classes()).toContain('forced-colors:group-focus-visible:outline-2')
      expect(w.html()).not.toMatch(/backdrop-blur|shadow-|rounded-xl/)
    })
    it('regression: corner labels are opaque (no backdrop blur / translucency)', () => {
      const w = mount(BeforeAfter, { props: base })
      const cls = w.find('[data-slot="before-after-before-label"]').classes()
      expect(cls).toContain('bg-background')
      expect(cls.join(' ')).not.toMatch(/blur|\/80/)
    })
    it('vertical keyboard: Down/Right move the divider down, Up/Left up; Page and Home/End work', async () => {
      const w = mount(BeforeAfter, { props: { ...base, orientation: 'vertical' } })
      await slider(w).trigger('keydown', { key: 'ArrowDown' })
      expect(now(w)).toBe(52)
      await slider(w).trigger('keydown', { key: 'ArrowRight' })
      expect(now(w)).toBe(54)
      await slider(w).trigger('keydown', { key: 'ArrowUp' })
      await slider(w).trigger('keydown', { key: 'ArrowLeft' })
      expect(now(w)).toBe(50)
      await slider(w).trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      expect(now(w)).toBe(60)
      await slider(w).trigger('keydown', { key: 'PageDown' })
      expect(now(w)).toBe(70)
      await slider(w).trigger('keydown', { key: 'PageUp' })
      expect(now(w)).toBe(60)
      await slider(w).trigger('keydown', { key: 'End' })
      expect(now(w)).toBe(100)
      await slider(w).trigger('keydown', { key: 'Home' })
      expect(now(w)).toBe(0)
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual([0])
    })
    it('vertical pointer drag uses clientY against the element height', async () => {
      const w = mountSized({ orientation: 'vertical' })
      const el = w.element
      el.dispatchEvent(ptr('pointerdown', 9999, {}, 150))
      await w.vm.$nextTick()
      expect(now(w)).toBe(25)
      el.dispatchEvent(ptr('pointermove', 0, {}, 350))
      await w.vm.$nextTick()
      expect(now(w)).toBe(75)
      el.dispatchEvent(ptr('pointermove', 0, {}, -900))
      await w.vm.$nextTick()
      expect(now(w)).toBe(0)
      el.dispatchEvent(ptr('pointerup', 0, {}, 0))
      w.unmount()
    })
    it('vertical pointer is ignored when the element has no height', async () => {
      const w = mount(BeforeAfter, { props: { ...base, orientation: 'vertical' } })
      w.element.dispatchEvent(ptr('pointerdown', 10, {}, 10))
      await w.vm.$nextTick()
      expect(now(w)).toBe(50)
    })
    it('horizontal pointer is unaffected by clientY', async () => {
      const w = mountSized()
      w.element.dispatchEvent(ptr('pointerdown', 150, {}, 9999))
      await w.vm.$nextTick()
      expect(now(w)).toBe(25)
      w.unmount()
    })
    it('showLabels=false hides corner labels but keeps the slider text', () => {
      const w = mount(BeforeAfter, { props: { ...base, showLabels: false } })
      expect(w.find('[data-slot="before-after-before-label"]').exists()).toBe(false)
      expect(w.find('[data-slot="before-after-after-label"]').exists()).toBe(false)
      expect(slider(w).attributes('aria-valuetext')).toBe('50% Before, 50% After')
    })
    it.each(BEFORE_AFTER_ORIENTATIONS)('%s: class merge, attrs, v-model and aspect', async (orientation) => {
      const w = mount(BeforeAfter, { props: { ...base, orientation, class: 'rounded-none custom', aspect: '1 / 1', modelValue: 40 }, attrs: { id: 'o' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('rounded-xl')
      expect(w.attributes('id')).toBe('o')
      expect(w.attributes('style')).toContain('aspect-ratio: 1 / 1')
      await slider(w).trigger('keydown', { key: 'End' })
      expect(w.emitted('update:modelValue')![0]).toEqual([100])
    })
    it('dragging swaps the cursor class for both axes', async () => {
      for (const orientation of BEFORE_AFTER_ORIENTATIONS) {
        const w = mountSized({ orientation })
        w.element.dispatchEvent(ptr('pointerdown', 150, {}, 150))
        await w.vm.$nextTick()
        expect(w.classes()).toContain('cursor-grabbing')
        expect(w.classes()).not.toContain('cursor-ew-resize')
        expect(w.classes()).not.toContain('cursor-ns-resize')
        w.unmount()
      }
    })
    it('exposes class helpers', () => {
      expect(beforeAfterVariants({ orientation: 'vertical' })).toContain('cursor-ns-resize')
      expect(beforeAfterVariants({ dragging: true })).toContain('cursor-grabbing')
      expect(beforeAfterVariants()).toContain('cursor-ew-resize')
      expect(beforeAfterHandleVariants({ orientation: 'vertical' })).toContain('inset-x-0')
      expect(beforeAfterLineVariants({ orientation: 'vertical' })).toContain('h-0.5')
      expect(beforeAfterLabelVariants({ side: 'vertical-after' })).toContain('bottom-3')
      expect(beforeAfterLabelVariants()).toContain('left-3')
    })
    it('unknown orientation falls back to horizontal', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(BeforeAfter, { props: { ...base, orientation: 'diagonal' } })
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(slider(w).attributes('aria-orientation')).toBe('horizontal')
    })
    it('null orientation falls back to horizontal', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(BeforeAfter, { props: { ...base, orientation: null } }).attributes('data-orientation')).toBe('horizontal')
    })
    it('prototype property names are not treated as keys', async () => {
      const w = mount(BeforeAfter, { props: base })
      const ev = new KeyboardEvent('keydown', { key: 'constructor', cancelable: true })
      slider(w).element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      expect(now(w)).toBe(50)
    })
    it('rapid orientation toggling keeps the position and unmounts mid-drag cleanly', async () => {
      const w = mountSized({ start: 35 })
      for (let i = 0; i < 20; i++) await w.setProps({ orientation: BEFORE_AFTER_ORIENTATIONS[i % 2] })
      expect(now(w)).toBe(35)
      w.element.dispatchEvent(ptr('pointerdown', 150, {}, 150))
      w.unmount()
    })
    it('vertical placeholders render without images and with unicode labels', () => {
      const w = mount(BeforeAfter, { props: { orientation: 'vertical', beforeLabel: '前', afterLabel: '後' } })
      expect(w.find('img').exists()).toBe(false)
      expect(slider(w).attributes('aria-valuetext')).toBe('50% 前, 50% 後')
    })
  })
  describe('customisation', () => {
    it('merges class, attrs; aspect applied', () => {
      const w = mount(BeforeAfter, { props: { ...base, class: 'rounded-none custom', aspect: '4 / 3' }, attrs: { id: 'ba' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('rounded-xl')
      expect(w.attributes('id')).toBe('ba')
      expect(w.attributes('style')).toContain('aspect-ratio: 4 / 3')
    })
    it('custom step', async () => {
      const w = mount(BeforeAfter, { props: { ...base, step: 10 } })
      await slider(w).trigger('keydown', { key: 'ArrowRight' })
      expect(now(w)).toBe(60)
    })
  })
  describe('bad path', () => {
    it.each([
      [-50, 0],
      [250, 100],
      [Number.NaN, 50],
      [Infinity, 50],
    ])('modelValue %s is clamped/sanitised to %s', (modelValue, expected) => {
      expect(now(mount(BeforeAfter, { props: { ...base, modelValue } }))).toBe(expected)
    })
    it('invalid start falls back to 50, out-of-range start is clamped', () => {
      expect(now(mount(BeforeAfter, { props: { ...base, start: Number.NaN } }))).toBe(50)
      expect(now(mount(BeforeAfter, { props: { ...base, start: 999 } }))).toBe(100)
    })
    it('keyboard never exceeds 0..100 and does not emit when unchanged', async () => {
      const w = mount(BeforeAfter, { props: { ...base, start: 99 } })
      await slider(w).trigger('keydown', { key: 'ArrowRight', shiftKey: true })
      expect(now(w)).toBe(100)
      const count = w.emitted('update:modelValue')!.length
      await slider(w).trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('update:modelValue')).toHaveLength(count)
    })
    it('ignores unrelated keys without preventing default', async () => {
      const w = mount(BeforeAfter, { props: base })
      const ev = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
      slider(w).element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      expect(now(w)).toBe(50)
    })
    it('missing images render placeholders', () => {
      const w = mount(BeforeAfter)
      expect(w.find('img').exists()).toBe(false)
      expect(w.findAll('[data-slot^="before-after-b"], [data-slot="before-after-after"]').length).toBeGreaterThan(1)
    })
    it('invalid step and aspect fall back', async () => {
      const w = mount(BeforeAfter, { props: { ...base, step: -4, aspect: 'wide' } })
      await slider(w).trigger('keydown', { key: 'ArrowRight' })
      expect(now(w)).toBe(52)
      expect(w.attributes('style')).toContain('16 / 9')
    })
    it('pointer events with zero width or non-primary button are ignored', async () => {
      const w = mount(BeforeAfter, { props: base })
      w.element.dispatchEvent(ptr('pointerdown', 10))
      await w.vm.$nextTick()
      expect(now(w)).toBe(50)
      w.element.dispatchEvent(ptr('pointerup', 10))
      const w2 = mountSized()
      w2.element.dispatchEvent(ptr('pointerdown', 150, { button: 2 }))
      await w2.vm.$nextTick()
      expect(now(w2)).toBe(50)
      w2.unmount()
    })
  })
  describe('edge cases', () => {
    it('pointer outside the element clamps to the ends', async () => {
      const w = mountSized()
      w.element.dispatchEvent(ptr('pointerdown', -500))
      await w.vm.$nextTick()
      expect(now(w)).toBe(0)
      w.element.dispatchEvent(ptr('pointermove', 9000))
      await w.vm.$nextTick()
      expect(now(w)).toBe(100)
      w.element.dispatchEvent(ptr('pointercancel', 0))
      w.unmount()
    })
    it('rapid key presses accumulate', async () => {
      const w = mount(BeforeAfter, { props: base })
      for (let i = 0; i < 100; i++) await slider(w).trigger('keydown', { key: 'ArrowRight' })
      expect(now(w)).toBe(100)
    })
    it('works when pointer capture APIs are unavailable and releases on unmount mid-drag', async () => {
      const w = mountSized()
      const el = w.element
      Object.assign(el, { setPointerCapture: undefined, releasePointerCapture: undefined })
      el.dispatchEvent(ptr('pointerdown', 200))
      await w.vm.$nextTick()
      expect(now(w)).toBe(50)
      w.unmount()
    })
    it('captures and releases the pointer when supported', async () => {
      const w = mountSized()
      const el = w.element as HTMLElement
      const set = vi.fn()
      const rel = vi.fn()
      el.setPointerCapture = set
      el.releasePointerCapture = rel
      el.dispatchEvent(ptr('pointerdown', 200, { pointerId: 7 }))
      el.dispatchEvent(ptr('pointerup', 200))
      expect(set).toHaveBeenCalledWith(7)
      expect(rel).toHaveBeenCalledWith(7)
      w.unmount()
    })
    it('unicode labels', () => {
      const w = mount(BeforeAfter, { props: { ...base, beforeLabel: '前', afterLabel: '後' } })
      expect(slider(w).attributes('aria-valuetext')).toBe('50% 前, 50% 後')
    })
  })
})
