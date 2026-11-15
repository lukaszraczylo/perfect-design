import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import { mockMatchMedia } from '../shared/testing'
import Marquee from './Marquee.vue'

const { errors, open, messages } = useContractHarness()
const items = ['One', 'Two']

describe('Marquee contract', () => {
  it('throws a ContractError when pausable is off while the strip moves (WCAG 2.2.2)', async () => {
    await open(Marquee, { items, pausable: false })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('Marquee: requires a way to pause')
    expect(messages()[0]).toContain('v-model:paused')
    await open(Marquee, { pausable: false }, { default: () => h('span', 'Slot item') })
    expect(errors).toHaveLength(1)
  })
  it('accepts pausable off under reduced motion, with a bound paused state, or with nothing to move', async () => {
    mockMatchMedia(true)
    await open(Marquee, { items, pausable: false })
    expect(errors).toEqual([])
    vi.unstubAllGlobals()
    mockMatchMedia(false)
    await open(Marquee, { items, pausable: false, paused: true })
    expect(errors).toEqual([])
    await open(Marquee, { pausable: false })
    expect(errors).toEqual([])
  })
  it('does not complain about normal usage', async () => {
    mockMatchMedia(false)
    await open(Marquee, { items })
    expect(errors).toEqual([])
    await open(Marquee, { items, pausable: true, pauseOnHover: false, direction: 'up' })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    mockMatchMedia(false)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(Marquee, { items, pausable: false })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Marquee: requires a way to pause'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(Marquee, { items, pausable: false })
    expect(spy).not.toHaveBeenCalled()
  })
})
