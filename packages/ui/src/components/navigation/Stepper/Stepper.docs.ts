import { ref } from 'vue'
import { faTruck } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Stepper',
  group: 'navigation',
  subgroup: 'Progress',
  summary: 'Shows progress through a multi-step flow, horizontal or vertical, optionally clickable.',
  description:
    'Pass a `steps` array and the 0-based `current` index (`v-model:current`). Each step is `complete`, `current` or `upcoming` by position, or set `status` explicitly (including `error`). Unknown statuses are ignored and `current` is clamped into range. With `clickable`, steps become buttons that emit `update:current`; the Stepper only shows progress, it does not render step bodies. Use `Tabs` for peer panels and `Breadcrumb` for hierarchy.',
  status: 'stable',
  props: [
    { name: 'steps', type: 'StepperStep[]', required: true, description: 'Steps `{ id?, title, description?, status?, icon?, disabled?, optional? }`.' },
    { name: 'current', type: 'number', description: 'Current step index, 0-based (v-model:current). Clamped.' },
    { name: 'defaultCurrent', type: 'number', default: '0', description: 'Initial index when uncontrolled.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout.' },
    { name: 'variant', type: "'numbered' | 'dots' | 'bar'", default: "'numbered'", description: '`numbered`: circles with the step number. `dots`: smaller circles with no numbers (a check marks complete and a cross marks error; `icon` is ignored). `bar`: one progress segment per step with a check or cross before the title. Unknown values fall back to `numbered`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Marker, title text and connector size. Unknown values fall back to `md`.' },
    { name: 'clickable', type: 'boolean', default: 'false', description: 'Render steps as buttons that emit update:current.' },
    { name: 'label', type: 'string', default: "'Progress'", description: 'aria-label of the list.' },
    { name: 'labels', type: 'Partial<Record<StepStatus, string>> & { optional?: string }', description: 'Screen-reader/status text overrides for i18n.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [{ name: 'step', description: 'Replaces the title/description block of each step.', props: '{ step: StepperStep, index: number, status: StepStatus }' }],
  emits: [{ name: 'update:current', payload: '[index: number]', description: 'A clickable step was chosen.' }],
  examples: [
    {
      title: 'Horizontal, clickable',
      script: `const current = ref(1)\nconst steps = [{ title: 'Account', description: 'Create login' }, { title: 'Profile' }, { title: 'Plan', optional: true }, { title: 'Done' }]`,
      code: `<div class="space-y-4">
  <Stepper v-model:current="current" :steps="steps" clickable />
  <div class="flex gap-2">
    <Button variant="outline" size="sm" :disabled="current === 0" @click="current--">Back</Button>
    <Button size="sm" :disabled="current === steps.length - 1" @click="current++">Next</Button>
  </div>
</div>`,
      state: () => ({
        current: ref(1),
        steps: [{ title: 'Account', description: 'Create login' }, { title: 'Profile' }, { title: 'Plan', optional: true }, { title: 'Done' }],
      }),
    },
    {
      title: 'Vertical with error and icon',
      script: `const steps = [{ title: 'Payment', status: 'error', description: 'Card declined' }, { title: 'Shipping', icon: faTruck }, { title: 'Review' }]`,
      code: `<Stepper :steps="steps" :current="1" orientation="vertical" />`,
      state: () => ({ steps: [{ title: 'Payment', status: 'error', description: 'Card declined' }, { title: 'Shipping', icon: faTruck }, { title: 'Review' }] }),
    },
    {
      title: 'Dots',
      description: 'No numbers: a smaller marker for short, familiar flows. Complete steps show a check, error steps a cross.',
      code: `<Stepper :steps="[{ title: 'Cart' }, { title: 'Address' }, { title: 'Payment' }, { title: 'Review' }]" :current="2" variant="dots" label="Checkout dots" />`,
    },
    {
      title: 'Bar, horizontal and vertical',
      description: 'One progress segment per step. Complete steps get a check before the title, the current step is announced as such.',
      code: `<div class="grid gap-6">
  <Stepper :steps="[{ title: 'Upload' }, { title: 'Review' }, { title: 'Publish' }]" :current="1" variant="bar" label="Publishing bar" />
  <Stepper :steps="[{ title: 'Upload' }, { title: 'Review', status: 'error' }, { title: 'Publish' }]" :current="1" variant="bar" orientation="vertical" label="Publishing bar vertical" />
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `sm`, `md` and `lg` for the numbered and dots variants.',
      code: `<div class="grid gap-6">
  <Stepper v-for="size in ['sm', 'md', 'lg']" :key="size" :steps="[{ title: 'First' }, { title: 'Second' }, { title: 'Third' }]" :current="1" :size="size" :label="'Numbered ' + size" />
  <Stepper v-for="size in ['sm', 'md', 'lg']" :key="'d' + size" :steps="[{ title: 'First' }, { title: 'Second' }, { title: 'Third' }]" :current="1" :size="size" variant="dots" :label="'Dots ' + size" />
</div>`,
    },
  ],
  a11y: [
    '`<ol>` with aria-label (`label`, default "Progress"); the current step has aria-current="step".',
    'Status is announced via visually hidden text ("Completed:", "Current step:", "Error:"), so state is never colour alone: complete shows a check and error shows a cross.',
    'Clickable steps are real buttons (Tab, Enter, Space); non-clickable steps are plain text and not focusable. Indicators are 32px, and button text aligns to the start edge for RTL.',
    'Connectors are decorative (aria-hidden) and logical (`ms-3.75`).',
    'Every variant keeps the same list, status text and aria-current. `dots` and `bar` markers are decorative and carry no number, so state comes from the visually hidden status text and from the check or cross (a check or cross before the title in `bar`), never from colour alone.',
    'A horizontal stepper below the `sm` breakpoint shows only the current step title and keeps the others as visually hidden text, so it fits 320px without scrolling.',
  ],
  related: ['Tabs', 'Breadcrumb', 'Pagination'],
  requires: [
    'Throws a ContractError when `steps` is empty or not an array, or a step is not an object.',
    'Throws a ContractError when a step has no non-empty `title` (unless the `step` slot draws the step).',
    'Throws a ContractError when `label` is blank, because it names the list.',
  ],
  llmNotes: ['`current` is 0-based, unlike Pagination `page`.', 'Stepper renders progress only; render the step body yourself with v-if/v-show.', 'Use `status: "error"` on a step to flag validation problems.'],
  replaces: ['hand-rolled Stepper markup in app code'],
}
export default doc
