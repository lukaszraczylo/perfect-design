import { describe, expect, it } from 'vitest'
import { escapeTsvCell, neutralizeFormula, toTsv } from './tsv'

describe('escapeTsvCell', () => {
  it('leaves plain text alone', () => expect(escapeTsvCell('Orchard Mill')).toBe('Orchard Mill'))
  it('quotes a cell with a tab, a newline, a carriage return or a quote, doubling quotes', () => {
    expect(escapeTsvCell('a\tb')).toBe('"a\tb"')
    expect(escapeTsvCell('a\nb')).toBe('"a\nb"')
    expect(escapeTsvCell('a\r\nb')).toBe('"a\r\nb"')
    expect(escapeTsvCell('say "hi"')).toBe('"say ""hi"""')
  })
  it('keeps unicode, RTL text and emoji-free long text intact', () => {
    expect(escapeTsvCell('مرحبا بالعالم')).toBe('مرحبا بالعالم')
    const long = 'x'.repeat(100000)
    expect(escapeTsvCell(long)).toBe(long)
  })
})

describe('neutralizeFormula', () => {
  it.each(['=SUM(A1:A9)', "=cmd|' /C calc'!A0", '+1+1', '@SUM(1)', '-2+3', '-cmd', '\tcmd', '\rcmd'])('prefixes %j so a spreadsheet shows it as text', (text) => {
    expect(neutralizeFormula(text)).toBe(`'${text}`)
  })
  it.each(['plain', '12', '-5', '+7.5', '-1e9', '3.14', '', 'a=b', 'x+y'])('does not touch %j', (text) => {
    expect(neutralizeFormula(text)).toBe(text)
  })
  it('can be switched off', () => expect(escapeTsvCell('=1+1', false)).toBe('=1+1'))
  it('neutralises and quotes together', () => expect(escapeTsvCell('=a\tb')).toBe(`"'=a\tb"`))
})

describe('toTsv', () => {
  it('joins cells with tabs and rows with line feeds', () => {
    expect(toTsv([['a', 'b'], ['c', 'd']])).toBe('a\tb\nc\td')
  })
  it('writes null, undefined and non-finite numbers as empty and numbers unquoted', () => {
    expect(toTsv([[null, undefined, 3, -4.5, NaN, Infinity]])).toBe('\t\t3\t-4.5\t\t')
  })
  it('returns an empty string for no rows', () => {
    expect(toTsv([])).toBe('')
  })
  it('round-trips hostile text as data, never as markup', () => {
    expect(toTsv([['<img src=x onerror=alert(1)>', '<script>1</script>']])).toBe('<img src=x onerror=alert(1)>\t<script>1</script>')
  })
})
