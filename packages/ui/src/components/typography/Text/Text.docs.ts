import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Text',
  group: 'typography',
  subgroup: 'Text',
  summary: 'Body text with variant presets, size, tone, weight, leading, transform, wrapping, alignment and truncation or line clamping.',
  description:
    'Use `Text` for paragraphs, captions and inline labels instead of raw `<p class="text-sm text-muted-foreground">`. `truncate` gives a single ellipsised line (needs a width-constrained parent); `lines` clamps to 1-6 lines and wins over `truncate`. Do not use for headings (use `Heading`).\n\nVariants are presets that fill only the `size` / `tone` / `weight` you leave unset: `default` plain body copy; `caption` (xs, muted) for helper text under media or inputs; `label` (sm, medium, tight leading) for form-like labels and metadata keys (render with `as="label"`/`span`); `overline` (xs, muted, medium weight, normal case) for small labels that are not headings; `mono` (sm, monospace) for IDs, hashes and numbers. Tones: `muted` secondary copy, `subtle` (same colour as `muted`; a dimmer grey cannot meet AA contrast), `foreground` to reset inside muted parents, `primary` accent, and `success`/`warning`/`danger`/`info` for status.',
  status: 'stable',
  props: [
    { name: 'as', type: 'string | Component', default: "'p'", description: 'Element to render (`span`, `div`, `label`...).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child instead of rendering a wrapper.' },
    { name: 'variant', type: "'default' | 'caption' | 'label' | 'overline' | 'mono'", default: "'default'", description: 'Preset. Fills `size`/`tone`/`weight` only when they are not given. Unknown values fall back to `default`.' },
    { name: 'size', type: "'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'", default: "variant size, else 'base'", description: 'Font size. Unknown values fall back to base.' },
    { name: 'tone', type: "'default' | 'muted' | 'subtle' | 'foreground' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "variant tone, else 'default'", description: 'Text colour. `default` inherits.' },
    { name: 'weight', type: "'light' | 'normal' | 'medium' | 'semibold' | 'bold'", default: 'variant weight, else unset', description: 'Font weight.' },
    { name: 'align', type: "'left' | 'center' | 'right' | 'justify' | 'start' | 'end'", description: 'Text alignment.' },
    { name: 'leading', type: "'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'", description: 'Line height.' },
    { name: 'transform', type: "'uppercase' | 'lowercase' | 'capitalize'", description: 'Text transform. Discouraged: write the text in the case it should read and prefer sentence case.' },
    { name: 'italic', type: 'boolean', default: 'false', description: 'Italic style.' },
    { name: 'wrap', type: "'balance' | 'pretty' | 'nowrap'", description: 'Wrapping strategy: even lines, avoid orphans, or never wrap.' },
    { name: 'truncate', type: 'boolean', default: 'false', description: 'Single line with ellipsis. Ignored when `lines` is valid.' },
    { name: 'lines', type: "1 | 2 | 3 | 4 | 5 | 6 | '1'..'6'", description: 'Clamp to N lines with ellipsis. Other values are ignored.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Text content.' }],
  examples: [
    {
      title: 'Tones and sizes',
      code: `<div class="space-y-1">
  <Text size="lg" weight="semibold">Large semibold</Text>
  <Text>Default body text.</Text>
  <Text size="sm" tone="muted">Small muted caption.</Text>
  <Text size="sm" tone="success">Saved</Text>
  <Text size="sm" tone="warning">Almost full</Text>
  <Text size="sm" tone="danger">Something went wrong</Text>
  <Text size="sm" tone="info">Heads up</Text>
</div>`,
    },
    {
      title: 'Truncation and line clamp',
      code: `<div class="w-64 space-y-3">
  <Text truncate>A very long single line that will be cut off with an ellipsis at the container edge.</Text>
  <Text :lines="2" tone="muted">A longer paragraph that is clamped to two lines. Everything beyond the second line is hidden and replaced by an ellipsis so cards keep an even height.</Text>
  <Text align="center" as="span" class="block">Centered span</Text>
</div>`,
    },
    {
      title: 'Variant: caption',
      description: 'Helper text under inputs, charts or media.',
      code: `<div class="space-y-1">
  <Text>Sample metric name</Text>
  <Text variant="caption">Sample helper text</Text>
</div>`,
    },
    {
      title: 'Variant: label',
      description: 'Metadata keys and form-like labels.',
      code: `<div class="space-y-1">
  <Text as="span" variant="label" class="block">Sample label</Text>
  <Text variant="caption">Sample helper text for the field.</Text>
</div>`,
    },
    {
      title: 'Variant: overline',
      description: 'Small label that is not a heading.',
      code: `<div class="space-y-1">
  <Text variant="overline">Sample label</Text>
  <Text>Sample paragraph under the label.</Text>
</div>`,
    },
    {
      title: 'Variant: mono',
      description: 'IDs, hashes, numbers.',
      code: `<Text variant="mono" tone="muted">req_sample_id</Text>`,
    },
    {
      title: 'Preset overrides',
      description: 'Explicit size / tone / weight win over the preset.',
      code: `<Text variant="overline" size="sm" tone="primary" weight="bold">Overridden label</Text>`,
    },
    {
      title: 'Subtle, foreground and primary tones',
      code: `<div class="space-y-1">
  <Text tone="subtle">Subtle tertiary copy</Text>
  <Text tone="muted"><Text as="span" tone="foreground" weight="medium">Foreground</Text> inside muted copy</Text>
  <Text tone="primary" weight="light" size="xl">Light primary</Text>
</div>`,
    },
    {
      title: 'Leading, transform and italic',
      code: `<div class="w-full max-w-72 space-y-3">
  <Text leading="relaxed">Relaxed leading gives long paragraphs more air to breathe between lines.</Text>
  <Text leading="tight" transform="capitalize">tight leading and capitalised words</Text>
  <Text italic>Italic emphasis</Text>
</div>`,
    },
    {
      title: 'Wrapping',
      code: `<div class="w-64 space-y-3">
  <Text wrap="balance" size="lg" weight="semibold">Balanced lines are even and pleasant for short statements</Text>
  <Text wrap="pretty" tone="muted">Pretty wrapping avoids a single orphaned word on the last line of a paragraph.</Text>
  <Text wrap="nowrap" class="overflow-hidden">A line that never wraps and is clipped by the parent</Text>
</div>`,
    },
    {
      title: 'Larger sizes',
      code: `<div class="space-y-1">
  <Text size="2xl" weight="semibold">2xl display text</Text>
  <Text size="3xl" weight="bold" leading="tight">3xl display text</Text>
</div>`,
    },
  ],
  a11y: ['Truncated or clamped text is still fully present in the DOM for screen readers; expose the full text with a `title` attribute or tooltip where it matters.', 'Do not rely on tone colour alone to convey status.', '`variant="label"` is only styling: use `as="label"` with `for` when it labels a control.', '`transform` changes only how text is drawn; screen readers read the original text.', '`warning` uses the dark warning ink in light mode and the warning token in dark mode so it meets AA; it is never the only signal, so keep the words ("Almost full") in the text.'],
  related: ['Heading', 'Lead', 'InlineCode', 'Prose'],
  llmNotes: ['Use `tone="muted"` for secondary copy, not a custom grey.', '`lines` accepts only 1-6; `lines` beats `truncate`.', 'Truncate needs a parent with constrained width (e.g. `min-w-0` in flex).', 'Do not use `transform="uppercase"` or letter-spacing for labels.', 'Prefer `variant` presets (`caption`, `label`, `overline`, `mono`) over hand-written class combinations; pass `size`/`tone` only to deviate.', 'Use `Heading` (not `Text variant="overline"`) when the text names a section for the document outline.'],
  replaces: ['ad-hoc <p class="text-sm text-muted-foreground"> patterns'],
}
export default doc
