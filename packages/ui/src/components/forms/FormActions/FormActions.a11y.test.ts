import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormActions from './FormActions.vue'

describe('FormActions a11y and responsive', () => {
  it('sticky bar is opaque: no blur, no translucent background, no backdrop-filter fallback', () => {
    const w = mount(FormActions, { props: { sticky: true } })
    const cls = w.classes().join(' ')
    expect(w.classes()).toContain('bg-background')
    expect(cls).not.toMatch(/backdrop|supports-|bg-background\//)
    expect(cls).toContain('z-(--z-sticky)')
  })

  it('keeps DOM order equal to visual order: cancel before submit, no flex-col-reverse', () => {
    const w = mount(FormActions, { props: { submitLabel: 'Save', cancelLabel: 'Cancel' } })
    const buttons = w.findAll('button')
    expect(buttons.map((b) => b.attributes('type'))).toEqual(['button', 'submit'])
    expect(w.classes()).not.toContain('flex-col-reverse')
    expect(w.classes()).toContain('flex-col')
  })

  it('wraps rather than overflows: the row layout wraps from sm up and the non-stacked layout wraps always', () => {
    expect(mount(FormActions).classes()).toContain('sm:flex-wrap')
    expect(mount(FormActions, { props: { stacked: false } }).classes()).toContain('flex-wrap')
  })

  it('is a named group only when the consumer names it (aria-label or aria-labelledby)', () => {
    expect(mount(FormActions).attributes('role')).toBeUndefined()
    expect(mount(FormActions, { attrs: { 'aria-labelledby': 'h' } }).attributes('role')).toBe('group')
  })
})
