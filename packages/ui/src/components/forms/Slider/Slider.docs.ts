import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Slider',
  group: 'forms',
  subgroup: 'Selection',
  summary: 'Pick a number or a numeric range by dragging a thumb or using the keyboard.',
  description:
    'Use `Slider` for approximate numeric choices where the exact value matters less than the position (volume, price range, opacity). The `v-model` is ALWAYS an array of numbers (reka-ui convention): `[40]` for one thumb, `[20, 80]` for a range, one thumb is rendered per value. Use `NumberInput` when the user must type or read an exact value. Name each thumb with `aria-label` or `thumb-labels`, or wrap the slider in a `Field` with a label.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'number[] | null', description: 'Controlled values, one per thumb. Always an array, even for a single thumb.' },
    { name: 'defaultValue', type: 'number[]', default: '[min]', description: 'Initial values when uncontrolled.' },
    { name: 'min', type: 'number', default: '0', description: 'Lowest selectable value.' },
    { name: 'max', type: 'number', default: '100', description: 'Highest selectable value.' },
    { name: 'step', type: 'number', default: '1', description: 'Snap increment for drag and keyboard. Fractional steps are float-safe.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout direction. Vertical needs a parent with a height, or it falls back to a minimum of 11rem. Unknown values fall back to horizontal.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Track thickness (4 / 6 / 10 px). The thumb is 24px in `sm` and `md` and 28px in `lg`, so the target size rule holds in every size. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'primary'", description: 'Colour of the filled range and the thumb border. `neutral` uses the foreground colour. `invalid` always wins and uses the destructive colour, so an error never depends on the tone. Unknown values fall back to `primary`.' },
    { name: 'marks', type: 'boolean | number[] | Array<{ value: number; label?: string }>', default: 'false', description: 'Tick marks under the track (beside it when vertical). `true` marks every step, or only the two ends when there would be more than 50 intervals. Numbers mark those values; objects also print `label`. Values outside `min`..`max` and duplicates are dropped. Marks are decorative (`aria-hidden`); a thumb that sits exactly on a labelled mark announces that label as its value text.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Shows the current value in a bubble above each thumb (beside it when vertical). The bubble is decorative: the thumb already carries `aria-valuenow`. Thumbs that sit close together overlap their bubbles, so use it for single values or well separated ranges.' },
    { name: 'formatValue', type: '(value: number) => string', description: 'Formats the bubble text and sets `aria-valuetext` on the thumb, e.g. `(v) => v + \'%\'`. `aria-valuenow` stays the raw number.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks pointer and keyboard interaction and removes thumbs from the tab order.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid on thumbs and applies destructive styling.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Marks the hidden form input as required.' },
    { name: 'inverted', type: 'boolean', default: 'false', description: 'Flips the direction (max at the start edge).' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction. In `rtl` the minimum is at the right edge: thumbs, fill, marks and the value bubble mirror, and ArrowLeft moves the thumb towards the maximum. Unset follows the nearest ancestor `dir` (or the document `dir`) once mounted and tracks later changes; set it explicitly in server-rendered pages, whose first paint cannot know the ancestor. Unknown values are ignored.' },
    { name: 'minStepsBetweenThumbs', type: 'number', default: '0', description: 'Minimum distance between range thumbs, measured in steps.' },
    { name: 'name', type: 'string', description: 'Form field name. Inside a native form hidden inputs `name[0]`, `name[1]`... are rendered.' },
    { name: 'ariaLabel', type: 'string', description: 'Accessible name for every thumb. With several thumbs the index is appended ("Price 1 of 2").' },
    { name: 'thumbLabels', type: 'string[]', description: 'Per-thumb accessible names, e.g. `["Minimum price", "Maximum price"]`. Wins over `ariaLabel`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: number[]]', description: 'Fires on every change while dragging or keying.' },
    { name: 'valueCommit', payload: '[value: number[]]', description: 'Fires once when an interaction finishes. Use it for expensive work such as requests or filtering.' },
  ],
  examples: [
    {
      title: 'Single value',
      script: `const volume = ref([40])`,
      code: `<div class="flex w-64 max-w-full flex-col gap-2">
  <Slider v-model="volume" aria-label="Volume" />
  <p class="text-sm text-muted-foreground tabular-nums">Volume: {{ volume[0] }}</p>
</div>`,
      state: () => ({ volume: ref([40]) }),
    },
    {
      title: 'Price range',
      description: 'Two values render two thumbs; label each one for assistive tech.',
      script: `const price = ref([200, 800])`,
      code: `<Field label="Price range" :hint="\`From \${price[0]} to \${price[1]}\`" class="w-72 max-w-full tabular-nums">
  <Slider v-model="price" :min="0" :max="1000" :step="50" :thumb-labels="['Minimum price', 'Maximum price']" />
</Field>`,
      state: () => ({ price: ref([200, 800]) }),
    },
    {
      title: 'Value bubble and formatted value',
      description: 'The bubble repeats the value visually; the thumb announces `aria-valuetext`. Sample values.',
      script: `const opacity = ref([60])`,
      code: `<div class="w-64 max-w-full">
  <Slider v-model="opacity" show-value :format-value="(v) => v + '%'" aria-label="Opacity" />
</div>`,
      state: () => ({ opacity: ref([60]) }),
    },
    {
      title: 'Tick marks and labelled marks',
      description: 'Marks are decorative. When the thumb rests on a labelled mark, its value text is that label.',
      script: `const level = ref([50])
const labelled = [{ value: 0, label: 'Low' }, { value: 50, label: 'Medium' }, { value: 100, label: 'High' }]`,
      code: `<div class="grid w-72 max-w-full gap-8 px-1">
  <Slider v-model="level" :step="25" marks aria-label="Sample level with ticks" />
  <Slider v-model="level" :step="25" :marks="labelled" aria-label="Sample level with labels" />
</div>`,
      state: () => ({
        level: ref([50]),
        labelled: [
          { value: 0, label: 'Low' },
          { value: 50, label: 'Medium' },
          { value: 100, label: 'High' },
        ],
      }),
    },
    {
      title: 'Sizes',
      description: 'Track thickness grows with `size`; the thumb never drops below 24px.',
      code: `<div class="grid w-64 max-w-full gap-4">
  <Slider size="sm" :default-value="[30]" aria-label="Small" />
  <Slider size="md" :default-value="[50]" aria-label="Medium" />
  <Slider size="lg" :default-value="[70]" aria-label="Large" />
</div>`,
    },
    {
      title: 'Tones',
      description: 'Primary, success, danger, neutral and info. `invalid` overrides the tone with the destructive colour.',
      code: `<div class="grid w-64 max-w-full gap-4">
  <Slider tone="primary" :default-value="[40]" aria-label="Primary tone" />
  <Slider tone="success" :default-value="[55]" aria-label="Success tone" />
  <Slider tone="danger" :default-value="[70]" aria-label="Danger tone" />
  <Slider tone="neutral" :default-value="[45]" aria-label="Neutral tone" />
  <Slider tone="info" :default-value="[60]" aria-label="Info tone" />
</div>`,
    },
    {
      title: 'Vertical',
      description: 'Up and Right raise the value, Down and Left lower it. Give the parent a height.',
      script: `const gain = ref([35])`,
      code: `<div class="flex h-56 items-stretch gap-12">
  <Slider v-model="gain" orientation="vertical" show-value :marks="[{ value: 0, label: '0' }, { value: 50, label: '50' }, { value: 100, label: '100' }]" aria-label="Sample gain" />
  <Slider :default-value="[70]" orientation="vertical" tone="success" size="lg" aria-label="Sample level" />
</div>`,
      state: () => ({ gain: ref([35]) }),
    },
    {
      title: 'Right to left',
      description: 'The first slider inherits `dir="rtl"` from its container, the second sets the `dir` prop itself. The minimum is at the right edge, the fill grows leftwards and the marks and bubble mirror. Sample content.',
      script: `const level = ref([50])
const labelled = [{ value: 0, label: 'منخفض' }, { value: 50, label: 'متوسط' }, { value: 100, label: 'مرتفع' }]`,
      code: `<div dir="rtl" lang="ar" class="grid w-72 max-w-full gap-10 px-1">
  <Slider v-model="level" :step="25" :marks="labelled" aria-label="مستوى الصوت (وراثة الاتجاه)" />
  <Slider dir="rtl" :default-value="[30, 70]" show-value :thumb-labels="['الحد الأدنى', 'الحد الأقصى']" />
</div>`,
      state: () => ({
        level: ref([50]),
        labelled: [
          { value: 0, label: 'منخفض' },
          { value: 50, label: 'متوسط' },
          { value: 100, label: 'مرتفع' },
        ],
      }),
    },
    {
      title: 'Disabled and invalid',
      code: `<div class="flex w-64 max-w-full flex-col gap-4">
  <Slider :default-value="[30]" disabled aria-label="Locked" />
  <Slider :default-value="[90]" invalid aria-label="Too high" />
</div>`,
    },
  ],
  a11y: [
    'Each thumb is a `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-orientation`.',
    'Keyboard: in left-to-right, ArrowRight/ArrowUp raise the value and ArrowLeft/ArrowDown lower it by `step`; in right-to-left the arrows follow the thumb on screen, so ArrowLeft raises and ArrowRight lowers (ArrowUp/ArrowDown are unchanged). Shift+Arrow and PageUp/PageDown take larger steps, Home/End jump to the bounds. Tab moves between thumbs of a range.',
    'Name each thumb with `aria-label` or `thumb-labels`. Inside a `Field` with a label, thumbs without their own label are named by the Field label through `aria-labelledby` (a `label for` cannot name a slider); range thumbs add reka-ui\'s "Minimum"/"Maximum".',
    'Inside `Field` the first thumb receives the field id and aria-describedby; invalid sets aria-invalid on every thumb.',
    'Targets: thumbs are 24px, and on coarse pointers the whole track area is at least 44px tall, so a tap anywhere on it moves the nearest thumb.',
    'Marks and the value bubble are `aria-hidden` and decorative. `formatValue` and labelled marks set `aria-valuetext`; `aria-valuenow` always stays the number. Every size keeps a 24px thumb, and the bubble and marks never take pointer events.',
    'The tone is not the only signal of state: the thumb position, the filled range length and `aria-valuenow` carry the value, and `invalid` adds `aria-invalid`. The slider follows the reading direction: `dir="rtl"` (the prop, or the nearest ancestor and then the document `dir`) puts the minimum at the right edge and mirrors the thumbs, the fill, the marks and the value bubble. `inverted` flips it again.',
    'Forced-colors: track, range and thumb keep their token colours (`forced-color-adjust: none`) and the focus ring falls back to an outline. `disabled` dims the slider and removes the thumbs from the tab order.',
  ],
  related: ['NumberInput', 'Field', 'Progress', 'Rating'],
  requires: [
    'Throws a ContractError when a thumb has no accessible name: no `aria-label`, `thumb-labels` entry or `Field` label.',
    'Throws a ContractError when `modelValue` or `defaultValue` is set but is not an array of numbers (use `ref([40])`, not `ref(40)`).',
  ],
  llmNotes: [
    'v-model is ALWAYS number[]: use `v-model="vol"` with `ref([40])`, never `ref(40)`.',
    'Always set `aria-label` (single) or `thumb-labels` (range), or wrap in `Field` with a label; an unnamed thumb raises a ContractError.',
    'Use @value-commit, not update:modelValue, for network requests.',
    'Use NumberInput when users need to type an exact number.',
    'Use `tone` for meaning (success, danger) and `size` for density; `invalid` always paints destructive, whatever the tone.',
    'Set `dir="rtl"` (or put the slider inside a `dir="rtl"` container) on right-to-left pages; do not mirror it with CSS transforms. In server-rendered pages pass `dir` explicitly.',
    'Use `marks` for ticks (numbers) or labelled stops (`{ value, label }`) and `show-value` with `format-value` to show units; both are decorative, so keep the value in a visible label too when it matters.',
  ],
  replaces: ['shadcn-vue Slider', 'ad-hoc <input type="range"> usage'],
}
export default doc
