import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorState from './ErrorState.vue'

describe('ErrorState retrying', () => {
  it('keeps aria-busy off the role=alert node and on the retry button', () => {
    const w = mount(ErrorState, { props: { message: 'Failed', retrying: true } })
    expect(w.attributes('role')).toBe('alert')
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(w.find('[data-slot="error-state-retry"]').attributes('aria-busy')).toBe('true')
  })

  it('page variant honours titleAs', () => {
    const w = mount(ErrorState, { props: { variant: 'page', message: 'x', titleAs: 'h2' } })
    expect(w.find('[data-slot="error-state-title"]').element.tagName).toBe('H2')
  })
})
