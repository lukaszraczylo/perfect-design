import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineMessage from './InlineMessage.vue'

describe('InlineMessage live', () => {
  it('keeps the default roles', () => {
    expect(mount(InlineMessage).attributes('role')).toBe('status')
    expect(mount(InlineMessage, { props: { tone: 'danger' } }).attributes('role')).toBe('alert')
  })
  it.each([
    ['polite', 'status'],
    ['assertive', 'alert'],
  ] as const)('live=%s sets role %s', (live, role) => {
    expect(mount(InlineMessage, { props: { live } }).attributes('role')).toBe(role)
  })
  it('live=off renders no live role', () => {
    const w = mount(InlineMessage, { props: { live: 'off', tone: 'danger' } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-live')).toBeUndefined()
  })
  it('an invalid live value falls back to the default', () => {
    expect(mount(InlineMessage, { props: { live: 'loud' as never } }).attributes('role')).toBe('status')
  })
})
