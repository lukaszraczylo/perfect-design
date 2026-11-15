import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Section',
  group: 'layout',
  subgroup: 'Containers',
  summary: 'Page section with vertical padding presets, optional tinted background and borders.',
  description:
    'Use `Section` to stack bands of content on landing and docs pages. It owns vertical rhythm (`padding`: `none` | `xs` | `sm` | `md` | `lg` | `xl`) and full-bleed background (`tone`: `none` transparent, `muted` for quiet alternating bands, `card` for bands on the card surface, `primary` for a single band that needs emphasis; all flat token colours, no gradients or patterns). `divider` (`top` | `bottom` | `both`) draws a border on chosen edges, e.g. `top` for footers and `bottom` for headers; `bordered` is the shorthand for both. Put a `Container` inside to constrain width. For a labelled region give it `aria-labelledby` pointing at its heading. Not for card-like boxed content (use Card).',
  status: 'stable',
  props: [
    { name: 'padding', type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Vertical padding preset (responsive): xs py-3/md:py-4, sm py-6/md:py-8, md py-10/md:py-14, lg py-14/md:py-20, xl py-20/md:py-28. Unknown values fall back to md.' },
    { name: 'tone', type: "'none' | 'muted' | 'card' | 'primary'", default: "'none'", description: 'Flat background using semantic tokens only. The former `gradient` and `pattern` tones were removed and fall back to none. Unknown values fall back to none.' },
    { name: 'divider', type: "'none' | 'top' | 'bottom' | 'both'", description: 'Border on the top, bottom or both edges (border-t / border-b / border-y). Takes precedence over `bordered`; unknown values are ignored.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Adds top and bottom borders (border-y). Ignored when a valid `divider` is set.' },
    { name: 'as', type: 'string | Component', default: "'section'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Section content, usually a Container.' }],
  examples: [
    {
      title: 'Tones',
      code: `<div>
  <Section padding="sm"><Container size="3xl">Plain</Container></Section>
  <Section padding="sm" tone="muted" bordered><Container size="3xl">Muted + bordered</Container></Section>
  <Section padding="sm" tone="primary"><Container size="3xl">Primary</Container></Section>
</div>`,
    },
    {
      title: 'Dividers',
      description: 'Borders on the top, bottom or both edges.',
      code: `<div>
  <Section padding="xs" divider="top"><Container size="3xl">Top divider</Container></Section>
  <Section padding="xs" divider="bottom"><Container size="3xl">Bottom divider</Container></Section>
  <Section padding="xs" divider="both" tone="card"><Container size="3xl">Both dividers</Container></Section>
</div>`,
    },
    {
      title: 'Padding sizes',
      code: `<div>
  <Section padding="none" tone="muted"><Container size="3xl">none</Container></Section>
  <Section padding="xs" tone="card"><Container size="3xl">xs</Container></Section>
  <Section padding="sm" tone="muted"><Container size="3xl">sm</Container></Section>
  <Section padding="md" tone="card"><Container size="3xl">md</Container></Section>
</div>`,
    },
    {
      title: 'Labelled band',
      code: `<Section padding="lg" tone="card" aria-labelledby="sample-band-title">
  <Container size="4xl">
    <VStack :gap="3">
      <h4 id="sample-band-title" class="text-2xl font-semibold">Sample band heading</h4>
      <p class="text-muted-foreground">Sample text inside a labelled section.</p>
      <HStack><Button>Open the component list</Button></HStack>
    </VStack>
  </Container>
</Section>`,
    },
  ],
  a11y: ['Renders a <section>, which is only exposed as a region landmark when it has an accessible name: set `aria-labelledby` or `aria-label`.', 'Tones are token pairs (`bg-*` with its `*-foreground`), so text contrast follows the tested AA pairs in light and dark.', 'Responsive: padding steps down on small screens (`py-*` then `md:py-*`); no fixed widths.'],
  related: ['Container', 'Stack', 'PageHeader'],
  llmNotes: [
    'Section handles vertical padding and background; Container handles width. Nest them.',
    'Give Section an aria-labelledby when it has a heading.',
    'Tones are flat token colours only; do not add gradients or patterns with classes.',
    'Use divider="top|bottom|both" for one-sided borders; bordered is shorthand for both and loses to divider.',
    'Use tone="primary" sparingly (one emphasised band per page).',
  ],
  replaces: ['hand-rolled Section markup in app code'],
}
export default doc
