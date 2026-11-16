import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'LoadingState',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Loading placeholder: spinner with label, or text / card / table / list / avatar-text / kpi-grid / form skeletons; optional full-page layout.',
  description:
    'Use `LoadingState` while data is on its way. Use `variant="spinner"` for short or unknown waits and the skeleton variants when the final layout is predictable, so the page does not jump: `text` (article lines), `card` (media + lines), `table` (header + rows x columns), `list` (rows with a marker, a line and a trailing value), `avatar-text` (people/comments/activity feeds), `kpi-grid` (dashboard metric tiles) and `form` (label + field pairs and a submit button). `rows` and `columns` are clamped to sensible limits.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'spinner' | 'text' | 'card' | 'table' | 'list' | 'avatar-text' | 'kpi-grid' | 'form'", default: "'spinner'", description: 'Placeholder shape. Unknown values fall back to `spinner`.' },
    { name: 'label', type: 'string', default: "'Loading…'", description: 'Visible next to the spinner, screen-reader-only for skeletons. The default slot overrides it.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Scale of the `spinner` variant: spinner, label and padding. Skeleton variants ignore it. Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'layout', type: "'stacked' | 'inline'", default: "'stacked'", description: '`inline` puts the spinner and the label in one start-aligned row (buttons-adjacent status, table footers, toolbars). Spinner variant only. Unknown values fall back to `stacked`. Non-default values add `data-layout`.' },
    { name: 'shape', type: "'rounded' | 'square' | 'pill'", default: "'rounded'", description: 'Corner shape of the skeleton placeholders: small radius, none, or fully rounded. Match the shape of the content that will replace them. The spinner variant ignores it. Unknown values fall back to `rounded`. Non-default values add `data-shape`.' },
    { name: 'fullPage', type: 'boolean', default: 'false', description: 'Fill the viewport height and centre the content.' },
    { name: 'rows', type: 'number', default: '3', description: 'Skeleton text lines, table body rows, list rows, avatar rows or form fields, clamped to 1-50.' },
    { name: 'columns', type: 'number', default: '4', description: 'Skeleton table columns, or the number of `kpi-grid` tiles, clamped to 1-12.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces the label text.' }],
  examples: [
    { title: 'Spinner', code: `<LoadingState label="Loading projects…" />` },
    {
      title: 'Skeletons',
      code: `<div class="grid gap-6">
  <LoadingState variant="text" :rows="4" label="Loading article" />
  <LoadingState variant="card" :rows="2" label="Loading card" />
  <LoadingState variant="table" :rows="4" :columns="3" label="Loading table" />
</div>`,
    },
    {
      title: 'Size and layout (spinner)',
      description: '`sm` and `inline` for compact areas, `lg` for a whole panel.',
      code: `<div class="grid gap-4">
  <LoadingState size="sm" label="Loading comments" />
  <LoadingState layout="inline" size="sm" label="Saving changes" />
  <LoadingState size="lg" label="Loading the report" />
</div>`,
    },
    {
      title: 'Skeleton shape',
      description: '`square` for tables and code, `pill` for chips and rounded media.',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <LoadingState variant="list" shape="square" :rows="2" label="Loading rows" />
  <LoadingState variant="avatar-text" shape="pill" :rows="2" label="Loading people" />
</div>`,
    },
    {
      title: 'Skeleton: list',
      description: 'Rows with a marker, a line and a trailing value (settings lists, file lists).',
      code: `<LoadingState variant="list" :rows="4" label="Loading files" />`,
    },
    {
      title: 'Skeleton: avatar-text',
      description: 'Avatar plus two lines per row (people, comments, activity).',
      code: `<LoadingState variant="avatar-text" :rows="3" label="Loading members" />`,
    },
    {
      title: 'Skeleton: kpi-grid',
      description: 'Dashboard metric tiles; `columns` sets the tile count.',
      code: `<LoadingState variant="kpi-grid" :columns="4" label="Loading metrics" />`,
    },
    {
      title: 'Skeleton: form',
      description: 'Label + field pairs and a submit button; `rows` sets the field count.',
      code: `<LoadingState variant="form" :rows="3" label="Loading form" class="max-w-md" />`,
    },
  ],
  a11y: [
    'role="status" (a polite live region). It has no aria-busy: the region exists only while loading.',
    'Skeleton blocks are aria-hidden. The label is announced through an sr-only element.',
    'Size, layout and shape only change geometry: every combination keeps the same status region and the announced label. The inline layout keeps the label visible next to the spinner.',
    'The pulse animation is disabled under prefers-reduced-motion.',
  ],
  related: ['EmptyState', 'ErrorState', 'Spinner'],
  requires: [
    'Throws a ContractError when a `LoadingState` has a blank `label` and no default slot (the label is what screen readers announce, also for skeletons).',
  ],
  llmNotes: ['Use `layout="inline"` for loading status inside toolbars and footers; use `shape` to match the skeleton to the final content.', 'Match the skeleton variant to the final layout: kpi-grid for metric tiles, avatar-text for people/comment lists, list for plain rows, form for settings forms.', 'Always render exactly one of LoadingState / ErrorState / EmptyState / content for a data region.'],
  replaces: ['hand-rolled LoadingState markup in app code'],
}
export default doc
