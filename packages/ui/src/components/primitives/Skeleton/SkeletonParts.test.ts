import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonText from './SkeletonText.vue'
import SkeletonAvatar from './SkeletonAvatar.vue'
import SkeletonCard from './SkeletonCard.vue'
import SkeletonTable from './SkeletonTable.vue'

describe('SkeletonText', () => {
  it('renders 3 lines by default with a shorter last line, aria-hidden', () => {
    const w = mount(SkeletonText)
    expect(w.attributes('data-slot')).toBe('skeleton-text')
    expect(w.attributes('aria-hidden')).toBe('true')
    const lines = w.findAll('[data-slot=skeleton-line]')
    expect(lines).toHaveLength(3)
    expect(lines[2].classes()).toContain('w-3/4')
    expect(lines[0].classes()).not.toContain('w-3/4')
  })

  it.each([
    [1, 1],
    [5, 5],
    [99, 20],
    [0, 3],
    [Number.NaN, 3],
  ])('lines=%s renders %s lines', (lines, expected) => {
    expect(mount(SkeletonText, { props: { lines } }).findAll('[data-slot=skeleton-line]')).toHaveLength(expected)
  })

  it('a single line is not shortened', () => {
    expect(mount(SkeletonText, { props: { lines: 1 } }).find('[data-slot=skeleton-line]').classes()).not.toContain('w-3/4')
  })

  it('forwards animation, class and attributes', () => {
    const none = mount(SkeletonText, { props: { animation: 'none' } })
    expect(none.find('[data-slot=skeleton-line]').classes()).not.toContain('animate-pulse')
    const w = mount(SkeletonText, { props: { class: 'max-w-sm' }, attrs: { id: 'x' } })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.attributes('id')).toBe('x')
    expect(mount(SkeletonText).find('[data-slot=skeleton-line]').classes()).toContain('animate-pulse')
  })

  it('renders another element with as', () => {
    expect(mount(SkeletonText, { props: { as: 'section' } }).element.tagName).toBe('SECTION')
  })
})

describe('SkeletonAvatar', () => {
  it('defaults to a 40px circle', () => {
    const w = mount(SkeletonAvatar)
    expect(w.attributes('data-slot')).toBe('skeleton-avatar')
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.classes()).toEqual(expect.arrayContaining(['size-10', 'rounded-full', 'shrink-0']))
  })

  it.each([
    ['sm', 'size-8'],
    ['md', 'size-10'],
    ['lg', 'size-12'],
    ['xl', 'size-16'],
  ] as const)('size %s', (size, cls) => {
    const classes = mount(SkeletonAvatar, { props: { size } }).classes()
    expect(classes).toContain(cls)
    if (size !== 'md') expect(classes).not.toContain('size-10')
  })

  it('square shape and unknown values', () => {
    expect(mount(SkeletonAvatar, { props: { shape: 'square' } }).classes()).toContain('rounded-md')
    const bad = mount(SkeletonAvatar, { props: { size: 'huge' as never, shape: 'blob' as never } })
    expect(bad.classes()).toEqual(expect.arrayContaining(['size-10', 'rounded-full']))
  })

  it('class wins and animation none removes the pulse', () => {
    const w = mount(SkeletonAvatar, { props: { class: 'size-20', animation: 'none' } })
    expect(w.classes()).toContain('size-20')
    expect(w.classes()).not.toContain('size-10')
    expect(w.classes()).not.toContain('animate-pulse')
  })
})

describe('SkeletonCard', () => {
  it('renders media, title and 3 body lines in an aria-hidden card', () => {
    const w = mount(SkeletonCard)
    expect(w.attributes('data-slot')).toBe('skeleton-card')
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.find('[data-slot=skeleton-card-media]').exists()).toBe(true)
    expect(w.find('[data-slot=skeleton-card-title]').exists()).toBe(true)
    expect(w.findAll('[data-slot=skeleton-line]')).toHaveLength(3)
  })

  it('media=false drops the media block; lines=0 drops the body', () => {
    const w = mount(SkeletonCard, { props: { media: false, lines: 0 } })
    expect(w.find('[data-slot=skeleton-card-media]').exists()).toBe(false)
    expect(w.find('[data-slot=skeleton-card-body]').exists()).toBe(false)
    expect(w.find('[data-slot=skeleton-card-title]').exists()).toBe(true)
  })

  it('forwards animation, class and attributes', () => {
    const w = mount(SkeletonCard, { props: { animation: 'none', class: 'max-w-xs' }, attrs: { 'data-testid': 'c' } })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.attributes('data-testid')).toBe('c')
    expect(w.find('[data-slot=skeleton-card-title]').classes()).not.toContain('animate-pulse')
    expect(mount(SkeletonCard).find('[data-slot=skeleton-card-title]').classes()).toContain('animate-pulse')
  })
})

describe('SkeletonTable', () => {
  it('renders a header plus 5 rows of 4 cells by default', () => {
    const w = mount(SkeletonTable)
    expect(w.attributes('data-slot')).toBe('skeleton-table')
    expect(w.attributes('aria-hidden')).toBe('true')
    const rows = w.findAll('[data-slot=skeleton-table-row]')
    expect(rows).toHaveLength(6)
    expect(rows[0].attributes('data-header')).toBeDefined()
    expect(rows[1].findAll('[data-slot=skeleton]')).toHaveLength(4)
    expect(rows[1].attributes('style')).toContain('repeat(4')
  })

  it('honours rows, columns and header=false', () => {
    const w = mount(SkeletonTable, { props: { rows: 2, columns: 3, header: false } })
    const rows = w.findAll('[data-slot=skeleton-table-row]')
    expect(rows).toHaveLength(2)
    expect(rows[0].findAll('[data-slot=skeleton]')).toHaveLength(3)
  })

  it.each([
    [{ rows: 0, columns: 0 }, 5, 4],
    [{ rows: 500, columns: 500 }, 50, 12],
    [{ rows: Number.NaN, columns: -2 }, 5, 4],
    [{ rows: 2.9, columns: 1 }, 2, 1],
  ])('clamps %o', (props, rows, cols) => {
    const w = mount(SkeletonTable, { props: { ...props, header: false } })
    const r = w.findAll('[data-slot=skeleton-table-row]')
    expect(r).toHaveLength(rows)
    expect(r[0].findAll('[data-slot=skeleton]')).toHaveLength(cols)
  })

  it('forwards animation and class', () => {
    const w = mount(SkeletonTable, { props: { animation: 'none', class: 'max-w-lg' } })
    expect(w.classes()).toContain('max-w-lg')
    expect(w.find('[data-slot=skeleton]').classes()).not.toContain('animate-pulse')
  })
})
