import { describe, expect, it } from 'vitest'
import { isExternalUrl, resolveUrl, sanitizeUrl, SAFE_IMAGE_PROTOCOLS, SAFE_LINK_PROTOCOLS } from './url'

const link = (u: string, allowedProtocols?: string[]) => sanitizeUrl(u, { allowedProtocols })
const image = (u: string, allowedProtocols?: string[]) => sanitizeUrl(u, { image: true, allowedProtocols })

describe('sanitizeUrl: links', () => {
  it.each([
    'http://example.com',
    'https://example.com/a?b=1&c=2#d',
    'HTTPS://EXAMPLE.COM',
    'mailto:me@example.com',
    'MAILTO:me@example.com',
    'tel:+15551234',
    '/absolute/path',
    'relative/path.md',
    './here',
    '../up',
    '#fragment',
    '?query=1',
    '//cdn.example.com/x',
    'page.html#top',
    'a:b/../c'.replace('a:b', 'dir/a-b'),
    'https://example.com/?next=javascript:alert(1)',
    'https://example.com/a%20b',
    'https://example.com/path#javascript:x',
    '/path/with:colon',
    'foo?x=javascript:1',
    '#javascript:alert(1)',
  ])('allows %j', (url) => expect(link(url)).not.toBeNull())

  it('returns the URL with control characters removed and trimmed', () => {
    expect(link('  https://example.com/a  ')).toBe('https://example.com/a')
    expect(link('https://exa\tmple.com/\n')).toBe('https://example.com/')
  })

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  JaVaScRiPt:alert(1)',
    '\tjavascript:alert(1)',
    '\njavascript:alert(1)',
    '\u0001javascript:alert(1)',
    '\u0000javascript:alert(1)',
    '\u001fjavascript:alert(1)',
    ' javascript:alert(1)',
    ' javascript:alert(1)',
    '﻿javascript:alert(1)',
    '​javascript:alert(1)',
    '　javascript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    'java\tscript:alert(1)',
    'java script:alert(1)',
    'jav\u0000ascript:alert(1)',
    'j‍a​vascript:alert(1)',
    'javascript\n:alert(1)',
    'javascript :alert(1)',
    '&#106;avascript:alert(1)',
    '&#x6A;avascript:alert(1)',
    '&#X6a;avascript:alert(1)',
    '&#0000106avascript:alert(1)'.replace('&#0000106a', '&#0000106;a'),
    'java&#115;cript:alert(1)',
    'javascript&colon;alert(1)',
    'javascript&#58;alert(1)',
    'javascript&#x3A;alert(1)',
    '&#106&#97&#118&#97&#115&#99&#114&#105&#112&#116&#58alert(1)',
    '%6Aavascript:alert(1)',
    '%6a%61%76%61script:alert(1)',
    'javascript%3Aalert(1)',
    '%2526%2523106;avascript:alert(1)',
    '%26%23106%3Bavascript:alert(1)',
    'vbscript:msgbox(1)',
    'VBScript:msgbox(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'data:text/html,<script>alert(1)</script>',
    'data:image/png;base64,AAAA',
    'file:///etc/passwd',
    'FILE:///etc/passwd',
    'blob:https://example.com/uuid',
    'ftp://example.com/file',
    'ws://example.com',
    'chrome://settings',
    'about:blank',
    'view-source:https://example.com',
    'jar:https://example.com!/x',
    'livescript:alert(1)',
    'mocha:alert(1)',
    'x:alert(1)',
    'localhost:3000/path',
    'javascript:/*http://example.com*/alert(1)',
    'javascript://%0aalert(1)',
    'javascript://example.com/%0aalert(1)',
    '\\u006aavascript:alert(1)'.replace('\\u006a', String.fromCharCode(0x6a)),
    '',
    '   ',
    '\n\t',
    '\u0000',
  ])('rejects %j', (url) => expect(link(url)).toBeNull())

  it('rejects nested encodings that never settle', () => {
    let s = 'javascript:alert(1)'
    for (let n = 0; n < 6; n += 1) s = s.replace(/[:%]/g, (c) => (c === ':' ? '%3A' : '%25'))
    expect(link(s)).toBeNull()
  })
  it('rejects non-string input', () => {
    for (const v of [null, undefined, 1, {}, [], true]) expect(sanitizeUrl(v)).toBeNull()
  })
  it('does not trust a safe scheme that appears later', () => {
    expect(link('javascript:alert(1)//https://example.com')).toBeNull()
  })
  it('a huge run of whitespace before a scheme does not hide it', () => {
    expect(link(`${' '.repeat(100_000)}javascript:alert(1)`)).toBeNull()
    expect(link(`${'\t'.repeat(50_000)}https://example.com`)).not.toBeNull()
  })
  it('a very long relative URL is fine', () => expect(link('a/'.repeat(50_000))).not.toBeNull())
})

describe('sanitizeUrl: images', () => {
  it.each([
    'http://example.com/a.png',
    'https://example.com/a.png',
    '/img/a.png',
    'a.png',
    '../a.png',
    '//cdn.example.com/a.png',
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/jpeg;base64,/9j/4AAQ',
    'data:image/gif;base64,R0lGODlh',
    'data:image/webp;base64,UklGRg==',
    'DATA:IMAGE/PNG;BASE64,AAAA',
    'data:image/png,%89PNG',
    'data:image/png;charset=utf-8;base64,AAAA',
  ])('allows %j', (url) => expect(image(url)).not.toBeNull())

  it.each([
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'data:image/svg;base64,AAAA',
    'data:text/html;base64,PHNjcmlwdD4=',
    'data:application/javascript,alert(1)',
    'data:image/png',
    'data:image/pngx;base64,AAAA',
    'data:image/png;base64',
    'data:,hello',
    'data:image/x-icon;base64,AAAA',
    'data:image/bmp;base64,AAAA',
    'javascript:alert(1)',
    'mailto:me@example.com',
    'tel:+1555',
    'file:///x.png',
    'blob:https://example.com/x',
    '&#100;ata:text/html,x',
    'd\nata:text/html,x',
    '%64ata:text/html,x',
    '',
  ])('rejects %j', (url) => expect(image(url)).toBeNull())
})

describe('sanitizeUrl: allowedProtocols only narrows', () => {
  it('limits links to the listed schemes', () => {
    expect(link('https://example.com', ['https'])).not.toBeNull()
    expect(link('http://example.com', ['https'])).toBeNull()
    expect(link('mailto:a@b.c', ['https'])).toBeNull()
  })
  it('is case insensitive and accepts a trailing colon', () => expect(link('mailto:a@b.c', ['MAILTO:'])).not.toBeNull())
  it('never widens beyond the safe list', () => {
    for (const bad of ['javascript', 'vbscript', 'data', 'file', 'ftp', 'blob', 'javascript:', 'JAVASCRIPT']) {
      expect(link('javascript:alert(1)', [bad])).toBeNull()
      expect(link('file:///x', [bad])).toBeNull()
      expect(link('ftp://x', [bad])).toBeNull()
      expect(link('data:text/html,x', [bad])).toBeNull()
    }
  })
  it('an empty list keeps only relative URLs', () => {
    expect(link('https://example.com', [])).toBeNull()
    expect(link('/path', [])).toBe('/path')
    expect(link('#x', [])).toBe('#x')
  })
  it('images: data needs to be listed to stay allowed', () => {
    expect(image('data:image/png;base64,AAAA', ['https'])).toBeNull()
    expect(image('data:image/png;base64,AAAA', ['data'])).not.toBeNull()
    expect(image('data:image/svg+xml,x', ['data'])).toBeNull()
    expect(image('https://x.y/a.png', ['https'])).not.toBeNull()
    expect(image('http://x.y/a.png', ['https'])).toBeNull()
  })
  it('images never gain mailto or tel through the list', () => expect(image('mailto:a@b.c', ['mailto'])).toBeNull())
  it('a non-array value is ignored', () => expect(sanitizeUrl('https://a.b', { allowedProtocols: 'javascript' as unknown as string[] })).not.toBeNull())
  it('lists the built-in schemes', () => {
    expect([...SAFE_LINK_PROTOCOLS]).toEqual(['http', 'https', 'mailto', 'tel'])
    expect([...SAFE_IMAGE_PROTOCOLS]).toEqual(['http', 'https', 'data'])
  })
})

describe('isExternalUrl', () => {
  it.each(['http://a.b', 'https://a.b/x', 'HTTPS://A.B', '//a.b/x', '\\\\a.b', '/\\a.b'.replace('/\\', '\\/')])('%j is external', (u) => expect(isExternalUrl(u)).toBe(true))
  it.each(['/x', 'x', '#a', '?q', 'mailto:a@b.c', 'tel:1', './x', ''])('%j is not external', (u) => expect(isExternalUrl(u)).toBe(false))
  it('sees through obfuscation', () => expect(isExternalUrl('ht\ntps://a.b')).toBe(true))
})

describe('resolveUrl', () => {
  it('resolves relative paths against an absolute base', () => {
    expect(resolveUrl('a/b.png', 'https://example.com/docs/')).toBe('https://example.com/docs/a/b.png')
    expect(resolveUrl('/x', 'https://example.com/docs/')).toBe('https://example.com/x')
    expect(resolveUrl('../x', 'https://example.com/docs/guide/')).toBe('https://example.com/docs/x')
  })
  it('leaves fragments, queries, absolute and protocol-relative URLs alone', () => {
    for (const u of ['#a', '?q=1', 'https://other.example/x', 'mailto:a@b.c', '//cdn.example/x', 'javascript:alert(1)']) expect(resolveUrl(u, 'https://example.com/')).toBe(u)
  })
  it('without a base returns the input', () => {
    expect(resolveUrl('a/b', undefined)).toBe('a/b')
    expect(resolveUrl('a/b', '')).toBe('a/b')
    expect(resolveUrl('', 'https://example.com/')).toBe('')
  })
  it('joins by hand when the base is not absolute', () => {
    expect(resolveUrl('a.png', '/docs/')).toBe('/docs/a.png')
    expect(resolveUrl('./a.png', '/docs/index.html')).toBe('/docs/a.png')
    expect(resolveUrl('/a.png', '/docs/')).toBe('/a.png')
  })
  it('a hostile base cannot smuggle a scheme past sanitizeUrl', () => {
    const resolved = resolveUrl('x', 'javascript:alert(1)//')
    expect(sanitizeUrl(resolved)).toBeNull()
  })
})
