import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AsyncBoundary from './AsyncBoundary.vue'
import { asyncBoundaryContentVariants, asyncBoundaryVariants, ASYNC_BOUNDARY_SIZES, ASYNC_BOUNDARY_STATES, ASYNC_BOUNDARY_VARIANTS } from './variants'

const make = (props: Record<string, unknown> = {}) => mount(AsyncBoundary, { props: { onRetry: () => {}, ...props }, slots: { default: '<p>Content</p>' } })

describe('AsyncBoundary variants', () => {
  it('lists every documented value', () => {
    expect([...ASYNC_BOUNDARY_VARIANTS]).toEqual(['default', 'card', 'compact'])
    expect([...ASYNC_BOUNDARY_SIZES]).toEqual(['sm', 'md', 'lg'])
    expect([...ASYNC_BOUNDARY_STATES]).toEqual(['idle', 'loading', 'error', 'empty', 'success'])
  })

  it('default output is stable: no surface, no data-variant, no data-size', () => {
    const w = make()
    expect(w.classes()).toEqual(['relative', 'min-w-0'])
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.find('[data-slot="async-boundary-content"]').classes()).toEqual(['min-w-0'])
    expect(asyncBoundaryVariants()).toBe('relative min-w-0')
  })

  it('card draws a bordered surface and pads the content', () => {
    const w = make({ variant: 'card' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'text-card-foreground']))
    expect(w.attributes('data-variant')).toBe('card')
    expect(w.find('[data-slot="async-boundary-content"]').classes()).toContain('p-4')
  })

  it('compact swaps in the dense forms of the three states', async () => {
    const w = make({ variant: 'compact', state: 'loading' })
    expect(w.attributes('data-variant')).toBe('compact')
    expect(w.find('[data-slot="loading-state"]').attributes('data-layout')).toBe('inline')
    await w.setProps({ state: 'error', error: 'x' })
    expect(w.find('[data-slot="error-state"]').attributes('data-variant')).toBe('inline')
    await w.setProps({ state: 'empty' })
    expect(w.find('[data-slot="empty-state"]').attributes('data-variant')).toBe('compact')
    await w.setProps({ state: 'success' })
    expect(w.find('[data-slot="async-boundary-content"]').classes()).toEqual(['min-w-0'])
  })

  it('the default variant uses the stacked, centred forms', async () => {
    const w = make({ state: 'loading' })
    expect(w.find('[data-slot="loading-state"]').attributes('data-layout')).toBeUndefined()
    await w.setProps({ state: 'error', error: 'x' })
    expect(w.find('[data-slot="error-state"]').attributes('data-variant')).toBeUndefined()
    await w.setProps({ state: 'empty' })
    expect(w.find('[data-slot="empty-state"]').attributes('data-variant')).toBeUndefined()
  })

  it('size is forwarded to the built-in states and marks the root', async () => {
    for (const size of ['sm', 'lg'] as const) {
      const w = make({ size, state: 'loading' })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.find('[data-slot="loading-state"]').attributes('data-size')).toBe(size)
      await w.setProps({ state: 'error', error: 'x' })
      expect(w.find('[data-slot="error-state"]').attributes('data-size')).toBe(size)
      await w.setProps({ state: 'empty' })
      expect(w.find('[data-slot="empty-state"]').attributes('data-size')).toBe(size)
    }
    const md = make({ state: 'empty' })
    expect(md.find('[data-slot="empty-state"]').attributes('data-size')).toBe('md')
  })

  it('unknown values fall back to the default', () => {
    const w = make({ variant: 'huge' as never, size: 'giant' as never })
    expect(w.classes()).toEqual(['relative', 'min-w-0'])
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.attributes('data-size')).toBeUndefined()
  })

  it('class wins over variant classes', () => {
    const w = make({ variant: 'card', class: 'rounded-none bg-muted' })
    expect(w.classes()).toContain('rounded-none')
    expect(w.classes()).toContain('bg-muted')
    expect(w.classes()).not.toContain('rounded-lg')
    expect(w.classes()).not.toContain('bg-card')
  })

  it('every variant with every size and state renders with no conflict', async () => {
    for (const variant of ASYNC_BOUNDARY_VARIANTS) {
      for (const size of ASYNC_BOUNDARY_SIZES) {
        const w = make({ variant, size })
        for (const state of ASYNC_BOUNDARY_STATES) {
          await w.setProps({ state, error: 'x' })
          expect(w.attributes('data-state')).toBe(state)
        }
        expect(w.classes()).toContain('min-w-0')
        w.unmount()
      }
    }
  })

  it('exposes plain helpers for other elements', () => {
    expect(asyncBoundaryVariants({ variant: 'card' })).toContain('border')
    expect(asyncBoundaryContentVariants({ variant: 'card' })).toBe('min-w-0 p-4')
  })
})
