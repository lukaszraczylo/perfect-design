import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { CodeViewer, codeViewerTokenVariants, codeViewerVariants } from './index'

const mounted: VueWrapper[] = []
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(CodeViewer, { props: props as never, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}
const lineEls = (w: VueWrapper) => w.findAll('[data-slot="code-viewer-line"]')
const nums = (w: VueWrapper) => lineEls(w).map((l) => l.attributes('data-line'))
const GO = 'package main\n\nfunc main() {\n\tprintln("a")\n\tprintln("b")\n}\n'
const YAML = 'a:\n  b: 1\n  c:\n    d: 2\ne: 3\n'

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('CodeViewer good path', () => {
  it('renders a labelled, focusable scroll region', () => {
    const w = make({ source: 'a: 1', language: 'yaml', filename: 'values.yaml' })
    const region = w.find('[data-slot="code-viewer-scroll"]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBe('values.yaml')
    expect(w.attributes('data-slot')).toBe('code-viewer')
    expect(w.attributes('data-language')).toBe('yaml')
    expect(w.attributes('data-variant')).toBe('bordered')
  })
  it('names the region after the language when there is no filename, and lets label override', () => {
    expect(make({ source: 'x', language: 'yaml' }).find('[role="region"]').attributes('aria-label')).toBe('YAML source')
    expect(make({ source: 'x', language: 'go' }).find('[role="region"]').attributes('aria-label')).toBe('Go source')
    expect(make({ source: 'x' }).find('[role="region"]').attributes('aria-label')).toBe('Plain text source')
    expect(make({ source: 'x', filename: 'f.go', label: 'Handler' }).find('[role="region"]').attributes('aria-label')).toBe('Handler')
  })
  it('renders tokens with the semantic colour classes and weights', () => {
    const w = make({ source: '{"k": "v", "n": 1, "b": true} // c', language: 'json' })
    const byType = (t: string) => w.find(`[data-slot="code-viewer-token"][data-type="${t}"]`)
    expect(byType('key').classes()).toContain('text-primary')
    expect(byType('string').classes()).toContain('text-success')
    expect(byType('number').classes()).toContain('text-info')
    expect(byType('constant').classes()).toEqual(expect.arrayContaining(['text-foreground', 'font-medium']))
    expect(byType('punctuation').classes()).toContain('text-muted-foreground')
    expect(byType('comment').classes()).toEqual(expect.arrayContaining(['text-muted-foreground', 'italic']))
    expect(w.find('[data-type="plain"]').exists()).toBe(false)
  })
  it('colours every token type with an existing semantic token only', () => {
    for (const type of ['keyword', 'string', 'number', 'comment', 'type', 'function', 'key', 'constant', 'punctuation', 'operator', 'anchor', 'tag', 'plain'] as const) {
      const cls = codeViewerTokenVariants({ type })
      expect(cls).not.toMatch(/#|rgb|oklch|gradient|\[/)
    }
    expect(codeViewerTokenVariants({ type: 'function' })).toBe('text-foreground font-medium')
    expect(codeViewerTokenVariants({ type: 'type' })).toBe('text-info')
    expect(codeViewerTokenVariants({ type: 'tag' })).toBe('text-info')
    expect(codeViewerTokenVariants({ type: 'anchor' })).toBe('text-info')
    expect(codeViewerTokenVariants({ type: 'keyword' })).toBe('text-primary')
    expect(codeViewerTokenVariants({ type: 'operator' })).toBe('text-muted-foreground')
  })
  it('puts the text of a line in one cell so copying selects clean code', () => {
    const w = make({ source: 'a: 1\nb: 2', language: 'yaml' })
    expect(w.findAll('[data-slot="code-viewer-text"]').map((t) => t.text())).toEqual(['a: 1', 'b: 2'])
  })
  it('uses monospace, preserves whitespace and a tab size', () => {
    const w = make({ source: '\ta', language: 'plain' })
    const code = w.find('[data-slot="code-viewer-code"]')
    expect(code.classes()).toEqual(expect.arrayContaining(['font-mono', '[tab-size:4]']))
    expect(w.find('[data-slot="code-viewer-text"]').classes()).toContain('whitespace-pre')
  })
  it('handles CRLF, lone CR and a trailing newline', () => {
    expect(lineEls(make({ source: 'a\r\nb\rc\n' }))).toHaveLength(3)
  })
})

describe('line numbers and startLine', () => {
  it('renders hidden, non-selectable, tabular line numbers', () => {
    const w = make({ source: 'a\nb\nc' })
    const els = w.findAll('[data-slot="code-viewer-line-number"]')
    expect(els.map((e) => e.text())).toEqual(['1', '2', '3'])
    for (const e of els) {
      expect(e.attributes('aria-hidden')).toBe('true')
      expect(e.classes()).toEqual(expect.arrayContaining(['select-none', 'tabular-nums']))
    }
    expect(w.find('[data-slot="code-viewer-gutter"]').classes()).toContain('select-none')
  })
  it('hides line numbers on request', () => {
    expect(make({ source: 'a', lineNumbers: false }).find('[data-slot="code-viewer-line-number"]').exists()).toBe(false)
  })
  it('starts counting at startLine and sizes the gutter for the last number', () => {
    const w = make({ source: 'a\nb\nc', startLine: 98 })
    expect(w.findAll('[data-slot="code-viewer-line-number"]').map((e) => e.text())).toEqual(['98', '99', '100'])
    expect(w.find('[data-slot="code-viewer-line-number"]').attributes('style')).toContain('min-width: 3ch')
  })
  it('falls back to 1 for invalid startLine values', () => {
    for (const bad of [0, -5, NaN, '3', null]) expect(nums(make({ source: 'a\nb', startLine: bad }))).toEqual(['1', '2'])
    expect(nums(make({ source: 'a\nb', startLine: 4.8 }))).toEqual(['4', '5'])
  })
})

describe('folding', () => {
  it('renders real fold buttons with state, control and a descriptive name', () => {
    const w = make({ source: GO, language: 'go' })
    const btn = w.find('[data-slot="code-viewer-fold"]')
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(btn.attributes('aria-label')).toBe('Fold lines 3 to 5')
    const controls = btn.attributes('aria-controls')!
    expect(document.getElementById(controls)).toBe(w.find('[data-slot="code-viewer-code"]').element)
    expect(btn.classes()).toEqual(expect.arrayContaining(['size-6', 'pointer-coarse:size-11']))
  })
  it('folds on click: hides the lines and shows a placeholder button', async () => {
    const w = make({ source: GO, language: 'go' })
    expect(lineEls(w)).toHaveLength(6)
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    expect(nums(w)).toEqual(['1', '2', '3', '6'])
    expect(w.text()).not.toContain('println')
    const fold = w.find('[data-slot="code-viewer-fold"]')
    expect(fold.attributes('aria-expanded')).toBe('false')
    const ph = w.find('[data-slot="code-viewer-placeholder"]')
    expect(ph.element.tagName).toBe('BUTTON')
    expect(ph.text()).toBe('… 2 lines')
    expect(ph.text()).not.toMatch(/[\u2014\u2013]/)
    expect(ph.attributes('aria-label')).toBe('2 lines hidden. Unfold lines 3 to 5')
    expect(ph.attributes('aria-expanded')).toBe('false')
    expect(w.find('[data-folded]').attributes('data-line')).toBe('3')
  })
  it('unfolds with the fold button and with the placeholder, returning focus to the fold button', async () => {
    const w = make({ source: GO, language: 'go' })
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    expect(lineEls(w)).toHaveLength(6)
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    await w.find('[data-slot="code-viewer-placeholder"]').trigger('click')
    await nextTick()
    expect(lineEls(w)).toHaveLength(6)
    expect(document.activeElement).toBe(w.find('[data-slot="code-viewer-fold"]').element)
    expect(w.find('[data-slot="code-viewer-placeholder"]').exists()).toBe(false)
  })
  it('keeps the fold button focus after folding with the keyboard (focus, then activate)', async () => {
    const w = make({ source: GO, language: 'go' })
    const btn = w.find('[data-slot="code-viewer-fold"]')
    ;(btn.element as HTMLElement).focus()
    expect(document.activeElement).toBe(btn.element)
    await btn.trigger('click') // Enter and Space on a native button dispatch click
    expect(document.activeElement).toBe(w.find('[data-slot="code-viewer-fold"]').element)
  })
  it('uses singular wording for a one-line region', async () => {
    const w = make({ source: 'a:\n  b: 1\nc: 2', language: 'yaml' })
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    expect(w.find('[data-slot="code-viewer-placeholder"]').text()).toBe('… 1 line')
    expect(w.find('[data-slot="code-viewer-placeholder"]').attributes('aria-label')).toMatch(/^1 line hidden/)
  })
  it('names folds with the displayed numbers when startLine is set', () => {
    expect(make({ source: GO, language: 'go', startLine: 10 }).find('[data-slot="code-viewer-fold"]').attributes('aria-label')).toBe('Fold lines 12 to 14')
  })
  it('emits fold events with displayed line numbers', async () => {
    const w = make({ source: GO, language: 'go', startLine: 10 })
    await w.find('[data-slot="code-viewer-fold"]').trigger('click')
    await w.find('[data-slot="code-viewer-placeholder"]').trigger('click')
    expect(w.emitted('fold')).toEqual([[{ start: 12, end: 14, collapsed: true }], [{ start: 12, end: 14, collapsed: false }]])
  })
  it('starts folded from defaultFoldDepth and supports expandAll and collapseAll', async () => {
    const w = make({ source: YAML, language: 'yaml', defaultFoldDepth: 1 })
    expect(nums(w)).toEqual(['1', '2', '3', '5'])
    const exposed = w.vm as unknown as { expandAll: () => void; collapseAll: () => void }
    exposed.expandAll()
    await nextTick()
    expect(lineEls(w)).toHaveLength(5)
    exposed.collapseAll()
    await nextTick()
    expect(nums(w)).toEqual(['1', '5'])
    const all = make({ source: YAML, language: 'yaml', defaultFoldDepth: 0 })
    expect(nums(all)).toEqual(['1', '5'])
  })
  it('ignores an invalid defaultFoldDepth', () => {
    expect(lineEls(make({ source: YAML, language: 'yaml', defaultFoldDepth: NaN }))).toHaveLength(5)
    expect(nums(make({ source: YAML, language: 'yaml', defaultFoldDepth: -4 }))).toEqual(['1', '5'])
  })
  it('does not render folds when foldable is false', () => {
    const w = make({ source: GO, language: 'go', foldable: false })
    expect(w.find('[data-slot="code-viewer-fold"]').exists()).toBe(false)
    expect(w.find('[data-slot="code-viewer-fold-cell"]').exists()).toBe(false)
  })
  it('resets folds when the source changes', async () => {
    const w = make({ source: GO, language: 'go', defaultFoldDepth: 0 })
    expect(lineEls(w)).toHaveLength(4)
    await w.setProps({ source: YAML, language: 'yaml' })
    expect(lineEls(w).length).toBeGreaterThan(0)
    expect(w.find('[data-slot="code-viewer-fold"]').attributes('aria-label')).toBe('Fold lines 1 to 4')
  })
  it('keeps the fold column aligned on lines without a region', () => {
    expect(make({ source: GO, language: 'go' }).findAll('[data-slot="code-viewer-fold-cell"]')).toHaveLength(6)
  })
  it('does nothing for languages without regions', () => {
    expect(make({ source: 'a\n  b', language: 'plain' }).find('[data-slot="code-viewer-fold"]').exists()).toBe(false)
  })
})

describe('highlightLines', () => {
  it('marks highlighted lines with a shape marker and visually hidden text', () => {
    const w = make({ source: 'a\nb\nc\nd', highlightLines: [2, 4] })
    const marked = lineEls(w).filter((l) => l.attributes('data-highlighted') !== undefined)
    expect(marked.map((l) => l.attributes('data-line'))).toEqual(['2', '4'])
    for (const l of marked) {
      expect(l.classes()).toEqual(expect.arrayContaining(['border-primary', 'bg-primary/10']))
      const hidden = l.find('.sr-only')
      expect(hidden.text()).toBe('Highlighted line')
      expect(hidden.classes()).toContain('select-none')
    }
    expect(lineEls(w)[0].classes()).toContain('border-transparent')
    expect(lineEls(w)[0].find('.sr-only').exists()).toBe(false)
  })
  it('keeps the screen reader text out of the code cell so copying stays clean', () => {
    const w = make({ source: 'a\nb', highlightLines: '2' })
    expect(w.findAll('[data-slot="code-viewer-text"]')[1].text()).toBe('b')
  })
  it('parses ranges and mixed specs', () => {
    expect(lineEls(make({ source: 'a\nb\nc\nd\ne', highlightLines: '2-4,5' })).filter((l) => l.attributes('data-highlighted') !== undefined)).toHaveLength(4)
  })
  it('ignores invalid specs and clamps ranges', () => {
    for (const bad of ['x', '3-', '-', '1.5', [0, -2, NaN], '99', null, {}]) {
      expect(make({ source: 'a\nb', highlightLines: bad }).findAll('[data-highlighted]'), String(bad)).toHaveLength(0)
    }
    expect(make({ source: 'a\nb', highlightLines: '1-99999' }).findAll('[data-highlighted]')).toHaveLength(2)
    expect(make({ source: 'a\nb', highlightLines: '2-1' }).findAll('[data-highlighted]')).toHaveLength(2)
  })
  it('refers to displayed numbers when startLine is set', () => {
    const w = make({ source: 'a\nb\nc', startLine: 10, highlightLines: '11' })
    expect(w.findAll('[data-highlighted]').map((l) => l.attributes('data-line'))).toEqual(['11'])
    expect(make({ source: 'a\nb\nc', startLine: 10, highlightLines: '2' }).findAll('[data-highlighted]')).toHaveLength(0)
  })
  it('marks lines even without line numbers', () => {
    const w = make({ source: 'a\nb', lineNumbers: false, highlightLines: [1] })
    expect(w.find('[data-highlighted] .sr-only').text()).toBe('Highlighted line')
  })
})

describe('wrap, size, variants and customisation', () => {
  it('toggles whitespace-pre-wrap', () => {
    expect(make({ source: 'a' }).find('[data-slot="code-viewer-text"]').classes()).toContain('whitespace-pre')
    const w = make({ source: 'a', wrap: true })
    expect(w.find('[data-slot="code-viewer-text"]').classes()).toEqual(expect.arrayContaining(['whitespace-pre-wrap', 'break-words']))
    expect(w.find('[data-slot="code-viewer-code"]').classes()).toContain('w-full')
  })
  it('lets long lines scroll inside the region only', () => {
    const w = make({ source: 'x'.repeat(5000) })
    expect(w.classes()).toEqual(expect.arrayContaining(['min-w-0', 'max-w-full', 'overflow-hidden']))
    expect(w.find('[data-slot="code-viewer-scroll"]').classes()).toEqual(expect.arrayContaining(['overflow-auto', 'min-w-0']))
    expect(w.find('[data-slot="code-viewer-code"]').classes()).toEqual(expect.arrayContaining(['w-max', 'min-w-full']))
  })
  it('applies maxHeight to the scroll region', () => {
    expect(make({ source: 'a', maxHeight: '12rem' }).find('[data-slot="code-viewer-scroll"]').attributes('style')).toContain('max-height: 12rem')
    expect(make({ source: 'a' }).find('[data-slot="code-viewer-scroll"]').attributes('style')).toBeUndefined()
  })
  it('renders bordered and plain variants and falls back for unknown ones', () => {
    expect(make({ source: 'a' }).classes()).toEqual(expect.arrayContaining(['border', 'bg-card', 'rounded-md']))
    const plain = make({ source: 'a', variant: 'plain' })
    expect(plain.classes()).not.toContain('border')
    expect(plain.attributes('data-variant')).toBe('plain')
    expect(make({ source: 'a', variant: 'weird' }).attributes('data-variant')).toBe('bordered')
    expect(codeViewerVariants({ variant: 'plain' })).not.toContain('bg-card')
  })
  it('merges class last and passes attributes through', () => {
    const w = make({ source: 'a', class: 'bg-muted rounded-none' }, { id: 'v', 'data-x': '1' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-none']))
    expect(w.classes()).not.toContain('bg-card')
    expect(w.attributes('id')).toBe('v')
    expect(w.attributes('data-x')).toBe('1')
  })
  it('uses the focus ring and no gradients, shadows or custom colours', () => {
    const w = make({ source: 'a: 1', language: 'yaml' })
    expect(w.find('[role="region"]').classes()).toContain('focus-visible:ring-3')
    expect(w.html()).not.toMatch(/gradient|backdrop-blur|shadow-|#[0-9a-f]{3,6}\b|rgb\(|oklch\(/i)
  })
})

describe('header and copy', () => {
  it('shows the filename or the language name in the header', () => {
    expect(make({ source: 'a', filename: 'a.yaml' }).find('[data-slot="code-viewer-title"]').text()).toBe('a.yaml')
    expect(make({ source: 'a', language: 'toml' }).find('[data-slot="code-viewer-title"]').text()).toBe('TOML')
  })
  it('hides the header when there is nothing to show', () => {
    expect(make({ source: 'a', copy: false }).find('[data-slot="code-viewer-header"]').exists()).toBe(false)
    expect(make({ source: 'a', copy: false, filename: 'f' }).find('[data-slot="code-viewer-header"]').exists()).toBe(true)
  })
  it('copies the original source and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const src = 'a: 1\r\n# c\n'
    const w = make({ source: src, language: 'yaml' })
    const btn = w.find('[data-slot="copy-button"]')
    expect(btn.attributes('aria-label')).toBe('Copy code')
    await btn.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(src)
    expect(w.emitted('copy')).toEqual([[src]])
    const status = w.find('[data-slot="copy-button-status"]')
    expect(status.attributes('role')).toBe('status')
    expect(status.text()).toBe('Code copied')
  })
  it('announces a failed copy and does not emit', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    Object.assign(document, { execCommand: vi.fn().mockReturnValue(false) })
    const w = make({ source: 'a' })
    await w.find('[data-slot="copy-button"]').trigger('click')
    await flushPromises()
    expect(w.emitted('copy')).toBeUndefined()
    expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Copy failed')
  })
  it('hides the copy button when copy is false', () => {
    expect(make({ source: 'a', filename: 'f', copy: false }).find('[data-slot="copy-button"]').exists()).toBe(false)
  })
  it('copies even when the view is folded (the full source)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const w = make({ source: GO, language: 'go', defaultFoldDepth: 0 })
    await w.find('[data-slot="copy-button"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith(GO)
  })
})

describe('bad path and edge cases', () => {
  it('falls back to plain text for unknown languages', () => {
    const w = make({ source: 'fn main() {\n}', language: 'rust' })
    expect(w.attributes('data-language')).toBe('plain')
    expect(w.findAll('[data-slot="code-viewer-token"]')).toHaveLength(0)
    expect(w.find('[data-slot="code-viewer-fold"]').exists()).toBe(false)
    expect(w.find('[role="region"]').attributes('aria-label')).toBe('Plain text source')
  })
  it('renders empty, whitespace and non-string sources without throwing', () => {
    expect(lineEls(make({ source: '' }))).toHaveLength(1)
    expect(lineEls(make({ source: '   ' }))).toHaveLength(1)
    expect(lineEls(make({ source: undefined }))).toHaveLength(1)
    expect(make({ source: 12345 }).text()).toContain('12345')
    expect(lineEls(make({ source: null }))).toHaveLength(1)
  })
  it('renders a one character source', () => {
    expect(make({ source: 'x', language: 'go' }).find('[data-slot="code-viewer-text"]').text()).toBe('x')
  })
  it('renders unicode, tabs and RTL text unchanged', () => {
    const src = 'שלום 日本語 😀\n\tindented'
    expect(make({ source: src }).findAll('[data-slot="code-viewer-text"]').map((t) => t.element.textContent)).toEqual(['שלום 日本語 😀', '\tindented'])
  })
  it('renders an extremely long single line', () => {
    const long = 'a'.repeat(200000)
    expect(make({ source: long }).find('[data-slot="code-viewer-text"]').text()).toHaveLength(200000)
  })
  it('stays responsive for 10 000 lines and renders folded children lazily', async () => {
    const source = Array.from({ length: 10000 }, (_, i) => (i % 5 === 0 ? `item${i}:` : `  v${i}: ${i}`)).join('\n')
    const start = performance.now()
    const w = make({ source, language: 'yaml', defaultFoldDepth: 0 })
    const folded = performance.now() - start
    expect(lineEls(w)).toHaveLength(2000)
    expect(folded).toBeLessThan(10000) // smoke bound: generous so parallel workers and coverage instrumentation do not flake it
    const t2 = performance.now()
    const open = make({ source, language: 'yaml' })
    expect(lineEls(open)).toHaveLength(10000)
    expect(performance.now() - t2).toBeLessThan(25000)
    expect(lineEls(open)[0].classes()).toEqual(expect.arrayContaining(['[content-visibility:auto]']))
    expect(lineEls(make({ source: 'a\nb', language: 'yaml' }))[0].classes()).not.toContain('[content-visibility:auto]')
  }, 60000)
  it('cleans up on unmount (no pending timers, DOM removed)', async () => {
    vi.useFakeTimers()
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const w = make({ source: 'a' })
    await w.find('[data-slot="copy-button"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    w.unmount()
    mounted.splice(mounted.indexOf(w), 1)
    expect(vi.getTimerCount()).toBe(0)
    expect(document.querySelector('[data-slot="code-viewer"]')).toBeNull()
  })
})
