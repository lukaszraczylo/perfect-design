import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, h, nextTick } from 'vue'
import MermaidDiagram from './MermaidDiagram.vue'
import { MERMAID_AUTO_MIN_SCALE } from './variants'

const FLOW = 'flowchart TD\n  A[Start] --> B{Ok?}\n  B -->|yes| C[Done]\n  B -->|no| A'
const SOURCES: Record<string, string> = {
  flowchart: FLOW,
  sequence: 'sequenceDiagram\n  Alice->>Bob: Hello\n  Bob-->>Alice: Hi',
  pie: 'pie title Sample\n  "A" : 3\n  "B" : 5',
  state: 'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Busy: go\n  Busy --> [*]',
  er: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places',
  class: 'classDiagram\n  class Animal {\n    +int age\n  }\n  Animal <|-- Dog',
  gantt: 'gantt\n  dateFormat YYYY-MM-DD\n  section S\n  Task one :a1, 2026-01-01, 3d',
  mindmap: 'mindmap\n  root((Plan))\n    One\n    Two',
  timeline: 'timeline\n  2020 : Start\n  2021 : Growth',
  journey: 'journey\n  section Day\n    Wake up: 3: Me',
}

const mounted: VueWrapper[] = []
const m = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, source = FLOW) => {
  const w = mount(MermaidDiagram, { props: { source, ...props } as never, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})
const slot = (w: VueWrapper, name: string) => w.find(`[data-slot="${name}"]`)

describe('MermaidDiagram: rendering', () => {
  it('renders a figure with an image, a text version and the controls', () => {
    const w = m()
    expect(w.element.tagName).toBe('FIGURE')
    expect(w.attributes('data-slot')).toBe('mermaid-diagram')
    expect(w.attributes('data-state')).toBe('ready')
    expect(w.attributes('data-type')).toBe('flowchart')
    const svg = slot(w, 'mermaid-diagram-svg')
    expect(svg.element.tagName.toLowerCase()).toBe('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(slot(w, 'mermaid-diagram-text').exists()).toBe(true)
    expect(slot(w, 'mermaid-diagram-controls').findAll('button')).toHaveLength(2)
  })
  it.each(Object.entries(SOURCES))('draws %s diagrams', (type, src) => {
    const w = m({}, {}, src)
    expect(w.attributes('data-type')).toBe(type)
    expect(w.find('[data-slot="mermaid-diagram-error"]').exists()).toBe(false)
    expect(w.findAll('svg path, svg text').length).toBeGreaterThan(2)
    expect(slot(w, 'mermaid-diagram-text').text().length).toBeGreaterThan(3)
    expect(w.emitted('rendered')![0]![0]).toMatchObject({ type })
  })
  it('pins the default markup of the frame', () => {
    const w = m()
    expect(w.classes()).toEqual(['relative', 'flex', 'min-w-0', 'max-w-full', 'flex-col', 'text-foreground', 'rounded-lg', 'border', 'border-border', 'bg-card', 'text-sm', 'gap-3', 'p-4'])
    expect(w.attributes('data-variant')).toBe('outline')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.attributes('data-density')).toBe('comfortable')
    expect(w.attributes('data-edge-style')).toBe('curved')
    expect(w.attributes('data-tone')).toBeUndefined()
  })
  it('sizes the svg to its natural size and lets it shrink to the container', () => {
    const svg = slot(m(), 'mermaid-diagram-svg')
    const [, , w, h] = svg.attributes('viewBox')!.split(' ')
    expect(svg.attributes('width')).toBe(w)
    expect(svg.attributes('height')).toBe(h)
    expect(svg.classes()).toEqual(expect.arrayContaining(['h-auto', 'max-w-full']))
  })
  it('defines only the markers it uses', () => {
    expect(m().findAll('marker')).toHaveLength(1)
    expect(m({}, {}, 'flowchart TD\n A --x B\n C --o D\n E --> F').findAll('marker')).toHaveLength(3)
    expect(m({}, {}, SOURCES.pie).findAll('marker')).toHaveLength(0)
  })
  it('gives every marker id a unique prefix per instance on one page', () => {
    const Two = { render: () => h('div', [h(MermaidDiagram, { source: FLOW }), h(MermaidDiagram, { source: FLOW })]) }
    const w = mount(Two, { attachTo: document.body })
    mounted.push(w as unknown as VueWrapper)
    const ids = w.findAll('marker').map((n) => n.attributes('id'))
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    for (const p of w.findAll('path[marker-end]')) expect(document.querySelectorAll(`#${CSS.escape(p.attributes('marker-end')!.slice(5, -1))}`)).toHaveLength(1)
    const titles = w.findAll('svg title').map((n) => n.attributes('id'))
    expect(new Set(titles).size).toBe(2)
  })
  it('redraws when the source changes', async () => {
    const w = m()
    await w.setProps({ source: SOURCES.pie })
    expect(w.attributes('data-type')).toBe('pie')
    await w.setProps({ source: SOURCES.sequence })
    expect(w.attributes('data-type')).toBe('sequence')
  })
  it('renders on the server without touching window', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(MermaidDiagram, { source: FLOW }) }))
    expect(html).toContain('<svg')
    expect(html).toContain('data-slot="mermaid-diagram"')
    expect(html).not.toContain('NaN')
  })
})

describe('MermaidDiagram: customisation', () => {
  it('class wins over the internal classes', () => {
    const w = m({ class: 'p-0 bg-muted rounded-none text-base' })
    expect(w.classes()).toEqual(expect.arrayContaining(['p-0', 'bg-muted', 'rounded-none', 'text-base']))
    expect(w.classes()).not.toContain('p-4')
    expect(w.classes()).not.toContain('bg-card')
    expect(w.classes()).not.toContain('text-sm')
  })
  it('passes attributes and listeners to the root', async () => {
    const onClick = vi.fn()
    const w = m({}, { id: 'diagram-1', 'data-testid': 'x', 'aria-describedby': 'note', onClick })
    expect(w.attributes('id')).toBe('diagram-1')
    expect(w.attributes('data-testid')).toBe('x')
    expect(w.attributes('aria-describedby')).toBe('note')
    await w.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })
  it('as swaps the root element and the caption element', () => {
    const w = m({ as: 'section', title: 'Plan' })
    expect(w.element.tagName).toBe('SECTION')
    expect(slot(w, 'mermaid-diagram-title').element.tagName).toBe('DIV')
    expect(slot(m({ title: 'Plan' }), 'mermaid-diagram-title').element.tagName).toBe('FIGCAPTION')
  })
  it('every part has a data-slot', () => {
    const w = m({ showSource: true, fit: 'scroll' })
    for (const s of ['mermaid-diagram', 'mermaid-diagram-viewport', 'mermaid-diagram-svg', 'mermaid-diagram-text', 'mermaid-diagram-source', 'mermaid-diagram-controls']) expect(slot(w, s).exists(), s).toBe(true)
  })
})

describe('MermaidDiagram: names and descriptions', () => {
  const ids = (w: VueWrapper) => (slot(w, 'mermaid-diagram-svg').attributes('aria-labelledby') ?? '').split(' ')
  const textOf = (w: VueWrapper, id: string) => w.find(`#${CSS.escape(id)}`).text()
  it('uses an automatic summary when nothing is given', () => {
    const w = m()
    expect(ids(w)).toHaveLength(1)
    expect(textOf(w, ids(w)[0]!)).toBe('Flowchart with 3 nodes and 3 connections, top to bottom')
    expect(slot(w, 'mermaid-diagram-title').exists()).toBe(false)
  })
  it('the title prop names the image, shows a caption and the summary becomes the description', () => {
    const w = m({ title: 'Parcel flow' })
    expect(ids(w)).toHaveLength(2)
    expect(textOf(w, ids(w)[0]!)).toBe('Parcel flow')
    expect(textOf(w, ids(w)[1]!)).toBe('Flowchart with 3 nodes and 3 connections, top to bottom')
    expect(slot(w, 'mermaid-diagram-title').text()).toBe('Parcel flow')
    expect(slot(w, 'mermaid-diagram-title').attributes('aria-hidden')).toBe('true')
  })
  it('the description prop wins over accDescr and the summary', () => {
    const w = m({ title: 'T', description: 'Explicit' }, {}, `flowchart TD\n accDescr: From the source\n A --> B`)
    expect(textOf(w, ids(w)[1]!)).toBe('Explicit')
    const v = m({ title: 'T' }, {}, `flowchart TD\n accDescr: From the source\n A --> B`)
    expect(textOf(v, ids(v)[1]!)).toBe('From the source')
  })
  it('accTitle names the image when there is no title prop; the front matter title is the caption', () => {
    const w = m({}, {}, `---\ntitle: Front matter\n---\nflowchart TD\n accTitle: Accessible name\n A --> B`)
    expect(textOf(w, ids(w)[0]!)).toBe('Accessible name')
    expect(slot(w, 'mermaid-diagram-title').text()).toBe('Front matter')
    const v = m({}, {}, `---\ntitle: Front matter\n---\nflowchart TD\n A --> B`)
    expect(textOf(v, ids(v)[0]!)).toBe('Front matter')
  })
  it('a title written in the diagram becomes the caption (pie, gantt, timeline, journey) and is not drawn in the svg', () => {
    const w = m({}, {}, SOURCES.pie)
    expect(slot(w, 'mermaid-diagram-title').text()).toBe('Sample')
    expect(w.findAll('svg text').map((t) => t.text()).join(' ')).not.toContain('Sample')
  })
  it('the title prop wins over every title in the source', () => {
    const w = m({ title: 'Prop wins' }, {}, '---\ntitle: Front\n---\npie title Own\n "A" : 1')
    expect(slot(w, 'mermaid-diagram-title').text()).toBe('Prop wins')
    expect(textOf(w, ids(w)[0]!)).toBe('Prop wins')
  })
  it('a blank title prop is ignored', () => {
    expect(slot(m({ title: '   ' }), 'mermaid-diagram-title').exists()).toBe(false)
  })
  it('every aria-labelledby id exists exactly once in the page', () => {
    const w = m({ title: 'Named', description: 'Described' })
    for (const id of ids(w)) expect(document.querySelectorAll(`#${CSS.escape(id)}`)).toHaveLength(1)
  })
})

describe('MermaidDiagram: text version', () => {
  it('is in the page for screen readers but visually hidden by default', () => {
    const w = m()
    const text = slot(w, 'mermaid-diagram-text')
    expect(text.classes()).toContain('sr-only')
    expect(text.findAll('ol > li').map((l) => l.text())).toEqual(['Start', 'Ok? (decision)', 'Done'])
    expect(text.findAll('ul > li').map((l) => l.text())).toEqual(['Start to Ok?', 'Ok? to Done: yes', 'Ok? to Start: no'])
  })
  it('a toggle reveals it and reports its state', async () => {
    const w = m()
    const btn = slot(w, 'mermaid-diagram-controls').findAll('button')[0]!
    expect(btn.text()).toBe('Show as text')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-controls')).toBe(slot(w, 'mermaid-diagram-text').attributes('id'))
    await btn.trigger('click')
    expect(slot(w, 'mermaid-diagram-text').classes()).not.toContain('sr-only')
    expect(btn.text()).toBe('Hide text version')
    expect(btn.attributes('aria-expanded')).toBe('true')
    await btn.trigger('click')
    expect(slot(w, 'mermaid-diagram-text').classes()).toContain('sr-only')
  })
  it('showTable starts visible and follows the prop', async () => {
    const w = m({ showTable: true })
    expect(slot(w, 'mermaid-diagram-text').classes()).not.toContain('sr-only')
    await w.setProps({ showTable: false })
    expect(slot(w, 'mermaid-diagram-text').classes()).toContain('sr-only')
  })
  it('lists participants and messages for sequence diagrams and slices for pie charts', () => {
    const seq = slot(m({}, {}, SOURCES.sequence), 'mermaid-diagram-text')
    expect(seq.text()).toContain('Participants')
    expect(seq.text()).toContain('Alice to Bob: Hello')
    const pie = slot(m({}, {}, SOURCES.pie), 'mermaid-diagram-text')
    expect(pie.text()).toContain('A: 3')
  })
})

describe('MermaidDiagram: source panel', () => {
  it('is hidden by default and toggles with its button', async () => {
    const w = m()
    expect(slot(w, 'mermaid-diagram-source').exists()).toBe(false)
    const btn = slot(w, 'mermaid-diagram-controls').findAll('button')[1]!
    expect(btn.text()).toBe('Show source')
    await btn.trigger('click')
    const src = slot(w, 'mermaid-diagram-source')
    expect(src.exists()).toBe(true)
    expect(src.text()).toContain('A[Start] --> B{Ok?}')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(btn.attributes('aria-controls')).toBe(src.attributes('id'))
    expect(btn.text()).toBe('Hide source')
    await btn.trigger('click')
    expect(slot(w, 'mermaid-diagram-source').exists()).toBe(false)
  })
  it.each(['showSource', 'showCode'])('%s opens it from the start and follows the prop', async (prop) => {
    const w = m({ [prop]: true })
    expect(slot(w, 'mermaid-diagram-source').exists()).toBe(true)
    await w.setProps({ [prop]: false })
    expect(slot(w, 'mermaid-diagram-source').exists()).toBe(false)
  })
  it('shows the source as text, one row per line, with a named region', () => {
    const w = m({ showSource: true })
    expect(w.findAll('[data-slot="code-viewer-line"]')).toHaveLength(4)
    expect(w.find('[role="region"][aria-label="Mermaid source"]').exists()).toBe(true)
  })
  it('stays available when the diagram has an error', async () => {
    const w = m({}, {}, 'gitGraph\n commit')
    const btns = slot(w, 'mermaid-diagram-controls').findAll('button')
    expect(btns.map((b) => b.text())).toEqual(['Show source'])
    await btns[0]!.trigger('click')
    expect(slot(w, 'mermaid-diagram-source').text()).toContain('gitGraph')
  })
})

describe('MermaidDiagram: fit', () => {
  it('width (default) has no scroll region', () => {
    const w = m()
    expect(slot(w, 'mermaid-diagram-viewport').attributes('role')).toBeUndefined()
    expect(slot(w, 'mermaid-diagram-viewport').classes()).toContain('justify-center')
  })
  it('scroll gives a focusable, named region and keeps the natural size', () => {
    const w = m({ fit: 'scroll', title: 'Parcel flow' })
    const vp = slot(w, 'mermaid-diagram-viewport')
    expect(vp.attributes('role')).toBe('region')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(vp.attributes('aria-label')).toBe('Parcel flow, scrollable diagram')
    expect(vp.classes()).toContain('overflow-auto')
    expect(vp.classes().join(' ')).toContain('focus-visible:ring-3')
    const svg = slot(w, 'mermaid-diagram-svg')
    expect(svg.classes()).toContain('max-w-none')
    expect(svg.classes()).not.toContain('max-w-full')
  })
  it('names the scroll region after the summary when there is no title', () => {
    expect(slot(m({ fit: 'scroll' }), 'mermaid-diagram-viewport').attributes('aria-label')).toBe('Flowchart with 3 nodes and 3 connections, top to bottom, scrollable diagram')
  })
  it('an unknown fit falls back to width', () => {
    expect(slot(m({ fit: 'huge' }), 'mermaid-diagram-viewport').attributes('role')).toBeUndefined()
  })
})

describe('MermaidDiagram: errors never throw and never leave the area blank', () => {
  it('a syntax error is an alert with line, column and the offending line', () => {
    const w = m({}, {}, 'flowchart TD\n  A[Start --> B')
    const err = slot(w, 'mermaid-diagram-error')
    expect(w.attributes('data-state')).toBe('error')
    expect(err.attributes('role')).toBe('alert')
    expect(err.attributes('data-code')).toBe('syntax')
    expect(slot(w, 'mermaid-diagram-error-title').text()).toBe('Syntax error at line 2, column 4')
    expect(slot(w, 'mermaid-diagram-error-message').text()).toContain('never closed')
    const line = slot(w, 'mermaid-diagram-error-line')
    expect(line.text()).toContain('2 |   A[Start --> B')
    expect(line.find('[aria-hidden="true"]').element.textContent).toMatch(/^ +\^$/)
    expect(w.find('svg').exists()).toBe(false)
  })
  it('the caret sits under the column', () => {
    const w = m({}, {}, 'flowchart TD\n  A[Start --> B')
    const caret = slot(w, 'mermaid-diagram-error-line').find('[aria-hidden="true"]').element.textContent!
    const code = slot(w, 'mermaid-diagram-error-line').find('code').element.textContent!
    expect(caret.indexOf('^') - 4).toBe(code.indexOf('[') - 4) // the opening bracket is column 4, after the "2 | " gutter
  })
  it('the offending line region is focusable (it can scroll) and named', () => {
    const line = slot(m({}, {}, 'flowchart TD\n  A[Start --> B'), 'mermaid-diagram-error-line')
    expect(line.attributes('tabindex')).toBe('0')
    expect(line.attributes('aria-label')).toBe('Source line with the error')
    expect(line.attributes('role')).toBe('group')
  })
  it('an unsupported type is a status message that names the type', () => {
    const w = m({}, {}, 'gitGraph\n commit')
    const err = slot(w, 'mermaid-diagram-error')
    expect(err.attributes('role')).toBe('status')
    expect(slot(w, 'mermaid-diagram-error-title').text()).toBe('Diagram type not supported: gitGraph')
    expect(err.text()).toContain('Supported types')
    expect(slot(w, 'mermaid-diagram-error-line').find('[aria-hidden]').exists()).toBe(false)
  })
  it('an empty source says there is nothing to draw', () => {
    for (const src of ['', '   ', '%% only a comment']) {
      const w = m({}, {}, src)
      expect(slot(w, 'mermaid-diagram-error').attributes('role')).toBe('status')
      expect(slot(w, 'mermaid-diagram-error-title').text()).toBe('Nothing to draw')
      expect(slot(w, 'mermaid-diagram-error-line').exists()).toBe(false)
    }
  })
  it('a diagram over the limit is an alert naming the limit', () => {
    const big = ['flowchart TD', ...Array.from({ length: 12 }, (_, i) => `  n${i}`)].join('\n')
    const w = m({ maxNodes: 5 }, {}, big)
    expect(slot(w, 'mermaid-diagram-error').attributes('role')).toBe('alert')
    expect(slot(w, 'mermaid-diagram-error-title').text()).toBe('Diagram is too large')
    expect(slot(w, 'mermaid-diagram-error-message').text()).toContain('maxNodes')
    const edges = ['flowchart TD', ...Array.from({ length: 12 }, (_, i) => `  a${i} --> b${i}`)].join('\n')
    expect(slot(m({ maxEdges: 5 }, {}, edges), 'mermaid-diagram-error-message').text()).toContain('maxEdges')
  })
  it('a limit error shows the line of the source it refers to', () => {
    const w = m({ maxNodes: 1 }, {}, 'flowchart TD\n A --> B')
    expect(slot(w, 'mermaid-diagram-error-line').text()).toContain('1 | flowchart TD')
  })
  it('a source over maxSourceLength is refused before parsing', () => {
    const w = m({ maxSourceLength: 50 }, {}, `flowchart TD\n${'  A --> B\n'.repeat(20)}`)
    expect(slot(w, 'mermaid-diagram-error').attributes('role')).toBe('alert')
    expect(slot(w, 'mermaid-diagram-error-title').text()).toBe('Diagram is too large')
    expect(slot(w, 'mermaid-diagram-error-message').text()).toContain('maxSourceLength')
    expect(w.emitted('error')?.[0]?.[0]).toMatchObject({ line: 1 })
  })
  it('a line over maxLineLength is refused and named', () => {
    const w = m({ maxLineLength: 40 }, {}, `flowchart TD\n  A --> B\n  C[${'x'.repeat(100)}] --> D`)
    expect(slot(w, 'mermaid-diagram-error-title').text()).toBe('Diagram is too large')
    expect(slot(w, 'mermaid-diagram-error-message').text()).toContain('Line 3')
    expect(slot(w, 'mermaid-diagram-error-message').text()).toContain('maxLineLength')
  })
  it('the default caps stop a 200k source and a 5k line, and normal sources pass', () => {
    expect(slot(m({}, {}, `flowchart TD\n${'  A --> B\n'.repeat(20000)}`), 'mermaid-diagram-error-message').text()).toContain('maxSourceLength')
    expect(slot(m({}, {}, `flowchart TD\n  A[${'x'.repeat(5000)}] --> B`), 'mermaid-diagram-error-message').text()).toContain('maxLineLength')
    expect(m().attributes('data-state')).toBe('ready')
  })
  it('invalid limits fall back to the defaults', () => {
    for (const v of [0, -1, Number.NaN, 'many', null]) expect(m({ maxNodes: v, maxEdges: v }).attributes('data-state')).toBe('ready')
  })
  it('emits error with message, line and column, and not rendered', () => {
    const w = m({}, {}, 'flowchart TD\n  A -> B')
    expect(w.emitted('error')).toHaveLength(1)
    expect(w.emitted('error')![0]![0]).toMatchObject({ line: 2, column: 5 })
    expect((w.emitted('error')![0]![0] as { message: string }).message).toContain('Unknown arrow')
    expect(w.emitted('rendered')).toBeUndefined()
  })
  it('emits rendered with type, nodes and edges, then error and rendered again as the source changes', async () => {
    const w = m()
    expect(w.emitted('rendered')![0]![0]).toEqual({ type: 'flowchart', nodes: 3, edges: 3 })
    await w.setProps({ source: 'flowchart TD\n A -> B' })
    await flushPromises()
    expect(w.emitted('error')).toHaveLength(1)
    await w.setProps({ source: SOURCES.pie })
    await flushPromises()
    expect(w.emitted('rendered')).toHaveLength(2)
    expect(w.emitted('rendered')![1]![0]).toMatchObject({ type: 'pie', nodes: 2, edges: 0 })
  })
  it('recovers when a broken source is fixed', async () => {
    const w = m({}, {}, 'flowchart TD\n A[')
    expect(w.attributes('data-state')).toBe('error')
    await w.setProps({ source: FLOW })
    expect(w.attributes('data-state')).toBe('ready')
    expect(slot(w, 'mermaid-diagram-error').exists()).toBe(false)
  })
  it.each([[undefined], [null], [42], [{}]])('a non-string source (%j) shows an error instead of throwing', (value) => {
    const w = m({ source: value })
    expect(w.text().length).toBeGreaterThan(5)
    expect(w.attributes('data-state')).toBe('error')
  })
  it('every error state shows text', () => {
    for (const src of ['', 'gitGraph', 'flowchart TD\n A[', 'hello', 'pie\n "A" : -1', 'sequenceDiagram\n A->>', 'gantt\n x :']) {
      expect(m({}, {}, src).text().replace(/Show source/, '').trim().length, src).toBeGreaterThan(10)
    }
  })
})

describe('MermaidDiagram: hostile source stays inert text', () => {
  const PAYLOADS = ['<script>window.__pwned = 1</script>', '"><img src=x onerror="window.__pwned = 1">', 'javascript:window.__pwned = 1', '<a href="javascript:alert(1)">x</a>', '<svg onload=alert(1)>']
  const sources = (p: string) => [
    `flowchart TD\n A["${p.replace(/"/g, '#quot;')}"] --> B\n click A href "javascript:alert(1)"`,
    `sequenceDiagram\n participant A as ${p.replace(/[<>]/g, '')}\n A->>A: ${p.replace(/[<>:]/g, '')}`,
    `pie title ${p.replace(/"/g, '')}\n "${p.replace(/"/g, '#quot;')}" : 3`,
    `---\ntitle: ${p.replace(/:/g, '')}\n---\nflowchart TD\n A --> B\n accTitle: ${p.replace(/:/g, '')}\n accDescr: ${p.replace(/:/g, '')}`,
    `flowchart TD\n A[${p.replace(/[[\]]/g, '')}`,
    p,
  ]
  it.each(PAYLOADS)('%s', (p) => {
    for (const src of sources(p)) {
      const w = m({ title: p, description: p, showSource: true, showTable: true }, {}, src)
      const root = w.element as HTMLElement
      expect(root.querySelector('script, img, iframe, object, embed, link, style')).toBeNull()
      expect(root.querySelectorAll('a')).toHaveLength(0)
      for (const el of root.querySelectorAll('*')) {
        for (const a of el.getAttributeNames()) {
          expect(a.startsWith('on'), `${el.tagName} has ${a}`).toBe(false)
          expect(el.getAttribute(a)!.toLowerCase()).not.toContain('javascript:')
        }
      }
      expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
      w.unmount()
      mounted.pop()
    }
  })
  it('shows the hostile text of the title literally in the caption', () => {
    const w = m({ title: '<img src=x onerror=alert(1)>' })
    expect(slot(w, 'mermaid-diagram-title').text()).toBe('<img src=x onerror=alert(1)>')
    expect(w.find('img').exists()).toBe(false)
  })
  it('shows the source literally in the source panel and the error line', () => {
    const w = m({ showSource: true }, {}, 'flowchart TD\n A["<img src=x onerror=alert(1)>"] --> B')
    expect(slot(w, 'mermaid-diagram-source').text()).toContain('<img src=x onerror=alert(1)>')
    const e = m({}, {}, 'flowchart TD\n <script>alert(1)</script>')
    expect(slot(e, 'mermaid-diagram-error-line').text()).toContain('<script>alert(1)</script>')
    expect(e.find('script').exists()).toBe(false)
  })
  it('never uses innerHTML-style output: svg text elements hold text nodes only', () => {
    const w = m({}, {}, 'flowchart TD\n A["<b>bold</b> & <i>it</i>"] --> B')
    for (const t of w.findAll('svg text')) expect(t.element.querySelectorAll(':scope > :not(tspan):not(title)')).toHaveLength(0)
  })
})

describe('MermaidDiagram: options reach the drawing', () => {
  it('direction overrides the source and unknown values are ignored', () => {
    const lr = m({ direction: 'LR' })
    expect(slot(lr, 'mermaid-diagram-svg').text()).toBeDefined()
    expect(lr.html()).toContain('left to right')
    expect(m({ direction: 'sideways' }).html()).toContain('top to bottom')
    expect(m({ direction: 'RL' }).html()).toContain('right to left')
  })
  it('edgeStyle changes the paths', () => {
    const d = (s: string) => m({ edgeStyle: s }).findAll('path[data-role="edge"]').map((p) => p.attributes('d')).join()
    expect(new Set([d('curved'), d('straight'), d('orthogonal')]).size).toBe(3)
  })
  it('redraws when options change', async () => {
    const w = m()
    const before = w.html()
    await w.setProps({ size: 'lg', density: 'spacious', rounded: 'full', tone: 'primary', direction: 'LR' })
    expect(w.html()).not.toBe(before)
    expect(w.emitted('rendered')!.length).toBeGreaterThanOrEqual(2)
  })
  it('unmounts cleanly after rapid changes', async () => {
    const w = m()
    for (let i = 0; i < 20; i++) await w.setProps({ source: i % 2 ? FLOW : SOURCES.sequence })
    expect(() => w.unmount()).not.toThrow()
    mounted.pop()
    await nextTick()
  })
})

describe('MermaidDiagram: fit="auto"', () => {
  const realRO = globalThis.ResizeObserver
  const realWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
  let boxWidth = 0
  const callbacks: ResizeObserverCallback[] = []
  const install = () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get(this: HTMLElement) { return this.dataset.slot === 'mermaid-diagram-box' ? boxWidth : 0 } })
    globalThis.ResizeObserver = class { constructor(cb: ResizeObserverCallback) { callbacks.push(cb) } observe() {} unobserve() {} disconnect() {} } as never
  }
  afterEach(() => {
    if (realWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', realWidth)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth
    globalThis.ResizeObserver = realRO
    callbacks.length = 0
    boxWidth = 0
  })
  const natural = (w: VueWrapper) => Number(slot(w, 'mermaid-diagram-svg').attributes('width'))

  const WIDE = 'flowchart LR\n A[Alpha node] --> B[Beta node] --> C[Gamma node]'
  it('exports a documented minimum scale', () => {
    expect(MERMAID_AUTO_MIN_SCALE).toBe(0.6)
  })
  it('keeps width fitting when there is room, or before anything is measured', () => {
    const w = m({ fit: 'auto' }, {}, WIDE)
    expect(w.attributes('data-fit')).toBe('width')
    expect(slot(w, 'mermaid-diagram-viewport').attributes('role')).toBeUndefined()
    install()
    boxWidth = 2000
    const roomy = m({ fit: 'auto' }, {}, WIDE)
    expect(roomy.attributes('data-fit')).toBe('width')
  })
  it('scrolls at natural size when the scale would drop below the minimum', async () => {
    install()
    boxWidth = 100
    const w = m({ fit: 'auto', title: 'Wide one' }, {}, WIDE)
    await nextTick()
    expect(natural(w)).toBeGreaterThan(100 / MERMAID_AUTO_MIN_SCALE)
    expect(w.attributes('data-fit')).toBe('scroll')
    const vp = slot(w, 'mermaid-diagram-viewport')
    expect(vp.attributes('role')).toBe('region')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(vp.attributes('aria-label')).toBe('Wide one, scrollable diagram')
    expect(slot(w, 'mermaid-diagram-svg').classes()).toContain('max-w-none')
  })
  it('the switch happens exactly at the minimum scale', async () => {
    install()
    const probe = m({ fit: 'auto' }, {}, WIDE)
    const n = natural(probe)
    boxWidth = Math.ceil(n * MERMAID_AUTO_MIN_SCALE)
    const atMin = m({ fit: 'auto' }, {}, WIDE)
    await nextTick()
    expect(atMin.attributes('data-fit')).toBe('width')
    boxWidth = Math.floor(n * MERMAID_AUTO_MIN_SCALE) - 1
    const below = m({ fit: 'auto' }, {}, WIDE)
    await nextTick()
    expect(below.attributes('data-fit')).toBe('scroll')
  })
  it('follows the container as it is resized', async () => {
    install()
    boxWidth = 2000
    const w = m({ fit: 'auto' }, {}, WIDE)
    expect(w.attributes('data-fit')).toBe('width')
    boxWidth = 80
    for (const cb of callbacks) cb([{ contentRect: { width: 80 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.attributes('data-fit')).toBe('scroll')
    boxWidth = 2000
    for (const cb of callbacks) cb([{ contentRect: { width: 2000 } } as ResizeObserverEntry], {} as ResizeObserver)
    await nextTick()
    expect(w.attributes('data-fit')).toBe('width')
  })
  it('explicit width and scroll ignore the measurement', () => {
    install()
    boxWidth = 50
    expect(m({ fit: 'width' }).attributes('data-fit')).toBe('width')
    expect(m({ fit: 'scroll' }).attributes('data-fit')).toBe('scroll')
  })
  it('errors have no fit and no measuring box', () => {
    const w = m({ fit: 'auto' }, {}, 'gitGraph')
    expect(w.attributes('data-fit')).toBeUndefined()
    expect(slot(w, 'mermaid-diagram-box').exists()).toBe(false)
  })
})
