import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SectionReveal from './SectionReveal.vue'
import { SECTION_REVEAL_DISTANCES, SECTION_REVEAL_EFFECTS, SECTION_REVEAL_SPEEDS, sectionRevealVariants } from './variants'
import { installIntersectionObserver, mockMatchMedia } from '../shared/testing'

let io: ReturnType<typeof installIntersectionObserver>
let w: VueWrapper | undefined
beforeEach(() => {
  io = installIntersectionObserver()
  mockMatchMedia(false)
})
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.unstubAllGlobals()
})

/** Mount enabled; jsdom reports a zero-height box, so the content starts hidden below the fold. */
async function hidden(props: Record<string, unknown> = {}) {
  w = mount(SectionReveal, { props: { enabled: true, ...props }, slots: { default: '<p>Sample</p>' } })
  await nextTick()
  return w
}
async function shown(props: Record<string, unknown> = {}) {
  await hidden(props)
  io[0].fire(true)
  await nextTick()
  return w!
}

describe('SectionReveal variations', () => {
  describe('defaults are unchanged', () => {
    it('hidden state is fade-up, md distance, normal speed', async () => {
      await hidden()
      expect([...w!.classes()].sort()).toEqual(['duration-700', 'ease-out', 'motion-reduce:transition-none', 'opacity-0', 'transition-[opacity,translate]', 'translate-y-4'].sort())
      expect(w!.attributes('data-effect')).toBe('fade-up')
      expect(w!.attributes('data-distance')).toBe('md')
      expect(w!.attributes('data-speed')).toBe('normal')
    })
    it('revealed state is the original translate-y-0 opacity-100', async () => {
      await shown()
      expect([...w!.classes()].sort()).toEqual(['duration-700', 'ease-out', 'motion-reduce:transition-none', 'opacity-100', 'transition-[opacity,translate]', 'translate-y-0'].sort())
    })
    it('disabled stays a plain wrapper even with the new props set', () => {
      w = mount(SectionReveal, { props: { effect: 'slide-left', distance: 'lg', speed: 'slow' }, slots: { default: 'x' } })
      expect(w.classes()).toEqual([])
      expect(w.attributes('data-effect')).toBeUndefined()
      expect(w.attributes('data-distance')).toBeUndefined()
      expect(w.attributes('data-speed')).toBeUndefined()
      expect(io).toHaveLength(0)
    })
  })

  describe('effect', () => {
    it.each([
      ['fade-up', 'translate-y-4', 'translate-y-0'],
      ['fade-down', '-translate-y-4', 'translate-y-0'],
      ['slide-left', '-translate-x-4', 'translate-x-0'],
      ['slide-right', 'translate-x-4', 'translate-x-0'],
    ] as const)('%s hides with %s and settles on %s', async (effect, hiddenCls, shownCls) => {
      await hidden({ effect })
      expect(w!.classes()).toEqual(expect.arrayContaining([hiddenCls, 'opacity-0']))
      expect(w!.attributes('data-effect')).toBe(effect)
      io[0].fire(true)
      await nextTick()
      expect(w!.classes()).toEqual(expect.arrayContaining([shownCls, 'opacity-100']))
      expect(w!.classes()).not.toContain(hiddenCls)
      expect(w!.classes()).not.toContain('opacity-0')
    })
    it('fade only changes opacity, in both states', async () => {
      await hidden({ effect: 'fade' })
      expect(w!.classes().filter((c) => c.includes('translate-') && c !== 'transition-[opacity,translate]')).toEqual([])
      expect(w!.classes()).toContain('opacity-0')
      io[0].fire(true)
      await nextTick()
      expect(w!.classes()).toContain('opacity-100')
    })
    it('slide effects use the x axis only and fade effects the y axis only', async () => {
      for (const effect of ['slide-left', 'slide-right'] as const) {
        await hidden({ effect })
        expect(w!.classes().join(' ')).not.toMatch(/translate-y/)
        w!.unmount()
      }
      for (const effect of ['fade-up', 'fade-down'] as const) {
        await hidden({ effect })
        expect(w!.classes().join(' ')).not.toMatch(/translate-x/)
        w!.unmount()
      }
      w = undefined
    })
    it('an unknown effect falls back to fade-up', async () => {
      await hidden({ effect: 'zoom' })
      expect(w!.attributes('data-effect')).toBe('fade-up')
      expect(w!.classes()).toContain('translate-y-4')
    })
    it('no effect scales, rotates or blurs', async () => {
      for (const effect of SECTION_REVEAL_EFFECTS) {
        await hidden({ effect, distance: 'lg' })
        expect(w!.classes().join(' ')).not.toMatch(/scale|rotate|blur|skew/)
        w!.unmount()
      }
      w = undefined
    })
  })

  describe('distance', () => {
    it.each([
      ['sm', 'translate-y-2'],
      ['md', 'translate-y-4'],
      ['lg', 'translate-y-8'],
    ] as const)('%s offsets fade-up by %s', async (distance, cls) => {
      await hidden({ distance })
      expect(w!.classes()).toContain(cls)
      expect(w!.classes().filter((c) => /^-?translate-y-\d/.test(c))).toEqual([cls])
      expect(w!.attributes('data-distance')).toBe(distance)
    })
    it.each([
      ['slide-left', 'sm', '-translate-x-2'],
      ['slide-left', 'lg', '-translate-x-8'],
      ['slide-right', 'sm', 'translate-x-2'],
      ['slide-right', 'lg', 'translate-x-8'],
      ['fade-down', 'lg', '-translate-y-8'],
    ] as const)('%s at %s uses %s', async (effect, distance, cls) => {
      await hidden({ effect, distance })
      expect(w!.classes()).toContain(cls)
    })
    it('fade ignores distance', async () => {
      await hidden({ effect: 'fade', distance: 'lg' })
      expect(w!.classes()).toContain('opacity-0')
      expect(w!.classes().join(' ')).not.toMatch(/translate-[xy]-/)
    })
    it('the revealed state does not depend on distance', async () => {
      for (const distance of SECTION_REVEAL_DISTANCES) {
        await shown({ distance })
        expect(w!.classes()).toEqual(expect.arrayContaining(['translate-y-0', 'opacity-100']))
        expect(w!.classes().join(' ')).not.toMatch(/translate-y-[2-8]/)
        w!.unmount()
        io.length = 0
      }
      w = undefined
    })
    it('an unknown distance falls back to md', async () => {
      await hidden({ distance: 'xl' })
      expect(w!.attributes('data-distance')).toBe('md')
      expect(w!.classes()).toContain('translate-y-4')
    })
  })

  describe('speed', () => {
    it.each([
      ['fast', 'duration-300'],
      ['normal', 'duration-700'],
      ['slow', 'duration-1000'],
    ] as const)('%s uses %s as the only duration', async (speed, cls) => {
      await hidden({ speed })
      expect(w!.classes().filter((c) => c.startsWith('duration-'))).toEqual([cls])
      expect(w!.attributes('data-speed')).toBe(speed)
    })
    it('an unknown speed falls back to normal', async () => {
      await hidden({ speed: 'instant' })
      expect(w!.classes()).toContain('duration-700')
      expect(w!.attributes('data-speed')).toBe('normal')
    })
    it('delay still sets transition-delay with any speed', async () => {
      await hidden({ speed: 'fast', delay: 120 })
      expect(w!.attributes('style')).toContain('transition-delay: 120ms')
    })
  })

  describe('combinations and overrides', () => {
    it.each(SECTION_REVEAL_EFFECTS.flatMap((effect) => SECTION_REVEAL_SPEEDS.map((speed) => [effect, speed] as const)))('effect %s with speed %s has one duration, one opacity state and at most one offset', async (effect, speed) => {
      await hidden({ effect, speed, distance: 'sm' })
      const cls = w!.classes()
      expect(cls.filter((c) => c.startsWith('duration-'))).toHaveLength(1)
      expect(cls.filter((c) => /^opacity-/.test(c))).toEqual(['opacity-0'])
      expect(cls.filter((c) => /^-?translate-[xy]-/.test(c)).length).toBeLessThanOrEqual(1)
    })
    it('the class prop wins over the speed duration and the offset', async () => {
      await hidden({ speed: 'slow', effect: 'slide-right', distance: 'lg', class: 'duration-150 translate-x-1 custom' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['duration-150', 'translate-x-1', 'custom']))
      expect(w!.classes()).not.toContain('duration-1000')
      expect(w!.classes()).not.toContain('translate-x-8')
    })
    it('once=false re-hides with the same offset and re-reveals', async () => {
      await hidden({ effect: 'slide-left', once: false })
      io[0].fire(true)
      await nextTick()
      expect(w!.classes()).toContain('translate-x-0')
      io[0].fire(false)
      await nextTick()
      expect(w!.classes()).toContain('-translate-x-4')
      io[0].fire(true)
      await nextTick()
      expect(w!.classes()).toContain('translate-x-0')
      expect(w!.emitted('reveal')).toHaveLength(2)
    })
    it('as and slot content work with the new effects', async () => {
      await hidden({ as: 'section', effect: 'slide-right' })
      expect(w!.element.tagName).toBe('SECTION')
      expect(w!.text()).toBe('Sample')
    })
  })

  describe('reduced motion, no layout shift and robustness', () => {
    it('reduced motion shows every effect immediately and never observes', () => {
      mockMatchMedia(true)
      for (const effect of SECTION_REVEAL_EFFECTS) {
        w = mount(SectionReveal, { props: { enabled: true, effect, distance: 'lg', speed: 'slow' } })
        expect(w.attributes('data-revealed')).toBe('true')
        expect(w.classes()).toContain('opacity-100')
        expect(w.classes()).toContain('motion-reduce:transition-none')
        expect(w.classes().join(' ')).not.toMatch(/-translate-|translate-[xy]-[1-9]/)
        w.unmount()
      }
      w = undefined
      expect(io).toHaveLength(0)
    })
    it('without IntersectionObserver every effect stays visible', () => {
      vi.stubGlobal('IntersectionObserver', undefined)
      w = mount(SectionReveal, { props: { enabled: true, effect: 'slide-left' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['translate-x-0', 'opacity-100']))
    })
    it('only opacity and translate are animated, never a layout property', async () => {
      await hidden({ effect: 'slide-right' })
      expect(w!.classes()).toContain('transition-[opacity,translate]')
      expect(w!.classes().join(' ')).not.toMatch(/\b(w|h|m[trblxy]?|p[trblxy]?|top|left|right|bottom|ms|me)-\d/)
    })
    it('the wrapper adds no role, tab stop or aria-hidden in any state', async () => {
      await hidden({ effect: 'slide-left' })
      for (const attr of ['role', 'tabindex', 'aria-hidden']) expect(w!.attributes(attr)).toBeUndefined()
      io[0].fire(true)
      await nextTick()
      for (const attr of ['role', 'tabindex', 'aria-hidden']) expect(w!.attributes(attr)).toBeUndefined()
    })
  })

  describe('cva helper', () => {
    it('sectionRevealVariants() equals the revealed fade-up default', () => {
      expect(sectionRevealVariants()).toBe(sectionRevealVariants({ effect: 'fade-up', distance: 'md', speed: 'normal', revealed: true }))
      expect(sectionRevealVariants()).toContain('translate-y-0 opacity-100')
    })
    it('uses tokens only: no arbitrary values (the transition property list aside), gradients or shadows', () => {
      const all = SECTION_REVEAL_EFFECTS.flatMap((effect) =>
        SECTION_REVEAL_DISTANCES.flatMap((distance) => [true, false].map((revealed) => sectionRevealVariants({ effect, distance, revealed }))),
      ).join(' ')
      expect(all.replaceAll('transition-[opacity,translate]', '')).not.toMatch(/\[|gradient|blur|shadow|scale/)
    })
  })
})
