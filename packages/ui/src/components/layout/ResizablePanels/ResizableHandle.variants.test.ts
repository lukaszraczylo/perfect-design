import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { ResizableHandle, ResizablePanel, ResizablePanels } from './index'
import { resizableHandleSizes, resizableHandleVariants } from './variants'

type P = Record<string, unknown>
let wrappers: VueWrapper<any>[] = []

async function build(handleProps: P = {}, rootProps: P = {}) {
  const w = mount(ResizablePanels, {
    props: rootProps,
    slots: { default: () => [h(ResizablePanel, null, { default: () => 'A' }), h(ResizableHandle, { 'aria-label': 'Resize sample', ...handleProps }), h(ResizablePanel, null, { default: () => 'B' })] },
    attachTo: document.body,
  })
  wrappers.push(w)
  await nextTick()
  return w
}
const handle = (w: VueWrapper<any>) => w.find('[data-slot="resizable-handle"]')
const THICKNESS = /^(w|h)-(px|0\.5|1|2|3)$/
const thickness = (c: string[]) => c.filter((x) => THICKNESS.test(x))

afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('ResizableHandle size', () => {
  it('default output is unchanged: a 1px line, 8px bar', async () => {
    expect(thickness((await build()).find('[role="separator"]').classes())).toEqual(['w-px'])
    expect(thickness(handle(await build({ variant: 'bar' })).classes())).toEqual(['w-2'])
    expect(thickness(handle(await build({}, { orientation: 'vertical' })).classes())).toEqual(['h-px'])
  })

  describe('line', () => {
    it.each([
      ['sm', 'w-px', 'h-px'],
      ['md', 'w-px', 'h-px'],
      ['lg', 'w-0.5', 'h-0.5'],
    ] as const)('%s is %s horizontally and %s vertically', async (size, horizontal, vertical) => {
      expect(thickness(handle(await build({ size })).classes())).toEqual([horizontal])
      expect(thickness(handle(await build({ size }, { orientation: 'vertical' })).classes())).toEqual([vertical])
    })
  })

  describe('bar', () => {
    it.each([
      ['sm', 'w-1', 'h-1'],
      ['md', 'w-2', 'h-2'],
      ['lg', 'w-3', 'h-3'],
    ] as const)('%s is %s horizontally and %s vertically', async (size, horizontal, vertical) => {
      expect(thickness(handle(await build({ variant: 'bar', size })).classes())).toEqual([horizontal])
      expect(thickness(handle(await build({ variant: 'bar', size }, { orientation: 'vertical' })).classes())).toEqual([vertical])
    })
  })

  it('unknown size falls back to md', async () => {
    expect(thickness(handle(await build({ size: 'xl' })).classes())).toEqual(['w-px'])
    expect(thickness(handle(await build({ variant: 'bar', size: 'xl' })).classes())).toEqual(['w-2'])
  })

  it('every variant x size x orientation keeps the 24px hit area and the cursor', async () => {
    for (const variant of ['line', 'bar'] as const)
      for (const size of resizableHandleSizes) {
        const h1 = handle(await build({ variant, size }))
        expect(h1.classes()).toEqual(expect.arrayContaining(['after:-inset-x-3', 'after:inset-y-0', 'cursor-col-resize', 'outline-hidden', 'focus-visible:bg-ring']))
        const h2 = handle(await build({ variant, size }, { orientation: 'vertical' }))
        expect(h2.classes()).toEqual(expect.arrayContaining(['after:-inset-y-3', 'after:inset-x-0', 'cursor-row-resize']))
      }
  })

  it('size does not change the ARIA wiring, tab order or labelling', async () => {
    for (const size of resizableHandleSizes) {
      const el = handle(await build({ size, variant: 'bar' }))
      expect(el.attributes('role')).toBe('separator')
      expect(el.attributes('tabindex')).toBe('0')
      expect(el.attributes('aria-label')).toBe('Resize sample')
      expect(el.attributes('aria-orientation')).toBe('vertical')
      expect(el.attributes('aria-valuenow')).toBeDefined()
    }
  })

  it.each(resizableHandleSizes)('keyboard resizing still works with size %s', async (size) => {
    const w = await build({ size, variant: 'bar' })
    const before = w.findAll('[data-slot="resizable-panel"]').map((p) => Number(p.attributes('data-size')))
    await handle(w).trigger('keydown', { key: 'ArrowRight' })
    const after = w.findAll('[data-slot="resizable-panel"]').map((p) => Number(p.attributes('data-size')))
    expect(after[0]).toBeGreaterThan(before[0])
    expect(after[0] + after[1]).toBeCloseTo(100)
  })

  it('works with grip and a disabled handle', async () => {
    const grip = await build({ size: 'lg', variant: 'bar', grip: true })
    expect(grip.find('[data-slot="resizable-handle-grip"]').exists()).toBe(true)
    const off = handle(await build({ size: 'lg', disabled: true }))
    expect(off.attributes('aria-disabled')).toBe('true')
    expect(off.attributes('tabindex')).toBe('-1')
    expect(thickness(off.classes())).toEqual(['w-0.5'])
  })

  it('class prop wins over the size', async () => {
    const c = handle(await build({ size: 'lg', variant: 'bar', class: 'w-4' })).classes()
    expect(c).toContain('w-4')
    expect(c).not.toContain('w-3')
  })

  it('resizableHandleVariants is reusable', () => {
    expect(resizableHandleVariants({ variant: 'bar', size: 'lg' })).toContain('w-3')
    expect(resizableHandleVariants({ orientation: 'vertical', variant: 'line', size: 'lg' })).toContain('h-0.5')
    expect(resizableHandleVariants()).toContain('w-px')
  })

  it('stacks above the neighbouring panel so its whole 24px hit area receives the pointer', () => {
    // Regression: the next panel (relative, later in the DOM) painted over half of the hit area in a real browser.
    expect(resizableHandleVariants()).toContain('z-10')
  })
})

describe('ResizableHandle forced colours', () => {
  it('the default line paints CanvasText in forced-colors mode, where its bg-border token is dropped', async () => {
    const classes = handle(await build()).classes()
    expect(classes).toContain('bg-border')
    expect(classes).toContain('forced-colors:bg-[CanvasText]')
    expect(resizableHandleVariants()).toContain('forced-colors:bg-[CanvasText]')
  })

  it('every line size and orientation keeps the forced-colors fill', async () => {
    for (const size of resizableHandleSizes) {
      expect(handle(await build({ size })).classes()).toContain('forced-colors:bg-[CanvasText]')
      expect(handle(await build({ size }, { orientation: 'vertical' })).classes()).toContain('forced-colors:bg-[CanvasText]')
    }
  })

  it('the bar draws a CanvasText border instead of a fill, so it stays an outlined track', async () => {
    for (const size of resizableHandleSizes) {
      const classes = handle(await build({ variant: 'bar', size })).classes()
      expect(classes).toEqual(expect.arrayContaining(['bg-input', 'forced-colors:border', 'forced-colors:border-[CanvasText]', 'forced-colors:not-focus-visible:outline-0']))
      expect(classes).not.toContain('forced-colors:bg-[CanvasText]')
    }
  })

  it('the line keeps its fill on hover, focus and drag (those state backgrounds are dropped in forced-colors mode) and hides the idle outline-hidden outline', async () => {
    const classes = handle(await build()).classes()
    expect(classes).toEqual(
      expect.arrayContaining([
        'forced-colors:hover:bg-[CanvasText]',
        'forced-colors:focus-visible:bg-[CanvasText]',
        'forced-colors:data-[dragging]:bg-[CanvasText]',
        'forced-colors:not-focus-visible:outline-0',
      ]),
    )
  })

  it('an unknown variant falls back to the line and its forced-colors fill', async () => {
    expect(handle(await build({ variant: 'dotted' })).classes()).toContain('forced-colors:bg-[CanvasText]')
  })

  it('focus and drag state still use outline-hidden (a transparent outline that forced-colors mode renders) plus the ring fill', async () => {
    const classes = handle(await build()).classes()
    expect(classes).toEqual(expect.arrayContaining(['outline-hidden', 'focus-visible:bg-ring', 'data-[dragging]:bg-ring']))
  })

  it('a consumer class replaces the normal colour and leaves the forced-colors fill', async () => {
    const w = await build({ class: 'bg-primary' })
    const classes = handle(w).classes()
    expect(classes).toContain('bg-primary')
    expect(classes).not.toContain('bg-border')
    expect(classes).toContain('forced-colors:bg-[CanvasText]')
  })
})
