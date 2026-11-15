import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './parse'
import { html } from './testing'

/** Inline syntax in one paragraph, without the wrapping `<p>`. */
const i = (src: string) => html(src).replace(/^<p>/, '').replace(/<\/p>$/, '')
const table = (rows: [string, string][]) => rows

describe('emphasis with asterisks', () => {
  it.each(
    table([
      ['*foo bar*', '<em>foo bar</em>'],
      ['a * foo bar*', 'a * foo bar*'],
      ['a*"foo"*', 'a*&quot;foo&quot;*'],
      ['foo*bar*', 'foo<em>bar</em>'],
      ['5*6*78', '5<em>6</em>78'],
      ['*foo*bar', '<em>foo</em>bar'],
      ['*foo bar *', '*foo bar *'],
      ['*(*foo)', '*(*foo)'],
      ['*(*foo*)*', '<em>(<em>foo</em>)</em>'],
      ['*foo\nbar*', '<em>foo\nbar</em>'],
      ['*foo *bar**', '<em>foo <em>bar</em></em>'],
      ['*foo**bar*', '<em>foo**bar</em>'],
      ['*foo**bar**baz*', '<em>foo<strong>bar</strong>baz</em>'],
      ['**foo bar**', '<strong>foo bar</strong>'],
      ['** foo bar**', '** foo bar**'],
      ['a**"foo"**', 'a**&quot;foo&quot;**'],
      ['foo**bar**', 'foo<strong>bar</strong>'],
      ['**foo bar **', '**foo bar **'],
      ['*(**foo**)*', '<em>(<strong>foo</strong>)</em>'],
      ['***foo** bar*', '<em><strong>foo</strong> bar</em>'],
      ['*foo **bar***', '<em>foo <strong>bar</strong></em>'],
      ['foo***bar***baz', 'foo<em><strong>bar</strong></em>baz'],
      ['*foo **bar *baz* bim** bop*', '<em>foo <strong>bar <em>baz</em> bim</strong> bop</em>'],
      ['a **', 'a **'],
      ['a **** b', 'a **** b'],
      ['a *', 'a *'],
      ['**foo [bar](/url)**', '<strong>foo <a href="/url">bar</a></strong>'],
      ['*foo `code` bar*', '<em>foo <code>code</code> bar</em>'],
      ['**a** **b**', '<strong>a</strong> <strong>b</strong>'],
      ['2 * 3 * 4', '2 * 3 * 4'],
      ['**bold**text', '<strong>bold</strong>text'],
      ['**bold.**text', '**bold.**text'],
      ['**bold.** text', '<strong>bold.</strong> text'],
      ['(**bold**)', '(<strong>bold</strong>)'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
})

describe('emphasis with underscores (intraword rules)', () => {
  it.each(
    table([
      ['_foo bar_', '<em>foo bar</em>'],
      ['_ foo bar_', '_ foo bar_'],
      ['a_"foo"_', 'a_&quot;foo&quot;_'],
      ['foo_bar_', 'foo_bar_'],
      ['5_6_78', '5_6_78'],
      ['aa_"bb"_cc', 'aa_&quot;bb&quot;_cc'],
      ['foo-_(bar)_', 'foo-<em>(bar)</em>'],
      ['_foo*', '_foo*'],
      ['_foo bar _', '_foo bar _'],
      ['_(_foo)', '_(_foo)'],
      ['_(_foo_)_', '<em>(<em>foo</em>)</em>'],
      ['_foo_bar', '_foo_bar'],
      ['_foo_bar_baz_', '<em>foo_bar_baz</em>'],
      ['_(bar)_.', '<em>(bar)</em>.'],
      ['__foo bar__', '<strong>foo bar</strong>'],
      ['__ foo bar__', '__ foo bar__'],
      ['foo__bar__', 'foo__bar__'],
      ['5__6__78', '5__6__78'],
      ['__foo, __bar__, baz__', '<strong>foo, <strong>bar</strong>, baz</strong>'],
      ['foo-__(bar)__', 'foo-<strong>(bar)</strong>'],
      ['__foo_ bar_', '<em><em>foo</em> bar</em>'],
      ['snake_case_word', 'snake_case_word'],
      ['some_snake_case and __init__.py', 'some_snake_case and <strong>init</strong>.py'],
      ['my_var_name_', 'my_var_name_'],
      ['_a_ and _b_', '<em>a</em> and <em>b</em>'],
      ['\u043f\u0440\u0438\u0441\u0442\u0430\u043d\u044f\u043c_\u0441\u0442\u0440\u0435\u043c\u044f\u0442\u0441\u044f_', '\u043f\u0440\u0438\u0441\u0442\u0430\u043d\u044f\u043c_\u0441\u0442\u0440\u0435\u043c\u044f\u0442\u0441\u044f_'],
      ['_\u043f\u0440\u0438\u0441\u0442\u0430\u043d\u044f\u043c_\u0441\u0442\u0440\u0435\u043c\u044f\u0442\u0441\u044f', '_\u043f\u0440\u0438\u0441\u0442\u0430\u043d\u044f\u043c_\u0441\u0442\u0440\u0435\u043c\u044f\u0442\u0441\u044f'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
})

describe('strikethrough', () => {
  it.each(
    table([
      ['~~Hi~~ Hello', '<del>Hi</del> Hello'],
      ['a ~~b *c*~~ d', 'a <del>b <em>c</em></del> d'],
      ['~one~ tilde', '~one~ tilde'],
      ['a ~~~three~~~', 'a ~~~three~~~'],
      ['~/.bashrc and ~5', '~/.bashrc and ~5'],
      ['~~ spaced ~~', '~~ spaced ~~'],
      ['~~unclosed', '~~unclosed'],
      ['**~~both~~**', '<strong><del>both</del></strong>'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
})

describe('code spans', () => {
  it.each(
    table([
      ['`foo`', '<code>foo</code>'],
      ['`` foo ` bar ``', '<code>foo ` bar</code>'],
      ['` `` `', '<code>``</code>'],
      ['`  ``  `', '<code> `` </code>'],
      ['` a`', '<code> a</code>'],
      ['`   `', '<code>   </code>'],
      ['`foo   bar \nbaz`', '<code>foo   bar  baz</code>'],
      ['`foo\\`bar`', '<code>foo\\</code>bar`'],
      ['``foo`bar``', '<code>foo`bar</code>'],
      ['*foo`*`', '*foo<code>*</code>'],
      ['[not a `link](/foo`)', '[not a <code>link](/foo</code>)'],
      ['`<a href="`">`', '<code>&lt;a href=&quot;</code>&quot;&gt;`'],
      ['```foo``', '```foo``'],
      ['`foo', '`foo'],
      ['`<b>x</b>`', '<code>&lt;b&gt;x&lt;/b&gt;</code>'],
      ['`a` `b` `c`', '<code>a</code> <code>b</code> <code>c</code>'],
      ['``', '``'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
})

describe('backslash escapes and hard breaks', () => {
  it('every ASCII punctuation character can be escaped', () => {
    const punct = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    const src = punct
      .split('')
      .map((c) => `\\${c}`)
      .join('')
    const node = parseMarkdown(src).children[0]
    expect(node).toMatchObject({ children: [{ type: 'text', value: punct }] })
  })
  it('other backslashes stay', () => expect(i('\\A\\a\\3\\ \\\u03c6')).toBe('\\A\\a\\3\\ \\\u03c6'))
  it('escaped delimiters are not emphasis', () => expect(i('\\*not emphasis*')).toBe('*not emphasis*'))
  it('escaped brackets are not links', () => expect(i('\\[a](/u)')).toBe('[a](/u)'))
  it('escaped backtick is not a code span', () => expect(i('\\`a`')).toBe('`a`'))
  it('backslash does nothing inside code', () => expect(i('`\\*`')).toBe('<code>\\*</code>'))
  it('a backslash before a newline is a hard break', () => expect(i('a\\\nb')).toBe('a<br />\nb'))
  it('two or more trailing spaces are a hard break', () => expect(i('a   \nb')).toBe('a<br />\nb'))
  it('spaces at the start of the next line are dropped', () => expect(i('a\n    b')).toBe('a\nb'))
  it('a hard break inside emphasis', () => expect(i('*a  \nb*')).toBe('<em>a<br />\nb</em>'))
})

describe('entities', () => {
  it.each(
    table([
      ['&amp; &lt; &gt; &quot; &apos;', '&amp; &lt; &gt; &quot; \''],
      ['&nbsp;&copy;&trade;&hellip;&times;', '\u00a0\u00a9\u2122\u2026\u00d7'],
      ['&#35; &#1234; &#992;', '# \u04d2 \u03e0'],
      ['&#0;', '\ufffd'],
      ['&#xD800;', '\ufffd'],
      ['&#x110000;', '\ufffd'],
      ['&#x1F600;', '\ud83d\ude00'],
      ['&#X22; &#XD06; &#xcab;', '&quot; \u0d06 \u0cab'],
      ['&#x27;', "'"],
      ['&nbsp &x; &#; &#x; &#87654321; &#abcdef0; &ThisIsNotDefined; &hi?;', '&amp;nbsp &amp;x; &amp;#; &amp;#x; &amp;#87654321; &amp;#abcdef0; &amp;ThisIsNotDefined; &amp;hi?;'],
      ['&AElig;', '&amp;AElig;'],
      ['&lt;script&gt;alert(1)&lt;/script&gt;', '&lt;script&gt;alert(1)&lt;/script&gt;'],
      ['a & b && c', 'a &amp; b &amp;&amp; c'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out.replace(/&quot;/g, '&quot;')))
  it('entities cannot make markup', () => expect(i('&#42;not em&#42;')).toBe('*not em*'))
  it('entities are not decoded inside code', () => expect(i('`&amp;`')).toBe('<code>&amp;amp;</code>'))
  it('decoded text is still escaped on output', () => expect(i('&#60;b&#62;')).toBe('&lt;b&gt;'))
})

describe('inline links', () => {
  it.each(
    table([
      ['[link](/uri "title")', '<a href="/uri" title="title">link</a>'],
      ['[link](/uri)', '<a href="/uri">link</a>'],
      ['[link]()', '<a href="">link</a>'],
      ['[link](<>)', '<a href="">link</a>'],
      ['[link](/my uri)', '[link](/my uri)'],
      ['[link](</my uri>)', '<a href="/my uri">link</a>'],
      ['[a](<b)c>)', '<a href="b)c">a</a>'],
      ['[link](foo(and(bar)))', '<a href="foo(and(bar))">link</a>'],
      ['[link](foo\\(and\\(bar\\))', '<a href="foo(and(bar)">link</a>'],
      ['[link](#fragment)', '<a href="#fragment">link</a>'],
      ['[link](foo\\bar)', '<a href="foo\\bar">link</a>'],
      ['[link](foo%20b&amp;)', '<a href="foo%20b&amp;">link</a>'],
      ['[link]("title")', '<a href="&quot;title&quot;">link</a>'],
      ['[link](/url "title "and" title")', '[link](/url &quot;title &quot;and&quot; title&quot;)'],
      ['[link](/url \'title "and" title\')', '<a href="/url" title="title &quot;and&quot; title">link</a>'],
      ['[link](/url (title))', '<a href="/url" title="title">link</a>'],
      ['[link](   /uri\n  "title"  )', '<a href="/uri" title="title">link</a>'],
      ['[link] (/uri)', '[link] (/uri)'],
      ['[link [foo [bar]]](/uri)', '<a href="/uri">link [foo [bar]]</a>'],
      ['[link] bar](/uri)', '[link] bar](/uri)'],
      ['[link [bar](/uri)', '[link <a href="/uri">bar</a>'],
      ['[link \\[bar](/uri)', '<a href="/uri">link [bar</a>'],
      ['[link *foo **bar** `#`*](/uri)', '<a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a>'],
      ['[![moon](moon.jpg)](/uri)', '<a href="/uri"><img src="moon.jpg" alt="moon" /></a>'],
      ['[foo [bar](/uri)](/uri)', '[foo <a href="/uri">bar</a>](/uri)'],
      ['*[foo*](/uri)', '*<a href="/uri">foo*</a>'],
      ['[foo *bar](baz*)', '<a href="baz*">foo *bar</a>'],
      ['*foo [bar* baz]', '<em>foo [bar</em> baz]'],
      ['[foo<http://example.com/?search=](uri)>', '[foo<a href="http://example.com/?search=](uri)">http://example.com/?search=](uri)</a>'],
      ['[a](/u)[b](/v)', '<a href="/u">a</a><a href="/v">b</a>'],
      ['[](/u)', '<a href="/u"></a>'],
      ['[x](<a\nb>)', '[x](&lt;a\nb&gt;)'],
      ['[x](a\\)b)', '<a href="a)b">x</a>'],
      ['[x](/u "t\\"q")', '<a href="/u" title="t&quot;q">x</a>'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
})

describe('reference links', () => {
  const doc = (body: string, defs: string) => i(`${body}\n\n${defs}`).split('\n\n')[0]
  it.each(
    table([
      ['[foo][bar]', '[bar]: /url "title"'],
      ['[foo][BaR]', '[bar]: /url "title"'],
      ['[foo][]', '[foo]: /url "title"'],
      ['[foo]', '[foo]: /url "title"'],
      ['[Foo]', '[foo]: /url "title"'],
      ['[ Foo\n  bar ]', '[foo bar]: /url "title"'],
    ]),
  )('%j resolves', (body, defs) => expect(doc(body, defs)).toContain('<a href="/url" title="title">'))
  it('unknown references stay text', () => expect(i('[foo][nope]')).toBe('[foo][nope]'))
  it('case folding is Unicode aware', () => expect(i('[\u0422\u043e\u043b\u043f\u043e\u0439]\n\n[\u0442\u043e\u043b\u043f\u043e\u0439]: /url')).toContain('<a href="/url">'))
  it('definitions may come after use', () => expect(html('[a]\n\n[a]: /u')).toBe('<p><a href="/u">a</a></p>'))
  it('first definition wins', () => expect(html('[a]\n\n[a]: /one\n[a]: /two')).toBe('<p><a href="/one">a</a></p>'))
  it('definition titles can span lines', () => expect(html('[a]: /u "one\ntwo"\n\n[a]')).toBe('<p><a href="/u" title="one\ntwo">a</a></p>'))
  it('definition with an angle destination and single-quote title', () => expect(html('[a]: <b c> \'t\'\n\n[a]')).toBe('<p><a href="b c" title="t">a</a></p>'))
  it('definition destination on the next line', () => expect(html('[a]:\n  /u\n\n[a]')).toBe('<p><a href="/u">a</a></p>'))
  it('definitions leave no output', () => expect(html('[a]: /u\n[b]: /v')).toBe(''))
  it('a definition with trailing junk is a paragraph', () => expect(html('[a]: /u junk')).toBe('<p>[a]: /u junk</p>'))
  it('a title with trailing junk is dropped when the destination ends the line', () => expect(html('[a]: /u\n"t" x\n\n[a]')).toContain('<p>&quot;t&quot; x</p>'))
  it('definitions cannot interrupt a paragraph', () => expect(html('x\n[a]: /u')).toBe('<p>x\n[a]: /u</p>'))
  it('definitions work inside block quotes and list items', () => {
    expect(html('> [a]: /u\n\n[a]')).toContain('<a href="/u">a</a>')
    expect(html('- [a]: /u\n\n[a]')).toContain('<a href="/u">a</a>')
  })
  it('an empty label is not a definition', () => expect(html('[]: /u')).toBe('<p>[]: /u</p>'))
  it('a label with a bracket is not a definition', () => expect(html('[a[b]: /u')).toBe('<p>[a[b]: /u</p>'))
  it('a label longer than 999 characters is not a link', () => expect(i(`[${'a'.repeat(1000)}]\n\n[${'a'.repeat(1000)}]: /u`)).not.toContain('<a'))
  it('definition with a missing destination', () => expect(html('[a]:\n\n[a]')).toBe('<p>[a]:</p>\n<p>[a]</p>'))
  it('a full reference without a match does not fall back to the shortcut', () => expect(html('[a][b]\n\n[a]: /u')).toBe('<p>[a][b]</p>'))
  it('links are not nested through references', () => expect(html('[a [b]](/x)\n\n[b]: /y')).toContain('<a href="/y">b</a>'))
})

describe('images', () => {
  it.each(
    table([
      ['![foo](/url "title")', '<img src="/url" alt="foo" title="title" />'],
      ['![foo *bar*](/url)', '<img src="/url" alt="foo bar" />'],
      ['![foo ![bar](/url)](/url2)', '<img src="/url2" alt="foo bar" />'],
      ['![foo [bar](/url)](/url2)', '<img src="/url2" alt="foo bar" />'],
      ['![](/url)', '<img src="/url" alt="" />'],
      ['![a `b` c](/u)', '<img src="/u" alt="a b c" />'],
      ['!\\[a](/u)', '![a](/u)'],
      ['! [a](/u)', '! <a href="/u">a</a>'],
      ['!not an image', '!not an image'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
  it('reference images', () => expect(html('![foo]\n\n[foo]: /u "t"')).toBe('<p><img src="/u" alt="foo" title="t" /></p>'))
  it('alt text keeps no markup', () => expect(i('![<b>x</b>](/u)')).toBe('<img src="/u" alt="&lt;b&gt;x&lt;/b&gt;" />'))
  it('an image can hold a hard break in its alt', () => expect(i('![a\nb](/u)')).toBe('<img src="/u" alt="a b" />'))
})

describe('autolinks', () => {
  it.each(
    table([
      ['<http://foo.bar.baz>', '<a href="http://foo.bar.baz">http://foo.bar.baz</a>'],
      ['<https://foo.bar.baz/test?q=hello&id=22&boolean>', '<a href="https://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean">https://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean</a>'],
      ['<foo@bar.example.com>', '<a href="mailto:foo@bar.example.com">foo@bar.example.com</a>'],
      ['<mailto:a@b.c>', '<a href="mailto:a@b.c">mailto:a@b.c</a>'],
      ['<http://foo.bar/baz bim>', '&lt;http://foo.bar/baz bim&gt;'],
      ['<m:abc>', '&lt;m:abc&gt;'],
      ['<ab:cd>', '<a href="ab:cd">ab:cd</a>'],
      ['<foo.bar.baz>', '&lt;foo.bar.baz&gt;'],
      ['<>', '&lt;&gt;'],
      ['< http://x.y>', '&lt; <a href="http://x.y">http://x.y</a>&gt;'],
      ['<javascript:alert(1)>', '<a href="javascript:alert(1)">javascript:alert(1)</a>'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
  it('marks angle autolinks', () => expect(parseMarkdown('<http://x.y>').children[0]).toMatchObject({ children: [{ type: 'link', autolink: true }] }))
})

describe('bare URL autolinks', () => {
  it.each(
    table([
      ['see https://example.com now', 'see <a href="https://example.com">https://example.com</a> now'],
      ['http://example.com/a?b=1&c=2', '<a href="http://example.com/a?b=1&amp;c=2">http://example.com/a?b=1&amp;c=2</a>'],
      ['(https://example.com/x)', '(<a href="https://example.com/x">https://example.com/x</a>)'],
      ['https://example.com/a_(b)', '<a href="https://example.com/a_(b)">https://example.com/a_(b)</a>'],
      ['https://example.com.', '<a href="https://example.com">https://example.com</a>.'],
      ['https://example.com/path, then', '<a href="https://example.com/path">https://example.com/path</a>, then'],
      ['https://example.com/?x=1!', '<a href="https://example.com/?x=1">https://example.com/?x=1</a>!'],
      ['https://example.com/a:', '<a href="https://example.com/a">https://example.com/a</a>:'],
      ['https://example.com/q&nope;', '<a href="https://example.com/q">https://example.com/q</a>&amp;nope;'],
      ['https://example.com/q&amp;', '<a href="https://example.com/q&amp;">https://example.com/q&amp;</a>'],
      ['HTTPS://EXAMPLE.COM', '<a href="HTTPS://EXAMPLE.COM">HTTPS://EXAMPLE.COM</a>'],
      ['**https://example.com**', '<strong><a href="https://example.com">https://example.com</a></strong>'],
      ['xhttps://example.com', 'xhttps://example.com'],
      ['https://', 'https://'],
      ['http:// nothing', 'http:// nothing'],
      ['ftp://example.com', 'ftp://example.com'],
      ['www.example.com', 'www.example.com'],
      ['a https://one.example b https://two.example', 'a <a href="https://one.example">https://one.example</a> b <a href="https://two.example">https://two.example</a>'],
      ['[https://example.com](https://example.com)', '<a href="https://example.com">https://example.com</a>'],
      ['[see https://x.y](https://z.w)', '<a href="https://z.w">see https://x.y</a>'],
      ['`https://example.com`', '<code>https://example.com</code>'],
      ['https://x.y/a\nhttps://x.y/b', '<a href="https://x.y/a">https://x.y/a</a>\n<a href="https://x.y/b">https://x.y/b</a>'],
      ['javascript://example.com/%0aalert(1)', 'javascript://example.com/%0aalert(1)'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
  it('marks bare URLs as autolinks', () => expect(parseMarkdown('https://x.y').children[0]).toMatchObject({ children: [{ type: 'link', autolink: true, url: 'https://x.y' }] }))
})

describe('raw HTML is never interpreted', () => {
  it.each(
    table([
      ['<b>bold</b>', '&lt;b&gt;bold&lt;/b&gt;'],
      ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
      ['<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
      ['<!-- comment -->', '&lt;!-- comment --&gt;'],
      ['a <span class="x">b</span>', 'a &lt;span class=&quot;x&quot;&gt;b&lt;/span&gt;'],
      ['<a href="javascript:alert(1)">x</a>', '&lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;'],
    ]),
  )('%j', (src, out) => expect(i(src)).toBe(out))
  it('block-level HTML is a paragraph of text', () => expect(html('<div>\n*a*\n</div>')).toBe('<p>&lt;div&gt;\n<em>a</em>\n&lt;/div&gt;</p>'))
  it('an HTML block keeps markdown working inside', () => expect(html('<details>\n\n# h\n\n</details>')).toBe('<p>&lt;details&gt;</p>\n<h1>h</h1>\n<p>&lt;/details&gt;</p>'))
})

describe('nesting limits', () => {
  it('deeply nested emphasis degrades to text beyond maxDepth', () => {
    const depth = 40
    const src = '*a '.repeat(depth) + 'x' + ' a*'.repeat(depth)
    const out = i(src)
    expect(out.match(/<em>/g)!.length).toBeLessThanOrEqual(32)
    expect(out).toContain('x')
  })
  it('maxDepth option applies to inline nesting', () => {
    const out = html('*a *b *c c* b* a*', { maxDepth: 2 })
    expect((out.match(/<em>/g) ?? []).length).toBeLessThanOrEqual(2)
  })
  it('nested images stop at the cap', () => {
    const src = '![a '.repeat(50) + 'x' + '](u)'.repeat(50)
    expect(() => parseMarkdown(src)).not.toThrow()
  })
  it('nested links in images and emphasis stay within the cap', () => {
    const src = '*[a '.repeat(40) + 'x' + '](u)*'.repeat(40)
    expect(() => parseMarkdown(src, { maxDepth: 4 })).not.toThrow()
  })
  it('block quotes beyond maxDepth become text', () => {
    const out = html('>'.repeat(10) + ' x', { maxDepth: 3 })
    expect((out.match(/<blockquote>/g) ?? []).length).toBe(3)
    expect(out).toContain('x')
  })
  it('nested lists beyond maxDepth become text', () => {
    const src = Array.from({ length: 10 }, (_, k) => `${'  '.repeat(k)}- item ${k}`).join('\n')
    const out = html(src, { maxDepth: 4 })
    expect((out.match(/<ul>/g) ?? []).length).toBe(4)
    expect(out).toContain('item 9')
  })
  it('a quote inside deeply nested lists respects the cap', () => {
    const src = '- a\n  '.repeat(1) + '- b\n    '.repeat(1) + '> > > > x'
    expect(() => html(src, { maxDepth: 2 })).not.toThrow()
  })
  it('maxDepth is clamped', () => {
    expect(() => parseMarkdown('> a', { maxDepth: 0 })).not.toThrow()
    expect(() => parseMarkdown('> a', { maxDepth: 1e9 })).not.toThrow()
    expect(() => parseMarkdown('> a', { maxDepth: Number.NaN })).not.toThrow()
  })
})
