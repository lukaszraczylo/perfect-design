import { faEnvelope, faRss } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const year = new Date().getFullYear()
const columns = [
  { title: 'Reference', links: [{ label: 'Components', href: '/components' }, { label: 'Foundations', href: '/foundations/colors' }] },
  { title: 'Guides', links: [{ label: 'Getting started', href: '/guides/getting-started' }, { label: 'Migration', href: '/guides/migration' }] },
]
const fourColumns = [
  { title: 'Reference', links: [{ label: 'Components', href: '/components' }, { label: 'Colours', href: '/foundations/colors' }, { label: 'Typography', href: '/foundations/typography' }] },
  { title: 'Guides', links: [{ label: 'Getting started', href: '/guides/getting-started' }, { label: 'Customisation', href: '/guides/customisation' }, { label: 'Testing', href: '/guides/testing' }] },
  { title: 'Foundations', links: [{ label: 'Spacing', href: '/foundations/spacing' }, { label: 'Elevation', href: '/foundations/elevation' }, { label: 'Motion', href: '/foundations/motion' }] },
  { title: 'For LLMs', links: [{ label: 'LLM guide', href: '/guides/llm' }, { label: 'Migration', href: '/guides/migration' }, { label: 'Accessibility', href: '/foundations/accessibility' }] },
]
const legalLinks = [{ label: 'Getting started', href: '/guides/getting-started' }, { label: 'Migration', href: '/guides/migration' }]

const doc: ComponentDoc = {
  name: 'SiteFooter',
  group: 'marketing',
  subgroup: 'Site chrome',
  summary: 'Marketing footer in 7 variants (columns, simple, centered, minimal, newsletter, mega, split) with sizes, alignment and default, muted or dark tones.',
  description: [
    'Use at the bottom of marketing and docs sites. Columns are `{ title, links }` groups rendered as a labelled navigation landmark with one heading and list per column. The bottom row combines legal text and legal links. Put social icon links (see `SocialLinks`) in the `social` slot. Unknown `variant` falls back to `columns`; unknown `tone` to `default`.',
    '',
    'Variants and when to use them:',
    '- `columns` (default): brand block left, 2-4 link columns right. Most marketing sites.',
    '- `simple`: one row with brand, a flat list of links and social icons, then the legal row. Small sites with 4-8 links. Flat links come from `links` or, by default, every link in `columns`.',
    '- `centered`: everything stacked and centred. Personal, portfolio and brand-led sites.',
    '- `minimal`: only the legal row (optionally brand and social inline). Apps, checkout and focused landing pages.',
    '- `newsletter`: brand, link columns and an extra newsletter column (`newsletterTitle`, `newsletterDescription`, `newsletter` slot for the form). Content and community sites that grow a mailing list.',
    '- `mega`: large brand block plus four link columns and a spaced legal row. Big sites with many pages.',
    '- `split`: brand block on one half, link columns (up to three per row) on the other, then the legal row. Sites with a longer tagline and a few link groups.',
    '',
    'Link only pages that exist; a four-column footer of dead links is a stock look. Compute the copyright year (`new Date().getFullYear()`) instead of hard-coding it.',
    '',
    'Tone: `tone="dark"` inverts the footer (`bg-foreground` with `text-background`) and works with every variant. Use it to anchor a light page or to contrast with a light CtaBand above. `tone="muted"` uses the muted surface with the usual text colours: a quieter separation from the page than the border alone.',
    '',
    'Size: `size` sets vertical padding (`sm`, `md`, `lg`; `md` is the original) and the text size of links, titles, descriptions and legal text (`lg` is 16px, `sm` and `md` stay at 14px).',
    '',
    'Align: `align` (`start`, `center`, `end`) sets text and item alignment in every variant. Unset keeps the variant default (`centered` centres, the others start). On `simple`, centred or end-aligned content stacks instead of spreading across one row.',
  ].join('\n'),
  status: 'stable',
  props: [
    { name: 'variant', type: "'columns' | 'simple' | 'centered' | 'minimal' | 'newsletter' | 'mega' | 'split'", default: "'columns'", description: 'Layout. Unknown values fall back to `columns`.' },
    { name: 'tone', type: "'default' | 'dark' | 'muted'", default: "'default'", description: 'Colour treatment: the page surface, the inverted `dark` footer, or the `muted` surface. Unknown values fall back to `default`. Reflected as `data-tone`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Vertical padding and text size of links, titles and legal text (`lg` is 16px). Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'align', type: "'start' | 'center' | 'end'", description: 'Text and item alignment. Unset keeps the variant default. Unknown values are ignored. Reflected as `data-align`.' },
    { name: 'columns', type: 'FooterColumn[]', default: '[]', description: '`{ title, links: { label, href, external? }[] }`. Used by columns, newsletter and mega; simple/centered flatten them. Malformed columns are skipped.' },
    { name: 'links', type: 'FooterLink[]', description: 'Flat links for `simple` and `centered`. Defaults to all links of `columns`; an empty array hides the nav.' },
    { name: 'legal', type: 'string', description: 'Copyright or legal text. Compute the year.' },
    { name: 'legalLinks', type: 'FooterLink[]', default: '[]', description: 'Links in the bottom row (Privacy, Terms).' },
    { name: 'description', type: 'string', description: 'Short brand tagline under the brand slot (not shown in `minimal`).' },
    { name: 'newsletterTitle', type: 'string', description: '`newsletter` variant: heading of the form column.' },
    { name: 'newsletterDescription', type: 'string', description: '`newsletter` variant: text above the form.' },
    { name: 'navLabel', type: 'string', default: "'Footer'", description: 'Accessible name of the navigation landmark. Give each footer on a page a distinct name.' },
    { name: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Heading level of the column and newsletter titles; invalid falls back to 2.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'brand', description: 'Logo/brand block (top-left; inline in the legal row for `minimal`).' },
    { name: 'social', description: 'Social links: under the brand (columns, newsletter, mega), beside the links (simple, centered) or in the legal row (minimal).' },
    { name: 'newsletter', description: '`newsletter` variant: the subscribe form.' },
    { name: 'legal', description: 'Replaces the legal text.' },
    { name: 'default', description: 'Extra content between the main area and the legal row.' },
  ],
  examples: [
    {
      title: 'Columns and legal row',
      code: `<SiteFooter nav-label="Columns footer" :legal="\`© \${year} Perfect Design\`" :columns="columns" :legal-links="legalLinks">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
</SiteFooter>`,
      script: `const year = new Date().getFullYear()\nconst columns = [{ title: 'Reference', links: [{ label: 'Components', href: '/components' }] }, ...]`,
      state: () => ({ columns, legalLinks, year }),
    },
    {
      title: 'With social and description',
      code: `<SiteFooter nav-label="Social footer" description="Vue components and design tokens." :legal="\`© \${year} Perfect Design\`">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  <template #social>
    <Button as="a" href="mailto:name@example.com" variant="ghost" size="icon" aria-label="Email"><Icon :icon="faEnvelope" /></Button>
    <Button as="a" href="/rss.xml" variant="ghost" size="icon" aria-label="RSS feed"><Icon :icon="faRss" /></Button>
  </template>
</SiteFooter>`,
      state: () => ({ faEnvelope, faRss, year }),
    },
    {
      title: 'Simple (one row)',
      code: `<SiteFooter variant="simple" nav-label="Simple footer" :legal="\`© \${year} Perfect Design\`" :links="[{ label: 'Components', href: '/components' }, { label: 'Guides', href: '/guides/getting-started' }, { label: 'Migration', href: '/guides/migration' }]">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  <template #social><Button as="a" href="mailto:name@example.com" variant="ghost" size="icon" aria-label="Email"><Icon :icon="faEnvelope" /></Button></template>
</SiteFooter>`,
      state: () => ({ faEnvelope, year }),
    },
    {
      title: 'Centered',
      code: `<SiteFooter variant="centered" nav-label="Centered footer" description="A component library for admin consoles." :legal="\`© \${year} Perfect Design\`" :columns="columns" :legal-links="legalLinks">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  <template #social><Button as="a" href="/rss.xml" variant="ghost" size="icon" aria-label="RSS feed"><Icon :icon="faRss" /></Button></template>
</SiteFooter>`,
      state: () => ({ columns, legalLinks, faRss, year }),
    },
    {
      title: 'Minimal',
      code: `<SiteFooter variant="minimal" :legal="\`© \${year} Perfect Design\`" :legal-links="legalLinks">
  <template #brand><span class="font-semibold">Perfect Design</span></template>
</SiteFooter>`,
      state: () => ({ legalLinks, year }),
    },
    {
      title: 'Newsletter column',
      description: 'Sample form: it does not send anything. Wire `submit` to your own handler.',
      code: `<SiteFooter variant="newsletter" nav-label="Newsletter footer" :legal="\`© \${year} Perfect Design\`" description="Vue components and design tokens." :columns="columns" newsletter-title="Release notes by email" newsletter-description="Sent when a version ships.">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  <template #newsletter>
    <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent>
      <Input type="email" autocomplete="email" placeholder="name@example.com" aria-label="Email address" />
      <Button type="submit">Send release notes</Button>
    </form>
  </template>
</SiteFooter>`,
      state: () => ({ columns, year }),
    },
    {
      title: 'Mega',
      code: `<SiteFooter variant="mega" nav-label="Mega footer" description="Nine groups of components, one set of tokens." :legal="\`© \${year} Perfect Design\`" :columns="columns" :legal-links="legalLinks">
  <template #brand><span class="text-xl font-semibold">Perfect Design</span></template>
  <template #social><Button as="a" href="mailto:name@example.com" variant="ghost" size="icon" aria-label="Email"><Icon :icon="faEnvelope" /></Button></template>
</SiteFooter>`,
      script: `const columns = [{ title: 'Reference', links: [...] }, { title: 'Guides', links: [...] }, { title: 'Foundations', links: [...] }, { title: 'For LLMs', links: [...] }]`,
      state: () => ({ columns: fourColumns, legalLinks, faEnvelope, year }),
    },
    {
      title: 'Split: brand half and link half',
      code: `<SiteFooter variant="split" nav-label="Split footer" description="Vue components and design tokens for admin consoles and small product sites." :legal="\`© \${year} Perfect Design\`" :columns="fourColumns" :legal-links="legalLinks">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
</SiteFooter>`,
      script: `const columns = [{ title: 'Reference', links: [...] }, ...]`,
      state: () => ({ fourColumns: fourColumns.slice(0, 3), legalLinks, year }),
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Vertical padding and text size. Each footer has its own `nav-label`.',
      code: `<div class="flex flex-col gap-6">
  <SiteFooter size="sm" nav-label="Small footer" :legal="\`© \${year} Perfect Design\`" :columns="columns">
    <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  </SiteFooter>
  <SiteFooter size="md" nav-label="Medium footer" :legal="\`© \${year} Perfect Design\`" :columns="columns">
    <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  </SiteFooter>
  <SiteFooter size="lg" nav-label="Large footer" :legal="\`© \${year} Perfect Design\`" :columns="columns">
    <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  </SiteFooter>
</div>`,
      state: () => ({ columns, year }),
    },
    {
      title: 'Align gallery: start, center, end',
      description: 'Text and items follow `align` in every variant. The end alignment mirrors in right-to-left pages.',
      code: `<div class="flex flex-col gap-6">
  <SiteFooter variant="simple" align="start" nav-label="Start aligned footer" :legal="\`© \${year} Perfect Design\`" :links="links">
    <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  </SiteFooter>
  <SiteFooter variant="simple" align="center" nav-label="Centre aligned footer" :legal="\`© \${year} Perfect Design\`" :links="links">
    <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  </SiteFooter>
  <SiteFooter variant="simple" align="end" nav-label="End aligned footer" :legal="\`© \${year} Perfect Design\`" :links="links">
    <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
  </SiteFooter>
</div>`,
      state: () => ({ links: [{ label: 'Components', href: '/components' }, { label: 'Guides', href: '/guides/getting-started' }, { label: 'Migration', href: '/guides/migration' }], year }),
    },
    {
      title: 'Muted tone',
      code: `<SiteFooter tone="muted" nav-label="Muted footer" :legal="\`© \${year} Perfect Design\`" description="Muted surface, regular text colours." :columns="columns" :legal-links="legalLinks">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
</SiteFooter>`,
      state: () => ({ columns, legalLinks, year }),
    },
    {
      title: 'Dark tone',
      code: `<SiteFooter tone="dark" nav-label="Dark footer" :legal="\`© \${year} Perfect Design\`" description="Dark footer, inverted tokens." :columns="columns" :legal-links="legalLinks">
  <template #brand><span class="text-lg font-semibold">Perfect Design</span></template>
</SiteFooter>`,
      state: () => ({ columns, legalLinks, year }),
    },
  ],
  requires: [
    'Throws a ContractError when a column has an empty `title`, or a link in `columns`, `links` or `legalLinks` has an empty `label` or `href` (the first one is named by location).',
    'Throws a ContractError when a footer navigation is shown and `navLabel` is empty.',
  ],
  a11y: [
    'The root is a `footer` (contentinfo) with a labelled `nav` (`navLabel`). Several footers on one page need distinct `navLabel`s, or axe reports landmark-unique. Each column is a heading (level set by `headingLevel`, default 2) plus a native list named by that heading.',
    'Keyboard: Tab / Shift+Tab through links in DOM order; Enter activates. There are no widgets to operate.',
    'External links use `target="_blank"` with `rel="noopener noreferrer"`. Links are at least 24px tall and 44px on coarse pointers.',
    '`size`, `align`, the `muted` tone and the `split` variant change looks and layout only: landmark, heading levels, list names and the contract stay the same. `align="end"` uses logical alignment, so it mirrors in right-to-left pages. The muted tone keeps `muted-foreground` for links and legal text (a tested pair on the muted surface).',
    'Dark tone uses the `background` token at 70% for links and text on the `foreground` fill; that pair keeps at least 4.5:1. Keep legal text at that tone or stronger.',
    'Columns stack to two on phones and three from `sm`, so it reflows at 320px. Logical properties and no left/right offsets, so RTL needs no changes.',
  ],
  related: ['SiteHeader', 'SocialLinks', 'ContactLink', 'CtaBand'],
  llmNotes: [
    'One SiteFooter per page; if several appear (docs, demos) give each a distinct `nav-label`.',
    'Link only pages that exist, and compute the copyright year.',
    'Pick by size: minimal (no navigation), simple/centered (under ~8 links), columns (2-4 columns), newsletter (columns + mailing list), mega (4 columns, many pages).',
    'Keep columns to 2-4 with 3-7 links each.',
    'Put icon-only social links in the `social` slot with aria-labels (use SocialLinks).',
    'Use `tone="dark"` or `tone="muted"` instead of overriding colours with class.',
    'Use `size="sm"` for dense app footers, `size="lg"` for brand-led pages, `align` instead of text classes, and `variant="split"` when the tagline is long.',
    'Newsletter props and slot render only in the `newsletter` variant; `links` only in `simple`/`centered`.',
  ],
  replaces: ['hand-rolled SiteFooter markup in app code'],
}
export default doc
