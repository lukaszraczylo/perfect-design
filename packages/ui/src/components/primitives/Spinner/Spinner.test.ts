import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Spinner from './Spinner.vue'

describe('Spinner', () => {
  it('is an indeterminate progressbar (like native <progress>) with a default label', () => {
    const w = mount(Spinner)
    expect(w.attributes('role')).toBe('progressbar')
    expect(w.attributes('aria-valuenow')).toBeUndefined()
    expect(w.attributes('aria-label')).toBe('Loading')
    expect(w.attributes('aria-hidden')).toBeUndefined()
  })
  it('decorative drops the role and name and hides it from assistive tech', () => {
    const w = mount(Spinner, { props: { decorative: true } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.attributes('aria-hidden')).toBe('true')
  })
  it('keeps a slower pulse for reduced motion instead of spinning', () => {
    expect(mount(Spinner).classes()).toContain('motion-reduce:animate-pulse')
  })
  it('accepts a custom label', () => {
    expect(mount(Spinner, { props: { label: 'Saving' } }).attributes('aria-label')).toBe('Saving')
  })
  it.each([['xs', 'size-3'], ['sm', 'size-4'], ['md', 'size-5'], ['lg', 'size-6'], ['xl', 'size-8']] as const)(
    'size %s -> %s',
    (size, cls) => {
      expect(mount(Spinner, { props: { size } }).classes()).toContain(cls)
    },
  )
  it('falls back to md for an unknown size (bad input)', () => {
    // @ts-expect-error deliberately invalid
    expect(mount(Spinner, { props: { size: 'huge' } }).classes()).toContain('size-5')
  })
  it('merges consumer class', () => {
    const w = mount(Spinner, { props: { class: 'text-red-500 size-10' } })
    expect(w.classes()).toContain('text-red-500')
    expect(w.classes()).toContain('size-10')
    expect(w.classes()).not.toContain('size-5')
  })
})
