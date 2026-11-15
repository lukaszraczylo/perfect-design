import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const SAMPLE =
  'This is sample text used to show how a long block of content collapses. It repeats on purpose so that it needs more room than the preview allows. Replace it with your own content. The toggle only appears when the text does not fit.'
const LONG = `${SAMPLE} ${SAMPLE} ${SAMPLE}`

const doc: ComponentDoc = {
  name: 'ShowMore',
  group: 'primitives',
  subgroup: 'Disclosure',
  summary: 'Collapses long content to a number of lines or a height and shows a Show more toggle only when it overflows.',
  description:
    'Use `ShowMore` for descriptions, notes and comment bodies that can be long: show the first lines and let the reader expand the rest in place. It measures the content with a `ResizeObserver` after mount and on every resize, so the toggle appears only when something is actually clipped. Short content renders without a toggle. There is no fade or gradient. For a titled section that always has a trigger use `Collapsible` or `Accordion`; to truncate a single line with no way to expand use `Text` with `truncate`.\n\nVariations:\n\n- `lines` (1 to 6) clamps by line count; `maxHeight` (`xs` 64px, `sm` 96px, `md` 128px, `lg` 192px, `xl` 256px) clamps by height and wins over `lines`.\n- `layout`: toggle `below` the content (default) or `inline`, beside it at the last line.\n- `align`: `start`, `center` or `end` for the `below` layout (logical, so right-to-left flips it).\n- `appearance`: `link` (default), `button`, `outline`. `size`: `sm`, `md`, `lg`.\n- `moreLabel` and `lessLabel`, or the `more` and `less` slots, change the toggle text. `icon` hides the chevron.\n\nState: `v-model:expanded` works controlled and uncontrolled. The `overflow` event reports when the collapsed content starts or stops overflowing.\n\nThe server render and the first client render are the collapsed content without a toggle; the toggle appears after mount, once the content has been measured. Nothing animates by default.',
  status: 'stable',
  props: [
    { name: 'lines', type: 'number', default: '3', description: 'Lines shown while collapsed, 1 to 6. Fractions are truncated; not a number or below 1 falls back to 3; above 6 is 6.' },
    { name: 'maxHeight', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", description: 'Clamp to a height preset (64px, 96px, 128px, 192px, 256px at the default spacing) instead of lines. Wins over `lines`. Unknown values are ignored.' },
    { name: 'layout', type: "'below' | 'inline'", default: "'below'", description: 'Toggle below the content, or beside it at its last line. Unknown values fall back to below.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Toggle position in the `below` layout. Unknown values fall back to start. No effect with `layout="inline"`.' },
    { name: 'appearance', type: "'link' | 'button' | 'outline'", default: "'link'", description: 'Toggle look. Unknown values fall back to link.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Toggle size (24px, 32px, 40px minimum height; 44px on coarse pointers). Unknown values fall back to md.' },
    { name: 'moreLabel', type: 'string', default: "'Show more'", description: 'Toggle text while collapsed. A blank value throws a ContractError unless the `more` slot is used.' },
    { name: 'lessLabel', type: 'string', default: "'Show less'", description: 'Toggle text while expanded. A blank value throws a ContractError unless the `less` slot is used.' },
    { name: 'icon', type: 'boolean', default: 'true', description: 'Show a chevron that turns over when expanded.' },
    { name: 'expanded', type: 'boolean', default: 'false', description: 'Expanded state, bound with `v-model:expanded`. Uncontrolled when not passed.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render as the root.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'The content to collapse.' },
    { name: 'more', description: 'Toggle text while collapsed. Replaces `moreLabel`.' },
    { name: 'less', description: 'Toggle text while expanded. Replaces `lessLabel`.' },
  ],
  emits: [
    { name: 'update:expanded', payload: '[expanded: boolean]', description: 'The toggle was used. Drives `v-model:expanded`.' },
    { name: 'overflow', payload: '[overflowing: boolean]', description: 'The collapsed content started (true) or stopped (false) overflowing, after a measurement.' },
  ],
  examples: [
    {
      title: 'Three lines (default)',
      description: 'The toggle appears only when the text is longer than three lines.',
      code: `<ShowMore class="max-w-prose text-sm">
  <p>${LONG}</p>
</ShowMore>`,
    },
    {
      title: 'Short content has no toggle',
      code: `<ShowMore class="max-w-prose text-sm">
  <p>A short note that fits in the preview.</p>
</ShowMore>`,
    },
    {
      title: 'Line counts',
      description: '`lines` accepts 1 to 6. Other numbers fall back or clamp.',
      code: `<div class="grid max-w-prose gap-4 text-sm">
  <ShowMore :lines="1"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="2"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="5"><p>${LONG}</p></ShowMore>
</div>`,
    },
    {
      title: 'Height presets',
      description: '`maxHeight` clamps by height, which suits mixed content such as paragraphs with a list.',
      code: `<ShowMore max-height="sm" class="max-w-prose text-sm">
  <p>${SAMPLE}</p>
  <ul class="mt-2 list-disc ps-5">
    <li>First sample item</li>
    <li>Second sample item</li>
    <li>Third sample item</li>
    <li>Fourth sample item</li>
  </ul>
  <p class="mt-2">${SAMPLE}</p>
</ShowMore>`,
    },
    {
      title: 'Toggle appearance',
      code: `<div class="grid max-w-prose gap-4 text-sm">
  <ShowMore :lines="2"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="2" appearance="button"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="2" appearance="outline"><p>${LONG}</p></ShowMore>
</div>`,
    },
    {
      title: 'Toggle placement',
      description: '`align` positions the toggle below the content; `layout="inline"` puts it beside the content, at the last line.',
      code: `<div class="grid max-w-prose gap-4 text-sm">
  <ShowMore :lines="2" align="center"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="2" align="end"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="2" layout="inline" size="sm"><p>${LONG}</p></ShowMore>
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-prose gap-4 text-sm">
  <ShowMore :lines="1" size="sm" appearance="outline"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="1" size="md" appearance="outline"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="1" size="lg" appearance="outline"><p>${LONG}</p></ShowMore>
</div>`,
    },
    {
      title: 'Custom labels and slots',
      description: '`moreLabel` and `lessLabel` name the content; the `more` and `less` slots allow richer text. Labels must not be blank.',
      code: `<div class="grid max-w-prose gap-4 text-sm">
  <ShowMore :lines="2" more-label="Read the full note" less-label="Collapse the note" :icon="false"><p>${LONG}</p></ShowMore>
  <ShowMore :lines="2">
    <p>${LONG}</p>
    <template #more>Show remaining text</template>
    <template #less>Hide remaining text</template>
  </ShowMore>
</div>`,
    },
    {
      title: 'Controlled with v-model:expanded',
      description: 'Bind `expanded` to keep the state somewhere else, for example to expand all notes at once.',
      code: `<div class="grid max-w-prose gap-3 text-sm">
  <Button variant="outline" size="sm" class="justify-self-start" @click="open = !open">{{ open ? 'Collapse the note' : 'Expand the note' }}</Button>
  <ShowMore v-model:expanded="open" :lines="2"><p>${LONG}</p></ShowMore>
</div>`,
      script: `const open = ref(false)`,
      state: () => ({ open: ref(false) }),
    },
    {
      title: 'Right-to-left',
      description: 'The toggle aligns to the start side of the text direction.',
      code: `<div dir="rtl" class="max-w-prose text-sm">
  <ShowMore :lines="2" align="start"><p>${LONG}</p></ShowMore>
</div>`,
    },
  ],
  a11y: [
    'The toggle is a native `button` with `aria-expanded` and `aria-controls` pointing at the content element, and its visible text (`Show more` / `Show less`) is its accessible name. Enter and Space activate it.',
    'The toggle is only rendered when the content overflows, so there is never a control that does nothing. Content that already fits has no extra tab stop.',
    'Collapsed content is clipped, not removed: text stays in the accessibility tree, so screen readers read all of it. Links or buttons inside the clipped part stay focusable; keep interactive elements out of the part that can be hidden.',
    'The toggle is at least 24px tall (the style packs keep this floor) and 44px on coarse pointers; focus uses the shared ring, which also shows in forced-colors mode.',
    'No gradient fade and no height animation by default. The chevron turns only with `motion-safe:`, so reduced-motion users see it change instantly.',
    'Logical properties only: the toggle aligns to the start or end side and flips in right-to-left text. Long words wrap (`break-words`), so the content reflows at 320px without horizontal scroll.',
    'Focus is not moved on toggle; when the toggle disappears because the content now fits, focus returns to the page body. Keep expanded state in `v-model:expanded` if the content can change length.',
  ],
  requires: [
    'Throws a ContractError when `moreLabel` or `lessLabel` is blank (and the matching `more` or `less` slot is not used), because the toggle needs visible text.',
  ],
  llmNotes: [
    'Wrap only the content to collapse; do not add your own toggle button or `v-if` on overflow, `ShowMore` measures and renders the toggle itself.',
    'Use `lines` for text and `maxHeight` for mixed content. Never set clamp classes yourself; the values are lookups of literal classes.',
    'Keep `moreLabel` and `lessLabel` non-blank and specific when several `ShowMore` are on one page ("Show full note").',
    'Use `v-model:expanded` for controlled state; listen to `overflow` only when something else depends on whether the content is clipped.',
    'Do not put interactive elements, headings or landmarks in the part that can be clipped.',
    'Expect no toggle on the server and on first paint: it appears after mount. Do not test for it before the component is mounted.',
  ],
  related: ['Collapsible', 'Accordion', 'Text', 'ScrollArea'],
  replaces: ['hand-rolled line-clamp with a Show more link', 'read-more toggles written with a boolean ref and a measured height'],
}
export default doc
