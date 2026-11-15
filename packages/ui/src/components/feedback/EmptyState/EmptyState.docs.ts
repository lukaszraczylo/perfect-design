import { faFolderOpen, faInbox } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'EmptyState',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Centred placeholder for lists, tables and views that have no content yet.',
  description:
    'Use `EmptyState` when a collection is empty (first run, no search results, cleared filters). Variants: `default` (centred, full page or large region), `card` (self-contained bordered surface), `bordered-dashed` (dashed outline, good for upload/drop zones and "add the first item" slots), `compact` (dense, for popovers, side panels and small widgets), `inline` (single row with icon, text and action, for table footers and list ends) and the `illustration` slot for custom artwork. Always say what is missing and offer the next step in the `action` slot. For failed loads use `ErrorState`; for loading use `LoadingState`.',
  status: 'stable',
  props: [
    { name: 'icon', type: 'IconDefinition', description: 'FontAwesome icon in a muted circle. Use the `icon` slot for custom artwork.' },
    { name: 'title', type: 'string', description: 'Heading. Omitted when empty.' },
    { name: 'description', type: 'string', description: 'Supporting text (max-w-md).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and type scale. `sm` for cards/popovers, `lg` for full pages.' },
    { name: 'layout', type: "'center' | 'start'", default: "'center'", description: '`start` aligns the icon, text and action to the start edge (logical, so it follows the writing direction). Use it in panels, forms and tables where a centred block looks lost. `inline` is already a start-aligned row and ignores it. Unknown values fall back to `center`. Non-default values add `data-layout`.' },
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Tint of the icon bubble. The title and description say what is empty; the tone is only a cue. Unknown values fall back to `neutral`. Non-default values add `data-tone`.' },
    { name: 'variant', type: "'default' | 'card' | 'bordered-dashed' | 'compact' | 'inline'", default: "'default'", description: 'Layout and surface. `compact` and `inline` ignore the padding of `size`. Unknown values fall back to `default`. Non-default values add `data-variant`.' },
    { name: 'titleAs', type: "'h2' | 'h3' | 'h4' | 'p' | 'div'", default: "'h3'", description: 'Element used for the title so the heading outline stays correct.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'illustration', description: 'Large custom artwork (SVG/img) rendered above everything else; can be combined with `icon`.' },
    { name: 'icon', description: 'Custom icon/illustration; overrides the `icon` prop.' },
    { name: 'title', description: 'Rich title.' },
    { name: 'description', description: 'Rich description.' },
    { name: 'action', description: 'Buttons/links for the next step.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<EmptyState :icon="faInbox" title="No messages" description="New messages appear here." />`,
      script: `import { faInbox } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faInbox }),
    },
    {
      title: 'With action and sizes',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <EmptyState size="sm" :icon="faFolderOpen" title="No projects" description="Create a project to see it listed here.">
    <template #action><Button size="sm">New project</Button></template>
  </EmptyState>
  <EmptyState size="sm" title="No projects match this filter" description="Clear the filters to see all projects.">
    <template #action><Button size="sm" variant="outline">Clear filters</Button></template>
  </EmptyState>
</div>`,
      script: `import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faFolderOpen }),
    },
    {
      title: 'Variant: card',
      description: 'Self-contained bordered surface.',
      code: `<EmptyState variant="card" :icon="faFolderOpen" title="No projects" description="Create a project to see it listed here."><template #action><Button size="sm">New project</Button></template></EmptyState>`,
      script: `import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faFolderOpen }),
    },
    {
      title: 'Variant: bordered-dashed',
      description: 'Dashed outline, ideal for upload and add-first-item slots.',
      code: `<EmptyState variant="bordered-dashed" :icon="faInbox" title="Drop files here" description="Or pick them from your computer."><template #action><Button size="sm" variant="outline">Browse files</Button></template></EmptyState>`,
      script: `import { faInbox } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faInbox }),
    },
    {
      title: 'Variant: compact',
      description: 'Dense layout for popovers, side panels and small widgets.',
      code: `<div class="w-64 rounded-md border"><EmptyState variant="compact" :icon="faInbox" title="No notifications" description="You are all caught up." /></div>`,
      script: `import { faInbox } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faInbox }),
    },
    {
      title: 'Variant: inline',
      description: 'One row: icon, text and action; for table footers and list ends.',
      code: `<EmptyState variant="inline" class="rounded-md border" :icon="faInbox" title="No invoices" description="Invoices appear here after you create one."><template #action><Button size="sm" variant="outline">Create invoice</Button></template></EmptyState>`,
      script: `import { faInbox } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faInbox }),
    },
    {
      title: 'Layout: start',
      description: 'Left-aligned (start-aligned) empty state for a panel or a form section.',
      code: `<EmptyState layout="start" variant="card" size="sm" :icon="faInbox" title="No saved filters" description="Save a filter to reuse it here."><template #action><Button size="sm" variant="outline">Save current filter</Button></template></EmptyState>`,
      script: `import { faInbox } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faInbox }),
    },
    {
      title: 'Tone',
      description: 'The icon bubble takes the tone; the title still names what is empty.',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <EmptyState tone="info" size="sm" variant="card" :icon="faInbox" title="No messages yet" />
  <EmptyState tone="success" size="sm" variant="card" :icon="faInbox" title="Nothing left to review" />
  <EmptyState tone="warning" size="sm" variant="card" :icon="faInbox" title="No backups found" />
  <EmptyState tone="danger" size="sm" variant="card" :icon="faInbox" title="No access tokens" />
</div>`,
      script: `import { faInbox } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faInbox }),
    },
    {
      title: 'Illustration slot',
      description: 'Custom artwork above the text; here an inline SVG. Any element works.',
      code: `<EmptyState title="No sources connected" description="Add a source to see data here."><template #illustration><svg viewBox="0 0 120 80" class="h-20 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="10" y="10" width="100" height="60" rx="8" /><path d="M10 50l30-20 25 15 20-12 25 17" /></svg></template><template #action><Button size="sm">Add source</Button></template></EmptyState>`,
    },
  ],
  a11y: [
    'The title renders as a heading. Choose the level with `titleAs` (`h2`, `h3` by default, `h4`) or use `p`/`div` when a heading would break the outline.',
    'The icon is decorative. The message is text. A tone only tints the icon bubble, so the title and description carry the meaning.',
    '`layout="start"` uses logical alignment (`items-start`, `text-start`), so it follows right-to-left writing; the text wraps and the illustration scales down at 320px.',
    'Actions are whatever you slot in, so give them real button or link semantics.',
  ],
  related: ['ErrorState', 'LoadingState'],
  requires: [
    'Throws a ContractError when an `EmptyState` has no `title` (or `title` slot).',
  ],
  llmNotes: ['Use `layout="start"` inside left-aligned panels (LLMSlop L7: not everything centred); use `tone` only when the empty state has a status meaning.', 'Pick `variant` by context: card/bordered-dashed for sections, compact in popovers, inline for table footers.', 'Pass decorative artwork through the `illustration` slot (give it aria-hidden or alt).', 'Always include a title; add an action when the user can fix the emptiness.', 'Use `titleAs` to keep heading levels sequential.'],
  replaces: ['hand-rolled EmptyState markup in app code'],
}
export default doc
