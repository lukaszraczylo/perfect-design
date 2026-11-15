import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import ToastItem from './ToastItem.vue'
import { toastProgressVariants } from './variants'

function fakeAnimation(state = 'running') {
  const a = {
    playState: state,
    cancel: vi.fn(),
    pause: vi.fn(() => {
      a.playState = 'paused'
    }),
    play: vi.fn(() => {
      a.playState = 'running'
    }),
  }
  return a
}
const protoAnimate = (HTMLElement.prototype as { animate?: unknown }).animate
const protoMatchMedia = window.matchMedia
afterEach(() => {
  ;(HTMLElement.prototype as { animate?: unknown }).animate = protoAnimate
  window.matchMedia = protoMatchMedia
  vi.restoreAllMocks()
})
function mockAnimate() {
  const anims: ReturnType<typeof fakeAnimation>[] = []
  const animate = vi.fn(() => {
    const a = fakeAnimation()
    anims.push(a)
    return a
  })
  ;(HTMLElement.prototype as { animate?: unknown }).animate = animate
  return { animate, anims }
}

const VARIANTS = ['default', 'success', 'warning', 'danger', 'info'] as const

describe('ToastItem', () => {
  describe('good path', () => {
    it('renders title and description', () => {
      const w = mount(ToastItem, { props: { title: 'Saved', description: 'All changes stored' } })
      expect(w.attributes('data-slot')).toBe('toast')
      expect(w.find('[data-slot="toast-title"]').text()).toBe('Saved')
      expect(w.find('[data-slot="toast-description"]').text()).toBe('All changes stored')
    })

    it.each(VARIANTS)('renders %s variant with an icon', (variant) => {
      const w = mount(ToastItem, { props: { title: 't', variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.find('[data-slot="toast-icon"] svg').exists()).toBe(true)
    })

    it('uses role=status for calm variants and role=alert for urgent ones', () => {
      for (const v of ['default', 'success', 'info'] as const) expect(mount(ToastItem, { props: { title: 't', variant: v } }).attributes('role')).toBe('status')
      for (const v of ['warning', 'danger'] as const) expect(mount(ToastItem, { props: { title: 't', variant: v } }).attributes('role')).toBe('alert')
    })

    it('dismiss button emits dismiss', async () => {
      const w = mount(ToastItem, { props: { title: 't' } })
      await w.find('[data-slot="toast-dismiss"]').trigger('click')
      expect(w.emitted('dismiss')).toHaveLength(1)
    })

    it('action button calls onClick, then emits action and dismiss', async () => {
      const onClick = vi.fn()
      const w = mount(ToastItem, { props: { title: 't', action: { label: 'Undo', onClick } } })
      const btn = w.find('[data-slot="toast-action"]')
      expect(btn.text()).toBe('Undo')
      await btn.trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(w.emitted('action')).toHaveLength(1)
      expect(w.emitted('dismiss')).toHaveLength(1)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(ToastItem, { props: { title: 't', class: 'p-8 mine' }, attrs: { id: 'x', 'data-k': 'v' } })
      expect(w.classes()).toContain('mine')
      expect(w.classes()).toContain('p-8')
      expect(w.classes()).not.toContain('p-4')
      expect(w.attributes('id')).toBe('x')
    })

    it('custom dismiss label', () => {
      const w = mount(ToastItem, { props: { title: 't', dismissLabel: 'Close' } })
      expect(w.find('[data-slot="toast-dismiss"]').attributes('aria-label')).toBe('Close')
    })
  })

  describe('bad path', () => {
    it('unknown variant falls back to default', () => {
      const w = mount(ToastItem, { props: { title: 't', variant: 'nope' as never } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('role')).toBe('status')
    })

    it('still dismisses when the action handler throws', async () => {
      const errorHandler = vi.fn()
      const boom = new Error('boom')
      const w = mount(ToastItem, {
        props: { title: 't', action: { label: 'Go', onClick: () => { throw boom } } },
        global: { config: { errorHandler } },
      })
      await w.find('[data-slot="toast-action"]').trigger('click')
      expect(errorHandler).toHaveBeenCalledWith(boom, expect.anything(), expect.anything())
      expect(w.emitted('action')).toHaveLength(1)
      expect(w.emitted('dismiss')).toHaveLength(1)
    })

    it('omits description and action when absent', () => {
      const w = mount(ToastItem, { props: { title: 't' } })
      expect(w.find('[data-slot="toast-description"]').exists()).toBe(false)
      expect(w.find('[data-slot="toast-action"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('very long and unicode text', () => {
      const long = 'w'.repeat(3000)
      const w = mount(ToastItem, { props: { title: `${long} 🎉`, description: 'עברית 日本語' } })
      expect(w.find('[data-slot="toast-title"]').text()).toContain(long)
      expect(w.find('[data-slot="toast-description"]').text()).toContain('עברית')
    })

    it('escapes html in the title', () => {
      const w = mount(ToastItem, { props: { title: '<img src=x onerror=alert(1)>' } })
      expect(w.find('img').exists()).toBe(false)
    })
  })

  describe('icon options', () => {
    it('default usage keeps the icon', () => {
      expect(mount(ToastItem, { props: { title: 't' } }).find('[data-slot="toast-icon"] svg').exists()).toBe(true)
    })

    it('hideIcon renders no icon element for any variant', () => {
      for (const variant of VARIANTS) {
        const w = mount(ToastItem, { props: { title: 't', variant, hideIcon: true, description: 'd' } })
        expect(w.find('[data-slot="toast-icon"]').exists()).toBe(false)
        expect(w.find('[data-slot="toast-title"]').text()).toBe('t')
        expect(w.find('[data-slot="toast-dismiss"]').exists()).toBe(true)
      }
    })

    it('a custom icon replaces the variant icon and keeps the variant colour', () => {
      const w = mount(ToastItem, { props: { title: 't', variant: 'success', icon: faBell } })
      expect(w.find('[data-slot="toast-icon"] svg path').attributes('d')).toBe(faBell.icon[4])
      expect(w.find('[data-slot="toast-icon"]').classes()).toContain('text-success')
      expect(mount(ToastItem, { props: { title: 't', variant: 'success' } }).find('svg path').attributes('d')).not.toBe(faBell.icon[4])
    })

    it('hideIcon wins over a custom icon', () => {
      expect(mount(ToastItem, { props: { title: 't', icon: faBell, hideIcon: true } }).find('[data-slot="toast-icon"]').exists()).toBe(false)
    })
  })

  describe('progress countdown', () => {
    it('is off by default (no DOM change)', () => {
      expect(mount(ToastItem, { props: { title: 't', duration: 1000 } }).find('[data-slot="toast-progress"]').exists()).toBe(false)
    })

    it('renders an aria-hidden, reduced-motion-hidden bar when progress and a finite duration are set', () => {
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      const track = w.find('[data-slot="toast-progress"]')
      expect(track.exists()).toBe(true)
      expect(track.attributes('aria-hidden')).toBe('true')
      expect(track.classes()).toContain('motion-reduce:hidden')
      expect(w.find('[data-slot="toast-progress-bar"]').exists()).toBe(true)
    })

    it.each([[undefined], [0], [-5], [Number.NaN], [Infinity]])('renders no bar for duration=%s', (duration) => {
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration } })
      expect(w.find('[data-slot="toast-progress"]').exists()).toBe(false)
    })

    it.each(VARIANTS)('bar uses the %s tone token', (variant) => {
      const w = mount(ToastItem, { props: { title: 't', variant, progress: true, duration: 1000 } })
      const cls = w.find('[data-slot="toast-progress-bar"]').classes()
      expect(cls).toEqual(expect.arrayContaining(toastProgressVariants({ variant }).split(' ')))
    })

    it('starts a linear scaleX(1 -> 0) animation over `duration` and cancels it on unmount', async () => {
      const { animate, anims } = mockAnimate()
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      expect(animate).toHaveBeenCalledTimes(1)
      const [keyframes, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions]
      expect(keyframes).toEqual([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }])
      expect(options).toMatchObject({ duration: 4000, easing: 'linear', fill: 'forwards' })
      expect(anims[0].pause).not.toHaveBeenCalled()
      w.unmount()
      expect(anims[0].cancel).toHaveBeenCalledTimes(1)
    })

    it('does not animate without progress', () => {
      const { animate } = mockAnimate()
      mount(ToastItem, { props: { title: 't', duration: 4000 } })
      expect(animate).not.toHaveBeenCalled()
    })

    it('pauses and resumes with `paused`', async () => {
      const { anims } = mockAnimate()
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      await w.setProps({ paused: true })
      expect(anims[0].pause).toHaveBeenCalledTimes(1)
      await w.setProps({ paused: false })
      expect(anims[0].play).toHaveBeenCalledTimes(1)
    })

    it('starts paused when mounted paused', () => {
      const { anims } = mockAnimate()
      mount(ToastItem, { props: { title: 't', progress: true, duration: 4000, paused: true } })
      expect(anims[0].pause).toHaveBeenCalledTimes(1)
    })

    it('never restarts a running or finished animation when unpausing', async () => {
      const { anims } = mockAnimate()
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      await w.setProps({ paused: true })
      anims[0].playState = 'finished'
      await w.setProps({ paused: false })
      expect(anims[0].play).not.toHaveBeenCalled()
    })

    it('restarts when the duration changes and stops when progress is turned off', async () => {
      const { animate, anims } = mockAnimate()
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      await w.setProps({ duration: 1000 })
      await nextTick()
      expect(animate).toHaveBeenCalledTimes(2)
      expect(anims[0].cancel).toHaveBeenCalled()
      expect((animate.mock.calls[1] as unknown as [unknown, KeyframeAnimationOptions])[1].duration).toBe(1000)
      await w.setProps({ progress: false })
      await nextTick()
      expect(anims[1].cancel).toHaveBeenCalled()
      expect(w.find('[data-slot="toast-progress"]').exists()).toBe(false)
    })

    it('starts the animation when progress is switched on later', async () => {
      const { animate } = mockAnimate()
      const w = mount(ToastItem, { props: { title: 't', duration: 2000 } })
      await w.setProps({ progress: true })
      await nextTick()
      expect(animate).toHaveBeenCalledTimes(1)
    })

    it('skips the animation under prefers-reduced-motion', () => {
      const { animate } = mockAnimate()
      window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      expect(animate).not.toHaveBeenCalled()
      expect(w.find('[data-slot="toast-progress"]').classes()).toContain('motion-reduce:hidden')
    })

    it('animates when reduced motion is not requested', () => {
      const { animate } = mockAnimate()
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never
      mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      expect(animate).toHaveBeenCalledTimes(1)
    })

    it('degrades to a static bar when Element.animate is unsupported', async () => {
      ;(HTMLElement.prototype as { animate?: unknown }).animate = undefined
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000 } })
      expect(w.find('[data-slot="toast-progress-bar"]').exists()).toBe(true)
      await w.setProps({ paused: true })
      await w.setProps({ paused: false })
      expect(() => w.unmount()).not.toThrow()
    })

    it('works with the action and dismiss buttons and leaves their behaviour intact', async () => {
      mockAnimate()
      const onClick = vi.fn()
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000, action: { label: 'Undo', onClick } } })
      await w.find('[data-slot="toast-action"]').trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(w.emitted('dismiss')).toHaveLength(1)
    })

    it('class override still works with progress enabled', () => {
      const w = mount(ToastItem, { props: { title: 't', progress: true, duration: 4000, class: 'p-8' } })
      expect(w.classes()).toContain('p-8')
      expect(w.classes()).not.toContain('p-4')
    })
  })

describe('ToastItem live region ownership', () => {
  it('is its own live region by default and drops the role when announce is off', () => {
    expect(mount(ToastItem, { props: { title: 'x' } }).attributes('role')).toBe('status')
    expect(mount(ToastItem, { props: { title: 'x', variant: 'danger' } }).attributes('role')).toBe('alert')
    const quiet = mount(ToastItem, { props: { title: 'x', variant: 'danger', announce: false } })
    expect(quiet.attributes('role')).toBeUndefined()
    expect(quiet.attributes('aria-atomic')).toBeUndefined()
  })

  it('dismiss target is 28px, 40px on coarse pointers, and placed with logical properties', () => {
    const cls = mount(ToastItem, { props: { title: 'x' } }).find('[data-slot="toast-dismiss"]').classes()
    expect(cls).toEqual(expect.arrayContaining(['size-7', 'pointer-coarse:size-10', 'end-2']))
  })
})
})
