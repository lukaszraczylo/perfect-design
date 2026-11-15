import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Prose',
  group: 'typography',
  subgroup: 'Prose',
  summary: 'Wrapper that styles raw HTML content (headings, lists, links, code, tables, images) with design tokens.',
  description:
    'Use `Prose` around content you do not control element-by-element: rendered Markdown, CMS HTML or long-form articles. Styles apply to descendants via Tailwind arbitrary variants, so it works without any plugin. Set `measure` for a readable line length (`max-w-prose`, 65ch). For individual, hand-authored elements prefer `Heading`, `Text` and friends.\n\nSizes: `xs` 13px (dense help panels), `sm` 14px (app UI), `base`/`md` 16px (default reading size), `lg` 18px (articles), `xl` 20px (landing copy). Tones: `default` follows the page; `inverted` swaps foreground and background tokens for a high-contrast block in either theme; `dark` forces the dark palette for the block regardless of page theme. Both non-default tones add a padded rounded surface (override with `class`, e.g. `p-0`).\n\nDensity sets the vertical rhythm: `compact` (tight margins for help panels and changelogs), `default`, `relaxed` (generous margins and `leading-relaxed` for long-form reading). Density overrides descendant margins through tailwind-merge, so use `Prose` (or wrap `proseVariants` in `cn()`).',
  status: 'stable',
  props: [
    { name: 'size', type: "'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl'", default: "'base'", description: 'Base font size: xs text-sm (13px), sm text-base (14px), base and md text-md (16px), lg text-lg, xl text-xl.' },
    { name: 'tone', type: "'default' | 'inverted' | 'dark'", default: "'default'", description: '`inverted` = bg-foreground/text-background surface with re-coloured links, code, tables and rules; `dark` = forced dark palette (`dark` class) on a bordered surface. Unknown values fall back to `default`.' },
    { name: 'density', type: "'compact' | 'default' | 'relaxed'", default: "'default'", description: 'Vertical rhythm. `compact`: smaller heading, paragraph, list, code, table and media margins. `relaxed`: larger margins plus `leading-relaxed`. Unknown values fall back to `default`.' },
    { name: 'measure', type: 'boolean', default: 'false', description: 'Limit width to max-w-prose (65ch).' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render (`article`, `section`...).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child instead of rendering a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes. Override a descendant rule with e.g. `[&_h1]:text-2xl`.' },
  ],
  slots: [{ name: 'default', description: 'Raw HTML or markup to style.' }],
  examples: [
    {
      title: 'Article',
      code: `<Prose as="article" measure>
  <h4>Sample article</h4>
  <p>Install the package and import the <code>theme.css</code> file. See the <a href="/guides/getting-started">guide</a> for details.</p>
  <h5>Steps</h5>
  <ol><li>Install</li><li>Import the theme</li><li>Add <strong>@source</strong></li></ol>
  <blockquote>Sample quotation text.</blockquote>
  <pre><code>pnpm add @perfect-design/ui</code></pre>
</Prose>`,
    },
    {
      title: 'Density',
      description: 'The same content at `compact`, `default` and `relaxed` rhythm.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Prose density="compact"><h4>Compact</h4><p>Sample paragraph one.</p><p>Sample paragraph two.</p><ul><li>One</li><li>Two</li></ul></Prose>
  <Prose><h4>Default</h4><p>Sample paragraph one.</p><p>Sample paragraph two.</p><ul><li>One</li><li>Two</li></ul></Prose>
  <Prose density="relaxed"><h4>Relaxed</h4><p>Sample paragraph one.</p><p>Sample paragraph two.</p><ul><li>One</li><li>Two</li></ul></Prose>
</div>`,
    },
    {
      title: 'Table and list, large size',
      code: `<Prose size="lg">
  <h4>Sizes</h4>
  <ul><li>Small</li><li>Base<ul><li>Default</li></ul></li><li>Large</li></ul>
  <table>
    <thead><tr><th>Name</th><th>Size</th></tr></thead>
    <tbody><tr><td>sm</td><td>14px</td></tr><tr><td>base</td><td>16px</td></tr></tbody>
  </table>
  <hr />
  <p>Sample closing paragraph.</p>
</Prose>`,
    },
    {
      title: 'Size: xs and sm',
      description: 'Dense help panels and app UI copy.',
      code: `<div class="space-y-6">
  <Prose size="xs"><p>Extra small (13px): terse help text with a <a href="/guides/getting-started">link</a>.</p></Prose>
  <Prose size="sm"><p>Small (14px): matches the dense app UI scale.</p></Prose>
</div>`,
    },
    {
      title: 'Size: md and xl',
      description: '`md` is an alias of `base` (16px); `xl` suits landing-page copy.',
      code: `<div class="space-y-6">
  <Prose size="md"><p>Medium (16px): the default reading size.</p></Prose>
  <Prose size="xl"><p>Extra large (20px): intro copy.</p></Prose>
</div>`,
    },
    {
      title: 'Tone: inverted',
      description: 'High-contrast block; links, code, tables and rules are re-coloured.',
      code: `<Prose tone="inverted">
  <h4>Sample notes</h4>
  <p>See the <a href="/guides/getting-started">changelog</a> and run <code>pnpm up</code>.</p>
  <ul><li>Sample item</li><li>Another item</li></ul>
  <pre><code>pnpm add @perfect-design/ui</code></pre>
  <table>
    <thead><tr><th>Name</th><th>Value</th></tr></thead>
    <tbody><tr><td>tone</td><td>inverted</td></tr></tbody>
  </table>
</Prose>`,
    },
    {
      title: 'Tone: dark',
      description: 'Forces the dark palette for this block even when the page is light.',
      code: `<Prose tone="dark" size="sm">
  <h4>Always dark</h4>
  <p>Uses the dark tokens: <a href="/guides/getting-started">links</a>, <code>code</code> and <strong>emphasis</strong>.</p>
  <blockquote>Sample quotation text.</blockquote>
</Prose>`,
    },
  ],
  a11y: ['Does not change semantics; the underlying HTML structure is what assistive tech sees.', 'Link colour relies on underline as well as colour.', 'Rendered `pre` blocks that overflow get `tabindex="0"` automatically (and a focus ring) so keyboard users can scroll them; the attribute is removed again when they stop overflowing. Elements that already have a `tabindex` are left alone.', 'Lists and quotes use logical properties (`ps`, `border-s`) and table headers use `text-start`, so right-to-left content mirrors.', '`inverted` and `dark` use token pairs (foreground/background) so contrast follows the theme.', '`density` only changes margins and line height (WCAG 1.4.12 text spacing stays user-adjustable); `compact` never shrinks the font size.'],
  related: ['Heading', 'Text', 'InlineCode', 'Blockquote'],
  llmNotes: ['Start headings inside Prose one level below the page outline (no jumps).', 'Wrap rendered Markdown/CMS HTML in Prose; do not use it around Vue components that already style themselves.', 'Use `measure` for long-form reading.', 'Use `tone="inverted"` or `tone="dark"` for a contrasting block; they add padding and a radius, remove with `class="p-0 rounded-none"`.', '`size="md"` equals `base`.', 'Use `density="compact"` for help panels and changelogs, `density="relaxed"` for long articles.', 'Override a descendant with `class="[&_h2]:text-2xl"`.'],
  replaces: ['@tailwindcss/typography `prose` classes', 'custom .markdown-body styles'],
}
export default doc
