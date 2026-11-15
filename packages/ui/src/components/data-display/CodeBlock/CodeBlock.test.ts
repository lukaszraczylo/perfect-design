import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import CodeBlock from './CodeBlock.vue'
import { CODE_BLOCK_VARIANTS, codeBlockLineVariants, codeBlockMarkerVariants, codeBlockTabVariants, codeBlockVariants, diffKind, parseHighlightLines } from './index'

let written: string[] = []
beforeEach(() => {
  written = []
  ;(document as unknown as { execCommand: unknown }).execCommand = () => {
    written.push((document.querySelector('textarea') as HTMLTextAreaElement).value)
    return true
  }
})
afterEach(() => {
  document.body.innerHTML = ''
  delete (document as unknown as { execCommand?: unknown }).execCommand
})

const lineEls = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="code-block-line"]')

describe('CodeBlock', () => {
  describe('good path', () => {
    it('renders each line of `code` in a monospace pre/code', () => {
      const w = mount(CodeBlock, { props: { code: 'a\nb\nc' } })
      expect(w.attributes('data-slot')).toBe('code-block')
      expect(w.find('pre').classes()).toContain('font-mono')
      expect(lineEls(w).map((l) => l.text())).toEqual(['a', 'b', 'c'])
    })

    it('shows the language label and exposes data-language/class', () => {
      const w = mount(CodeBlock, { props: { code: 'x', language: 'ts' } })
      expect(w.find('[data-slot="code-block-language"]').text()).toBe('ts')
      expect(w.attributes('data-language')).toBe('ts')
      expect(w.find('code').classes()).toContain('language-ts')
      expect(w.find('pre').attributes('aria-label')).toBe('ts code')
    })

    it('falls back to slot text when `code` is omitted and trims surrounding blank lines', () => {
      const w = mount(CodeBlock, { slots: { default: () => '\nline1\n  line2\n' } })
      expect(lineEls(w).map((l) => l.element.textContent)).toEqual(['line1', '  line2'])
    })

    it('line numbers render in an aria-hidden gutter and are optional', () => {
      const off = mount(CodeBlock, { props: { code: 'a\nb' } })
      expect(off.find('[data-slot="code-block-line-number"]').exists()).toBe(false)
      const on = mount(CodeBlock, { props: { code: 'a\nb', lineNumbers: true } })
      const nums = on.findAll('[data-slot="code-block-line-number"]')
      expect(nums.map((n) => n.text())).toEqual(['1', '2'])
      expect(nums[0]!.attributes('aria-hidden')).toBe('true')
      expect(nums[0]!.classes()).toContain('select-none')
    })

    it('gutter width grows with the number of digits', () => {
      const code = Array.from({ length: 120 }, (_, i) => String(i)).join('\n')
      const w = mount(CodeBlock, { props: { code, lineNumbers: true } })
      expect(w.find('[data-slot="code-block-line-number"]').attributes('style')).toContain('3ch')
    })

    it('wrap toggles wrapping vs horizontal scroll', () => {
      expect(mount(CodeBlock, { props: { code: 'x' } }).find('pre').classes()).toContain('whitespace-pre')
      const wrapped = mount(CodeBlock, { props: { code: 'x', wrap: true } })
      expect(wrapped.find('pre').classes()).toContain('whitespace-pre-wrap')
      expect(wrapped.find('pre').classes()).not.toContain('whitespace-pre')
    })

    it('maxHeight is applied and the pre scrolls', () => {
      const w = mount(CodeBlock, { props: { code: 'x', maxHeight: '10rem' } })
      expect(w.attributes('style')).toContain('max-height: 10rem')
      expect(w.find('pre').classes()).toContain('overflow-auto')
      expect(mount(CodeBlock, { props: { code: 'x' } }).attributes('style')).toBeUndefined()
    })

    it('names the scroll region by label prop, then file name, then language', () => {
      expect(mount(CodeBlock, { props: { code: 'x', language: 'ts', filename: 'a.ts', label: 'Install snippet' } }).find('pre').attributes('aria-label')).toBe('Install snippet')
      expect(mount(CodeBlock, { props: { code: 'x', language: 'ts', filename: 'a.ts' } }).find('pre').attributes('aria-label')).toBe('a.ts')
      expect(mount(CodeBlock, { props: { code: 'x', language: 'ts' } }).find('pre').attributes('aria-label')).toBe('ts code')
      expect(mount(CodeBlock, { props: { code: 'x' } }).find('pre').attributes('aria-label')).toBe('Code')
    })

    it('the scroll region is keyboard focusable', () => {
      expect(mount(CodeBlock, { props: { code: 'x' } }).find('pre').attributes('tabindex')).toBe('0')
    })
  })

  describe('copy', () => {
    it('copies the source (without gutter) and flips the label', async () => {
      const w = mount(CodeBlock, { props: { code: 'one\ntwo\n', lineNumbers: true } })
      const btn = w.find('[data-slot="copy-button"]')
      expect(btn.attributes('aria-label')).toBe('Copy code')
      await btn.trigger('click')
      await flushPromises()
      expect(written).toEqual(['one\ntwo\n'])
      expect(w.emitted('copy')?.[0]).toEqual(['one\ntwo\n'])
      // the name stays "Copy code"; the result is announced by a sibling role=status (not a live region inside the button)
      expect(w.find('[data-slot="copy-button"]').attributes('aria-label')).toBe('Copy code')
      expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Code copied')
      expect(w.find('[data-slot="copy-button"] [role="status"]').exists()).toBe(false)
    })

    it('copyable=false hides the button (and the header when there is no language)', () => {
      const bare = mount(CodeBlock, { props: { code: 'x', copyable: false } })
      expect(bare.find('[data-slot="copy-button"]').exists()).toBe(false)
      expect(bare.find('[data-slot="code-block-header"]').exists()).toBe(false)
      const labelled = mount(CodeBlock, { props: { code: 'x', copyable: false, language: 'sh' } })
      expect(labelled.find('[data-slot="code-block-header"]').exists()).toBe(true)
      expect(labelled.find('[data-slot="copy-button"]').exists()).toBe(false)
    })

    it('a blocked clipboard does not throw or emit', async () => {
      ;(document as unknown as { execCommand: unknown }).execCommand = () => { throw new Error('blocked') }
      const w = mount(CodeBlock, { props: { code: 'x' } })
      await w.find('button').trigger('click')
      await flushPromises()
      expect(w.emitted('copy')).toBeUndefined()
    })
  })

  describe('default output (backward compatibility)', () => {
    it('keeps the original classes and DOM for plain usage', () => {
      const w = mount(CodeBlock, { props: { code: 'x', language: 'ts' } })
      expect(w.classes()).toEqual(['flex', 'flex-col', 'overflow-hidden', 'rounded-lg', 'border', 'bg-muted/40', 'text-sm', 'text-foreground'])
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.find('[data-slot="code-block-controls"]').exists()).toBe(false)
      expect(w.find('[data-slot="code-block-tabs"]').exists()).toBe(false)
      expect(w.find('[data-slot="code-block-marker"]').exists()).toBe(false)
      expect(w.find('pre').attributes('role')).toBe('region')
      expect(w.find('code').classes()).toEqual(['language-ts'])
      expect(w.find('[data-slot="code-block-line"]').classes()).toEqual(['block', 'min-h-lh'])
      expect(w.find('[data-slot="code-block-line"]').attributes('data-diff')).toBeUndefined()
      expect(w.find('[data-slot="code-block-line"]').attributes('data-highlighted')).toBeUndefined()
      expect(mount(CodeBlock, { props: { code: 'x' } }).find('code').classes()).toEqual([])
    })
  })

  describe('variants: window / terminal frames', () => {
    it('window is a plain titled header bar: filename on the left, no dots, no shadow', () => {
      const w = mount(CodeBlock, { props: { code: 'x', variant: 'window', filename: 'a.sh', language: 'bash' } })
      expect(w.attributes('data-variant')).toBe('window')
      expect(w.find('[data-slot="code-block-controls"]').exists()).toBe(false)
      expect(w.html()).not.toMatch(/rounded-full bg-(destructive|warning|success)/)
      expect(w.find('[data-slot="code-block-filename"]').text()).toBe('a.sh')
      expect(w.find('[data-slot="code-block-filename"]').classes()).not.toContain('text-center')
      expect(w.find('[data-slot="code-block-language"]').exists()).toBe(false)
      expect(w.attributes('data-language')).toBe('bash')
      expect(w.find('[data-slot="code-block-header"]').classes()).not.toContain('grid')
      expect(w.classes()).not.toContain('shadow-sm')
    })

    it('the language label is plain text: not uppercase, tracked or faded', () => {
      const w = mount(CodeBlock, { props: { code: 'x', language: 'ts', filename: 'a.ts' } })
      const cls = w.find('[data-slot="code-block-language"]').classes().join(' ')
      expect(cls).not.toMatch(/uppercase|tracking|opacity|text-\[/)
    })

    it('window without filename shows the language as title and always has a header', () => {
      const w = mount(CodeBlock, { props: { code: 'x', variant: 'window', language: 'ts', copyable: false } })
      expect(w.find('[data-slot="code-block-language"]').text()).toBe('ts')
      expect(mount(CodeBlock, { props: { code: 'x', variant: 'window', copyable: false } }).find('[data-slot="code-block-header"]').exists()).toBe(true)
    })

    it('terminal inverts the surface and restyles header, gutter and copy button', () => {
      const w = mount(CodeBlock, { props: { code: 'a\nb', variant: 'terminal', lineNumbers: true } })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
      expect(w.classes()).not.toContain('bg-muted/40')
      expect(w.find('[data-slot="code-block-header"]').classes()).toContain('bg-background/10')
      expect(w.find('[data-slot="code-block-line-number"]').classes()).toContain('text-background/70')
      expect(w.classes()).not.toContain('shadow-sm')
      expect(w.find('[data-slot="copy-button"]').classes()).toContain('text-background/70')
      expect(w.find('[data-slot="copy-button"]').classes()).not.toContain('text-muted-foreground')
    })

    it('framed variants keep copy working', async () => {
      const w = mount(CodeBlock, { props: { code: 'ls', variant: 'terminal' } })
      await w.find('[data-slot="copy-button"]').trigger('click')
      await flushPromises()
      expect(written).toEqual(['ls'])
    })

    it('unknown variant falls back to default', () => {
      const w = mount(CodeBlock, { props: { code: 'x', variant: 'neon' as never } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('bg-muted/40')
      expect(w.find('[data-slot="code-block-controls"]').exists()).toBe(false)
    })

    it('exports the variant helpers', () => {
      expect(CODE_BLOCK_VARIANTS).toEqual(['default', 'window', 'terminal', 'plain', 'flush'])
      expect(codeBlockVariants({ variant: 'terminal' })).toContain('bg-foreground')
      expect(codeBlockVariants()).toContain('bg-muted/40')
    })

    it('class overrides the variant surface', () => {
      const w = mount(CodeBlock, { props: { code: 'x', variant: 'terminal', class: 'bg-primary rounded-none' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-foreground')
      expect(w.classes()).not.toContain('rounded-lg')
    })
  })

  describe('filename header', () => {
    it('default variant shows filename plus language label', () => {
      const w = mount(CodeBlock, { props: { code: 'x', filename: 'main.ts', language: 'ts' } })
      expect(w.find('[data-slot="code-block-filename"]').text()).toBe('main.ts')
      expect(w.find('[data-slot="code-block-language"]').text()).toBe('ts')
      expect(w.find('[data-slot="code-block-controls"]').exists()).toBe(false)
    })
    it('filename alone shows no language label; filename alone with copyable=false still renders a header', () => {
      const w = mount(CodeBlock, { props: { code: 'x', filename: 'a.txt', copyable: false } })
      expect(w.find('[data-slot="code-block-language"]').exists()).toBe(false)
      expect(w.find('[data-slot="code-block-header"]').exists()).toBe(true)
    })
  })

  describe('tabs', () => {
    const tabs = [
      { label: 'pnpm', code: 'pnpm add x', language: 'bash' },
      { label: 'npm', id: 'npm-id', code: 'npm i x' },
      { label: 'yarn', code: 'yarn add x', language: 'sh' },
    ]
    const mk = (props: Record<string, unknown> = {}) => mount(CodeBlock, { props: { tabs, ...props }, attachTo: document.body })
    const tabEls = (w: ReturnType<typeof mk>) => w.findAll('[role="tab"]')

    it('renders an ARIA tablist and shows the first tab code', () => {
      const w = mk({ language: 'text' })
      expect(w.find('[role="tablist"]').exists()).toBe(true)
      expect(tabEls(w).map((t) => t.text())).toEqual(['pnpm', 'npm', 'yarn'])
      expect(tabEls(w).map((t) => t.attributes('aria-selected'))).toEqual(['true', 'false', 'false'])
      expect(tabEls(w).map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
      expect(lineEls(w).map((l) => l.text())).toEqual(['pnpm add x'])
      const pre = w.find('pre')
      expect(pre.attributes('role')).toBe('tabpanel')
      expect(pre.attributes('aria-labelledby')).toBe(tabEls(w)[0]!.attributes('id'))
      expect(tabEls(w)[0]!.attributes('aria-controls')).toBe(pre.attributes('id'))
      expect(pre.attributes('aria-label')).toBeUndefined()
      expect(w.attributes('data-language')).toBe('bash')
      expect(w.find('code').classes()).toContain('language-bash')
    })

    it('clicking a tab switches content and emits update:activeTab with the id (or label)', async () => {
      const w = mk({ language: 'text' })
      await tabEls(w)[1]!.trigger('click')
      expect(lineEls(w)[0]!.text()).toBe('npm i x')
      expect(w.emitted('update:activeTab')?.[0]).toEqual(['npm-id'])
      expect(w.attributes('data-language')).toBe('text')
      await tabEls(w)[2]!.trigger('click')
      expect(w.emitted('update:activeTab')?.[1]).toEqual(['yarn'])
      expect(tabEls(w)[2]!.attributes('data-state')).toBe('active')
    })

    it('is controlled via activeTab and ignores unknown ids', async () => {
      const w = mk({ activeTab: 'yarn' })
      expect(lineEls(w)[0]!.text()).toBe('yarn add x')
      await w.setProps({ activeTab: 'ghost' })
      expect(lineEls(w)[0]!.text()).toBe('pnpm add x')
    })

    it('copy copies the active tab code', async () => {
      const w = mk({ activeTab: 'npm-id' })
      await w.find('[data-slot="copy-button"]').trigger('click')
      await flushPromises()
      expect(written).toEqual(['npm i x'])
    })

    it('keyboard: arrows wrap, Home/End jump, other keys ignored', async () => {
      const w = mk()
      await tabEls(w)[0]!.trigger('keydown', { key: 'ArrowRight' })
      await flushPromises()
      expect(tabEls(w)[1]!.attributes('aria-selected')).toBe('true')
      expect(document.activeElement).toBe(tabEls(w)[1]!.element)
      await tabEls(w)[1]!.trigger('keydown', { key: 'End' })
      expect(tabEls(w)[2]!.attributes('aria-selected')).toBe('true')
      await tabEls(w)[2]!.trigger('keydown', { key: 'ArrowRight' })
      expect(tabEls(w)[0]!.attributes('aria-selected')).toBe('true')
      await tabEls(w)[0]!.trigger('keydown', { key: 'ArrowLeft' })
      expect(tabEls(w)[2]!.attributes('aria-selected')).toBe('true')
      await tabEls(w)[2]!.trigger('keydown', { key: 'Home' })
      expect(tabEls(w)[0]!.attributes('aria-selected')).toBe('true')
      const ev = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true })
      tabEls(w)[0]!.element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      const arrow = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      tabEls(w)[0]!.element.dispatchEvent(arrow)
      expect(arrow.defaultPrevented).toBe(true)
    })

    it('tabs work in the terminal frame', () => {
      const w = mk({ variant: 'terminal' })
      expect(w.find('[data-slot="code-block-controls"]').exists()).toBe(false)
      expect(w.find('[data-slot="code-block-header"]').classes()).not.toContain('grid')
      expect(tabEls(w)[0]!.classes()).toContain('bg-background/20')
      expect(tabEls(w)[1]!.classes()).toContain('text-background/60')
    })

    it('tabs override `code` and the slot', () => {
      expect(lineEls(mk({ code: 'ignored' }))[0]!.text()).toBe('pnpm add x')
    })

    it('invalid / empty tabs are ignored or fall back', () => {
      expect(mount(CodeBlock, { props: { code: 'plain', tabs: [] } }).find('[role="tablist"]').exists()).toBe(false)
      expect(mount(CodeBlock, { props: { code: 'plain', tabs: 'nope' as never } }).find('[role="tablist"]').exists()).toBe(false)
      const w = mount(CodeBlock, { props: { tabs: [null, { label: 'ok', code: 42 }, 7] as never } })
      expect(tabEls(w as never)).toHaveLength(1)
      expect(lineEls(w)[0]!.text()).toBe('42')
      const noCode = mount(CodeBlock, { props: { tabs: [{ label: 'empty' } as never] } })
      expect(lineEls(noCode)[0]!.text()).toBe('')
    })

    it('tab helper class variants', () => {
      expect(codeBlockTabVariants({ variant: 'default', active: true })).toContain('bg-background')
      expect(codeBlockTabVariants({ variant: 'window', active: false })).toContain('text-muted-foreground')
    })
  })

  describe('diff marks', () => {
    const patch = '@@ -1,2 +1,2 @@\n keep\n-old\n+new'
    const mk = (props: Record<string, unknown> = {}) => mount(CodeBlock, { props: { code: patch, diff: true, ...props } })

    it('marks added / removed / hunk lines with data-diff, background and gutter marker', () => {
      const w = mk()
      const l = lineEls(w)
      expect(l.map((x) => x.attributes('data-diff'))).toEqual(['hunk', undefined, 'remove', 'add'])
      expect(l[3]!.classes()).toContain('bg-success/15')
      expect(l[2]!.classes()).toContain('bg-destructive/15')
      expect(l[0]!.classes()).toContain('text-muted-foreground')
      const markers = w.findAll('[data-slot="code-block-marker"]')
      expect(markers.map((m) => m.text())).toEqual(['', '', '-', '+'])
      expect(markers[3]!.classes()).toContain('text-success')
      expect(markers[2]!.classes()).toContain('text-destructive')
      expect(markers[3]!.attributes('aria-hidden')).toBe('true')
      expect(markers[3]!.classes()).toContain('select-none')
    })

    it('strips the +/- char from the text and exposes added/removed to screen readers', () => {
      const w = mk()
      const l = lineEls(w)
      expect(l[3]!.text()).toBe('Added: +new')
      expect(l[2]!.text()).toBe('Removed: -old')
      expect(l[3]!.find('.sr-only').text()).toBe('Added:')
      expect(l[1]!.element.textContent).toBe(' keep')
    })

    it('copy keeps the original diff text', async () => {
      const w = mk()
      await w.find('[data-slot="copy-button"]').trigger('click')
      await flushPromises()
      expect(written).toEqual([patch])
    })

    it('without diff nothing is marked', () => {
      const w = mk({ diff: false })
      expect(w.findAll('[data-diff]')).toHaveLength(0)
      expect(lineEls(w)[3]!.text()).toBe('+new')
    })

    it('combines with line numbers and highlight; code spans the scroll width', () => {
      const w = mk({ lineNumbers: true, highlightLines: [4] })
      expect(w.find('code').classes()).toEqual(expect.arrayContaining(['block', 'w-fit', 'min-w-full']))
      expect(lineEls(w)[3]!.classes()).toEqual(expect.arrayContaining(['bg-success/15', 'bg-primary/10']))
      expect(lineEls(w)[3]!.find('[data-slot="code-block-line-number"]').text()).toBe('4')
    })

    it('diffKind / marker helper', () => {
      expect(diffKind('+a')).toBe('add')
      expect(diffKind('-a')).toBe('remove')
      expect(diffKind('@@ x')).toBe('hunk')
      expect(diffKind(' a')).toBe('none')
      expect(diffKind('')).toBe('none')
      expect(codeBlockMarkerVariants({ diff: 'add' })).toContain('text-success')
      expect(codeBlockLineVariants({ diff: 'remove' })).toContain('bg-destructive/15')
    })

    it('empty code in diff mode renders one plain line', () => {
      const w = mk({ code: '' })
      expect(lineEls(w)).toHaveLength(1)
      expect(lineEls(w)[0]!.attributes('data-diff')).toBeUndefined()
    })

    it('a lone "+" or "-" line leaves an empty text', () => {
      const w = mk({ code: '+\n-' })
      expect(lineEls(w).map((l) => l.find('[data-slot="code-block-marker"]').text())).toEqual(['+', '-'])
    })
  })

  describe('line highlight', () => {
    const code = 'a\nb\nc\nd\ne'
    const marked = (w: ReturnType<typeof mount>) => lineEls(w).map((l) => l.attributes('data-highlighted') !== undefined)

    it('highlights an array of 1-based lines', () => {
      const w = mount(CodeBlock, { props: { code, highlightLines: [2, 4] } })
      expect(marked(w)).toEqual([false, true, false, true, false])
      expect(lineEls(w)[1]!.classes()).toContain('bg-primary/10')
      // no edge stripe; the highlight is also spoken
      expect(lineEls(w)[1]!.classes().join(' ')).not.toMatch(/shadow-\[|border-l/)
      expect(lineEls(w)[1]!.text()).toContain('Highlighted:')
      expect(lineEls(w)[0]!.text()).not.toContain('Highlighted:')
    })

    it('accepts a spec string with ranges', () => {
      expect(marked(mount(CodeBlock, { props: { code, highlightLines: '1, 3-4' } }))).toEqual([true, false, true, true, false])
    })

    it('ignores invalid tokens, swaps reversed ranges and clamps to the line count', () => {
      expect(marked(mount(CodeBlock, { props: { code, highlightLines: ['x', 0, -1, 1.5, 9, null, '4-2', '7-99'] as never } }))).toEqual([false, true, true, true, false])
      expect(marked(mount(CodeBlock, { props: { code, highlightLines: 'abc,,2-' } }))).toEqual([false, false, false, false, false])
    })

    it('clamps huge ranges without blowing up', () => {
      const w = mount(CodeBlock, { props: { code, highlightLines: '1-999999999' } })
      expect(marked(w).every(Boolean)).toBe(true)
    })

    it('empty array / non-supported input highlights nothing', () => {
      expect(marked(mount(CodeBlock, { props: { code, highlightLines: [] } })).some(Boolean)).toBe(false)
      expect(marked(mount(CodeBlock, { props: { code, highlightLines: 5 as never } })).some(Boolean)).toBe(false)
    })

    it('parseHighlightLines works on its own', () => {
      expect([...parseHighlightLines([3, 1], 5)].sort()).toEqual([1, 3])
      expect([...parseHighlightLines('2-3', 2)]).toEqual([2])
      expect(parseHighlightLines(undefined, 3).size).toBe(0)
    })

    it('a highlight class override wins', () => {
      const w = mount(CodeBlock, { props: { code, highlightLines: [1], class: 'rounded-none' } })
      expect(w.classes()).toContain('rounded-none')
    })
  })

  describe('customisation', () => {
    it('merges classes and attributes', () => {
      const w = mount(CodeBlock, { props: { code: 'x', class: 'rounded-none custom' }, attrs: { id: 'cb' } })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
      expect(w.classes()).toContain('custom')
      expect(w.attributes('id')).toBe('cb')
    })
  })

  describe('bad path / edge cases', () => {
    it('empty code renders one empty line', () => {
      const w = mount(CodeBlock, { props: { code: '' } })
      expect(lineEls(w)).toHaveLength(1)
      expect(lineEls(w)[0]!.text()).toBe('')
    })

    it('no code and no slot renders without throwing', () => {
      expect(lineEls(mount(CodeBlock))).toHaveLength(1)
    })

    it('normalises CRLF / CR line endings', () => {
      expect(lineEls(mount(CodeBlock, { props: { code: 'a\r\nb\rc' } })).map((l) => l.text())).toEqual(['a', 'b', 'c'])
    })

    it('preserves blank lines and indentation', () => {
      const w = mount(CodeBlock, { props: { code: 'if (x) {\n\n    y()\n}' } })
      expect(lineEls(w)).toHaveLength(4)
      expect(lineEls(w)[2]!.element.textContent).toBe('    y()')
    })

    it('treats HTML in code as text (no injection)', () => {
      const w = mount(CodeBlock, { props: { code: '<img src=x onerror=alert(1)>' } })
      expect(w.find('img').exists()).toBe(false)
      expect(lineEls(w)[0]!.text()).toBe('<img src=x onerror=alert(1)>')
    })

    it('handles non-string code values and huge / unicode input', () => {
      expect(lineEls(mount(CodeBlock, { props: { code: 42 as never } }))[0]!.text()).toBe('42')
      const big = Array.from({ length: 5000 }, (_, i) => `سطر ${i} 🎉`).join('\n')
      expect(lineEls(mount(CodeBlock, { props: { code: big } }))).toHaveLength(5000)
    })

    it('ignores non-text slot content', () => {
      const w = mount(CodeBlock, { slots: { default: () => h('b', 'bold') } })
      expect(lineEls(w)[0]!.text()).toBe('')
    })
  })
})
