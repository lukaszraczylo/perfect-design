import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorState from './ErrorState.vue'
import { errorStateDetailsVariants } from './variants'

const details = (props: Record<string, unknown>) => mount(ErrorState, { props: { title: 'Failed', details: 'Error: boom', ...props } }).get('[data-slot="error-state-details"]')

describe('ErrorState details alignment', () => {
  it('centres the disclosure summary in the centred layout', () => {
    const d = details({})
    expect(d.classes()).toContain('text-center')
    expect(d.classes()).toContain('[&>summary]:mx-auto')
  })

  it('keeps the disclosure start-aligned in the start layout', () => {
    const d = details({ layout: 'start' })
    expect(d.classes()).not.toContain('text-center')
    expect(d.classes()).not.toContain('[&>summary]:mx-auto')
  })

  it('keeps the details text start-aligned inside the centred block', () => {
    expect(details({}).get('pre').classes()).toContain('text-start')
  })

  it('leaves the inline row alone and the standalone helper defaults to centred', () => {
    expect(details({ variant: 'inline' }).classes()).not.toContain('text-center')
    expect(errorStateDetailsVariants()).toContain('text-center')
  })
})
