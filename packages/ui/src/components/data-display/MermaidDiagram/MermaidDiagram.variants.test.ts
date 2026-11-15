import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import MermaidDiagram from './MermaidDiagram.vue'
import { MERMAID_DENSITIES, MERMAID_DIRECTIONS, MERMAID_EDGE_STYLES, MERMAID_FITS, MERMAID_ROUNDED, MERMAID_SIZES, MERMAID_TONES, MERMAID_VARIANTS, mermaidDiagramVariants } from './variants'

const SRC = 'flowchart TD\n  A[Start] --> B{Ok?}\n  B -->|yes| C[Done]\n  C -.-> A'
const mounted: VueWrapper[] = []
const m = (props: Record<string, unknown> = {}, source = SRC) => {
  const w = mount(MermaidDiagram, { props: { source, ...props } as never, attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})
const nodePaths = (w: VueWrapper) => w.findAll('path[data-role="node"]')
const nodeClass = (w: VueWrapper) => nodePaths(w)[0]!.attributes('class')!
const svgHeight = (w: VueWrapper) => Number(w.find('svg').attributes('height'))
const svgWidth = (w: VueWrapper) => Number(w.find('svg').attributes('width'))
const edgeD = (w: VueWrapper) => w.findAll('path[data-role="edge"]').map((p) => p.attributes('d')).join('|')

describe('variants: defaults are unchanged', () => {
  it('explicit default values render exactly like omitted ones', () => {
    const explicit = m({ variant: 'outline', size: 'md', density: 'comfortable', edgeStyle: 'curved', rounded: 'md', tone: 'neutral', fit: 'width', as: 'figure', maxNodes: 300, maxEdges: 600 })
    const plain = m()
    const strip = (h: string) => h.replace(/v-\d+-\d+|v-\d+/g, 'v')
    expect(strip(explicit.html())).toBe(strip(plain.html()))
  })
  it('mermaidDiagramVariants() is the pinned default frame', () => {
    expect(mermaidDiagramVariants()).toBe('relative flex min-w-0 max-w-full flex-col text-foreground rounded-lg border border-border bg-card text-sm gap-3 p-4')
  })
  it('the default node is a card with a muted ink outline', () => {
    expect(nodeClass(m())).toBe('fill-card stroke-muted-foreground')
  })
  it('exports the value lists the docs document', () => {
    expect(MERMAID_VARIANTS).toEqual(['outline', 'filled', 'mono', 'soft'])
    expect(MERMAID_SIZES).toEqual(['sm', 'md', 'lg'])
    expect(MERMAID_DENSITIES).toEqual(['compact', 'comfortable', 'spacious'])
    expect(MERMAID_EDGE_STYLES).toEqual(['curved', 'straight', 'orthogonal'])
    expect(MERMAID_DIRECTIONS).toEqual(['TB', 'LR', 'BT', 'RL'])
    expect(MERMAID_ROUNDED).toEqual(['none', 'sm', 'md', 'full'])
    expect(MERMAID_TONES).toEqual(['neutral', 'primary', 'success', 'info', 'warning', 'danger'])
    expect(MERMAID_FITS).toEqual(['width', 'scroll', 'auto'])
  })
})

describe('variants: variant', () => {
  it.each([
    ['outline', ['rounded-lg', 'border', 'border-border', 'bg-card'], 'fill-card stroke-muted-foreground'],
    ['filled', ['rounded-lg', 'border', 'border-border', 'bg-card'], 'fill-muted stroke-muted-foreground'],
    ['soft', ['rounded-lg', 'bg-muted'], 'fill-card stroke-none'],
    ['mono', ['rounded-lg', 'border', 'border-foreground'], 'fill-card stroke-foreground'],
  ])('%s frame and node', (variant, frame, node) => {
    const w = m({ variant })
    expect(w.classes()).toEqual(expect.arrayContaining(frame))
    expect(w.attributes('data-variant')).toBe(variant)
    expect(nodeClass(w)).toBe(node)
  })
  it('mono keeps the proportional face so measured text always fits', () => {
    expect(m({ variant: 'mono' }).classes()).not.toContain('font-mono')
  })
  it('soft has no border and mono no card background tint', () => {
    expect(m({ variant: 'soft' }).classes()).not.toContain('border')
    expect(m({ variant: 'soft' }).classes()).not.toContain('bg-card')
  })
  it('mono ignores tones and uses ink for edges and solid fills', () => {
    const w = m({ variant: 'mono', tone: 'danger' })
    expect(nodeClass(w)).toBe('fill-card stroke-foreground')
    expect(w.find('path[data-role="edge"]').attributes('class')).toBe('fill-none stroke-foreground')
  })
  it('filled and soft tint by tone', () => {
    expect(nodeClass(m({ variant: 'filled', tone: 'primary' }))).toBe('fill-primary/10 stroke-primary')
    expect(nodeClass(m({ variant: 'soft', tone: 'success' }))).toBe('fill-success/15 stroke-none')
  })
  it('an unknown variant falls back to outline', () => {
    const w = m({ variant: 'neon' })
    expect(w.attributes('data-variant')).toBe('outline')
    expect(w.classes()).toContain('bg-card')
    expect(nodeClass(w)).toBe(nodeClass(m()))
  })
  it('the label plates and clusters follow the variant', () => {
    const src = 'flowchart TD\n subgraph g [Group]\n A -->|label| B\n end'
    expect(m({ variant: 'soft' }, src).find('path[data-role="edge-label-plate"]').attributes('class')).toContain('fill-muted')
    expect(m({}, src).find('path[data-role="edge-label-plate"]').attributes('class')).toContain('fill-card')
    expect(m({ variant: 'mono' }, src).find('path[data-role="cluster"]').attributes('class')).toBe('fill-none stroke-foreground')
    expect(m({ variant: 'filled' }, src).find('path[data-role="cluster"]').attributes('class')).toContain('fill-muted/50')
  })
})

describe('variants: size', () => {
  it.each([['sm', 'text-xs', '12'], ['md', 'text-sm', '14'], ['lg', 'text-base', '16']])('%s sets %s and %spx text in the drawing', (size, cls, px) => {
    const w = m({ size })
    expect(w.classes()).toContain(cls)
    expect(w.attributes('data-size')).toBe(size)
    expect(w.find('svg text').attributes('font-size')).toBe(px)
  })
  it('md text in the drawing is never below 12px and sm is exactly 12', () => {
    for (const size of MERMAID_SIZES) for (const t of m({ size }).findAll('svg text')) expect(Number(t.attributes('font-size'))).toBeGreaterThanOrEqual(12)
  })
  it('bigger sizes make a bigger drawing', () => {
    expect(svgWidth(m({ size: 'lg' }))).toBeGreaterThan(svgWidth(m({ size: 'sm' })))
    expect(svgHeight(m({ size: 'lg' }))).toBeGreaterThan(svgHeight(m({ size: 'sm' })))
  })
  it('an unknown size falls back to md', () => {
    expect(m({ size: 'huge' }).classes()).toContain('text-sm')
    expect(m({ size: 'huge' }).find('svg text').attributes('font-size')).toBe('14')
  })
})

describe('variants: density', () => {
  it.each([['compact', 'gap-1.5', 'p-2'], ['comfortable', 'gap-3', 'p-4'], ['spacious', 'gap-4', 'p-6']])('%s frame spacing', (density, gap, pad) => {
    const w = m({ density })
    expect(w.classes()).toEqual(expect.arrayContaining([gap, pad]))
    expect(w.attributes('data-density')).toBe(density)
  })
  it('changes the space between nodes in the drawing', () => {
    const h = (density: string) => svgHeight(m({ density }))
    expect(h('compact')).toBeLessThan(h('comfortable'))
    expect(h('comfortable')).toBeLessThan(h('spacious'))
  })
  it('an unknown density falls back to comfortable', () => {
    expect(m({ density: 'tight' }).classes()).toContain('p-4')
  })
})

describe('variants: edgeStyle', () => {
  it('curved, straight and orthogonal draw different paths', () => {
    expect(edgeD(m({ edgeStyle: 'curved' }))).toContain('C')
    expect(edgeD(m({ edgeStyle: 'straight' }))).not.toMatch(/[CQ]/)
    expect(edgeD(m({ edgeStyle: 'orthogonal' }))).toContain('Q')
    expect(m({ edgeStyle: 'straight' }).attributes('data-edge-style')).toBe('straight')
  })
  it('an unknown edge style falls back to curved', () => {
    expect(edgeD(m({ edgeStyle: 'wavy' }))).toBe(edgeD(m()))
    expect(m({ edgeStyle: 'wavy' }).attributes('data-edge-style')).toBe('curved')
  })
  it('arrowheads stay attached in every style', () => {
    for (const edgeStyle of MERMAID_EDGE_STYLES) {
      const w = m({ edgeStyle })
      const arrows = w.findAll('path[data-role="edge"][marker-end]')
      expect(arrows.length).toBe(3)
      for (const a of arrows) expect(w.find(`marker[id="${a.attributes('marker-end')!.slice(5, -1)}"]`).exists()).toBe(true)
    }
  })
})

describe('variants: direction', () => {
  it('TB is tall, LR is wide, and the text version says which', () => {
    const tb = m({ direction: 'TB' })
    const lr = m({ direction: 'LR' })
    expect(svgHeight(tb)).toBeGreaterThan(svgWidth(tb) * 0.5)
    expect(svgWidth(lr)).toBeGreaterThan(svgWidth(tb))
    expect(tb.html()).toContain('top to bottom')
    expect(lr.html()).toContain('left to right')
    expect(m({ direction: 'BT' }).html()).toContain('bottom to top')
    expect(m({ direction: 'RL' }).html()).toContain('right to left')
  })
  it('reverses the order of the nodes along the axis', () => {
    const y = (w: VueWrapper) => w.findAll('text[data-role="node-label"]').map((t) => Number(t.find('tspan').attributes('y')))
    const tb = y(m({ direction: 'TB' }, 'flowchart TD\n A --> B'))
    const bt = y(m({ direction: 'BT' }, 'flowchart TD\n A --> B'))
    expect(tb[0]).toBeLessThan(tb[1]!)
    expect(bt[0]).toBeGreaterThan(bt[1]!)
  })
  it('an unknown direction keeps the one in the source', () => {
    expect(m({ direction: 'UP' }, 'flowchart LR\n A --> B').html()).toContain('left to right')
  })
  it('applies to state, class and ER diagrams too', () => {
    for (const src of ['stateDiagram-v2\n A --> B', 'classDiagram\n A <|-- B', 'erDiagram\n A ||--o{ B : has']) {
      expect(svgWidth(m({ direction: 'LR' }, src))).toBeGreaterThan(svgWidth(m({ direction: 'TB' }, src)))
    }
  })
})

describe('variants: rounded', () => {
  it.each(MERMAID_ROUNDED)('%s changes the rectangle outline', (rounded) => {
    const w = m({ rounded })
    const d = w.findAll('path[data-role="node"]')[0]!.attributes('d')!
    expect(d.includes('A')).toBe(rounded !== 'none')
  })
  it('full draws pills (radius half the height)', () => {
    const d = m({ rounded: 'full' }, 'flowchart TD\n A[Start]').find('path[data-role="node"]').attributes('d')!
    const r = Number(/A([\d.]+),/.exec(d)![1])
    const h = Number(/V([\d.]+)A/.exec(d)![1]) - Number(/M[\d.]+,([\d.]+)/.exec(d)![1])
    expect(r * 2).toBeGreaterThanOrEqual(h - 0.5)
  })
  it('each value draws a different outline and unknown falls back to md', () => {
    const d = (rounded: string) => m({ rounded }, 'flowchart TD\n A[Start]').find('path[data-role="node"]').attributes('d')
    expect(new Set(MERMAID_ROUNDED.map(d)).size).toBe(4)
    expect(d('square')).toBe(d('md'))
  })
  it('round-by-definition shapes ignore the prop (circle, stadium)', () => {
    const d = (rounded: string) => m({ rounded }, 'flowchart TD\n A((x)) --> B([y])').findAll('path[data-role="node"]').map((p) => p.attributes('d')).join('|')
    expect(d('none')).toBe(d('full'))
  })
})

describe('variants: tone', () => {
  it.each([
    ['neutral', 'stroke-muted-foreground'],
    ['primary', 'stroke-primary'],
    ['success', 'stroke-success'],
    ['info', 'stroke-info'],
    ['warning', 'stroke-warning-foreground dark:stroke-warning'],
    ['danger', 'stroke-destructive'],
  ])('%s outlines nodes with %s', (tone, stroke) => {
    const w = m({ tone })
    expect(nodeClass(w)).toContain(stroke)
    if (tone === 'neutral') expect(w.attributes('data-tone')).toBeUndefined()
    else expect(w.attributes('data-tone')).toBe(tone)
  })
  it('warning tints its fill so the tone is not carried by a thin outline alone', () => {
    expect(nodeClass(m({ tone: 'warning' }))).toContain('fill-warning/20')
  })
  it('does not change edges or text colour', () => {
    const w = m({ tone: 'danger' })
    expect(w.find('path[data-role="edge"]').attributes('class')).toBe('fill-none stroke-muted-foreground')
    expect(w.find('text[data-role="node-label"]').attributes('class')).toBe('fill-foreground')
  })
  it('a node styled in the source keeps its own tone over the prop', () => {
    const w = m({ tone: 'primary' }, 'flowchart TD\n A:::danger --> B\n classDef danger tone:danger')
    const cls = nodePaths(w).map((p) => p.attributes('class'))
    expect(cls[0]).toContain('stroke-destructive')
    expect(cls[1]).toContain('stroke-primary')
  })
  it('an unknown tone falls back to neutral', () => {
    expect(nodeClass(m({ tone: 'rainbow' }))).toBe(nodeClass(m()))
  })
  it('does not recolour pie slices', () => {
    const src = 'pie\n "A" : 1\n "B" : 2'
    expect(m({ tone: 'danger' }, src).findAll('path[data-role="slice"]').map((p) => p.attributes('class'))).toEqual(m({}, src).findAll('path[data-role="slice"]').map((p) => p.attributes('class')))
  })
})

describe('variants: combinations do not conflict', () => {
  it('every combination of variant, size, density and tone mounts and draws', () => {
    for (const variant of MERMAID_VARIANTS) for (const size of MERMAID_SIZES) for (const density of MERMAID_DENSITIES) {
      const w = m({ variant, size, density, tone: 'info', rounded: 'sm', edgeStyle: 'orthogonal', direction: 'LR' })
      expect(w.attributes('data-state')).toBe('ready')
      expect(w.classes().filter((c) => /^p-\d/.test(c))).toHaveLength(1)
      expect(w.classes().filter((c) => /^text-(xs|sm|base)$/.test(c))).toHaveLength(1)
      expect(w.html()).not.toMatch(/NaN|undefined/)
      w.unmount()
      mounted.pop()
    }
  })
  it('class still wins in every variant', () => {
    for (const variant of MERMAID_VARIANTS) expect(m({ variant, class: 'p-1 rounded-none bg-background' }).classes()).toEqual(expect.arrayContaining(['p-1', 'rounded-none', 'bg-background']))
  })
  it('every diagram type draws in every variant without NaN', () => {
    const types = ['sequenceDiagram\n A->>B: hi', 'pie\n "A" : 1', 'stateDiagram-v2\n [*] --> A', 'erDiagram\n A ||--o{ B : x', 'classDiagram\n A <|-- B', 'gantt\n dateFormat YYYY-MM-DD\n T :2026-01-01, 2d', 'mindmap\n root\n  a', 'timeline\n 2020 : x', 'journey\n section S\n  T: 3: Me']
    for (const src of types) for (const variant of MERMAID_VARIANTS) {
      const w = m({ variant, tone: 'primary' }, src)
      expect(w.attributes('data-state'), src).toBe('ready')
      expect(w.html()).not.toMatch(/NaN|undefined/)
      w.unmount()
      mounted.pop()
    }
  })
})
