import { describe, expect, it } from 'vitest'
import { PLURAL_SUFFIXES, fillTemplate, mergeLabels, pluralKeys, pluralText } from './plural'

const en = { results: '{count} results', resultsOne: '{count} result' }

describe('pluralText', () => {
  it.each([
    { name: 'English one', count: 1, locale: 'en', expected: '1 result' },
    { name: 'English other', count: 2, locale: 'en', expected: '2 results' },
    { name: 'English zero uses other', count: 0, locale: 'en', expected: '0 results' },
    { name: 'grouped number', count: 12500, locale: 'en-US', expected: '12,500 results' },
    { name: 'locale number format', count: 12500, locale: 'de-DE', expected: '12.500 results' },
  ])('$name', ({ count, locale, expected }) => expect(pluralText(en, 'results', count, locale)).toBe(expected))

  it('picks Russian few and many forms when they are given', () => {
    const ru = { results: '{count} результата', resultsOne: '{count} результат', resultsFew: '{count} результата', resultsMany: '{count} результатов' }
    expect([1, 3, 5, 21, 22, 25].map((n) => pluralText(ru, 'results', n, 'ru'))).toEqual(['1 результат', '3 результата', '5 результатов', '21 результат', '22 результата', '25 результатов'])
  })

  it('falls back to the other form when the category form is missing or blank', () => {
    expect(pluralText({ results: '{count} results', resultsOne: '  ' }, 'results', 1, 'en')).toBe('1 results')
    expect(pluralText({ results: '{count} результата' }, 'results', 5, 'ru')).toBe('5 результата')
  })

  it('replaces extra placeholders and leaves unknown ones', () => {
    expect(pluralText({ moved: 'Moved {name}, {count} item', movedOne: 'Moved {name}' }, 'moved', 1, 'en', { name: 'A' })).toBe('Moved A')
    expect(pluralText({ moved: '{count} {unknown}' }, 'moved', 2, 'en')).toBe('2 {unknown}')
  })

  it('survives a bad locale and non-finite counts', () => {
    expect(pluralText(en, 'results', 1, 'not a locale!!')).toBe('1 result')
    expect(pluralText(en, 'results', Number.NaN, 'en')).toBe('NaN results')
    expect(pluralText({}, 'results', 1, 'en')).toBe('')
  })
})

describe('fillTemplate', () => {
  it('replaces every occurrence and formats numbers with the locale', () => {
    expect(fillTemplate('{a} and {a} of {b}', { a: 'x', b: 1500 }, 'en-US')).toBe('x and x of 1,500')
  })
})

describe('pluralKeys', () => {
  it('lists the other key then one key per category', () => {
    expect(PLURAL_SUFFIXES).toEqual(['Zero', 'One', 'Two', 'Few', 'Many'])
    expect(pluralKeys('results')).toEqual(['results', 'resultsZero', 'resultsOne', 'resultsTwo', 'resultsFew', 'resultsMany'])
  })
})

describe('mergeLabels', () => {
  const base = { empty: 'Nothing', results: '{count} results', resultsOne: '{count} result' }
  it('replaces a whole plural group when the override sets any form', () => {
    expect(mergeLabels(base, { results: '{count} résultats' }, ['results'])).toEqual({ empty: 'Nothing', results: '{count} résultats', resultsZero: undefined, resultsOne: undefined, resultsTwo: undefined, resultsFew: undefined, resultsMany: undefined })
  })
  it('keeps the base group when the override sets none of its forms, and skips blank values', () => {
    expect(mergeLabels(base, { empty: 'Rien', results: ' ' }, ['results'])).toEqual({ ...base, empty: 'Rien' })
    expect(mergeLabels(base, undefined, ['results'])).toEqual(base)
  })
  it('treats names outside plurals as plain keys', () => {
    expect(mergeLabels(base, { resultsOne: 'one' })).toEqual({ ...base, resultsOne: 'one' })
  })
})
