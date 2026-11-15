import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Rating',
  group: 'forms',
  subgroup: 'Choice inputs',
  summary: 'Rating input from 0 to N icons (star, heart, circle) with half or quarter steps, tones, keyboard support and slider semantics.',
  description:
    'Use `Rating` to collect or display a score such as product reviews or quality marks. The value is a number from `0` to `max`; `0` means "no rating". Enable `allowHalf` for 0.5 steps (the left half of a star selects the half value), `clearable` to let a second click on the current value reset it, and `readonly` to display a score. Stars are inline SVG drawn with design tokens: empty stars are outlines, filled stars are solid with an ink outline, so the value does not depend on colour. For a small fixed set of labelled options prefer `SegmentedControl` or `RadioGroup`; for continuous values use `Slider`. Out-of-range, NaN or fractional values are clamped/snapped rather than rejected.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'number | null', description: 'v-model rating. `0`/`null` = none. Clamped to `0..max`, snapped to whole (or half) steps; NaN becomes 0. Uncontrolled when omitted.' },
    { name: 'max', type: 'number', default: '5', description: 'Number of stars. Floored; values below 1 or non-finite fall back to 5; capped at 100.' },
    { name: 'allowHalf', type: 'boolean', default: 'false', description: 'Allow 0.5 steps (pointer position on the star and keyboard). Shorthand for `precision` 0.5; `precision` wins when both are set.' },
    { name: 'precision', type: '1 | 0.5 | 0.25', default: '1', description: 'Smallest selectable step. Arrow keys move by it, the pointer position inside an icon snaps to it (the first quarter is 0.25, the first half 0.5), and incoming values are snapped to it. Page keys always move by one whole icon. Other numbers fall back to `allowHalf`.' },
    { name: 'icon', type: "'star' | 'heart' | 'circle' | IconDefinition", default: "'star'", description: 'Glyph that is repeated `max` times. A name selects a built-in shape; an icon definition (`{ icon: [width, height, , , path] }`) draws that icon, outlined when empty and solid when filled. Unknown names and malformed definitions fall back to the star. Icons are decorative.' },
    { name: 'tone', type: "'warning' | 'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'warning'", description: 'Fill colour of the active part. Empty icons stay outlines and the filled ones keep an ink outline, so the value never relies on colour. Unknown values fall back to `warning`.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Clicking the star (or half) that already holds the value resets to 0.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Displays the value; no hover, click or key changes. Stays focusable and sets `aria-readonly`.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction, removes from tab order, dims. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and the destructive ring. Also set by a Field with an error.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Inherited from a surrounding Field. `aria-required` is not valid on `role="slider"`, so it is not rendered; mark the requirement in the Field label.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Icon size (16 / 20 / 28 px glyph, plus 4px padding per side so every star is at least 24px; 44px on coarse pointers).' },
    { name: 'name', type: 'string', description: 'Renders a hidden input with the numeric value for native form posts.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: number]', description: 'Emitted when the rating changes (click, or Arrow, Page and Home/End keys). Not emitted when the value stays the same.' }],
  examples: [
    {
      title: 'Basic',
      script: 'const score = ref(3)',
      code: `<div class="grid gap-2">
  <Rating v-model="score" aria-label="Product rating" />
  <p class="text-sm text-muted-foreground tabular-nums">{{ score }} out of 5</p>
</div>`,
      state: () => ({ score: ref(3) }),
    },
    {
      title: 'Half stars, clearable',
      description: 'Click the left half of a star for x.5; click the current value again to clear.',
      script: 'const score = ref(2.5)',
      code: `<div class="grid gap-2">
  <Rating v-model="score" allow-half clearable aria-label="Half star rating" />
  <p class="text-sm text-muted-foreground tabular-nums">Value: {{ score }}</p>
</div>`,
      state: () => ({ score: ref(2.5) }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid gap-2">
  <Rating size="sm" :model-value="2" aria-label="Small size" />
  <Rating size="md" :model-value="3" aria-label="Medium size" />
  <Rating size="lg" :model-value="4" aria-label="Large size" />
</div>`,
    },
    {
      title: 'Quarter precision',
      description: 'Move the pointer across an icon: the first quarter is x.25, then x.5 and x.75. The arrow keys step by 0.25.',
      script: 'const score = ref(3.25)',
      code: `<div class="grid gap-2">
  <Rating v-model="score" :precision="0.25" clearable aria-label="Quarter step rating" />
  <p class="text-sm text-muted-foreground tabular-nums">Value: {{ score }}</p>
</div>`,
      state: () => ({ score: ref(3.25) }),
    },
    {
      title: 'Icons',
      description: 'Star (default), heart and circle. Pass an icon definition for any other shape.',
      script: 'const love = ref(3)',
      code: `<div class="grid gap-2">
  <Rating v-model="love" icon="heart" tone="danger" aria-label="Heart rating" />
  <Rating :model-value="2" icon="circle" tone="info" aria-label="Circle rating" />
  <Rating :model-value="4" icon="star" aria-label="Star rating" />
</div>`,
      state: () => ({ love: ref(3) }),
    },
    {
      title: 'Tones',
      description: 'The filled part takes the tone; the outline stays, so the value reads without colour.',
      code: `<div class="grid gap-2">
  <Rating :model-value="3" tone="warning" aria-label="Warning tone" />
  <Rating :model-value="3" tone="primary" aria-label="Primary tone" />
  <Rating :model-value="3" tone="success" aria-label="Success tone" />
  <Rating :model-value="3" tone="danger" aria-label="Danger tone" />
  <Rating :model-value="3" tone="neutral" aria-label="Neutral tone" />
  <Rating :model-value="3" tone="info" aria-label="Info tone" />
</div>`,
    },
    {
      title: 'Custom max',
      script: 'const level = ref(7)',
      code: `<Rating v-model="level" :max="10" aria-label="Difficulty" />`,
      state: () => ({ level: ref(7) }),
    },
    {
      title: 'Readonly, disabled and invalid',
      code: `<div class="grid gap-2">
  <Rating :model-value="3.5" allow-half readonly aria-label="Display only rating" />
  <Rating :model-value="2" disabled aria-label="Disabled rating" />
  <Rating :model-value="0" invalid aria-label="Invalid rating" />
</div>`,
    },
    {
      title: 'In a Field with validation',
      script: 'const score = ref(0)',
      code: `<Field class="max-w-sm" label="Your rating" hint="Select a star." :error="score === 0 ? 'Choose a rating' : ''" required>
  <Rating v-model="score" />
</Field>`,
      state: () => ({ score: ref(0) }),
    },
  ],
  a11y: [
    'Root has `role="slider"` with `aria-valuemin=0`, `aria-valuemax=max`, `aria-valuenow` and `aria-valuetext` ("3 out of 5"). Stars are `aria-hidden`.',
    'Keyboard: ArrowRight/ArrowUp add one `precision` step (1, 0.5 or 0.25), ArrowLeft/ArrowDown remove one, PageUp/PageDown +/-1, Home = 0, End = max. Left and Right swap in right-to-left layouts. The announced value text is the number ("2.25 out of 5") at every precision.',
    'The name comes from the surrounding Field label (wired with `aria-labelledby`, because `label for` cannot name a slider), or from your own `aria-label` / `aria-labelledby`. With none of these it throws a ContractError: the fallback name "Rating" does not say what is rated.',
    '`readonly` keeps focus and announces `aria-readonly`; `disabled` sets `aria-disabled` and leaves the tab order. `aria-required` is not rendered because `slider` does not support it.',
    'Targets: every star is at least 24px square and 44px on coarse pointers. The group wraps instead of overflowing at 320px.',
    'Filled and empty icons differ by shape (outline versus solid) for every `icon` and `tone`, so the value survives forced-colors mode and colour-blindness. The icons are `aria-hidden`; the single slider carries the name and value.',
  ],
  related: ['Slider', 'SegmentedControl', 'RadioGroup', 'Field'],
  requires: [
    'Throws a ContractError when the slider has no accessible name beyond the fallback "Rating": no `Field` label, `aria-label` or `aria-labelledby`.',
  ],
  llmNotes: [
    'Give Rating an `aria-label` or wrap it in Field with a label; without either it throws a ContractError.',
    'Use `v-model` with a number; 0 means no rating. Use `readonly` to display averages (with `allow-half` for x.5).',
    'Do not import star icons; Rating draws its own SVG glyphs from tokens. Use `icon="heart"` or `icon="circle"`, or pass an icon definition for another shape.',
    'Use `precision` (1, 0.5, 0.25) for fractional input and `allow-half` only as shorthand; use `tone` for colour and keep `readonly` for averages.',
    'Keep `max` small (<= 10); it is capped at 100.',
  ],
  replaces: ['custom star rating widgets'],
}
export default doc
