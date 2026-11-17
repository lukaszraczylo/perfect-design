import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Heatmap from './Heatmap.vue'

const m = (props: Record<string, unknown> = {}) => mount(Heatmap, { props: { label: 'Sample', values: [[0.5, 1], [null, 0.25]], ...props } as never })
const hidden = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-cell"] .sr-only').map((n) => n.text())
const titles = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-swatch"]').map((n) => n.attributes('title'))
const pct = (v: number) => `${Math.round(v * 100)}%`

describe('Heatmap formatValue', () => {
  it('unset keeps the current output', () => {
    const w = m()
    expect(hidden(w)).toEqual(['0.5', '1', 'no data', '0.25'])
    expect(titles(w)[0]).toBe('Row 1, Column 1: 0.5')
  })
  it('formats the table cells and default tooltips', () => {
    const w = m({ formatValue: pct })
    expect(hidden(w)).toEqual(['50%', '100%', 'no data', '25%'])
    expect(titles(w)).toEqual(['Row 1, Column 1: 50%', 'Row 1, Column 2: 100%', 'Row 2, Column 1: no data', 'Row 2, Column 2: 25%'])
  })
  it('does not format empty cells', () => {
    const calls: number[] = []
    m({ formatValue: (v: number) => (calls.push(v), String(v)) })
    expect(calls).not.toContain(null)
  })
  it('cellTitle still wins for the tooltip, the table keeps formatValue', () => {
    const w = m({ formatValue: pct, cellTitle: (v: number | null) => `custom ${v}` })
    expect(titles(w)[0]).toBe('custom 0.5')
    expect(hidden(w)[0]).toBe('50%')
  })
  it('formats the range in the fallback summary', () => {
    expect(mount(Heatmap, { props: { values: [[0.25, 1]], 'aria-label': undefined, formatValue: pct } as never, attrs: { 'aria-label': 'x' } }).find('caption').text()).toBe('Heatmap: 1 row by 2 columns, values from 25% to 100%')
  })
})
