import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { YamlViewer, yamlStringify } from './index'

const mounted: VueWrapper[] = []
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(YamlViewer, { props: props as never, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}
const texts = (w: VueWrapper) => w.findAll('[data-slot="code-viewer-text"]').map((t) => t.element.textContent)

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const DEPLOYMENT = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: web
          image: nginx:1.27
          args: ["--port", "8080"]
`

describe('YamlViewer', () => {
  it('renders raw YAML with the yaml tokenizer and its own data-slot', () => {
    const w = make({ source: DEPLOYMENT })
    expect(w.attributes('data-slot')).toBe('yaml-viewer')
    expect(w.attributes('data-language')).toBe('yaml')
    expect(w.find('[role="region"]').attributes('aria-label')).toBe('YAML source')
    expect(w.find('[data-type="key"]').text()).toBe('apiVersion')
    expect(texts(w)).toHaveLength(12)
  })
  it('serialises a value to YAML', () => {
    const w = make({ value: { name: 'web', tags: ['a', 'b'], on: 'yes' } })
    expect(texts(w)).toEqual(['name: web', 'tags:', '  - a', '  - b', '"on": "yes"'])
  })
  it('uses indent 4 when asked', () => {
    expect(texts(make({ value: { a: { b: 1 } }, indent: 4 }))).toEqual(['a:', '    b: 1'])
  })
  it('lets source take precedence over value, including an empty source', () => {
    expect(texts(make({ source: 'x: 1', value: { y: 2 } }))).toEqual(['x: 1'])
    expect(texts(make({ source: '', value: { y: 2 } }))).toEqual([''])
  })
  it('writes null when neither source nor value is given', () => {
    expect(texts(make())).toEqual(['null'])
  })
  it('shows a comment instead of throwing for circular values', () => {
    const a: Record<string, unknown> = {}
    a.me = a
    const w = make({ value: a })
    expect(texts(w)[0]).toBe('# Cannot render this value as YAML: Cannot stringify a circular structure to YAML (cycle at $.me)')
    expect(w.find('[data-type="comment"]').exists()).toBe(true)
  })
  it('re-renders when the value is replaced', async () => {
    const w = make({ value: { a: 1 } })
    await w.setProps({ value: { b: 2 } })
    expect(texts(w)).toEqual(['b: 2'])
  })
  it('forwards every CodeViewer prop', async () => {
    const w = make({ source: DEPLOYMENT, filename: 'deploy.yaml', lineNumbers: false, wrap: true, maxHeight: '10rem', variant: 'plain', startLine: 5, highlightLines: '6', defaultFoldDepth: 0, label: 'Manifest', class: 'mt-4' })
    expect(w.find('[data-slot="code-viewer-title"]').text()).toBe('deploy.yaml')
    expect(w.find('[data-slot="code-viewer-line-number"]').exists()).toBe(false)
    expect(w.find('[data-slot="code-viewer-text"]').classes()).toContain('whitespace-pre-wrap')
    expect(w.find('[data-slot="code-viewer-scroll"]').attributes('style')).toContain('max-height: 10rem')
    expect(w.attributes('data-variant')).toBe('plain')
    expect(w.find('[data-highlighted]').attributes('data-line')).toBe('6')
    expect(w.find('[role="region"]').attributes('aria-label')).toBe('Manifest')
    expect(w.classes()).toContain('mt-4')
    expect(w.findAll('[data-slot="code-viewer-line"]').length).toBeLessThan(12)
    expect(w.find('[data-slot="copy-button"]').exists()).toBe(true)
    await w.setProps({ copy: false, foldable: false })
    expect(w.find('[data-slot="copy-button"]').exists()).toBe(false)
    expect(w.find('[data-slot="code-viewer-fold"]').exists()).toBe(false)
  })
  it('re-emits copy and fold', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const w = make({ source: 'a:\n  b: 1\n' })
    await w.find('[data-slot="copy-button"]').trigger('click')
    await flushPromises()
    expect(w.emitted('copy')).toEqual([['a:\n  b: 1\n']])
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    expect(w.emitted('fold')).toEqual([[{ start: 1, end: 2, collapsed: true }]])
  })
  it('copies the serialised YAML for a value', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const value = { a: [1, 2] }
    await make({ value }).find('[data-slot="copy-button"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith(yamlStringify(value))
  })
  it('folds a Kubernetes manifest by indentation and a multi-document stream per document', async () => {
    const w = make({ source: DEPLOYMENT })
    const labels = w.findAll('[data-slot="code-viewer-fold"]').map((b) => b.attributes('aria-label'))
    expect(labels).toContain('Fold lines 3 to 4')
    expect(labels).toContain('Fold lines 5 to 12')
    const multi = make({ source: 'a: &x\n  k: 1\n---\nb:\n  <<: *x\n...\n' })
    expect(multi.findAll('[data-slot="code-viewer-fold"]')).toHaveLength(2)
    expect(multi.findAll('[data-type="anchor"]').map((e) => e.text())).toEqual(['&x', '*x'])
    expect(multi.find('[data-type="operator"]').text()).toBe('<<')
  })
  it('passes attributes through', () => {
    expect(make({ source: 'a: 1' }, { id: 'y', 'data-testid': 't' }).attributes('id')).toBe('y')
  })
})
