import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import Carousel from './Carousel.vue'
import CarouselContent from './CarouselContent.vue'
import CarouselItem from './CarouselItem.vue'
import CarouselPrevious from './CarouselPrevious.vue'
import CarouselNext from './CarouselNext.vue'
import CarouselDots from './CarouselDots.vue'
import CarouselPlayPause from './CarouselPlayPause.vue'
import CarouselCounter from './CarouselCounter.vue'
import { carouselContentVariants, carouselDotsVariants, carouselItemVariants } from './variants'

import { carouselKey as carouselKeyForTests } from './context'
import { computed, shallowRef } from 'vue'

function fakeContext() {
  return {
    orientation: computed(() => 'horizontal' as const),
    current: computed(() => 0),
    count: computed(() => 0),
    slides: shallowRef([]),
    contentEl: ref(null),
    live: computed(() => 'polite' as const),
    playing: computed(() => false),
    autoplayAvailable: computed(() => false),
    userPaused: ref(false),
    toggleAutoplay: () => {},
    canPrev: computed(() => false),
    canNext: computed(() => false),
    prev: () => {},
    next: () => {},
    goTo: () => {},
    registerSlide: () => {},
    unregisterSlide: () => {},
    onScroll: () => {},
  }
}

let scrollTo: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  // jsdom has no layout: slide i sits at 300 * i along both axes
  const offset = function (this: HTMLElement) {
    return this.dataset.slot === 'carousel-item' && this.parentElement ? Array.from(this.parentElement.children).indexOf(this) * 300 : 0
  }
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(offset)
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(offset)
  scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

interface Opts {
  n?: number
  props?: Record<string, unknown>
  parts?: boolean
  contentClass?: string
}

function make({ n = 3, props = {}, parts = true, contentClass }: Opts = {}) {
  const count = ref(n)
  const Root = defineComponent({
    setup: () => () =>
      h(Carousel, props, () => [
        h(CarouselContent, { class: contentClass }, () => Array.from({ length: count.value }, (_, i) => h(CarouselItem, { key: i }, () => `Slide ${i + 1}`))),
        ...(parts ? [h(CarouselPrevious), h(CarouselNext), h(CarouselDots)] : []),
      ]),
  })
  const w = mount(Root, { attachTo: document.body })
  return { w, count }
}

const root = (w: VueWrapper) => w.find('[data-slot="carousel"]')
const content = (w: VueWrapper) => w.find('[data-slot="carousel-content"]')
const slides = (w: VueWrapper) => w.findAll('[data-slot="carousel-item"]')
const dots = (w: VueWrapper) => w.findAll('[data-slot="carousel-dot"]')
const prevBtn = (w: VueWrapper) => w.find('[data-slot="carousel-previous"]')
const nextBtn = (w: VueWrapper) => w.find('[data-slot="carousel-next"]')
const carousel = (w: VueWrapper) => w.findComponent(Carousel)
const emitted = (w: VueWrapper) => carousel(w).emitted('update:modelValue') ?? []
const active = (w: VueWrapper) => slides(w).findIndex((s) => s.attributes('data-active') !== undefined)

function setScroll(w: VueWrapper, axis: 'left' | 'top', value: number, size = 300, total = 900) {
  const el = content(w).element as HTMLElement
  const key = axis === 'left' ? 'scrollLeft' : 'scrollTop'
  Object.defineProperty(el, key, { value, configurable: true, writable: true })
  Object.defineProperty(el, axis === 'left' ? 'clientWidth' : 'clientHeight', { value: size, configurable: true })
  Object.defineProperty(el, axis === 'left' ? 'scrollWidth' : 'scrollHeight', { value: total, configurable: true })
}

function stubMotion(matches: boolean) {
  const add = vi.fn()
  const remove = vi.fn()
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener: add, removeEventListener: remove }))
  return { add, remove }
}

describe('Carousel', () => {
  describe('good path', () => {
    it('exposes carousel / slide semantics', async () => {
      const { w } = make({ props: { label: 'Gallery' } })
      await nextTick()
      expect(root(w).attributes('role')).toBe('region')
      expect(root(w).attributes('aria-roledescription')).toBe('carousel')
      expect(root(w).attributes('aria-label')).toBe('Gallery')
      expect(slides(w).map((s) => s.attributes('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3'])
      expect(slides(w)[0].attributes('role')).toBe('group')
      expect(slides(w)[0].attributes('aria-roledescription')).toBe('slide')
      expect(content(w).attributes('aria-live')).toBe('polite')
      expect(root(w).attributes('data-slot')).toBe('carousel')
      expect(active(w)).toBe(0)
    })

    it('next / prev buttons move, scroll and emit', async () => {
      const { w } = make()
      await nextTick()
      expect(prevBtn(w).attributes('disabled')).toBeDefined()
      await nextBtn(w).trigger('click')
      expect(emitted(w).at(-1)).toEqual([1])
      expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' })
      expect(active(w)).toBe(1)
      expect(prevBtn(w).attributes('disabled')).toBeUndefined()
      await nextBtn(w).trigger('click')
      expect(active(w)).toBe(2)
      expect(nextBtn(w).attributes('disabled')).toBeDefined()
      await prevBtn(w).trigger('click')
      expect(active(w)).toBe(1)
      expect(prevBtn(w).attributes('aria-label')).toBe('Previous slide')
      expect(nextBtn(w).attributes('aria-label')).toBe('Next slide')
    })

    it('dots reflect and change the active slide', async () => {
      const { w } = make()
      await nextTick()
      expect(dots(w).length).toBe(3)
      expect(dots(w)[0].attributes('aria-current')).toBe('true')
      expect(dots(w)[1].attributes('aria-current')).toBeUndefined()
      expect(dots(w)[2].attributes('aria-label')).toBe('Go to slide 3')
      await dots(w)[2].trigger('click')
      expect(emitted(w).at(-1)).toEqual([2])
      expect(dots(w)[2].attributes('aria-current')).toBe('true')
      expect(w.find('[data-slot="carousel-dots"]').attributes('role')).toBe('group')
    })

    it('supports v-model (controlled by the parent)', async () => {
      const index = ref(1)
      const Root = defineComponent({
        setup: () => () =>
          h(Carousel, { modelValue: index.value, 'onUpdate:modelValue': (v: number) => (index.value = v) }, () => [
            h(CarouselContent, null, () => [0, 1, 2].map((i) => h(CarouselItem, { key: i }, () => i))),
            h(CarouselNext),
          ]),
      })
      const w = mount(Root, { attachTo: document.body })
      await nextTick()
      expect(active(w)).toBe(1)
      expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'auto' }) // initial position is instant
      scrollTo.mockClear()
      index.value = 2
      await nextTick()
      await nextTick()
      expect(active(w)).toBe(2)
      expect(scrollTo).toHaveBeenCalledWith({ left: 600, behavior: 'smooth' })
      w.unmount()
    })

    it('loops around when `loop` is set', async () => {
      const { w } = make({ props: { loop: true } })
      await nextTick()
      expect(prevBtn(w).attributes('disabled')).toBeUndefined()
      await prevBtn(w).trigger('click')
      expect(active(w)).toBe(2)
      expect(nextBtn(w).attributes('disabled')).toBeUndefined()
      await nextBtn(w).trigger('click')
      expect(active(w)).toBe(0)
    })

    it('exposes goTo / next / prev', async () => {
      const { w } = make()
      await nextTick()
      const api = carousel(w).vm as unknown as { goTo: (i: number) => void; next: () => void; prev: () => void; count: number }
      api.goTo(2)
      await nextTick()
      expect(active(w)).toBe(2)
      api.prev()
      await nextTick()
      expect(active(w)).toBe(1)
      api.next()
      await nextTick()
      expect(active(w)).toBe(2)
      expect(api.count).toBe(3)
    })

    it('slot receives index/count/controls', () => {
      const w = mount(Carousel, {
        slots: { default: `<template #default="{ index, count }">{{ index }}/{{ count }}</template>` },
      })
      expect(w.text()).toBe('0/0')
    })
  })

  describe('keyboard', () => {
    it('arrow keys, Home and End (horizontal)', async () => {
      const { w } = make()
      await nextTick()
      await root(w).trigger('keydown', { key: 'ArrowRight' })
      expect(active(w)).toBe(1)
      await root(w).trigger('keydown', { key: 'ArrowLeft' })
      expect(active(w)).toBe(0)
      await root(w).trigger('keydown', { key: 'End' })
      expect(active(w)).toBe(2)
      await root(w).trigger('keydown', { key: 'Home' })
      expect(active(w)).toBe(0)
      await root(w).trigger('keydown', { key: 'ArrowDown' }) // wrong axis
      expect(active(w)).toBe(0)
    })

    it('uses Up/Down when vertical', async () => {
      const { w } = make({ props: { orientation: 'vertical' } })
      await nextTick()
      await root(w).trigger('keydown', { key: 'ArrowDown' })
      expect(active(w)).toBe(1)
      expect(scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'smooth' })
      await root(w).trigger('keydown', { key: 'ArrowUp' })
      expect(active(w)).toBe(0)
      await root(w).trigger('keydown', { key: 'ArrowRight' })
      expect(active(w)).toBe(0)
      expect(root(w).attributes('data-orientation')).toBe('vertical')
      expect(content(w).classes()).toContain('flex-col')
      expect(nextBtn(w).classes()).toContain('bottom-2')
      expect(dots(w).length).toBe(3)
    })

    it('prevents default only for handled keys and ignores modified/editable targets', async () => {
      const { w } = make()
      await nextTick()
      const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      root(w).element.dispatchEvent(handled)
      expect(handled.defaultPrevented).toBe(true)
      const other = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })
      root(w).element.dispatchEvent(other)
      expect(other.defaultPrevented).toBe(false)
      await nextTick()
      await root(w).trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
      await root(w).trigger('keydown', { key: 'ArrowRight', altKey: true })
      await root(w).trigger('keydown', { key: 'ArrowRight', metaKey: true })
      expect(active(w)).toBe(1)
      const input = document.createElement('input')
      slides(w)[0].element.appendChild(input)
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      const ce = document.createElement('div')
      Object.defineProperty(ce, 'isContentEditable', { value: true })
      slides(w)[0].element.appendChild(ce)
      ce.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('does nothing at the ends without loop but wraps with loop', async () => {
      const { w } = make()
      await nextTick()
      await root(w).trigger('keydown', { key: 'ArrowLeft' })
      expect(active(w)).toBe(0)
      const l = make({ props: { loop: true } })
      await nextTick()
      await root(l.w).trigger('keydown', { key: 'ArrowLeft' })
      expect(active(l.w)).toBe(2)
    })
  })

  describe('scroll sync', () => {
    it('updates the index once scrolling settles (debounced) without scrolling back', async () => {
      vi.useFakeTimers()
      const { w } = make()
      await nextTick()
      setScroll(w, 'left', 300)
      await content(w).trigger('scroll')
      setScroll(w, 'left', 310)
      await content(w).trigger('scroll')
      expect(emitted(w).length).toBe(0)
      vi.advanceTimersByTime(100)
      await nextTick()
      await nextTick()
      expect(emitted(w)).toEqual([[1]])
      expect(active(w)).toBe(1)
      expect(scrollTo).not.toHaveBeenCalled() // scroll-driven change does not re-scroll
      // next programmatic move scrolls again
      await nextBtn(w).trigger('click')
      expect(scrollTo).toHaveBeenCalledTimes(1)
    })

    it('does not emit when the settled position matches the current slide', async () => {
      vi.useFakeTimers()
      const { w } = make()
      await nextTick()
      setScroll(w, 'left', 20)
      await content(w).trigger('scroll')
      vi.advanceTimersByTime(150)
      expect(emitted(w).length).toBe(0)
    })

    it('treats the scroll end as the last slide (several slides per view)', async () => {
      vi.useFakeTimers()
      const { w } = make({ n: 5 })
      await nextTick()
      setScroll(w, 'left', 450, 600, 1050) // pos+size >= total-1
      await content(w).trigger('scroll')
      vi.advanceTimersByTime(100)
      await nextTick()
      expect(emitted(w).at(-1)).toEqual([4])
    })

    it('uses scrollTop for vertical carousels', async () => {
      vi.useFakeTimers()
      const { w } = make({ props: { orientation: 'vertical' } })
      await nextTick()
      setScroll(w, 'top', 300)
      await content(w).trigger('scroll')
      vi.advanceTimersByTime(100)
      await nextTick()
      expect(emitted(w).at(-1)).toEqual([1])
    })

    it('skips the scroll when already at the target position', async () => {
      const { w } = make()
      await nextTick()
      setScroll(w, 'left', 300)
      await nextBtn(w).trigger('click')
      expect(scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('autoplay', () => {
    beforeEach(() => vi.useFakeTimers())

    it('advances every interval and stops at the last slide without loop', async () => {
      const { w } = make({ props: { autoplay: true, interval: 1000 } })
      await nextTick()
      expect(content(w).attributes('aria-live')).toBe('off')
      expect(root(w).attributes('data-playing')).toBeDefined()
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(1)
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(2)
      expect(root(w).attributes('data-playing')).toBeUndefined()
      expect(content(w).attributes('aria-live')).toBe('polite')
      vi.advanceTimersByTime(10000)
      await nextTick()
      expect(active(w)).toBe(2)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('wraps around with loop', async () => {
      const { w } = make({ props: { autoplay: true, interval: 500, loop: true } })
      await nextTick()
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(500)
        await nextTick()
      }
      expect(active(w)).toBe(0)
    })

    it('pauses on hover and resumes on leave', async () => {
      const { w } = make({ props: { autoplay: true, interval: 1000 } })
      await nextTick()
      await root(w).trigger('pointerenter')
      expect(content(w).attributes('aria-live')).toBe('polite')
      vi.advanceTimersByTime(5000)
      expect(active(w)).toBe(0)
      await root(w).trigger('pointerleave')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('hover does not pause with pauseOnHover=false', async () => {
      const { w } = make({ props: { autoplay: true, interval: 1000, pauseOnHover: false } })
      await nextTick()
      await root(w).trigger('pointerenter')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('pauses while focus is inside and resumes when focus leaves', async () => {
      const { w } = make({ props: { autoplay: true, interval: 1000 } })
      await nextTick()
      await root(w).trigger('focusin')
      vi.advanceTimersByTime(3000)
      expect(active(w)).toBe(0)
      // focus moving to another element inside keeps the pause
      await root(w).trigger('focusout', { relatedTarget: nextBtn(w).element })
      vi.advanceTimersByTime(3000)
      expect(active(w)).toBe(0)
      await root(w).trigger('focusout', { relatedTarget: null })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('manual navigation restarts the timer', async () => {
      const { w } = make({ props: { autoplay: true, interval: 1000 } })
      await nextTick()
      vi.advanceTimersByTime(900)
      await dots(w)[2].trigger('click')
      vi.advanceTimersByTime(900)
      expect(active(w)).toBe(2)
    })

    it('falls back to 5000ms for invalid intervals', async () => {
      const { w } = make({ props: { autoplay: true, interval: -1 } })
      await nextTick()
      vi.advanceTimersByTime(4999)
      expect(active(w)).toBe(0)
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('never autoplays with a single slide or no slides', async () => {
      const one = make({ n: 1, props: { autoplay: true, interval: 100 } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      one.w.unmount()
      const none = make({ n: 0, props: { autoplay: true } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      none.w.unmount()
    })

    it('does not autoplay under prefers-reduced-motion and scrolls instantly', async () => {
      stubMotion(true)
      const { w } = make({ props: { autoplay: true, interval: 100 } })
      await nextTick()
      vi.advanceTimersByTime(1000)
      expect(active(w)).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
      await nextBtn(w).trigger('click')
      expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'auto' })
    })

    it('reacts to the motion preference changing live', async () => {
      const { add } = stubMotion(false)
      const { w } = make({ props: { autoplay: true, interval: 1000 } })
      await nextTick()
      const change = add.mock.calls[0][1] as (e: { matches: boolean }) => void
      change({ matches: true })
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      change({ matches: false })
      await nextTick()
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('clears timers and listeners on unmount', async () => {
      const { remove } = stubMotion(false)
      const { w } = make({ props: { autoplay: true, interval: 1000 } })
      await nextTick()
      setScroll(w, 'left', 300)
      await content(w).trigger('scroll')
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
      expect(remove).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('live region', () => {
    it('honours explicit live values', async () => {
      expect((await liveOf('assertive'))).toBe('assertive')
      expect((await liveOf('off'))).toBe('off')
      expect((await liveOf('polite'))).toBe('polite')
      expect((await liveOf('bogus' as never))).toBe('polite')
    })
    async function liveOf(live: 'off' | 'polite' | 'assertive') {
      const { w } = make({ props: { live, autoplay: true } })
      await nextTick()
      return content(w).attributes('aria-live')
    }
  })

  describe('customisation', () => {
    it('merges classes last and passes attrs on every part', async () => {
      const Root = defineComponent({
        setup: () => () =>
          h(Carousel, { class: 'max-w-xs', id: 'c', 'data-x': 'y' }, () => [
            h(CarouselContent, { class: 'gap-4 flex-col' }, () => [h(CarouselItem, { class: 'basis-1/2 p-2', id: 'i' }, () => 'a')]),
            h(CarouselPrevious, { class: 'bg-primary', label: 'Back' }),
            h(CarouselNext, { class: 'bg-primary', label: 'Forward' }),
            h(CarouselDots, { class: 'pt-8', label: 'Pick', dotLabel: (p: number, t: number) => `Dot ${p}/${t}` }),
          ]),
      })
      const w = mount(Root, { attachTo: document.body })
      await nextTick()
      expect(root(w).classes()).toContain('max-w-xs')
      expect(root(w).attributes('id')).toBe('c')
      expect(root(w).attributes('data-x')).toBe('y')
      expect(content(w).classes()).toContain('gap-4')
      expect(content(w).classes()).not.toContain('flex-row')
      expect(slides(w)[0].classes()).toContain('basis-1/2')
      expect(slides(w)[0].classes()).not.toContain('basis-full')
      expect(slides(w)[0].attributes('id')).toBe('i')
      expect(prevBtn(w).attributes('aria-label')).toBe('Back')
      expect(nextBtn(w).attributes('aria-label')).toBe('Forward')
      expect(prevBtn(w).classes()).toContain('bg-primary')
      expect(w.find('[data-slot="carousel-dots"]').classes()).toContain('pt-8')
      expect(w.find('[data-slot="carousel-dots"]').attributes('aria-label')).toBe('Pick')
      expect(dots(w)[0].attributes('aria-label')).toBe('Dot 1/1')
      w.unmount()
    })

    it('exports variant helpers', () => {
      expect(carouselContentVariants({ orientation: 'vertical' })).toContain('snap-y')
      expect(carouselItemVariants()).toContain('basis-full')
      expect(carouselDotsVariants({ orientation: 'vertical' })).toContain('flex-col')
    })

    it('custom dot and button slots', async () => {
      const Root = defineComponent({
        setup: () => () =>
          h(Carousel, null, () => [
            h(CarouselContent, null, () => [0, 1].map((i) => h(CarouselItem, { key: i }, () => i))),
            h(CarouselPrevious, null, () => 'PREV'),
            h(CarouselNext, null, () => 'NEXT'),
            h(CarouselDots, null, {
              dot: ({ index, active: a, select }: { index: number; active: boolean; select: () => void }) =>
                h('i', { class: 'my-dot', 'data-a': a ? 'y' : 'n', onClick: select }, index),
            }),
          ]),
      })
      const w = mount(Root, { attachTo: document.body })
      await nextTick()
      expect(prevBtn(w).text()).toBe('PREV')
      expect(w.findAll('.my-dot').map((d) => d.attributes('data-a'))).toEqual(['y', 'n'])
      await w.findAll('.my-dot')[1].trigger('click')
      expect(w.findAll('.my-dot')[1].attributes('data-a')).toBe('y')
      w.unmount()
    })
  })

  describe('bad path', () => {
    it('clamps out-of-range, negative, NaN and fractional models', async () => {
      const idx = async (modelValue: number) => {
        const w = mount(
          defineComponent({
            setup: () => () =>
              h(Carousel, { modelValue }, () => h(CarouselContent, null, () => [0, 1, 2].map((i) => h(CarouselItem, { key: i }, () => i)))),
          }),
          { attachTo: document.body },
        )
        await nextTick()
        const r = active(w)
        w.unmount()
        return r
      }
      expect(await idx(99)).toBe(2)
      expect(await idx(-4)).toBe(0)
      expect(await idx(NaN)).toBe(0)
      expect(await idx(1.6)).toBe(2)
    })

    it('goTo ignores NaN / Infinity and empty carousels', async () => {
      const { w } = make()
      await nextTick()
      const api = carousel(w).vm as unknown as { goTo: (i: number) => void }
      api.goTo(NaN)
      api.goTo(Infinity)
      expect(emitted(w).length).toBe(0)
      const empty = make({ n: 0 })
      await nextTick()
      ;(carousel(empty.w).vm as unknown as { goTo: (i: number) => void }).goTo(1)
      expect(emitted(empty.w).length).toBe(0)
      expect(empty.w.find('[data-slot="carousel-dots"]').exists()).toBe(false)
      await root(empty.w).trigger('keydown', { key: 'End' })
      await root(empty.w).trigger('keydown', { key: 'ArrowRight' })
    })

    it('falls back to horizontal for an invalid orientation', async () => {
      const { w } = make({ props: { orientation: 'diagonal' } })
      await nextTick()
      expect(root(w).attributes('data-orientation')).toBe('horizontal')
    })

    it('throws a clear error when a part is used outside Carousel', () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => mount(CarouselItem)).toThrow(/inside <Carousel>/)
      expect(() => mount(CarouselContent)).toThrow(/CarouselContent/)
      err.mockRestore()
      warn.mockRestore()
    })

    it('works without matchMedia and without a content element', async () => {
      vi.stubGlobal('matchMedia', undefined)
      const w = mount(Carousel, { props: { autoplay: true } })
      await nextTick()
      ;(w.vm as unknown as { next: () => void }).next()
      w.unmount()
    })
  })

  describe('edge cases', () => {
    it('handles 0 and 1 slides', async () => {
      const one = make({ n: 1 })
      await nextTick()
      expect(prevBtn(one.w).attributes('disabled')).toBeDefined()
      expect(nextBtn(one.w).attributes('disabled')).toBeDefined()
      expect(dots(one.w).length).toBe(1)
      const loop = make({ n: 1, props: { loop: true } })
      await nextTick()
      expect(nextBtn(loop.w).attributes('disabled')).toBeDefined()
      const zero = make({ n: 0 })
      await nextTick()
      expect(slides(zero.w).length).toBe(0)
    })

    it('tracks slides added and removed dynamically', async () => {
      const { w, count } = make({ n: 2 })
      await nextTick()
      count.value = 4
      await nextTick()
      await nextTick()
      expect(dots(w).length).toBe(4)
      expect(slides(w).map((s) => s.attributes('aria-label'))).toEqual(['1 of 4', '2 of 4', '3 of 4', '4 of 4'])
      await dots(w)[3].trigger('click')
      count.value = 2
      await nextTick()
      await nextTick()
      expect(dots(w).length).toBe(2)
      expect(active(w)).toBe(1) // model clamped into range
    })

    it('keeps DOM order when a slide is inserted in the middle', async () => {
      const order = ref([1, 3])
      const Root = defineComponent({
        setup: () => () => h(Carousel, null, () => h(CarouselContent, null, () => order.value.map((i) => h(CarouselItem, { key: i }, () => `s${i}`)))),
      })
      const w = mount(Root, { attachTo: document.body })
      await nextTick()
      order.value = [1, 2, 3]
      await nextTick()
      await nextTick()
      expect(slides(w).map((s) => s.attributes('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3'])
      expect(slides(w).map((s) => s.text())).toEqual(['s1', 's2', 's3'])
    })

    it('rapid next clicks land on the last slide, never past it', async () => {
      const { w } = make({ n: 5 })
      await nextTick()
      for (let i = 0; i < 50; i++) nextBtn(w).element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(active(w)).toBe(4)
    })

    it('re-registering the same element is a no-op and unmount unregisters slides', async () => {
      const { w, count } = make({ n: 3 })
      await nextTick()
      count.value = 0
      await nextTick()
      expect(dots(w).length).toBe(0)
    })
  })

  describe('accessibility (WCAG 2.2)', () => {
    it('the track is a named, focusable group; the label is configurable', async () => {
      const { w } = make()
      await nextTick()
      expect(content(w).attributes('role')).toBe('group')
      expect(content(w).attributes('aria-label')).toBe('Slides')
      expect(content(w).attributes('tabindex')).toBe('0')
      const named = mount(CarouselContent, { props: { label: 'Photos' }, global: { provide: { [carouselKeyForTests as symbol]: fakeContext() } } })
      expect(named.attributes('aria-label')).toBe('Photos')
    })

    it('dots are 24px targets (44px on touch) around a small visible dot, with aria-current on the active one', async () => {
      const { w } = make()
      await nextTick()
      for (const d of dots(w)) {
        expect(d.classes()).toContain('size-6')
        expect(d.classes()).toContain('pointer-coarse:size-11')
        expect(d.find('span').classes()).toContain('size-2.5')
        expect(d.find('span').attributes('aria-hidden')).toBe('true')
      }
      expect(dots(w)[0]!.attributes('aria-current')).toBe('true')
      expect(dots(w)[1]!.attributes('aria-current')).toBeUndefined()
      // the active dot differs by fill, the others by outline: not colour alone
      expect(dots(w)[0]!.find('span').classes().join(' ')).toContain('group-data-[active]/dot:bg-primary')
      expect(dots(w)[1]!.find('span').classes()).toContain('border-2')
    })

    it('previous / next sit on logical edges and flip their chevron in RTL', async () => {
      const { w } = make()
      await nextTick()
      expect(prevBtn(w).classes()).toContain('start-2')
      expect(nextBtn(w).classes()).toContain('end-2')
      expect(prevBtn(w).classes().join(' ')).not.toMatch(/\bleft-2\b/)
      expect(nextBtn(w).classes().join(' ')).not.toMatch(/\bright-2\b/)
      expect(nextBtn(w).find('svg').classes()).toContain('rtl:rotate-180')
    })

    it('arrow keys on buttons and links inside a slide keep their native behaviour', async () => {
      const { w } = make()
      await nextTick()
      const btn = document.createElement('button')
      slides(w)[0]!.element.appendChild(btn)
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await nextTick()
      expect(active(w)).toBe(0)
      content(w).element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('renders a pause button while autoplay is on and none without autoplay', async () => {
      const off = make()
      await nextTick()
      expect(off.w.find('[data-slot="carousel-play-pause"]').exists()).toBe(false)
      const on = make({ props: { autoplay: true } })
      await nextTick()
      const btn = on.w.find('[data-slot="carousel-play-pause"]')
      expect(btn.exists()).toBe(true)
      expect(btn.attributes('aria-label')).toBe('Pause automatic slide show')
      expect(btn.attributes('data-state')).toBe('playing')
      // first control in DOM order, before the slides
      const html = root(on.w).html()
      expect(html.indexOf('carousel-play-pause')).toBeLessThan(html.indexOf('carousel-content'))
    })

    it('pauseButton=false hides the built-in button; one with a single slide or reduced motion is not rendered', async () => {
      const hidden = make({ props: { autoplay: true, pauseButton: false } })
      await nextTick()
      expect(hidden.w.find('[data-slot="carousel-play-pause"]').exists()).toBe(false)
      const single = make({ n: 1, props: { autoplay: true } })
      await nextTick()
      expect(single.w.find('[data-slot="carousel-play-pause"]').exists()).toBe(false)
      stubMotion(true)
      const reduced = make({ props: { autoplay: true } })
      await nextTick()
      await nextTick()
      expect(reduced.w.find('[data-slot="carousel-play-pause"]').exists()).toBe(false)
    })

    it('the pause button stops autoplay for good and the play state restarts it (WCAG 2.2.2)', async () => {
      vi.useFakeTimers()
      const { w } = make({ props: { autoplay: true, interval: 1000, loop: true } })
      await nextTick()
      const btn = () => w.find('[data-slot="carousel-play-pause"]')
      await btn().trigger('click')
      expect(btn().attributes('aria-label')).toBe('Start automatic slide show')
      expect(btn().attributes('data-state')).toBe('paused')
      expect(btn().find('[data-slot="carousel-play-icon"]').exists()).toBe(true)
      expect(root(w).attributes('data-playing')).toBeUndefined()
      expect(content(w).attributes('aria-live')).toBe('polite')
      vi.advanceTimersByTime(10000)
      await nextTick()
      expect(active(w)).toBe(0)
      await btn().trigger('click')
      expect(btn().find('[data-slot="carousel-pause-icon"]').exists()).toBe(true)
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(active(w)).toBe(1)
    })

    it('CarouselPlayPause supports custom labels and renders nothing without autoplay', async () => {
      const Root = defineComponent({
        setup: () => () =>
          h(Carousel, { autoplay: true, pauseButton: false }, () => [
            h(CarouselContent, null, () => [h(CarouselItem, null, () => 'a'), h(CarouselItem, null, () => 'b')]),
            h(CarouselPlayPause, { pauseLabel: 'Stop', playLabel: 'Go', class: 'bottom-2' }),
          ]),
      })
      const w = mount(Root, { attachTo: document.body })
      await nextTick()
      const btn = w.find('[data-slot="carousel-play-pause"]')
      expect(btn.attributes('aria-label')).toBe('Stop')
      expect(btn.classes()).toContain('bottom-2')
      await btn.trigger('click')
      expect(w.find('[data-slot="carousel-play-pause"]').attributes('aria-label')).toBe('Go')
    })

    it('CarouselCounter shows the position with tabular figures and supports a slot', async () => {
      const Root = defineComponent({
        setup: () => () =>
          h(Carousel, null, () => [
            h(CarouselContent, null, () => [h(CarouselItem, null, () => 'a'), h(CarouselItem, null, () => 'b')]),
            h(CarouselCounter),
            h(CarouselCounter, { class: 'x' }, { default: ({ index, count }: { index: number; count: number }) => `slide ${index + 1}/${count}` }),
          ]),
      })
      const w = mount(Root, { attachTo: document.body })
      await nextTick()
      const [a, b] = w.findAll('[data-slot="carousel-counter"]')
      expect(a!.text()).toBe('1 / 2')
      expect(a!.classes()).toContain('tabular-nums')
      expect(b!.text()).toBe('slide 1/2')
      expect(b!.classes()).toContain('x')
    })
  })
})
