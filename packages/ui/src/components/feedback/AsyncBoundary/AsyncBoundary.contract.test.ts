import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import AsyncBoundary from './AsyncBoundary.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = (root: () => unknown) => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  errors.length = 0
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body },
  )
  return settle()
}
const spyError = () => vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

async function expectRule(bad: () => unknown, message: string, good: Array<() => unknown>) {
  await open(bad)
  expect(errors, `bad usage should throw: ${message}`).toHaveLength(1)
  expect(errors[0].name).toBe('ContractError')
  expect(errors[0].message).toContain(message)
  for (const ok of good) {
    await open(ok)
    expect(errors).toEqual([])
  }
  const spy = spyError()
  configureStrictMode('warn')
  await open(bad)
  expect(errors).toEqual([])
  expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain(message)
  spy.mockClear()
  configureStrictMode('off')
  await open(bad)
  expect(errors).toEqual([])
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
  configureStrictMode('throw')
}

describe('AsyncBoundary contract', () => {
  it('requires the default slot (the content shown on success)', () =>
    expectRule(() => h(AsyncBoundary, { retryable: false }), 'AsyncBoundary: requires the default slot', [
      () => h(AsyncBoundary, { retryable: false }, () => 'Invoices'),
      () => h(AsyncBoundary, { retryable: false, state: 'loading' }, { default: () => 'Invoices' }),
    ]))

  it('requires a retry handler while the retry button is on', () =>
    expectRule(() => h(AsyncBoundary, null, () => 'Invoices'), 'AsyncBoundary: requires an `@retry` handler', [
      () => h(AsyncBoundary, { onRetry: () => {} }, () => 'Invoices'),
      () => h(AsyncBoundary, { retryable: false }, () => 'Invoices'),
      () => h(AsyncBoundary, null, { default: () => 'Invoices', error: () => 'Own error with its own button' }),
    ]))

  it('reports both mistakes together', async () => {
    await open(() => h(AsyncBoundary))
    expect(errors.map((e) => e.message).join('\n')).toContain('requires the default slot')
  })

  it('checks at mount, so a boundary that starts loading is checked too', () =>
    expectRule(() => h(AsyncBoundary, { state: 'loading' }, () => 'Invoices'), 'AsyncBoundary: requires an `@retry` handler', [
      () => h(AsyncBoundary, { state: 'loading', onRetry: () => {} }, () => 'Invoices'),
    ]))

  it('does not throw during render: the component still renders without the handler', async () => {
    configureStrictMode('off')
    await open(() => h(AsyncBoundary, { state: 'success' }, () => 'Invoices'))
    expect(document.body.textContent).toContain('Invoices')
  })
})
