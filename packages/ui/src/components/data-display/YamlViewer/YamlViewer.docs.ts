import type { ComponentDoc } from '../../../docs-types'

/** Display-only `<script setup>` line for a string constant (escapes backticks, backslashes and `${`). */
const show = (name: string, text: string) => `const ${name} = \`${text.replace(/[`\\]|\$\{/g, (m) => `\\${m}`)}\``

const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-web
  labels:
    app: sample-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sample-web
  template:
    metadata:
      labels:
        app: sample-web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
          env:
            - name: LOG_LEVEL
              value: "info"
          resources:
            limits:
              cpu: 500m
              memory: 128Mi`

const compose = `name: sample-stack
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
    depends_on:
      - api
    environment:
      API_URL: http://api:3000
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgres://app@db:5432/app
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
  db:
    image: postgres:16
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data: {}`

const multi = `# Two documents in one stream
---
defaults: &defaults
  restart: unless-stopped
  logging:
    driver: json-file
services:
  web:
    <<: *defaults
    image: nginx:1.27
    command: ["nginx", "-g", "daemon off;"]
  worker:
    <<: *defaults
    image: !!str 3.12
    description: >-
      Processes queued jobs.
      Folded into a single line.
    script: |
      set -e
      echo "starting"
---
# Second document
kind: ConfigMap
data:
  motd: |+
    Welcome

...`

const release = {
  name: 'sample-web',
  replicas: 2,
  enabled: true,
  ratio: 0.5,
  tags: ['web', 'sample'],
  version: '1.10',
  answer: 'yes',
  limits: { cpu: '500m', memory: '128Mi' },
  notes: 'First line\nSecond line\n',
  empty: {},
  missing: null,
}

const doc: ComponentDoc = {
  name: 'YamlViewer',
  group: 'data-display',
  subgroup: 'Code',
  summary: 'Read-only YAML viewer: show raw YAML text or serialise a JS value to YAML, with highlighting, indentation folds, line numbers and copy.',
  description:
    'Use `YamlViewer` to display YAML that people read and copy: Kubernetes manifests, compose files, CI configs, or a JS value shown as YAML. Pass `source` for raw text (it wins) or `value` for a JS value that is serialised by the built-in `yamlStringify`. It is a `CodeViewer` with the YAML tokenizer, so every `CodeViewer` prop works except `language`.\n\n' +
    'Highlighted: keys, scalars, numbers, `true`/`false`/`null`/`~`, comments, anchors `&a` and aliases `*a`, merge keys `<<`, tags `!!str`, block scalars `|` and `>` with chomping and indentation indicators, flow collections `[a, b]` and `{k: v}`, quoted strings with escapes (also across lines), multi-document streams (`---`, `...`) and `%YAML` directives. Folding is by indentation, so every mapping or sequence item with children folds, and each document is folded separately.\n\n' +
    'Serialising a `value`: block style, two or four spaces (`indent`), key order as in the object, strings quoted only when plain text would change meaning (`yes`, `null`, `12`, `a: b`, a leading `-` or `#`), multi-line strings as `|` blocks with the right chomping indicator, empty containers as `{}` and `[]`, `NaN` as `.nan`, infinities as `.inf`, dates as ISO 8601, `undefined`, functions and symbols skipped in maps and written as `null` in lists. Circular values do not throw in the component: it shows a `# Cannot render this value as YAML: ...` comment line. Calling `yamlStringify` directly throws a `TypeError` that names the path of the cycle.\n\n' +
    'This is a viewer, not an editor, and it does not parse YAML: highlighting is line oriented and does not validate. Use `JsonViewer` to explore a live value as a tree and `CodeViewer` for other languages.',
  status: 'stable',
  props: [
    { name: 'source', type: 'string', description: 'Raw YAML text. Takes precedence over `value`, including when it is an empty string.' },
    { name: 'value', type: 'unknown', description: 'Any JS value, serialised to YAML. Replace it (do not mutate) to update the view. Ignored when `source` is a string. With neither prop the view shows `null`.' },
    { name: 'indent', type: '2 | 4', default: '2', description: 'Spaces per nesting level when serialising `value`. Other values fall back to 2.' },
    { name: 'filename', type: 'string', description: 'Header title and accessible name of the code region. Set `filename` or `label`: one of them is required.' },
    { name: 'lineNumbers', type: 'boolean', default: 'true', description: 'Show a non-selectable, `aria-hidden` line-number gutter.' },
    { name: 'foldable', type: 'boolean', default: 'true', description: 'Show fold toggles for indented regions.' },
    { name: 'defaultFoldDepth', type: 'number', description: 'Regions nested this deep (0 = outermost) or deeper start folded. Unset starts expanded.' },
    { name: 'highlightLines', type: 'number[] | string', description: 'Displayed line numbers to mark: `[2, 5]` or `"3-5,9"`. Invalid parts are ignored; ranges are clamped.' },
    { name: 'startLine', type: 'number', default: '1', description: 'Number shown for the first line.' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines instead of scrolling sideways.' },
    { name: 'maxHeight', type: 'string', description: 'CSS length such as `24rem`; the code scrolls vertically beyond it.' },
    { name: 'copy', type: 'boolean', default: 'true', description: 'Show the copy button. It copies the full text, including folded lines.' },
    { name: 'variant', type: "'bordered' | 'plain' | 'flush'", default: "'bordered'", description: 'Framed card surface, no frame (`plain`) or full-bleed with top and bottom rules (`flush`). Unknown values fall back to `bordered`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: 12px, 14px or 16px. Rows keep a 24px minimum so fold toggles stay 24px targets. Unknown values fall back to `md`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the code region. Required unless `filename` is set.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [
    { name: 'copy', payload: '[text: string]', description: 'The YAML text was copied to the clipboard.' },
    { name: 'fold', payload: '[event: { start: number; end: number; collapsed: boolean }]', description: 'A region was folded or unfolded, with displayed line numbers.' },
  ],
  examples: [
    {
      title: 'Kubernetes Deployment',
      description: 'Raw YAML with a filename, one highlighted line and indentation folds on every nested block.',
      script: show('deployment', deployment),
      code: `<YamlViewer :source="deployment" filename="deployment.yaml" highlight-lines="19" />`,
      state: () => ({ deployment }),
    },
    {
      title: 'Compose file, folded by default',
      description: 'Everything nested one level or deeper starts folded, so the file opens as an outline. Each "… N lines" button unfolds one region.',
      script: show('compose', compose),
      code: `<YamlViewer :source="compose" filename="compose.yaml" :default-fold-depth="1" />`,
      state: () => ({ compose }),
    },
    {
      title: 'Multi-document stream with anchors',
      description: 'Anchors, aliases, merge keys, a `!!str` tag, folded and literal block scalars with chomping indicators, and two documents separated by `---`.',
      script: show('multi', multi),
      code: `<YamlViewer :source="multi" filename="stack.yaml" />`,
      state: () => ({ multi }),
    },
    {
      title: 'A JS value shown as YAML',
      description: 'Strings that would change meaning (`yes`, `1.10`) are quoted, the multi-line string becomes a `|` block, empty containers stay inline.',
      script: `const release = ${JSON.stringify(release, null, 2)}`,
      code: `<YamlViewer :value="release" filename="release.yaml" />`,
      state: () => ({ release }),
    },
    {
      title: 'Four-space indent, plain variant, wrapped',
      description: '`indent="4"` changes the serialised value only. `variant="plain"` has no frame and `wrap` keeps long lines inside the viewer.',
      script: `const limits = { limits: { cpu: '500m', memory: '128Mi' }, note: 'A long sample value that wraps inside the viewer instead of scrolling sideways when wrap is on.' }`,
      code: `<YamlViewer :value="limits" :indent="4" variant="plain" wrap :line-numbers="false" label="Limits as YAML" />`,
      state: () => ({ limits: { limits: { cpu: '500m', memory: '128Mi' }, note: 'A long sample value that wraps inside the viewer instead of scrolling sideways when wrap is on.' } }),
    },
    {
      title: 'Excerpt without folds or copy',
      description: '`start-line` numbers an excerpt from its position in the file.',
      script: show('excerpt', 'replicas: 2\nstrategy:\n  type: RollingUpdate'),
      code: `<YamlViewer :source="excerpt" :start-line="8" :foldable="false" :copy="false" label="Excerpt of deployment.yaml" />`,
      state: () => ({ excerpt: 'replicas: 2\nstrategy:\n  type: RollingUpdate' }),
    },
    {
      title: 'Variants and sizes',
      description: 'Gallery: `variant` bordered, plain and flush, then `size` sm, md and lg (sample data).',
      script: `const line = 'replicas: 2'`,
      code: `<div class="flex flex-col gap-4">
  <YamlViewer :source="line" variant="bordered" label="Bordered variant" />
  <YamlViewer :source="line" variant="plain" label="Plain variant" />
  <YamlViewer :source="line" variant="flush" label="Flush variant" />
  <YamlViewer :source="line" size="sm" label="Small size" />
  <YamlViewer :source="line" size="md" label="Medium size" />
  <YamlViewer :source="line" size="lg" label="Large size" />
</div>`,
      state: () => ({ line: 'replicas: 2' }),
    },
  ],
  a11y: [
    'The YAML is a scroll region: `role="region"`, `tabindex="0"`, labelled by `label`, else `filename`, else "YAML source". Tab reaches it; arrow keys, Home, End, Page Up and Page Down scroll it. At 320px width only the region scrolls, never the page.',
    'Fold toggles are `<button>` elements with `aria-expanded`, `aria-controls` and names like "Fold lines 7 to 28". Tab to focus, Enter or Space to toggle. A folded region shows a "… N lines" button that unfolds it and returns focus to the toggle.',
    'Line numbers are `aria-hidden` and `user-select: none`, so selection and copy give clean YAML. Copy has a constant name ("Copy code") and a `role="status"` region announces the result.',
    'Highlighted lines have a start-edge bar and hidden "Highlighted line" text as well as a tint. Targets are at least 24px (44px on coarse pointers); borders keep controls visible in forced-colors mode; nothing animates.',
  ],
  related: ['JsonViewer', 'CodeBlock', 'CodeViewer', 'GoViewer'],
  requires: [
    'Throws a ContractError when neither `filename` nor `label` is set.',
    'Throws a ContractError when neither `source` (a string, empty is fine) nor `value` is passed. `value` may be any value, including `null`.',
  ],
  llmNotes: [
    'Use YamlViewer for read-only YAML display, not an editor. It does not parse or validate YAML.',
    'Pass raw text in `source` to show a real file exactly as written; pass `value` to show a JS value as YAML. `source` wins when both are set.',
    'Set `filename` (or `label`) so the scroll region has a distinct accessible name.',
    'Use `default-fold-depth` to open large manifests as an outline; use `highlight-lines` with displayed line numbers.',
    'Circular values render a `# Cannot render ...` comment instead of throwing; `yamlStringify` itself throws a TypeError.',
    'Use JsonViewer to explore a live JS value as a tree, CodeBlock for short snippets in prose.',
  ],
  replaces: [],
}

export default doc
