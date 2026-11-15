import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ResizableHandle, ResizablePanel, ResizablePanels } from './index'
import ResizablePanelsVue from './ResizablePanels.vue'
import ResizablePanelVue from './ResizablePanel.vue'
import ResizableHandleVue from './ResizableHandle.vue'

type P = Record<string, unknown>
type Anything = VueWrapper<any>

let wrappers: Anything[] = []

/** Mount n panels separated by handles. `panelProps[i]` goes to panel i. */
async function build(panelProps: P[] = [{}, {}], rootProps: P = {}, handleProps: P[] = []) {
  const kids = panelProps.flatMap((pp, i) => [
    ...(i > 0 ? [h(ResizableHandle, { ...(handleProps[i - 1] ?? {}) })] : []),
    h(ResizablePanel, pp, { default: () => `Panel ${i}` }),
  ])
  const w = mount(ResizablePanels, { props: rootProps, slots: { default: () => kids }, attachTo: document.body })
  wrappers.push(w)
  await nextTick()
  return w
}

const sizesOf = (w: Anything) => w.findAll('[data-slot="resizable-panel"]').map((p) => Number(p.attributes('data-size')))
const handles = (w: Anything) => w.findAll('[data-slot="resizable-handle"]')

function mockRect(w: Anything, width = 1000, height = 500) {
  vi.spyOn(w.element as HTMLElement, 'getBoundingClientRect').mockReturnValue({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON() {} } as DOMRect)
}

function pointer(type: string, init: PointerEventInit & { clientX?: number; clientY?: number } = {}) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, ...init, clientX: 0, clientY: 0 })
  for (const k of ['clientX', 'clientY'] as const) if (init[k] !== undefined) Object.defineProperty(e, k, { value: init[k] })
  Object.defineProperty(e, 'pointerId', { value: 1 })
  document.dispatchEvent(e)
}

async function drag(w: Anything, handleIdx: number, from: number, to: number, axis: 'clientX' | 'clientY' = 'clientX') {
  await handles(w)[handleIdx].trigger('pointerdown', { [axis]: from, button: 0, pointerId: 1 })
  pointer('pointermove', { [axis]: to })
  await nextTick()
  pointer('pointerup', { [axis]: to })
  await nextTick()
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ResizablePanels: good path', () => {
  it('renders root, panels and a separator with ARIA wiring', async () => {
    const w = await build([{ defaultSize: 30 }, { defaultSize: 70 }])
    expect(w.attributes('data-slot')).toBe('resizable-panels')
    expect(w.attributes('data-orientation')).toBe('horizontal')
    expect(w.classes()).toContain('flex-row')
    expect(sizesOf(w)).toEqual([30, 70])
    const sep = handles(w)[0]
    expect(sep.attributes('role')).toBe('separator')
    expect(sep.attributes('aria-orientation')).toBe('vertical')
    expect(sep.attributes('aria-valuenow')).toBe('30')
    expect(sep.attributes('aria-valuemin')).toBe('0')
    expect(sep.attributes('aria-valuemax')).toBe('100')
    expect(sep.attributes('tabindex')).toBe('0')
    expect(w.findAll('[data-slot="resizable-panel"]')[0].attributes('style')).toContain('flex: 30 1 0px')
  })

  it('vertical orientation flips classes and separator orientation', async () => {
    const w = await build([{}, {}], { orientation: 'vertical' })
    expect(w.classes()).toContain('flex-col')
    expect(handles(w)[0].attributes('aria-orientation')).toBe('horizontal')
    expect(handles(w)[0].classes()).toContain('cursor-row-resize')
  })

  it('unknown orientation falls back to horizontal', async () => {
    const w = await build([{}, {}], { orientation: 'diagonal' })
    expect(w.attributes('data-orientation')).toBe('horizontal')
  })

  it('splits equally by default and 3+ panels sum to 100', async () => {
    const w = await build([{}, {}, {}, {}])
    expect(sizesOf(w)).toEqual([25, 25, 25, 25])
    expect(handles(w)).toHaveLength(3)
    expect(handles(w).map((h) => h.attributes('aria-valuenow'))).toEqual(['25', '25', '25'])
  })

  it('arrow keys resize by step, Shift by largeStep (horizontal)', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    const sep = handles(w)[0]
    await sep.trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w)).toEqual([55, 45])
    await sep.trigger('keydown', { key: 'ArrowLeft' })
    await sep.trigger('keydown', { key: 'ArrowLeft' })
    expect(sizesOf(w)).toEqual([45, 55])
    await sep.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(sizesOf(w)).toEqual([65, 35])
    expect(sep.attributes('aria-valuenow')).toBe('65')
  })

  it('vertical uses ArrowUp / ArrowDown and ignores Left / Right', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { orientation: 'vertical', step: 10 })
    const sep = handles(w)[0]
    await sep.trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w)).toEqual([50, 50])
    await sep.trigger('keydown', { key: 'ArrowDown' })
    expect(sizesOf(w)).toEqual([60, 40])
    await sep.trigger('keydown', { key: 'ArrowUp' })
    await sep.trigger('keydown', { key: 'ArrowUp' })
    expect(sizesOf(w)).toEqual([40, 60])
  })

  it('Home / End jump to the reachable min / max respecting both neighbours', async () => {
    const w = await build([{ minSize: 10, maxSize: 70, defaultSize: 40 }, { minSize: 20, defaultSize: 60 }])
    const sep = handles(w)[0]
    await sep.trigger('keydown', { key: 'End' })
    expect(sizesOf(w)).toEqual([70, 30])
    await sep.trigger('keydown', { key: 'Home' })
    expect(sizesOf(w)).toEqual([10, 90])
    expect(sep.attributes('aria-valuemin')).toBe('10')
    expect(sep.attributes('aria-valuemax')).toBe('70')
  })

  it('does not preventDefault or change anything for unrelated keys', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    const ev = new KeyboardEvent('keydown', { key: 'a', cancelable: true, bubbles: true })
    handles(w)[0].element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(sizesOf(w)).toEqual([50, 50])
  })

  it('pointer drag resizes using percentages of the container and emits events', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w, 1000)
    await handles(w)[0].trigger('pointerdown', { clientX: 500, button: 0, pointerId: 1 })
    expect(w.attributes('data-dragging')).toBe('')
    expect(handles(w)[0].attributes('data-dragging')).toBe('')
    expect(w.emitted('resizeStart')).toHaveLength(1)
    pointer('pointermove', { clientX: 600 })
    await nextTick()
    expect(sizesOf(w)).toEqual([60, 40])
    pointer('pointermove', { clientX: 400 })
    await nextTick()
    expect(sizesOf(w)).toEqual([40, 60])
    pointer('pointerup', { clientX: 400 })
    await nextTick()
    expect(w.attributes('data-dragging')).toBeUndefined()
    expect(w.emitted('resizeEnd')![0][0]).toEqual([40, 60])
    const updates = w.emitted('update:sizes')!
    expect(updates.at(-1)![0]).toEqual([40, 60])
    // after release further moves are ignored
    pointer('pointermove', { clientX: 900 })
    await nextTick()
    expect(sizesOf(w)).toEqual([40, 60])
  })

  it('vertical drag uses clientY and container height', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { orientation: 'vertical' })
    mockRect(w, 1000, 400)
    await drag(w, 0, 200, 240, 'clientY')
    expect(sizesOf(w)).toEqual([60, 40])
  })

  it('subtracts handle thickness from the draggable size', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w, 1010)
    vi.spyOn(handles(w)[0].element, 'getBoundingClientRect').mockReturnValue({ width: 10, height: 10 } as DOMRect)
    await drag(w, 0, 0, 100)
    expect(sizesOf(w)).toEqual([60, 40])
  })

  it('works with the second handle of three panels without touching the first', async () => {
    const w = await build([{ defaultSize: 20 }, { defaultSize: 40 }, { defaultSize: 40 }])
    mockRect(w, 1000)
    await drag(w, 1, 0, 100)
    expect(sizesOf(w)).toEqual([20, 50, 30])
  })

  it('drag respects min/max', async () => {
    const w = await build([{ defaultSize: 50, maxSize: 60 }, { defaultSize: 50, minSize: 20 }])
    mockRect(w, 1000)
    await drag(w, 0, 0, 900)
    expect(sizesOf(w)).toEqual([60, 40])
    await drag(w, 0, 0, -900)
    expect(sizesOf(w)).toEqual([0, 100])
  })

  it('exposes sizes and setSizes (validated)', async () => {
    const w = await build([{}, {}, {}])
    const vm = w.vm as unknown as { sizes: number[]; setSizes(n: number[]): void }
    vm.setSizes([10, 20, 70])
    await nextTick()
    expect(sizesOf(w)).toEqual([10, 20, 70])
    vm.setSizes([NaN, -1, 5])
    await nextTick()
    expect(sizesOf(w).reduce((s, v) => s + v, 0)).toBeCloseTo(100)
    expect(vm.sizes).toHaveLength(3)
  })
})

describe('ResizablePanels: v-model:sizes', () => {
  it('uncontrolled: emits update:sizes on keyboard resize', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:sizes')![0][0]).toEqual([55, 45])
  })

  it('controlled: reflects the prop, emits but does not move on its own', async () => {
    const w = await build([{}, {}], { sizes: [30, 70] })
    expect(sizesOf(w)).toEqual([30, 70])
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:sizes')![0][0]).toEqual([35, 65])
    await w.setProps({ sizes: [60, 40] })
    expect(sizesOf(w)).toEqual([60, 40])
  })

  it('works through a parent v-model', async () => {
    const model = ref<number[]>([25, 75])
    const Host = defineComponent({
      setup: () => () =>
        h(
          ResizablePanels,
          { sizes: model.value, 'onUpdate:sizes': (v: number[]) => (model.value = v) },
          { default: () => [h(ResizablePanel), h(ResizableHandle), h(ResizablePanel)] },
        ),
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w)
    await w.find('[data-slot="resizable-handle"]').trigger('keydown', { key: 'ArrowRight' })
    expect(model.value).toEqual([30, 70])
    expect(w.findAll('[data-slot="resizable-panel"]').map((p) => p.attributes('data-size'))).toEqual(['30', '70'])
  })

  it('normalises and clamps invalid controlled values', async () => {
    expect(sizesOf(await build([{}, {}], { sizes: [30, 30] }))).toEqual([50, 50])
    expect(sizesOf(await build([{}, {}], { sizes: [NaN, -5] }))).toEqual([50, 50])
    expect(sizesOf(await build([{ maxSize: 40 }, {}], { sizes: [90, 10] }))).toEqual([40, 60])
  })

  it('ignores a controlled array whose length does not match the panel count', async () => {
    const w = await build([{ defaultSize: 20 }, { defaultSize: 80 }], { sizes: [10, 10, 80] })
    expect(sizesOf(w)).toEqual([20, 80])
  })
})

describe('ResizablePanels: persistence', () => {
  it('restores from storageKey after mount and saves after keyboard resize', async () => {
    localStorage.setItem('layout-a', JSON.stringify([20, 80]))
    const w = await build([{}, {}], { storageKey: 'layout-a' })
    await nextTick()
    expect(sizesOf(w)).toEqual([20, 80])
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(JSON.parse(localStorage.getItem('layout-a')!)).toEqual([25, 75])
  })

  it('saves on drag end only', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { storageKey: 'layout-b' })
    mockRect(w, 1000)
    await handles(w)[0].trigger('pointerdown', { clientX: 0, button: 0, pointerId: 1 })
    pointer('pointermove', { clientX: 100 })
    await nextTick()
    expect(localStorage.getItem('layout-b')).toBeNull()
    pointer('pointerup')
    await nextTick()
    expect(JSON.parse(localStorage.getItem('layout-b')!)).toEqual([60, 40])
  })

  it.each([
    ['corrupt JSON', '{not json'],
    ['wrong shape', '{"a":1}'],
    ['wrong length', '[10,20,70]'],
    ['invalid numbers', '[null,"x"]'],
    ['negative numbers', '[-10,110]'],
  ])('ignores %s', async (_n, raw) => {
    localStorage.setItem('bad', raw)
    const w = await build([{ defaultSize: 40 }, { defaultSize: 60 }], { storageKey: 'bad' })
    await nextTick()
    expect(sizesOf(w)).toEqual([40, 60])
  })

  it('ignores storage when sizes is controlled', async () => {
    localStorage.setItem('ctl', JSON.stringify([10, 90]))
    const w = await build([{}, {}], { storageKey: 'ctl', sizes: [30, 70] })
    await nextTick()
    expect(sizesOf(w)).toEqual([30, 70])
  })

  it('survives a throwing localStorage (get and set)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { storageKey: 'throws' })
    await nextTick()
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w)).toEqual([55, 45])
  })

  it('survives an unavailable window.localStorage (SSR-like)', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('no storage')
    })
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { storageKey: 'x' })
    await nextTick()
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w)).toEqual([55, 45])
  })

  it('does nothing without storageKey', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    const w = await build([{}, {}])
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('ResizablePanels: customisation', () => {
  it('merges class last and passes attrs through on every part', async () => {
    const w = mount(ResizablePanels, {
      props: { class: 'h-40 gap-2' },
      attrs: { id: 'root', 'data-test': 'x' },
      slots: {
        default: () => [
          h(ResizablePanel, { class: 'p-4 overflow-auto', id: 'p1' }),
          h(ResizableHandle, { class: 'w-4', id: 'h1', 'aria-label': 'Resize sidebar' }),
          h(ResizablePanel, { id: 'p2' }),
        ],
      },
    })
    wrappers.push(w)
    await nextTick()
    expect(w.attributes('id')).toBe('root')
    expect(w.attributes('data-test')).toBe('x')
    expect(w.classes()).toContain('h-40')
    expect(w.classes()).not.toContain('h-full')
    const p1 = w.find('#p1')
    expect(p1.classes()).toEqual(expect.arrayContaining(['p-4', 'overflow-auto']))
    expect(p1.classes()).not.toContain('overflow-hidden')
    const h1 = w.find('#h1')
    expect(h1.classes()).toContain('w-4')
    expect(h1.classes()).not.toContain('w-px')
    expect(h1.attributes('aria-label')).toBe('Resize sidebar')
  })

  it('handle variants: line (default), bar, unknown falls back, grip, custom slot', async () => {
    const w = await build([{}, {}, {}, {}], {}, [{}, { variant: 'bar' }, { variant: 'weird', grip: true }])
    const hs = handles(w)
    expect(hs[0].classes()).toContain('w-px')
    expect(hs[1].classes()).toContain('w-2')
    expect(hs[2].classes()).toContain('w-px')
    expect(hs[2].find('[data-slot="resizable-handle-grip"]').exists()).toBe(true)
    expect(hs[0].find('[data-slot="resizable-handle-grip"]').exists()).toBe(false)
    const v = await build([{}, {}], { orientation: 'vertical' }, [{ variant: 'bar' }])
    expect(handles(v)[0].classes()).toContain('h-2')
    const grip = await build([{}, {}], { orientation: 'vertical' }, [{ grip: true }])
    expect(grip.find('[data-slot="resizable-handle-grip"]').classes()).toContain('w-6')
    const custom = mount(ResizablePanels, {
      slots: { default: () => [h(ResizablePanel), h(ResizableHandle, null, { default: () => h('i', { id: 'custom' }) }), h(ResizablePanel)] },
    })
    wrappers.push(custom)
    await nextTick()
    expect(custom.find('#custom').exists()).toBe(true)
  })

  it('panel and handle files are exposed as default exports of their .vue files', async () => {
    expect(ResizablePanelsVue).toBe(ResizablePanels)
    expect(ResizablePanelVue).toBe(ResizablePanel)
    expect(ResizableHandleVue).toBe(ResizableHandle)
  })

  it('Panel/Handle outside ResizablePanels render without crashing', async () => {
    const p = mount(ResizablePanel, { slots: { default: 'hi' } })
    expect(p.text()).toBe('hi')
    expect(p.attributes('style')).toBeUndefined()
    expect(p.attributes('data-size')).toBeUndefined()
    ;(p.vm as unknown as { collapse(): void; expand(): void; isCollapsed(): boolean }).collapse()
    expect((p.vm as unknown as { isCollapsed(): boolean }).isCollapsed()).toBe(false)
    const hd = mount(ResizableHandle)
    expect(hd.attributes('aria-disabled')).toBe('true')
    expect(hd.attributes('tabindex')).toBe('-1')
    hd.trigger('pointerdown')
    hd.trigger('keydown', { key: 'ArrowLeft' })
    p.unmount()
    hd.unmount()
  })
})

describe('ResizablePanels: bad path', () => {
  it('0 panels renders an empty root', async () => {
    const w = mount(ResizablePanels)
    wrappers.push(w)
    await nextTick()
    expect(w.findAll('[data-slot="resizable-panel"]')).toHaveLength(0)
    expect((w.vm as unknown as { sizes: number[] }).sizes).toEqual([])
  })

  it('1 panel takes 100% and a lone handle is inert', async () => {
    const w = await build([{ defaultSize: 30 }])
    expect(sizesOf(w)).toEqual([100])
    const lone = mount(ResizablePanels, { slots: { default: () => [h(ResizablePanel), h(ResizableHandle)] } })
    wrappers.push(lone)
    await nextTick()
    const sep = lone.find('[data-slot="resizable-handle"]')
    expect(sep.attributes('tabindex')).toBe('-1')
    expect(sep.attributes('aria-disabled')).toBe('true')
    expect(sep.attributes('aria-valuenow')).toBe('0')
    await sep.trigger('keydown', { key: 'ArrowRight' })
    await sep.trigger('pointerdown', { clientX: 0, button: 0 })
    expect(lone.emitted('update:sizes')).toBeUndefined()
    expect(lone.emitted('resizeStart')).toBeUndefined()
  })

  it('a handle before the first / after the last panel is inert', async () => {
    const w = mount(ResizablePanels, {
      slots: { default: () => [h(ResizableHandle, { id: 'first' }), h(ResizablePanel), h(ResizableHandle), h(ResizablePanel), h(ResizableHandle, { id: 'last' })] },
    })
    wrappers.push(w)
    await nextTick()
    expect(w.find('#first').attributes('tabindex')).toBe('-1')
    expect(w.find('#last').attributes('tabindex')).toBe('-1')
    expect(w.findAll('[data-slot="resizable-handle"]')[1].attributes('tabindex')).toBe('0')
  })

  it.each([
    ['NaN', NaN],
    ['negative', -20],
    ['Infinity', Infinity],
    ['over 100', 500],
  ])('invalid defaultSize (%s) still yields a valid layout', async (_n, v) => {
    const out = sizesOf(await build([{ defaultSize: v }, { defaultSize: 30 }, {}]))
    expect(out.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 1)
    expect(out.every((x) => x >= 0 && x <= 100)).toBe(true)
  })

  it('defaults that do not sum to 100 are normalised', async () => {
    expect(sizesOf(await build([{ defaultSize: 10 }, { defaultSize: 10 }]))).toEqual([50, 50])
    const out = sizesOf(await build([{ defaultSize: 80 }, { defaultSize: 80 }, { defaultSize: 80 }]))
    expect(out.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 1)
  })

  it('reversed min/max and impossible constraints do not crash', async () => {
    const out = sizesOf(await build([{ minSize: 70, maxSize: 10 }, { minSize: 70 }]))
    expect(out.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 1)
  })

  it('invalid step falls back to 5 / 20', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { step: NaN, largeStep: -1 })
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w)).toEqual([55, 45])
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(sizesOf(w)).toEqual([75, 25])
  })

  it('disabled root blocks keyboard and pointer, and marks handles', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }], { disabled: true })
    const sep = handles(w)[0]
    expect(sep.attributes('aria-disabled')).toBe('true')
    expect(sep.attributes('tabindex')).toBe('-1')
    expect(sep.attributes('data-disabled')).toBe('')
    await sep.trigger('keydown', { key: 'ArrowRight' })
    await sep.trigger('pointerdown', { clientX: 0, button: 0 })
    expect(sizesOf(w)).toEqual([50, 50])
    expect(w.emitted('resizeStart')).toBeUndefined()
  })

  it('disabled handle blocks only itself', async () => {
    const w = await build([{}, {}, {}], {}, [{ disabled: true }, {}])
    const [a, b] = handles(w)
    await a.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:sizes')).toBeUndefined()
    await b.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:sizes')).toHaveLength(1)
    expect(a.attributes('tabindex')).toBe('-1')
    expect(b.attributes('tabindex')).toBe('0')
  })

  it('non-primary mouse buttons do not start a drag', async () => {
    const w = await build()
    await handles(w)[0].trigger('pointerdown', { clientX: 0, button: 2 })
    expect(w.emitted('resizeStart')).toBeUndefined()
  })

  it('zero-size container (no layout) ignores moves instead of producing NaN', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    await drag(w, 0, 0, 100)
    expect(sizesOf(w)).toEqual([50, 50])
  })

  it('infinite pointer coordinates are ignored', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w)
    await drag(w, 0, 0, Infinity)
    expect(sizesOf(w)).toEqual([50, 50])
  })

  it('guards setPointerCapture / releasePointerCapture throwing', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w)
    const el = handles(w)[0].element
    el.setPointerCapture = () => {
      throw new Error('InvalidPointerId')
    }
    el.releasePointerCapture = () => {
      throw new Error('gone')
    }
    await drag(w, 0, 0, 100)
    expect(sizesOf(w)).toEqual([60, 40])
  })

  it('works when pointer capture APIs are missing entirely', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w)
    const el = handles(w)[0].element as unknown as Record<string, unknown>
    el.setPointerCapture = undefined
    el.releasePointerCapture = undefined
    await drag(w, 0, 0, 100)
    expect(sizesOf(w)).toEqual([60, 40])
  })

  it('second pointerdown while dragging finishes the first drag', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w)
    await handles(w)[0].trigger('pointerdown', { clientX: 0, button: 0, pointerId: 1 })
    await handles(w)[0].trigger('pointerdown', { clientX: 0, button: 0, pointerId: 2 })
    expect(w.emitted('resizeStart')).toHaveLength(2)
    expect(w.emitted('resizeEnd')).toHaveLength(1)
    pointer('pointerup')
    await nextTick()
    expect(w.emitted('resizeEnd')).toHaveLength(2)
  })

  it('pointercancel ends the drag', async () => {
    const w = await build()
    mockRect(w)
    await handles(w)[0].trigger('pointerdown', { clientX: 0, button: 0, pointerId: 1 })
    pointer('pointercancel')
    await nextTick()
    expect(w.attributes('data-dragging')).toBeUndefined()
  })
})

describe('ResizablePanels: collapsible', () => {
  const cols = [{ defaultSize: 30, minSize: 20, collapsible: true }, { defaultSize: 70 }]

  it('drag below half of min collapses; back above restores to min', async () => {
    const w = await build(cols)
    mockRect(w)
    await drag(w, 0, 300, 50)
    expect(sizesOf(w)).toEqual([0, 100])
    expect(w.find('[data-slot="resizable-panel"]').attributes('data-collapsed')).toBe('')
    expect(handles(w)[0].attributes('aria-valuemin')).toBe('0')
    await drag(w, 0, 0, 150)
    expect(sizesOf(w)).toEqual([20, 80])
    expect(w.find('[data-slot="resizable-panel"]').attributes('data-collapsed')).toBeUndefined()
  })

  it('Enter on the handle toggles the collapsible panel and remembers the size', async () => {
    const w = await build(cols)
    const sep = handles(w)[0]
    await sep.trigger('keydown', { key: 'Enter' })
    expect(sizesOf(w)).toEqual([0, 100])
    await sep.trigger('keydown', { key: 'Enter' })
    expect(sizesOf(w)).toEqual([30, 70])
  })

  it('Enter targets the next panel when only that one is collapsible; no-op when neither is', async () => {
    const w = await build([{ defaultSize: 60 }, { defaultSize: 40, minSize: 10, collapsible: true }])
    await handles(w)[0].trigger('keydown', { key: 'Enter' })
    expect(sizesOf(w)).toEqual([100, 0])
    const plain = await build([{}, {}])
    await handles(plain)[0].trigger('keydown', { key: 'Enter' })
    expect(sizesOf(plain)).toEqual([50, 50])
  })

  it('last-panel collapse hands its space to the previous panel; expand falls back to default or 25', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50, minSize: 10, collapsible: true }])
    const vm = w.findComponent(ResizablePanelVue)
    const last = w.findAllComponents(ResizablePanelVue)[1].vm as unknown as { collapse(): void; expand(): void; isCollapsed(): boolean }
    last.collapse()
    await nextTick()
    expect(sizesOf(w)).toEqual([100, 0])
    expect(last.isCollapsed()).toBe(true)
    last.collapse() // already collapsed: no-op
    last.expand()
    await nextTick()
    expect(sizesOf(w)).toEqual([50, 50])
    void vm
    const fresh = await build([{}, { minSize: 10, collapsible: true }])
    const p = fresh.findAllComponents(ResizablePanelVue)[1].vm as unknown as { collapse(): void; expand(): void }
    p.expand() // not collapsed: no-op
    p.collapse()
    await nextTick()
    expect(sizesOf(fresh)).toEqual([100, 0])
  })

  it('emits collapse / expand on the panel', async () => {
    const w = await build(cols)
    const panel = w.findAllComponents(ResizablePanelVue)[0]
    await handles(w)[0].trigger('keydown', { key: 'Enter' })
    expect(panel.emitted('collapse')).toHaveLength(1)
    await handles(w)[0].trigger('keydown', { key: 'Enter' })
    expect(panel.emitted('expand')).toHaveLength(1)
  })

  it('Home collapses a collapsible panel (aria-valuemin = collapsedSize)', async () => {
    const w = await build(cols)
    await handles(w)[0].trigger('keydown', { key: 'Home' })
    expect(sizesOf(w)).toEqual([0, 100])
  })

  it('collapse is impossible with a single panel', async () => {
    const w = await build([{ collapsible: true, minSize: 10 }])
    const p = w.findComponent(ResizablePanelVue).vm as unknown as { collapse(): void }
    p.collapse()
    expect(sizesOf(w)).toEqual([100])
  })

  it('expanding with several open siblings and another collapsed panel keeps the sum at 100', async () => {
    const w = await build([
      { defaultSize: 20, minSize: 10, collapsible: true },
      { defaultSize: 40 },
      { defaultSize: 40, minSize: 10, collapsible: true },
    ])
    const [a, , c] = w.findAllComponents(ResizablePanelVue).map((x) => x.vm as unknown as { collapse(): void; expand(): void })
    a.collapse()
    c.collapse()
    await nextTick()
    expect(sizesOf(w)).toEqual([0, 100, 0])
    a.expand()
    await nextTick()
    const out = sizesOf(w)
    expect(out[2]).toBe(0)
    expect(out.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1)
    expect(out[0]).toBeGreaterThanOrEqual(10)
  })
})

describe('ResizablePanels: no-op and restore paths', () => {
  it('keys that cannot move anything emit nothing', async () => {
    const w = await build([{ defaultSize: 10, minSize: 10 }, { defaultSize: 90 }])
    await handles(w)[0].trigger('keydown', { key: 'ArrowLeft' })
    await handles(w)[0].trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:sizes')).toBeUndefined()
  })

  it('a drag that collapses remembers the previous size for Enter', async () => {
    const w = await build([{ defaultSize: 30, minSize: 20, collapsible: true }, { defaultSize: 70 }])
    mockRect(w)
    await drag(w, 0, 300, 0)
    expect(sizesOf(w)).toEqual([0, 100])
    await handles(w)[0].trigger('keydown', { key: 'Enter' })
    expect(sizesOf(w)).toEqual([30, 70])
  })

  it('a panel that starts collapsed expands to defaultSize-or-25', async () => {
    const a = await build([{ defaultSize: 0, minSize: 10, collapsible: true }, {}])
    expect(sizesOf(a)).toEqual([0, 100])
    await handles(a)[0].trigger('keydown', { key: 'Enter' })
    expect(sizesOf(a)).toEqual([25, 75])
    const b = await build([{ minSize: 10, collapsible: true }, {}], { sizes: [0, 100] })
    await handles(b)[0].trigger('keydown', { key: 'Enter' })
    expect(b.emitted('update:sizes')![0][0]).toEqual([25, 75])
  })
})

describe('ResizablePanels: dynamic panels', () => {
  it('panels added to an initially empty root (no defaults) share equally', async () => {
    const count = ref(0)
    const Host = defineComponent({
      setup: () => () =>
        h(ResizablePanels, {}, { default: () => Array.from({ length: count.value }, (_, i) => [...(i ? [h(ResizableHandle, { key: `h${i}` })] : []), h(ResizablePanel, { key: `p${i}` })]).flat() }),
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w as Anything)
    await nextTick()
    count.value = 2
    await nextTick()
    await nextTick()
    expect(sizesOf(w as Anything)).toEqual([50, 50])
    count.value = 3
    await nextTick()
    await nextTick()
    const out = sizesOf(w as Anything)
    expect(out.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1)
    expect(out[2]).toBeCloseTo(33.33, 1)
  })

  const Dyn = defineComponent({
    props: { count: { type: Number, default: 2 }, rootProps: { type: Object, default: () => ({}) } },
    setup(p) {
      return () =>
        h(
          ResizablePanels,
          p.rootProps,
          {
            default: () =>
              Array.from({ length: p.count }, (_, i) => [
                ...(i > 0 ? [h(ResizableHandle, { key: `h${i}` })] : []),
                h(ResizablePanel, { key: `p${i}`, defaultSize: 50 }),
              ]).flat(),
          },
        )
    },
  })

  it('adding a panel after mount keeps the sum at 100 and the existing ratio', async () => {
    const w = mount(Dyn, { props: { count: 2 }, attachTo: document.body })
    wrappers.push(w)
    await handles(w as Anything)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w as Anything)).toEqual([55, 45])
    await w.setProps({ count: 3 })
    const out = sizesOf(w as Anything)
    expect(out).toHaveLength(3)
    expect(out.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1)
    expect(out[0] / out[1]).toBeCloseTo(55 / 45, 1)
    expect(handles(w as Anything)).toHaveLength(2)
  })

  it('removing a panel redistributes to 100; down to 1 then 0 panels', async () => {
    const w = mount(Dyn, { props: { count: 3 }, attachTo: document.body })
    wrappers.push(w)
    await w.setProps({ count: 2 })
    expect(sizesOf(w as Anything).reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1)
    await w.setProps({ count: 1 })
    expect(sizesOf(w as Anything)).toEqual([100])
    await w.setProps({ count: 0 })
    expect(sizesOf(w as Anything)).toEqual([])
  })

  it('a panel inserted in the middle is sorted by DOM order', async () => {
    const order = ref(['a', 'c'])
    const Host = defineComponent({
      setup: () => () =>
        h(
          ResizablePanels,
          {},
          {
            default: () =>
              order.value.flatMap((k, i) => [
                ...(i > 0 ? [h(ResizableHandle, { key: `h-${k}` })] : []),
                h(ResizablePanel, { key: k, id: k, defaultSize: k === 'b' ? 20 : 40 }),
              ]),
          },
        ),
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w as Anything)
    order.value = ['a', 'b', 'c']
    await nextTick()
    await nextTick()
    expect(w.findAll('[data-slot="resizable-panel"]').map((p) => p.attributes('id'))).toEqual(['a', 'b', 'c'])
    const seps = w.findAll('[data-slot="resizable-handle"]')
    expect(seps).toHaveLength(2)
    expect(seps.every((s) => s.attributes('tabindex') === '0')).toBe(true)
    const sizes = w.findAll('[data-slot="resizable-panel"]').map((p) => Number(p.attributes('data-size')))
    expect(sizes.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1)
    expect(sizes[1]).toBeCloseTo(20, 1)
  })

  it('changing minSize reactively re-clamps', async () => {
    const min = ref(0)
    const Host = defineComponent({
      setup: () => () =>
        h(ResizablePanels, {}, { default: () => [h(ResizablePanel, { defaultSize: 10, minSize: min.value }), h(ResizableHandle), h(ResizablePanel)] }),
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w as Anything)
    await nextTick()
    expect(Number(w.find('[data-slot="resizable-panel"]').attributes('data-size'))).toBeCloseTo(10, 1)
    min.value = 40
    await nextTick()
    expect(Number(w.find('[data-slot="resizable-panel"]').attributes('data-size'))).toBeCloseTo(40, 1)
  })
})

describe('ResizablePanels: rtl and many panels', () => {
  it('horizontal arrows and drag flip in rtl containers', async () => {
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    ;(w.element as HTMLElement).style.direction = 'rtl'
    await handles(w)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(sizesOf(w)).toEqual([45, 55])
    mockRect(w)
    await drag(w, 0, 500, 600)
    expect(sizesOf(w)).toEqual([35, 65])
  })

  it('10 panels keep the sum at 100', async () => {
    const w = await build(Array.from({ length: 10 }, () => ({})))
    expect(sizesOf(w).reduce((s, v) => s + v, 0)).toBeCloseTo(100)
    expect(handles(w)).toHaveLength(9)
  })
})

describe('ResizablePanels: cleanup', () => {
  it('removes document listeners on unmount mid-drag', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const w = await build([{ defaultSize: 50 }, { defaultSize: 50 }])
    mockRect(w)
    await handles(w)[0].trigger('pointerdown', { clientX: 0, button: 0, pointerId: 1 })
    const added = add.mock.calls.filter(([t]) => String(t).startsWith('pointer')).map(([t]) => t)
    expect(added.sort()).toEqual(['pointercancel', 'pointermove', 'pointerup'])
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    const removed = remove.mock.calls.filter(([t]) => String(t).startsWith('pointer')).map(([t]) => t)
    expect(removed.sort()).toEqual(['pointercancel', 'pointermove', 'pointerup'])
    // further events do nothing and do not throw
    pointer('pointermove', { clientX: 400 })
    pointer('pointerup')
  })

  it('removes listeners after a completed drag', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const w = await build()
    mockRect(w)
    await drag(w, 0, 0, 10)
    expect(remove.mock.calls.filter(([t]) => t === 'pointermove').length).toBeGreaterThan(0)
  })

  it('unmounting without a drag is clean', async () => {
    const w = await build([{}, {}, {}])
    expect(() => w.unmount()).not.toThrow()
    wrappers = wrappers.filter((x) => x !== w)
  })
})

describe('ResizableHandle accessibility', () => {
  const Demo = defineComponent({
    props: { label: { type: String, default: undefined } },
    setup(props) {
      return () =>
        h(ResizablePanels, { class: 'h-20' }, () => [
          h(ResizablePanel, null, () => 'A'),
          h(ResizableHandle, props.label ? { label: props.label } : {}),
          h(ResizablePanel, null, () => 'B'),
        ])
    },
  })

  it('has an accessible name: "Resize panels" by default, or `label`', async () => {
    const w = mount(Demo, { attachTo: document.body })
    await nextTick()
    expect(w.find('[role="separator"]').attributes('aria-label')).toBe('Resize panels')
    const named = mount(Demo, { props: { label: 'Resize sidebar' }, attachTo: document.body })
    await nextTick()
    expect(named.find('[role="separator"]').attributes('aria-label')).toBe('Resize sidebar')
    w.unmount()
    named.unmount()
  })

  it('the hairline handle has a 24px-wide hit area (after:-inset-x-3) and a transparent focus outline for forced colours', async () => {
    const w = mount(Demo, { attachTo: document.body })
    await nextTick()
    const classes = w.find('[role="separator"]').classes()
    expect(classes).toContain('after:-inset-x-3')
    expect(classes).toContain('outline-hidden')
    w.unmount()
  })
})
