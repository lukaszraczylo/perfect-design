import { describe, expect, it } from 'vitest'
import { hasEscapes, parseAnsi, rgbToColor, stripAnsi } from './ansi'

const E = '\u001b'

describe('parseAnsi', () => {
  it('returns one plain segment for plain text and nothing for empty input', () => {
    expect(parseAnsi('hello')).toEqual([{ text: 'hello' }])
    expect(parseAnsi('')).toEqual([])
    expect(parseAnsi(undefined as unknown as string)).toEqual([])
  })
  it('maps basic, bright, bold and reset codes', () => {
    const s = parseAnsi(`${E}[31mred${E}[0m ${E}[1;92mgreen${E}[22;39m!`)
    expect(s).toEqual([{ fg: 'red', text: 'red' }, { text: ' ' }, { fg: 'green', bold: true, text: 'green' }, { text: '!' }])
  })
  it('handles background, inverse, italic, underline, strike, dim and their resets', () => {
    const s = parseAnsi(`${E}[44;3;4;9;2mA${E}[23;24;29;22;49mB${E}[7mC${E}[27mD${E}[;mE`)
    expect(s[0]).toMatchObject({ bg: 'blue', italic: true, underline: true, strike: true, dim: true, text: 'A' })
    expect(s[1]).toEqual({ text: 'B' })
    expect(s[2]).toMatchObject({ inverse: true, text: 'C' })
    expect(s.map((x) => x.text).join('')).toBe('ABCDE')
  })
  it('maps 256 and truecolor values to named colours and ignores bad ones', () => {
    expect(parseAnsi(`${E}[38;5;1mA`)[0].fg).toBe('red')
    expect(parseAnsi(`${E}[38;5;9mA`)[0].fg).toBe('red')
    expect(parseAnsi(`${E}[38;5;196mA`)[0].fg).toBe('red')
    expect(parseAnsi(`${E}[38;5;240mA`)[0].fg).toBe('black')
    expect(parseAnsi(`${E}[38;5;250mA`)[0].fg).toBe('white')
    expect(parseAnsi(`${E}[48;5;21mA`)[0].bg).toBe('blue')
    expect(parseAnsi(`${E}[38;5;999mA`)[0].fg).toBeUndefined()
    expect(parseAnsi(`${E}[38;2;0;200;0mA`)[0].fg).toBe('green')
    expect(parseAnsi(`${E}[38;2;999;0;0mA`)[0].fg).toBeUndefined()
    expect(parseAnsi(`${E}[38;9mA`)[0].fg).toBeUndefined()
  })
  it('classifies hues', () => {
    expect(rgbToColor(255, 255, 0)).toBe('yellow')
    expect(rgbToColor(0, 255, 255)).toBe('cyan')
    expect(rgbToColor(0, 0, 255)).toBe('blue')
    expect(rgbToColor(255, 0, 255)).toBe('magenta')
    expect(rgbToColor(255, 0, 20)).toBe('red')
    expect(rgbToColor(20, 20, 20)).toBe('black')
    expect(rgbToColor(230, 230, 230)).toBe('white')
  })
  it('removes unsupported escapes and control characters', () => {
    expect(stripAnsi(`a${E}[2Kb${E}[1;1Hc${E}]0;title\u0007d${E}]8;;http://x${E}\\e${E}(Bf${E}Mg\r\u0000h\u009b31mi`)).toBe('abcdefghi')
    expect(stripAnsi(`x${E}[`)).toBe('x')
    expect(stripAnsi(`x${E}[12`)).toBe('x')
    expect(stripAnsi(`x${E}[1;zy`)).toBe('xy')
    expect(stripAnsi(`x${E}`)).toBe('x')
    expect(stripAnsi(`${E}[3?mA`)).toBe('A')
  })
  it('keeps tabs and newlines, and never emits markup or colour values', () => {
    expect(stripAnsi('a\tb\nc')).toBe('a\tb\nc')
    const hostile = parseAnsi(`${E}[31m<img src=x onerror=alert(1)>${E}[0m`)
    expect(hostile[0].text).toBe('<img src=x onerror=alert(1)>')
    expect(JSON.stringify(hostile)).not.toMatch(/#|rgb/)
  })
  it('hasEscapes spots controls', () => {
    expect(hasEscapes('plain\ttext')).toBe(false)
    expect(hasEscapes(`a${E}[0m`)).toBe(true)
    expect(hasEscapes('a\rb')).toBe(true)
  })
  it('parses a large line quickly', () => {
    const line = `${E}[32mok${E}[0m `.repeat(20000)
    const t = performance.now()
    expect(parseAnsi(line).length).toBeGreaterThan(1)
    expect(performance.now() - t).toBeLessThan(1500)
  })
})
