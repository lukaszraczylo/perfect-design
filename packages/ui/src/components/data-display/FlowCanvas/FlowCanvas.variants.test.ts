import { afterEach, describe, expect, it } from 'vitest'
import { FLOW_EDGE_STYLES, FLOW_HEIGHTS, FLOW_SIZES, FLOW_VARIANTS, flowCanvasVariants, flowCanvasViewportVariants } from './variants'
import { mountCanvas, unmountAll, viewport } from './testing'

afterEach(unmountAll)

const OFFSET = { nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 300, y: 150 }], edges: [{ id: 'e', from: 'a', to: 'b' }] }
const edgeD = (w: ReturnType<typeof mountCanvas>) => w.find('[data-slot="flow-canvas-edge-line"]').attributes('d')

describe('variants: defaults are unchanged', () => {
  it('pins the default class strings and lists', () => {
    expect(flowCanvasVariants()).toBe('flex w-full min-w-0 flex-col text-foreground gap-2')
    expect(flowCanvasViewportVariants()).toContain('h-96 bg-card')
    expect(FLOW_VARIANTS).toEqual(['plain', 'dots', 'grid'])
    expect(FLOW_SIZES).toEqual(['sm', 'md', 'lg'])
    expect(FLOW_EDGE_STYLES).toEqual(['straight', 'curved', 'orthogonal'])
    expect(FLOW_HEIGHTS).toEqual({ sm: 288, md: 384, lg: 512 })
  })
  it('explicit defaults render like omitted props', () => {
    const strip = (h: string) => h.replace(/v-\d+-\d+|v-\d+/g, 'v')
    expect(strip(mountCanvas({ variant: 'plain', size: 'md', edgeStyle: 'curved', direction: 'LR', toolbar: true, readonly: false, grid: false }).html())).toBe(strip(mountCanvas().html()))
  })
})

describe('variants: variant', () => {
  it.each([
    ['plain', 'bg-card', false],
    ['dots', 'bg-background', true],
    ['grid', 'bg-background', true],
  ])('%s', (variant, bg, pattern) => {
    const w = mountCanvas({ variant })
    expect(viewport(w).classes()).toContain(bg)
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.find('pattern').exists()).toBe(pattern)
  })
  it('unknown falls back to plain', () => {
    expect(mountCanvas({ variant: 'stripes' }).attributes('data-variant')).toBe('plain')
  })
  it('class wins over variant classes', () => {
    const w = mountCanvas({ class: 'gap-9' })
    expect(w.classes()).toContain('gap-9')
    expect(w.classes()).not.toContain('gap-2')
  })
})

describe('variants: size', () => {
  it.each([
    ['sm', 'h-72', 'gap-1.5'],
    ['md', 'h-96', 'gap-2'],
    ['lg', 'h-128', 'gap-3'],
  ])('%s', (size, h, gap) => {
    const w = mountCanvas({ size })
    expect(viewport(w).classes()).toContain(h)
    expect(w.classes()).toContain(gap)
    expect(w.attributes('data-size')).toBe(size)
  })
  it('unknown falls back to md', () => {
    expect(viewport(mountCanvas({ size: 'huge' })).classes()).toContain('h-96')
  })
})

describe('variants: edgeStyle', () => {
  it('draws different paths per style and falls back to curved', () => {
    const d = Object.fromEntries(FLOW_EDGE_STYLES.map((s) => [s, edgeD(mountCanvas({ edgeStyle: s, ...OFFSET }))]))
    expect(d.straight).toMatch(/^M[\d.,-]+L[\d.,-]+$/)
    expect(d.curved).toContain('C')
    expect(new Set(Object.values(d)).size).toBe(3)
    expect(edgeD(mountCanvas({ edgeStyle: 'wavy', ...OFFSET }))).toBe(d.curved)
  })
  it('orthogonal uses rounded right angles when the nodes are offset', () => {
    const w = mountCanvas({ edgeStyle: 'orthogonal', nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 300, y: 150 }], edges: [{ id: 'e', from: 'a', to: 'b' }] })
    expect(edgeD(w)).toContain('Q')
  })
})

describe('variants: combinations', () => {
  it.each(FLOW_VARIANTS.flatMap((v) => FLOW_SIZES.map((s) => [v, s] as const)))('%s with size %s', (variant, size) => {
    const w = mountCanvas({ variant, size, edgeStyle: 'orthogonal', readonly: true })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(w.attributes('data-size')).toBe(size)
    expect(viewport(w).attributes('role')).toBe('application')
  })
})
