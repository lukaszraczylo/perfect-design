import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import CopyField from './CopyField.vue'

type Doc = { execCommand?: unknown }
const button = (w: ReturnType<typeof mount>) => w.find('[data-slot="copy-field-button"]')
const status = (w: ReturnType<typeof mount>) => w.find('[data-slot="copy-field-status"]')

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (navigator as unknown as { clipboard?: unknown }).clipboard
})

describe('CopyField feedback', () => {
  it('announces success in a role=status region outside the button and clears it afterwards', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true })
    const w = mount(CopyField, { props: { value: 'v', copiedDuring: 500 } })
    expect(status(w).attributes('role')).toBe('status')
    expect(button(w).element.contains(status(w).element)).toBe(false)
    expect(status(w).text()).toBe('')
    await button(w).trigger('click')
    await flushPromises()
    expect(status(w).text()).toBe('Copied')
    expect(button(w).attributes('disabled')).toBeUndefined()
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(status(w).text()).toBe('')
  })

  it('announces and shows a failed copy, keeps the button usable, then clears the message', async () => {
    delete (document as unknown as Doc).execCommand
    const w = mount(CopyField, { props: { value: 'v', copiedDuring: 500, failedLabel: 'Could not copy' } })
    await button(w).trigger('click')
    await flushPromises()
    expect(status(w).text()).toBe('Could not copy')
    expect(button(w).text()).toBe('Could not copy')
    expect(w.attributes('data-failed')).toBeDefined()
    expect(button(w).attributes('disabled')).toBeUndefined()
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(status(w).text()).toBe('')
    expect(button(w).text()).toBe('Copy')
    expect(w.attributes('data-failed')).toBeUndefined()
  })

  it('a later successful copy replaces the failure message', async () => {
    delete (document as unknown as Doc).execCommand
    const w = mount(CopyField, { props: { value: 'v' } })
    await button(w).trigger('click')
    await flushPromises()
    expect(status(w).text()).toBe('Copy failed')
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true })
    await button(w).trigger('click')
    await flushPromises()
    expect(status(w).text()).toBe('Copied')
    expect(w.attributes('data-failed')).toBeUndefined()
  })

  it('unmounting while a failure message is pending leaves no timers behind', async () => {
    delete (document as unknown as Doc).execCommand
    const w = mount(CopyField, { props: { value: 'v' } })
    await button(w).trigger('click')
    await flushPromises()
    const pending = vi.getTimerCount()
    w.unmount()
    expect(vi.getTimerCount()).toBeLessThan(pending)
  })

  it('uses logical radii and borders (RTL), 16px text below md and a 44px touch button', () => {
    const w = mount(CopyField, { props: { value: 'v' } })
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['rounded-e-none', 'text-md', 'md:text-sm', 'pointer-coarse:min-h-11']))
    expect(button(w).classes()).toEqual(expect.arrayContaining(['rounded-e-md', 'border-s-0', 'pointer-coarse:min-h-11']))
    expect(button(w).classes()).not.toContain('border-l-0')
    expect(button(w).attributes('type')).toBe('button')
  })

  it('iconOnly keeps the label for assistive tech', () => {
    const w = mount(CopyField, { props: { value: 'v', iconOnly: true, label: 'Copy token' } })
    expect(button(w).find('span').classes()).toContain('sr-only')
    expect(button(w).text()).toBe('Copy token')
  })
})
