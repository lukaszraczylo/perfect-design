import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'AvatarGroup',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Overlapping stack of avatars with a +N overflow bubble.',
  description:
    'Use `AvatarGroup` to show participants, assignees or members compactly. Provide data with `items`, or compose `Avatar` children in the default slot (both can be combined; items come first). `max` limits how many avatars are shown; the rest collapse into a `+N` bubble. `size` and `shape` apply to every avatar that does not set its own.\n\n' +
    '**Layout** (`layout`): `stacked` (default) overlaps the avatars and separates them with a background-coloured ring; `spaced` puts them side by side with a gap and wraps to a new line, so it suits narrow containers and avatars that carry a status dot or their own `ring`. **Density** (`density`): `compact`, `default` or `loose`. In a stacked group it sets how far the avatars overlap (the steps follow `size`); in a spaced group it sets the gap (4px, 8px, 12px). Unknown values fall back to `stacked` and `default`.',
  status: 'stable',
  props: [
    { name: 'items', type: 'AvatarGroupItem[]', default: '[]', description: 'Avatars as data: `{ src?, name?, alt?, fallback?, status? }`.' },
    { name: 'max', type: 'number', description: 'Maximum avatars shown, counting items and slot children. Omit (or negative/NaN) for no limit; fractions are floored; 0 shows only the bubble.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: 'Size for every avatar and the overlap spacing. Unknown values fall back to md.' },
    { name: 'shape', type: "'circle' | 'rounded' | 'square'", default: "'circle'", description: 'Shape inherited by avatars and the overflow bubble. Unknown values fall back to circle.' },
    { name: 'layout', type: "'stacked' | 'spaced'", default: "'stacked'", description: 'stacked overlaps the avatars with a background ring between them; spaced places them side by side with a gap and wraps. Unknown values fall back to stacked.' },
    { name: 'density', type: "'compact' | 'default' | 'loose'", default: "'default'", description: 'Stacked: overlap amount (compact overlaps more, loose less). Spaced: gap of 4px, 8px or 12px. Unknown values fall back to default.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: '`Avatar` children. Fragments from v-for are flattened and v-if=false nodes ignored when counting for `max`.' }],
  examples: [
    {
      title: 'Items with overflow',
      code: `<AvatarGroup
  :max="3"
  :items="[
    { name: 'Author One' },
    { name: 'Author Two' },
    { name: 'Author Five' },
    { name: 'Author Three' },
    { name: 'Author Four' },
  ]"
/>`,
    },
    {
      title: 'Slot children, size and shape',
      code: `<div class="flex flex-col gap-4">
  <AvatarGroup size="sm" :max="2">
    <Avatar name="Author One" status="success" />
    <Avatar name="Author Two" />
    <Avatar name="Author Five" />
  </AvatarGroup>
  <AvatarGroup size="lg" shape="square">
    <Avatar name="Author One" />
    <Avatar name="Author Two" />
  </AvatarGroup>
</div>`,
    },
    {
      title: 'Rounded shape and 2xl size',
      code: `<div class="flex flex-col gap-4">
  <AvatarGroup shape="rounded" :max="3" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }, { name: 'Author Three' }]" />
  <AvatarGroup size="2xl" :items="[{ name: 'Author One' }, { name: 'Author Two' }]" />
</div>`,
    },
    {
      title: 'Spaced layout',
      description: 'Side by side with a gap, wrapping on narrow screens. An avatar status dot is not covered by its neighbour.',
      code: `<div class="flex flex-col gap-4">
  <AvatarGroup layout="spaced" aria-label="Spaced members" :items="[{ name: 'Author One', status: 'success' }, { name: 'Author Two' }, { name: 'Author Five', status: 'warning' }]" />
  <AvatarGroup layout="spaced" shape="rounded" :max="3" aria-label="Spaced members, limited" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }, { name: 'Author Three' }, { name: 'Author Four' }]" />
</div>`,
    },
    {
      title: 'Density',
      description: 'compact, default and loose, stacked and spaced.',
      code: `<div class="flex flex-col gap-4">
  <AvatarGroup density="compact" aria-label="Compact stack" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }]" />
  <AvatarGroup density="default" aria-label="Default stack" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }]" />
  <AvatarGroup density="loose" aria-label="Loose stack" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }]" />
  <AvatarGroup layout="spaced" density="compact" aria-label="Compact gap" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }]" />
  <AvatarGroup layout="spaced" density="loose" size="sm" aria-label="Loose gap" :items="[{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Five' }]" />
</div>`,
    },
  ],
  a11y: ['Root has role="group"; add `aria-label` (e.g. "Project members").', 'The overflow bubble is role="img" with aria-label "N more".', '`layout` and `density` change spacing only; the group role, names and the +N bubble stay the same. `spaced` uses `flex-wrap`, so the group reflows at 320px instead of overflowing, and it draws no overlap ring.', 'The `stacked` ring is a box shadow, which forced-colors mode removes, so each avatar also gets a 2px `CanvasText` outline there (`forced-colors:[&>*]:outline-2`) and overlapping avatars stay distinct. `layout="spaced"` needs neither.'],
  related: ['Avatar', 'Badge'],
  requires: [
    'Throws a ContractError when an item (or a slotted Avatar) has neither `name` nor `alt`, because every avatar must say who it is.',
  ],
  llmNotes: ['Prefer `items` for data-driven lists, slot children when avatars need extra props.', 'Set `max` so long lists do not overflow the layout.', 'Give the group an aria-label.', 'Use layout="spaced" when avatars carry status dots or rings, or in narrow containers; keep the default stacked layout for compact "who is here" rows.'],
  replaces: ['ad-hoc overlapping avatar stacks'],
}
export default doc
