import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, type Component } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import * as UI from '../../../index'
import { Markdown, extractHeadings, parseMarkdown, renderMarkdownToText, sanitizeUrl, slugify } from './index'
import { dedent, vnodesToText } from './source'
import { ALIGN_CLASS, headingClass, headingSpace, markdownVariants } from './variants'

const mounted: VueWrapper[] = []
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})
function render(source: string, props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(Markdown, { props: { source, ...props }, attrs, attachTo: document.body })
  mounted.push(w)
  return w
}

/** The invariants every rendered tree must hold, whatever the input. */
function assertSafe(root: Element) {
  expect(root.querySelector('script, iframe, object, embed, style, link, meta, base, form, svg:not([data-slot=icon])')).toBeNull()
  for (const el of Array.from(root.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.toLowerCase().startsWith('on'), `${el.tagName} ${attr.name}`).toBe(false)
      expect(attr.name.toLowerCase()).not.toBe('style')
      expect(attr.name.toLowerCase()).not.toBe('srcdoc')
    }
  }
  for (const a of Array.from(root.querySelectorAll('[href]'))) {
    const href = (a.getAttribute('href') ?? '').replace(/[\u0000- ]/g, '').toLowerCase()
    expect(href, 'href').not.toMatch(/^(?:javascript|vbscript|data|file|blob):/)
  }
  for (const img of Array.from(root.querySelectorAll('[src]'))) {
    const src = (img.getAttribute('src') ?? '').replace(/[\u0000- ]/g, '').toLowerCase()
    expect(src, 'src').not.toMatch(/^(?:javascript|vbscript|file|blob):/)
    if (src.startsWith('data:')) expect(src).toMatch(/^data:image\/(?:png|jpeg|gif|webp)[;,]/)
  }
}

describe('Markdown: structure and customisation', () => {
  it('renders a block root with data-slot, size and the default measure', () => {
    const w = render('hello')
    const root = w.element as HTMLElement
    expect(root.tagName).toBe('DIV')
    expect(root.dataset.slot).toBe('markdown')
    expect(root.dataset.size).toBe('md')
    expect(root.classList.contains('max-w-prose')).toBe(true)
    expect(root.classList.contains('break-words')).toBe(true)
    expect(root.classList.contains('min-w-0')).toBe(true)
    expect(w.find('[data-slot=markdown-paragraph]').text()).toBe('hello')
  })
  it.each([
    ['sm', 'text-base'],
    ['md', 'text-md'],
    ['lg', 'text-lg'],
  ])('size %s uses %s', (size, cls) => {
    const w = render('x', { size })
    expect(w.classes()).toContain(cls)
    expect((w.element as HTMLElement).dataset.size).toBe(size)
  })
  it('invalid size and tone fall back to the defaults', () => {
    const w = render('x', { size: 'huge', tone: 'loud' })
    expect(w.classes()).toContain('text-md')
    expect(w.classes()).toContain('text-foreground')
    expect((w.element as HTMLElement).dataset.size).toBe('md')
  })
  it('muted tone changes the text colour', () => {
    const w = render('x', { tone: 'muted' })
    expect(w.classes()).toContain('text-muted-foreground')
    expect(w.classes()).not.toContain('text-foreground')
  })
  it('class is merged last and wins', () => {
    const w = render('x', { class: 'max-w-none text-sm custom' })
    expect(w.classes()).toContain('custom')
    expect(w.classes()).toContain('max-w-none')
    expect(w.classes()).not.toContain('max-w-prose')
    expect(w.classes()).toContain('text-sm')
    expect(w.classes()).not.toContain('text-md')
  })
  it('attributes fall through to the root', () => {
    const w = render('x', {}, { id: 'doc', 'aria-label': 'Release notes', 'data-test': '1' })
    expect(w.attributes('id')).toBe('doc')
    expect(w.attributes('aria-label')).toBe('Release notes')
    expect(w.attributes('data-test')).toBe('1')
  })
  it('listeners fall through to the root', async () => {
    const onClick = vi.fn()
    const w = mount(Markdown, { props: { source: 'x' }, attrs: { onClick } })
    mounted.push(w)
    await w.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })
  it('is exported from the library barrel with its helpers', () => {
    expect(UI.Markdown).toBe(Markdown)
    expect(UI.parseMarkdown).toBe(parseMarkdown)
    expect(UI.renderMarkdownToText).toBe(renderMarkdownToText)
    expect(UI.extractHeadings).toBe(extractHeadings)
    expect(UI.slugify).toBe(slugify)
    expect(UI.sanitizeUrl).toBe(sanitizeUrl)
  })
  it('variant helpers are exported', () => {
    expect(markdownVariants({ size: 'lg', tone: 'muted', inline: true })).toContain('text-lg')
    expect(headingClass('sm', 1)).toContain('text-3xl')
    expect(headingClass('md', 99)).toContain('text-md')
    expect(headingClass('xl' as never, 1)).toContain('text-4xl')
    expect(headingSpace(99)).toBe(headingSpace(6))
    expect(ALIGN_CLASS.right).toBe('text-end')
  })
  it('renders nothing for empty, null and undefined sources', () => {
    for (const source of ['', '   ', undefined]) {
      const w = mount(Markdown, { props: { source } })
      expect(w.element.children.length).toBe(0)
      w.unmount()
    }
  })
  it('unmounts cleanly', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = render('# a\n\n```yaml\nk: v\n```\n\n| a |\n|---|\n| b |')
    w.unmount()
    mounted.pop()
    expect(err).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    err.mockRestore()
    warn.mockRestore()
  })
  it('re-renders when the source changes', async () => {
    const w = render('one')
    await w.setProps({ source: '**two**' })
    expect(w.find('strong').text()).toBe('two')
  })
})

describe('Markdown: block content', () => {
  it('renders paragraphs, emphasis, strong, strikethrough, inline code and breaks', () => {
    const w = render('A *b* **c** ~~d~~ `e`  \nnext')
    const p = w.find('p')
    expect(p.find('em').text()).toBe('b')
    expect(p.find('strong').text()).toBe('c')
    expect(p.find('del').text()).toBe('d')
    expect(p.find('code').text()).toBe('e')
    expect(p.find('code').classes()).toContain('font-mono')
    expect(p.find('br').exists()).toBe(true)
  })
  it('renders blockquotes with a neutral border token and no coloured stripe', () => {
    const w = render('> quoted\n>\n> > nested')
    const quotes = w.findAll('blockquote')
    expect(quotes).toHaveLength(2)
    expect(quotes[0].classes()).toContain('border-border')
    expect(quotes[0].classes()).toContain('border-s-2')
    expect(quotes[0].classes().join(' ')).not.toMatch(/border-(?:primary|ring|info|success|warning|destructive)|border-l-4/)
  })
  it('renders a thematic break as hr', () => expect(render('a\n\n---\n\nb').find('hr').exists()).toBe(true))
  it('renders bullet and ordered lists with nested marker styles', () => {
    const w = render('- a\n  - b\n    - c\n\n3. x\n4. y\n   1. z\n      1. w')
    const lists = w.findAll('ul, ol')
    expect(lists.map((l) => l.element.tagName)).toEqual(['UL', 'UL', 'UL', 'OL', 'OL', 'OL'])
    expect(lists[0].classes()).toContain('list-disc')
    expect(lists[1].classes()).toContain('list-[circle]')
    expect(lists[2].classes()).toContain('list-[square]')
    expect(lists[3].classes()).toContain('list-decimal')
    expect(lists[4].classes()).toContain('list-[lower-alpha]')
    expect(lists[5].classes()).toContain('list-[lower-roman]')
    expect(lists[3].attributes('start')).toBe('3')
    expect(lists[0].attributes('start')).toBeUndefined()
  })
  it('tight list items have no paragraphs; loose items do', () => {
    expect(render('- a\n- b').findAll('li p')).toHaveLength(0)
    expect(render('- a\n\n- b').findAll('li p')).toHaveLength(2)
  })
  it('keeps document order of mixed blocks', () => {
    const w = render('# t\n\npara\n\n- li\n\n> q\n\n---\n\n```\ncode\n```')
    const slots = Array.from((w.element as HTMLElement).children).map((c) => c.getAttribute('data-slot'))
    expect(slots).toEqual(['markdown-heading', 'markdown-paragraph', 'markdown-list', 'markdown-blockquote', 'markdown-hr', 'markdown-code-block'])
  })
  it('long unbroken words and URLs wrap', () => {
    const w = render(`${'a'.repeat(300)} https://example.com/${'b'.repeat(300)}`)
    expect(w.classes()).toContain('break-words')
    expect(w.classes()).toContain('min-w-0')
    expect(w.findAll('a')).toHaveLength(1)
  })
  it('renders raw HTML as literal text', () => {
    const w = render('<b>not bold</b> <script>alert(1)</script>\n\n<div onclick="x()">block</div>')
    expect(w.find('b').exists()).toBe(false)
    expect(w.find('script').exists()).toBe(false)
    expect(w.find('div[onclick]').exists()).toBe(false)
    expect(w.text()).toContain('<b>not bold</b>')
    expect(w.text()).toContain('<script>alert(1)</script>')
    expect(w.text()).toContain('<div onclick="x()">block</div>')
    assertSafe(w.element)
  })
  it('handles unicode and RTL text', () => {
    const w = render('# שלום\n\nمرحبا **عالم** 😀')
    expect(w.find('h1').text()).toBe('שלום')
    expect(w.find('h1').attributes('id')).toBe('שלום')
    expect(w.find('strong').text()).toBe('عالم')
  })
  it('over-long input renders as plain text, keeping line breaks and no markup', () => {
    const w = render('# not a heading\n\n**not bold** <script>', { maxLength: 5 })
    expect(w.find('h1').exists()).toBe(false)
    expect(w.find('strong').exists()).toBe(false)
    expect(w.find('p').classes()).toContain('whitespace-pre-wrap')
    expect(w.text()).toContain('# not a heading')
    assertSafe(w.element)
  })
  it('maxDepth caps nesting', () => {
    const w = render('> '.repeat(30) + 'x', { maxDepth: 3 })
    expect(w.findAll('blockquote')).toHaveLength(3)
    expect(w.text()).toContain('x')
  })
  it('renders a large document', () => {
    const w = render('- item\n'.repeat(2000))
    expect(w.findAll('li')).toHaveLength(2000)
  })
})

describe('Markdown: headings', () => {
  it('maps depth to h1..h6 with a real size and weight jump per level', () => {
    const w = render('# a\n## b\n### c\n#### d\n##### e\n###### f')
    expect(w.findAll('h1,h2,h3,h4,h5,h6').map((h) => h.element.tagName)).toEqual(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
    const sizes = w.findAll('[data-slot=markdown-heading]').map((h) => h.classes().find((c) => /^text-(?:xl|2xl|3xl|4xl|5xl|lg|md|base)$/.test(c)))
    expect(sizes).toEqual(['text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-md'])
    expect(w.find('h1').classes()).toContain('font-bold')
    expect(w.find('h2').classes()).toContain('font-semibold')
  })
  it('applies headingOffset and clamps at h6', () => {
    const w = render('# a\n## b\n##### c\n###### d', { headingOffset: 2 })
    expect(w.findAll('h1,h2,h3,h4,h5,h6').map((h) => h.element.tagName)).toEqual(['H3', 'H4', 'H6', 'H6'])
  })
  it.each([
    [-4, 'H1'],
    [0, 'H1'],
    [1, 'H2'],
    [5, 'H6'],
    [99, 'H6'],
    [Number.NaN, 'H1'],
    [1.9, 'H2'],
  ])('headingOffset %s gives %s for a top level heading', (headingOffset, tag) => {
    expect(render('# a', { headingOffset }).find('[data-slot=markdown-heading]').element.tagName).toBe(tag)
  })
  it('gives stable unique ids with -1 and -2 suffixes', () => {
    const w = render('# Same\n## Same\n### Same\n#### Other')
    expect(w.findAll('[data-slot=markdown-heading]').map((h) => h.attributes('id'))).toEqual(['same', 'same-1', 'same-2', 'other'])
    const again = render('# Same\n## Same\n### Same\n#### Other')
    expect(again.findAll('[data-slot=markdown-heading]').map((h) => h.attributes('id'))).toEqual(['same', 'same-1', 'same-2', 'other'])
  })
  it('falls back to a generic id for empty headings', () => {
    expect(render('#\n#').findAll('h1').map((h) => h.attributes('id'))).toEqual(['section', 'section-1'])
  })
  it('ids are unique in the DOM', () => {
    render('# a\n# a\n# A\n# a-1\n# a')
    const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('headingIds false omits ids and ignores anchors', () => {
    const w = render('# a', { headingIds: false, headingAnchors: true })
    expect(w.find('h1').attributes('id')).toBeUndefined()
    expect(w.find('[data-slot=markdown-heading-anchor]').exists()).toBe(false)
  })
  it('idPrefix namespaces ids', () => expect(render('# Intro', { idPrefix: 'doc' }).find('h1').attributes('id')).toBe('doc-intro'))
  it('adds a real, named, focusable anchor beside the heading when headingAnchors is set', () => {
    const w = render('## Install\n\ntext', { headingAnchors: true })
    const heading = w.find('h2')
    const anchor = w.find('a[data-slot=markdown-heading-anchor]')
    expect(anchor.attributes('href')).toBe('#install')
    expect(anchor.text()).toContain('Link to this section')
    expect(anchor.attributes('tabindex')).toBeUndefined()
    expect(anchor.classes().join(' ')).toContain('focus-visible:ring-3')
    expect(anchor.classes()).toContain('min-h-6')
    expect(heading.text()).toBe('Install')
    expect(heading.find('a').exists()).toBe(false)
    expect(heading.element.parentElement).toBe(anchor.element.parentElement)
  })
  it('anchors are off by default', () => expect(render('# a').find('[data-slot=markdown-heading-anchor]').exists()).toBe(false))
  it('heading text from inline markup', () => {
    const w = render('# A *b* `c` [d](/u)')
    expect(w.find('h1').text()).toBe('A b c d')
    expect(w.find('h1').attributes('id')).toBe('a-b-c-d')
  })
  it('XSS in a heading is text', () => {
    const w = render('# <img src=x onerror=alert(1)>\n## [x](javascript:alert(1))')
    expect(w.find('h1').text()).toBe('<img src=x onerror=alert(1)>')
    assertSafe(w.element)
  })
})

describe('Markdown: headings event', () => {
  it('emits the outline once on mount, with levels after the offset', () => {
    const w = render('# Title\n\n## Part\n\n### Part', { headingOffset: 1 })
    expect(w.emitted('headings')).toHaveLength(1)
    expect(w.emitted('headings')![0][0]).toEqual([
      { level: 2, text: 'Title', id: 'title' },
      { level: 3, text: 'Part', id: 'part' },
      { level: 4, text: 'Part', id: 'part-1' },
    ])
  })
  it('emits again only when the outline changes', async () => {
    const w = render('# A\n\ntext')
    await w.setProps({ source: '# A\n\nmore text' })
    expect(w.emitted('headings')).toHaveLength(1)
    await w.setProps({ source: '# A\n\n## B' })
    expect(w.emitted('headings')).toHaveLength(2)
    expect((w.emitted('headings')![1][0] as { text: string }[]).map((h) => h.text)).toEqual(['A', 'B'])
  })
  it('emits when only the offset changes', async () => {
    const w = render('# A')
    await w.setProps({ headingOffset: 2 })
    expect(w.emitted('headings')).toHaveLength(2)
    expect((w.emitted('headings')![1][0] as { level: number }[])[0].level).toBe(3)
  })
  it('matches extractHeadings', () => {
    const src = '# One\n\n> ## Two\n\n- ### Three\n\n## One'
    const w = render(src)
    expect(w.emitted('headings')![0][0]).toEqual(extractHeadings(src))
  })
  it('emits an empty outline for documents without headings and in inline mode', () => {
    expect(render('plain').emitted('headings')![0][0]).toEqual([])
    expect(render('# a', { inline: true }).emitted('headings')![0][0]).toEqual([])
  })
})

describe('Markdown: links', () => {
  it('external links get rel and stay in the same tab by default', () => {
    const a = render('[x](https://example.com/a "Title")').find('a')
    expect(a.attributes('href')).toBe('https://example.com/a')
    expect(a.attributes('rel')).toBe('noopener noreferrer')
    expect(a.attributes('target')).toBeUndefined()
    expect(a.attributes('title')).toBe('Title')
    expect(a.find('.sr-only').exists()).toBe(false)
    expect(a.classes()).toContain('underline')
    expect(a.classes().join(' ')).toContain('focus-visible:ring-3')
  })
  it('externalTarget _blank opens a new tab and announces it', () => {
    const a = render('[x](https://example.com)', { externalTarget: '_blank' }).find('a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toBe('noopener noreferrer')
    expect(a.find('.sr-only').text()).toBe('(opens in a new tab)')
    expect(a.text()).toBe('x (opens in a new tab)')
  })
  it('internal links are untouched by externalTarget and use linkTarget', () => {
    const w = render('[a](/docs/a) [b](#top) [c](rel/path)', { externalTarget: '_blank' })
    for (const a of w.findAll('a')) {
      expect(a.attributes('target')).toBeUndefined()
      expect(a.attributes('rel')).toBeUndefined()
    }
    const blank = render('[a](/docs/a)', { linkTarget: '_blank' }).find('a')
    expect(blank.attributes('target')).toBe('_blank')
    expect(blank.attributes('rel')).toBe('noopener noreferrer')
    expect(blank.find('.sr-only').exists()).toBe(true)
  })
  it('linkTarget _self adds no target', () => expect(render('[a](/x)', { linkTarget: '_self' }).find('a').attributes('target')).toBeUndefined())
  it('mailto and tel links never open a new tab', () => {
    const w = render('[m](mailto:a@b.c) [t](tel:+1555)', { externalTarget: '_blank', linkTarget: '_blank' })
    for (const a of w.findAll('a')) {
      expect(a.attributes('target')).toBeUndefined()
      expect(a.find('.sr-only').exists()).toBe(false)
    }
  })
  it('protocol-relative URLs count as external', () => expect(render('[x](//cdn.example.com/a)').find('a').attributes('rel')).toBe('noopener noreferrer'))
  it('autolinks and bare URLs become links', () => {
    const w = render('<https://a.example> and https://b.example/path. and <me@example.com>')
    expect(w.findAll('a').map((a) => a.attributes('href'))).toEqual(['https://a.example', 'https://b.example/path', 'mailto:me@example.com'])
  })
  it('rejected links render their label as text', () => {
    const w = render('[click **me**](javascript:alert(1)) and [two](vbscript:x)')
    expect(w.find('a').exists()).toBe(false)
    expect(w.text()).toBe('click me and two')
    expect(w.find('strong').text()).toBe('me')
  })
  it('a rejected autolink shows its text', () => {
    const w = render('<javascript:alert(1)>')
    expect(w.find('a').exists()).toBe(false)
    expect(w.text()).toBe('javascript:alert(1)')
  })
  it('an empty destination is not a link', () => {
    const w = render('[x]()')
    expect(w.find('a').exists()).toBe(false)
    expect(w.text()).toBe('x')
  })
  it('baseUrl resolves relative links and images, not fragments or absolute URLs', () => {
    const w = render('[a](guide/start) [b](/root) [c](#frag) [d](https://other.example/x) ![i](img/a.png)', { baseUrl: 'https://docs.example.com/v1/' })
    expect(w.findAll('a').map((a) => a.attributes('href'))).toEqual(['https://docs.example.com/v1/guide/start', 'https://docs.example.com/root', '#frag', 'https://other.example/x'])
    expect(w.find('img').attributes('src')).toBe('https://docs.example.com/v1/img/a.png')
  })
  it('relative links stay internal even after resolving against baseUrl', () => {
    const a = render('[a](guide)', { baseUrl: 'https://docs.example.com/', externalTarget: '_blank' }).find('a')
    expect(a.attributes('target')).toBeUndefined()
  })
  it('a hostile baseUrl cannot produce a script URL', () => {
    const w = render('[a](x) ![i](y.png)', { baseUrl: 'javascript:alert(1)//' })
    expect(w.find('a').exists()).toBe(false)
    expect(w.find('img').exists()).toBe(false)
    assertSafe(w.element)
  })
  it('allowedProtocols narrows', () => {
    const src = '[h](http://a.example) [s](https://a.example) [m](mailto:a@b.c) [r](/rel)'
    expect(render(src, { allowedProtocols: ['https'] }).findAll('a').map((a) => a.attributes('href'))).toEqual(['https://a.example', '/rel'])
    expect(render(src, { allowedProtocols: [] }).findAll('a').map((a) => a.attributes('href'))).toEqual(['/rel'])
  })
  it('allowedProtocols cannot widen', () => {
    const w = render('[a](javascript:alert(1)) [b](data:text/html,x) [c](file:///x) [d](ftp://x)', { allowedProtocols: ['javascript', 'data', 'file', 'ftp', 'vbscript'] })
    expect(w.find('a').exists()).toBe(false)
  })
})

describe('Markdown: images', () => {
  it('lazy, async, responsive, with alt', () => {
    const img = render('![A description](a.png)').find('img')
    expect(img.attributes('src')).toBe('a.png')
    expect(img.attributes('alt')).toBe('A description')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
    expect(img.classes()).toContain('max-w-full')
    expect(img.classes()).toContain('h-auto')
  })
  it('an empty markdown alt gives an empty alt attribute, never a missing one', () => {
    const img = render('![](a.png)').find('img')
    expect(img.attributes('alt')).toBe('')
    expect('alt' in img.attributes()).toBe(true)
  })
  it('alt text is plain text', () => expect(render('![a *b* `c`](x.png)').find('img').attributes('alt')).toBe('a b c'))
  it('a sole image with a title is a figure with a caption', () => {
    const w = render('![Chart](c.png "Monthly totals")')
    expect(w.find('p').exists()).toBe(false)
    const fig = w.find('figure')
    expect(fig.find('img').attributes('alt')).toBe('Chart')
    expect(fig.find('figcaption').text()).toBe('Monthly totals')
  })
  it('an image with a title among text stays inline with a title attribute', () => {
    const w = render('see ![i](a.png "tip") here')
    expect(w.find('figure').exists()).toBe(false)
    expect(w.find('p img').attributes('title')).toBe('tip')
  })
  it('a sole image without a title stays in its paragraph', () => {
    const w = render('![a](a.png)')
    expect(w.find('p img').exists()).toBe(true)
    expect(w.find('figure').exists()).toBe(false)
  })
  it('a rejected image shows its alt text; an empty alt shows nothing', () => {
    expect(render('![the alt](javascript:alert(1))').text()).toBe('the alt')
    expect(render('![](javascript:alert(1))').text()).toBe('')
    expect(render('![t](file:///etc/passwd "cap")').find('figure').exists()).toBe(false)
  })
  it('allows raster data URIs only', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo='
    expect(render(`![a](${png})`).find('img').attributes('src')).toBe(png)
    const svg = render('![a](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)\n\n![b](data:text/html;base64,PHNjcmlwdD4=)')
    expect(svg.find('img').exists()).toBe(false)
  })
  it('allowedProtocols narrows image sources', () => {
    expect(render('![a](http://a.example/x.png)', { allowedProtocols: ['https'] }).find('img').exists()).toBe(false)
    expect(render('![a](https://a.example/x.png)', { allowedProtocols: ['https'] }).find('img').exists()).toBe(true)
  })
})

describe('Markdown: code blocks', () => {
  const fence = (lang: string, body = 'a: 1') => `\`\`\`${lang}\n${body}\n\`\`\``
  it.each([
    ['yaml', 'yaml'],
    ['yml', 'yaml'],
    ['YAML', 'yaml'],
    ['json', 'json'],
    ['go', 'go'],
    ['golang', 'go'],
    ['toml', 'toml'],
    ['shell', 'shell'],
    ['sh', 'shell'],
    ['bash', 'shell'],
    ['zsh', 'shell'],
    ['plain', 'plain'],
    ['text', 'plain'],
  ])('%s uses CodeViewer with %s', (lang, language) => {
    const w = render(fence(lang, 'x'))
    const viewer = w.find('[data-slot=code-viewer]')
    expect(viewer.exists()).toBe(true)
    expect(viewer.attributes('data-language')).toBe(language)
    expect(w.find('[data-slot=copy-button]').attributes('aria-label')).toBe('Copy code')
  })
  it('reads the filename from title= or filename= in the info string', () => {
    const w = render(`${fence('yaml title="values.yaml"')}\n\n${fence('go filename=main.go', 'package main')}`)
    expect(w.findAll('[data-slot=code-viewer-title]').map((t) => t.text())).toEqual(['values.yaml', 'main.go'])
    expect(w.findAll('[data-slot=code-viewer-scroll]').map((t) => t.attributes('aria-label'))).toEqual(['values.yaml', 'main.go'])
  })
  it('highlights tokens', () => expect(render(fence('json', '{"a": 1}')).findAll('[data-slot=code-viewer-token]').length).toBeGreaterThan(0))
  it('line numbers and folding are off by default and on with codeFold', () => {
    const json = fence('json', '{\n  "a": {\n    "b": 1\n  }\n}')
    expect(render(json).find('[data-slot=code-viewer-fold]').exists()).toBe(false)
    expect(render(json).find('[data-slot=code-viewer-line-number]').exists()).toBe(false)
    const folded = render(json, { codeFold: true })
    expect(folded.find('[data-slot=code-viewer-fold]').exists()).toBe(true)
    expect(folded.find('[data-slot=code-viewer-line-number]').exists()).toBe(true)
  })
  it('unknown languages render a focusable, labelled plain region with a copy button', () => {
    const w = render(fence('ruby', 'puts 1'))
    const pre = w.find('pre')
    expect(w.find('[data-slot=code-viewer]').exists()).toBe(false)
    expect(pre.attributes('role')).toBe('region')
    expect(pre.attributes('tabindex')).toBe('0')
    expect(pre.attributes('aria-label')).toBe('ruby code')
    expect(pre.text()).toBe('puts 1')
    expect(w.find('[data-slot=markdown-code]').attributes('data-language')).toBe('ruby')
    expect(w.find('[data-slot=copy-button]').exists()).toBe(true)
  })
  it('fenced code without a language and indented code are plain regions named Code', () => {
    const w = render('```\nx\n```\n\n    y')
    expect(w.findAll('pre').map((p) => p.attributes('aria-label'))).toEqual(['Code', 'Code 2'])
  })
  it('names of code regions stay unique', () => {
    const w = render(`${fence('yaml')}\n\n${fence('yaml')}\n\n${fence('ruby')}\n\n${fence('ruby')}`)
    const names = w.findAll('[role=region]').map((r) => r.attributes('aria-label'))
    expect(names).toEqual(['YAML code', 'YAML code 2', 'ruby code', 'ruby code 2'])
  })
  it('highlight false renders everything as plain regions', () => {
    const w = render(fence('yaml title="a.yaml"'), { highlight: false })
    expect(w.find('[data-slot=code-viewer]').exists()).toBe(false)
    expect(w.find('pre').attributes('aria-label')).toBe('a.yaml')
    expect(w.find('[data-slot=markdown-code-header]').text()).toContain('a.yaml')
  })
  it('an unclosed fence renders its content', () => {
    const w = render('```yaml\nkey: value\nmore: 1')
    expect(w.find('[data-slot=code-viewer]').exists()).toBe(true)
    expect(w.text()).toContain('key')
  })
  it('code content is text, never markup', () => {
    const payload = '<script>alert(1)</script><img src=x onerror=alert(1)>'
    const w = render(`${fence('html', payload)}\n\n${fence('yaml', payload)}\n\n${fence('json', payload)}`)
    expect(w.find('pre').text()).toBe(payload)
    expect(w.text()).toContain(payload.slice(0, 20))
    assertSafe(w.element)
  })
  it('info strings with XSS payloads stay inert', () => {
    const w = render('```"><script>alert(1)</script> title="<img src=x onerror=alert(1)>"\nx\n```\n\n```yaml title="</div><script>alert(1)</script>"\nk: v\n```')
    assertSafe(w.element)
    expect(w.find('script').exists()).toBe(false)
  })
  it('copies the code through the copy button', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const w = render(fence('ruby', 'puts 1'))
    await w.find('[data-slot=copy-button]').trigger('click')
    await nextTick()
    expect(writeText).toHaveBeenCalledWith('puts 1')
  })
  it('a code block is wrapped so long lines scroll inside it', () => {
    const w = render(fence('ruby', 'x'.repeat(500)))
    expect(w.find('[data-slot=markdown-code-block]').classes()).toContain('max-w-full')
    expect(w.find('pre').classes()).toContain('overflow-auto')
  })
})

describe('Markdown: tables', () => {
  const table = '| Name | Count | Note |\n|:-----|------:|:----:|\n| alpha | 12 | ok |\n| beta | 3.5 | late |\n| gamma | 100% | x |'
  it('renders a labelled, focusable scroll region with column headers', () => {
    const w = render(`## Totals\n\n${table}`)
    const region = w.find('[data-slot=markdown-table-scroll]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBe('Totals')
    expect(region.classes()).toContain('overflow-x-auto')
    expect(region.classes().join(' ')).toContain('focus-visible:ring-3')
    const ths = w.findAll('th')
    expect(ths.map((t) => t.attributes('scope'))).toEqual(['col', 'col', 'col'])
    expect(ths.map((t) => t.text())).toEqual(['Name', 'Count', 'Note'])
    expect(w.findAll('tbody tr')).toHaveLength(3)
  })
  it('is named Table without a heading and labels stay unique', () => {
    const w = render(`${table}\n\n${table}\n\n# After\n\n${table}\n\n${table}`)
    expect(w.findAll('[data-slot=markdown-table-scroll]').map((r) => r.attributes('aria-label'))).toEqual(['Table', 'Table 2', 'After', 'After 2'])
  })
  it('applies markdown alignment with logical classes', () => {
    const w = render(table)
    expect(w.findAll('th').map((t) => t.classes().find((c) => /^text-(?:start|end|center)$/.test(c)))).toEqual(['text-start', 'text-end', 'text-center'])
    const cells = w.findAll('tbody tr:first-child td')
    expect(cells.map((c) => c.classes().find((k) => /^text-(?:start|end|center)$/.test(k)))).toEqual(['text-start', 'text-end', 'text-center'])
  })
  it('uses tabular-nums only in numeric columns', () => {
    const w = render(table)
    const first = w.findAll('tbody tr:first-child td')
    expect(first.map((c) => c.classes().includes('tabular-nums'))).toEqual([false, true, false])
    expect(w.findAll('th').map((c) => c.classes().includes('tabular-nums'))).toEqual([false, true, false])
  })
  it('does not zebra stripe', () => expect(render(table).html()).not.toMatch(/odd:|even:/))
  it('pads ragged rows and truncates long ones', () => {
    const w = render('| a | b |\n|---|---|\n| 1 |\n| 1 | 2 | 3 |')
    expect(w.findAll('tbody tr').map((r) => r.findAll('td').length)).toEqual([2, 2])
  })
  it('an empty header cell gets a screen reader name', () => {
    const w = render('| | b |\n|---|---|\n| 1 | 2 |')
    expect(w.findAll('th')[0].text()).toBe('Column 1')
    expect(w.findAll('th')[0].find('.sr-only').exists()).toBe(true)
  })
  it('a table without rows renders only the header', () => {
    const w = render('| a |\n|---|')
    expect(w.find('tbody').exists()).toBe(false)
    expect(w.find('thead').exists()).toBe(true)
  })
  it('renders inline markdown in cells and keeps HTML inert', () => {
    const w = render('| a |\n|---|\n| **b** [c](/u) <img src=x onerror=alert(1)> |')
    expect(w.find('td strong').text()).toBe('b')
    expect(w.find('td a').attributes('href')).toBe('/u')
    expect(w.find('td img').exists()).toBe(false)
    assertSafe(w.element)
  })
  it('wide tables keep the region scrollable inside a width-limited root', () => {
    const cols = 30
    const row = (c: string) => `|${Array.from({ length: cols }, () => c).join('|')}|`
    const w = render(`${row('h')}\n${row('-')}\n${row('cell')}`)
    expect(w.find('[data-slot=markdown-table-scroll]').classes()).toContain('max-w-full')
    expect(w.findAll('td')).toHaveLength(cols)
  })
})

describe('Markdown: task lists', () => {
  it('renders real disabled checkboxes with names and state', () => {
    const w = render('- [x] Ship it\n- [ ] Write **docs**\n- [X] Done')
    const boxes = w.findAll('input[type=checkbox]')
    expect(boxes).toHaveLength(3)
    expect(boxes.map((b) => (b.element as HTMLInputElement).checked)).toEqual([true, false, true])
    expect(boxes.every((b) => (b.element as HTMLInputElement).disabled)).toBe(true)
    expect(boxes.map((b) => b.attributes('aria-label'))).toEqual(['Ship it', 'Write docs', 'Done'])
  })
  it('an unnamed task falls back to Task', () => expect(render('- [ ]').find('input').attributes('aria-label')).toBe('Task'))
  it('a list of only tasks has no markers; a mixed list keeps them', () => {
    expect(render('- [ ] a\n- [x] b').find('ul').classes()).toContain('list-none')
    const mixed = render('- [ ] a\n- plain')
    expect(mixed.find('ul').classes()).toContain('list-disc')
    expect(mixed.findAll('li')[0].classes()).toContain('list-none')
    expect(mixed.findAll('li')[1].find('input').exists()).toBe(false)
  })
  it('task items can be loose and nested', () => {
    const w = render('- [ ] a\n\n  more\n\n- [x] b\n  - [ ] c')
    expect(w.findAll('input')).toHaveLength(3)
  })
})

describe('Markdown: inline mode', () => {
  it('renders a span with inline content only', () => {
    const w = render('A **bold** [link](https://x.example) and `code`', { inline: true })
    expect((w.element as HTMLElement).tagName).toBe('SPAN')
    expect(w.classes()).not.toContain('max-w-prose')
    expect(w.find('p').exists()).toBe(false)
    expect(w.find('strong').text()).toBe('bold')
    expect(w.find('a').attributes('href')).toBe('https://x.example')
    expect(w.text()).toBe('A bold link and code')
  })
  it('does not interpret block syntax', () => {
    const w = render('# not a heading\n- not a list\n> not a quote', { inline: true })
    expect(w.find('h1, ul, blockquote').exists()).toBe(false)
    expect(w.text()).toContain('# not a heading')
  })
  it('empty and whitespace', () => expect(render('  ', { inline: true }).text()).toBe(''))
  it('keeps URL safety', () => {
    const w = render('[x](javascript:alert(1)) <b onclick=x>', { inline: true })
    expect(w.find('a').exists()).toBe(false)
    assertSafe(w.element)
  })
  it('flattens the first blocks of a pre-parsed tree if given several', () => {
    // inline mode asks the parser for one paragraph, so a document with blocks never reaches the renderer in that shape.
    expect(parseMarkdown('# a\n\nb', { inline: true }).children).toHaveLength(1)
  })
})

describe('Markdown: source and slot', () => {
  it('uses the default slot text when source is absent', () => {
    const w = mount(Markdown, { slots: { default: 'Hello **slot** text' } })
    mounted.push(w)
    expect(w.find('strong').text()).toBe('slot')
  })
  it('source wins over the slot', () => {
    const w = mount(Markdown, { props: { source: 'from source' }, slots: { default: 'from slot' } })
    mounted.push(w)
    expect(w.text()).toBe('from source')
  })
  it('an empty source string is a source', () => {
    const w = mount(Markdown, { props: { source: '' }, slots: { default: 'ignored' } })
    mounted.push(w)
    expect(w.text()).toBe('')
  })
  it('slot content that is not text is ignored', () => {
    const w = mount(Markdown, { slots: { default: () => [h('b', 'element'), 'text part'] } })
    mounted.push(w)
    expect(w.text()).toBe('text part')
    expect(w.find('b').exists()).toBe(false)
  })
  it('text from a v-for fragment is included', () => {
    const w = mount(
      defineComponent({
        components: { Markdown },
        template: '<Markdown><template v-for="n in 2" :key="n">line {{ n }} </template></Markdown>',
      }),
    )
    mounted.push(w as never)
    expect(w.text()).toContain('line 1')
    expect(w.text()).toContain('line 2')
  })
  it('dedent removes shared indentation and blank edges', () => {
    expect(dedent('\n    # a\n\n      b\n    c\n  ')).toBe('# a\n\n  b\nc')
    expect(dedent('x')).toBe('x')
    expect(dedent('')).toBe('')
    expect(dedent('\t\ta\r\n\t\tb')).toBe('a\nb')
    expect(dedent('   \n  ')).toBe('')
    expect(dedent('a\n  b')).toBe('a\n  b')
  })
  it('vnodesToText handles undefined', () => expect(vnodesToText(undefined)).toBe(''))
})

describe('Markdown: components override', () => {
  const Link = defineComponent({
    props: { href: String, title: String, external: Boolean, target: String, rel: String },
    setup(p, { slots }) {
      return () => h('a', { 'data-custom': 'link', href: p.href, 'data-external': String(p.external), rel: p.rel }, slots.default?.())
    },
  })
  const Img = defineComponent({
    props: { src: String, alt: String, title: String },
    setup: (p) => () => h('img', { 'data-custom': 'image', src: p.src, alt: p.alt }),
  })
  const Code = defineComponent({
    props: { code: String, language: String, info: String, filename: String, closed: Boolean },
    setup: (p) => () => h('pre', { 'data-custom': 'code', 'data-language': p.language, 'data-filename': p.filename, 'data-closed': String(p.closed) }, p.code),
  })
  it('link renderer receives the checked href and the label slot', () => {
    const w = render('[a](https://x.example) [b](/in) [c](javascript:x)', { components: { link: Link as Component } })
    const links = w.findAll('[data-custom=link]')
    expect(links.map((l) => l.attributes('href'))).toEqual(['https://x.example', '/in'])
    expect(links.map((l) => l.attributes('data-external'))).toEqual(['true', 'false'])
    expect(links[0].text()).toBe('a')
  })
  it('link renderer can be an element name', () => {
    const w = render('[a](/in "t")', { components: { link: 'a' } })
    expect(w.find('a').attributes('href')).toBe('/in')
    expect(w.find('a').attributes('data-slot')).toBeUndefined()
  })
  it('image renderer receives checked src and alt, as component or element', () => {
    const w = render('![a](x.png "cap")\n\n![b](javascript:x)', { components: { image: Img as Component } })
    expect(w.findAll('[data-custom=image]')).toHaveLength(1)
    expect(w.find('[data-custom=image]').attributes('src')).toBe('x.png')
    expect(w.find('figure').exists()).toBe(false)
    expect(render('![a](x.png)', { components: { image: 'img' } }).find('img').attributes('src')).toBe('x.png')
  })
  it('code renderer receives the code, language, filename and closed flag', () => {
    const w = render('```yaml title="a.yaml"\nk: v\n```\n\n```go\nopen', { components: { code: Code as Component } })
    const blocks = w.findAll('[data-custom=code]')
    expect(blocks.map((b) => b.attributes('data-language'))).toEqual(['yaml', 'go'])
    expect(blocks.map((b) => b.attributes('data-filename'))).toEqual(['a.yaml', undefined])
    expect(blocks.map((b) => b.attributes('data-closed'))).toEqual(['true', 'false'])
    expect(blocks[0].text()).toBe('k: v')
    expect(w.find('[data-slot=code-viewer]').exists()).toBe(false)
  })
  it('code renderer can be an element name', () => {
    const w = render('```ruby\nx\n```', { components: { code: 'pre' } })
    expect(w.find('pre').attributes('data-language')).toBe('ruby')
  })
})

describe('Markdown: XSS corpus', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">x</a>',
    '<details open ontoggle=alert(1)>',
    '[x](javascript:alert(1))',
    '[x](  JaVaScRiPt:alert(1))',
    '[x](JAVASCRIPT:alert(1))',
    '[x](java\nscript:alert(1))',
    '[x](<java\tscript:alert(1)>)',
    '[x](&#106;avascript:alert(1))',
    '[x](&#x6A;avascript:alert(1))',
    '[x](&#0000106;avascript:alert(1))',
    '[x](%6Aavascript:alert(1))',
    '[x](javascript&colon;alert(1))',
    '[x](\u0001javascript:alert(1))',
    '[x]( javascript:alert(1))',
    '[x](vbscript:msgbox(1))',
    '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '[x](file:///etc/passwd)',
    '[x](/ "<script>alert(1)</script>")',
    '[x](/ "\\" onmouseover=\\"alert(1)")',
    '[<img src=x onerror=alert(1)>](/u)',
    '[x][r]\n\n[r]: javascript:alert(1)',
    '[x][r]\n\n[r]: /u "javascript:alert(1)"',
    '<javascript:alert(1)>',
    '<JaVaScRiPt:alert(1)>',
    '![x](javascript:alert(1))',
    '![x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '![x](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+)',
    '![x](x" onerror="alert(1))',
    '![x](<x" onerror="alert(1)>)',
    '![x" onerror="alert(1)](a.png)',
    '![x](a.png "\\" onerror=\\"alert(1)")',
    '![<script>alert(1)</script>](a.png)',
    '```"><script>alert(1)</script>\nx\n```',
    '```yaml title="x" onclick="alert(1)"\nk: v\n```',
    '# <script>alert(1)</script>',
    '# [x](javascript:alert(1))',
    '| <img src=x onerror=alert(1)> |\n|---|\n| [x](javascript:alert(1)) |',
    '- [ ] <img src=x onerror=alert(1)>',
    '> <script>alert(1)</script>',
    '`<script>alert(1)</script>`',
    '&lt;script&gt;alert(1)&lt;/script&gt;',
    '&#60;script&#62;alert(1)&#60;/script&#62;',
    '\\<script>alert(1)\\</script>',
    'https://example.com/"onmouseover="alert(1)',
    'https://example.com/<script>alert(1)</script>',
    '<https://example.com/"onmouseover="alert(1)>',
    '[a](https://example.com "t") <style>*{display:none}</style>',
  ]
  it.each(payloads.map((p) => [p]))('%j', (src) => {
    const w = render(src, { headingAnchors: true, externalTarget: '_blank' })
    assertSafe(w.element)
    expect(w.findAll('script, iframe, style')).toHaveLength(0)
    const inline = render(src, { inline: true })
    assertSafe(inline.element)
    const noHighlight = render(src, { highlight: false })
    assertSafe(noHighlight.element)
  })
  it('never calls alert', () => {
    const alert = vi.fn()
    vi.stubGlobal('alert', alert)
    for (const p of payloads) render(p)
    expect(alert).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
  it('the visible text of rejected payloads stays visible', () => {
    expect(render('[click here](javascript:alert(1))').text()).toBe('click here')
    expect(render('<script>alert(1)</script>').text()).toBe('<script>alert(1)</script>')
  })
  it('source files never use v-html or innerHTML', () => {
    const files = import.meta.glob(['./*.vue', './*.ts', './parse/*.ts', '!./**/*.test.ts', '!./*.docs.ts'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
    expect(Object.keys(files).length).toBeGreaterThan(10)
    for (const [file, text] of Object.entries(files)) {
      expect(text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''), file).not.toMatch(/v-html|innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function/)
    }
  })
})

describe('Markdown: streaming', () => {
  const doc = [
    '# Streaming sample',
    '',
    'Text with *emphasis*, **strong**, ~~gone~~, `code`, a [link](https://example.com "t") and ![img](pic.png "cap") plus <script>alert(1)</script>.',
    '',
    '- [x] done',
    '- [ ] open **bold**',
    '',
    '> quote with [ref][r] and [bad](javascript:alert(1))',
    '',
    '| Name | N |',
    '|:--|--:|',
    '| a | 1 |',
    '| b | 22 |',
    '',
    '```yaml title="a.yaml"',
    'k: v',
    '```',
    '',
    '```ruby',
    'puts 1',
    '```',
    '',
    'Done https://example.com/x_(y).',
    '',
    '[r]: https://example.com/r',
  ].join('\n')

  it('marks the root as busy while streaming', () => {
    const w = render('x', { streaming: true })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.attributes('data-streaming')).toBe('')
    const idle = render('x')
    expect(idle.attributes('aria-busy')).toBeUndefined()
    expect(idle.attributes('data-streaming')).toBeUndefined()
  })
  it('renders every prefix of a long document without throwing, always safe', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = render('', { streaming: true })
    for (let n = 1; n <= doc.length; n += 1) {
      await w.setProps({ source: doc.slice(0, n) })
      assertSafe(w.element)
    }
    expect(err).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    err.mockRestore()
    warn.mockRestore()
    expect(w.find('[data-slot=code-viewer]').exists()).toBe(true)
    expect(w.findAll('li')).toHaveLength(2)
  })
  it('never shows a raw dangling marker at the end of the last paragraph', async () => {
    const w = render('', { streaming: true })
    for (const cut of ['Hello **bol', 'Hello *it', 'Use `co', 'See [lab', 'See [label](https://exa', 'See ![al', 'Hello ~~st']) {
      await w.setProps({ source: cut })
      expect(w.text(), cut).not.toMatch(/[*`~[\]]|\]\(/)
    }
  })
  it('hides an unfinished table header and then shows the table', async () => {
    const w = render('Before\n\n| a | b |', { streaming: true })
    expect(w.text()).toBe('Before')
    await w.setProps({ source: 'Before\n\n| a | b |\n|---|---|\n| 1 | 2 |' })
    expect(w.find('table').exists()).toBe(true)
  })
  it('the final output equals the non-streaming output', () => {
    const live = render(`${doc}\n`, { streaming: true })
    const done = render(`${doc}\n`)
    const clean = (html: string) => html.replace(/ aria-busy="true"| data-streaming=""| (?:id|aria-controls)="v-\d+-code"/g, '')
    expect(clean(live.element.innerHTML)).toBe(clean(done.element.innerHTML))
  })
  it('keeps the same elements while text grows (no remount flicker)', async () => {
    const w = render('# T\n\nfirst paragraph', { streaming: true })
    const heading = w.find('h1').element
    await w.setProps({ source: '# T\n\nfirst paragraph grows' })
    expect(w.find('h1').element).toBe(heading)
  })
  it('streaming works in inline mode', async () => {
    const w = render('Hello **wor', { streaming: true, inline: true })
    expect(w.find('strong').text()).toBe('wor')
  })
})
