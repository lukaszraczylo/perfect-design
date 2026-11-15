import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { GoViewer, goLiteral } from './index'

const mounted: VueWrapper[] = []
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(GoViewer, { props: props as never, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}
const texts = (w: VueWrapper) => w.findAll('[data-slot="code-viewer-text"]').map((t) => t.element.textContent)

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const SRC = `package main

import (
\t"fmt"
\t"net/http"
)

type Item struct {
\tName string \`json:"name"\`
}

func handler(w http.ResponseWriter, r *http.Request) {
\tgo func() { fmt.Println("hi") }()
}
`

describe('GoViewer', () => {
  it('renders Go source with the go tokenizer and its own data-slot', () => {
    const w = make({ source: SRC })
    expect(w.attributes('data-slot')).toBe('go-viewer')
    expect(w.attributes('data-language')).toBe('go')
    expect(w.find('[role="region"]').attributes('aria-label')).toBe('Go source')
    const types = new Set(w.findAll('[data-slot="code-viewer-token"]').map((t) => t.attributes('data-type')))
    for (const t of ['keyword', 'string', 'type', 'function', 'punctuation', 'operator']) expect(types.has(t), t).toBe(true)
  })
  it('folds imports, structs and functions', () => {
    const labels = make({ source: SRC }).findAll('[data-slot="code-viewer-fold"]').map((b) => b.attributes('aria-label'))
    expect(labels).toEqual(['Fold lines 3 to 5', 'Fold lines 8 to 9', 'Fold lines 12 to 13'])
  })
  it('renders a value as a composite literal', () => {
    const value = { name: 'api', ok: true }
    expect(texts(make({ value })).join('\n')).toBe(goLiteral(value))
  })
  it('wraps a value in a package and passes the number mode', () => {
    const w = make({ value: [1, NaN], package: 'config', numbers: 'float64' })
    const out = texts(w).join('\n')
    expect(out).toBe('package config\n\nimport "math"\n\nvar data = []any{\n\tfloat64(1),\n\tmath.NaN(),\n}')
  })
  it('lets source win over value and ignores package for source', () => {
    expect(texts(make({ source: 'x := 1', value: { a: 1 }, package: 'p' }))).toEqual(['x := 1'])
  })
  it('writes nil when neither source nor value is given', () => {
    expect(texts(make())).toEqual(['nil'])
  })
  it('shows a Go comment instead of throwing for circular values', () => {
    const a: Record<string, unknown> = {}
    a.me = a
    expect(texts(make({ value: a }))[0]).toBe('// Cannot render this value as a Go literal: Cannot render a circular structure as a Go literal (cycle at $.me)')
  })
  it('forwards CodeViewer props and re-emits events', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const w = make({ source: SRC, filename: 'main.go', highlightLines: '13', wrap: true, defaultFoldDepth: 0, startLine: 1, variant: 'plain', class: 'mb-2' })
    expect(w.find('[data-slot="code-viewer-title"]').text()).toBe('main.go')
    expect(w.find('[data-highlighted]').exists()).toBe(false) // line 13 is inside a collapsed region
    expect(w.classes()).toContain('mb-2')
    await w.find('[data-slot="copy-button"]').trigger('click')
    await flushPromises()
    expect(w.emitted('copy')).toEqual([[SRC]])
    await w.find('[data-slot="code-viewer-placeholder"]').trigger('click')
    expect(w.emitted('fold')).toHaveLength(1)
  })
  it('tabs render with a 4 column tab size for gofmt output', () => {
    expect(make({ value: { a: 1 } }).find('[data-slot="code-viewer-code"]').classes()).toContain('[tab-size:4]')
  })
  it('passes attributes through', () => {
    expect(make({ source: 'x' }, { id: 'g' }).attributes('id')).toBe('g')
  })
})
