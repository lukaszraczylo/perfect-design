import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { EDGES, NODES, content, edgeEl, flush, mountCanvas, nodeEl, nodeIds, nodesProp, pointer, status, svgOf, unmountAll, viewport } from './testing'

afterEach(unmountAll)

describe('FlowCanvas: structure and names', () => {
  it('renders the root, the application region, nodes and edges with data-slot hooks', () => {
    const w = mountCanvas()
    expect(w.attributes('data-slot')).toBe('flow-canvas')
    const vp = viewport(w)
    expect(vp.attributes('role')).toBe('application')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(vp.attributes('dir')).toBe('ltr')
    expect(vp.attributes('aria-label')).toBe('Sample flow')
    expect(w.findAll('[data-slot="flow-canvas-node"]')).toHaveLength(3)
    expect(w.findAll('[data-slot="flow-canvas-edge"]')).toHaveLength(1)
    for (const slot of ['toolbar', 'svg', 'content', 'edges', 'nodes', 'help', 'status', 'text', 'controls']) expect(w.find(`[data-slot="flow-canvas-${slot}"]`).exists(), slot).toBe(true)
  })
  it('describes the keyboard model through aria-describedby', () => {
    const w = mountCanvas()
    const id = viewport(w).attributes('aria-describedby')!
    const help = document.getElementById(id)!
    expect(help.textContent).toContain('C starts a connection')
    expect(help.textContent).toContain('Alt plus an arrow key moves')
    expect(help.textContent).toContain('Escape cancels')
    expect(help.className).toContain('sr-only')
  })
  it('shortens the keyboard description when read only', () => {
    const w = mountCanvas({ readonly: true })
    const help = document.getElementById(viewport(w).attributes('aria-describedby')!)!
    expect(help.textContent).toContain('read only')
    expect(help.textContent).not.toContain('C starts a connection')
  })
  it('names nodes by label (id as fallback) and exposes the selection with aria-pressed', () => {
    const w = mountCanvas({ nodes: [...NODES(), { id: 'plain', x: 500, y: 300 }] })
    const el = nodeEl(w, 'a')
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('aria-label')).toBe('Alpha')
    expect(el.getAttribute('aria-pressed')).toBe('false')
    expect(nodeEl(w, 'plain').getAttribute('aria-label')).toBe('plain')
  })
  it('names edges "Edge A to B" and adds the label', () => {
    const w = mountCanvas({ edges: [{ id: 'e1', from: 'a', to: 'b', label: 'ships' }, { id: 'e2', from: 'b', to: 'c' }] })
    expect(edgeEl(w, 'e1').getAttribute('aria-label')).toBe('Edge Alpha to Beta: ships')
    expect(edgeEl(w, 'e2').getAttribute('aria-label')).toBe('Edge Beta to Gamma')
  })
  it('uses aria-label and aria-labelledby from attributes for the application region, not the root', () => {
    const w = mountCanvas({ label: undefined, 'aria-label': 'From attribute' })
    expect(viewport(w).attributes('aria-label')).toBe('From attribute')
    expect(w.attributes('aria-label')).toBeUndefined()
    const by = mountCanvas({ label: undefined, 'aria-labelledby': 'heading-1' })
    expect(viewport(by).attributes('aria-labelledby')).toBe('heading-1')
    expect(viewport(by).attributes('aria-label')).toBeUndefined()
  })
  it('merges class last, passes attributes to the root and keeps data-slot', () => {
    const w = mountCanvas({ class: 'custom-class gap-8', 'data-testid': 'flow', id: 'my-flow' })
    expect(w.classes()).toContain('custom-class')
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.attributes('data-testid')).toBe('flow')
    expect(w.attributes('id')).toBe('my-flow')
  })
})

describe('FlowCanvas: content safety and edge cases', () => {
  it('renders hostile labels as text only', () => {
    const hostile = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>'
    const w = mountCanvas({ nodes: [{ id: 'h', label: hostile, x: 0, y: 0 }, { id: 'i', label: '"><svg onload=1>', x: 300, y: 0 }], edges: [{ id: 'e', from: 'h', to: 'i', label: '<b>bold</b>' }] })
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('script').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(nodeEl(w, 'h').getAttribute('aria-label')).toBe(hostile)
    expect(nodeEl(w, 'h').textContent).toContain('<img')
    expect(w.find('[data-slot="flow-canvas-edge-label"]').text()).toBe('<b>bold</b>')
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
    expect(w.find('[data-slot="flow-canvas-text"]').text()).toContain('<img')
  })
  it('treats hostile ids as data (attributes and Map keys), not selectors', () => {
    const id = '"] ,[data-slot="flow-canvas-node'
    const w = mountCanvas({ nodes: [{ id, label: 'Odd', x: 0, y: 0 }, { id: '__proto__', label: 'Proto', x: 300, y: 0 }], edges: [{ id: 'constructor', from: id, to: '__proto__' }] })
    expect(w.findAll('[data-slot="flow-canvas-node"]')).toHaveLength(2)
    expect(nodeEl(w, id).getAttribute('aria-label')).toBe('Odd')
    expect(nodeEl(w, '__proto__').getAttribute('aria-label')).toBe('Proto')
    expect(w.findAll('[data-slot="flow-canvas-edge"]')).toHaveLength(1)
  })
  it('wraps long labels, cuts them with an ellipsis and keeps the full text in a tooltip and the name', () => {
    const long = 'Consolidated freight manifest for the northern distribution corridor and every connecting depot along it'
    const w = mountCanvas({ nodes: [{ id: 'l', label: long, x: 0, y: 0 }] })
    const el = nodeEl(w, 'l')
    const lines = el.querySelectorAll('tspan')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.length).toBeLessThanOrEqual(2)
    expect(el.textContent).toContain('…')
    expect(el.querySelector('title')!.textContent).toBe(long)
    expect(el.getAttribute('aria-label')).toBe(long)
  })
  it('survives a huge label without hanging and cuts it', () => {
    const t0 = performance.now()
    const w = mountCanvas({ nodes: [{ id: 'h', label: 'x'.repeat(200_000), x: 0, y: 0 }, { id: 'o', label: 'W'.repeat(50_000), x: 300, y: 0 }] })
    expect(performance.now() - t0).toBeLessThan(3000)
    expect(nodeEl(w, 'h').querySelector('[data-slot="flow-canvas-node-label"]')!.textContent!.length).toBeLessThan(80)
    expect(nodeEl(w, 'h').getAttribute('aria-label')!.length).toBe(500)
  })
  it('shows a title only for labels that were cut', () => {
    const w = mountCanvas()
    expect(nodeEl(w, 'a').querySelector('title')).toBeNull()
  })
  it('keeps multi-line and unicode labels intact', () => {
    const w = mountCanvas({ nodes: [{ id: 'u', label: 'Line one\nLine two', x: 0, y: 0, height: 80 }, { id: 'r', label: 'שלום עולם', x: 300, y: 0 }] })
    expect(nodeEl(w, 'u').querySelectorAll('tspan')).toHaveLength(2)
    const text = nodeEl(w, 'r').querySelector('text')!
    expect(text.textContent).toContain('שלום עולם')
    expect(text.getAttribute('unicode-bidi')).toBe('plaintext')
  })
  it('shows the empty state and no list entries without nodes', () => {
    const w = mountCanvas({ nodes: [], edges: [], emptyText: 'Add a step' })
    expect(w.find('[data-slot="flow-canvas-empty"]').text()).toBe('Add a step')
    expect(w.findAll('[data-slot="flow-canvas-node"]')).toHaveLength(0)
    expect(w.find('[data-slot="flow-canvas-text"]').text()).toContain('Nodes: 0')
  })
  it('does not draw edges to missing nodes and says so', () => {
    const w = mountCanvas({ edges: [{ id: 'x', from: 'a', to: 'ghost' }, { id: 'y', from: 'ghost', to: 'b' }, { id: 'e1', from: 'a', to: 'b' }] })
    expect(w.findAll('[data-slot="flow-canvas-edge"]')).toHaveLength(1)
    expect(w.find('[data-slot="flow-canvas-message"]').text()).toBe('2 connections were not drawn because a node is missing.')
    const one = mountCanvas({ edges: [{ id: 'x', from: 'a', to: 'ghost' }] })
    expect(one.find('[data-slot="flow-canvas-message"]').text()).toBe('1 connection was not drawn because a node is missing.')
  })
  it('draws a self loop', () => {
    const w = mountCanvas({ edges: [{ id: 's', from: 'a', to: 'a' }] })
    expect(edgeEl(w, 's').querySelector('[data-slot="flow-canvas-edge-line"]')!.getAttribute('d')).toMatch(/^M/)
  })
  it('draws dashed and dotted edges and truncates long edge labels with a tooltip', () => {
    const w = mountCanvas({ edges: [{ id: 'd', from: 'a', to: 'b', style: 'dashed' }, { id: 't', from: 'b', to: 'c', style: 'dotted', label: 'a very long connection label that cannot fit in the plate at all, really' }] })
    expect(edgeEl(w, 'd').querySelector('[data-slot="flow-canvas-edge-line"]')!.getAttribute('stroke-dasharray')).toBe('6 4')
    const dotted = edgeEl(w, 't')
    expect(dotted.querySelector('[data-slot="flow-canvas-edge-line"]')!.getAttribute('stroke-dasharray')).toBe('1.5 4')
    expect(dotted.querySelector('text')!.textContent).toContain('…')
    expect(dotted.querySelector('title')!.textContent).toContain('really')
  })
  it('renders nodes with all supported shapes and tones', () => {
    const shapes = ['rect', 'round', 'stadium', 'subroutine', 'cylinder', 'circle', 'doublecircle', 'rhombus', 'hexagon', 'parallelogram', 'trapezoid', 'asymmetric']
    const tones = ['neutral', 'primary', 'success', 'info', 'warning', 'danger']
    const w = mountCanvas({ nodes: shapes.map((shape, i) => ({ id: shape, label: shape, x: i * 20, y: 0, shape, tone: tones[i % 6] })), edges: [] })
    expect(w.findAll('[data-slot="flow-canvas-node"]')).toHaveLength(shapes.length)
    expect(nodeEl(w, 'subroutine').querySelectorAll('path').length).toBeGreaterThan(2)
    expect(nodeEl(w, 'primary' in {} ? 'x' : 'round').getAttribute('data-tone')).toBe('primary')
  })
})

describe('FlowCanvas: text alternative', () => {
  it('always has a hidden list of nodes and connections', () => {
    const w = mountCanvas()
    const text = w.find('[data-slot="flow-canvas-text"]')
    expect(text.classes()).toContain('sr-only')
    expect(text.text()).toContain('Alpha (1 connection)')
    expect(text.text()).toContain('Gamma (0 connections)')
    expect(text.text()).toContain('Edge Alpha to Beta')
    expect(text.attributes('role')).toBeUndefined()
  })
  it('counts a self loop once and includes edge labels', () => {
    const w = mountCanvas({ edges: [{ id: 's', from: 'a', to: 'a', label: 'retry' }] })
    expect(w.find('[data-slot="flow-canvas-text"]').text()).toContain('Alpha (1 connection)')
    expect(w.find('[data-slot="flow-canvas-text"]').text()).toContain('Edge Alpha to Alpha: retry')
  })
  it('"Show as list" reveals a labelled, focusable, scrollable region and toggles back', async () => {
    const w = mountCanvas()
    const button = w.find('[data-slot="flow-canvas-controls"] button')
    expect(button.text()).toBe('Show as list')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe(w.find('[data-slot="flow-canvas-text"]').attributes('id'))
    await button.trigger('click')
    const text = w.find('[data-slot="flow-canvas-text"]')
    expect(text.classes()).not.toContain('sr-only')
    expect(text.attributes('role')).toBe('region')
    expect(text.attributes('tabindex')).toBe('0')
    expect(text.attributes('aria-label')).toBe('Sample flow, list of nodes and connections')
    expect(text.classes()).toContain('overflow-auto')
    expect(button.text()).toBe('Hide list')
    expect(button.attributes('aria-expanded')).toBe('true')
    await button.trigger('click')
    expect(w.find('[data-slot="flow-canvas-text"]').classes()).toContain('sr-only')
  })
  it('names the region with a fallback when only aria-labelledby is set', async () => {
    const w = mountCanvas({ label: undefined, 'aria-labelledby': 'x' })
    await w.find('[data-slot="flow-canvas-controls"] button').trigger('click')
    expect(w.find('[data-slot="flow-canvas-text"]').attributes('aria-label')).toBe('Flow canvas, list of nodes and connections')
  })
  it('cuts very long lists and says so', () => {
    const many = Array.from({ length: 520 }, (_, i) => ({ id: `n${i}`, x: i, y: 0 }))
    const w = mountCanvas({ nodes: many, edges: [] })
    expect(w.findAll('[data-slot="flow-canvas-text"] li')).toHaveLength(500)
    expect(w.find('[data-slot="flow-canvas-text"]').text()).toContain('Nodes: 520')
    expect(w.find('[data-slot="flow-canvas-text"]').text()).toContain('cut at 500')
  })
})

describe('FlowCanvas: toolbar, slots and options', () => {
  it('shows the default toolbar with named controls', () => {
    const w = mountCanvas()
    const tb = w.find('[data-slot="flow-canvas-toolbar"]')
    expect(tb.attributes('role')).toBe('group')
    expect(tb.attributes('aria-label')).toBe('Canvas controls')
    const labels = tb.findAll('button').map((b) => b.attributes('aria-label') ?? b.text())
    expect(labels).toEqual(['Zoom out', 'Zoom in', 'Fit view', 'Auto layout', 'Undo', 'Redo', 'Delete', 'Select area'])
    expect(tb.find('[data-slot="flow-canvas-zoom"]').text()).toBe('100%')
  })
  it('hides the toolbar with toolbar=false (also its slot)', () => {
    const w = mountCanvas({ toolbar: false }, { toolbar: '<button>mine</button>' })
    expect(w.find('[data-slot="flow-canvas-toolbar"]').exists()).toBe(false)
    expect(w.text()).not.toContain('mine')
  })
  it('replaces the toolbar content with the slot and passes the actions', async () => {
    let api: Record<string, unknown> = {}
    const w = mountCanvas({}, {
      toolbar: (p: Record<string, unknown>) => {
        api = p
        return 'custom controls'
      },
    })
    expect(w.find('[data-slot="flow-canvas-toolbar"]').text()).toBe('custom controls')
    expect(Object.keys(api).sort()).toEqual(['autoLayout', 'canRedo', 'canUndo', 'deleteSelected', 'fit', 'hasSelection', 'readonly', 'redo', 'undo', 'zoom', 'zoomIn', 'zoomOut'])
    ;(api.zoomIn as () => void)()
    await nextTick()
    expect((api.zoom as number)).toBeCloseTo(1.25, 5)
  })
  it('lets the node slot draw the node content with its state', async () => {
    const seen: Record<string, unknown>[] = []
    const w = mountCanvas({}, {
      node: (p: Record<string, unknown>) => {
        seen.push(p)
        return `custom ${(p.node as { id: string }).id}`
      },
    })
    expect(nodeEl(w, 'a').textContent).toContain('custom a')
    expect(nodeEl(w, 'a').querySelector('[data-slot="flow-canvas-node-label"]')).toBeNull()
    const first = seen.find((p) => (p.node as { id: string }).id === 'a')!
    expect(first).toMatchObject({ selected: false, active: true, connecting: false, width: 148, height: 52 })
    expect(first.node).toMatchObject({ id: 'a', label: 'Alpha', x: 0, y: 0 })
    pointer(nodeEl(w, 'b'), 'pointerdown', { clientX: 310, clientY: 10 })
    await nextTick()
    expect(seen.filter((p) => (p.node as { id: string }).id === 'b').pop()).toMatchObject({ selected: true, active: true })
  })
  it('renders no ports when read only and hides editing buttons', () => {
    const w = mountCanvas({ readonly: true })
    expect(w.findAll('[data-slot="flow-canvas-port"]')).toHaveLength(0)
    const labels = w.findAll('[data-slot="flow-canvas-toolbar"] button').map((b) => b.attributes('aria-label') ?? b.text())
    expect(labels).toEqual(['Zoom out', 'Zoom in', 'Fit view', 'Select area'])
    expect(w.attributes('data-readonly')).toBeDefined()
  })
  it('draws four ports per node by default and the declared ones otherwise', () => {
    const w = mountCanvas({ nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'p', x: 300, y: 0, ports: [{ id: 'in', side: 'left', type: 'target', label: 'Input port' }] }, { id: 'n', x: 0, y: 200, ports: [] }], edges: [] })
    const ports = (id: string) => w.findAll('[data-slot="flow-canvas-port"]').filter((p) => p.attributes('data-node') === id)
    expect(ports('a')).toHaveLength(4)
    expect(ports('p')).toHaveLength(1)
    expect(ports('p')[0]!.find('title').text()).toBe('Input port')
    expect(ports('n')).toHaveLength(0)
    expect(w.find('[data-slot="flow-canvas-ports"]').attributes('aria-hidden')).toBe('true')
  })
  it('shows a node ports only for hover, focus or selection (class), and always while connecting', async () => {
    const w = mountCanvas()
    const ports = () => w.findAll('[data-slot="flow-canvas-ports"]')
    expect(ports()[0]!.classes()).toContain('opacity-0')
    pointer(nodeEl(w, 'a'), 'pointerdown', { clientX: 10, clientY: 10 })
    pointer(svgOf(w), 'pointerup', { clientX: 10, clientY: 10 })
    await nextTick()
    expect(ports()[0]!.classes()).toContain('opacity-100')
    expect(ports()[1]!.classes()).toContain('opacity-0')
  })
  it('sets data attributes for the variation props and falls back for unknown values', () => {
    const w = mountCanvas({ variant: 'grid', size: 'lg', edgeStyle: 'orthogonal' })
    expect([w.attributes('data-variant'), w.attributes('data-size'), w.attributes('data-edge-style')]).toEqual(['grid', 'lg', 'orthogonal'])
    const bad = mountCanvas({ variant: 'x', size: 'x', edgeStyle: 'x', direction: 'x' })
    expect([bad.attributes('data-variant'), bad.attributes('data-size'), bad.attributes('data-edge-style')]).toEqual(['plain', 'md', 'curved'])
  })
})

describe('FlowCanvas: background', () => {
  it('draws no pattern for plain, a dot pattern for dots and line pattern for grid', () => {
    expect(mountCanvas().find('pattern').exists()).toBe(false)
    expect(mountCanvas().find('[data-slot="flow-canvas-background"]').exists()).toBe(false)
    const dots = mountCanvas({ variant: 'dots' })
    expect(dots.find('pattern circle').exists()).toBe(true)
    expect(dots.find('[data-slot="flow-canvas-background"]').attributes('fill')).toMatch(/^url\(#.+-bg\)$/)
    const grid = mountCanvas({ variant: 'grid', grid: 40 })
    expect(grid.find('pattern path').exists()).toBe(true)
    expect(grid.find('pattern').attributes('width')).toBe('40')
  })
  it('moves and scales the pattern with the canvas and hides it when it would be too dense', async () => {
    const w = mountCanvas({ variant: 'dots' })
    expect(w.find('pattern').attributes('patternTransform')).toBe('translate(0 0) scale(1)')
    ;(w.vm as unknown as { setViewport: (v: object) => void }).setViewport({ zoom: 0.25 })
    await nextTick()
    expect(w.find('[data-slot="flow-canvas-background"]').exists()).toBe(false)
  })
})

describe('FlowCanvas: view controls and exposed methods', () => {
  type Api = { fit: () => void; zoomIn: () => void; zoomOut: () => void; zoomTo: (n: number) => void; getViewport: () => { x: number; y: number; zoom: number }; setViewport: (v: object) => void }
  const api = (w: ReturnType<typeof mountCanvas>) => w.vm as unknown as Api

  it('zoom buttons change the zoom, update the readout and disable at the limits', async () => {
    const w = mountCanvas({ minZoom: 0.5, maxZoom: 1.5 })
    const [out, inn] = w.findAll('[data-slot="flow-canvas-toolbar"] button')
    await inn!.trigger('click')
    expect(w.find('[data-slot="flow-canvas-zoom"]').text()).toBe('125%')
    await inn!.trigger('click')
    expect(w.find('[data-slot="flow-canvas-zoom"]').text()).toBe('150%')
    expect(inn!.attributes('disabled')).toBeDefined()
    await out!.trigger('click')
    expect(w.find('[data-slot="flow-canvas-zoom"]').text()).toBe('120%')
    for (let i = 0; i < 4; i++) await out!.trigger('click')
    expect(w.find('[data-slot="flow-canvas-zoom"]').text()).toBe('50%')
    expect(out!.attributes('disabled')).toBeDefined()
  })
  it('zoom keeps the view centre fixed', async () => {
    const w = mountCanvas()
    api(w).zoomIn()
    await nextTick()
    const v = api(w).getViewport()
    expect(v.zoom).toBeCloseTo(1.25, 5)
    expect(v.x).toBeCloseTo(320 - 320 * 1.25, 5)
    expect(v.y).toBeCloseTo(192 - 192 * 1.25, 5)
  })
  it('zoomTo, setViewport and getViewport clamp and ignore bad numbers', async () => {
    const w = mountCanvas()
    api(w).zoomTo(5)
    expect(api(w).getViewport().zoom).toBe(2)
    api(w).zoomTo(NaN)
    expect(api(w).getViewport().zoom).toBe(2)
    api(w).setViewport({ x: 10, y: 20, zoom: 0.01 })
    expect(api(w).getViewport()).toEqual({ x: 10, y: 20, zoom: 0.25 })
    api(w).setViewport({ x: NaN, y: 'q', zoom: undefined })
    expect(api(w).getViewport()).toEqual({ x: 10, y: 20, zoom: 0.25 })
    await nextTick()
    expect(content(w)).toBe('translate(10 20) scale(0.25)')
  })
  it('fit uses the measured size and centres the nodes (and does nothing useful at size 0)', async () => {
    const w = mountCanvas()
    api(w).fit()
    expect(api(w).getViewport().zoom).toBeLessThanOrEqual(1)
    const el = viewport(w).element
    Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 300, configurable: true })
    api(w).fit()
    const v = api(w).getViewport()
    expect(v.zoom).toBeCloseTo(Math.min((400 - 64) / 448, (300 - 64) / 252, 1), 5)
    expect(v.x + 224 * v.zoom).toBeCloseTo(200, 5)
    expect(v.y + 126 * v.zoom).toBeCloseTo(150, 5)
  })
  it('fits once when the canvas gets a size and the nodes exist (autoFit)', async () => {
    const el = HTMLElement.prototype
    const w1 = Object.getOwnPropertyDescriptor(el, 'clientWidth')
    const h1 = Object.getOwnPropertyDescriptor(el, 'clientHeight')
    Object.defineProperty(el, 'clientWidth', { get: () => 500, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    try {
      const w = mountCanvas()
      expect(api(w).getViewport().zoom).toBeLessThan(1)
      const before = api(w).getViewport()
      w.setProps({ nodes: [...NODES(), { id: 'z', label: 'Zed', x: 900, y: 0 }] })
      await nextTick()
      expect(api(w).getViewport()).toEqual(before)
      const off = mountCanvas({ autoFit: false })
      expect(api(off).getViewport()).toEqual({ x: 0, y: 0, zoom: 1 })
      const late = mountCanvas({ nodes: [], edges: [] })
      expect(api(late).getViewport().zoom).toBe(1)
      await late.setProps({ nodes: NODES() })
      expect(api(late).getViewport().zoom).toBeLessThan(1)
    } finally {
      if (w1) Object.defineProperty(el, 'clientWidth', w1)
      else delete (el as unknown as Record<string, unknown>).clientWidth
      if (h1) Object.defineProperty(el, 'clientHeight', h1)
      else delete (el as unknown as Record<string, unknown>).clientHeight
    }
  })
  it('the Fit view button fits', async () => {
    const w = mountCanvas()
    api(w).setViewport({ x: 500, y: 500, zoom: 2 })
    const fit = w.findAll('[data-slot="flow-canvas-toolbar"] button').find((b) => b.text() === 'Fit view')!
    await fit.trigger('click')
    expect(api(w).getViewport().x).not.toBe(500)
  })
  it('toggles the select-area mode with aria-pressed and a visible variant change', async () => {
    const w = mountCanvas()
    const b = w.findAll('[data-slot="flow-canvas-toolbar"] button').find((x) => x.text() === 'Select area')!
    expect(b.attributes('aria-pressed')).toBe('false')
    const before = b.classes().join(' ')
    await b.trigger('click')
    expect(b.attributes('aria-pressed')).toBe('true')
    expect(b.classes().join(' ')).not.toBe(before)
  })
})

describe('FlowCanvas: many nodes', () => {
  const many = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: `Stop ${i + 1}`, x: (i % 20) * 190, y: Math.floor(i / 20) * 90 }))
  const chain = (n: number) => Array.from({ length: n - 1 }, (_, i) => ({ id: `e${i}`, from: `n${i}`, to: `n${i + 1}` }))

  it('draws everything up to 120 nodes', () => {
    const w = mountCanvas({ nodes: many(120), edges: chain(120) })
    expect(w.findAll('[data-slot="flow-canvas-node"]')).toHaveLength(120)
  })
  it('draws only what is near the visible area for 300 nodes, plus the tab stop, and follows panning', async () => {
    const t0 = performance.now()
    const w = mountCanvas({ nodes: many(300), edges: chain(300), autoFit: false })
    const first = w.findAll('[data-slot="flow-canvas-node"]').length
    expect(first).toBeGreaterThan(5)
    expect(first).toBeLessThan(100)
    expect(nodeIds(w)).toContain('n0')
    expect(nodeIds(w)).not.toContain('n299')
    expect(w.findAll('[data-slot="flow-canvas-edge"]').length).toBeLessThan(150)
    ;(w.vm as unknown as { setViewport: (v: object) => void }).setViewport({ x: -3000, y: -1300, zoom: 1 })
    await nextTick()
    expect(nodeIds(w)).toContain('n299')
    expect(nodeIds(w)).toContain('n0') // the tab stop is kept so focus is never lost
    expect(performance.now() - t0).toBeLessThan(5000)
  })
  it('keeps the list of every node in the text alternative even when culled', () => {
    const w = mountCanvas({ nodes: many(300), edges: chain(300), autoFit: false })
    expect(w.findAll('[data-slot="flow-canvas-text"] li').length).toBe(300 + 299)
  })
  it('keeps a dragged and a connecting node drawn while they are off screen', async () => {
    const w = mountCanvas({ nodes: many(300), edges: [], autoFit: false })
    pointer(nodeEl(w, 'n1'), 'pointerdown', { clientX: 200, clientY: 10 })
    pointer(svgOf(w), 'pointermove', { clientX: 200, clientY: 5000 })
    await nextTick()
    expect(nodeIds(w)).toContain('n1')
    pointer(svgOf(w), 'pointercancel', { clientX: 200, clientY: 5000 })
  })
  it('handles 300 nodes interactively: select, move by keyboard, delete', async () => {
    const w = mountCanvas({ nodes: many(300), edges: chain(300), autoFit: false })
    const el = nodeEl(w, 'n2')
    el.focus()
    expect(document.activeElement).toBe(el)
    pointer(el, 'pointerdown', { clientX: 400, clientY: 10 })
    pointer(svgOf(w), 'pointerup', { clientX: 400, clientY: 10 })
    await nextTick()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    await flush()
    expect(nodesProp(w)).toHaveLength(299)
    expect(status(w)).toContain('Deleted Stop 3 and 2 connections.')
  })
})

describe('FlowCanvas: minimap', () => {
  it('is off by default and drawn with a box per node when on', () => {
    expect(mountCanvas().find('[data-slot="flow-canvas-minimap"]').exists()).toBe(false)
    const w = mountCanvas({ minimap: true })
    const mm = w.find('[data-slot="flow-canvas-minimap"]')
    expect(mm.attributes('aria-hidden')).toBe('true')
    expect(mm.findAll('[data-slot="flow-canvas-minimap-node"]')).toHaveLength(3)
    expect(mm.find('[data-slot="flow-canvas-minimap-view"]').exists()).toBe(true)
  })
  it('is not drawn without nodes', () => {
    expect(mountCanvas({ minimap: true, nodes: [], edges: [] }).find('[data-slot="flow-canvas-minimap"]').exists()).toBe(false)
  })
  it('centres the canvas where it is pressed and follows a drag', async () => {
    const w = mountCanvas({ minimap: true })
    const mm = w.find('[data-slot="flow-canvas-minimap"]').element
    const before = JSON.stringify((w.vm as unknown as { getViewport: () => object }).getViewport())
    pointer(mm, 'pointerdown', { clientX: 20, clientY: 20 })
    await nextTick()
    const first = JSON.stringify((w.vm as unknown as { getViewport: () => object }).getViewport())
    expect(first).not.toBe(before)
    pointer(mm, 'pointermove', { clientX: 100, clientY: 60 })
    await nextTick()
    const moved = JSON.stringify((w.vm as unknown as { getViewport: () => object }).getViewport())
    expect(moved).not.toBe(first)
    pointer(mm, 'pointerup', {})
    pointer(mm, 'pointermove', { clientX: 5, clientY: 5 })
    await nextTick()
    expect(JSON.stringify((w.vm as unknown as { getViewport: () => object }).getViewport())).toBe(moved)
  })
  it('uses the real rectangle of the minimap to convert the pointer position', async () => {
    const w = mountCanvas({ minimap: true })
    const mm = w.find('[data-slot="flow-canvas-minimap"]').element
    mm.getBoundingClientRect = () => ({ left: 100, top: 50, width: 288, height: 192, right: 388, bottom: 242, x: 100, y: 50, toJSON: () => ({}) })
    pointer(mm, 'pointerdown', { clientX: 244, clientY: 146 })
    await nextTick()
    const v = (w.vm as unknown as { getViewport: () => { x: number; y: number } }).getViewport()
    expect(Number.isFinite(v.x) && Number.isFinite(v.y)).toBe(true)
  })
})
