import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Eyebrow',
  group: 'typography',
  subgroup: 'Text',
  summary: 'Small plain label placed above a heading.',
  description:
    'Use `Eyebrow` only when the label adds information the heading lacks, such as the product area or document type above a title. If the label repeats the heading, leave it out. It renders normal-case text (a `p` by default); use `as="span"` inline. Not a replacement for a form label.\n\nVariations:\n\n- `variant`: `plain` (default, text only), `rule` (a hairline after the text that fills the row, for section labels in a wide column) or `dot` (a small dot before the text, for a status-style label). The rule and dot are decorative and hidden from assistive technology; they are not rendered with `asChild`.\n- `size`: `xs`, `sm` (default), `md`.\n- `tone`: `primary` (default), `muted`, `foreground`.\n\nNever tracked or all-caps: sentence case only.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'plain' | 'rule' | 'dot'", default: "'plain'", description: '`plain`: text only. `rule`: flex row with a decorative hairline (`bg-border`, `bg-current` in forced-colors mode) after the label. `dot`: decorative dot before the label in the text colour. Not rendered with `asChild`. Unknown values fall back to `plain`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md'", default: "'sm'", description: 'Text size: xs text-xs, sm text-sm, md text-base. Unknown values fall back to `sm`.' },
    { name: 'tone', type: "'primary' | 'muted' | 'foreground'", default: "'primary'", description: 'Text colour: primary, muted-foreground or foreground. Unknown values fall back to `primary`.' },
    { name: 'as', type: 'string | Component', default: "'p'", description: 'Element to render (`span`, `div`...).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child instead of rendering a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Label text.' }],
  examples: [
    {
      title: 'Above a heading',
      code: `<div class="space-y-2">
  <Eyebrow>Component reference</Eyebrow>
  <Heading :level="4" size="2xl">Eyebrow</Heading>
</div>`,
    },
    {
      title: 'Variants',
      description: 'Plain text, a trailing hairline rule and a leading dot. The rule fills the width of its container.',
      code: `<div class="max-w-md space-y-4">
  <Eyebrow>Plain label</Eyebrow>
  <Eyebrow variant="rule">Section label with a rule</Eyebrow>
  <Eyebrow variant="dot" tone="muted">Label with a dot</Eyebrow>
</div>`,
    },
    {
      title: 'Sizes and tones',
      code: `<div class="space-y-2">
  <Eyebrow size="xs">Extra small, primary</Eyebrow>
  <Eyebrow size="sm" tone="muted">Small, muted</Eyebrow>
  <Eyebrow size="md" tone="foreground">Medium, foreground</Eyebrow>
  <Eyebrow variant="rule" size="md" tone="foreground">Medium with a rule</Eyebrow>
</div>`,
    },
    {
      title: 'Tones and inline use',
      code: `<div class="space-y-2">
  <Eyebrow tone="muted">Typography</Eyebrow>
  <Eyebrow as="span">Plain label</Eyebrow>
  <div class="flex items-center gap-2"><Badge>Stable</Badge><Eyebrow as="span" tone="muted">Added in the first release</Eyebrow></div>
</div>`,
    },
  ],
  a11y: ['Plain text in a paragraph; no role. Keep it short so the heading stays the main landmark for navigation.', 'Primary, muted and foreground tones use token pairs tested for AA contrast on the page background and cards.', 'The `rule` and `dot` decorations are `aria-hidden` spans: the label text carries the meaning, so a dot never stands in for a status word. The rule falls back to the text colour in forced-colors mode and keeps a minimum length, so a long label wraps instead of overflowing at 320px.'],
  related: ['Heading', 'Lead', 'Text'],
  llmNotes: ['Use only when it adds information the heading lacks; otherwise omit it.', 'Place directly above a Heading and keep it to a few words.', 'Do not add uppercase or letter-spacing classes.', 'Use `variant="rule"` only above a heading in a wide column; use `variant="dot"` for short status-style labels.'],
  replaces: ['hand-rolled Eyebrow markup in app code'],
}
export default doc
