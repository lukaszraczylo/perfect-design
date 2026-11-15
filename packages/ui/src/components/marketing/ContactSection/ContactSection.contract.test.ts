import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import Button from '../../primitives/Button/Button.vue'
import NewsletterSignup from '../NewsletterSignup/NewsletterSignup.vue'
import ContactSection from './ContactSection.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const form = (props: Record<string, unknown> = {}) => h('form', props, [h('input', { name: 'email' }), h(Button, { type: 'submit' }, () => 'Send')])
const section = (formProps?: Record<string, unknown>, extra: Record<string, unknown> = {}) => () =>
  el(ContactSection, { title: 'Ask a question', ...extra }, { form: () => form(formProps) })

describe('ContactSection contract', () => {
  it('throws when a form in the slot has no submit handler', async () => {
    await t.mount(section())
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('ContactSection: requires a submit handler on every form')
    expect(t.errors[0].message).toContain('a form submits nowhere')
  })
  it('counts every handler-less form and also checks the details slot', async () => {
    await t.mount(() => el(ContactSection, null, { form: () => form(), details: () => form() }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('2 forms submit nowhere')
  })
  it('is satisfied by a submit listener or a form action', async () => {
    await t.mount(section({ onSubmit: () => {} }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(section({ action: '/contact', method: 'post' }))
    expect(t.errors).toEqual([])
  })
  it('does not require a form: heading only, details only, or a slot without a form', async () => {
    await t.mount(() => el(ContactSection, { title: 'Ask a question' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(ContactSection, null, { details: () => h('p', 'Address'), form: () => h('p', 'Write to us by post') }))
    expect(t.errors).toEqual([])
  })
  it('a NewsletterSignup inside the slots is judged by its own subscribe handler', async () => {
    await t.mount(() => el(ContactSection, null, { form: () => el(NewsletterSignup, { onSubscribe: () => {} }) }))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(section())
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('ContactSection: requires a submit handler'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(section())
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
