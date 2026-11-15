import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useToastStore } from '../../../stores/toast'
import Toaster from './Toaster.vue'
import { TOASTER_POSITIONS, TOASTER_POSITION_CLASSES } from './positions'

let w: VueWrapper | undefined
function make(props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  w = mount(Toaster, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return useToastStore()
}
const items = () => w!.findAll('[data-slot="toast"]')

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Toaster', () => {
  describe('good path', () => {
    it('renders an always-present live region with a label', () => {
      make()
      const root = w!.find('[data-slot="toaster"]')
      expect(root.attributes('role')).toBe('region')
      expect(root.attributes('aria-live')).toBeUndefined()
      expect(root.attributes('aria-label')).toBe('Notifications')
      expect(root.find('[data-slot="toaster-status"]').attributes('role')).toBe('status')
      expect(root.find('[data-slot="toaster-alert"]').attributes('role')).toBe('alert')
      expect(items()).toHaveLength(0)
    })

    it('renders store toasts with all fields and variants', async () => {
      const s = make()
      s.push({ title: 'One', description: 'desc', variant: 'success' })
      s.error('Two')
      await nextTick()
      expect(items()).toHaveLength(2)
      expect(items()[0].attributes('data-variant')).toBe('success')
      expect(items()[0].text()).toContain('desc')
      // Toasts inside a Toaster are not live regions themselves: one persistent region announces them.
      expect(items()[1].attributes('role')).toBeUndefined()
    })

    it('announces new toasts once through the persistent regions, by severity', async () => {
      const s = make()
      s.push({ title: 'Saved', description: 'All good', variant: 'success' })
      s.push({ title: 'Disk full', variant: 'danger', action: { label: 'Free space', onClick: () => {} } })
      for (let i = 0; i < 5; i++) await nextTick()
      expect(w!.find('[data-slot="toaster-status"]').text()).toBe('Saved. All good')
      expect(w!.find('[data-slot="toaster-alert"]').text()).toBe('Disk full. Actions available')
    })

    it('moves focus to the next toast when the focused toast is dismissed, then back to the previous element', async () => {
      const outside = document.createElement('button')
      document.body.append(outside)
      const s = make()
      s.push({ title: 'A', duration: 0 })
      s.push({ title: 'B', duration: 0 })
      await nextTick()
      outside.focus()
      const buttons = w!.findAll('[data-slot="toast-dismiss"]')
      ;(buttons[0].element as HTMLElement).focus()
      await buttons[0].trigger('focusin', { relatedTarget: outside })
      await buttons[0].trigger('click')
      await nextTick()
      await nextTick()
      expect(document.activeElement).toBe(w!.find('[data-slot="toast-dismiss"]').element)
      await w!.find('[data-slot="toast-dismiss"]').trigger('click')
      await nextTick()
      await nextTick()
      expect(document.activeElement).toBe(outside)
    })

    it('Escape on a focused toast dismisses only that toast and returns focus; Escape elsewhere does nothing', async () => {
      const outside = document.createElement('button')
      document.body.append(outside)
      const s = make()
      s.push({ title: 'A', duration: 0 })
      s.push({ title: 'B', duration: 0 })
      await nextTick()
      outside.focus()
      await outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(s.toasts).toHaveLength(2)
      const buttons = w!.findAll('[data-slot="toast-dismiss"]')
      ;(buttons[1].element as HTMLElement).focus()
      await buttons[1].trigger('focusin', { relatedTarget: outside })
      await buttons[1].trigger('keydown', { key: 'Escape' })
      await nextTick()
      await nextTick()
      expect(s.toasts).toHaveLength(1)
      expect(items()).toHaveLength(1)
      expect(document.activeElement).toBe(w!.find('[data-slot="toast-dismiss"]').element)
      await w!.find('[data-slot="toast-dismiss"]').trigger('keydown', { key: 'Enter' })
      expect(s.toasts).toHaveLength(1)
    })

    it('dismiss button removes the toast from the store', async () => {
      const s = make()
      s.push({ title: 'x', duration: 0 })
      await nextTick()
      await w!.find('[data-slot="toast-dismiss"]').trigger('click')
      expect(s.toasts).toHaveLength(0)
      expect(items()).toHaveLength(0)
    })

    it('action runs its handler and dismisses', async () => {
      const s = make()
      const onClick = vi.fn()
      s.push({ title: 'x', duration: 0, action: { label: 'Undo', onClick } })
      await nextTick()
      await w!.find('[data-slot="toast-action"]').trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(s.toasts).toHaveLength(0)
    })

    it('auto-dismiss from the store removes the element', async () => {
      const s = make()
      s.push({ title: 'x', duration: 1000 })
      await nextTick()
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(items()).toHaveLength(0)
    })
  })

  describe('position', () => {
    it.each([
      ['top-left', 'top-0'],
      ['top-center', 'top-0'],
      ['top-right', 'right-0'],
      ['bottom-left', 'left-0'],
      ['bottom-center', 'bottom-0'],
      ['bottom-right', 'right-0'],
    ] as const)('%s', (position, cls) => {
      make({ position })
      const root = w!.find('[data-slot="toaster"]')
      expect(root.attributes('data-position')).toBe(position)
      expect(root.classes()).toContain(cls)
    })

    it('defaults to bottom-right; unknown position falls back', () => {
      make()
      expect(w!.attributes('data-position')).toBe('bottom-right')
      w!.unmount()
      make({ position: 'middle' })
      expect(w!.attributes('data-position')).toBe('bottom-right')
    })

    it('puts the newest toast nearest the anchored edge', async () => {
      const s = make({ position: 'top-right' })
      s.push({ title: 'old', duration: 0 })
      s.push({ title: 'new', duration: 0 })
      await nextTick()
      expect(items()[0].text()).toContain('new')
      w!.unmount()
      const s2 = make({ position: 'bottom-right' })
      s2.push({ title: 'old', duration: 0 })
      s2.push({ title: 'new', duration: 0 })
      await nextTick()
      expect(items()[1].text()).toContain('new')
    })
  })

  describe('customisation', () => {
    it('merges class last, custom label, attrs', () => {
      make({ class: 'max-w-xs mine', label: 'Alerts' })
      const root = w!.find('[data-slot="toaster"]')
      expect(root.classes()).toContain('mine')
      expect(root.classes()).toContain('max-w-xs')
      expect(root.classes()).not.toContain('max-w-sm')
      expect(root.attributes('aria-label')).toBe('Alerts')
    })
  })

  describe('pause on hover', () => {
    it('keeps an expiring toast visible while hovered and releases it after leaving', async () => {
      const s = make()
      s.push({ title: 'sticky-ish', duration: 1000 })
      await nextTick()
      const root = w!.find('[data-slot="toaster"]')
      await root.trigger('mouseenter')
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(s.toasts).toHaveLength(0)
      expect(items()).toHaveLength(1)
      await root.trigger('mouseleave')
      vi.advanceTimersByTime(999)
      await nextTick()
      expect(items()).toHaveLength(1)
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(items()).toHaveLength(0)
    })

    it('re-entering before release cancels the pending release', async () => {
      const s = make()
      s.push({ title: 'a', duration: 500 })
      await nextTick()
      const root = w!.find('[data-slot="toaster"]')
      await root.trigger('mouseenter')
      vi.advanceTimersByTime(600)
      await root.trigger('mouseleave')
      vi.advanceTimersByTime(500)
      await root.trigger('mouseenter')
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(items()).toHaveLength(1)
    })

    it('toasts pushed while hovered appear and expire normally', async () => {
      const s = make()
      s.push({ title: 'a', duration: 0 })
      await nextTick()
      await w!.find('[data-slot="toaster"]').trigger('mouseenter')
      s.push({ title: 'b', duration: 1000 })
      await nextTick()
      expect(items()).toHaveLength(2)
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(items()).toHaveLength(1)
    })

    it('dismissing a held toast removes it immediately', async () => {
      const s = make()
      s.push({ title: 'a', duration: 100 })
      await nextTick()
      await w!.find('[data-slot="toaster"]').trigger('mouseenter')
      vi.advanceTimersByTime(200)
      await nextTick()
      expect(items()).toHaveLength(1)
      await w!.find('[data-slot="toast-dismiss"]').trigger('click')
      expect(items()).toHaveLength(0)
    })

    it('focus inside pauses; focus moving within the stack does not resume', async () => {
      const s = make()
      s.push({ title: 'a', duration: 100, action: { label: 'Go', onClick: () => {} } })
      await nextTick()
      const root = w!.find('[data-slot="toaster"]')
      await root.trigger('focusin')
      vi.advanceTimersByTime(300)
      await nextTick()
      expect(items()).toHaveLength(1)
      const inner = w!.find('[data-slot="toast-dismiss"]').element
      await root.trigger('focusout', { relatedTarget: inner })
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(items()).toHaveLength(1)
      await root.trigger('focusout', { relatedTarget: null })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(items()).toHaveLength(0)
    })

    it('pauseOnHover=false does not hold toasts', async () => {
      const s = make({ pauseOnHover: false })
      s.push({ title: 'a', duration: 100 })
      await nextTick()
      const root = w!.find('[data-slot="toaster"]')
      await root.trigger('mouseenter')
      vi.advanceTimersByTime(200)
      await nextTick()
      expect(items()).toHaveLength(0)
      await root.trigger('mouseleave')
    })

    it('mouseleave without hold is a no-op', async () => {
      make()
      await w!.find('[data-slot="toaster"]').trigger('mouseleave')
      expect(items()).toHaveLength(0)
    })

    it('clears its release timer on unmount', async () => {
      const s = make()
      s.push({ title: 'a', duration: 100 })
      await nextTick()
      const root = w!.find('[data-slot="toaster"]')
      await root.trigger('mouseenter')
      vi.advanceTimersByTime(200)
      await root.trigger('mouseleave')
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      w!.unmount()
      w = undefined
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('rapid pushes are capped by the store maximum', async () => {
      const s = make()
      for (let i = 0; i < 50; i++) s.push({ title: `t${i}`, duration: 0 })
      await nextTick()
      expect(items()).toHaveLength(5)
      expect(items().at(-1)!.text()).toContain('t49')
    })

    it('dedupe key replaces instead of stacking', async () => {
      const s = make()
      s.push({ title: 'a', key: 'k', duration: 0 })
      s.push({ title: 'b', key: 'k', duration: 0 })
      await nextTick()
      expect(items()).toHaveLength(1)
      expect(items()[0].text()).toContain('b')
    })

    it('very long and unicode text', async () => {
      const s = make()
      s.push({ title: 'ž'.repeat(2000), description: '日本語 🚀', duration: 0 })
      await nextTick()
      expect(items()[0].text()).toContain('日本語')
    })

    it('the store rejects an empty title (nothing renders)', async () => {
      const s = make()
      expect(() => s.push({ title: '   ' })).toThrow()
      await nextTick()
      expect(items()).toHaveLength(0)
    })
  })

  describe('all six position presets', () => {
    const EXPECTED: Record<string, string[]> = {
      'top-left': ['top-0', 'left-0'],
      'top-center': ['top-0', 'left-1/2', '-translate-x-1/2'],
      'top-right': ['top-0', 'right-0'],
      'bottom-left': ['bottom-0', 'left-0'],
      'bottom-center': ['bottom-0', 'left-1/2', '-translate-x-1/2'],
      'bottom-right': ['bottom-0', 'right-0'],
    }

    it('exports exactly the six presets', () => {
      expect([...TOASTER_POSITIONS].sort()).toEqual(Object.keys(EXPECTED).sort())
      expect(Object.keys(TOASTER_POSITION_CLASSES)).toHaveLength(6)
    })

    it.each(Object.entries(EXPECTED))('%s anchors with exactly its classes and no opposing edge', (position, classes) => {
      make({ position })
      const root = w!.find('[data-slot="toaster"]')
      expect(root.attributes('data-position')).toBe(position)
      expect(root.classes()).toEqual(expect.arrayContaining(classes))
      const opposite = position.startsWith('top') ? 'bottom-0' : 'top-0'
      expect(root.classes()).not.toContain(opposite)
      if (position.endsWith('left')) expect(root.classes()).not.toContain('right-0')
      if (position.endsWith('right')) expect(root.classes()).not.toContain('left-0')
      expect(root.classes()).toEqual(expect.arrayContaining(['fixed', 'z-(--z-toast)']))
    })

    it.each(Object.keys(EXPECTED))('%s orders the newest toast toward the anchored edge', async (position) => {
      const s = make({ position })
      s.push({ title: 'old', duration: 0 })
      s.push({ title: 'new', duration: 0 })
      await nextTick()
      expect(items()[position.startsWith('top') ? 0 : 1].text()).toContain('new')
    })

    it.each(['', null, undefined, 'center', 'constructor', 'BOTTOM-LEFT'])('invalid position %s falls back to bottom-right', (position) => {
      make({ position })
      expect(w!.attributes('data-position')).toBe('bottom-right')
    })

    it('switching position at runtime re-anchors', async () => {
      make({ position: 'top-left' })
      await w!.setProps({ position: 'bottom-center' })
      expect(w!.attributes('data-position')).toBe('bottom-center')
      expect(w!.classes()).toContain('bottom-0')
      expect(w!.classes()).not.toContain('top-0')
    })
  })

  describe('progress and icons', () => {
    it('shows no progress bars or icon changes by default', async () => {
      const s = make()
      s.push({ title: 'a', duration: 3000 })
      await nextTick()
      expect(w!.find('[data-slot="toast-progress"]').exists()).toBe(false)
      expect(w!.find('[data-slot="toast-icon"]').exists()).toBe(true)
    })

    it('showProgress renders a bar for finite durations only', async () => {
      const s = make({ showProgress: true })
      s.push({ title: 'timed', duration: 3000 })
      s.push({ title: 'sticky', duration: 0 })
      s.push({ title: 'forever', duration: Infinity })
      await nextTick()
      expect(items()).toHaveLength(3)
      expect(w!.findAll('[data-slot="toast-progress"]')).toHaveLength(1)
    })

    it('hideIcons removes the icon from every toast', async () => {
      const s = make({ hideIcons: true })
      s.push({ title: 'a', duration: 0 })
      s.error('b')
      await nextTick()
      expect(items()).toHaveLength(2)
      expect(w!.find('[data-slot="toast-icon"]').exists()).toBe(false)
    })

    it('pauses the progress animation while hovered and resumes on leave', async () => {
      const calls: string[] = []
      const anim = {
        playState: 'running',
        cancel: () => calls.push('cancel'),
        pause() {
          anim.playState = 'paused'
          calls.push('pause')
        },
        play() {
          anim.playState = 'running'
          calls.push('play')
        },
      }
      const proto = HTMLElement.prototype as { animate?: unknown }
      const original = proto.animate
      proto.animate = () => anim
      try {
        const s = make({ showProgress: true })
        s.push({ title: 'a', duration: 5000 })
        await nextTick()
        const root = w!.find('[data-slot="toaster"]')
        await root.trigger('mouseenter')
        await nextTick()
        expect(calls).toContain('pause')
        await root.trigger('mouseleave')
        await nextTick()
        expect(calls).toContain('play')
        w!.unmount()
        w = undefined
        expect(calls).toContain('cancel')
      } finally {
        proto.animate = original
      }
    })

    it('showProgress combined with pauseOnHover=false still renders the bar', async () => {
      const s = make({ showProgress: true, pauseOnHover: false })
      s.push({ title: 'a', duration: 3000 })
      await nextTick()
      expect(w!.find('[data-slot="toast-progress"]').exists()).toBe(true)
    })
  })
})
