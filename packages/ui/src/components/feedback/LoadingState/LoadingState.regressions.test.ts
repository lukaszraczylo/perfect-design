import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from './LoadingState.vue'

describe('LoadingState live region', () => {
  it('has role=status without a permanent aria-busy or redundant aria-live', () => {
    const w = mount(LoadingState)
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(w.attributes('aria-live')).toBeUndefined()
  })
})
