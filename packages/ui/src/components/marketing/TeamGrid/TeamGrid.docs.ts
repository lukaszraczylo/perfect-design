import { faArrowUpRightFromSquare, faEnvelope } from '../../../lib/icons'
import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless avatar sample (docs only). */
const samplePortrait = (bg = '#e4e4e7', fg = '#a1a1aa') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><circle cx="40" cy="31" r="14" fill="${fg}"/><path d="M12 80c2-17 14-26 28-26s26 9 28 26z" fill="${fg}"/></svg>`)}`

/** Visibly sample people: no invented names, roles or biographies. */
const team = [
  { name: 'Sample person A', role: 'Role title', bio: 'One or two sentences about this person.', avatar: samplePortrait('#e4e4e7', '#a1a1aa'), avatarAlt: 'Sample portrait', links: [{ label: 'Email sample person A', href: 'mailto:name@example.com', icon: faEnvelope }, { label: 'Profile of sample person A', href: '/components', icon: faArrowUpRightFromSquare, external: true }] },
  { name: 'Sample person B', role: 'Role title', bio: 'One or two sentences about this person.', links: [{ label: 'Profile of sample person B', href: '/guides/getting-started', icon: faArrowUpRightFromSquare, external: true }] },
  { name: 'Sample person C', role: 'Role title', bio: 'One or two sentences about this person.' },
  { name: 'Sample person D', role: 'Role title' },
]

const doc: ComponentDoc = {
  name: 'TeamGrid',
  group: 'marketing',
  subgroup: 'Team',
  summary: 'Responsive 2/3/4-column grid of team member cards with avatar or initials, role, bio and links.',
  description:
    'Use on About/Team pages to introduce people. Pass `items` for the common case, or place your own `TeamMemberCard`s (or any element) in the default slot. One column on mobile, two from `sm`, then `columns` from `lg`. `variant` picks the card layout: `card` (bordered surface), `minimal` (no surface), `centered` (stacked and centred), `horizontal` (avatar beside the text). Do not use for a handful of testimonials (use Testimonial) or for people lists with data columns (use a table).',
  status: 'stable',
  props: [
    { name: 'columns', type: '2 | 3 | 4', default: '3', description: 'Columns on large screens; invalid values fall back to 3.' },
    { name: 'variant', type: "'card' | 'minimal' | 'centered' | 'horizontal'", default: "'card'", description: 'Card layout forwarded to every generated card; unknown values fall back to `card`.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between members: `sm` 16px, `md` 24px (the original), `lg` 40px. Unknown values fall back to `md`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'TeamMemberCard `size` forwarded to every generated card (spacing, avatar and type scale). A member in `items` can carry its own `size`, which wins. Unknown values fall back to `md`. Cards placed in the default slot keep their own props.' },
    { name: 'shape', type: "'circle' | 'rounded' | 'square'", default: "'circle'", description: 'Avatar shape forwarded to every generated card: `circle`, `rounded` (12px radius) or `square` (6px radius). A member\'s own `shape` wins. Unknown values fall back to `circle`.' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: 'Text alignment forwarded to the generated `card` and `minimal` cards; a member\'s own `align` wins. `centered` is always centred and `horizontal` always start-aligned. Unknown values fall back to `start`.' },
    { name: 'items', type: 'TeamGridItem[]', default: '[]', description: 'Members: `{ name, role?, bio?, avatar?, avatarAlt?, links?: { label, href, icon?, external? }[], size?, shape?, align? }`. Non-array values and null entries are ignored. `name` is required and every link needs a `label` and an `href`.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of member names; invalid values fall back to 3.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  parts: [
    {
      name: 'TeamMemberCard',
      description: 'A single member card. Used by TeamGrid; use it directly inside the default slot. Do not put `role="listitem"` on it: `role` is the member job title prop.',
      props: [
        { name: 'name', type: 'string', required: true, description: 'Display name. Also the avatar label and the source of fallback initials.' },
        { name: 'role', type: 'string', description: 'Job title or role.' },
        { name: 'bio', type: 'string', description: 'Short biography (the default slot overrides it).' },
        { name: 'avatar', type: 'string', description: 'Image URL; a missing or broken image falls back to initials.' },
        { name: 'avatarAlt', type: 'string', default: 'name', description: 'Alt text of the avatar image.' },
        { name: 'links', type: 'TeamMemberLink[]', default: '[]', description: 'Links; every entry needs a non-empty `href` and `label` (a contract violation otherwise). With `icon` the link is icon-only and `label` becomes its aria-label.' },
        { name: 'variant', type: "'card' | 'minimal' | 'centered' | 'horizontal'", default: "'card'", description: 'Layout; unknown values fall back to `card`.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Spacing, avatar size (card 64, 80 or 112px; minimal and centered 80, 96 or 128px; horizontal 48, 64 or 80px), name and text scale, card padding. Unknown values fall back to `md`.' },
        { name: 'shape', type: "'circle' | 'rounded' | 'square'", default: "'circle'", description: 'Avatar shape, forwarded to Avatar. The `name` and `avatarAlt` contract is the same in every shape. Unknown values fall back to `circle`.' },
        { name: 'align', type: "'start' | 'center'", default: "'start'", description: '`center` centres the avatar, text and links of the `card` and `minimal` layouts. Ignored by `centered` (already centred) and `horizontal`. Unknown values fall back to `start`.' },
        { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of the name.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
  ],
  slots: [
    { name: 'default', description: 'TeamGrid: custom cards, replaces `items` rendering. TeamMemberCard: replaces the bio text.' },
    { name: 'avatar', description: 'TeamMemberCard only: replaces the Avatar.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<TeamGrid :items="[{ name: 'Sample person A', role: 'Role title' }, { name: 'Sample person B', role: 'Role title' }]" :columns="2" />`,
    },
    {
      title: 'Card variant with photos and links',
      description: 'Default. Bordered surface, photo or initials, icon links.',
      code: `<TeamGrid variant="card" :columns="3" :items="team" />`,
      script: `const team = [{ name: 'Sample person A', role: 'Role title', bio: '...', avatar: '/a.jpg', avatarAlt: 'Portrait of sample person A', links: [{ label: 'Email sample person A', href: 'mailto:name@example.com', icon: faEnvelope }] }, ...]`,
      state: () => ({ team }),
    },
    {
      title: 'Minimal variant',
      description: 'No surface; for dense About pages that already sit on a card.',
      code: `<TeamGrid variant="minimal" :columns="4" :items="team" />`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Centered variant',
      description: 'Stacked and centred; good for leadership blocks with large photos.',
      code: `<TeamGrid variant="centered" :columns="4" :items="team" />`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Horizontal variant',
      description: 'Avatar beside the text; works best with 2 columns and longer bios.',
      code: `<TeamGrid variant="horizontal" :columns="2" :items="team" />`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size`: sm, md (default) and lg on the card layout.',
      code: `<div class="grid gap-8">
  <TeamGrid v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s" :columns="2" :items="team.slice(0, 2)" />
</div>`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Avatar shapes',
      description: 'Gallery of `shape`: circle (default), rounded and square. Initials replace a missing photo in every shape.',
      code: `<div class="grid gap-8">
  <TeamGrid v-for="s in ['circle', 'rounded', 'square']" :key="s" :shape="s" variant="horizontal" :columns="2" :items="team.slice(0, 2)" />
</div>`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Gap',
      description: 'Gallery of `gap` on the minimal layout: sm, md (default) and lg.',
      code: `<div class="grid gap-10">
  <TeamGrid v-for="g in ['sm', 'md', 'lg']" :key="g" :gap="g" variant="minimal" :columns="4" :items="team" />
</div>`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Align',
      description: '`center` on the card and minimal layouts. A member can set its own `align`, which wins over the grid.',
      code: `<div class="grid gap-8">
  <TeamGrid align="center" :columns="3" :items="team.slice(0, 3)" />
  <TeamGrid align="center" variant="minimal" :columns="3" :items="mixed" />
</div>`,
      script: `const team = [...]`,
      state: () => ({ team, mixed: [{ ...team[0] }, { ...team[1], align: 'start' }, { ...team[2] }] }),
    },
    {
      title: 'Combined: large, square avatars, centred',
      code: `<TeamGrid size="lg" shape="square" align="center" gap="lg" :columns="2" :items="team.slice(0, 2)" />`,
      script: `const team = [...]`,
      state: () => ({ team }),
    },
    {
      title: 'Realistic: section with heading and custom cards',
      code: `<section class="space-y-10">
  <SectionHeading title="Replace this heading with a claim about the team" description="One sentence of supporting context." />
  <TeamGrid :columns="3">
    <TeamMemberCard name="Sample person A" role="Role title" bio="One or two sentences about this person." variant="centered" :links="links" />
    <TeamMemberCard name="Sample person B" role="Role title" variant="centered" />
  </TeamGrid>
</section>`,
      script: `const links = [{ label: 'Email sample person A', href: 'mailto:name@example.com', icon: faEnvelope }]`,
      state: () => ({ links: team[0].links }),
    },
  ],
  a11y: [
    'With `items` the root is a native `<ul>` and each member an `<li>` (role="listitem" is never put on the card: `role` is the job-title prop). With the default slot, or when empty, the root is a plain `<div>`; wrap your cards in `<li>` inside your own `<ul>` for list semantics.',
    'Names render as headings (`level`, default 3); keep levels consistent with the surrounding section.',
    'Icon-only links use `label` as aria-label; the avatar is labelled with `avatarAlt` or the name (initials fallback is exposed as an image with the name). Every link is at least 24px square and 44px on coarse pointers, with the shared focus ring.',
    '`size`, `shape`, `align` and `gap` change spacing and alignment only. The avatar keeps its label (`avatarAlt` or the name) in every shape, names stay headings, and link targets keep their 24px (44px coarse) minimum at every size.',
    'Links with `external` open in a new tab with rel="noopener noreferrer". One column at 320px, two from `sm`; long names and bios wrap.',
  ],
  requires: [
    'Throws a ContractError when a member has no non-empty `name`, or a link has no non-empty `label` (the accessible name of an icon-only link) or `href`. Applies to `items` (the message names the first failing index) and to `TeamMemberCard`.',
  ],
  related: ['SectionHeading', 'Testimonial', 'Avatar', 'SocialLinks'],
  llmNotes: [
    'Use `items` unless cards need custom content; pass icons as FontAwesome IconDefinition objects.',
    'Use real names only with permission; never invent people. Pick `variant="card"` by default, `centered` for leadership with big photos, `minimal` on already-carded pages, `horizontal` with `columns=2` and long bios.',
    'Keep one `size` and one `shape` per grid. `align="center"` only moves `card` and `minimal`.',
    'Pick `columns` 3 for 3/6/9 people, 4 for 4/8, 2 for 2/4.',
    'Every icon-only link needs a `label`; it becomes the accessible name.',
    'Pair with SectionHeading above it.',
  ],
}
export default doc
