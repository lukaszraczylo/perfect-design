import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'CodeBlock',
  group: 'data-display',
  subgroup: 'Code',
  summary: 'Monospace code panel with copy button, line numbers, titled header and terminal frames, filename header and tabs, diff marks and line highlighting.',
  description:
    'Use `CodeBlock` to show snippets, commands and config. It is plain monospace text: there is NO syntax highlighting and no dependency on a highlighter. Pass the source via `code` (preferred: exact whitespace) or as plain slot text (the Vue template compiler condenses whitespace in templates, so multi-line slot text loses indentation). Variations: `variant="default"` plain panel for docs; `variant="window"` plain panel that always shows the titled header bar; `variant="terminal"` the same header on an inverted console surface for shell sessions (neither draws window dots); `filename` shows the file name in the header (use it for config/source files); `tabs` (+ `v-model:activeTab`) shows several files in one block (install per package manager, multi-file examples); `diff` renders unified-diff lines (`+` added, `-` removed, `@@` hunk) with coloured backgrounds and a gutter marker; `highlight-lines` emphasises chosen lines (`[2, 4]` or `"1,3-5"`). All combine with `line-numbers`, `wrap`, `max-height`. Add `language` for the header label, `line-numbers` for a gutter, `wrap` to wrap long lines and `max-height` to cap tall blocks (the block scrolls). For a short inline value with a copy button use `DescriptionItem copyable`; for inline code in prose use the typography `Code` component.',
  status: 'stable',
  props: [
    { name: 'code', type: 'string', description: 'Source text. When omitted the default slot text is used.' },
    { name: 'language', type: 'string', description: 'Header label and `data-language`. No highlighting is applied.' },
    { name: 'variant', type: "'default' | 'window' | 'terminal' | 'plain' | 'flush'", default: "'default'", description: 'Frame: plain panel, `window` (always shows the titled header bar with the file name), `terminal` (the same header on an inverted console surface), `plain` (no frame or fill, for use inside another surface) or `flush` (full-bleed, top and bottom rules only). No variant draws window dots. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: `sm` 12px, `md` 14px, `lg` 16px. The line-number gutter, diff markers and header follow. Unknown values fall back to `md`.' },
    { name: 'filename', type: 'string', description: 'File name in the header, left-aligned. In `window`/`terminal` it replaces the language label; in `default` it is shown before the language label. Also the default accessible name of the code region.' },
    { name: 'tabs', type: 'CodeBlockTab[]', description: '`{ label: string; code: string; id?: string; language?: string }[]`. Renders a tablist and shows the active tab code; overrides `code`/slot. Invalid entries are ignored.' },
    { name: 'activeTab', type: 'string', description: '`v-model:activeTab`. Id (or label) of the active tab; defaults to the first tab. Unknown ids fall back to the first tab.' },
    { name: 'diff', type: 'boolean', default: 'false', description: 'Unified-diff styling: `+` lines green, `-` lines red (the marker char moves to an aria-hidden gutter and screen readers get "Added:/Removed:"), `@@` lines muted. Copy keeps the original text including `+`/`-`.' },
    { name: 'highlightLines', type: 'number[] | string', description: '1-based lines to emphasise: `[2, 4]` or `"1,3-5"`. Invalid tokens are ignored, ranges are clamped to the line count.' },
    { name: 'lineNumbers', type: 'boolean', default: 'false', description: 'Show a line-number gutter (excluded from copy and selection).' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines instead of scrolling horizontally.' },
    { name: 'maxHeight', type: 'string', description: 'CSS length (e.g. `16rem`). Content scrolls vertically beyond it.' },
    { name: 'copyable', type: 'boolean', default: 'true', description: 'Show the copy button.' },
    { name: 'label', type: 'string', description: 'Accessible name of the scrollable code region. Defaults to `filename`, else `"<language> code"`, else `"Code"`. Give blocks on one page distinct names so the regions are distinguishable.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Plain text source used when `code` is not set.' }],
  emits: [
    { name: 'copy', payload: '[text: string]', description: 'Emitted after the code was copied to the clipboard.' },
    { name: 'update:activeTab', payload: '[id: string]', description: 'The active tab changed (`v-model:activeTab`).' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<CodeBlock language="bash" label="Install command" code="pnpm add @perfect-design/ui" />`,
    },
    {
      title: 'Line numbers, wrapping and max height',
      script: `const snippet = Array.from({ length: 30 }, (_, i) => \`const value\${i} = compute(\${i})\`).join('\\n')`,
      code: `<CodeBlock language="ts" label="Generated constants" :code="snippet" line-numbers max-height="12rem" />
<CodeBlock class="mt-4" language="json" label="Wrapped JSON" wrap :copyable="false" code='{"name": "perfect-design", "description": "A very long description that wraps instead of scrolling sideways when wrap is enabled"}' />`,
      state: () => ({ snippet: Array.from({ length: 30 }, (_, i) => `const value${i} = compute(${i})`).join('\n') }),
    },
    {
      title: 'Window frame',
      description: '`variant="window"` always shows the header bar with the `filename` as its title. It is a plain bar, not a fake window.',
      code: `<CodeBlock variant="window" filename="deploy.sh" language="bash" code="git push origin main" />`,
    },
    {
      title: 'Frames: plain and flush',
      description: '`plain` drops the frame so the block can sit in a card; `flush` runs edge to edge with rules above and below (sample code).',
      code: `<div class="flex flex-col gap-4">
  <CodeBlock variant="plain" language="bash" code="pnpm install" label="Plain frame" />
  <CodeBlock variant="flush" language="bash" code="pnpm install" label="Flush frame" />
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size` sm, md and lg (sample code).',
      code: `<div class="flex flex-col gap-4">
  <CodeBlock size="sm" language="ts" code="const small = 1" label="Small" />
  <CodeBlock size="md" language="ts" code="const medium = 2" label="Medium" />
  <CodeBlock size="lg" language="ts" code="const large = 3" label="Large" />
</div>`,
    },
    {
      title: 'Terminal',
      description: '`variant="terminal"`: inverted console surface for shell sessions.',
      script: `const session = '$ pnpm install\\n$ pnpm build'`,
      code: `<CodeBlock variant="terminal" filename="zsh" line-numbers :code="session" />`,
      state: () => ({ session: '$ pnpm install\n$ pnpm build' }),
    },
    {
      title: 'Filename header',
      description: 'Default frame with the file name before the language label.',
      script: `const main = "import { createApp } from 'vue'\\ncreateApp(App).mount('#app')"`,
      code: `<CodeBlock filename="src/main.ts" language="ts" :code="main" />`,
      state: () => ({ main: "import { createApp } from 'vue'\ncreateApp(App).mount('#app')" }),
    },
    {
      title: 'Tabs',
      description: 'Several files in one block. `v-model:activeTab` is optional; arrow keys, Home and End move between tabs.',
      script: `const tabs = [
  { label: 'pnpm', id: 'pnpm', code: 'pnpm add @perfect-design/ui', language: 'bash' },
  { label: 'npm', id: 'npm', code: 'npm install @perfect-design/ui', language: 'bash' },
  { label: 'yarn', id: 'yarn', code: 'yarn add @perfect-design/ui', language: 'bash' },
]
const active = ref('pnpm')`,
      code: `<div class="flex flex-col gap-2">
  <CodeBlock :tabs="tabs" v-model:active-tab="active" />
  <p class="text-sm text-muted-foreground">Active: {{ active }}</p>
</div>`,
      state: () => {
        const tabs = [
          { label: 'pnpm', id: 'pnpm', code: 'pnpm add @perfect-design/ui', language: 'bash' },
          { label: 'npm', id: 'npm', code: 'npm install @perfect-design/ui', language: 'bash' },
          { label: 'yarn', id: 'yarn', code: 'yarn add @perfect-design/ui', language: 'bash' },
        ]
        return { tabs, active: ref('pnpm') }
      },
    },
    {
      title: 'Diff marks',
      description: '`diff` with line numbers: added and removed lines get a background and a gutter marker.',
      script: `const patch = '@@ -1,3 +1,3 @@\\n import { ref } from "vue"\\n-const count = ref(0)\\n+const count = ref(1)\\n console.log(count.value)'`,
      code: `<CodeBlock diff line-numbers language="diff" label="Sample patch" :code="patch" />`,
      state: () => ({ patch: '@@ -1,3 +1,3 @@\n import { ref } from "vue"\n-const count = ref(0)\n+const count = ref(1)\n console.log(count.value)' }),
    },
    {
      title: 'Line highlight',
      description: '`highlight-lines` accepts an array or a spec string such as `"1,3-4"`.',
      script: `const snippet = 'const a = 1\\nconst b = 2\\nconst c = a + b\\nconsole.log(c)'`,
      code: `<CodeBlock language="ts" label="Range highlight" line-numbers highlight-lines="2-3" :code="snippet" />
<CodeBlock class="mt-3" language="ts" label="Array highlight" :highlight-lines="[1, 4]" :code="snippet" />`,
      state: () => ({ snippet: 'const a = 1\nconst b = 2\nconst c = a + b\nconsole.log(c)' }),
    },
  ],
  a11y: [
    'The scrollable `pre` is focusable (`tabindex=0`, shared focus ring) and is a `role="region"` named by `label`, the file name or `"<language> code"`, so keyboard users can scroll it with the arrow keys. Give blocks on one page distinct names.',
    'Line numbers are `aria-hidden` and `select-none`, so they are neither read out nor copied.',
    'The copy button is named "Copy code" and keeps that name; the result ("Code copied" or "Copy failed") is announced by a sibling `role="status"` element. It is a 24px target.',
    'Tabs follow the ARIA tabs pattern: `tablist`/`tab`/`tabpanel`, roving tabindex, Arrow/Home/End keys; the panel is labelled by the active tab.',
    'Diff markers are `aria-hidden`; added/removed lines get an sr-only "Added:"/"Removed:" prefix and highlighted lines an sr-only "Highlighted:" prefix, so neither relies on colour. Highlight is a background tint, never an edge stripe.',
    '`plain` and `flush` change only the surface (`window` and `terminal` additionally force the header bar); `size` changes text size only, so the contrast pairs stay the same as the default. The `flush` rules and the focus ring stay visible in forced-colors mode.',
    'The header is plain text on a bar: no window dots. Header text is 12px at full contrast. Long lines scroll inside the region (or wrap with `wrap`), so the page never scrolls sideways.',
  ],
  related: ['DescriptionList', 'Card'],
  llmNotes: [
    'Pass code via the `code` prop (not slot) when it contains indentation or blank lines.',
    'Do not expect syntax highlighting; do not add a highlighter dependency.',
    'Use `max-height` for long listings instead of overflow classes on a wrapper.',
    'Content is rendered as text, never as HTML.',
    'Use `variant="window"|"terminal"` for showcase/shell snippets, `filename` for files, `tabs` for multi-file or per-package-manager snippets.',
    'Use `diff` only with unified-diff text (+/-/@@ prefixes); use `highlight-lines` to point at lines in normal code.',
    'Tabs: pass `code` inside each tab; give tabs stable `id`s when using `v-model:activeTab`.',
  ],
  replaces: ['hand-rolled CodeBlock markup in app code'],
}
export default doc
