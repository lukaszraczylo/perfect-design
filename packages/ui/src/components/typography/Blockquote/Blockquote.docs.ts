import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Blockquote',
  group: 'typography',
  subgroup: 'Text',
  summary: 'Quoted passage in five variants (left border, tinted, card, pull-quote) with a citation footer or an author row (avatar, name, role).',
  description:
    'Use `Blockquote` for quotations. Pass `citation` (or the `citation` slot for rich markup) to show an attribution footer, and `cite` for the machine-readable source URL. Not for generic callouts (use an Alert).\n\nVariants: `default` and `primary` (inline-start border, neutral or primary) for quotes inside articles; `tinted` (soft surface with a hairline border) for emphasised excerpts; `card` for quotes in grids; `pull` (large display type, combine with `align="center"`) for pull-quotes. Attribution: `citation` renders a plain muted footer; `author` / `role` / `avatar` (or their slots) render an author row and take precedence over `citation`. Only quote real, attributed text.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'primary' | 'tinted' | 'card' | 'pull'", default: "'default'", description: 'Visual style. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'", description: 'Text size of the quote. Not set by default (inherits; `pull` is 2xl). Wins over the variant size.' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: 'Centres the quote and the author row.' },
    { name: 'citation', type: 'string', description: 'Attribution text shown in a muted footer. Overridden by the `citation` slot; ignored when an author row is rendered.' },
    { name: 'author', type: 'string', description: 'Author name; renders the author row. Overridden by the `author` slot.' },
    { name: 'authorRole', type: 'string', description: 'The author\'s job title or company, under the author name. Overridden by the `role` slot.' },
    { name: 'role', type: 'string', description: 'Deprecated: use `authorRole`. Still shown when `authorRole` is not set, and logs one development warning per instance.' },
    { name: 'avatar', type: 'string', description: 'Avatar image URL (decorative, `alt=""`). Use the `avatar` slot for an `Avatar` component.' },
    { name: 'cite', type: 'string', description: 'Source URL, rendered as the native `cite` attribute.' },
    { name: 'as', type: 'string | Component', default: "'blockquote'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child; no footer is rendered.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'The quoted text.' },
    { name: 'citation', description: 'Attribution content; overrides the `citation` prop.' },
    { name: 'author', description: 'Author name; overrides the `author` prop.' },
    { name: 'role', description: 'Author role; overrides the `role` prop.' },
    { name: 'avatar', description: 'Avatar element (e.g. `<Avatar>`); overrides the `avatar` URL.' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<Blockquote>Sample quotation text.</Blockquote>`,
    },
    {
      title: 'With citation',
      code: `<div class="space-y-6">
  <Blockquote citation="Sample source" cite="https://example.com/source">Sample quotation text with a machine-readable source.</Blockquote>
  <Blockquote variant="primary">
    Sample quotation text in the primary colour.
    <template #citation><cite>Sample publication</cite>, sample date</template>
  </Blockquote>
</div>`,
    },
    {
      title: 'Variant: tinted',
      description: 'Soft surface with a hairline border, for emphasised excerpts.',
      code: `<Blockquote variant="tinted" citation="Sample source">Sample excerpt that deserves emphasis.</Blockquote>`,
    },
    {
      title: 'Variant: card with author row',
      description: 'Author and role render an author row under the quote, aligned with its text. Add `avatar` (an image URL) or the `avatar` slot to put a picture before it.',
      code: `<Blockquote variant="card" author="Sample author" author-role="Sample role">
  Sample quotation text inside a card.
</Blockquote>`,
    },
    {
      title: 'Variant: pull-quote',
      description: 'Large display type; centre it for a single highlighted quote.',
      code: `<Blockquote variant="pull" align="center" author="Sample author" author-role="Sample role">
  Sample pull-quote text in display size.
</Blockquote>`,
    },
    {
      title: 'Size',
      code: `<div class="space-y-4">
  <Blockquote size="sm">Small quote.</Blockquote>
  <Blockquote size="xl" variant="primary">Extra large quote.</Blockquote>
</div>`,
    },
    {
      title: 'Author row with slots',
      description: 'Use slots for an Avatar component and rich name or role markup.',
      code: `<Blockquote variant="tinted">
  Sample quotation text with a slotted author row.
  <template #avatar><Avatar name="Sample author" /></template>
  <template #author>Sample author</template>
  <template #role>Sample role, <a class="underline" href="/guides/getting-started">sample link</a></template>
</Blockquote>`,
    },
  ],
  a11y: ['Native <blockquote> element; the `cite` attribute is not announced, so show the attribution visibly via `citation` or `author`.', 'The avatar image is decorative (`alt=""`) because the author name is rendered as text next to it.', 'Borders use logical properties (`border-s`, `ps`), so the quote rule flips in right-to-left layouts.', 'Text wraps and reflows at 320px; no fixed widths.'],
  related: ['Text', 'Prose', 'Lead'],
  llmNotes: ['Put the quote in the default slot and the author in `citation`.', 'Use `cite` only for a real URL.', 'Use `author` (+ `authorRole`, `avatar`; `role` is a deprecated alias) for attributed quotes, `citation` for plain sources; do not pass both.', 'Only use real quotes with a real source. Never invent a quote, person or company.', 'Use `variant="pull"` for at most one highlighted quote per section.'],
  replaces: ['ad-hoc <blockquote class="border-l-2 pl-4 italic"> patterns'],
}
export default doc
