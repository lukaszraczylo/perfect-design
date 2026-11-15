import { describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import ScrollProgress from './ScrollProgress.vue'

const { errors, open, messages } = useContractHarness()

describe('ScrollProgress contract', () => {
  it('throws a ContractError when the progress bar has no accessible name', async () => {
    await open(ScrollProgress, { label: '' })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('ScrollProgress: needs an accessible name')
  })
  it('is satisfied by the default label, a custom label, aria-label or aria-labelledby', async () => {
    await open(ScrollProgress, {})
    expect(errors).toEqual([])
    await open(ScrollProgress, { label: 'Lesen' })
    expect(errors).toEqual([])
    await open(ScrollProgress, { label: '', 'aria-label': 'Progress of this article' })
    expect(errors).toEqual([])
    document.body.insertAdjacentHTML('beforeend', '<span id="progress-name">Article progress</span>')
    await open(ScrollProgress, { label: '', 'aria-labelledby': 'progress-name' })
    expect(errors).toEqual([])
  })
  it('does not complain about normal usage', async () => {
    await open(ScrollProgress, { position: 'bottom' })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(ScrollProgress, { label: '' })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('ScrollProgress: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(ScrollProgress, { label: '' })
    expect(spy).not.toHaveBeenCalled()
  })
})
