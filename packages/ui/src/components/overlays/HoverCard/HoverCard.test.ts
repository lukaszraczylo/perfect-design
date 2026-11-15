import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './index'

let wrapper: VueWrapper | undefined
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

function make(opts: { open?: boolean; rootProps?: Record<string, unknown>; contentProps?: Record<string, unknown> } = {}) {
  const open = ref(opts.open ?? false)
  const Comp = defineComponent({
    setup: () => () =>
      h(HoverCard, { ...(opts.open !== undefined ? { open: open.value } : {}), 'onUpdate:open': (v: boolean) => (open.value = v), ...(opts.rootProps ?? {}) }, () => [
        h(HoverCardTrigger, { href: '#user' }, () => '@ada'),
        h(HoverCardContent, opts.contentProps ?? {}, () => 'Ada Lovelace, mathematician'),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const trigger = () => q('[data-slot="hover-card-trigger"]')!
const enter = (el: HTMLElement) => el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
const leave = (el: HTMLElement) => el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))

describe('HoverCard', () => {
  it('is closed initially', () => {
    make()
    expect(q('[data-slot="hover-card-content"]')).toBeNull()
    expect(trigger().tagName).toBe('A')
  })

  it('opens after openDelay (default 700ms) on pointer enter', async () => {
    make()
    enter(trigger())
    await vi.advanceTimersByTimeAsync(600)
    expect(q('[data-slot="hover-card-content"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(150)
    expect(q('[data-slot="hover-card-content"]')?.textContent).toBe('Ada Lovelace, mathematician')
  })

  it('honours custom openDelay', async () => {
    make({ rootProps: { openDelay: 0 } })
    enter(trigger())
    await vi.advanceTimersByTimeAsync(1)
    expect(q('[data-slot="hover-card-content"]')).not.toBeNull()
  })

  it('closes after closeDelay when the trigger loses focus', async () => {
    make({ rootProps: { openDelay: 0, closeDelay: 200 } })
    enter(trigger())
    await vi.advanceTimersByTimeAsync(5)
    trigger().dispatchEvent(new FocusEvent('blur'))
    await vi.advanceTimersByTimeAsync(100)
    expect(q('[data-slot="hover-card-content"]')).not.toBeNull()
    await vi.advanceTimersByTimeAsync(150)
    expect(q('[data-slot="hover-card-content"]')).toBeNull()
  })

  it('stays open while the pointer is over the card content', async () => {
    make({ rootProps: { openDelay: 0, closeDelay: 100 } })
    enter(trigger())
    await vi.advanceTimersByTimeAsync(5)
    leave(trigger())
    enter(q('[data-slot="hover-card-content"]')!)
    await vi.advanceTimersByTimeAsync(300)
    expect(q('[data-slot="hover-card-content"]')).not.toBeNull()
  })

  it('opens on keyboard focus', async () => {
    make()
    trigger().dispatchEvent(new FocusEvent('focus'))
    await vi.advanceTimersByTimeAsync(750)
    expect(q('[data-slot="hover-card-content"]')).not.toBeNull()
  })

  it('supports controlled open and emits update:open', async () => {
    const { open } = make({ open: false, rootProps: { openDelay: 0 } })
    enter(trigger())
    await vi.advanceTimersByTimeAsync(5)
    expect(open.value).toBe(true)
    expect(q('[data-slot="hover-card-content"]')).not.toBeNull()
    open.value = false
    await vi.advanceTimersByTimeAsync(5)
    await nextTick()
    expect(q('[data-slot="hover-card-content"]')).toBeNull()
  })

  it('opens when defaultOpen is set', async () => {
    make({ rootProps: { defaultOpen: true } })
    await nextTick()
    expect(q('[data-slot="hover-card-content"]')).not.toBeNull()
  })

  describe('placement and customisation', () => {
    it('defaults to side=bottom align=center, overridable', async () => {
      make({ open: true })
      await nextTick()
      let c = q('[data-slot="hover-card-content"]')!
      expect(c.getAttribute('data-side')).toBe('bottom')
      expect(c.getAttribute('data-align')).toBe('center')
      wrapper!.unmount()
      document.body.innerHTML = ''
      make({ open: true, contentProps: { side: 'right', align: 'start' } })
      await nextTick()
      c = q('[data-slot="hover-card-content"]')!
      expect(c.getAttribute('data-side')).toBe('right')
      expect(c.getAttribute('data-align')).toBe('start')
    })

    it('merges class and falls through attributes', async () => {
      make({ open: true, contentProps: { class: 'w-96 bg-red-500', 'data-testid': 'hc' } })
      await nextTick()
      const c = q('[data-slot="hover-card-content"]')!
      expect(c.className).toContain('w-96')
      expect(c.className).not.toContain('w-64')
      expect(c.className).toContain('bg-red-500')
      expect(c.className).not.toContain('bg-popover')
      expect(c.getAttribute('data-testid')).toBe('hc')
    })
  })

  it('removes content on unmount while open', async () => {
    make({ open: true })
    await nextTick()
    wrapper!.unmount()
    wrapper = undefined
    expect(q('[data-slot="hover-card-content"]')).toBeNull()
  })

  it('clears pending open timers on unmount (no late open)', async () => {
    make()
    enter(trigger())
    wrapper!.unmount()
    wrapper = undefined
    await vi.advanceTimersByTimeAsync(2000)
    expect(q('[data-slot="hover-card-content"]')).toBeNull()
  })
})
