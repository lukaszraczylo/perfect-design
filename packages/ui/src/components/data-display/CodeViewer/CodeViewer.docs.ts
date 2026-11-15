import type { ComponentDoc } from '../../../docs-types'

/** Display-only `<script setup>` line for a string constant (escapes backticks, backslashes and `${`). */
const show = (name: string, text: string) => `const ${name} = \`${text.replace(/[`\\]|\$\{/g, (m) => `\\${m}`)}\``

const json = `{
  "name": "sample-service",
  "version": "1.4.0",
  "private": true,
  "scripts": {
    "build": "vite build",
    "test": "vitest run"
  },
  "files": ["dist", "README.md"],
  "engines": { "node": ">=20" }
}`

const toml = `# Sample application settings
title = "Sample service"

[server]
host = "0.0.0.0"
port = 8080
timeouts = { read = "5s", write = "10s" }

[database]
url = "postgres://app@db:5432/app"
pool_size = 10

[[upstream]]
name = "primary"
weight = 3

[[upstream]]
name = "fallback"
weight = 1`

const shell = `#!/usr/bin/env bash
set -euo pipefail

IMAGE="registry.example.com/sample/web:\${TAG:-latest}"

build() {
  docker build --pull -t "$IMAGE" .
}

if [ "$#" -eq 0 ]; then
  echo "usage: deploy.sh <env>" >&2
  exit 2
fi

for env in "$@"; do
  kubectl --namespace "$env" apply -f deploy.yaml # sample manifest
done`

const doc: ComponentDoc = {
  name: 'CodeViewer',
  group: 'data-display',
  subgroup: 'Code',
  summary: 'Read-only code viewer with built-in tokenizers for JSON, YAML, Go, TOML and shell, foldable regions, line numbers, line highlighting and a copy button.',
  description:
    'Use `CodeViewer` to display code or config that people read, scan and copy: config files, API payloads, scripts. It is the engine behind `YamlViewer` and `GoViewer`. Highlighting is done by small pure-TypeScript tokenizers (no highlighter dependency) and uses only semantic tokens: keywords and keys `text-primary`, strings `text-success`, numbers and types `text-info`, comments `text-muted-foreground`, functions and constants `text-foreground font-medium`.\n\n' +
    'Folding regions are computed per language: indentation for YAML, tables and brackets for TOML, brackets for JSON and Go (functions, structs, `import (...)`, `const (...)`, switch blocks), brackets plus `if/fi`, `do/done`, `case/esac` for shell, and multi-line block comments. Folded lines are not rendered at all, so folding a large file is cheap; sources above 400 visible lines also use `content-visibility: auto` per row.\n\n' +
    'Use `CodeBlock` instead for short snippets in prose (tabs, diff marks, terminal frame, no folding), `JsonViewer` to explore a live JS value as a tree, and `YamlViewer` / `GoViewer` when you want to pass a JS value rather than text. This is not an editor: there is no cursor, selection model or editing.\n\n' +
    'Parts (all carry `data-slot`): `code-viewer`, `code-viewer-header`, `code-viewer-title`, `code-viewer-scroll`, `code-viewer-code`, `code-viewer-line`, `code-viewer-gutter`, `code-viewer-fold-cell`, `code-viewer-fold`, `code-viewer-line-number`, `code-viewer-text`, `code-viewer-token`, `code-viewer-placeholder`, plus the shared `copy-button` and `copy-button-status`. Exposed methods: `expandAll()` and `collapseAll()`.',
  status: 'stable',
  props: [
    { name: 'source', type: 'string', default: "''", description: 'The text to show; required, but an empty string is valid. LF, CRLF and lone CR line endings are accepted; one trailing newline is ignored. The copy button copies this exact string.' },
    { name: 'language', type: "'json' | 'yaml' | 'go' | 'toml' | 'shell' | 'plain'", default: "'plain'", description: 'Tokenizer and folding rules. Unknown values render as `plain` (no colours, no folds).' },
    { name: 'filename', type: 'string', description: 'Shown in the header and used as the accessible name of the code region. Set `filename` or `label`: one of them is required, so viewers on one page have distinct names.' },
    { name: 'lineNumbers', type: 'boolean', default: 'true', description: 'Show a line-number gutter. It is `aria-hidden`, not selectable and uses `tabular-nums`, so copying selects clean code.' },
    { name: 'foldable', type: 'boolean', default: 'true', description: 'Show fold toggles for the regions the language defines.' },
    { name: 'defaultFoldDepth', type: 'number', description: 'Regions nested this deep (0 = outermost) or deeper start folded. Unset starts fully expanded. Changing `source` or `language` resets the folds.' },
    { name: 'highlightLines', type: 'number[] | string', description: 'Lines to mark, by displayed number: `[2, 5]` or `"3-5,9"`. Reversed ranges are swapped, ranges are clamped to the visible lines and invalid parts are ignored. Marked lines get a bar on the start edge, a tint and visually hidden text "Highlighted line".' },
    { name: 'startLine', type: 'number', default: '1', description: 'Number shown for the first line, for excerpts. Fold names and `highlightLines` use the displayed numbers. Values below 1 or non-numbers fall back to 1.' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines (`whitespace-pre-wrap`) instead of scrolling sideways.' },
    { name: 'maxHeight', type: 'string', description: 'CSS length such as `20rem`. The code scrolls vertically beyond it.' },
    { name: 'copy', type: 'boolean', default: 'true', description: 'Show the copy button with a status live region.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: 12px, 14px or 16px. Rows stay at least 24px tall (28px for `lg`) so fold toggles keep a 24px target. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'bordered' | 'plain' | 'flush'", default: "'bordered'", description: '`bordered` is a bordered card surface; `plain` has no frame so the viewer can sit inside another surface; `flush` is full-bleed with top and bottom rules only. Unknown values fall back to `bordered`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the code region. Required unless `filename` is set; give viewers on the same page distinct names.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [
    { name: 'copy', payload: '[text: string]', description: 'The source was copied to the clipboard.' },
    { name: 'fold', payload: '[event: { start: number; end: number; collapsed: boolean }]', description: 'A region was folded or unfolded. `start` and `end` are the displayed line numbers of the region.' },
  ],
  examples: [
    {
      title: 'JSON with folding',
      description: 'Objects and arrays fold; the closing bracket stays visible. Brackets inside strings never create folds.',
      script: show('json', json),
      code: `<CodeViewer :source="json" language="json" filename="package.json" />`,
      state: () => ({ json }),
    },
    {
      title: 'TOML, folded by default',
      description: '`default-fold-depth="0"` starts with every region folded. Each folded region shows a "… N lines" button.',
      script: show('toml', toml),
      code: `<CodeViewer :source="toml" language="toml" filename="config.toml" :default-fold-depth="0" />`,
      state: () => ({ toml }),
    },
    {
      title: 'Shell script with highlighted lines',
      description: 'Highlighted lines carry a bar, a tint and hidden text, so the mark is not colour only.',
      script: show('shell', shell),
      code: `<CodeViewer :source="shell" language="shell" filename="deploy.sh" highlight-lines="3,12-13" />`,
      state: () => ({ shell }),
    },
    {
      title: 'Excerpt with a start line and no folding',
      description: '`start-line` numbers an excerpt from its position in the original file.',
      script: show('excerpt', 'port = 8080\ntimeouts = { read = "5s", write = "10s" }'),
      code: `<CodeViewer :source="excerpt" language="toml" :start-line="5" :foldable="false" highlight-lines="6" label="Excerpt of config.toml" />`,
      state: () => ({ excerpt: 'port = 8080\ntimeouts = { read = "5s", write = "10s" }' }),
    },
    {
      title: 'Wrapped, plain variant, no copy button',
      description: '`wrap` keeps long lines inside the viewer; `variant="plain"` drops the frame for use inside another card.',
      script: show('long', 'description = "A long single line of sample text that wraps inside the viewer instead of scrolling sideways when wrap is turned on."'),
      code: `<CodeViewer :source="long" language="toml" wrap variant="plain" :copy="false" :line-numbers="false" label="Wrapped line" />`,
      state: () => ({ long: 'description = "A long single line of sample text that wraps inside the viewer instead of scrolling sideways when wrap is turned on."' }),
    },
    {
      title: 'Variants and sizes',
      description: 'Gallery: `variant` bordered, plain and flush, then `size` sm, md and lg (sample data).',
      script: show('line', 'port = 8080'),
      code: `<div class="flex flex-col gap-4">
  <CodeViewer :source="line" language="toml" variant="bordered" label="Bordered variant" />
  <CodeViewer :source="line" language="toml" variant="plain" label="Plain variant" />
  <CodeViewer :source="line" language="toml" variant="flush" label="Flush variant" />
  <CodeViewer :source="line" language="toml" size="sm" label="Small size" />
  <CodeViewer :source="line" language="toml" size="md" label="Medium size" />
  <CodeViewer :source="line" language="toml" size="lg" label="Large size" />
</div>`,
      state: () => ({ line: 'port = 8080' }),
    },
    {
      title: 'Unknown language',
      description: 'A language the viewer does not know renders as plain text, with line numbers and copy still working.',
      code: `<CodeViewer source="fn main() {}" language="rust" filename="main.rs" />`,
    },
  ],
  a11y: [
    'The code is a scroll region: `role="region"`, `tabindex="0"` and an `aria-label` from `label`, else `filename`, else "<Language> source". Keyboard users reach it with Tab and scroll with the arrow keys, Home, End, Page Up and Page Down; it reflows at 320px with scrolling only inside the region.',
    'Fold toggles are real `<button>` elements with `aria-expanded`, `aria-controls` (the code list) and a name such as "Fold lines 3 to 9". Tab to reach them, Enter or Space to toggle. Targets are 24px, 44px on coarse pointers.',
    'A folded region shows a "… N lines" button (plain text, with an accessible name such as "6 lines hidden. Unfold lines 3 to 9"). Activating it unfolds and returns focus to the fold toggle.',
    'Line numbers are `aria-hidden` and `user-select: none`, so selecting and copying yields clean code. The copy button has a fixed name ("Copy code") and a sibling `role="status"` announces "Code copied" or "Copy failed".',
    '`size` changes text size only; rows keep a 24px minimum height so fold toggles stay 24px targets (44px on coarse pointers). `flush` keeps its top and bottom rules in forced-colors mode.',
    'Highlighted lines use a start-edge bar and visually hidden "Highlighted line" text in addition to the tint. Borders are kept for forced-colors mode; fold buttons keep a transparent border that becomes visible there. No animation is used, so reduced motion needs no special handling.',
  ],
  related: ['JsonViewer', 'CodeBlock', 'YamlViewer', 'GoViewer'],
  requires: [
    'Throws a ContractError when neither `filename` nor `label` is set, so the code region has a distinct name.',
    'Throws a ContractError when `source` is not passed as a string. An empty string is valid content.',
  ],
  llmNotes: [
    'Use CodeViewer for read-only display of JSON, YAML, Go, TOML or shell text with folding and highlighting. It is not an editor.',
    'Use CodeBlock for short snippets inside prose, tabs, diffs and terminal sessions; use JsonViewer to explore a JS value as a tree.',
    'Pass the exact text in `source` (a prop, not slot text) so whitespace survives. For a JS value use YamlViewer or GoViewer.',
    'Always set `filename` or `label` so the scroll region has a distinct accessible name when a page shows several viewers.',
    'Do not hard-code colours around it: token colours come from semantic tokens. Override layout with `class` only.',
    'Use `default-fold-depth` to open long files collapsed; use `start-line` for excerpts and `highlight-lines` with displayed numbers.',
    'Unknown `language` falls back to plain text. Tokenizers are line oriented and approximate: they do not validate the syntax.',
  ],
  replaces: [],
}

export default doc
