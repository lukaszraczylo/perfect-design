import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger, popoverContentVariants, popoverSizes } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))

function make(opts: { open?: boolean; contentProps?: Record<string, unknown>; anchor?: boolean; disabledTrigger?: boolean } = {}) {
  const open = ref(opts.open ?? false)
  const Comp = defineComponent({
    setup: () => () =>
      h('div', [
        h('button', { id: 'outside' }, 'outside'),
        h(Popover, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [
          opts.anchor ? h(PopoverAnchor, { class: 'anchor' }, () => 'anchor') : null,
          h(PopoverTrigger, { disabled: opts.disabledTrigger }, () => 'Toggle'),
          h(PopoverContent, opts.contentProps ?? {}, () => [h('p', 'Body'), h(PopoverClose, null, () => 'Dismiss')]),
        ]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null

describe('Popover', () => {
  it('renders no content while closed', () => {
    make()
    expect(q('[data-slot="popover-content"]')).toBeNull()
    expect(q('[data-slot="popover-trigger"]')!.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles open and closed from the trigger', async () => {
    const { open } = make()
    const t = q('[data-slot="popover-trigger"]')!
    t.click()
    await nextTick()
    expect(open.value).toBe(true)
    expect(q('[data-slot="popover-content"]')?.textContent).toContain('Body')
    expect(t.getAttribute('aria-expanded')).toBe('true')
    expect(q('[data-slot="popover-content"]')!.getAttribute('role')).toBe('dialog')
    t.click()
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('closes on Escape', async () => {
    const { open } = make({ open: true })
    await nextTick()
    q('[data-slot="popover-content"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('closes on outside pointer down', async () => {
    const { open } = make({ open: true })
    await nextTick()
    await tick()
    q('#outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('stays open when pointer goes down inside the content', async () => {
    const { open } = make({ open: true })
    await nextTick()
    await tick()
    q('[data-slot="popover-content"] p')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
    await nextTick()
    expect(open.value).toBe(true)
  })

  it('closes via PopoverClose', async () => {
    const { open } = make({ open: true })
    await nextTick()
    q('[data-slot="popover-close"]')!.click()
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('works uncontrolled', async () => {
    wrapper = mount(
      defineComponent({
        setup: () => () => h(Popover, null, () => [h(PopoverTrigger, null, () => 'T'), h(PopoverContent, null, () => 'Hello')]),
      }),
      { attachTo: document.body },
    )
    q('[data-slot="popover-trigger"]')!.click()
    await nextTick()
    expect(q('[data-slot="popover-content"]')?.textContent).toBe('Hello')
  })

  it('does not open from a disabled trigger', async () => {
    const { open } = make({ disabledTrigger: true })
    q('[data-slot="popover-trigger"]')!.click()
    await nextTick()
    expect(open.value).toBe(false)
    expect(q('[data-slot="popover-content"]')).toBeNull()
  })

  it('positions relative to an anchor', async () => {
    make({ open: true, anchor: true })
    await nextTick()
    expect(q('[data-slot="popover-anchor"]')!.textContent).toBe('anchor')
    expect(q('[data-slot="popover-content"]')).not.toBeNull()
  })

  describe('placement props', () => {
    it('defaults to side=bottom align=center', async () => {
      make({ open: true })
      await nextTick()
      const c = q('[data-slot="popover-content"]')!
      expect(c.getAttribute('data-side')).toBe('bottom')
      expect(c.getAttribute('data-align')).toBe('center')
    })

    it('honours side, align and sideOffset', async () => {
      make({ open: true, contentProps: { side: 'top', align: 'end', sideOffset: 20 } })
      await nextTick()
      const c = q('[data-slot="popover-content"]')!
      expect(c.getAttribute('data-side')).toBe('top')
      expect(c.getAttribute('data-align')).toBe('end')
    })
  })

  describe('customisation', () => {
    it('merges class and keeps the floating surface', async () => {
      make({ open: true, contentProps: { class: 'w-96 bg-red-500' } })
      await nextTick()
      const cls = q('[data-slot="popover-content"]')!.className
      expect(cls).toContain('w-96')
      expect(cls).not.toContain('w-72')
      expect(cls).toContain('bg-red-500')
      expect(cls).not.toContain('bg-popover')
      expect(cls).toContain('border')
    })

    it('falls through attributes', async () => {
      make({ open: true, contentProps: { 'data-testid': 'pop', 'aria-label': 'Details' } })
      await nextTick()
      const c = q('[data-slot="popover-content"]')!
      expect(c.getAttribute('data-testid')).toBe('pop')
      expect(c.getAttribute('aria-label')).toBe('Details')
    })
  })

  describe('edge cases', () => {
    it('empty content still renders a surface', async () => {
      wrapper = mount(
        defineComponent({ setup: () => () => h(Popover, { open: true }, () => h(PopoverContent)) }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(q('[data-slot="popover-content"]')).not.toBeNull()
    })

    it('unmounting while open removes portalled content', async () => {
      make({ open: true })
      await nextTick()
      wrapper!.unmount()
      wrapper = undefined
      expect(q('[data-slot="popover-content"]')).toBeNull()
    })

    it('rapid trigger clicks end in a consistent state', async () => {
      const { open } = make()
      const t = q('[data-slot="popover-trigger"]')!
      for (let i = 0; i < 5; i++) {
        t.click()
        await nextTick()
      }
      expect(open.value).toBe(true)
      expect(t.getAttribute('aria-expanded')).toBe('true')
    })
  })
})

describe('Popover sizes', () => {
  const cls = () => q('[data-slot="popover-content"]')!.className.split(' ')

  it('defaults to md (w-72 p-4), unchanged output', async () => {
    make({ open: true })
    await nextTick()
    expect(cls()).toContain('w-72')
    expect(cls()).toContain('p-4')
    expect(cls()).toContain('bg-popover')
    expect(cls()).toContain('max-w-[calc(100vw-2rem)]')
  })

  it.each([
    ['xs', 'w-48', 'p-3'],
    ['sm', 'w-60', 'p-3'],
    ['md', 'w-72', 'p-4'],
    ['lg', 'w-96', 'p-4'],
    ['xl', 'w-lg', 'p-5'],
    ['auto', 'w-auto', 'p-4'],
  ])('size=%s sets width %s and padding %s', async (size, w, p) => {
    make({ open: true, contentProps: { size } })
    await nextTick()
    expect(cls()).toContain(w)
    expect(cls()).toContain(p)
    expect(cls().filter((c) => /^w-/.test(c))).toHaveLength(1)
  })

  it('every size keeps the viewport cap and floating surface', async () => {
    make({ open: true, contentProps: { size: 'xl' } })
    await nextTick()
    expect(cls()).toContain('max-w-[calc(100vw-2rem)]')
    expect(cls()).toContain('border')
    expect(cls()).toContain('shadow-md')
  })

  it('class override beats the size preset', async () => {
    make({ open: true, contentProps: { size: 'lg', class: 'w-40 p-1' } })
    await nextTick()
    expect(cls()).toContain('w-40')
    expect(cls()).not.toContain('w-96')
    expect(cls()).toContain('p-1')
    expect(cls()).not.toContain('p-4')
  })

  it('unknown size falls back to md without crashing', async () => {
    make({ open: true, contentProps: { size: 'gigantic' } })
    await nextTick()
    expect(cls()).toContain('w-72')
  })

  it('prototype keys are not valid sizes', async () => {
    make({ open: true, contentProps: { size: 'toString' } })
    await nextTick()
    expect(cls()).toContain('w-72')
  })

  it('size does not leak into the DOM and does not break placement props', async () => {
    make({ open: true, contentProps: { size: 'sm', side: 'top' } })
    await nextTick()
    const c = q('[data-slot="popover-content"]')!
    expect(c.hasAttribute('size')).toBe(false)
    expect(c.getAttribute('data-side')).toBe('top')
  })

  it('popoverContentVariants works standalone', () => {
    expect(popoverContentVariants()).toContain('w-72')
    expect(popoverContentVariants({ size: 'auto' })).toContain('w-auto')
    expect(popoverContentVariants({ class: 'extra' })).toMatch(/extra$/)
    expect(() => popoverContentVariants({ size: 'x' as never })).not.toThrow()
    expect(popoverSizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl', 'auto'])
  })

describe('Popover viewport behaviour', () => {
  it('is capped to the available height and scrolls instead of overflowing', async () => {
    make({ open: true })
    await nextTick()
    const cls = q('[data-slot="popover-content"]')!.className
    expect(cls).toContain('max-h-(--reka-popper-available-height)')
    expect(cls).toContain('overflow-y-auto')
  })
})
})
