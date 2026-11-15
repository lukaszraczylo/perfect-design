import { faKeyboard, faPalette, faTable } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc, ExampleDoc } from '../../../docs-types'

const variantExample = (variant: string, description: string, extra = ''): ExampleDoc => ({
  title: `Variant: ${variant}`,
  description,
  code: `<FeatureCard class="max-w-sm" variant="${variant}"${extra} :icon="faKeyboard" title="Keyboard operable" description="Tabs, menus and dialogs follow the WAI-ARIA keyboard patterns." href="/foundations/accessibility" link-label="Read the accessibility notes" />`,
  state: () => ({ faKeyboard }),
})

const doc: ComponentDoc = {
  name: 'FeatureCard',
  group: 'marketing',
  subgroup: 'Features',
  summary: 'Card that presents one feature: icon, title, description and optional link, in eight variants.',
  description:
    'Use inside `FeatureGrid` (or any grid) to describe a feature. Pick the look with `variant`, scale it with `size`, paint it with `tone` and choose corners with `shape`. Variants: `card` (default: border, no shadow, bare accent icon), `bordered` (heavier outline), `flat` (muted surface, no border), `icon-left` (row layout), `icon-top` (icon above the text), `icon-badge` (borderless with a tinted icon tile; opt-in, because a tinted square above every title is a stock look), `minimal` (no box) and `highlight` (primary border for the one feature that matters). `align="center"` centres the content. The card has no hover effect because it is not interactive; only its link is. Icons are optional: leave them out unless they depict the specific feature. For numbered processes use `NumberedSteps`.',
  status: 'stable',
  props: [
    { name: 'icon', type: 'IconDefinition', description: 'FontAwesome-shaped icon definition, drawn in the accent colour. Choose one that depicts the feature; omit it otherwise.' },
    { name: 'title', type: 'string', required: true, description: 'Feature name and card heading. Required unless the `title` slot is used.' },
    { name: 'description', type: 'string', description: 'Short explanation.' },
    { name: 'href', type: 'string', description: 'Renders a link at the bottom when set.' },
    { name: 'linkLabel', type: 'string', description: 'Link text. Defaults to `Read about <title>` (or `Read more` without a title). Name what happens, not a generic invitation.' },
    { name: 'external', type: 'boolean', default: 'false', description: 'Open link in a new tab with rel="noopener noreferrer"; adds an external-link icon and a screen reader note.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of the title; invalid falls back to 3. Keep it one level below the section heading.' },
    {
      name: 'variant',
      type: "'card' | 'bordered' | 'flat' | 'icon-left' | 'icon-top' | 'icon-badge' | 'minimal' | 'highlight'",
      default: "'card'",
      description: 'Visual style. Unknown values fall back to `card`. Exposed as `data-variant`.',
    },
    {
      name: 'align',
      type: "'left' | 'center'",
      default: "'left'",
      description: 'Content alignment. With `icon-left` the icon stays beside the text and the text stays at the start. Unknown values fall back to `left`. Exposed as `data-align`.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Padding and type scale: `sm` = p-4 with a 16px title, `md` = p-6 with an 18px title (the original look), `lg` = p-8 with a 20px title and 16px description. Unknown values fall back to `md`. Exposed as `data-size`.',
    },
    {
      name: 'tone',
      type: "'default' | 'muted' | 'primary' | 'inverted'",
      default: "'default'",
      description:
        'Surface colour. `default` keeps the variant\'s own surface; `muted` paints the muted surface, `primary` the primary colour and `inverted` the foreground colour, with matching text, icon and link colours. `minimal` and `icon-badge` get padding and rounded corners when a tone is set. Unknown values fall back to `default`. Exposed as `data-tone`.',
    },
    {
      name: 'shape',
      type: "'rounded' | 'square'",
      default: "'rounded'",
      description: '`square` removes the corner radius of the card and of the `icon-badge` tile. Unknown values fall back to `rounded`. Exposed as `data-shape`.',
    },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'icon', description: 'Replaces the icon (any element); still wrapped in the variant icon wrapper.' },
    { name: 'title', description: 'Replaces the title text.' },
    { name: 'default', description: 'Replaces the description text.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<FeatureCard :icon="faTable" title="Tables that sort and filter" description="Column definitions, sorting and paging are props." />`,
      state: () => ({ faTable }),
    },
    {
      title: 'With link',
      code: `<div class="grid max-w-md gap-4">
  <FeatureCard :icon="faPalette" title="One theme file" description="Colour, radius and type come from tokens, so a rebrand edits one place." href="/foundations/colors" link-label="Read about the colour tokens" />
</div>`,
      state: () => ({ faPalette }),
    },
    variantExample('card', 'Default: border, no shadow, bare accent icon.'),
    variantExample('bordered', 'Transparent surface with a 2px outline. Good on tinted sections.'),
    variantExample('flat', 'Muted background, no border. Quiet, for dense grids.'),
    variantExample('icon-left', 'Icon beside the text; best for stacked lists.'),
    variantExample('icon-top', 'Icon above the text on a card surface.'),
    variantExample('icon-badge', 'Opt-in: borderless, with a tinted icon tile.'),
    variantExample('minimal', 'No surface: bare icon, title and text. Use for text-heavy sections.'),
    variantExample('highlight', 'Primary border. Use once per grid for the key feature.'),
    {
      title: 'Centred alignment',
      description: '`align="center"` combines with any variant.',
      code: `<FeatureCard class="max-w-sm" variant="icon-badge" align="center" :icon="faKeyboard" title="Works without a mouse" description="Every control has a visible focus state." />`,
      state: () => ({ faKeyboard }),
    },
    {
      title: 'Sizes',
      description: '`size` scales padding and type: `sm`, `md` (default) and `lg`.',
      code: `<div class="grid gap-4 md:grid-cols-3">
  <FeatureCard size="sm" :icon="faKeyboard" title="Small card" description="Dense lists and sidebars." />
  <FeatureCard size="md" :icon="faKeyboard" title="Medium card" description="The default scale." />
  <FeatureCard size="lg" :icon="faKeyboard" title="Large card" description="One feature with room to breathe." />
</div>`,
      state: () => ({ faKeyboard }),
    },
    {
      title: 'Tones',
      description: '`tone` paints the surface. Use `primary` or `inverted` for one card per section, not for every card. The link keeps a visible underline on filled surfaces.',
      code: `<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <FeatureCard tone="default" :icon="faPalette" title="Default" description="The variant's own surface." href="/foundations/colors" link-label="Read about the colour tokens" />
  <FeatureCard tone="muted" :icon="faPalette" title="Muted" description="Quiet surface." href="/foundations/colors" link-label="Read about the colour tokens" />
  <FeatureCard tone="primary" :icon="faPalette" title="Primary" description="The one accent surface." href="/foundations/colors" link-label="Read about the colour tokens" />
  <FeatureCard tone="inverted" :icon="faPalette" title="Inverted" description="Foreground colour surface." href="/foundations/colors" link-label="Read about the colour tokens" />
</div>`,
      state: () => ({ faPalette }),
    },
    {
      title: 'Shapes',
      description: '`shape="square"` removes the radius.',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <FeatureCard shape="rounded" :icon="faTable" title="Rounded" description="The default 8px radius." />
  <FeatureCard shape="square" :icon="faTable" title="Square" description="No radius, for square-cornered layouts." />
</div>`,
      state: () => ({ faTable }),
    },
    {
      title: 'Realistic: unequal emphasis in a grid',
      description: 'One highlighted card, two quiet ones.',
      code: `<div class="grid gap-4 md:grid-cols-3">
  <FeatureCard variant="highlight" :icon="faTable" title="Data tables" description="Sorting, filtering and paging as props." href="/components/data-display/data-table" link-label="Open the data table docs" />
  <FeatureCard variant="flat" :icon="faPalette" title="Theming" description="Seven accent presets override the same tokens." />
  <FeatureCard variant="flat" :icon="faKeyboard" title="Keyboard support" description="Documented per component." />
</div>`,
      state: () => ({ faTable, faPalette, faKeyboard }),
    },
  ],
  a11y: [
    'Icons are decorative (aria-hidden). The title is a heading chosen by `level` (default h3); keep the heading order valid under the section heading.',
    'The DOM order (icon, title, description, link) is the same in every variant. Cards are not interactive; only the link is focusable, with a visible focus ring and a 24px minimum height (44px on coarse pointers).',
    'Link text is descriptive (`Read about <title>` by default). External links add an icon and a screen-reader note that they open in a new tab.',
    'Text wraps and the card uses `min-w-0`, so it reflows at 320px; alignment uses logical values so RTL works.',
  ],
  requires: [
    'Throws a ContractError when there is neither a non-empty `title` nor a `title` slot.',
  ],
  related: ['FeatureGrid', 'NumberedSteps'],
  llmNotes: [
    'Always give `title`; keep descriptions under about 140 characters.',
    'Pass FontAwesome IconDefinition objects, not names, and only icons that depict the feature. Skip the icon when none fits.',
    'Name the link action in `linkLabel` ("Open the data table docs"). Never a generic invitation.',
    'Use `external` for off-site links.',
    'Choose `card` as the safe default, `flat` or `minimal` for dense sections, `bordered` on tinted backgrounds, `icon-left` for stacked lists and `highlight` for one key feature. `icon-badge` is available but is a stock look: use it sparingly.',
    'Use `align="center"` for short centred sections; do not centre long descriptions.',
    'Use `size` for density (`sm` in dense grids, `lg` for a lone feature), `tone="primary"` or `"inverted"` on one card per section, and `shape="square"` only when the surrounding layout has square corners.',
    'Inside FeatureGrid prefer its `variant` prop over styling each card.',
  ],
  replaces: ['hand-rolled FeatureCard markup in app code'],
}
export default doc
