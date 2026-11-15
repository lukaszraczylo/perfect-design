import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import Fieldset from './Fieldset.vue'

afterEach(() => vi.restoreAllMocks())

describe('Fieldset a11y', () => {
  // The missing-legend requirement is a ContractError now: see Fieldset.contract.test.ts.
  it('does not report anything with a legend (prop or slot) or an aria name, even in strict mode', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    mount(Fieldset, { props: { legend: 'Contact' } })
    mount(Fieldset, { slots: { legend: 'Contact' } })
    mount(Fieldset, { attrs: { 'aria-label': 'Contact' } })
    mount(Fieldset, { attrs: { 'aria-labelledby': 'x' } })
    configureStrictMode('off')
    expect(error).not.toHaveBeenCalled()
  })

  it('puts the legend first so it names the group, and the group can shrink in flex and grid parents', () => {
    const w = mount(Fieldset, { props: { legend: 'Contact', description: 'How we reach you' }, slots: { default: '<input />' } })
    expect(w.element.firstElementChild?.tagName).toBe('LEGEND')
    expect(w.classes()).toContain('min-w-0')
    expect(w.attributes('aria-describedby')).toBeTruthy()
  })
})
