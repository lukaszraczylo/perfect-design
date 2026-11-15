import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TestimonialSlider from './TestimonialSlider.vue'
import Testimonial from '../Testimonial/Testimonial.vue'
import { mockMatchMedia } from '../shared/testing'

const items = [
  { quote: 'One', author: 'Customer name A' },
  { quote: 'Two', author: 'Customer name B', rating: 4 },
  { quote: 'Three', author: 'Customer name C' },
]

function geometry(el: HTMLElement, g: { scrollLeft: number; clientWidth: number; scrollWidth: number }) {
  for (const [k, v] of Object.entries(g)) Object.defineProperty(el, k, { configurable: true, value: v })
}

afterEach(() => vi.unstubAllGlobals())

describe('TestimonialSlider', () => {
  describe('good path', () => {
    it('renders a labelled carousel region with slides', () => {
      const w = mount(TestimonialSlider, { props: { items } })
      expect(w.attributes('data-slot')).toBe('testimonial-slider')
      expect(w.attributes('role')).toBe('region')
      expect(w.attributes('aria-roledescription')).toBe('carousel')
      expect(w.attributes('aria-label')).toBe('Testimonials')
      const slides = w.findAll('[data-slot="testimonial-slider-slide"]')
      expect(slides).toHaveLength(3)
      expect(slides[1].attributes('role')).toBe('group')
      expect(slides[1].attributes('aria-roledescription')).toBe('slide')
      expect(slides[1].attributes('aria-label')).toBe('2 of 3')
      expect(w.findAllComponents(Testimonial)).toHaveLength(3)
    })
    it('uses CSS scroll-snap on a focusable track', () => {
      const track = mount(TestimonialSlider, { props: { items } }).find('[data-slot="testimonial-slider-track"]')
      expect(track.classes()).toEqual(expect.arrayContaining(['snap-x', 'snap-mandatory', 'overflow-x-auto']))
      expect(track.attributes('tabindex')).toBe('0')
    })
    it('custom label', () => {
      expect(mount(TestimonialSlider, { props: { items, label: 'Reviews' } }).attributes('aria-label')).toBe('Reviews')
    })
    it.each([
      [1, 'basis-full'],
      [2, 'md:basis-[calc(50%-0.5rem)]'],
      [3, 'lg:basis-[calc(33.333%-0.667rem)]'],
    ] as const)('perView %s sets slide basis', (perView, cls) => {
      const w = mount(TestimonialSlider, { props: { items, perView } })
      expect(w.find('[data-slot="testimonial-slider-slide"]').classes()).toContain(cls)
      expect(w.attributes('data-per-view')).toBe(String(perView))
    })
    it.each(['card', 'quote', 'inline', 'with-rating', 'avatar-left', 'featured'] as const)('passes variant %s through', (variant) => {
      const w = mount(TestimonialSlider, { props: { items, variant } })
      expect(w.findAllComponents(Testimonial).every((t) => t.attributes('data-variant') === variant)).toBe(true)
    })
    it('default slot replaces items', () => {
      const w = mount(TestimonialSlider, { slots: { default: '<div id="s" class="snap-start" />' } })
      expect(w.find('#s').exists()).toBe(true)
      expect(w.findAll('[data-slot="testimonial-slider-slide"]')).toHaveLength(0)
    })
  })
  describe('controls', () => {
    it('renders labelled prev/next buttons, aria-disabled (not disabled) when nothing scrolls', () => {
      const w = mount(TestimonialSlider, { props: { items, prevLabel: 'Back', nextLabel: 'Forward' } })
      const prev = w.find('[data-slot="testimonial-slider-prev"]')
      const next = w.find('[data-slot="testimonial-slider-next"]')
      expect(prev.attributes('aria-label')).toBe('Back')
      expect(next.attributes('aria-label')).toBe('Forward')
      expect(prev.attributes('type')).toBe('button')
      expect(prev.attributes('aria-disabled')).toBe('true')
      expect(next.attributes('aria-disabled')).toBe('true')
      // regression: a focused control must never become natively disabled (keyboard focus would drop to the body)
      expect(prev.attributes('disabled')).toBeUndefined()
      expect(next.attributes('disabled')).toBeUndefined()
    })
    it('controls=false hides the buttons', () => {
      expect(mount(TestimonialSlider, { props: { items, controls: false } }).find('[data-slot="testimonial-slider-controls"]').exists()).toBe(false)
    })
    it('scrolls by one page with the buttons and updates state on scroll', async () => {
      mockMatchMedia(false)
      const w = mount(TestimonialSlider, { props: { items } })
      const track = w.find('[data-slot="testimonial-slider-track"]')
      const scrollBy = vi.fn()
      ;(track.element as HTMLElement).scrollBy = scrollBy
      geometry(track.element as HTMLElement, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 })
      await track.trigger('scroll')
      const prev = w.find('[data-slot="testimonial-slider-prev"]')
      const next = w.find('[data-slot="testimonial-slider-next"]')
      expect(prev.attributes('aria-disabled')).toBe('true')
      expect(next.attributes('aria-disabled')).toBeUndefined()
      await next.trigger('click')
      expect(scrollBy).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' })
      geometry(track.element as HTMLElement, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 })
      await track.trigger('scroll')
      expect(prev.attributes('aria-disabled')).toBeUndefined()
      await prev.trigger('click')
      expect(scrollBy).toHaveBeenLastCalledWith({ left: -300, behavior: 'smooth' })
      geometry(track.element as HTMLElement, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 })
      await track.trigger('scroll')
      expect(next.attributes('aria-disabled')).toBe('true')
    })
    it('uses instant scrolling under reduced motion', async () => {
      mockMatchMedia(true)
      const w = mount(TestimonialSlider, { props: { items } })
      const track = w.find('[data-slot="testimonial-slider-track"]')
      const scrollBy = vi.fn()
      ;(track.element as HTMLElement).scrollBy = scrollBy
      geometry(track.element as HTMLElement, { scrollLeft: 0, clientWidth: 100, scrollWidth: 400 })
      await track.trigger('scroll')
      await w.find('[data-slot="testimonial-slider-next"]').trigger('click')
      expect(scrollBy).toHaveBeenCalledWith({ left: 100, behavior: 'auto' })
    })
    it('arrow keys scroll and prevent default; other keys are ignored', async () => {
      const w = mount(TestimonialSlider, { props: { items } })
      const track = w.find('[data-slot="testimonial-slider-track"]')
      const scrollBy = vi.fn()
      ;(track.element as HTMLElement).scrollBy = scrollBy
      geometry(track.element as HTMLElement, { scrollLeft: 0, clientWidth: 250, scrollWidth: 900 })
      const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true })
      track.element.dispatchEvent(right)
      expect(right.defaultPrevented).toBe(true)
      expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: 250 }))
      await track.trigger('keydown', { key: 'ArrowLeft' })
      expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -250 }))
      const before = scrollBy.mock.calls.length
      await track.trigger('keydown', { key: 'Enter' })
      expect(scrollBy.mock.calls).toHaveLength(before)
    })
    it('does not crash when scrollBy is unavailable (jsdom)', async () => {
      const w = mount(TestimonialSlider, { props: { items } })
      const track = w.find('[data-slot="testimonial-slider-track"]')
      geometry(track.element as HTMLElement, { scrollLeft: 0, clientWidth: 100, scrollWidth: 400 })
      await track.trigger('scroll')
      await w.find('[data-slot="testimonial-slider-next"]').trigger('click')
      expect(w.exists()).toBe(true)
    })
    it('rapid next/prev clicks each scroll once', async () => {
      const w = mount(TestimonialSlider, { props: { items } })
      const track = w.find('[data-slot="testimonial-slider-track"]')
      const scrollBy = vi.fn()
      ;(track.element as HTMLElement).scrollBy = scrollBy
      geometry(track.element as HTMLElement, { scrollLeft: 100, clientWidth: 100, scrollWidth: 900 })
      await track.trigger('scroll')
      for (let n = 0; n < 20; n++) await w.find(n % 2 ? '[data-slot="testimonial-slider-prev"]' : '[data-slot="testimonial-slider-next"]').trigger('click')
      expect(scrollBy).toHaveBeenCalledTimes(20)
    })
  })
  describe('accessibility regressions', () => {
    it('the track is a named group and focusable; the live status region is polite and visually hidden', () => {
      const w = mount(TestimonialSlider, { props: { items, slidesLabel: 'Alle Folien' } })
      const track = w.find('[data-slot="testimonial-slider-track"]')
      expect(track.attributes('role')).toBe('group')
      expect(track.attributes('aria-label')).toBe('Alle Folien')
      const status = w.find('[data-slot="testimonial-slider-status"]')
      expect(status.attributes('role')).toBe('status')
      expect(status.attributes('aria-live')).toBe('polite')
      expect(status.classes()).toContain('sr-only')
      expect(status.text()).toBe('')
    })
    it('slide and status labels are localisable templates', () => {
      const w = mount(TestimonialSlider, { props: { items, slideLabel: 'Folie {n} von {total}' } })
      expect(w.findAll('[data-slot="testimonial-slider-slide"]')[2].attributes('aria-label')).toBe('Folie 3 von 3')
    })
    describe('status announcements after scrolling settles', () => {
      function setup() {
        vi.useFakeTimers()
        const w = mount(TestimonialSlider, { props: { items, statusLabel: 'Slide {n} of {total}' }, attachTo: document.body })
        const track = w.find('[data-slot="testimonial-slider-track"]').element as HTMLElement
        const slides = Array.from(track.children) as HTMLElement[]
        const place = (current: number) => {
          vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 300, width: 300, top: 0, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) })
          slides.forEach((s, i) => vi.spyOn(s, 'getBoundingClientRect').mockReturnValue({ left: (i - current) * 300, right: (i - current) * 300 + 300, width: 300, top: 0, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }))
        }
        return { w, track, place }
      }
      afterEach(() => vi.useRealTimers())
      it('stays silent on load, announces "Slide 2 of 3" only after the scroll settles on another slide', async () => {
        const { w, track, place } = setup()
        const status = w.find('[data-slot="testimonial-slider-status"]')
        expect(status.text()).toBe('')
        place(1)
        geometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 })
        track.dispatchEvent(new Event('scroll'))
        await vi.advanceTimersByTimeAsync(50)
        expect(status.text()).toBe('')
        await vi.advanceTimersByTimeAsync(200)
        expect(status.text()).toBe('Slide 2 of 3')
        w.unmount()
      })
      it('scrollend settles immediately and an unchanged slide announces nothing new', async () => {
        const { w, track, place } = setup()
        place(2)
        track.dispatchEvent(new Event('scrollend'))
        await w.vm.$nextTick()
        const status = w.find('[data-slot="testimonial-slider-status"]')
        expect(status.text()).toBe('Slide 3 of 3')
        w.vm.$el.querySelector('[data-slot="testimonial-slider-status"]').textContent = ''
        track.dispatchEvent(new Event('scrollend'))
        await w.vm.$nextTick()
        expect(status.text()).toBe('')
        w.unmount()
      })
      it('measures from the right edge in RTL', async () => {
        const { w, track } = setup()
        track.style.direction = 'rtl'
        vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 300, width: 300, top: 0, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) })
        Array.from(track.children).forEach((s, i) => vi.spyOn(s as HTMLElement, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 300 - (i - 1) * 300, width: 300, top: 0, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }))
        track.dispatchEvent(new Event('scrollend'))
        await w.vm.$nextTick()
        expect(w.find('[data-slot="testimonial-slider-status"]').text()).toBe('Slide 2 of 3')
        w.unmount()
      })
    })
    it('RTL: next scrolls left, previous right, the chevrons mirror and negative scrollLeft still enables the buttons', async () => {
      const w = mount(TestimonialSlider, { props: { items }, attachTo: document.body })
      const track = w.find('[data-slot="testimonial-slider-track"]').element as HTMLElement
      track.style.direction = 'rtl'
      const scrollBy = vi.fn()
      track.scrollBy = scrollBy
      geometry(track, { scrollLeft: -300, clientWidth: 300, scrollWidth: 900 })
      track.dispatchEvent(new Event('scroll'))
      await nextTick()
      const prev = w.find('[data-slot="testimonial-slider-prev"]')
      const next = w.find('[data-slot="testimonial-slider-next"]')
      expect(prev.attributes('aria-disabled')).toBeUndefined()
      expect(next.attributes('aria-disabled')).toBeUndefined()
      await next.trigger('click')
      expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -300 }))
      await prev.trigger('click')
      expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: 300 }))
      expect(prev.find('svg').classes()).toContain('rtl:-scale-x-100')
      expect(next.find('svg').classes()).toContain('rtl:-scale-x-100')
      w.unmount()
    })
    it('clicking an aria-disabled control does nothing', async () => {
      const w = mount(TestimonialSlider, { props: { items } })
      const track = w.find('[data-slot="testimonial-slider-track"]').element as HTMLElement
      const scrollBy = vi.fn()
      track.scrollBy = scrollBy
      await w.find('[data-slot="testimonial-slider-prev"]').trigger('click')
      await w.find('[data-slot="testimonial-slider-next"]').trigger('click')
      expect(scrollBy).not.toHaveBeenCalled()
    })
    it('arrow keys pressed on a nested control are not hijacked', async () => {
      const w = mount(TestimonialSlider, { slots: { default: '<div class="snap-start"><button id="inner">x</button></div>' }, attachTo: document.body })
      const track = w.find('[data-slot="testimonial-slider-track"]').element as HTMLElement
      const scrollBy = vi.fn()
      track.scrollBy = scrollBy
      const e = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      document.getElementById('inner')!.dispatchEvent(e)
      expect(e.defaultPrevented).toBe(false)
      expect(scrollBy).not.toHaveBeenCalled()
      w.unmount()
    })
    it('uses the card radius on the focus ring and no hidden-scrollbar text content', () => {
      const w = mount(TestimonialSlider, { props: { items } })
      expect(w.find('[data-slot="testimonial-slider-track"]').classes()).toContain('rounded-lg')
      expect(w.html()).not.toContain('rounded-xl')
    })
    it('buttons keep the 44px coarse-pointer target from Button icon size', () => {
      const w = mount(TestimonialSlider, { props: { items } })
      expect(w.find('[data-slot="testimonial-slider-next"]').classes()).toContain('pointer-coarse:size-11')
    })
  })
  describe('resize handling and cleanup', () => {
    it('observes the track with ResizeObserver and disconnects on unmount', async () => {
      const disconnect = vi.fn()
      const observe = vi.fn()
      let cb: () => void = () => {}
      class FakeRO {
        constructor(c: () => void) {
          cb = c
        }
        observe = observe
        disconnect = disconnect
      }
      vi.stubGlobal('ResizeObserver', FakeRO)
      const w = mount(TestimonialSlider, { props: { items } })
      expect(observe).toHaveBeenCalledTimes(1)
      geometry(w.find('[data-slot="testimonial-slider-track"]').element as HTMLElement, { scrollLeft: 0, clientWidth: 100, scrollWidth: 500 })
      cb()
      await nextTick()
      expect(w.find('[data-slot="testimonial-slider-next"]').attributes('aria-disabled')).toBeUndefined()
      w.unmount()
      expect(disconnect).toHaveBeenCalledTimes(1)
      expect(() => cb()).not.toThrow() // a late callback after unmount is harmless
    })
  })
  describe('customisation', () => {
    it('merges class and attrs', () => {
      const w = mount(TestimonialSlider, { props: { items, class: 'gap-1 custom' }, attrs: { id: 's' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-4')
      expect(w.attributes('id')).toBe('s')
    })
  })
  describe('bad path', () => {
    it('empty items render an empty track and inert controls', () => {
      const w = mount(TestimonialSlider, { props: { items: [] } })
      expect(w.findAll('[data-slot="testimonial-slider-slide"]')).toHaveLength(0)
      expect(w.find('[data-slot="testimonial-slider-next"]').attributes('aria-disabled')).toBe('true')
    })
    it('invalid perView falls back to 1; unknown variant to card', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(TestimonialSlider, { props: { items, perView: 5, variant: 'zzz' } })
      expect(w.attributes('data-per-view')).toBe('1')
      expect(w.findComponent(Testimonial).attributes('data-variant')).toBe('card')
    })
  })
  describe('edge cases', () => {
    it('one slide and 100 slides', () => {
      expect(mount(TestimonialSlider, { props: { items: [items[0]] } }).findAll('[data-slot="testimonial-slider-slide"]')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ quote: `q${i}`, author: 'Same' }))
      const w = mount(TestimonialSlider, { props: { items: many } })
      expect(w.findAll('[data-slot="testimonial-slider-slide"]')[99].attributes('aria-label')).toBe('100 of 100')
    })
    it('very long unicode quote', () => {
      expect(mount(TestimonialSlider, { props: { items: [{ quote: '😀'.repeat(3000) }] } }).find('blockquote').text().length).toBeGreaterThan(3000)
    })
  })
})
