import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Three backticks, kept out of the template literals below so the examples can contain code fences. */
const FENCE = '```'

/** Display-only `<script setup>` text for a document held as an array of lines. */
const quote = (line: string) => `'${line.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const asScript = (name: string, lines: string[]) => `const ${name} = [\n${lines.map((l) => `  ${quote(l)},`).join('\n')}\n].join('\\n')`

const readme = [
  '# Using the library in an app',
  '',
  'Perfect Design is a Vue 3 component library for Tailwind CSS v4. Its runtime dependencies are `reka-ui` and `tailwind-merge`.',
  '',
  '## Install the package',
  '',
  'Add the package, then load the theme in your main stylesheet:',
  '',
  `${FENCE}css`,
  '@import "tailwindcss";',
  '@import "@perfect-design/ui/theme.css";',
  '@source "../node_modules/@perfect-design/ui/src";',
  FENCE,
  '',
  'The `@source` line is required so Tailwind can see the component classes.',
  '',
  '## Everyday commands',
  '',
  '1. `pnpm test` runs the test suite',
  '2. `pnpm generate:llms` rebuilds `llms.txt` from the docs files',
  '3. `pnpm dev` starts the docs site',
  '',
  '> Use semantic tokens only. Never hard-code colours.',
  '',
  '---',
  '',
  'Rendering text for typography? See [Prose](/components/typography/prose) for styling HTML you already have.',
]

const tableDoc = [
  '# Sample data',
  '',
  'The table scrolls inside its own labelled region, aligns columns from the delimiter row and uses tabular figures for numbers.',
  '',
  '| Status | Items | Share |',
  '|:-------|------:|------:|',
  '| Done | 12 | 60% |',
  '| In progress | 5 | 25% |',
  '| Blocked | 3 | 15% |',
  '',
  '## Review checklist',
  '',
  '- [x] Read the design notes',
  '- [x] Run `pnpm test`',
  '- [ ] Check the page at 320px width',
  '- [ ] Check keyboard focus order',
]

const fences = [
  '# Highlighted fences',
  '',
  `${FENCE}yaml title="values.yaml"`,
  'name: sample-service',
  'replicas: 2',
  'env:',
  '  - LOG_LEVEL=info',
  FENCE,
  '',
  `${FENCE}go filename=main.go`,
  'package main',
  '',
  'import "fmt"',
  '',
  'func main() {',
  '\tfmt.Println("sample")',
  '}',
  FENCE,
  '',
  `${FENCE}json title="settings.json"`,
  '{',
  '  "name": "sample",',
  '  "enabled": true,',
  '  "ports": [8080, 8443]',
  '}',
  FENCE,
  '',
  `${FENCE}bash title="setup.sh"`,
  'pnpm install',
  'pnpm test',
  FENCE,
  '',
  'Languages without a tokenizer still get a labelled, focusable region with a copy button:',
  '',
  `${FENCE}ruby`,
  'puts "sample"',
  FENCE,
]

const outline = [
  '# Planning the migration',
  '',
  'Start with the pieces that have the most tests.',
  '',
  '## Steps',
  '',
  'Move one folder at a time.',
  '',
  '### Move the code',
  '',
  'Keep the old path working until the tests pass.',
  '',
  '### Update the docs',
  '',
  'Regenerate the docs files after each move.',
  '',
  '## Final checks',
  '',
  'Run the whole suite once more.',
]

const stream = [
  '# Streaming sample',
  '',
  'Text arrives in **small chunks**, like a model reply. An unfinished `code span`, a [link](/components/typography/markdown) or *emphasis* never shows raw syntax.',
  '',
  '| Chunk | State |',
  '|:------|------:|',
  '| first | shown |',
  '| second | shown |',
  '',
  `${FENCE}shell`,
  'pnpm test',
  FENCE,
  '',
  'The end.',
].join('\n')
const pieces = stream.match(/[\s\S]{1,14}/g) ?? []

const hostile = [
  '# What the renderer rejects',
  '',
  'Raw HTML is text: <script>alert(1)</script> and <img src=x onerror=alert(1)>.',
  '',
  '[A script link](javascript:alert(1)) keeps its label and loses the link.',
  '',
  '[An encoded script link](&#106;avascript:alert(1)) is rejected too.',
  '',
  '[A data link](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==) is rejected.',
  '',
  '![An SVG data image](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=) is replaced by its alt text.',
  '',
  '[A normal link](https://example.com) is kept and gets `rel="noopener noreferrer"`.',
].join('\n')

const SAMPLE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAoCAIAAADBrGu+AAAAPklEQVR42u3PMQ0AAAgDsPkXwMODVDRwkjSpgaZ6XouAgICAgICAgICAgICAgICAgICAgICAgICAgICAwMUCD0crDx7yeQ8AAAAASUVORK5CYII='

const links = [
  '# Link and image options',
  '',
  '[External link](https://example.com), [relative link](guide/start) and [anchor](#top).',
  '',
  '![Sample image](' + SAMPLE_PNG + ' "A generated sample image")',
].join('\n')

const doc: ComponentDoc = {
  name: 'Markdown',
  group: 'typography',
  subgroup: 'Prose',
  summary: 'Renders Markdown text (CommonMark plus GFM tables, task lists and strikethrough) as styled, accessible elements without v-html.',
  description:
    'Use `Markdown` for text you do not author element by element: README files, release notes, help text, user comments and LLM replies. The source is parsed by a small built-in parser into a tree and drawn with Vue render functions, so raw HTML in the source is shown as literal text and `v-html` is never involved. Use `Prose` when you already have trusted HTML to style, and `Heading`, `Text` and friends for hand-written pages.\n\nSupported: ATX and setext headings, paragraphs, block quotes, ordered and bullet lists (nested, start numbers, tight and loose), task items, fenced and indented code, thematic breaks, GFM tables with alignment, link reference definitions, hard and soft breaks, emphasis, strong, strikethrough (`~~`), inline code, inline and reference links, `<url>` autolinks, bare http and https URLs, images, backslash escapes and character references (numeric plus a small named set). Not supported: raw HTML (shown as text), footnotes, math, emoji shortcodes, single-tilde strikethrough, `www.` autolinks.\n\nSafety: link targets must be http, https, mailto, tel, a relative path or a `#fragment`; images may use http, https, relative paths and `data:image/png|jpeg|gif|webp` (never SVG). Anything else, including obfuscated `javascript:` variants, renders the label as plain text. `allowedProtocols` can only narrow the list. Input longer than `maxLength` renders as plain text and nesting beyond `maxDepth` stays literal.\n\nStreaming: set `streaming` while text is still arriving. The whole source is parsed again on every change (the parser is linear time, a 200 KB document takes a few milliseconds), and in the last block unfinished emphasis, code spans, links, images and table rows are closed or hidden instead of showing raw syntax. Turn it off when the text is complete.\n\nNo existing app component was verified as replaced.',
  status: 'stable',
  props: [
    { name: 'source', type: 'string', description: 'Markdown text. When omitted, the text of the default slot is used (the Vue compiler collapses whitespace in slot text, so use `source` for multi-line documents).' },
    { name: 'headingOffset', type: 'number', default: '0', description: 'Added to every heading level, clamped to 0..5 (integers; invalid values count as 0). `3` renders `#` as h4. Levels above 6 clamp at h6.' },
    { name: 'headingIds', type: 'boolean', default: 'true', description: 'Give headings stable, unique slug ids (`-1`, `-2` suffix on duplicates, `section` for empty headings).' },
    { name: 'headingAnchors', type: 'boolean', default: 'false', description: 'Add a keyboard-focusable link named "Link to this section" beside each heading. Needs `headingIds`.' },
    { name: 'idPrefix', type: 'string', default: "''", description: 'Prefix for heading ids (`doc` gives `doc-install`). Use it when several documents share one page.' },
    { name: 'linkTarget', type: "'_self' | '_blank'", description: 'Target for internal links. Only `_blank` sets the attribute.' },
    { name: 'externalTarget', type: "'_self' | '_blank'", description: 'Target for external (absolute http/https or protocol-relative) links. `_blank` adds `target`, `rel="noopener noreferrer"` and a screen-reader-only "(opens in a new tab)". External links always get `rel="noopener noreferrer"`.' },
    { name: 'baseUrl', type: 'string', description: 'Resolves relative link and image URLs. Fragments and absolute URLs are left alone. The result is checked again.' },
    { name: 'allowedProtocols', type: 'string[]', description: 'Narrows the allowed schemes (subset of `http`, `https`, `mailto`, `tel`; images also `data`). Names outside the built-in list are ignored. An empty array allows only relative URLs and fragments.' },
    { name: 'highlight', type: 'boolean', default: 'true', description: 'Use CodeViewer for fences tagged json, yaml/yml, go/golang, toml, shell/sh/bash/zsh or plain/text. Other languages, and everything when false, render a plain labelled region.' },
    { name: 'codeFold', type: 'boolean', default: 'false', description: 'Show line numbers and fold toggles in highlighted code.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Body text 14px, 16px or 18px; headings scale with it.' },
    { name: 'tone', type: "'default' | 'muted'", default: "'default'", description: '`muted` uses the muted foreground colour for body text.' },
    { name: 'inline', type: 'boolean', default: 'false', description: 'Parse and render only inline syntax inside a `span`: no paragraphs, headings or lists. For one-line UI strings.' },
    { name: 'streaming', type: 'boolean', default: 'false', description: 'The text is still arriving. Closes or hides unfinished syntax in the last block, hides a table header until its delimiter row exists, and sets `aria-busy`.' },
    { name: 'components', type: 'MarkdownComponents', description: 'Custom renderers by node type: `link` (props href, title, external, target, rel; label as default slot), `image` (src, alt, title) and `code` (code, language, info, filename, closed). Each is a component or an element name and only receives checked values.' },
    { name: 'maxDepth', type: 'number', default: '32', description: 'Maximum nesting of block quotes, lists and inline emphasis (clamped to 1..100). Deeper markers stay literal text.' },
    { name: 'maxLength', type: 'number', default: '1000000', description: 'Longer sources render as one unformatted plain-text paragraph.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge. The default measure is `max-w-prose`; override it with e.g. `max-w-none`.' },
  ],
  slots: [{ name: 'default', description: 'Markdown text used when `source` is not set. Only text nodes count; elements are ignored.' }],
  emits: [{ name: 'headings', payload: '[headings: { level: number; text: string; id: string }[]]', description: 'The heading outline when it first renders and whenever it changes (text, ids, or levels after `headingOffset`). Feed it to TableOfContents.' }],
  examples: [
    {
      title: 'README-style document',
      description: 'Headings start at h4 here (headingOffset 3) so the page keeps its own outline.',
      script: asScript('readme', readme),
      code: '<Markdown :source="readme" :heading-offset="3" />',
      state: () => ({ readme: readme.join('\n') }),
    },
    {
      title: 'Table and task list',
      description: 'Tables scroll inside a focusable region named after the nearest heading.',
      script: asScript('doc', tableDoc),
      code: '<Markdown :source="doc" :heading-offset="3" />',
      state: () => ({ doc: tableDoc.join('\n') }),
    },
    {
      title: 'Code fences',
      description: 'The info string picks the language; title= or filename= names the block.',
      script: asScript('doc', fences),
      code: '<Markdown :source="doc" :heading-offset="3" />',
      state: () => ({ doc: fences.join('\n') }),
    },
    {
      title: 'Heading anchors and table of contents',
      description: 'The headings event carries the outline; map it to TableOfContents items.',
      script: `${asScript('doc', outline)}
const items = ref([])
function onHeadings(list) {
  items.value = list.map((h) => ({ id: h.id, label: h.text, level: h.level }))
}`,
      code: `<div class="flex flex-col gap-6 md:flex-row">
  <TableOfContents v-if="items.length" :items="items" title="On this page" class="md:w-48 md:shrink-0" />
  <Markdown :source="doc" :heading-offset="3" heading-anchors class="min-w-0 flex-1" @headings="onHeadings" />
</div>
<p class="mt-4 text-sm text-muted-foreground">Outline entries received: {{ items.length }}</p>`,
      state: () => {
        const items = ref<{ id: string; label: string; level: number }[]>([])
        return {
          doc: outline.join('\n'),
          items,
          onHeadings: (list: { id: string; text: string; level: number }[]) => {
            items.value = list.map((h) => ({ id: h.id, label: h.text, level: h.level }))
          },
        }
      },
    },
    {
      title: 'Inline mode',
      description: 'Only inline syntax, inside a span: for one-line messages.',
      script: `const message = 'Could not read **app.yaml**: see [the code fences example](/components/typography/markdown) or run \`pnpm test\`.'`,
      code: '<p class="text-sm"><Markdown inline :source="message" /></p>',
      state: () => ({ message: 'Could not read **app.yaml**: see [the code fences example](/components/typography/markdown) or run `pnpm test`.' }),
    },
    {
      title: 'Streaming simulation',
      description: 'Each click adds a small chunk. Unfinished syntax in the last block is closed or hidden, never shown raw.',
      script: `const pieces = text.match(/[\\s\\S]{1,14}/g) ?? []
const shown = ref('')
const count = ref(0)
function next() {
  if (count.value < pieces.length) shown.value += pieces[count.value++]
}
function reset() {
  shown.value = ''
  count.value = 0
}`,
      code: `<div class="space-y-4">
  <div class="flex flex-wrap items-center gap-2">
    <Button size="sm" variant="outline" :disabled="count >= total" @click="next">Receive next chunk</Button>
    <Button size="sm" variant="ghost" :disabled="count === 0" @click="reset">Start over</Button>
    <span class="text-sm text-muted-foreground" role="status">Chunk {{ count }} of {{ total }}</span>
  </div>
  <Markdown :source="shown" :heading-offset="3" :streaming="count < total" />
</div>`,
      state: () => {
        const shown = ref('')
        const count = ref(0)
        return {
          shown,
          count,
          total: pieces.length,
          next: () => {
            if (count.value < pieces.length) shown.value += pieces[count.value++]
          },
          reset: () => {
            shown.value = ''
            count.value = 0
          },
        }
      },
    },
    {
      title: 'Untrusted input',
      description: 'Raw HTML and unsafe URLs are neutralised; labels and alt text stay readable.',
      script: asScript('hostile', hostile.split('\n')),
      code: '<Markdown :source="hostile" :heading-offset="3" />',
      state: () => ({ hostile }),
    },
    {
      title: 'Sizes and tone',
      description: 'Small and muted for help panels; large for article copy.',
      code: `<div class="space-y-6">
  <Markdown size="sm" tone="muted" source="Small and muted text with a [link](/components/typography/markdown) and **strong** words." />
  <Markdown size="lg" source="Large text, with **strong** words and *emphasis*." class="max-w-none" />
</div>`,
    },
    {
      title: 'Link and image options',
      description: 'External links open in a new tab and announce it; baseUrl resolves relative URLs; allowedProtocols narrows.',
      script: asScript('doc', links.split('\n')),
      code: '<Markdown :source="doc" :heading-offset="3" external-target="_blank" base-url="https://docs.example.com/v1/" :allowed-protocols="[\'https\']" />',
      state: () => ({ doc: links }),
    },
  ],
  a11y: [
    'Renders native elements only: h1 to h6, p, ul/ol/li, blockquote, table with th scope="col", figure/figcaption, hr, a, img, code and pre. No ARIA roles are added to prose.',
    'Headings keep their order; use headingOffset so the page has one h1. Heading ids are stable and unique, and headingAnchors adds a real link named "Link to this section" that is reached with Tab.',
    'Tables and code blocks that can overflow are scroll regions (role="region", tabindex="0") named by the nearest heading, the file name or the language, with a number added when a name repeats so landmark names stay unique. Scroll them with the arrow keys once focused.',
    'Task list items are disabled native checkboxes whose accessible name is the item text and whose state is the checked attribute. They are display only.',
    'Links are underlined, show a focus ring that survives forced-colors mode, and wrap long URLs. A link that opens a new tab says so to screen readers.',
    'Images always carry alt (empty only when the markdown alt is empty), load lazily and never exceed the container width. A sole image with a title becomes a figure with a caption.',
    'While streaming the root has aria-busy="true"; there is no live region, so screen readers read the finished text. Reflows at 320px: text wraps and only tables and code scroll, inside their own regions.',
  ],
  related: ['Prose', 'CodeViewer', 'CodeBlock', 'TableOfContents'],
  llmNotes: [
    'Render LLM-written or user-written Markdown with Markdown, never with v-html or a separate parser.',
    'Pass the text as `source`; slot text is whitespace-collapsed by the Vue compiler.',
    'Set headingOffset so the page keeps one h1: `:heading-offset="1"` makes # an h2.',
    'Set `streaming` while a reply is arriving and remove it when the reply is complete.',
    'Wire a table of contents with `@headings` and TableOfContents `items` (`{ id, label: text, level }`).',
    'Use `inline` for one-line UI strings; it never renders block elements.',
    'Do not widen `allowedProtocols`; it only narrows. Put custom link or image components in `components`, they receive already-checked URLs.',
    'Raw HTML, footnotes, math and emoji shortcodes are not supported; tell users to write plain Markdown.',
    'Give each document on a page distinct heading text or an idPrefix so ids and region names stay unique.',
  ],
  replaces: [],
}

export default doc
