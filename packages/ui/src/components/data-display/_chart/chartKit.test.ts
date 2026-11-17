import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { dimension, edgeAnchor, estimateTextWidth, fitText, hasValues, labelGutter, LABEL_GAP, LABEL_SAFETY, labelStep, normalizeSeries, plural, scaleSafe, truncateLabel } from './chartKit'
import ChartLegend from './ChartLegend.vue'

describe('normalizeSeries', () => {
  it('pads to the longest input and nulls non-finite', () => {
    const n = normalizeSeries(['a', 'b'], [{ name: 'x', data: [1, NaN, 3, Infinity] }])
    expect(n.count).toBe(4)
    expect(n.categories).toEqual(['a', 'b', '', ''])
    expect(n.series[0]!.data).toEqual([1, null, 3, null])
  })
  it('tolerates garbage', () => {
    const n = normalizeSeries('nope', [null, 5, { data: 'x' }, { name: 'ok', data: [1], tone: 'success' }])
    expect(n.count).toBe(1)
    expect(n.series).toHaveLength(2)
    expect(n.series[0]!.name).toBe('Series 1')
    expect(n.series[0]!.data).toEqual([null])
    expect(n.series[1]!.tone).toBe('success')
    expect(normalizeSeries(undefined, undefined)).toEqual({ count: 0, categories: [], series: [] })
  })
  it('cycles tones and stringifies labels', () => {
    const s = Array.from({ length: 7 }, (_, i) => ({ name: `s${i}`, data: [i] }))
    const n = normalizeSeries([null, undefined, 3], s)
    expect(n.categories).toEqual(['', '', '3'])
    expect(n.series[5]!.tone).toBe('chart-1')
    expect(n.series[6]!.tone).toBe('chart-2')
  })
  it('hasValues', () => {
    expect(hasValues(normalizeSeries(['a'], [{ name: 'x', data: [NaN] }]))).toBe(false)
    expect(hasValues(normalizeSeries(['a'], [{ name: 'x', data: [0] }]))).toBe(true)
    expect(hasValues(normalizeSeries([], []))).toBe(false)
  })
})

describe('text helpers', () => {
  it('estimateTextWidth scales with length', () => {
    expect(estimateTextWidth('')).toBe(0)
    expect(estimateTextWidth('abcd', 10)).toBeCloseTo(23)
    expect(estimateTextWidth('ab')).toBeLessThan(estimateTextWidth('abcd'))
    expect(estimateTextWidth('abcd', 20)).toBeCloseTo(estimateTextWidth('abcd', 10) * 2)
  })
  it('estimateTextWidth uses the default size of 10px and is deterministic', () => {
    expect(estimateTextWidth('Warehouse Maintenance')).toBe(estimateTextWidth('Warehouse Maintenance', 10))
    expect(estimateTextWidth('Warehouse Maintenance', 12)).toBe(estimateTextWidth('Warehouse Maintenance', 12))
  })
  it('estimateTextWidth separates narrow, regular and wide glyphs', () => {
    const narrow = estimateTextWidth('iiiiiiii', 12)
    const regular = estimateTextWidth('nnnnnnnn', 12)
    const wide = estimateTextWidth('MMMMWWWW', 12)
    expect(narrow).toBeLessThan(regular)
    expect(regular).toBeLessThan(wide)
    // The old flat 0.58em per glyph gave 55.7px for all three.
    expect(wide).toBeGreaterThan(8 * 12 * 0.58 * 1.3)
    expect(narrow).toBeLessThan(8 * 12 * 0.58 * 0.6)
  })
  it('estimateTextWidth counts an emoji or a CJK glyph as one glyph of about one em', () => {
    expect(estimateTextWidth('日本', 10)).toBe(20)
    expect(estimateTextWidth('😀', 10)).toBe(10)
    expect(estimateTextWidth('éü', 10)).toBeGreaterThan(0)
  })
  it('estimateTextWidth uses the fallback width for glyphs it does not know', () => {
    expect(estimateTextWidth('Ж', 10)).toBeCloseTo(6.2)
  })
  // Advance widths (em) of IBM Plex Sans regular measured with canvas measureText in Chrome, rounded to 0.01.
  const MEASURED: Record<number, string> = {
    0.24: "' ", 0.25: 'ij', 0.27: ',.l', 0.28: '!', 0.29: ':;', 0.31: '|', 0.32: '[]f', 0.34: '(){}', 0.35: 't', 0.37: 'r', 0.38: '/\\',
    0.4: '-I', 0.42: '"', 0.45: '*', 0.46: 'z', 0.48: '?', 0.49: 'sv', 0.5: 'Lcy', 0.51: 'Jx', 0.53: 'agk', 0.55: 'e', 0.56: 'Fo', 0.57: 'T_hnu',
    0.58: 'ESZbdpq', 0.59: 'Y', 0.6: '0123456789$+<=>^`~', 0.61: 'PVX', 0.62: 'C', 0.63: 'K', 0.64: 'AR', 0.65: 'B', 0.67: 'D', 0.68: 'U', 0.69: '&',
    0.7: 'G', 0.71: '#HNOQ', 0.77: 'w', 0.81: 'M', 0.87: 'm', 0.89: '@W', 0.93: '%',
  }
  const measured = Object.entries(MEASURED).flatMap(([em, chars]) => [...chars].map((ch) => [ch, Number(em)] as const))
  it('MEASURED covers every printable ASCII glyph', () => {
    const covered = new Set(measured.map(([ch]) => ch))
    for (let code = 33; code < 127; code++) expect(covered.has(String.fromCharCode(code)), String.fromCharCode(code)).toBe(true)
  })
  it.each(measured)('estimateTextWidth never underestimates %s (measured %f em) and stays within 0.2em', (ch, em) => {
    const est = estimateTextWidth(ch, 100) / 100
    expect(est).toBeGreaterThanOrEqual(em - 0.005)
    expect(est).toBeLessThanOrEqual(em + 0.2)
  })
  it('estimateTextWidth covers the labels that clipped (Warehouse Maintenance, MMMMWWWW) at 12px', () => {
    // Chrome measured 6.81em for MMMMWWWW; Warehouse Maintenance is 21 mostly regular glyphs.
    expect(estimateTextWidth('MMMMWWWW', 12)).toBeGreaterThanOrEqual(6.81 * 12)
    const sum = (text: string) => [...text].reduce((a, ch) => a + (measured.find(([c]) => c === ch)?.[1] ?? 0.24), 0) * 12
    for (const text of ['Warehouse Maintenance', 'Mmmm WWW', 'Quarterly Review', 'Shipping & Handling']) {
      expect(estimateTextWidth(text, 12), text).toBeGreaterThanOrEqual(sum(text) - 0.1)
    }
  })
  it('fitText returns text that fits unchanged and cuts the rest by estimated width', () => {
    expect(fitText('Short', 100, 12)).toBe('Short')
    expect(fitText('', 0, 12)).toBe('')
    const cut = fitText('Warehouse Maintenance', 80, 12)
    expect(cut.endsWith('…')).toBe(true)
    expect(estimateTextWidth(cut, 12)).toBeLessThanOrEqual(80)
    // The trailing space is trimmed, and one more glyph would not have fitted.
    expect(cut).toBe('Warehouse…')
    expect(estimateTextWidth('Warehouse M…', 12)).toBeGreaterThan(80)
  })
  it('fitText keeps fewer wide glyphs than narrow ones in the same budget', () => {
    expect(fitText('MMMMMMMMMM', 60, 12).length).toBeLessThan(fitText('iiiiiiiiii', 60, 12).length)
  })
  it('fitText handles tiny budgets, bad budgets, trailing spaces and emoji', () => {
    expect(fitText('Hello', 0, 12)).toBe('…')
    expect(fitText('Hello', -5, 12)).toBe('…')
    expect(fitText('Hello', Number.NaN, 12)).toBe('Hello')
    expect(fitText('Hello', Number.POSITIVE_INFINITY, 12)).toBe('Hello')
    expect(fitText('Hello world', 45, 12)).not.toMatch(/ …$/)
    expect(fitText('😀😀😀😀', 30, 12)).toBe('😀…')
  })
  it('labelGutter adds the gap and the safety margin to the widest label', () => {
    expect(labelGutter(50)).toBe(50 + LABEL_GAP + LABEL_SAFETY)
    expect(labelGutter(50.2)).toBe(51 + LABEL_GAP + LABEL_SAFETY)
    expect(labelGutter(0)).toBe(LABEL_GAP + LABEL_SAFETY)
    expect(labelGutter(Number.NaN)).toBe(LABEL_GAP + LABEL_SAFETY)
    expect(labelGutter(-3)).toBe(LABEL_GAP + LABEL_SAFETY)
    expect(LABEL_SAFETY).toBeGreaterThan(0)
  })
  it('truncateLabel', () => {
    expect(truncateLabel('hello', 10)).toBe('hello')
    expect(truncateLabel('hello world', 6)).toBe('hello…')
    expect(truncateLabel('hello', 0)).toBe('…')
    expect(truncateLabel('hello', NaN)).toBe('…')
    expect(truncateLabel('', 3)).toBe('')
  })
  it('labelStep', () => {
    expect(labelStep(50, 20)).toBe(1)
    expect(labelStep(10, 25)).toBe(3)
    expect(labelStep(0, 25)).toBe(1)
    expect(labelStep(NaN, 25)).toBe(1)
    expect(labelStep(10, 0)).toBe(1)
  })
  it('plural / dimension', () => {
    expect(plural(1, 'point')).toBe('1 point')
    expect(plural(2, 'category', 'categories')).toBe('2 categories')
    expect(plural(0, 'bar')).toBe('0 bars')
    expect(dimension(10, 5)).toBe(10)
    expect(dimension(-1, 5)).toBe(5)
    expect(dimension('x', 5)).toBe(5)
    expect(dimension(0, 5)).toBe(5)
  })
})

describe('scaleSafe', () => {
  it('maps linearly', () => {
    const s = scaleSafe(0, 10, 100, 0)
    expect(s(0)).toBe(100)
    expect(s(10)).toBe(0)
    expect(s(5)).toBe(50)
  })
  it('zero-width domain → middle', () => {
    expect(scaleSafe(3, 3, 0, 10)(3)).toBe(5)
  })
  it('survives ±1e308 domains and non-finite input', () => {
    const s = scaleSafe(-1e308, 1e308, 0, 100)
    expect(s(0)).toBeCloseTo(50)
    expect(s(1e308)).toBeCloseTo(100)
    expect(s(NaN)).toBe(50)
    expect(scaleSafe(NaN, 1, 0, 10)(1)).toBe(5)
  })
})

describe('ChartLegend', () => {
  it('renders items with swatch classes', () => {
    const w = mount(ChartLegend, { props: { dataSlot: 'x-legend', items: [{ name: 'A', bg: 'bg-chart-1' }, { name: 'B', bg: 'bg-chart-2' }] } })
    expect(w.attributes('data-slot')).toBe('x-legend')
    expect(w.findAll('[data-slot="x-legend-item"]')).toHaveLength(2)
    expect(w.find('span').classes()).toContain('bg-chart-1')
    expect(w.text()).toContain('B')
  })
})

describe('edgeAnchor', () => {
  it('centres labels that fit, end-anchors at the right edge and start-anchors at the left edge', () => {
    expect(edgeAnchor(100, '13:00', 200)).toBe('middle')
    expect(edgeAnchor(195, '13:00:10', 200)).toBe('end')
    expect(edgeAnchor(5, '13:00:10', 200)).toBe('start')
  })
  it('an empty label is centred', () => expect(edgeAnchor(100, '', 200)).toBe('middle'))
})
