import { describe, expect, it } from 'vitest'
import { cva } from './cva'

const v = cva('base', {
  variants: {
    tone: { a: 'tone-a', b: ['tone-b', 'x'] },
    size: { sm: 'sm', md: 'md' },
    bold: { true: 'font-bold', false: '' },
  },
  compoundVariants: [
    { tone: 'a', size: 'sm', class: 'a-sm' },
    { tone: ['b'], bold: true, class: 'b-bold' },
  ],
  defaultVariants: { tone: 'a', size: 'md', bold: false },
})

describe('cva', () => {
  it('applies base + defaults', () => expect(v()).toBe('base tone-a md'))
  it('applies given variants over defaults', () => expect(v({ tone: 'b', size: 'sm' })).toBe('base tone-b x sm'))
  it('applies compound variants including array conditions and defaults in conditions', () => {
    expect(v({ size: 'sm' })).toBe('base tone-a sm a-sm')
    expect(v({ tone: 'b', bold: true })).toBe('base tone-b x md font-bold b-bold')
  })
  it('appends class / className last', () => expect(v({ class: 'mine', className: 'also' })).toBe('base tone-a md mine also'))
  it('treats null as "use default" and ignores unknown values (bad input)', () => {
    // @ts-expect-error null is allowed, unknown string is not
    expect(v({ tone: null, size: 'nope' })).toBe('base tone-a')
  })
  it('works without config or base (edge)', () => {
    expect(cva()()).toBe('')
    expect(cva('only')()).toBe('only')
    expect(cva(undefined, { variants: { a: { x: 'y' } } })({ a: 'x' })).toBe('y')
  })
  it('handles boolean variant values passed as booleans and strings', () => {
    expect(v({ bold: true })).toContain('font-bold')
    expect(v({ bold: 'true' })).toContain('font-bold')
  })
  it('drops falsy class inputs', () => expect(cva(['a', false, null, undefined, 0 as never, ['b']])()).toBe('a 0 b'))
})
