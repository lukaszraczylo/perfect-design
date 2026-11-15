import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import CookieConsent from './CookieConsent.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('CookieConsent contract', () => {
  it.each(['banner', 'inline', 'modal'])('throws without an accessible name (%s)', async (variant) => {
    await t.mount(() => el(CookieConsent, { variant, title: '' }))
    expect(t.errors.some((e) => e.name === 'ContractError' && e.message.includes('CookieConsent: needs an accessible name'))).toBe(true)
  })
  it('a blank title with only spaces is also a violation', async () => {
    await t.mount(() => el(CookieConsent, { variant: 'inline', title: '   ' }))
    expect(t.text()).toContain('CookieConsent: needs an accessible name')
  })
  it('is satisfied by the default title', async () => {
    await t.mount(() => el(CookieConsent, { variant: 'inline' }))
    expect(t.errors).toEqual([])
  })
  it('is satisfied by a title slot, aria-label or aria-labelledby instead of the title prop', async () => {
    await t.mount(() => el(CookieConsent, { variant: 'inline', title: '' }, { title: () => 'Slot title' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(CookieConsent, { variant: 'inline', title: '', 'aria-label': 'Privacy choices' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => h('div', [h('p', { id: 'outer-name' }, 'Outside name'), el(CookieConsent, { variant: 'inline', title: '', 'aria-labelledby': 'outer-name' })]))
    expect(t.errors).toEqual([])
  })
  it('the modal is named by its dialog title: no DialogContent violation with the defaults', async () => {
    await t.mount(() => el(CookieConsent, { variant: 'modal' }))
    expect(t.errors).toEqual([])
  })
  it('the modal named only by aria-label gets a hidden dialog title', async () => {
    await t.mount(() => el(CookieConsent, { variant: 'modal', title: '', 'aria-label': 'Privacy choices' }))
    expect(t.errors).toEqual([])
  })
  it('normal usage passes in every variant with categories', async () => {
    for (const variant of ['banner', 'inline', 'modal']) {
      await t.mount(() => el(CookieConsent, { variant, categories: [{ id: 'necessary', label: 'Necessary', necessary: true }, { id: 'stats', label: 'Statistics' }] }))
      expect(t.errors).toEqual([])
      t.reset()
    }
  })
})
