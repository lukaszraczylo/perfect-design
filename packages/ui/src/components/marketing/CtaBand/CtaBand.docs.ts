import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'CtaBand',
  group: 'marketing',
  subgroup: 'Sections',
  summary: 'Call-to-action section in 5 layouts (band, card, split, inline, newsletter) and 3 flat tones.',
  description: [
    'Use near the end of a landing page, or between sections, to push one action. Pick a `variant` for the layout and a `tone` for the colour. Keep to one clear action and label it with what happens; do not stack several CtaBands. Unknown `variant` falls back to `card`; unknown `tone` falls back to `primary`.',
    '',
    'Variants and when to use them:',
    '- `card` (default): rounded centred block inside the page container. The closing CTA.',
    '- `band`: full-width square band with centred copy. Use when the CTA spans edge to edge between full-width sections.',
    '- `split`: copy on one side, `media` or `form` on the other. Use when a real screenshot or a sign-up form supports the pitch.',
    '- `inline`: compact one-liner (headline, optional subtext, buttons at the end). Use mid-page or inside articles and docs.',
    '- `newsletter`: centred copy with an email `form` slot. Use for subscriptions.',
    '',
    'Tones: `primary` (brand fill with `primary-foreground`), `muted` (quiet panel) and `inverted` (`foreground` fill with `background` text). All are flat fills; the gradient tone was removed, and text is never faded with opacity so contrast is the tested token pair.',
  ].join('\n'),
  status: 'stable',
  props: [
    { name: 'variant', type: "'band' | 'card' | 'split' | 'inline' | 'newsletter'", default: "'card'", description: 'Layout. Unknown values fall back to `card`.' },
    { name: 'headline', type: 'string', description: 'Main call to action text. A heading is required: this, the `headline` slot, a heading in another slot or an `aria-label`. A claim or a plain statement of what happens, not a generic invitation.' },
    { name: 'subtext', type: 'string', description: 'Supporting sentence.' },
    { name: 'tone', type: "'primary' | 'muted' | 'inverted'", default: "'primary'", description: 'Flat colour treatment. Unknown values (including the removed `gradient`) fall back to `primary`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and headline scale of every layout; `md` is the original spacing. Unknown values fall back to `md`. Exposed as `data-size`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: '`square` removes the corner radius of the boxed layouts (`band` has none). Unknown values fall back to `rounded`. Exposed as `data-shape`.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Heading level; invalid falls back to 2.' },
    { name: 'as', type: 'string | Component', default: "'section'", description: 'Root element.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'headline', description: 'Replaces the headline text.' },
    { name: 'subtext', description: 'Replaces the subtext.' },
    { name: 'actions', description: 'Buttons row. On `primary` use `variant="secondary"` Buttons, on `inverted` use `outline`, on `muted` the default Button.' },
    { name: 'form', description: '`newsletter`: email form under the subtext. `split`: form shown beside the copy. Ignored by other variants.' },
    { name: 'media', description: '`split` only: real screenshot beside the copy.' },
  ],
  examples: [
    {
      title: 'Card (default)',
      code: `<CtaBand headline="Browse the catalogue before you build" subtext="Every component page has live examples and copyable code.">
  <template #actions><Button variant="secondary" size="lg">Open the catalogue</Button></template>
</CtaBand>`,
    },
    {
      title: 'Band (full width)',
      code: `<CtaBand variant="band" headline="Edge-to-edge between full-width sections" subtext="Use when the surrounding sections also run full width.">
  <template #actions><Button variant="secondary" size="lg">Read the layout guide</Button></template>
</CtaBand>`,
    },
    {
      title: 'Split with media',
      code: `<CtaBand variant="split" tone="inverted" headline="See the table with real data" subtext="Swap the placeholder for a screenshot of your own screen.">
  <template #actions><Button variant="outline">Open the table docs</Button></template>
  <template #media>
    <div class="flex aspect-video items-center justify-center rounded-lg border border-background text-sm">Screenshot placeholder</div>
  </template>
</CtaBand>`,
    },
    {
      title: 'Split with form',
      code: `<CtaBand variant="split" tone="muted" headline="Ask a question about the library" subtext="Sample form: it does not send anything.">
  <template #form>
    <form class="grid gap-3" @submit.prevent>
      <Input placeholder="name@example.com" type="email" autocomplete="email" aria-label="Email address" />
      <Button type="submit">Send the question</Button>
    </form>
  </template>
</CtaBand>`,
    },
    {
      title: 'Inline',
      code: `<CtaBand variant="inline" tone="muted" headline="Using the library in an existing app?" subtext="The migration guide lists what each old component maps to.">
  <template #actions><Button size="sm">Read the migration guide</Button></template>
</CtaBand>`,
    },
    {
      title: 'Newsletter',
      code: `<CtaBand variant="newsletter" tone="muted" headline="Get release notes by email" subtext="Sample form: it does not send anything.">
  <template #form>
    <form class="flex w-full flex-col gap-2 sm:flex-row" @submit.prevent>
      <Input type="email" autocomplete="email" placeholder="name@example.com" aria-label="Email address" />
      <Button type="submit">Send release notes</Button>
    </form>
  </template>
</CtaBand>`,
    },
    {
      title: 'Sizes and square corners',
      description: '`size` scales padding and headline; `shape="square"` removes the radius.',
      code: `<div class="grid gap-6">
  <CtaBand size="sm" tone="muted" :level="3" headline="Small"><template #actions><Button>Action</Button></template></CtaBand>
  <CtaBand size="lg" shape="square" tone="inverted" :level="3" headline="Large and square"><template #actions><Button variant="outline">Action</Button></template></CtaBand>
</div>`,
    },
    {
      title: 'Tones',
      code: `<div class="grid gap-6">
  <CtaBand tone="primary" :level="3" headline="Primary"><template #actions><Button variant="secondary">Action</Button></template></CtaBand>
  <CtaBand tone="muted" :level="3" headline="Muted"><template #actions><Button>Action</Button></template></CtaBand>
  <CtaBand tone="inverted" :level="3" headline="Inverted"><template #actions><Button variant="outline">Action</Button></template></CtaBand>
</div>`,
    },
  ],
  requires: [
    'Throws a ContractError when the band has no heading: set `headline` (or the `headline` slot), put a heading in another slot, or set `aria-label` / `aria-labelledby`.',
  ],
  a11y: [
    'The headline is a heading chosen by `level` (default 2); keep the order valid on the page. Actions are normal focusable buttons or links.',
    'Give every control in the `form` slot a label or aria-label, and report errors with aria-invalid plus a described message.',
    'Each tone pairs a fill with its matching foreground token and the subtext is not faded with opacity, so text meets 4.5:1 in light and dark.',
    'Reflows at 320px: actions wrap, headlines break long words, layouts stack below `sm`/`lg`. Logical properties (`text-start`) keep RTL correct.',
  ],
  related: ['Hero', 'SectionHeading', 'Button', 'Input'],
  llmNotes: [
    'One main CtaBand per page, placed before the footer; `inline` may be used additionally mid-page.',
    'Choose by content: card = default, band = full-bleed layouts, split = needs a real screenshot or form, inline = small nudge, newsletter = email capture.',
    'Label the action with what happens ("Open the catalogue"), never a generic invitation.',
    'On `primary` use a `secondary` Button (a default Button would blend in); on `inverted` use `outline`.',
    'There is no gradient tone. Do not fade text with opacity utilities inside the band.',
    'The `form` slot renders only in `newsletter` and `split`; `media` only in `split`.',
    'Do not invent customer counts or claims in the headline or subtext.',
  ],
  replaces: ['hand-rolled CtaBand markup in app code'],
}
export default doc
