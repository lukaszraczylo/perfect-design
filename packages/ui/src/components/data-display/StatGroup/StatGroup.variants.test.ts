import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatGroup from './StatGroup.vue'
import { STAT_GROUP_GAPS, statGroupVariants } from './index'

const mk = (props: Record<string, unknown> = {}) => mount(StatGroup, { props: props as never, slots: { default: '<div>a</div><div>b</div>' } })

describe('StatGroup gap dimension', () => {
  it('keeps the default output (gap-4, no data-gap)', () => {
    const w = mk()
    expect(w.classes()).toContain('gap-4')
    expect(w.attributes('data-gap')).toBeUndefined()
    expect(statGroupVariants()).toBe('grid gap-4')
  })
  it('lists the values', () => expect([...STAT_GROUP_GAPS]).toEqual(['none', 'sm', 'md', 'lg']))

  it.each([
    ['none', 'gap-0'],
    ['sm', 'gap-2'],
    ['lg', 'gap-6'],
  ])('grid gap=%s -> %s and replaces gap-4', (gap, cls) => {
    const w = mk({ gap })
    expect(w.classes()).toContain(cls)
    expect(w.classes()).not.toContain('gap-4')
    expect(w.attributes('data-gap')).toBe(gap)
  })
  it('md equals the default', () => expect(mk({ gap: 'md' }).html()).toBe(mk().html()))
  it('unknown gap falls back to md', () => expect(mk({ gap: 'huge' }).html()).toBe(mk().html()))

  it('applies to the inline layout too', () => {
    const w = mk({ layout: 'inline', gap: 'lg' })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'gap-6']))
    expect(w.classes()).not.toContain('gap-4')
  })
  it('is ignored by the divided layout (hairline rules)', () => {
    const w = mk({ layout: 'divided', gap: 'lg', columns: 2 })
    expect(w.classes()).toContain('gap-px')
    expect(w.classes()).not.toContain('gap-6')
  })
  it('combines with columns without conflict', () => {
    const w = mk({ gap: 'sm', columns: 3 })
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'lg:grid-cols-3']))
  })
  it('class wins over gap', () => {
    const w = mk({ gap: 'sm', class: 'gap-10' })
    expect(w.classes()).toContain('gap-10')
    expect(w.classes()).not.toContain('gap-2')
  })
  it('keeps role=group and the name for every gap', () => {
    for (const gap of STAT_GROUP_GAPS) {
      const w = mount(StatGroup, { props: { gap }, attrs: { 'aria-label': 'Totals' } })
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('aria-label')).toBe('Totals')
    }
  })
  it('renders with no children', () => expect(mount(StatGroup, { props: { gap: 'lg' } }).element.children).toHaveLength(0))
})
