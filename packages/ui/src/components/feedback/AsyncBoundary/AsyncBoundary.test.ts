import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import AsyncBoundary from './AsyncBoundary.vue'
import { describeError, MAX_ERROR_LENGTH } from './describeError'

const tick = async () => {
  for (let i = 0; i < 6; i++) {
    await Promise.resolve()
    await nextTick()
  }
}
const advance = async (ms: number) => {
  vi.advanceTimersByTime(ms)
  await tick()
}
const deferred = <T = unknown>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const CONTENT = '<p data-test="content">Sample content</p>'
const make = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mount(AsyncBoundary, { props: { onRetry: () => {}, ...props }, slots: { default: CONTENT, ...slots } as never })
const shown = (w: VueWrapper) => w.attributes('data-state')
const status = (w: VueWrapper) => w.find('[data-slot="async-boundary-status"]').text()

let wrapper: VueWrapper | undefined
const open = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => (wrapper = make(props, slots))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('AsyncBoundary', () => {
  describe('good path', () => {
    it('shows the content by default, with a hook and no busy flag', () => {
      const w = open()
      expect(w.attributes('data-slot')).toBe('async-boundary')
      expect(shown(w)).toBe('success')
      expect(w.find('[data-test="content"]').exists()).toBe(true)
      expect(w.find('[data-slot="async-boundary-content"]').exists()).toBe(true)
      expect(w.attributes('aria-busy')).toBeUndefined()
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.attributes('data-size')).toBeUndefined()
    })

    it('has one visually hidden polite status region that is empty at first', () => {
      const w = open()
      const region = w.find('[data-slot="async-boundary-status"]')
      expect(region.attributes('role')).toBe('status')
      expect(region.classes()).toContain('sr-only')
      expect(region.text()).toBe('')
    })

    it('loading uses LoadingState with the label and sets aria-busy', () => {
      const w = open({ state: 'loading', loadingLabel: 'Loading invoices' })
      expect(shown(w)).toBe('loading')
      expect(w.attributes('aria-busy')).toBe('true')
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(true)
      expect(w.find('[data-slot="loading-state-label"]').text()).toBe('Loading invoices')
      expect(w.find('[data-test="content"]').exists()).toBe(false)
    })

    it('loadingVariant picks a skeleton', () => {
      const w = open({ state: 'loading', loadingVariant: 'table' })
      expect(w.find('[data-slot="loading-state"]').attributes('data-variant')).toBe('table')
    })

    it('error uses ErrorState with the title, the message and a retry button', async () => {
      const onRetry = vi.fn()
      const w = open({ state: 'error', error: 'The server did not answer.', errorTitle: 'Could not load invoices', onRetry })
      expect(shown(w)).toBe('error')
      expect(w.find('[data-slot="error-state"]').attributes('role')).toBe('alert')
      expect(w.find('[data-slot="error-state-title"]').text()).toBe('Could not load invoices')
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('The server did not answer.')
      await w.find('[data-slot="error-state-retry"]').trigger('click')
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('retryLabel renames the button and retryable=false removes it', () => {
      expect(open({ state: 'error', error: 'x', retryLabel: 'Fetch again' }).find('[data-slot="error-state-retry"]').text()).toContain('Fetch again')
      wrapper?.unmount()
      expect(open({ state: 'error', error: 'x', retryable: false }).find('[data-slot="error-state-retry"]').exists()).toBe(false)
    })

    it('the retry button is a native focusable button', () => {
      const btn = open({ state: 'error', error: 'x' }).find('[data-slot="error-state-retry"]')
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('empty uses EmptyState with title and description', () => {
      const w = open({ state: 'empty', emptyTitle: 'No invoices yet', emptyDescription: 'Issue one first.' })
      expect(shown(w)).toBe('empty')
      expect(w.find('[data-slot="empty-state-title"]').text()).toBe('No invoices yet')
      expect(w.find('[data-slot="empty-state-description"]').text()).toBe('Issue one first.')
      expect(w.find('[data-slot="empty-state-action"]').exists()).toBe(false)
    })

    it('forwards the empty-action slot to the empty state', () => {
      const w = open({ state: 'empty' }, { 'empty-action': '<button data-test="act">Add</button>' })
      expect(w.find('[data-slot="empty-state-action"] [data-test="act"]').exists()).toBe(true)
    })

    it('idle renders the idle slot, or nothing', () => {
      const w = open({ state: 'idle' }, { idle: '<p data-test="idle">Not started</p>' })
      expect(w.find('[data-test="idle"]').exists()).toBe(true)
      expect(w.find('[data-test="content"]').exists()).toBe(false)
      wrapper?.unmount()
      const bare = open({ state: 'idle' })
      expect(bare.find('[data-slot="async-boundary-content"]').exists()).toBe(false)
      expect(bare.find('[data-slot="loading-state"]').exists()).toBe(false)
      expect(shown(bare)).toBe('idle')
    })

    it('slots replace the built-in states', () => {
      const slots = {
        loading: '<p data-test="own-loading">Fetching</p>',
        error: '<p data-test="own-error">Broke</p>',
        empty: '<p data-test="own-empty">Zero</p>',
      }
      const w = open({ state: 'loading' }, slots)
      expect(w.find('[data-test="own-loading"]').exists()).toBe(true)
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(false)
      return Promise.all([w.setProps({ state: 'error' }), w.setProps({ state: 'error' })]).then(async () => {
        await tick()
        expect(w.find('[data-test="own-error"]').exists()).toBe(true)
        expect(w.find('[data-slot="error-state"]').exists()).toBe(false)
        await w.setProps({ state: 'empty' })
        expect(w.find('[data-test="own-empty"]').exists()).toBe(true)
        expect(w.find('[data-slot="empty-state"]').exists()).toBe(false)
      })
    })

    it('the error slot receives the safe message, the raw error and a retry function', async () => {
      const onRetry = vi.fn()
      const err = new Error('Boom')
      let scope: Record<string, unknown> = {}
      const w = open(
        { state: 'error', error: err, onRetry },
        {
          error: (s: Record<string, unknown>) => {
            scope = s
            return h('button', { 'data-test': 'again', onClick: s.retry as () => void }, 'Again')
          },
        },
      )
      expect(scope.message).toBe('Boom')
      expect(scope.error).toBe(err)
      await w.find('[data-test="again"]').trigger('click')
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('following a promise', () => {
    it('pending is loading, fulfilled is the content with its data', async () => {
      const d = deferred<string[]>()
      let seen: unknown
      const w = open({ promise: d.promise }, { default: (s: { data: unknown }) => ((seen = s.data), h('p', { 'data-test': 'content' }, 'ok')) })
      await tick()
      expect(shown(w)).toBe('loading')
      expect(w.attributes('aria-busy')).toBe('true')
      d.resolve(['a', 'b'])
      await tick()
      expect(shown(w)).toBe('success')
      expect(seen).toEqual(['a', 'b'])
      expect(w.attributes('aria-busy')).toBeUndefined()
    })

    it('a rejected promise shows the error message from an Error', async () => {
      const d = deferred()
      const w = open({ promise: d.promise })
      d.reject(new Error('Request timed out'))
      await tick()
      expect(shown(w)).toBe('error')
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('Request timed out')
    })

    it('a rejection with a plain string, an object or nothing still renders a safe error', async () => {
      for (const [reason, expected] of [
        ['plain text', 'plain text'],
        [{ message: 'from object' }, 'from object'],
        [undefined, 'The content could not be loaded.'],
        [{ code: 500 }, 'The content could not be loaded.'],
        [404, '404'],
      ] as const) {
        const w = make({ promise: Promise.reject(reason) })
        await tick()
        expect(w.find('[data-slot="error-state-message"]').text()).toBe(expected)
        w.unmount()
      }
    })

    it('a rejection is not reported to the app error handler or as an unhandled rejection', async () => {
      const errorHandler = vi.fn()
      const w = mount(AsyncBoundary, { props: { promise: Promise.reject(new Error('expected failure')), onRetry: () => {} }, slots: { default: CONTENT }, global: { config: { errorHandler } } })
      await tick()
      expect(shown(w)).toBe('error')
      expect(errorHandler).not.toHaveBeenCalled()
      w.unmount()
    })

    it('an `error` prop wins over the rejection reason', async () => {
      const w = open({ promise: Promise.reject(new Error('from promise')), error: 'from prop' })
      await tick()
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('from prop')
    })

    it('an empty result shows the empty state; isEmpty can change that', async () => {
      for (const value of [[], '', '   ', null, undefined, new Set(), new Map()]) {
        const w = make({ promise: Promise.resolve(value) })
        await tick()
        expect(shown(w), String(value)).toBe('empty')
        w.unmount()
      }
      for (const value of [[0], 'x', 0, false, {}, new Set([1])]) {
        const w = make({ promise: Promise.resolve(value) })
        await tick()
        expect(shown(w), String(value)).toBe('success')
        w.unmount()
      }
      const custom = make({ promise: Promise.resolve({ rows: [] }), isEmpty: (v: unknown) => (v as { rows: unknown[] }).rows.length === 0 })
      await tick()
      expect(shown(custom)).toBe('empty')
      custom.unmount()
      const throwing = make({
        promise: Promise.resolve([]),
        isEmpty: () => {
          throw new Error('bad predicate')
        },
      })
      await tick()
      expect(shown(throwing)).toBe('success')
      throwing.unmount()
    })

    it('null means idle until a promise arrives', async () => {
      const d = deferred()
      const w = open({ promise: null }, { idle: '<p data-test="idle">Not started</p>' })
      expect(shown(w)).toBe('idle')
      await w.setProps({ promise: d.promise })
      await tick()
      expect(shown(w)).toBe('loading')
      d.resolve('x')
      await tick()
      expect(shown(w)).toBe('success')
      await w.setProps({ promise: null })
      expect(shown(w)).toBe('idle')
    })

    it('a value that is not a promise counts as no promise', async () => {
      const w = open({ promise: { not: 'a promise' } as never })
      await tick()
      expect(shown(w)).toBe('success')
    })

    it('follows a thenable', async () => {
      const thenable = { then: (ok: (v: unknown) => void) => setTimeout(() => ok('done'), 10) }
      const w = open({ promise: thenable })
      await tick()
      expect(shown(w)).toBe('loading')
      await advance(10)
      expect(shown(w)).toBe('success')
    })

    it('a thenable that throws becomes an error', async () => {
      const w = open({
        promise: {
          then() {
            throw new Error('thenable broke')
          },
        },
      })
      await tick()
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('thenable broke')
    })

    it('`state` wins over `promise`', async () => {
      const d = deferred()
      const w = open({ promise: d.promise, state: 'empty' })
      await tick()
      expect(shown(w)).toBe('empty')
      d.resolve('x')
      await tick()
      expect(shown(w)).toBe('empty')
    })

    it('a swapped promise: the stale one is ignored when it fulfils later', async () => {
      const first = deferred<string>()
      const second = deferred<string>()
      let seen: unknown
      const w = open({ promise: first.promise }, { default: (s: { data: unknown }) => ((seen = s.data), h('p', 'ok')) })
      await tick()
      await w.setProps({ promise: second.promise })
      await tick()
      expect(shown(w)).toBe('loading')
      first.resolve('stale')
      await tick()
      expect(shown(w)).toBe('loading')
      second.resolve('fresh')
      await tick()
      expect(shown(w)).toBe('success')
      expect(seen).toBe('fresh')
      first.resolve('stale again')
      await tick()
      expect(seen).toBe('fresh')
    })

    it('a swapped promise: the stale one is ignored when it rejects later', async () => {
      const first = deferred()
      const second = deferred<string>()
      const w = open({ promise: first.promise })
      await tick()
      await w.setProps({ promise: second.promise })
      second.resolve('fresh')
      await tick()
      first.reject(new Error('old failure'))
      await tick()
      expect(shown(w)).toBe('success')
      expect(w.find('[data-slot="error-state"]').exists()).toBe(false)
    })

    it('a stale rejection does not hide a newer error and a retry swap goes back to loading', async () => {
      const first = Promise.reject(new Error('first'))
      const w = open({ promise: first })
      await tick()
      expect(shown(w)).toBe('error')
      const second = deferred<string>()
      await w.setProps({ promise: second.promise })
      await tick()
      expect(shown(w)).toBe('loading')
      second.resolve('ok')
      await tick()
      expect(shown(w)).toBe('success')
    })

    it('unmounting mid-flight is safe: a later result changes nothing and throws nothing', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const d = deferred()
      const w = open({ promise: d.promise })
      await tick()
      w.unmount()
      wrapper = undefined
      d.resolve('late')
      await tick()
      expect(warn).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
      warn.mockRestore()
    })

    it('a rejection after unmount does not cause an unhandled rejection', async () => {
      const seen: unknown[] = []
      const on = (e: unknown) => seen.push(e)
      process.on('unhandledRejection', on)
      const d = deferred()
      const w = open({ promise: d.promise })
      await tick()
      w.unmount()
      wrapper = undefined
      d.reject(new Error('late failure'))
      await tick()
      await Promise.resolve()
      process.off('unhandledRejection', on)
      expect(seen).toEqual([])
    })
  })

  describe('delay and minimum time', () => {
    it('the loader appears only after `delay`', async () => {
      const w = open({ state: 'loading', delay: 200 })
      expect(shown(w)).toBe('waiting')
      expect(w.attributes('aria-busy')).toBe('true')
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(false)
      expect(w.find('[data-test="content"]').exists()).toBe(false)
      await advance(199)
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(false)
      await advance(1)
      expect(shown(w)).toBe('loading')
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(true)
    })

    it('a load that ends before the delay never shows the loader and leaves no timer', async () => {
      const w = open({ state: 'loading', delay: 200 })
      await advance(100)
      await w.setProps({ state: 'success' })
      expect(shown(w)).toBe('success')
      expect(vi.getTimerCount()).toBe(0)
      await advance(500)
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(false)
      expect(w.attributes('aria-busy')).toBeUndefined()
    })

    it('a load that fails before the delay shows the error at once', async () => {
      const w = open({ state: 'loading', delay: 200, error: 'x' })
      await w.setProps({ state: 'error' })
      expect(shown(w)).toBe('error')
      expect(vi.getTimerCount()).toBe(0)
    })

    it('finished content stays visible while a delayed reload waits', async () => {
      const w = open({ state: 'success', delay: 300 })
      await w.setProps({ state: 'loading' })
      expect(shown(w)).toBe('success')
      expect(w.find('[data-test="content"]').exists()).toBe(true)
      expect(w.attributes('aria-busy')).toBe('true')
      await advance(300)
      expect(shown(w)).toBe('loading')
    })

    it('an error does not stay on screen while a delayed retry waits', async () => {
      const w = open({ state: 'error', error: 'x', delay: 300 })
      await w.setProps({ state: 'loading' })
      expect(shown(w)).toBe('waiting')
      expect(w.find('[data-slot="error-state"]').exists()).toBe(false)
    })

    it('minDuration keeps a shown loader until the time is up', async () => {
      const w = open({ state: 'loading', minDuration: 500 })
      expect(shown(w)).toBe('loading')
      await advance(100)
      await w.setProps({ state: 'success' })
      expect(shown(w)).toBe('loading')
      expect(w.attributes('aria-busy')).toBe('true')
      await advance(399)
      expect(shown(w)).toBe('loading')
      await advance(1)
      expect(shown(w)).toBe('success')
      expect(w.attributes('aria-busy')).toBeUndefined()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('minDuration counts from when the loader appeared, after the delay', async () => {
      const w = open({ state: 'loading', delay: 100, minDuration: 300 })
      await advance(100)
      expect(shown(w)).toBe('loading')
      await advance(50)
      await w.setProps({ state: 'error', error: 'x' })
      expect(shown(w)).toBe('loading')
      await advance(250)
      expect(shown(w)).toBe('error')
    })

    it('no hold when the minimum has already passed, or is not set', async () => {
      const w = open({ state: 'loading', minDuration: 200 })
      await advance(500)
      await w.setProps({ state: 'success' })
      expect(shown(w)).toBe('success')
      wrapper?.unmount()
      const plain = open({ state: 'loading' })
      await plain.setProps({ state: 'empty' })
      expect(shown(plain)).toBe('empty')
    })

    it('going back to loading during the hold keeps the loader and drops the old timer', async () => {
      const w = open({ state: 'loading', minDuration: 500 })
      await w.setProps({ state: 'success' })
      expect(vi.getTimerCount()).toBe(1)
      await w.setProps({ state: 'loading' })
      expect(vi.getTimerCount()).toBe(0)
      await advance(2000)
      expect(shown(w)).toBe('loading')
    })

    it('the last state wins when the hold ends after several changes', async () => {
      const w = open({ state: 'loading', minDuration: 500 })
      await w.setProps({ state: 'success' })
      await w.setProps({ state: 'error', error: 'x' })
      await w.setProps({ state: 'empty' })
      await advance(500)
      expect(shown(w)).toBe('empty')
      expect(vi.getTimerCount()).toBe(0)
    })

    it('rapid flips between states end on the last one with no leaked timers', async () => {
      const w = open({ state: 'success', delay: 50, minDuration: 100 })
      const order = ['loading', 'error', 'loading', 'success', 'loading', 'empty', 'loading', 'success'] as const
      for (const s of order) await w.setProps({ state: s, error: 'x' })
      await advance(1000)
      expect(shown(w)).toBe('success')
      expect(vi.getTimerCount()).toBe(0)
      for (let i = 0; i < 50; i++) await w.setProps({ state: i % 2 ? 'loading' : 'success' })
      await w.setProps({ state: 'success' })
      await advance(1000)
      expect(shown(w)).toBe('success')
      expect(vi.getTimerCount()).toBe(0)
    })

    it('flips inside one tick are batched', async () => {
      const w = open({ state: 'success' })
      void w.setProps({ state: 'loading' })
      void w.setProps({ state: 'success' })
      await tick()
      expect(shown(w)).toBe('success')
    })

    it('bad timing values count as 0, huge ones are capped at 60 seconds', async () => {
      for (const delay of [-5, Number.NaN, Number.POSITIVE_INFINITY, '200' as never, null as never]) {
        const w = make({ state: 'loading', delay })
        expect(shown(w), String(delay)).toBe('loading')
        w.unmount()
      }
      const w = open({ state: 'loading', delay: 1e12 })
      expect(shown(w)).toBe('waiting')
      await advance(59_999)
      expect(shown(w)).toBe('waiting')
      await advance(1)
      expect(shown(w)).toBe('loading')
    })

    it('all timers are cleared on unmount: waiting, holding and loading', async () => {
      const waiting = open({ state: 'loading', delay: 500 })
      expect(vi.getTimerCount()).toBe(1)
      waiting.unmount()
      expect(vi.getTimerCount()).toBe(0)
      const holding = open({ state: 'loading', minDuration: 500 })
      await holding.setProps({ state: 'success' })
      expect(vi.getTimerCount()).toBe(1)
      holding.unmount()
      wrapper = undefined
      expect(vi.getTimerCount()).toBe(0)
      await advance(1000)
    })

    it('with a delay and a promise that settles first, the loader never appears', async () => {
      const d = deferred<string>()
      const w = open({ promise: d.promise, delay: 300 })
      await tick()
      expect(shown(w)).toBe('waiting')
      await advance(100)
      d.resolve('quick')
      await tick()
      expect(shown(w)).toBe('success')
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('announcements', () => {
    it('announces when a load ends with content, and says nothing while the content is shown', async () => {
      const w = open({ state: 'loading' })
      expect(status(w)).toBe('')
      await w.setProps({ state: 'success' })
      expect(status(w)).toBe('Loaded.')
      await w.setProps({ state: 'loading' })
      expect(status(w)).toBe('')
    })

    it('does not announce first-render content, and not an error that LoadingState/ErrorState announce themselves', async () => {
      const w = open({ state: 'error', error: 'x' })
      expect(status(w)).toBe('')
      await w.setProps({ state: 'loading' })
      expect(status(w)).toBe('')
      expect(w.find('[data-slot="loading-state"]').attributes('role')).toBe('status')
      await w.setProps({ state: 'error' })
      expect(status(w)).toBe('')
      expect(w.find('[data-slot="error-state"]').attributes('role')).toBe('alert')
    })

    it('announces the empty title when a load ends with nothing', async () => {
      const w = open({ state: 'loading', emptyTitle: 'No invoices yet' })
      await w.setProps({ state: 'empty' })
      expect(status(w)).toBe('No invoices yet')
    })

    it('successLabel can be customised or turned off', async () => {
      const w = open({ state: 'loading', successLabel: 'Invoices loaded' })
      await w.setProps({ state: 'success' })
      expect(status(w)).toBe('Invoices loaded')
      wrapper?.unmount()
      const off = open({ state: 'loading', successLabel: '' })
      await off.setProps({ state: 'empty' })
      expect(status(off)).toBe('')
      await off.setProps({ state: 'loading' })
      await off.setProps({ state: 'success' })
      expect(status(off)).toBe('')
    })

    it('does not announce a load that ended before its delay (loader never shown) twice', async () => {
      const w = open({ state: 'loading', delay: 200 })
      await w.setProps({ state: 'success' })
      expect(status(w)).toBe('Loaded.')
      expect(w.find('[data-slot="loading-state"]').exists()).toBe(false)
    })

    it('a custom loading slot and a custom error slot are announced politely', async () => {
      const w = open({ state: 'loading', loadingLabel: 'Loading sample list', error: 'Sample failure', errorTitle: 'Failed' }, { loading: '<p>Fetching</p>', error: '<p>Broke</p>' })
      await w.setProps({ state: 'loading' })
      await w.setProps({ state: 'error' })
      expect(status(w)).toBe('Failed. Sample failure')
      await w.setProps({ state: 'success' })
      expect(status(w)).toBe('')
      const idle = open({ state: 'loading' }, { loading: '<p>Fetching</p>' })
      expect(status(idle)).toBe('')
      await idle.setProps({ state: 'idle' })
      await idle.setProps({ state: 'loading' })
      expect(status(idle)).toBe('Loading…')
    })

    it('the status region is never an ancestor of another live region', () => {
      const w = open({ state: 'loading' })
      const region = w.find('[data-slot="async-boundary-status"]').element
      expect(region.children).toHaveLength(0)
      expect(region.closest('[role="status"], [role="alert"]')).toBe(region)
      expect(w.attributes('role')).toBeUndefined()
    })
  })

  describe('safe error text', () => {
    it('never renders HTML from the error', () => {
      const w = open({ state: 'error', error: '<img src=x onerror=alert(1)><script>alert(1)</script>' })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('script').exists()).toBe(false)
      expect(w.find('[data-slot="error-state-message"]').text()).toContain('<img src=x')
    })

    it('shortens huge text and wraps long words', () => {
      const w = open({ state: 'error', error: 'x'.repeat(100_000) })
      const text = w.find('[data-slot="error-state-message"]').text()
      expect(text.length).toBe(MAX_ERROR_LENGTH)
      expect(text.endsWith('…')).toBe(true)
      expect(w.find('[data-slot="error-state-message"]').classes()).toContain('break-words')
    })

    it('errorMessage replaces the text and moves the real error into the details', () => {
      const w = open({ state: 'error', error: new Error('ECONNRESET at 10.0.0.1'), errorMessage: 'The service is busy.' })
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('The service is busy.')
      expect(w.find('[data-slot="error-state-details"] pre').text()).toBe('ECONNRESET at 10.0.0.1')
    })

    it('errorMessage without an error has no details block', () => {
      const w = open({ state: 'error', errorMessage: 'The service is busy.' })
      expect(w.find('[data-slot="error-state-details"]').exists()).toBe(false)
    })

    it('shows a generic sentence when there is no error to describe', () => {
      expect(open({ state: 'error' }).find('[data-slot="error-state-message"]').text()).toBe('The content could not be loaded.')
      wrapper?.unmount()
      expect(open({ state: 'error', error: null }).find('[data-slot="error-state-message"]').text()).toBe('The content could not be loaded.')
    })

    it('handles right-to-left and unicode text', () => {
      const w = open({ state: 'error', error: 'فشل تحميل البيانات 日本語 ✓' })
      expect(w.find('[data-slot="error-state-message"]').text()).toBe('فشل تحميل البيانات 日本語 ✓')
    })
  })

  describe('describeError', () => {
    it('reads strings, Errors, message objects and primitives', () => {
      expect(describeError('plain')).toBe('plain')
      expect(describeError(new Error('boom'))).toBe('boom')
      expect(describeError(new TypeError('bad type'))).toBe('bad type')
      expect(describeError({ message: 'obj' })).toBe('obj')
      expect(describeError(500)).toBe('500')
      expect(describeError(10n)).toBe('10')
      expect(describeError(false)).toBe('false')
    })

    it('returns an empty string for anything it cannot describe', () => {
      for (const v of [undefined, null, {}, [], Symbol('s'), () => 1, { message: 3 }, new Error('')]) expect(describeError(v)).toBe('')
    })

    it('survives a hostile getter or proxy', () => {
      const getter = {
        get message(): string {
          throw new Error('nope')
        },
      }
      const proxy = new Proxy({}, { get: () => { throw new Error('trap') } })
      expect(describeError(getter)).toBe('')
      expect(describeError(proxy)).toBe('')
    })

    it('removes control characters and bidirectional overrides and collapses whitespace', () => {
      expect(describeError('a\u0000b\u0007c\n\n  d\t e')).toBe('a b c d e')
      expect(describeError('safe‮gnp.exe‬')).toBe('safegnp.exe')
      expect(describeError('⁦hidden⁩')).toBe('hidden')
    })

    it('cuts at the limit without splitting a surrogate pair', () => {
      const out = describeError('😀'.repeat(10), 4)
      expect(out).toBe('😀…')
      expect(describeError('abcdef', 4)).toBe('abc…')
      expect(describeError('abc', 4)).toBe('abc')
      expect(describeError('word  '.repeat(200)).length).toBeLessThanOrEqual(MAX_ERROR_LENGTH)
    })

    it('ignores an unusable limit', () => {
      expect(describeError('x'.repeat(1000), 0).length).toBe(MAX_ERROR_LENGTH)
      expect(describeError('x'.repeat(1000), Number.NaN).length).toBe(MAX_ERROR_LENGTH)
    })
  })

  describe('customisation', () => {
    it('class merges last and wins', () => {
      const w = open({ class: 'zz-custom min-w-full' })
      expect(w.classes()).toContain('zz-custom')
      expect(w.classes()).toContain('min-w-full')
      expect(w.classes()).not.toContain('min-w-0')
    })

    it('attributes fall through to the root', () => {
      const w = open({ id: 'region', 'data-test': 'root', 'aria-label': 'Invoices' } as never)
      expect(w.attributes('id')).toBe('region')
      expect(w.attributes('data-test')).toBe('root')
      expect(w.attributes('aria-label')).toBe('Invoices')
    })

    it('works inside a right-to-left container', () => {
      const Host = defineComponent({ render: () => h('div', { dir: 'rtl' }, h(AsyncBoundary, { state: 'empty', emptyTitle: 'لا توجد بيانات' }, { default: () => 'x' })) })
      const w = mount(Host)
      expect(w.find('[data-slot="empty-state-title"]').text()).toBe('لا توجد بيانات')
      w.unmount()
    })
  })

  describe('bad path', () => {
    it('an unknown state falls back to success', () => {
      expect(shown(open({ state: 'exploded' as never }))).toBe('success')
    })

    it('null state means "not set"', () => {
      expect(shown(open({ state: null as never }))).toBe('success')
    })

    it('an empty default slot renders an empty content wrapper and no error', () => {
      const w = open({}, { default: '' })
      expect(w.find('[data-slot="async-boundary-content"]').exists()).toBe(true)
    })
  })
})
