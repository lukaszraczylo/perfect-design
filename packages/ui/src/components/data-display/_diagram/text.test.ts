import { describe, expect, it } from 'vitest'
import { cleanLabel, decodeEntities, labelBlock, measureText, metricsFor, plural, r2, truncateToWidth, wrapText } from './text'

describe('measureText', () => {
  it('is zero for empty text and grows with length', () => {
    expect(measureText('', 14)).toBe(0)
    expect(measureText('abcd', 14)).toBeGreaterThan(measureText('ab', 14))
  })
  it('measures narrow, wide, capital, CJK and bold text differently', () => {
    expect(measureText('iii', 14)).toBeLessThan(measureText('nnn', 14))
    expect(measureText('www', 14)).toBeGreaterThan(measureText('nnn', 14))
    expect(measureText('NNN', 14)).toBeGreaterThan(measureText('nnn', 14))
    expect(measureText('日本語', 14)).toBeCloseTo(42, 5)
    expect(measureText('abc', 14, true)).toBeGreaterThan(measureText('abc', 14))
  })
  it('scales linearly with the font size', () => {
    expect(measureText('hello', 28)).toBeCloseTo(2 * measureText('hello', 14), 5)
  })
})

describe('decodeEntities', () => {
  it('decodes mermaid and html entities', () => {
    expect(decodeEntities('a #quot;b#quot; #35; &amp; &lt;x&gt; &#65; #9731;')).toBe('a "b" # & <x> A ☃')
  })
  it('leaves unknown or invalid entities alone', () => {
    expect(decodeEntities('#nope; &nope; #0; #55296; #9999999;')).toBe('#nope; &nope; #0; #55296; #9999999;')
  })
})

describe('cleanLabel', () => {
  it('splits on br tags and \\n and trims', () => {
    expect(cleanLabel('a<br/>b<br>c\\nd')).toEqual(['a', 'b', 'c', 'd'])
  })
  it('strips quotes, backticks, tags and emphasis markers', () => {
    expect(cleanLabel('"quoted"')).toEqual(['quoted'])
    expect(cleanLabel('`code`')).toEqual(['code'])
    expect(cleanLabel('<b>bold</b> and <i>it</i>')).toEqual(['bold and it'])
    expect(cleanLabel('**bold** and *it* and __b__ and _i_')).toEqual(['bold and it and b and i'])
  })
  it('keeps underscores and asterisks inside words', () => {
    expect(cleanLabel('snake_case_name and 2*3*4 and a_b')).toEqual(['snake_case_name and 2*3*4 and a_b'])
  })
  it('decodes entities and keeps a single empty line for empty input', () => {
    expect(cleanLabel('a #quot;b#quot;')).toEqual(['a "b"'])
    expect(cleanLabel('')).toEqual([''])
  })
  it('drops html tags and keeps their text, so markup can never be rendered', () => {
    expect(cleanLabel('<script>alert(1)</script>')).toEqual(['alert(1)'])
    expect(cleanLabel('"><img src=x onerror=alert(1)>')).toEqual(['">'])
    expect(cleanLabel('<span class="x">kept</span> <div>too</div>')).toEqual(['kept too'])
  })
})

describe('wrapText and labelBlock', () => {
  it('keeps short text on one line', () => {
    expect(wrapText('hello world', 500, 14)).toEqual(['hello world'])
  })
  it('wraps at word boundaries within the width', () => {
    const lines = wrapText('the quick brown fox jumps over the lazy dog', 120, 14)
    expect(lines.length).toBeGreaterThan(2)
    for (const l of lines) expect(measureText(l, 14)).toBeLessThanOrEqual(120)
    expect(lines.join(' ')).toBe('the quick brown fox jumps over the lazy dog')
  })
  it('breaks a word that is longer than a line', () => {
    const lines = wrapText('x'.repeat(200), 100, 14)
    expect(lines.length).toBeGreaterThan(2)
    expect(lines.join('')).toBe('x'.repeat(200))
    for (const l of lines) expect(measureText(l, 14)).toBeLessThanOrEqual(100)
  })
  it('does not split a surrogate pair', () => {
    const text = '\u{1F600}'.repeat(30)
    const lines = wrapText(text, 40, 14)
    expect(lines.join('')).toBe(text)
    for (const l of lines) expect(l.length % 2).toBe(0)
  })
  it('keeps empty paragraphs and handles empty input', () => {
    expect(wrapText('a\n\nb', 100, 14)).toEqual(['a', '', 'b'])
    expect(wrapText('', 100, 14)).toEqual([''])
  })
  it('never wraps narrower than two characters', () => {
    expect(wrapText('abcdef', 0, 14).length).toBeGreaterThan(0)
  })
  it('labelBlock measures wrapped lines', () => {
    const b = labelBlock(['one two three four five six'], 80, 14, 20)
    expect(b.lines.length).toBeGreaterThan(1)
    expect(b.height).toBe(b.lines.length * 20)
    expect(b.width).toBeLessThanOrEqual(80)
  })
})

describe('metricsFor', () => {
  it('has the documented defaults', () => {
    expect(metricsFor()).toMatchObject({ font: 14, lineHeight: 20, radius: 8, margin: 16 })
  })
  it('scales font with size and spacing with density', () => {
    expect(metricsFor('sm').font).toBe(12)
    expect(metricsFor('lg').font).toBe(16)
    const c = metricsFor('md', 'compact')
    const s = metricsFor('md', 'spacious')
    expect(c.nodeSep).toBeLessThan(metricsFor().nodeSep)
    expect(s.nodeSep).toBeGreaterThan(metricsFor().nodeSep)
    expect(c.padX).toBeLessThan(s.padX)
    expect(c.rankSep).toBeLessThan(s.rankSep)
  })
  it('maps rounded to a radius', () => {
    expect([metricsFor('md', 'comfortable', 'none').radius, metricsFor('md', 'comfortable', 'sm').radius, metricsFor('md', 'comfortable', 'md').radius]).toEqual([0, 3, 8])
    expect(metricsFor('md', 'comfortable', 'full').radius).toBeGreaterThan(100)
  })
  it.each([['huge', 'dense', 'round'], [undefined, null, 42], ['constructor', '__proto__', 'toString']])('falls back for unknown values %j', (a, b, c) => {
    expect(metricsFor(a, b, c)).toEqual(metricsFor())
  })
})

describe('small helpers', () => {
  it('r2 rounds to two decimals', () => expect(r2(1.23456)).toBe(1.23))
  it('plural picks the form', () => {
    expect(plural(1, 'node')).toBe('1 node')
    expect(plural(2, 'node')).toBe('2 nodes')
    expect(plural(0, 'series', 'series')).toBe('0 series')
  })
  it('truncateToWidth adds an ellipsis only when needed', () => {
    expect(truncateToWidth('short', 500, 14)).toBe('short')
    const t = truncateToWidth('a very long label indeed', 60, 14)
    expect(t.endsWith('…')).toBe(true)
    expect(measureText(t, 14)).toBeLessThanOrEqual(60 + 14)
    expect(truncateToWidth('abc', 1, 14)).toBe('a…')
  })
})

describe('cleanLabel: linear time', () => {
  // Inputs large enough that the old super-linear code took seconds; the linear code takes milliseconds, so the bound survives slow CI.
  it('handles long runs of emphasis-like text quickly', () => {
    const t0 = performance.now()
    cleanLabel(' *a'.repeat(128000))
    cleanLabel('*'.repeat(128000))
    cleanLabel('_ '.repeat(80000))
    expect(performance.now() - t0).toBeLessThan(2000)
  })
  it('still strips emphasis around words and keeps snake_case', () => {
    expect(cleanLabel('**bold** and *it* and __b__ and _i_ snake_case_name')).toEqual(['bold and it and b and i snake_case_name'])
    expect(cleanLabel('2 * 3 * 4')).toEqual(['2 * 3 * 4'])
  })
})
