import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldGroup from './FieldGroup.vue'

const m = (props: Record<string, unknown> = {}) => mount(FieldGroup, { props, slots: { default: '<div>a</div><div>b</div>' } })

describe('FieldGroup gap', () => {
  it('md keeps the default class strings for stack, row and grids', () => {
    expect(m().attributes('class')).toBe('w-full flex flex-col gap-5')
    expect(m({ orientation: 'horizontal' }).attributes('class')).toBe('w-full flex flex-row flex-wrap items-start gap-4 *:min-w-0 *:grow *:basis-48')
    expect(m({ columns: 2 }).attributes('class')).toBe('w-full grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2')
    expect(m({ columns: 3 }).attributes('class')).toBe('w-full grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3')
    expect(m().attributes('data-gap')).toBe('md')
  })
  it.each([
    ['sm', 'gap-3', 'gap-2', ['gap-x-3', 'gap-y-3']],
    ['lg', 'gap-8', 'gap-6', ['gap-x-6', 'gap-y-8']],
  ])('gap %s', (gap, stack, row, grid) => {
    expect(m({ gap }).classes()).toContain(stack)
    expect(m({ gap }).classes()).not.toContain('gap-5')
    expect(m({ gap, orientation: 'horizontal' }).classes()).toContain(row)
    expect(m({ gap, columns: 2 }).classes()).toEqual(expect.arrayContaining(grid))
    expect(m({ gap }).attributes('data-gap')).toBe(gap)
  })
  it('unknown gap (including inherited object keys) falls back to md', () => {
    for (const gap of ['huge', 'toString', 'constructor']) {
      const w = m({ gap })
      expect(w.classes()).toContain('gap-5')
      expect(w.attributes('data-gap')).toBe('md')
    }
  })
  it('class wins and gap combines with columns and a label group', () => {
    const w = m({ gap: 'lg', columns: 3, label: 'Address', class: 'gap-y-1' })
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-y-1', 'gap-x-6', 'lg:grid-cols-3']))
    expect(w.classes()).not.toContain('gap-y-8')
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Address')
  })
})
