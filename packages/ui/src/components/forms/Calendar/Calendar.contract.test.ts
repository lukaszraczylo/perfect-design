import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import Calendar from './Calendar.vue'

const { errors, mountTree } = useStrictHarness()

describe('Calendar contract', () => {
  it('the documented usage passes: grids are named by the month heading, the nav buttons by default labels', async () => {
    await mountTree(() => h(Calendar, { modelValue: new Date(2024, 4, 1) }))
    expect(errors).toEqual([])
    await mountTree(() => h(Calendar, { mode: 'range', numberOfMonths: 2, size: 'lg', showHeading: false }))
    expect(errors).toEqual([])
    await mountTree(() => h(Calendar, { locale: 'de-DE', prevLabel: 'Zurück', nextLabel: 'Weiter', disabled: true }))
    expect(errors).toEqual([])
  })
  it('throws when the previous month button has a blank name, saying how to fix it', async () => {
    await mountTree(() => h(Calendar, { prevLabel: '' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Calendar: needs an accessible name on the previous month button')
    expect(errors[0].message).toContain('prevLabel')
  })
  it('throws when the next month button has a blank name', async () => {
    await mountTree(() => h(Calendar, { nextLabel: ' ', numberOfMonths: 2 }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Calendar: needs an accessible name on the next month button')
    expect(errors[0].message).toContain('nextLabel')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Calendar, { prevLabel: '' }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Calendar: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Calendar, { prevLabel: '' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
