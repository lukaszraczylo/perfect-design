import type { ComponentDoc } from '../../../docs-types'
import { sampleImage } from '../shared/sample'

const steps = [
  { title: 'Install the package', description: 'Add @perfect-design/ui with pnpm.' },
  { title: 'Import the theme', description: 'One CSS import wires up the tokens.' },
  { title: 'Register the source path', description: 'Tailwind needs the library path in an @source line to see the component classes.' },
]
const shot = sampleImage('16/9')
const mediaSteps = [
  { title: 'Open the catalogue', description: 'Each component page has live examples.', media: shot, mediaAlt: 'Placeholder for a screenshot of the catalogue' },
  { title: 'Copy an example', description: 'The code next to each example mounts as shown.', media: shot, mediaAlt: 'Placeholder for a screenshot of a copied example' },
  { title: 'Adjust the props' },
]

const doc: ComponentDoc = {
  name: 'NumberedSteps',
  group: 'marketing',
  subgroup: 'Content',
  summary: 'Numbered steps for how-it-works and onboarding sequences: cards, timeline, horizontal, minimal or with media.',
  description:
    'Use to explain a short ordered process (3-6 steps). Renders a semantic `<ol>` in every variant. Numbers are kept because the steps are an ordered sequence; do not use it for lists that have no order. `variant` picks the layout: `default` (bordered card with the number beside the text), `cards` (number above the text), `timeline` (single column with a vertical connector line), `horizontal` (one row from `sm` upward with a connector between numbers), `minimal` (no boxes, large bare numbers and divider lines) and `with-media` (text next to an image per step, alternating sides on `md`+). `columns` applies to `default`, `cards` and `minimal`; the other variants are single-column or flow by step count. Show the real steps in the real product where you can (`with-media`). For feature lists without order use `FeatureGrid`; for interactive wizards use a stepper from the navigation group.',
  status: 'stable',
  props: [
    { name: 'steps', type: 'Step[]', default: '[]', description: '`{ title: string, description?: string, media?: string, mediaAlt?: string }`. `media`/`mediaAlt` are used by the `with-media` variant only.' },
    { name: 'variant', type: "'default' | 'cards' | 'timeline' | 'horizontal' | 'minimal' | 'with-media'", default: "'default'", description: 'Layout. Unknown values fall back to `default`. Reflected as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Marker size (32, 40 or 48px), title and description scale, item padding and gaps. Timeline and horizontal connector lines move with the marker. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'primary' | 'neutral' | 'success' | 'info'", default: "'primary'", description: 'Marker colour. Filled markers use `primary` / `primary-foreground`, `foreground` / `background` (neutral), `success` / `success-foreground` or `info` / `info-foreground`. The outlined timeline marker and the bare `minimal` number use the tone colour on the page background. Unknown values fall back to `primary`. Use `success` and `info` only when the colour means something; the number carries the order.' },
    { name: 'shape', type: "'circle' | 'rounded' | 'square'", default: "'circle'", description: 'Marker shape: `circle` (the original), `rounded` (6px radius) or `square`. The bare number of `minimal` has no box and ignores it. Unknown values fall back to `circle`.' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: '`center` centres the marker against the text in row layouts (`default`, `minimal`, `with-media`) and centres the whole step in `cards`. `timeline` and `horizontal` always start-align because their connector lines begin at the marker. Unknown values fall back to `start`. Reflected as `data-align`.' },
    { name: 'columns', type: '1 | 2 | 3 | 4', default: '3', description: 'Columns on large screens for `default`, `cards` and `minimal`; ignored by `timeline`, `horizontal` and `with-media`. Invalid falls back to 3.' },
    { name: 'pad', type: 'boolean', default: 'false', description: 'Two-digit numbers (01, 02...).' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of step titles; invalid falls back to 3.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root `<ol>`; wins over internal classes.' },
  ],
  slots: [
    { name: 'step', description: "Replaces a whole step's content (number, text and media) inside the `<li>`; the variant's item styling stays.", props: '{ step: Step, index: number, number: string }' },
    { name: 'media', description: 'Custom media for the `with-media` variant (video, illustration, component). Takes precedence over `step.media`; ignored by other variants.', props: '{ step: Step, index: number }' },
  ],
  examples: [
    {
      title: 'Basic: how it works',
      code: `<NumberedSteps :steps="steps" />`,
      state: () => ({ steps }),
    },
    {
      title: 'Default: vertical, padded numbers, custom step',
      code: `<NumberedSteps :columns="1" pad :steps="steps">
  <template #step="{ step, number }"><span class="font-semibold text-primary">{{ number }}</span><span>{{ step.title }}</span></template>
</NumberedSteps>`,
      state: () => ({ steps: [{ title: 'Install the package' }, { title: 'Import the theme' }] }),
    },
    {
      title: 'Cards variant, four columns',
      description: 'Number badge above the text; best for 3-4 short steps.',
      code: `<NumberedSteps variant="cards" :columns="4" pad :steps="steps" />`,
      state: () => ({
        steps: [
          { title: 'Install', description: 'Add the package.' },
          { title: 'Import', description: 'Load the theme CSS.' },
          { title: 'Register', description: 'Add the @source line.' },
          { title: 'Build', description: 'Use a component.' },
        ],
      }),
    },
    {
      title: 'Timeline variant',
      description: 'A single column with a vertical connector; ideal for onboarding checklists and roadmaps.',
      code: `<NumberedSteps variant="timeline" class="max-w-xl" :steps="steps" />`,
      state: () => ({ steps }),
    },
    {
      title: 'Horizontal variant',
      description: 'One row from `sm` upward with a connector between the numbers; stacks on mobile.',
      code: `<NumberedSteps variant="horizontal" :steps="steps" />`,
      state: () => ({ steps }),
    },
    {
      title: 'Minimal variant (no boxes)',
      description: 'Large bare numbers over divider lines; blends into editorial pages.',
      code: `<NumberedSteps variant="minimal" :columns="3" pad :steps="steps" />`,
      state: () => ({ steps }),
    },
    {
      title: 'With-media variant',
      description: 'Each step shows its image beside the text and alternates sides on `md`+. Use real screenshots with a `mediaAlt` that describes them. Steps without `media` collapse to one column.',
      code: `<NumberedSteps variant="with-media" :steps="steps" />`,
      state: () => ({ steps: mediaSteps }),
    },
    {
      title: 'With-media variant using the media slot',
      code: `<NumberedSteps variant="with-media" :steps="steps">
  <template #media="{ step, index }">
    <div class="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">Placeholder {{ index + 1 }}: {{ step.title }}</div>
  </template>
</NumberedSteps>`,
      state: () => ({ steps: [{ title: 'Open the page' }, { title: 'Copy the code' }] }),
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size`: sm, md (default) and lg, with the timeline connector following the marker.',
      code: `<div class="grid gap-8 md:grid-cols-3">
  <NumberedSteps v-for="s in ['sm', 'md', 'lg']" :key="s" variant="timeline" :size="s" :steps="short" />
</div>`,
      state: () => ({ short: [{ title: 'Install the package' }, { title: 'Import the theme' }] }),
    },
    {
      title: 'Tones',
      description: 'Gallery of `tone` on the filled marker: primary (default), neutral, success and info.',
      code: `<div class="grid gap-6">
  <NumberedSteps v-for="t in ['primary', 'neutral', 'success', 'info']" :key="t" :tone="t" :columns="2" :steps="short" />
</div>`,
      state: () => ({ short: [{ title: 'Install the package' }, { title: 'Import the theme' }] }),
    },
    {
      title: 'Tones on the timeline marker',
      description: 'The outlined marker takes the tone as border and text colour.',
      code: `<div class="grid gap-8 md:grid-cols-4">
  <NumberedSteps v-for="t in ['primary', 'neutral', 'success', 'info']" :key="t" variant="timeline" :tone="t" :steps="short" />
</div>`,
      state: () => ({ short: [{ title: 'Install the package' }, { title: 'Import the theme' }] }),
    },
    {
      title: 'Shapes',
      description: 'Gallery of `shape`: circle (default), rounded and square.',
      code: `<div class="grid gap-6">
  <NumberedSteps v-for="s in ['circle', 'rounded', 'square']" :key="s" :shape="s" :columns="2" :steps="short" />
</div>`,
      state: () => ({ short: [{ title: 'Install the package' }, { title: 'Import the theme' }] }),
    },
    {
      title: 'Align',
      description: '`start` (default) and `center` on the cards variant and on the default variant.',
      code: `<div class="grid gap-6">
  <NumberedSteps variant="cards" align="center" :columns="3" :steps="steps" />
  <NumberedSteps align="center" :columns="1" :steps="short" />
</div>`,
      state: () => ({ steps, short: [{ title: 'Install the package', description: 'Add @perfect-design/ui with pnpm, then check the version in package.json.' }, { title: 'Import the theme' }] }),
    },
    {
      title: 'Combined: small, success, square, minimal',
      code: `<NumberedSteps variant="minimal" size="sm" tone="success" shape="square" pad :steps="steps" />`,
      state: () => ({ steps }),
    },
  ],
  requires: [
    'Throws a ContractError when a step has an empty `title` and the `step` slot is not used (the first one is named by index).',
  ],
  a11y: [
    'Ordered list semantics in every variant; the visual number is aria-hidden and the title includes a screen-reader-only "N." prefix.',
    '`size`, `tone`, `shape` and `align` change the look only: the order, the screen-reader numbers and the aria-hidden marker are identical in every combination. `tone` never replaces the number, so colour is not the only carrier of order. Marker colours use checked token pairs (primary-foreground on primary, background on foreground, success-foreground on success, info-foreground on info; tone text on the page background for the outlined and bare markers). Marker sizes are decorative (the sequence is announced by the list), so the 24px target rule does not apply.',
    'Connector lines and marker circles are purely decorative (CSS only). They are positioned with logical offsets (`start`/`end`), so RTL mirrors them.',
    'Columns collapse to one on phones; every variant reflows at 320px. Item surfaces use a border, not a shadow.',
    'Give `mediaAlt` a real description when the image carries information; it is empty (decorative) when omitted. Custom `media` slot content owns its own accessibility.',
  ],
  related: ['FeatureGrid', 'SectionHeading', 'MediaFrame'],
  llmNotes: [
    'Use only for a real ordered sequence. Keep to 3-6 steps with short titles, and prefer showing the actual steps with `with-media`.',
    'Choose `variant`: default or cards for 3-4 equal steps, timeline for long or detailed sequences, horizontal for 3-5 very short steps on wide layouts, minimal for editorial pages, with-media when each step has a screenshot.',
    'Use `columns` equal to the step count up to 4 (default, cards, minimal only).',
    'Keep `tone` as `primary` unless the colour carries meaning (for example `success` for finished steps); use `neutral` on pages that already have a strong accent. Use one `size` per list.',
    'Use the `step` slot only when you need custom markup; you then own accessibility of the number.',
    'Prefer `step.media` for images and the `media` slot only for non-image media.',
  ],
  replaces: ['hand-rolled NumberedSteps markup in app code'],
}
export default doc
