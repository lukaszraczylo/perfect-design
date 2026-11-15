import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FunnelChart from './FunnelChart.vue'
import { FUNNEL_GAP_PX, FUNNEL_PLOT_HEIGHT, FUNNEL_ROW_HEIGHT, funnelChartVariants } from './variants'

const m = (props: Record<string, unknown>) => mount(FunnelChart, { props: props as never })
const shapes = (w: ReturnType<typeof m>) => w.findAll('[data-slot="funnel-chart-stage"]')
const texts = (w: ReturnType<typeof m>, kind: string) => w.findAll(`[data-slot="funnel-chart-${kind}"]`).map((t) => t.element.childNodes[0]!.textContent)
const points = (d: string) => [...d.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((x) => [Number(x[1]), Number(x[2])] as const)
const bbox = (d: string) => {
  const p = points(d)
  return { x0: Math.min(...p.map((q) => q[0])), x1: Math.max(...p.map((q) => q[0])), y0: Math.min(...p.map((q) => q[1])), y1: Math.max(...p.map((q) => q[1])) }
}

const stages = [{ label: 'Visited', value: 1000 }, { label: 'Signed up', value: 500 }, { label: 'Activated', value: 250 }, { label: 'Subscribed', value: 100 }]
const base = { label: 'Sample', stages }

describe('FunnelChart variants: defaults are pinned', () => {
  it('keeps the default markup when no variation prop is set', () => {
    const w = m(base)
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 196')
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('funnel')
    expect(w.attributes('data-orientation')).toBe('vertical')
    expect(shapes(w)).toHaveLength(4)
    expect(texts(w, 'value')).toEqual(['1K', '500', '250', '100'])
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ ...base, variant: 'funnel', orientation: 'vertical', labelPlacement: 'beside', showConversion: false, showValues: true, size: 'md', gap: 'md', tone: 'chart-1' }).html()).toBe(m(base).html())
  })
  it('funnelChartVariants gives the same classes for plain elements', () => {
    expect(funnelChartVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(funnelChartVariants({ size: 'sm' })).toContain('gap-1.5')
    expect(funnelChartVariants({ size: 'lg', class: 'x' })).toBe('flex w-full min-w-0 flex-col gap-3 x')
  })
})

describe('FunnelChart variants: variant', () => {
  it('funnel joins the stages: each shape ends as wide as the next one starts', () => {
    const w = m({ ...base, variant: 'funnel' })
    const a = points(shapes(w)[0]!.attributes('d')!)
    const b = points(shapes(w)[1]!.attributes('d')!)
    const bottomWidthA = Math.abs(a[2]![0] - a[3]![0])
    const topWidthB = Math.abs(b[1]![0] - b[0]![0])
    expect(bottomWidthA).toBeCloseTo(topWidthB, 1)
    expect(a[0]![0]).not.toBe(a[3]![0])
  })
  it('funnel widths follow the values (top edge of each stage)', () => {
    const w = m({ ...base, variant: 'funnel' })
    const tops = shapes(w).map((s) => {
      const p = points(s.attributes('d')!)
      return Math.abs(p[1]![0] - p[0]![0])
    })
    expect(tops[1]! / tops[0]!).toBeCloseTo(0.5, 2)
    expect(tops[2]! / tops[0]!).toBeCloseTo(0.25, 2)
    expect(tops[3]! / tops[0]!).toBeCloseTo(0.1, 2)
  })
  it('pyramid stacks the shapes the other way round: the first stage is the widest and at the bottom', () => {
    const w = m({ ...base, variant: 'pyramid' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(boxes[0]!.y0).toBeGreaterThan(boxes[1]!.y0)
    expect(boxes[3]!.y0).toBeLessThan(boxes[2]!.y0)
    expect(boxes[0]!.x1 - boxes[0]!.x0).toBeGreaterThan(boxes[3]!.x1 - boxes[3]!.x0)
    expect(w.attributes('data-variant')).toBe('pyramid')
  })
  it('pyramid keeps the data order in the table and the labels', () => {
    const w = m({ ...base, variant: 'pyramid' })
    expect(w.findAll('tbody th').map((t) => t.text())).toEqual(stages.map((s) => s.label))
    expect(texts(w, 'label')).toEqual(stages.map((s) => s.label))
  })
  it('steps draws centred rectangles of the width of each value', () => {
    const w = m({ ...base, variant: 'steps' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(points(shapes(w)[0]!.attributes('d')!)).toHaveLength(4)
    const centres = boxes.map((b) => (b.x0 + b.x1) / 2)
    expect(new Set(centres.map((c) => Math.round(c))).size).toBe(1)
    expect((boxes[1]!.x1 - boxes[1]!.x0) / (boxes[0]!.x1 - boxes[0]!.x0)).toBeCloseTo(0.5, 2)
    expect(shapes(w)[0]!.attributes('d')!.match(/[ML]/g)).toHaveLength(4)
  })
  it('bars aligns every rectangle to the start edge', () => {
    const w = m({ ...base, variant: 'bars' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(new Set(boxes.map((b) => b.x0)).size).toBe(1)
    expect((boxes[2]!.x1 - boxes[2]!.x0) / (boxes[0]!.x1 - boxes[0]!.x0)).toBeCloseTo(0.25, 2)
  })
  it('an unknown variant falls back to funnel', () => {
    expect(m({ ...base, variant: 'cone' }).html()).toBe(m(base).html())
  })
  it('the four variants differ and share name, summary text kind aside, and table', () => {
    const all = ['funnel', 'pyramid', 'bars', 'steps'].map((variant) => m({ ...base, variant }))
    expect(new Set(all.map((w) => w.html())).size).toBe(4)
    expect(new Set(all.map((w) => w.find('table').html())).size).toBe(1)
    expect(all.map((w) => w.find('[data-slot="funnel-chart-summary"]').text().split(':')[0])).toEqual(['Funnel chart', 'Pyramid chart', 'Funnel bar chart', 'Funnel step chart'])
  })
})

describe('FunnelChart variants: orientation', () => {
  it('horizontal runs the stages along x with the first one at the start', () => {
    const w = m({ ...base, orientation: 'horizontal', variant: 'steps' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(boxes.map((b) => b.x0)).toEqual([...boxes.map((b) => b.x0)].sort((a, b) => a - b))
    expect(boxes[0]!.y1 - boxes[0]!.y0).toBeGreaterThan(boxes[3]!.y1 - boxes[3]!.y0)
    expect(w.attributes('data-orientation')).toBe('horizontal')
  })
  it('horizontal height is the shape height plus the text underneath', () => {
    const h = (opts: Record<string, unknown>) => Number(m({ ...base, orientation: 'horizontal', ...opts }).find('svg').attributes('viewBox')!.split(' ')[3])
    expect(h({})).toBe(8 + FUNNEL_PLOT_HEIGHT.md + (4 + 14 * 2 + 2))
    expect(h({ showConversion: true })).toBe(h({}) + 14)
    expect(h({ showValues: false })).toBe(h({}) - 14)
  })
  it('horizontal bars sit on the bottom edge and the labels are underneath', () => {
    const w = m({ ...base, orientation: 'horizontal', variant: 'bars' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(new Set(boxes.map((b) => b.y1)).size).toBe(1)
    const labelY = Number(w.find('[data-slot="funnel-chart-label"]').attributes('y'))
    expect(labelY).toBeGreaterThan(boxes[0]!.y1)
  })
  it('horizontal pyramid has its first stage at the end', () => {
    const w = m({ ...base, orientation: 'horizontal', variant: 'pyramid' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(boxes[0]!.x0).toBeGreaterThan(boxes[3]!.x0)
  })
  it('an unknown orientation falls back to vertical', () => {
    expect(m({ ...base, orientation: 'diagonal' }).html()).toBe(m(base).html())
  })
  it('both orientations list the same data', () => {
    expect(m({ ...base, orientation: 'horizontal' }).find('table').html()).toBe(m(base).find('table').html())
  })
})

describe('FunnelChart variants: labelPlacement', () => {
  it('beside puts text left of the shapes, in a column that starts after the labels', () => {
    const w = m({ ...base, labelPlacement: 'beside' })
    expect(w.find('[data-slot="funnel-chart-chip"]').exists()).toBe(false)
    const textX = Math.max(...w.findAll('text').map((t) => Number(t.attributes('x'))))
    const shapeX = Math.min(...shapes(w).map((s) => bbox(s.attributes('d')!).x0))
    expect(textX).toBeLessThan(shapeX)
  })
  it('inside uses the full width for the shapes and plates for the text', () => {
    const inside = m({ ...base, labelPlacement: 'inside', variant: 'steps' })
    const beside = m({ ...base, labelPlacement: 'beside', variant: 'steps' })
    const width = (w: ReturnType<typeof m>) => bbox(shapes(w)[0]!.attributes('d')!).x1 - bbox(shapes(w)[0]!.attributes('d')!).x0
    expect(width(inside)).toBeGreaterThan(width(beside))
    expect(inside.findAll('[data-slot="funnel-chart-chip"]').length).toBeGreaterThan(0)
  })
  it('an unknown placement falls back to beside', () => {
    expect(m({ ...base, labelPlacement: 'above' }).html()).toBe(m(base).html())
  })
  it('both placements carry the same name and table', () => {
    expect(m({ ...base, labelPlacement: 'inside' }).find('table').html()).toBe(m(base).find('table').html())
  })
})

describe('FunnelChart variants: showConversion', () => {
  it('adds conversions to beside, inside and horizontal layouts', () => {
    expect(texts(m({ ...base, showConversion: true }), 'conv')).toEqual(['50%', '50%', '40%'])
    expect(texts(m({ ...base, showConversion: true, labelPlacement: 'inside', width: 800 }), 'label')).toContain('Signed up  500  50%')
    expect(texts(m({ ...base, showConversion: true, orientation: 'horizontal' }), 'conv')).toEqual(['50%', '50%', '40%'])
  })
  it('does not change the shapes', () => {
    expect(shapes(m({ ...base, showConversion: true })).map((s) => s.attributes('d'))).toEqual(shapes(m(base)).map((s) => s.attributes('d')))
  })
})

describe('FunnelChart variants: size and gap', () => {
  it.each([
    ['sm', 32],
    ['md', 44],
    ['lg', 56],
  ] as const)('%s sets the stage height', (size, row) => {
    const w = m({ ...base, size })
    expect(w.find('svg').attributes('viewBox')).toBe(`0 0 480 ${8 + 4 * row + 3 * 4}`)
    expect(FUNNEL_ROW_HEIGHT[size]).toBe(row)
    expect(w.classes().find((c) => c.startsWith('gap-'))).toBe({ sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' }[size])
  })
  it('size sets the height of the shapes when horizontal', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const h = Number(m({ ...base, orientation: 'horizontal', size }).find('svg').attributes('viewBox')!.split(' ')[3])
      expect(h).toBe(8 + FUNNEL_PLOT_HEIGHT[size] + 34)
    }
  })
  it.each([
    ['sm', 2],
    ['md', 4],
    ['lg', 8],
  ] as const)('gap %s leaves %s units between stages', (gap, px) => {
    const w = m({ ...base, gap, variant: 'steps' })
    const boxes = shapes(w).map((s) => bbox(s.attributes('d')!))
    expect(FUNNEL_GAP_PX[gap]).toBe(px)
    expect(boxes[1]!.y0 - boxes[0]!.y1).toBeCloseTo(px, 1)
  })
  it('a larger gap makes the stages thinner when the height is fixed', () => {
    const t = (gap: string) => {
      const b = bbox(shapes(m({ ...base, gap, variant: 'steps', height: 200 }))[0]!.attributes('d')!)
      return b.y1 - b.y0
    }
    expect(t('lg')).toBeLessThan(t('sm'))
  })
  it('unknown sizes and gaps fall back to md', () => {
    expect(m({ ...base, size: 'huge', gap: 'wide' }).html()).toBe(m(base).html())
  })
})

describe('FunnelChart variants: combinations', () => {
  it.each(['funnel', 'pyramid', 'bars', 'steps'])('%s in both orientations, placements, sizes and gaps renders without bad numbers', (variant) => {
    for (const orientation of ['vertical', 'horizontal']) {
      for (const labelPlacement of ['beside', 'inside']) {
        for (const size of ['sm', 'md', 'lg']) {
          for (const gap of ['sm', 'md', 'lg']) {
            const w = m({ ...base, variant, orientation, labelPlacement, size, gap, showConversion: true })
            expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
            expect(shapes(w)).toHaveLength(4)
          }
        }
      }
    }
  })
  it('a pyramid, horizontal, inside, with conversion and a large size', () => {
    const w = m({ ...base, variant: 'pyramid', orientation: 'horizontal', labelPlacement: 'inside', showConversion: true, size: 'lg', gap: 'lg', width: 800 })
    expect(shapes(w)).toHaveLength(4)
    expect(w.findAll('[data-slot="funnel-chart-chip"]').length).toBeGreaterThan(0)
  })
  it('the class prop is merged last and variants never change the name', () => {
    const w = m({ ...base, variant: 'bars', class: 'max-w-sm gap-6' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).not.toContain('gap-2')
    expect(m({ ...base, variant: 'steps', orientation: 'horizontal' }).find('svg').attributes('aria-label')).toBe('Sample')
  })
  it('every variant keeps the empty state', () => {
    for (const variant of ['funnel', 'pyramid', 'bars', 'steps']) {
      expect(m({ label: 'S', stages: [], variant, orientation: 'horizontal', size: 'lg' }).find('[data-slot="funnel-chart-empty"]').exists()).toBe(true)
    }
  })
})
