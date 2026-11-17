import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PageLoadingBar from './PageLoadingBar.vue'
import { pageLoadingBarFillVariants, pageLoadingBarVariants } from './variants'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const state = (w: ReturnType<typeof mount>) => w.attributes('data-state')
const fill = (w: ReturnType<typeof mount>) => w.find('[data-slot="page-loading-bar-fill"]')
async function setActive(w: ReturnType<typeof mount>, active: boolean) {
  await w.setProps({ active })
  await nextTick()
}

describe('PageLoadingBar', () => {
  describe('good path', () => {
    it('is idle and aria-hidden when not active', () => {
      const w = mount(PageLoadingBar)
      expect(state(w)).toBe('idle')
      expect(w.attributes('data-slot')).toBe('page-loading-bar')
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.attributes('role')).toBeUndefined()
      expect(w.classes()).toEqual(expect.arrayContaining(['fixed', 'top-0', 'inset-x-0', 'z-(--z-toast)', 'pointer-events-none', 'invisible']))
    })

    it('shows after the delay as a named progressbar with a sweep', async () => {
      const w = mount(PageLoadingBar, { props: { active: true } })
      expect(state(w)).toBe('idle')
      vi.advanceTimersByTime(149)
      await nextTick()
      expect(state(w)).toBe('idle')
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(state(w)).toBe('loading')
      expect(w.attributes('role')).toBe('progressbar')
      expect(w.attributes('aria-label')).toBe('Loading page')
      expect(w.attributes('aria-hidden')).toBeUndefined()
      expect(w.attributes('aria-valuenow')).toBeUndefined()
      expect(w.classes()).not.toContain('invisible')
      expect(fill(w).classes()).toEqual(expect.arrayContaining(['animate-ds-sweep', 'motion-reduce:animate-none', 'motion-reduce:w-full']))
    })

    it('finishes at 100% then fades then goes idle', async () => {
      const w = mount(PageLoadingBar, { props: { active: true, delay: 0, minDuration: 0 } })
      await nextTick()
      expect(state(w)).toBe('loading')
      await setActive(w, false)
      expect(state(w)).toBe('finishing')
      expect(w.attributes('aria-valuenow')).toBe('100')
      expect(fill(w).classes()).toEqual(expect.arrayContaining(['w-full', 'start-0']))
      expect(fill(w).classes()).not.toContain('animate-ds-sweep')
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(state(w)).toBe('fading')
      expect(w.classes()).toEqual(expect.arrayContaining(['opacity-0', 'motion-reduce:transition-none']))
      vi.advanceTimersByTime(300)
      await nextTick()
      expect(state(w)).toBe('idle')
      expect(w.attributes('aria-hidden')).toBe('true')
    })

    it('uses a custom label', async () => {
      const w = mount(PageLoadingBar, { props: { active: true, delay: 0, label: 'Opening settings' } })
      await nextTick()
      expect(w.attributes('aria-label')).toBe('Opening settings')
    })
  })

  describe('delay and minDuration', () => {
    it('never shows when the navigation ends inside the delay', async () => {
      const w = mount(PageLoadingBar)
      await setActive(w, true)
      vi.advanceTimersByTime(100)
      await setActive(w, false)
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(state(w)).toBe('idle')
    })

    it('keeps the bar for minDuration even when the navigation ends at once', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 300 } })
      await setActive(w, true)
      expect(state(w)).toBe('loading')
      vi.advanceTimersByTime(100)
      await setActive(w, false)
      expect(state(w)).toBe('loading')
      vi.advanceTimersByTime(199)
      await nextTick()
      expect(state(w)).toBe('loading')
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(state(w)).toBe('finishing')
    })

    it('finishes immediately when minDuration already passed', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 300 } })
      await setActive(w, true)
      vi.advanceTimersByTime(1000)
      await setActive(w, false)
      expect(state(w)).toBe('finishing')
    })

    it('invalid delay and minDuration fall back to the defaults', async () => {
      const w = mount(PageLoadingBar, { props: { active: true, delay: Number.NaN, minDuration: -5 } })
      vi.advanceTimersByTime(149)
      await nextTick()
      expect(state(w)).toBe('idle')
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(state(w)).toBe('loading')
      await setActive(w, false)
      expect(state(w)).toBe('loading')
      vi.advanceTimersByTime(300)
      await nextTick()
      expect(state(w)).toBe('finishing')
    })
  })

  describe('rapid toggles', () => {
    it('re-activating while finishing resumes loading and cancels the fade', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 0 } })
      await setActive(w, true)
      await setActive(w, false)
      expect(state(w)).toBe('finishing')
      await setActive(w, true)
      expect(state(w)).toBe('loading')
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(state(w)).toBe('loading')
    })

    it('re-activating while fading resumes loading', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 0 } })
      await setActive(w, true)
      await setActive(w, false)
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(state(w)).toBe('fading')
      await setActive(w, true)
      expect(state(w)).toBe('loading')
      expect(w.classes()).not.toContain('opacity-0')
    })

    it('re-activating during minDuration cancels the pending finish', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 300 } })
      await setActive(w, true)
      await setActive(w, false)
      await setActive(w, true)
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(state(w)).toBe('loading')
    })

    it('a burst of toggles inside the delay never shows', async () => {
      const w = mount(PageLoadingBar)
      for (let i = 0; i < 5; i++) {
        await setActive(w, true)
        vi.advanceTimersByTime(20)
        await setActive(w, false)
      }
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(state(w)).toBe('idle')
    })

    it('stop while already idle or finishing is harmless', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 0 } })
      await setActive(w, false)
      expect(state(w)).toBe('idle')
      await setActive(w, true)
      await setActive(w, false)
      await w.setProps({ active: false })
      expect(state(w)).toBe('finishing')
    })
  })

  describe('cleanup', () => {
    it('clears the pending timer on unmount', () => {
      const w = mount(PageLoadingBar, { props: { active: true } })
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('clears finish and fade timers on unmount', async () => {
      const w = mount(PageLoadingBar, { props: { delay: 0, minDuration: 0 } })
      await setActive(w, true)
      await setActive(w, false)
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('variations', () => {
    it.each([
      ['xs', 'h-0.5'],
      ['sm', 'h-1'],
      ['md', 'h-1.5'],
    ] as const)('size %s', (size, cls) => {
      expect(mount(PageLoadingBar, { props: { size } }).classes()).toContain(cls)
      expect(pageLoadingBarVariants({ size })).toContain(cls)
    })

    it.each([
      ['neutral', 'bg-muted-foreground'],
      ['primary', 'bg-primary'],
      ['success', 'bg-success'],
      ['warning', 'bg-warning'],
      ['danger', 'bg-destructive'],
      ['info', 'bg-info'],
    ] as const)('tone %s', (tone, cls) => {
      expect(fill(mount(PageLoadingBar, { props: { tone } })).classes()).toContain(cls)
      expect(pageLoadingBarFillVariants({ tone })).toContain(cls)
    })

    it('unknown size and tone fall back', () => {
      const w = mount(PageLoadingBar, { props: { size: 'huge' as never, tone: 'pink' as never } })
      expect(w.classes()).toContain('h-1')
      expect(fill(w).classes()).toContain('bg-primary')
    })

    it('class wins and attributes fall through', () => {
      const w = mount(PageLoadingBar, { props: { class: 'z-10' }, attrs: { id: 'bar' } })
      expect(w.classes()).toContain('z-10')
      expect(w.classes()).not.toContain('z-(--z-toast)')
      expect(w.attributes('id')).toBe('bar')
    })
  })
})
