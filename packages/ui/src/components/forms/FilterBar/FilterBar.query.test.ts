import { describe, expect, it } from 'vitest'
import { filtersToQuery, queryToFilters, type FilterField, type FilterItem } from './index'

const FIELDS: FilterField[] = [
  { id: 'status', label: 'Status', type: 'select', options: [{ value: 'open', label: 'Open' }, { value: 'a:b', label: 'Odd' }] },
  { id: 'ref', label: 'Reference' },
  { id: 'weight', label: 'Weight', type: 'number' },
  { id: 'due', label: 'Due', type: 'date' },
  { id: 'carrier', label: 'Carrier', type: 'multi-select', options: [{ value: 'k', label: 'K' }, { value: 'o,x', label: 'Comma' }, { value: 'b', label: 'B' }] },
  { id: 'insured', label: 'Insured', type: 'boolean' },
  { id: 'free', label: 'Free select', type: 'select' },
  { id: 'two', label: 'Two ops', operators: ['starts'] },
]

describe('filtersToQuery', () => {
  it('writes one entry per filter under the default key', () => {
    const q = filtersToQuery([
      { id: '1', field: 'status', operator: 'eq', value: 'open' },
      { id: '2', field: 'weight', operator: 'gt', value: 12.5 },
      { id: '3', field: 'insured', value: true },
      { id: '4', field: 'carrier', operator: 'in', value: ['k', 'b'] },
    ])
    expect(q).toEqual({ filter: ['status:eq:open', 'weight:gt:12.5', 'insured::true', 'carrier:in:k,b'] })
  })

  it('returns an empty object for nothing usable', () => {
    expect(filtersToQuery([])).toEqual({})
    expect(filtersToQuery(null)).toEqual({})
    expect(filtersToQuery(undefined)).toEqual({})
    expect(filtersToQuery('nope' as never)).toEqual({})
  })

  it('escapes % : and , inside segments', () => {
    const q = filtersToQuery([{ id: '1', field: 'a:b', operator: 'eq', value: '50% off: yes, really' }, { id: '2', field: 'carrier', value: ['x,y', 'z:1'] }])
    expect(q.filter).toEqual(['a%3Ab:eq:50%25 off%3A yes%2C really', 'carrier::x%2Cy,z%3A1'])
  })

  it('drops control characters and skips values that become empty', () => {
    const q = filtersToQuery([
      { id: '1', field: 'ref\u0000', value: 'a\nb‮c\u007f' },
      { id: '2', field: 'ref', value: '\u0000\n' },
      { id: '3', field: '\u0001', value: 'x' },
    ])
    expect(q.filter).toEqual(['ref::abc'])
  })

  it('skips malformed filters and values without throwing', () => {
    const throwing = {
      get field(): string {
        throw new Error('boom')
      },
    }
    const q = filtersToQuery([
      null,
      5,
      'x',
      { id: 'a' },
      { id: 'b', field: 5, value: 'x' },
      { id: 'c', field: 'ref', value: undefined },
      { id: 'd', field: 'ref', value: null },
      { id: 'e', field: 'ref', value: Number.NaN },
      { id: 'f', field: 'ref', value: Infinity },
      { id: 'g', field: 'ref', value: {} },
      { id: 'h', field: 'ref', value: [] },
      { id: 'i', field: 'ref', value: [{}, '', Number.NaN] },
      { id: 'j', field: 'ref', value: Symbol('s') },
      { id: 'k', field: 'ref', value: 10n },
      throwing,
      { id: 'ok', field: 'ref', value: [1, 'two'] },
    ] as never)
    expect(q).toEqual({ filter: ['ref::1,two'] })
  })

  it('refuses prototype-pollution keys as field ids and as the query key', () => {
    const q = filtersToQuery([{ id: '1', field: '__proto__', value: 'x' }, { id: '2', field: 'constructor', value: 'x' }, { id: '3', field: 'prototype', value: 'x' }, { id: '4', field: 'ref', value: 'ok' }], { key: '__proto__' })
    expect(Object.keys(q)).toEqual(['filter'])
    expect(q.filter).toEqual(['ref::ok'])
    expect(({} as Record<string, unknown>).x).toBeUndefined()
    expect(Object.getPrototypeOf(q)).toBe(Object.prototype)
    expect(Object.keys(filtersToQuery([{ id: '1', field: 'ref', value: 'a' }], { key: 'f' }))).toEqual(['f'])
    expect(Object.keys(filtersToQuery([{ id: '1', field: 'ref', value: 'a' }], { key: '' }))).toEqual(['filter'])
    expect(Object.keys(filtersToQuery([{ id: '1', field: 'ref', value: 'a' }], { key: 5 as never }))).toEqual(['filter'])
  })

  it('limits the number of filters and the length of an entry', () => {
    const many: FilterItem[] = Array.from({ length: 500 }, (_, i) => ({ id: `${i}`, field: 'ref', value: `v${i}` }))
    expect(filtersToQuery(many).filter).toHaveLength(50)
    expect(filtersToQuery(many, { maxFilters: 3 }).filter).toHaveLength(3)
    expect(filtersToQuery(many, { maxFilters: 1e9 }).filter).toHaveLength(500)
    expect(filtersToQuery(many, { maxFilters: -1 }).filter).toHaveLength(50)
    const huge = filtersToQuery([{ id: 'h', field: 'ref', value: 'x'.repeat(1_000_000) }, { id: 's', field: 'ref', value: 'small' }])
    expect(huge.filter).toEqual(['ref::small'])
    expect(filtersToQuery([{ id: 'h', field: 'ref', value: 'x'.repeat(2000) }], { maxLength: 3000 }).filter).toHaveLength(1)
    expect(filtersToQuery([{ id: 'h', field: 'ref', value: ['a'.repeat(5), ...Array.from({ length: 300 }, () => 'b')] }]).filter![0].split(',')).toHaveLength(100)
  })

  it('works with URLSearchParams and survives a round trip through a URL', () => {
    const items: FilterItem[] = [{ id: '1', field: 'ref', operator: 'contains', value: '100% a:b, c & d=e #f ü 🚚' }]
    const params = new URLSearchParams()
    for (const e of filtersToQuery(items).filter!) params.append('filter', e)
    const url = new URL(`https://example.test/list?${params.toString()}`)
    expect(queryToFilters(url.searchParams)[0]).toMatchObject({ field: 'ref', operator: 'contains', value: '100% a:b, c & d=e #f ü 🚚' })
  })
})

describe('queryToFilters', () => {
  it('parses typed values with fields', () => {
    const out = queryToFilters(
      { filter: ['status:eq:open', 'weight:gt:12.5', 'due:before:2025-02-28', 'carrier:in:k,b', 'insured::false', 'ref:contains:abc', 'status:neq:a%3Ab'] },
      { fields: FIELDS },
    )
    expect(out.map(({ id: _id, ...rest }) => rest)).toEqual([
      { field: 'status', operator: 'eq', value: 'open' },
      { field: 'weight', operator: 'gt', value: 12.5 },
      { field: 'due', operator: 'before', value: '2025-02-28' },
      { field: 'carrier', operator: 'in', value: ['k', 'b'] },
      { field: 'insured', value: false },
      { field: 'ref', operator: 'contains', value: 'abc' },
      { field: 'status', operator: 'neq', value: 'a:b' },
    ])
    expect(new Set(out.map((f) => f.id)).size).toBe(out.length)
  })

  it('round trips what filtersToQuery wrote', () => {
    const items: FilterItem[] = [
      { id: 'x1', field: 'status', operator: 'eq', value: 'a:b' },
      { id: 'x2', field: 'carrier', operator: 'in', value: ['o,x', 'k'] },
      { id: 'x3', field: 'ref', operator: 'contains', value: '% : , mix' },
      { id: 'x4', field: 'weight', operator: 'lte', value: -3e-7 },
    ]
    const back = queryToFilters(filtersToQuery(items), { fields: FIELDS })
    expect(back.map(({ id: _id, ...rest }) => rest)).toEqual(items.map(({ id: _id, ...rest }) => rest))
  })

  it('without fields keeps strings and accepts any field', () => {
    const out = queryToFilters({ filter: ['anything:custom-op:12', 'x::y', 'bad:op!:z', 'e:eq:'] })
    expect(out.map(({ id: _id, ...rest }) => rest)).toEqual([
      { field: 'anything', operator: 'custom-op', value: '12' },
      { field: 'x', value: 'y' },
    ])
  })

  it('accepts a single string instead of an array', () => {
    expect(queryToFilters({ filter: 'ref::x' })).toHaveLength(1)
  })

  it('skips what does not fit the field definitions', () => {
    const out = queryToFilters(
      {
        filter: [
          'unknown:eq:x',
          'status:eq:nope',
          'status:gt:open',
          'weight:gt:abc',
          'weight:gt:',
          'weight:gt:1e999',
          'due:before:2025-02-30',
          'due:before:20250228',
          'carrier:in:zz,yy',
          'carrier:in:',
          'insured::maybe',
          'ref:contains:   ',
          'two:eq:x',
          'two:starts:ok',
          'free:eq:anything',
        ],
      },
      { fields: FIELDS },
    )
    expect(out.map((f) => f.field)).toEqual(['two', 'free'])
  })

  it('dedupes multi values and caps them at 100', () => {
    const many = Array.from({ length: 300 }, (_, i) => `v${i}`).join(',')
    const out = queryToFilters({ filter: [`carrier:in:k,k,b`, `free2:in:${many}`] }, { fields: [...FIELDS, { id: 'free2', label: 'Free', type: 'multi-select' }], maxLength: 100000 })
    expect(out[0].value).toEqual(['k', 'b'])
    expect((out[1].value as string[]).length).toBe(100)
  })

  it('never throws on malformed entries', () => {
    const bad = ['', ':', '::', ':::', 'a', 'a:b', 'a:b:c:d', '%', '%E0%A4%A', '%zz:%zz:%zz', '\u0000:\u0000:\u0000', 'ref::%25', 'ref::%2', 'ref::%253A', null, undefined, 5, {}, [], true]
    expect(() => queryToFilters({ filter: bad })).not.toThrow()
    expect(() => queryToFilters({ filter: bad }, { fields: FIELDS })).not.toThrow()
    const out = queryToFilters({ filter: bad })
    expect(out.map((f) => f.value)).toEqual(['%', '%2', '%3A'].map((v) => v)) // %25 -> %, %2 stays, %253A -> %3A
  })

  it('decodes only the three escapes, in one pass', () => {
    expect(queryToFilters({ filter: ['ref::%25%33A%3a%2c'] })[0].value).toBe('%%33A:,')
  })

  it('refuses prototype-pollution field ids and keys', () => {
    const before = Object.keys(Object.prototype).length
    const query = JSON.parse('{"filter":["__proto__:eq:x","constructor::x","prototype::x","ref::ok"],"__proto__":{"polluted":"yes"}}')
    const out = queryToFilters(query, { key: 'filter' })
    expect(out.map((f) => f.field)).toEqual(['ref'])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.keys(Object.prototype)).toHaveLength(before)
    expect(queryToFilters(JSON.parse('{"__proto__":["ref::x"]}'), { key: '__proto__' })).toEqual([])
    expect(queryToFilters(JSON.parse('{"__proto__":["ref::x"],"filter":["ref::y"]}'), { key: '__proto__' }).map((f) => f.value)).toEqual(['y'])
    const withFields = queryToFilters({ filter: ['__proto__:eq:x', 'constructor::x'] }, { fields: [{ id: '__proto__', label: 'p' }, { id: 'constructor', label: 'c' }] })
    expect(withFields).toEqual([])
    // field ids resolved from the definitions never reach an object key
    expect(Object.getPrototypeOf(out[0])).toBe(Object.prototype)
  })

  it('reads only own properties', () => {
    const inherited = Object.create({ filter: ['ref::x'] })
    expect(queryToFilters(inherited)).toEqual([])
    const bare = Object.create(null) as Record<string, unknown>
    bare.filter = ['ref::x']
    expect(queryToFilters(bare)).toHaveLength(1)
  })

  it('tolerates hostile inputs', () => {
    const throwing = Object.defineProperty({}, 'filter', {
      enumerable: true,
      get() {
        throw new Error('boom')
      },
    })
    for (const input of [null, undefined, 5, 'filter=x', true, [], throwing, {}, { filter: null }, { filter: {} }, { other: ['ref::x'] }]) {
      expect(queryToFilters(input as never)).toEqual([])
    }
  })

  it('bounds the work for huge input', () => {
    const huge = Array.from({ length: 100_000 }, (_, i) => (i % 2 ? 'junk' : `ref::v${i}`))
    const out = queryToFilters({ filter: huge })
    expect(out.length).toBeLessThanOrEqual(50)
    expect(queryToFilters({ filter: [`ref::${'x'.repeat(5_000_000)}`] })).toEqual([])
    expect(queryToFilters({ filter: [`ref::${'x'.repeat(2000)}`] }, { maxLength: 5000 })).toHaveLength(1)
    expect(queryToFilters({ filter: huge.map(() => 'junk') }, { maxFilters: 2 })).toEqual([])
  })

  it('applies maxFilters and the key option', () => {
    expect(queryToFilters({ f: ['a::1', 'b::2', 'c::3'] }, { key: 'f', maxFilters: 2 }).map((x) => x.field)).toEqual(['a', 'b'])
  })

  it('ignores a malformed fields option', () => {
    expect(queryToFilters({ filter: ['ref::x'] }, { fields: 'nope' as never })).toHaveLength(1)
    expect(queryToFilters({ filter: ['ref::x'] }, { fields: [null, 5, { id: 5 }] as never })).toEqual([])
    expect(queryToFilters({ filter: ['s:eq:x'] }, { fields: [{ id: 's', label: 'S', type: 'select', options: 'nope' as never }] })).toHaveLength(1)
    expect(queryToFilters({ filter: ['s::x'] }, { fields: [{ id: 's', label: 'S', type: 'weird' as never }] })).toHaveLength(1)
  })
})
