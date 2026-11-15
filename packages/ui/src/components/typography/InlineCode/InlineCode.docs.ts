import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'InlineCode',
  group: 'typography',
  subgroup: 'Text',
  summary: 'Inline <code> snippet with a muted background and monospace font.',
  description:
    'Use `InlineCode` for short identifiers, commands and file names inside running text. Font size is `text-sm`; use `size` or a `text-*` class to change it. For multi-line code use a code block component, not this.\n\nVariations: `variant` `default` (muted chip), `outline` (hairline border, no fill), `plain` (monospace text only); `size` `xs`, `sm` (default), `md`, `lg`; `tone` `neutral` (default) or `primary`, `success`, `danger`, `info`, which tints the chip, colours the outline or colours the text depending on `variant`. Tinted pairs are the tested status token pairs. When using `inlineCodeVariants` outside the component, wrap the result in `cn()` so tailwind-merge drops the overridden neutral fill.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'outline' | 'plain'", default: "'default'", description: '`default`: bg-muted chip. `outline`: hairline border, transparent fill. `plain`: monospace text with no chip or padding. Unknown values fall back to `default`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'sm'", description: 'Font size: xs text-xs, sm text-sm, md text-base, lg text-md. Unknown values fall back to `sm`.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'danger' | 'info'", default: "'neutral'", description: 'Status colour. `default`: tinted chip (`bg-X/10 text-X`). `outline`: coloured border and text. `plain`: coloured text. Unknown values fall back to `neutral`.' },
    { name: 'as', type: 'string | Component', default: "'code'", description: 'Element to render (e.g. `kbd`).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child instead of rendering a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Code text.' }],
  examples: [
    {
      title: 'In a sentence',
      code: `<Text>Run <InlineCode>pnpm install</InlineCode> before starting the dev server.</Text>`,
    },
    {
      title: 'Variants',
      code: `<Text>Chip <InlineCode>--radius</InlineCode>, outline <InlineCode variant="outline">--radius</InlineCode> and plain <InlineCode variant="plain">--radius</InlineCode>.</Text>`,
    },
    {
      title: 'Sizes',
      code: `<div class="space-y-2">
  <Text>Extra small <InlineCode size="xs">pnpm test</InlineCode></Text>
  <Text>Small <InlineCode>pnpm test</InlineCode></Text>
  <Text>Medium <InlineCode size="md">pnpm test</InlineCode></Text>
  <Text>Large <InlineCode size="lg">pnpm test</InlineCode></Text>
</div>`,
    },
    {
      title: 'Tones',
      description: 'The tone follows the variant: a tinted chip, a coloured outline or coloured text. Keep the surrounding words saying what the status is.',
      code: `<div class="space-y-2">
  <Text>Chip: <InlineCode tone="primary">primary</InlineCode> <InlineCode tone="success">200 OK</InlineCode> <InlineCode tone="danger">500</InlineCode> <InlineCode tone="info">204</InlineCode></Text>
  <Text>Outline: <InlineCode variant="outline" tone="primary">primary</InlineCode> <InlineCode variant="outline" tone="success">200 OK</InlineCode> <InlineCode variant="outline" tone="danger">500</InlineCode></Text>
  <Text>Plain: <InlineCode variant="plain" tone="primary">primary</InlineCode> <InlineCode variant="plain" tone="info">204</InlineCode></Text>
</div>`,
    },
    {
      title: 'In different text sizes',
      code: `<div class="space-y-2">
  <Text size="xs">Small: <InlineCode>--radius</InlineCode></Text>
  <Text size="xl">Large: <InlineCode>--radius</InlineCode></Text>
  <Text>Keyboard: <InlineCode as="kbd">Ctrl</InlineCode> + <InlineCode as="kbd">K</InlineCode></Text>
</div>`,
    },
  ],
  a11y: ['Uses the native <code> element, which conveys code semantics to assistive technology.', 'Long identifiers wrap (`break-words`) instead of forcing horizontal scroll at 320px.', 'Tone is never the only signal: write the status in the sentence (for example "returns 500"). The `outline` variant keeps a visible border in forced-colors mode; `default` relies on the system text colour there.'],
  related: ['Text', 'Prose'],
  llmNotes: ['Inline only; never wrap multi-line blocks.', 'Keep it to short identifiers; long strings wrap with `break-words` instead of overflowing.', 'Use `tone` only to mark a status or role, with the meaning also in the surrounding text.'],
  replaces: ['ad-hoc <code class="bg-muted rounded px-1 font-mono"> patterns'],
}
export default doc
