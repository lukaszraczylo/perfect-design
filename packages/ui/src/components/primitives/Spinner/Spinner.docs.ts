import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Spinner',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Small rotating SVG that shows work in progress, with an accessible label or as a purely visual mark.',
  description:
    'Use `Spinner` for an indeterminate wait of unknown length inside a control or next to a label. By default it is a `progressbar` named by `label`. Set `decorative` when the surrounding element already announces the busy state (a loading button, a status region), so the spinner is hidden from assistive tech.\n\nUse `ProgressRing` when the progress is known. Use `LoadingState` for a whole region that is loading. `Button` with `loading` already draws a decorative spinner.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', default: "'Loading'", description: 'Accessible name of the spinner. Ignored when `decorative`.' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'Hide the spinner from assistive tech (`aria-hidden`, no role). Use it when a parent already announces the busy state.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Diameter: 12, 16, 20, 24 or 32px. Unknown values fall back to md.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes. The spinner uses `currentColor`.' },
  ],
  examples: [
    {
      title: 'Sizes',
      description: 'The spinner takes the text colour of its parent.',
      code: `<div class="flex items-center gap-4 text-primary">
  <Spinner size="xs" />
  <Spinner size="sm" />
  <Spinner size="md" />
  <Spinner size="lg" />
  <Spinner size="xl" />
</div>`,
    },
    {
      title: 'Next to a label',
      description: 'A labelled spinner and a decorative one beside text that already says what is happening.',
      code: `<div class="flex flex-col gap-3 text-sm">
  <span class="inline-flex items-center gap-2"><Spinner label="Saving changes" class="text-primary" /></span>
  <span role="status" class="inline-flex items-center gap-2 text-muted-foreground"><Spinner decorative size="sm" /> Syncing the sample catalogue</span>
</div>`,
    },
  ],
  a11y: [
    'Not decorative: `role="progressbar"` with `aria-label` from `label`. Give it a label that says what is loading, not just "Loading".',
    'Decorative: `aria-hidden="true"` and no role. The parent must announce the busy state, for example with `role="status"` text.',
    'Rotation slows to a pulse under `prefers-reduced-motion`.',
  ],
  related: ['ProgressRing', 'LoadingState', 'Button', 'Skeleton'],
  llmNotes: [
    'Pass `decorative` when the spinner sits inside a button or a status region that already announces the wait.',
    'Give a specific `label` when the spinner stands alone.',
    'Use `ProgressRing` or `Progress` when the amount done is known.',
  ],
  replaces: ['hand-rolled animate-spin SVG', 'shadcn-vue Spinner'],
}
export default doc
