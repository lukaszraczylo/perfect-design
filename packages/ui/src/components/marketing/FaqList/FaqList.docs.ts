import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const items = [
  { q: 'Does the library need FontAwesome at runtime?', a: 'No. Icons are passed as data and rendered as inline SVG.' },
  { q: 'How do I turn on dark mode?', a: 'Add class="dark" to the html element.' },
  { q: 'How do I change the accent colour?', a: 'Set data-theme on the html element and import the matching theme file.' },
  { q: 'Which dependencies does it have?', a: 'reka-ui and tailwind-merge, plus an optional pinia.' },
]
const categorised = [
  { q: 'Which dependencies does it have?', a: 'reka-ui and tailwind-merge, plus an optional pinia.', category: 'Setup' },
  { q: 'How do I turn on dark mode?', a: 'Add class="dark" to the html element.', category: 'Theming' },
  { q: 'How do I import the theme?', a: 'Import theme.css after Tailwind and add an @source line.', category: 'Setup' },
  { q: 'How do I change the accent colour?', a: 'Set data-theme on the html element.', category: 'Theming' },
  { q: 'Where do the components come from?', a: 'They were extracted from the apps listed in the project analysis.' },
]

const doc: ComponentDoc = {
  name: 'FaqList',
  group: 'marketing',
  subgroup: 'Content',
  summary: 'Accessible FAQ accordion built on native <details>/<summary> in six layouts.',
  description:
    'Use for real support questions on landing and pricing pages. It uses native `<details>`, so it works without JavaScript, is keyboard accessible and findable with in-page search. `single` keeps one answer open at a time. Variants: `bordered` (default rules between items), `separated` (each item a card), `plain` (no chrome), `two-column` (balanced two-column list on `md`+), `with-categories` (group by `category` under headings or switch with tabs), `numbered` (1., 2. ... before each question; only for answers you refer to by number). For app navigation accordions use the navigation Accordion instead.',
  status: 'stable',
  props: [
    { name: 'items', type: 'FaqItem[]', default: '[]', description: 'Questions and answers: `{ q: string, a: string, category?: string }`.' },
    {
      name: 'variant',
      type: "'bordered' | 'separated' | 'plain' | 'two-column' | 'with-categories' | 'numbered'",
      default: "'bordered'",
      description: 'Layout. Unknown values fall back to `bordered` (the original look).',
    },
    { name: 'categoryMode', type: "'headings' | 'tabs'", default: "'headings'", description: '`with-categories` only: category headings (h3) or a tab per category. Unknown values fall back to `headings`.' },
    { name: 'categoriesLabel', type: 'string', default: "'Question categories'", description: '`with-categories` + `tabs`: accessible name of the tab list.' },
    { name: 'defaultCategory', type: 'string', description: '`with-categories` + `tabs`: category selected first. Unknown values select the first category.' },
    { name: 'uncategorizedLabel', type: 'string', default: "'Other'", description: '`with-categories`: heading/tab for items without a `category` when other items have one.' },
    { name: 'single', type: 'boolean', default: 'false', description: 'Only one answer open at a time (across categories too).' },
    { name: 'defaultOpen', type: 'number[]', default: '[]', description: 'Item indexes (position in `items`) open initially. Invalid indexes are ignored.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [{ name: 'answer', description: 'Replaces the answer text (rich content). `index` is the position in `items`, also when items are grouped.', props: '{ item: FaqItem, index: number }' }],
  emits: [{ name: 'toggle', payload: '[{ index: number, open: boolean }]', description: 'An item was opened or closed. `index` is the position in `items`.' }],
  examples: [
    {
      title: 'Minimal (bordered, default)',
      code: `<FaqList :items="items" />`,
      script: `const items = [{ q: 'How do I turn on dark mode?', a: 'Add class="dark" to the html element.' }, ...]`,
      state: () => ({ items }),
    },
    {
      title: 'Realistic: single-open with a default and toggle events',
      code: `<FaqList single :default-open="[0]" :items="items" @toggle="last = $event" />
<p class="mt-2 text-sm text-muted-foreground">Last: {{ last }}</p>`,
      script: `const last = ref(null)`,
      state: () => ({ last: ref(null), items }),
    },
    { title: 'Variant bordered', code: `<FaqList variant="bordered" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant separated (cards)', code: `<FaqList variant="separated" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant plain', code: `<FaqList variant="plain" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant two-column', code: `<FaqList variant="two-column" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant numbered', code: `<FaqList variant="numbered" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    {
      title: 'Variant with-categories (headings)',
      code: `<FaqList variant="with-categories" :items="categorised" />`,
      script: `const categorised = [{ q: '...', a: '...', category: 'Setup' }, ...]`,
      state: () => ({ categorised }),
    },
    {
      title: 'Variant with-categories (tabs)',
      code: `<FaqList variant="with-categories" category-mode="tabs" default-category="Theming" :items="categorised" />`,
      script: `const categorised = [...]`,
      state: () => ({ categorised }),
    },
    {
      title: 'Rich answers with the answer slot',
      code: `<FaqList variant="separated" :items="items.slice(0, 2)">
  <template #answer="{ item, index }">
    <p>{{ item.a }} <a class="underline" href="/guides/customisation">Read the customisation guide</a> (#{{ index + 1 }}).</p>
  </template>
</FaqList>`,
      script: `const items = [...]`,
      state: () => ({ items }),
    },
  ],
  requires: [
    'Throws a ContractError when an item has an empty `q`, or an empty `a` while the `answer` slot is not used (the first one is named by index).',
  ],
  a11y: [
    'Native details/summary semantics: Tab focuses a question, Enter or Space toggles it, the open state is exposed by the browser (no ARIA needed). Questions are at least 24px tall and `pointer-coarse:min-h-11` on touch; focus uses the shared ring (an outline in forced-colors mode).',
    'Chevron and the decorative number in `numbered` are aria-hidden; the chevron rotation is skipped under reduced motion.',
    'Category headings are h3 labelling a `role="group"` (not a region landmark per category). Tabs mode uses the library Tabs: role=tablist (named by `categoriesLabel`) / tab / tabpanel, Left/Right (Up/Down) arrows move between tabs with roving tabindex, Home/End jump to the first/last tab.',
    'Text wraps and the layouts collapse to one column at 320px; alignment uses logical properties for RTL.',
  ],
  related: ['SectionHeading', 'CtaBand', 'Tabs', 'Accordion'],
  llmNotes: [
    'Answers are plain strings; use the `answer` slot for links/markup.',
    'Use `single` for long lists.',
    'Pair with FAQPage JSON-LD in the app if SEO matters.',
    'Choose `with-categories` only when items carry a `category`; use `categoryMode="tabs"` for more than ~3 categories.',
    '`two-column` suits 6+ short questions; `separated` suits tinted or dark sections; `numbered` suits step-like or ordered FAQs.',
  ],
  replaces: ['hand-rolled FaqList markup in app code'],
}
export default doc
