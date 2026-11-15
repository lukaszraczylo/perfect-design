import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'InstallTabs',
  group: 'marketing',
  subgroup: 'Content',
  summary: 'Tabbed install/code snippets with a copy button.',
  description:
    'Use for package-manager install commands or short multi-variant snippets (npm / pnpm / yarn, curl / brew). Standalone WAI-ARIA tabs with automatic activation (selection follows focus) and a clipboard copy button that copies the active snippet. The snippet is a focusable, scrollable region, so long commands stay reachable by keyboard at 320px. For long code or syntax highlighting use a dedicated code block; for general tabs use the navigation Tabs.',
  status: 'stable',
  props: [
    { name: 'tabs', type: 'InstallTab[]', default: '[]', description: '`{ label, code, language? }`.' },
    { name: 'variant', type: "'default' | 'minimal' | 'contained'", default: "'default'", description: 'Look. `default` bordered card with a muted header; `minimal` no frame, underlined tabs; `contained` muted tray with pill tabs and a raised code panel. Unknown values fall back to `default`. Reflected as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text and padding scale of tabs, copy button and code. Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'modelValue', type: 'number', description: 'v-model: selected tab index (clamped). Uncontrolled when omitted.' },
    { name: 'copyLabel', type: 'string', default: "'Copy'", description: 'Copy button text.' },
    { name: 'copiedLabel', type: 'string', default: "'Copied'", description: 'Text after copying; also announced via a status region.' },
    { name: 'copyErrorLabel', type: 'string', default: "'Copy failed'", description: 'Text shown and announced when the clipboard write fails (also emits `copy-error`).' },
    { name: 'label', type: 'string', default: "'Install commands'", description: 'Accessible name of the tablist.' },
    { name: 'resetAfter', type: 'number', default: '2000', description: 'Milliseconds before the copied / failed message resets.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[index: number]', description: 'Selected tab changed.' },
    { name: 'copy', payload: '[text: string]', description: 'Snippet copied to the clipboard.' },
    { name: 'copy-error', payload: '[error: unknown]', description: 'Clipboard unavailable or write rejected. The button and a live region also say "Copy failed".' },
  ],
  examples: [
    {
      title: 'Basic: package managers',
      code: `<InstallTabs :tabs="tabs" />`,
      script: `const tabs = [{ label: 'pnpm', code: 'pnpm add @perfect-design/ui' }, ...]`,
      state: () => ({
        tabs: [
          { label: 'pnpm', code: 'pnpm add @perfect-design/ui', language: 'bash' },
          { label: 'npm', code: 'npm install @perfect-design/ui', language: 'bash' },
          { label: 'yarn', code: 'yarn add @perfect-design/ui', language: 'bash' },
        ],
      }),
    },
    {
      title: 'Realistic: controlled with localised labels',
      code: `<InstallTabs v-model="active" label="Installationsbefehle" copy-label="Kopieren" copied-label="Kopiert" copy-error-label="Kopieren fehlgeschlagen" :tabs="tabs" />
<p class="mt-2 text-sm text-muted-foreground">Selected: {{ tabs[active].label }}</p>`,
      script: `const active = ref(1)`,
      state: () => ({
        active: ref(1),
        tabs: [
          { label: 'npm', code: 'npm install @perfect-design/ui' },
          { label: 'pnpm', code: 'pnpm add @perfect-design/ui' },
        ],
      }),
    },
    {
      title: 'Minimal variant',
      description: 'No frame: sits flush in prose or a hero; the active tab gets an underline.',
      code: `<InstallTabs variant="minimal" :tabs="tabs" />`,
      state: () => ({ tabs: [{ label: 'pnpm', code: 'pnpm add @perfect-design/ui' }, { label: 'npm', code: 'npm install @perfect-design/ui' }] }),
    },
    {
      title: 'Contained variant',
      description: 'A muted tray with pill tabs and a raised code panel; stands out on tinted backgrounds.',
      code: `<InstallTabs variant="contained" :tabs="tabs" />`,
      state: () => ({ tabs: [{ label: 'pnpm', code: 'pnpm add @perfect-design/ui' }, { label: 'yarn', code: 'yarn add @perfect-design/ui' }] }),
    },
    {
      title: 'Small size',
      description: 'Compact for sidebars and cards.',
      code: `<InstallTabs size="sm" :tabs="tabs" />`,
      state: () => ({ tabs: [{ label: 'npm', code: 'npm install @perfect-design/ui' }, { label: 'yarn', code: 'yarn add @perfect-design/ui' }] }),
    },
    {
      title: 'Large size, contained',
      description: 'Hero-scale install command.',
      code: `<InstallTabs size="lg" variant="contained" :tabs="tabs" />`,
      state: () => ({ tabs: [{ label: 'npm', code: 'npm install @perfect-design/ui' }, { label: 'pnpm', code: 'pnpm add @perfect-design/ui' }] }),
    },
  ],
  requires: [
    'Throws a ContractError when `tabs` is empty.',
    'Throws a ContractError when a tab has an empty `label` or `code` (the first one is named by index).',
    'Throws a ContractError when `label` (the name of the tab list) is empty.',
  ],
  a11y: [
    'role=tablist/tab/tabpanel. The tablist has an accessible name (`label`), the selected tab has aria-selected="true" and a roving tabindex (only it is in the Tab order), and the panel is named by its tab with aria-labelledby. There is no aria-controls, because the inactive panels are not rendered.',
    'Keyboard: ArrowRight / ArrowLeft move to the next / previous tab and wrap (the arrows swap in a right-to-left page), Home and End jump to the first and last tab, selection follows focus, and Tab moves on to the panel and then the copy button.',
    'The panel is `tabindex="0"` and scrolls horizontally (`overflow-x-auto`), so long commands are reachable by keyboard; its focus outline is drawn inset (2px, `outline-solid`, using the shared `insetFocus` helper) so the frame never clips it.',
    'The copy button is a real button with the visible name "Copy" (WCAG 2.5.3: the visible text is the name). Its result, "Copied" or "Copy failed", replaces the button text and is announced through a persistent `role="status"` region outside the button.',
    'Tabs and the copy button are at least 24px tall and 44px on coarse pointers. In forced-colors mode the active tab is underlined because backgrounds and rings are overridden.',
  ],
  related: ['CopyField', 'Tabs'],
  llmNotes: ['Choose `variant`: default inside content sections, minimal inside docs prose or a hero, contained over images or tinted backgrounds. Use `size="lg"` for hero commands and `sm` for sidebars.', 'Keep snippets short (one command per tab).', 'Listen to `copy-error` if you need a fallback UI; copying needs a secure context (HTTPS).', 'Use unique tab labels.'],
  replaces: ['hand-rolled InstallTabs markup in app code'],
}
export default doc
