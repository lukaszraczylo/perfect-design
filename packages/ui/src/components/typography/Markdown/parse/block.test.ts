import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './parse'
import { html } from './testing'

const cases = (list: [string, string, string][]) => list

describe('headings', () => {
  it.each(
    cases([
      ['atx levels 1 to 6', '# a\n## b\n### c\n#### d\n##### e\n###### f', '<h1>a</h1>\n<h2>b</h2>\n<h3>c</h3>\n<h4>d</h4>\n<h5>e</h5>\n<h6>f</h6>'],
      ['seven hashes is text', '####### no', '<p>####### no</p>'],
      ['needs a space', '#5 bolt\n#hashtag', '<p>#5 bolt\n#hashtag</p>'],
      ['escaped hash', '\\## foo', '<p>## foo</p>'],
      ['closing sequence', '## foo ##\n### bar ###   ', '<h2>foo</h2>\n<h3>bar</h3>'],
      ['closing sequence needs a space before it', '# foo#', '<h1>foo#</h1>'],
      ['only hashes', '# #\n##', '<h1></h1>\n<h2></h2>'],
      ['up to three spaces of indent', '   # a', '<h1>a</h1>'],
      ['four spaces is code', '    # a', '<pre><code># a</code></pre>'],
      ['inline content', '# a *b* `c`', '<h1>a <em>b</em> <code>c</code></h1>'],
      ['setext h1 and h2', 'Foo *bar*\n=========\n\nFoo\n---', '<h1>Foo <em>bar</em></h1>\n<h2>Foo</h2>'],
      ['setext multi-line content', 'Foo\nbar\n---', '<h2>Foo\nbar</h2>'],
      ['setext underline is any length', 'a\n=', '<h1>a</h1>'],
      ['setext vs thematic break after blank line', 'a\n\n---', '<p>a</p>\n<hr />'],
      ['empty line before underline gives a break', '---\n---', '<hr />\n<hr />'],
      ['setext inside a block quote', '> a\n> ---', '<blockquote>\n<h2>a</h2>\n</blockquote>'],
      ['atx interrupts a paragraph', 'a\n# b\nc', '<p>a</p>\n<h1>b</h1>\n<p>c</p>'],
    ]),
  )('%s', (_, src, out) => expect(html(src)).toBe(out))

  it('underline of reference definitions only is not a heading', () => {
    expect(html('[a]: /u\n---')).toBe('<hr />')
  })
})

describe('thematic breaks', () => {
  it.each(['***', '---', '___', ' ***', '  - - -', '_ _ _ _', '*****', '-   -   -   -'])('%j', (src) => expect(html(src)).toBe('<hr />'))
  it.each(['**', '--', '__', '    ---', '+++', '=== ', '- -'])('%j is not a break', (src) => expect(html(src)).not.toContain('<hr />'))
  it('mixed characters are not a break', () => expect(html('*-*')).toBe('<p><em>-</em></p>'))
})

describe('paragraphs', () => {
  it('joins lines with soft breaks and strips leading indentation', () => expect(html('aaa\n   bbb\n     ccc')).toBe('<p>aaa\nbbb\nccc</p>'))
  it('separates on blank lines', () => expect(html('a\n\n\n\nb')).toBe('<p>a</p>\n<p>b</p>'))
  it('hard break from two trailing spaces', () => expect(html('a  \nb')).toBe('<p>a<br />\nb</p>'))
  it('hard break from a backslash', () => expect(html('a\\\nb')).toBe('<p>a<br />\nb</p>'))
  it('one trailing space is a soft break and is dropped', () => expect(html('a \nb')).toBe('<p>a\nb</p>'))
  it('no hard break at the end of a paragraph', () => expect(html('a  ')).toBe('<p>a</p>'))
  it('a lone backslash at the end stays', () => expect(html('a\\')).toBe('<p>a\\</p>'))
  it('indentation of up to three spaces is ignored', () => expect(html('   a')).toBe('<p>a</p>'))
  it('empty and whitespace input produce nothing', () => {
    expect(parseMarkdown('').children).toEqual([])
    expect(parseMarkdown('  \n\t\n \n').children).toEqual([])
  })
  it('code cannot interrupt a paragraph', () => expect(html('a\n    b')).toBe('<p>a\nb</p>'))
})

describe('indented code', () => {
  it('four spaces', () => expect(html('    a\n    b')).toBe('<pre><code>a\nb</code></pre>'))
  it('keeps extra indentation and blank lines inside', () => expect(html('    a\n\n      b')).toBe('<pre><code>a\n\n  b</code></pre>'))
  it('trailing blank lines are dropped', () => expect(html('    a\n\n\n')).toBe('<pre><code>a</code></pre>'))
  it('a tab is four columns', () => expect(html('\ta\n\t\tb')).toBe('<pre><code>a\n\tb</code></pre>'))
  it('text after code starts a new paragraph', () => expect(html('    a\nb')).toBe('<pre><code>a</code></pre>\n<p>b</p>'))
  it('is literal text', () => expect(html('    <b>*x*</b>')).toBe('<pre><code>&lt;b&gt;*x*&lt;/b&gt;</code></pre>'))
  it('is closed', () => expect(parseMarkdown('    a').children[0]).toMatchObject({ type: 'code', closed: true, lang: null, info: '' }))
})

describe('fenced code', () => {
  it('backtick fence with language', () => expect(html('```ruby\ndef x\nend\n```')).toBe('<pre><code class="language-ruby">def x\nend</code></pre>'))
  it('tilde fence', () => expect(html('~~~\na\n~~~')).toBe('<pre><code>a</code></pre>'))
  it('other fence characters inside are content', () => expect(html('```\n~~~\n```')).toBe('<pre><code>~~~</code></pre>'))
  it('closing fence must be at least as long', () => expect(html('````\n```\n````')).toBe('<pre><code>```</code></pre>'))
  it('closing fence can be longer', () => expect(html('```\na\n`````')).toBe('<pre><code>a</code></pre>'))
  it('closing fence cannot carry an info string', () => expect(html('```\na\n``` b\n```')).toBe('<pre><code>a\n``` b</code></pre>'))
  it('unclosed fence runs to the end of the input', () => {
    const [node] = parseMarkdown('```js\nconst a = 1\n\nmore').children
    expect(node).toMatchObject({ type: 'code', lang: 'js', value: 'const a = 1\n\nmore', closed: false })
  })
  it('a closed fence is marked closed', () => expect(parseMarkdown('```\na\n```').children[0]).toMatchObject({ closed: true }))
  it('an empty unclosed fence', () => expect(parseMarkdown('```').children[0]).toMatchObject({ type: 'code', value: '', closed: false }))
  it('empty fenced block', () => expect(html('```\n```')).toBe('<pre><code></code></pre>'))
  it('blank lines inside are kept', () => expect(html('```\n\na\n\n```')).toBe('<pre><code>\na\n</code></pre>'))
  it('fence indentation is removed from content lines', () => expect(html('  ```\n  a\n   b\n c\n  ```')).toBe('<pre><code>a\n b\nc</code></pre>'))
  it('backtick fence info cannot contain a backtick', () => expect(html('``` a`b\nc')).toBe('<p>``` a`b\nc</p>'))
  it('tilde fence info can contain backticks', () => expect(parseMarkdown('~~~ a`b\nc').children[0]).toMatchObject({ type: 'code', info: 'a`b' }))
  it('interrupts a paragraph', () => expect(html('a\n```\nb\n```\nc')).toBe('<p>a</p>\n<pre><code>b</code></pre>\n<p>c</p>'))
  it('splits info into language and meta', () => {
    expect(parseMarkdown('```go title="main.go" {1}\nx\n```').children[0]).toMatchObject({ lang: 'go', meta: 'title="main.go" {1}', info: 'go title="main.go" {1}' })
  })
  it('info with only a language has no meta', () => expect(parseMarkdown('```yaml\nx\n```').children[0]).toMatchObject({ lang: 'yaml', meta: null }))
  it('decodes escapes and entities in the info string', () => expect(parseMarkdown('```a&amp;b\\*\nx\n```').children[0]).toMatchObject({ lang: 'a&b*' }))
  it('content is never interpreted', () => expect(html('```\n<script>alert(1)</script> **x** [a](javascript:x)\n```')).toBe('<pre><code>&lt;script&gt;alert(1)&lt;/script&gt; **x** [a](javascript:x)</code></pre>'))
  it('fences inside lists keep their indentation base', () => expect(html('- a\n  ```\n  b\n  ```\n- c')).toBe('<ul>\n<li>a\n<pre><code>b</code></pre></li>\n<li>c</li>\n</ul>'))
  it('a fence inside a block quote ends with the quote', () => expect(html('> ```\n> a\nb')).toBe('<blockquote>\n<pre><code>a</code></pre>\n</blockquote>\n<p>b</p>'))
  it('a long fence line of backticks with a later backtick is not a fence', () => expect(html('`'.repeat(5) + 'x`')).not.toContain('<pre>'))
})

describe('block quotes', () => {
  it('basic', () => expect(html('> a\n> b')).toBe('<blockquote>\n<p>a\nb</p>\n</blockquote>'))
  it('optional space after the marker', () => expect(html('>a\n>   b')).toBe('<blockquote>\n<p>a\nb</p>\n</blockquote>'))
  it('lazy continuation', () => expect(html('> a\nb\nc')).toBe('<blockquote>\n<p>a\nb\nc</p>\n</blockquote>'))
  it('a blank line ends the quote', () => expect(html('> a\n\nb')).toBe('<blockquote>\n<p>a</p>\n</blockquote>\n<p>b</p>'))
  it('a blank quoted line separates paragraphs', () => expect(html('> a\n>\n> b')).toBe('<blockquote>\n<p>a</p>\n<p>b</p>\n</blockquote>'))
  it('nested', () => expect(html('> a\n> > b\n> c')).toBe('<blockquote>\n<p>a</p>\n<blockquote>\n<p>b\nc</p>\n</blockquote>\n</blockquote>'))
  it('lazy continuation reaches the innermost paragraph', () => expect(html('> > a\nb')).toBe('<blockquote>\n<blockquote>\n<p>a\nb</p>\n</blockquote>\n</blockquote>'))
  it('holds other blocks', () => expect(html('> # h\n> - i\n>\n>     code')).toBe('<blockquote>\n<h1>h</h1>\n<ul>\n<li><p>i</p>\n<p>code</p></li>\n</ul>\n</blockquote>'))
  it('indented code inside a quote', () => expect(html('> # h\n>\n>     code')).toBe('<blockquote>\n<h1>h</h1>\n<pre><code>code</code></pre>\n</blockquote>'))
  it('a heading is not lazily continued', () => expect(html('> a\n# b')).toBe('<blockquote>\n<p>a</p>\n</blockquote>\n<h1>b</h1>'))
  it('interrupts a paragraph', () => expect(html('a\n> b')).toBe('<p>a</p>\n<blockquote>\n<p>b</p>\n</blockquote>'))
  it('four spaces of indent is code, not a quote', () => expect(html('    > a')).toBe('<pre><code>&gt; a</code></pre>'))
  it('an empty quote', () => expect(html('>')).toBe('<blockquote>\n\n</blockquote>'))
})

describe('lists', () => {
  it('bullet markers', () => expect(html('- a\n- b')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n</ul>'))
  it('a different bullet starts a new list', () => expect(html('- a\n+ b\n* c')).toBe('<ul>\n<li>a</li>\n</ul>\n<ul>\n<li>b</li>\n</ul>\n<ul>\n<li>c</li>\n</ul>'))
  it('a different delimiter starts a new list', () => expect(html('1. a\n2) b')).toBe('<ol>\n<li>a</li>\n</ol>\n<ol start="2">\n<li>b</li>\n</ol>'))
  it('ordered lists keep their start number', () => expect(html('10. a\n11. b')).toBe('<ol start="10">\n<li>a</li>\n<li>b</li>\n</ol>'))
  it('start 0', () => expect(parseMarkdown('0. a').children[0]).toMatchObject({ type: 'list', ordered: true, start: 0 }))
  it('bullet lists have no start', () => expect(parseMarkdown('- a').children[0]).toMatchObject({ ordered: false, start: null }))
  it('numbers can repeat', () => expect(html('1. a\n1. b\n1. c')).toBe('<ol>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n</ol>'))
  it('nine digits at most', () => {
    expect(html('123456789. a')).toContain('<ol start="123456789">')
    expect(html('1234567890. a')).toBe('<p>1234567890. a</p>')
  })
  it('a marker needs a following space', () => expect(html('-a\n+b\n1.c')).toBe('<p>-a\n+b\n1.c</p>'))
  it('only 1. can interrupt a paragraph', () => {
    expect(html('a\n2. b')).toBe('<p>a\n2. b</p>')
    expect(html('a\n1. b')).toBe('<p>a</p>\n<ol>\n<li>b</li>\n</ol>')
  })
  it('an empty item cannot interrupt a paragraph', () => expect(html('a\n-')).toBe('<h2>a</h2>'))
  it('a bullet interrupts a paragraph', () => expect(html('a\n- b')).toBe('<p>a</p>\n<ul>\n<li>b</li>\n</ul>'))
  it('tight list items have no paragraphs', () => expect(parseMarkdown('- a\n- b').children[0]).toMatchObject({ tight: true }))
  it('a blank line between items makes the list loose', () => expect(html('- a\n\n- b')).toBe('<ul>\n<li><p>a</p></li>\n<li><p>b</p></li>\n</ul>'))
  it('a blank line inside an item makes the list loose', () => expect(html('- a\n\n  b\n- c')).toBe('<ul>\n<li><p>a</p>\n<p>b</p></li>\n<li><p>c</p></li>\n</ul>'))
  it('blank lines at the end do not loosen', () => expect(parseMarkdown('- a\n- b\n\n').children[0]).toMatchObject({ tight: true }))
  it('a blank line inside a nested list loosens only that list', () => {
    const [list] = parseMarkdown('- a\n  - b\n\n    c\n- d').children
    expect(list).toMatchObject({ tight: true })
    expect((list as { children: { children: unknown[] }[] }).children[0].children[1]).toMatchObject({ type: 'list', tight: false })
  })
  it('nested lists by indentation', () => expect(html('- a\n  - b\n    - c\n- d')).toBe('<ul>\n<li>a\n<ul>\n<li>b\n<ul>\n<li>c</li>\n</ul></li>\n</ul></li>\n<li>d</li>\n</ul>'))
  it('nested ordered inside bullet with mixed markers', () => expect(html('- a\n  1. b\n  2. c\n     * d')).toBe('<ul>\n<li>a\n<ol>\n<li>b</li>\n<li>c\n<ul>\n<li>d</li>\n</ul></li>\n</ol></li>\n</ul>'))
  it('item indentation follows the marker width', () => expect(html('1. a\n   - b\n2. c')).toBe('<ol>\n<li>a\n<ul>\n<li>b</li>\n</ul></li>\n<li>c</li>\n</ol>'))
  it('a sub-list needs enough indentation', () => expect(html('10. a\n   - b')).toBe('<ol start="10">\n<li>a</li>\n</ol>\n<ul>\n<li>b</li>\n</ul>'))
  it('one to three spaces before a marker are allowed', () => expect(html('- a\n - b\n  - c\n   - d')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n<li>d</li>\n</ul>'))
  it('four spaces make a lazy continuation, not an item', () => expect(html('- a\n - b\n  - c\n   - d\n    - e')).toContain('<li>d\n- e</li>'))
  it('lazy continuation of an item paragraph', () => expect(html('- a\nb\n- c')).toBe('<ul>\n<li>a\nb</li>\n<li>c</li>\n</ul>'))
  it('lazy continuation in a nested quote and list', () => expect(html('> - a\nb')).toBe('<blockquote>\n<ul>\n<li>a\nb</li>\n</ul>\n</blockquote>'))
  it('an empty item', () => expect(html('-\n- a')).toBe('<ul>\n<li></li>\n<li>a</li>\n</ul>'))
  it('an item that starts on the next line', () => expect(html('-\n  a')).toBe('<ul>\n<li>a</li>\n</ul>'))
  it('only one blank line may start an item', () => expect(html('-\n\n  a')).toBe('<ul>\n<li></li>\n</ul>\n<p>a</p>'))
  it('code in an item', () => expect(html('1.     code\n\n   para')).toBe('<ol>\n<li><pre><code>code</code></pre>\n<p>para</p></li>\n</ol>'))
  it('block quote in an item', () => expect(html('- > a\n  > b')).toBe('<ul>\n<li><blockquote>\n<p>a\nb</p>\n</blockquote></li>\n</ul>'))
  it('a heading in an item', () => expect(html('- # a\n  b')).toBe('<ul>\n<li><h1>a</h1>\nb</li>\n</ul>'))
  it('a thematic break wins over a bullet', () => expect(html('- a\n- - -\n- b')).toContain('<hr />'))
  it('an item can hold a fenced block that outlives a blank line', () => expect(html('- ```\n  a\n\n  b\n  ```')).toBe('<ul>\n<li><pre><code>a\n\nb</code></pre></li>\n</ul>'))
  it('tabs after the marker', () => expect(html('-\ta\n-\tb')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n</ul>'))
  it('mixed content keeps document order', () => expect(html('- a\n\n  > q\n\n- b')).toContain('<blockquote>'))
})

describe('task list items', () => {
  it('unchecked and checked', () => {
    const [list] = parseMarkdown('- [ ] a\n- [x] b\n- [X] c').children
    expect((list as { children: { checked: boolean | null }[] }).children.map((i) => i.checked)).toEqual([false, true, true])
  })
  it('the marker is removed from the text', () => expect(html('- [x] done')).toBe('<ul>\n<li><input checked="" disabled="" type="checkbox" /> done</li>\n</ul>'))
  it('needs whitespace after the box', () => expect(html('- [x]done\n- [y] a\n- [] b\n- [ ]c')).not.toContain('checkbox'))
  it('an empty task', () => expect(html('- [ ]')).toContain('checkbox'))
  it('works in ordered lists', () => expect(html('1. [x] a')).toContain('checked'))
  it('only at the start of an item', () => expect(html('- a [x] b')).not.toContain('checkbox'))
  it('a reference definition is not a task', () => expect(html('- [x]: /u\n\n[x]')).not.toContain('checkbox'))
  it('mixed tasks and plain items', () => {
    const [list] = parseMarkdown('- [ ] a\n- b').children
    expect((list as { children: { checked: boolean | null }[] }).children.map((i) => i.checked)).toEqual([false, null])
  })
})

describe('tabs, line endings and odd input', () => {
  it('CRLF, CR and LF are equivalent', () => {
    const a = html('# a\n\nb\nc\n\n- d')
    expect(html('# a\r\n\r\nb\r\nc\r\n\r\n- d')).toBe(a)
    expect(html('# a\r\rb\rc\r\r- d')).toBe(a)
  })
  it('a trailing newline is ignored', () => expect(html('a\n')).toBe(html('a')))
  it('NUL becomes the replacement character', () => expect(parseMarkdown('a\0b').children[0]).toMatchObject({ children: [{ value: 'a�b' }] }))
  it('a tab after a block quote marker', () => expect(html('>\t\tfoo')).toBe('<blockquote>\n<pre><code>  foo</code></pre>\n</blockquote>'))
  it('a tab inside a paragraph is kept', () => expect(html('a\tb')).toBe('<p>a\tb</p>'))
  it('unicode and RTL text pass through', () => {
    expect(html('# שלום\n\nمرحبا **عالم**')).toBe('<h1>שלום</h1>\n<p>مرحبا <strong>عالم</strong></p>')
  })
  it('astral characters and combining marks', () => {
    expect(html('😀 *á*')).toBe('<p>😀 <em>á</em></p>')
  })
  it('blank-only and very short inputs', () => {
    for (const s of ['\n', '\n\n\n', ' ', '>', '-', '1.', '#', '```', '|', '*', '[', '![', '<', '&']) expect(() => parseMarkdown(s)).not.toThrow()
  })
  it('non-string input is coerced', () => {
    expect(parseMarkdown(null).children).toEqual([])
    expect(parseMarkdown(undefined).children).toEqual([])
    expect(html(42 as unknown as string)).toBe('<p>42</p>')
  })
})
