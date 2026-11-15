import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const demoSteps = `[
  { target: '#tour-demo-search', title: 'Search', description: 'Find anything in your workspace.' },
  { target: '#tour-demo-create', title: 'Create', description: 'Start a new project from here.', placement: 'right' },
  { target: '#tour-demo-missing', title: 'All set', description: 'This step has no target, so the card is centred.' },
]`

const doc: ComponentDoc = {
  name: 'Tour',
  group: 'overlays',
  subgroup: 'Guided tours',
  summary: 'Step-by-step coach marks that spotlight page elements and explain them in a positioned card.',
  description:
    'Use `Tour` for first-run onboarding and feature announcements. Each step points at an element (`target`: CSS selector, element or getter); a spotlight dims the page around it and a card with title, description, progress and Back/Next/Skip/Finish controls is placed on the requested side, flipping and clamping to stay inside the viewport. Steps whose target element is missing or hidden show a centred card without a spotlight, so a tour never breaks when the UI changes; pass `target: null` for a step that is centred on purpose. The tour renders nothing while closed. Control it with `v-model:open` and `v-model:step`, or leave both uncontrolled and call the exposed `start()`. The overlay is teleported to `body` (disable with `:teleport="false"`). It does not lock page scroll. `variant` changes the card: `compact` tightens the padding and gap and sets the description in small text; `dots` replaces the "2 / 5" text with one dot per step (the text stays for screen readers). For a single anchored hint use `Popover`; for blocking decisions use `Dialog`.',
  status: 'beta',
  props: [
    { name: 'steps', type: 'TourStep[]', default: '[]', description: 'Ordered steps: `{ target, title, description?, placement? }`. `title` is required. `target` is a selector string, HTMLElement or `() => HTMLElement | null`, or `null` for a step that is meant to be centred. An empty list renders nothing.' },
    { name: 'open', type: 'boolean', description: 'Whether the tour shows (v-model:open). Uncontrolled when omitted.' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial open state when uncontrolled.' },
    { name: 'step', type: 'number', description: 'Zero-based current step (v-model:step). Clamped into range; NaN becomes 0. Uncontrolled when omitted.' },
    { name: 'defaultStep', type: 'number', default: '0', description: 'Initial step when uncontrolled.' },
    { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'", description: 'Default card side. A step `placement` overrides it. Flips to the opposite side when it does not fit.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Card width (16, 20 or 24rem, capped to the viewport). Unknown values fall back to md.' },
    { name: 'variant', type: "'default' | 'compact' | 'dots'", default: "'default'", description: 'Card look: compact is tighter, dots shows one dot per step instead of the progress text (unknown values fall back to default). Adds data-variant when not default.' },
    { name: 'offset', type: 'number', default: '12', description: 'Gap in px between spotlight and card.' },
    { name: 'padding', type: 'number', default: '6', description: 'Extra px of spotlight around the target.' },
    { name: 'showProgress', type: 'boolean', default: 'true', description: 'Show the "2 / 5" progress text.' },
    { name: 'showSkip', type: 'boolean', default: 'true', description: 'Show Skip (hidden on the last step).' },
    { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Esc skips the tour.' },
    { name: 'closeOnOverlayClick', type: 'boolean', default: 'false', description: 'Clicking the dimmed backdrop skips the tour.' },
    { name: 'scrollIntoView', type: 'boolean', default: 'true', description: 'Scroll the target to the centre when its step shows (instant under reduced motion).' },
    { name: 'teleport', type: 'boolean', default: 'true', description: 'Teleport the overlay to `body`; false renders in place.' },
    { name: 'nextLabel', type: 'string', default: "'Next'", description: 'Next button label.' },
    { name: 'prevLabel', type: 'string', default: "'Back'", description: 'Back button label.' },
    { name: 'skipLabel', type: 'string', default: "'Skip'", description: 'Skip button label.' },
    { name: 'finishLabel', type: 'string', default: "'Finish'", description: 'Label of the Next button on the last step.' },
    { name: 'progressFormat', type: '(current: number, total: number) => string', default: '`${current} / ${total}`', description: 'Builds the progress text (1-based). Use it to localise.' },
    { name: 'cardClass', type: 'string | object | array', description: 'Extra classes for the card, merged last.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the overlay root (`data-slot="tour"`).' },
  ],
  slots: [
    { name: 'title', props: '{ step: TourStep, index: number, total: number }', description: 'Replace the step title content.' },
    { name: 'description', props: '{ step: TourStep, index: number, total: number }', description: 'Replace the step description content (rendered even when the step has none).' },
  ],
  emits: [
    { name: 'update:open', payload: '[value: boolean]', description: 'Open state changed (v-model:open).' },
    { name: 'update:step', payload: '[value: number]', description: 'Step changed (v-model:step). Reset to 0 on skip/finish.' },
    { name: 'next', payload: '[index: number]', description: 'Moved forward; payload is the new index.' },
    { name: 'prev', payload: '[index: number]', description: 'Moved back; payload is the new index.' },
    { name: 'skip', payload: '[index: number]', description: 'Dismissed early (Skip, Esc, backdrop); payload is the step it was skipped at.' },
    { name: 'finish', description: 'Next pressed on the last step.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Starts closed; the button opens it.',
      code: `<div class="flex items-center gap-3">
  <Button size="sm" @click="open = true">Take the tour</Button>
  <input id="tour-demo-search" class="rounded-md border px-2 py-1 text-sm" placeholder="Search" aria-label="Search" />
  <Button id="tour-demo-create" size="sm" variant="outline">Create</Button>
</div>
<Tour v-model:open="open" v-model:step="step" :steps="steps" />`,
      script: `import { ref } from 'vue'
const open = ref(false)
const step = ref(0)
const steps = ${demoSteps}`,
      state: () => ({
        open: ref(false),
        step: ref(0),
        steps: [
          { target: '#tour-demo-search', title: 'Search', description: 'Find anything in your workspace.' },
          { target: '#tour-demo-create', title: 'Create', description: 'Start a new project from here.', placement: 'right' },
          { target: '#tour-demo-missing', title: 'All set', description: 'This step has no target, so the card is centred.' },
        ],
      }),
    },
    {
      title: 'Events and custom labels',
      description: 'Uncontrolled: call `start()` through a template ref and react to events.',
      code: `<div class="flex items-center gap-3">
  <Button size="sm" @click="tour.start()">Start</Button>
  <span id="tour-demo-badge" class="rounded-full bg-muted px-2 py-0.5 text-xs">New</span>
  <span class="text-sm text-muted-foreground">{{ log || 'No events yet' }}</span>
</div>
<Tour ref="tour" :steps="steps" next-label="Continue" prev-label="Previous" finish-label="Done" skip-label="Not now"
  :progress-format="(c, t) => 'Step ' + c + ' of ' + t"
  @next="log = 'next ' + $event" @prev="log = 'prev ' + $event" @skip="log = 'skipped at ' + $event" @finish="log = 'finished'" />`,
      script: `import { ref } from 'vue'
const tour = ref()
const log = ref('')
const steps = [
  { target: '#tour-demo-badge', title: 'New badge', description: 'Marks fresh features.', placement: 'top' },
  { target: null, title: 'Welcome', description: 'A step with target null is centred.' },
]`,
      state: () => ({
        tour: ref(),
        log: ref(''),
        steps: [
          { target: '#tour-demo-badge', title: 'New badge', description: 'Marks fresh features.', placement: 'top' },
          { target: null, title: 'Welcome', description: 'A step with target null is centred.' },
        ],
      }),
    },
    {
      title: 'Size: sm',
      code: `<Button size="sm" variant="outline" @click="open = true">Small card</Button>
<span id="tour-demo-sm" class="ml-3 text-sm">Anchor</span>
<Tour v-model:open="open" size="sm" :steps="steps" />`,
      script: `import { ref } from 'vue'
const open = ref(false)
const steps = [{ target: '#tour-demo-sm', title: 'Compact', description: 'Narrow 16rem card.' }]`,
      state: () => ({ open: ref(false), steps: [{ target: '#tour-demo-sm', title: 'Compact', description: 'Narrow 16rem card.' }] }),
    },
    {
      title: 'Variant: compact',
      code: `<Button size="sm" variant="outline" @click="open = true">Compact card</Button>
<span id="tour-demo-compact" class="ml-3 text-sm">Anchor</span>
<Tour v-model:open="open" variant="compact" :steps="steps" />`,
      script: `import { ref } from 'vue'
const open = ref(false)
const steps = [{ target: '#tour-demo-compact', title: 'Tight', description: 'Less padding and small description text.' }]`,
      state: () => ({ open: ref(false), steps: [{ target: '#tour-demo-compact', title: 'Tight', description: 'Less padding and small description text.' }] }),
    },
    {
      title: 'Variant: dots',
      description: 'One dot per step replaces the progress text visually; screen readers still hear "2 / 3".',
      code: `<Button size="sm" variant="outline" @click="open = true">Dots progress</Button>
<span id="tour-demo-dots" class="ml-3 text-sm">Anchor</span>
<Tour v-model:open="open" variant="dots" :steps="steps" />`,
      script: `import { ref } from 'vue'
const open = ref(false)
const steps = [
  { target: '#tour-demo-dots', title: 'First step', description: 'The filled dot marks this step.' },
  { target: null, title: 'Second step', description: 'The filled dot moves on.' },
  { target: null, title: 'Third step', description: 'Last step.' },
]`,
      state: () => ({
        open: ref(false),
        steps: [
          { target: '#tour-demo-dots', title: 'First step', description: 'The filled dot marks this step.' },
          { target: null, title: 'Second step', description: 'The filled dot moves on.' },
          { target: null, title: 'Third step', description: 'Last step.' },
        ],
      }),
    },
    {
      title: 'Size: lg',
      code: `<Button size="sm" variant="outline" @click="open = true">Large card</Button>
<span id="tour-demo-lg" class="ml-3 text-sm">Anchor</span>
<Tour v-model:open="open" size="lg" placement="right" :steps="steps" />`,
      script: `import { ref } from 'vue'
const open = ref(false)
const steps = [{ target: '#tour-demo-lg', title: 'Roomy', description: 'Wide 24rem card for longer copy.' }]`,
      state: () => ({ open: ref(false), steps: [{ target: '#tour-demo-lg', title: 'Roomy', description: 'Wide 24rem card for longer copy.' }] }),
    },
  ],
  a11y: [
    'The card is `role="dialog"` with `aria-modal`, `aria-labelledby` (title) and `aria-describedby` (description and the progress text).',
    'Focus moves to the card on open and on every step change, so the new step is announced. Tab and Shift+Tab are trapped inside the card and focus returns to the previously focused element on close.',
    'Esc skips, ArrowRight goes next (Finish on the last step), ArrowLeft goes back.',
    'With `variant="dots"` the dots are `aria-hidden` and the progress text stays in the DOM for assistive technology (the active dot is also filled, not only coloured).',
    'The spotlight and the opaque scrim panels are `aria-hidden`. The spotlight outline stays visible in forced-colors mode. Motion is disabled under `prefers-reduced-motion` and smooth scrolling falls back to instant.',
    'The page is not scroll-locked and no body styles are touched. Listeners are removed on close and unmount. The card is capped at the viewport width minus 1rem.',
  ],
  related: ['Popover', 'Dialog', 'Tooltip', 'Sheet'],
  requires: [
    'Throws a ContractError when a step has no `title` (or a `title` slot), when a step has no `target` (use `target: null` for a deliberately centred step), or when the tour dialog ends up without an accessible name. It is checked each time the tour opens.',
  ],
  llmNotes: [
    'Bind `v-model:open` (and optionally `v-model:step`); the tour renders nothing until open.',
    'Give targets stable ids or pass a getter; a `target` that does not match an element degrades to a centred card, never an error; a step with no `target` key at all throws, so use `target: null` for a centred step.',
    'Keep titles short and put detail in `description`; do not put interactive content in the card.',
    'Use variant="compact" for short steps and variant="dots" for long tours where the count matters less than position; unknown size/variant values fall back to md/default.',
    'Prefer `placement` on the step for tricky layouts; the card auto-flips and clamps to the viewport.',
    'Tour does not lock scroll and does not block keyboard shortcuts of the page other than Esc/Arrow keys while open.',
  ],
}

export default doc
