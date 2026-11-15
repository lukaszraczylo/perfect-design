import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import CopyButton from './CopyButton.vue'

const written: string[] = []

beforeEach(() => {
  written.length = 0
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn(async (t: string) => void written.push(t)) },
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (document as unknown as { execCommand?: unknown }).execCommand
})

const blockClipboard = () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) } })
  ;(document as unknown as { execCommand: unknown }).execCommand = vi.fn(() => false)
}

describe('CopyButton', () => {
  it('keeps a constant accessible name and announces through a sibling status element', async () => {
    const w = mount(CopyButton, { props: { text: 'abc', label: 'Copy token' } })
    const btn = w.find('[data-slot="copy-button"]')
    const status = w.find('[data-slot="copy-button-status"]')
    expect(btn.attributes('aria-label')).toBe('Copy token')
    expect(status.attributes('role')).toBe('status')
    expect(status.text()).toBe('')
    await btn.trigger('click')
    await flushPromises()
    expect(written).toEqual(['abc'])
    expect(btn.attributes('aria-label')).toBe('Copy token')
    expect(btn.attributes('data-copied')).toBeDefined()
    expect(status.text()).toBe('Copied')
    expect(btn.find('[role="status"]').exists()).toBe(false)
    expect(w.emitted('copy')?.[0]).toEqual(['abc'])
  })

  it('reads a lazy text function and uses the custom copied label', async () => {
    const w = mount(CopyButton, { props: { text: () => 'lazy', copiedLabel: 'Done' } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(written).toEqual(['lazy'])
    expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Done')
  })

  it('announces a failure, shows data-failed and clears both after the timeout', async () => {
    blockClipboard()
    vi.useFakeTimers()
    const w = mount(CopyButton, { props: { text: 'x', failedLabel: 'Nope' } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.emitted('copy')).toBeUndefined()
    expect(w.find('button').attributes('data-failed')).toBeDefined()
    expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Nope')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(w.find('button').attributes('data-failed')).toBeUndefined()
    expect(w.find('[data-slot="copy-button-status"]').text()).toBe('')
  })

  it('repeated failures restart the timer and a later success clears the failure', async () => {
    blockClipboard()
    vi.useFakeTimers()
    const w = mount(CopyButton, { props: { text: 'x' } })
    await w.find('button').trigger('click')
    await flushPromises()
    vi.advanceTimersByTime(1500)
    await w.find('button').trigger('click')
    await flushPromises()
    vi.advanceTimersByTime(1500)
    await flushPromises()
    expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Copy failed')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => {}) } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.find('button').attributes('data-failed')).toBeUndefined()
    expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Copied')
  })

  it('cleans up its timer on unmount and merges the class onto the button', async () => {
    blockClipboard()
    vi.useFakeTimers()
    const w = mount(CopyButton, { props: { text: 'x', class: 'ms-auto' } })
    expect(w.find('button').classes()).toEqual(expect.arrayContaining(['ms-auto', 'text-muted-foreground']))
    const before = vi.getTimerCount()
    await w.find('button').trigger('click')
    await flushPromises()
    expect(vi.getTimerCount()).toBeGreaterThan(before)
    const clear = vi.spyOn(globalThis, 'clearTimeout')
    w.unmount()
    // the pending failure timer is cleared on scope disposal; running the clock afterwards is harmless
    expect(clear).toHaveBeenCalled()
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
  })

  it('the root is display: contents so the button stays a direct flex child of its parent', () => {
    expect(mount(CopyButton, { props: { text: 'x' } }).find('[data-slot="copy-button-root"]').classes()).toContain('contents')
  })
})
