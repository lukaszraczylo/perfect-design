import { faCheck, faRocket, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Timeline',
  group: 'data-display',
  subgroup: 'Lists',
  summary: 'Vertical sequence of events with status-toned markers, times and a connector line.',
  description:
    'Use `Timeline` + `TimelineItem` for chronological activity: deploy history, audit trails, order status. Each item has a marker (status tone, optional FontAwesome icon), title, time and free-form body. The connector line is drawn between items and hidden after the last. Layouts: `vertical` (default; activity feeds, audit logs), `horizontal` (a few steps in a row, e.g. order progress; scrolls when it overflows), `alternating` (events left and right of a centre line from `md` up, plain vertical below; for history/roadmap pages). `size` is `compact` (smaller markers and spacing for dense side panels), `default` or `large` (bigger markers, spacing and text). `variant` styles the markers: `default` (tinted), `outline` (a ring in the status tone, plain centre) or `solid` (filled with the tone); the status is also spoken in every variant. For non-chronological rows use `List`.',
  status: 'stable',
  props: [
    { name: 'layout', type: "'vertical' | 'horizontal' | 'alternating'", default: "'vertical'", description: 'Orientation / arrangement of the events, shared with every `TimelineItem`. Unknown values fall back to `vertical`.' },
    { name: 'size', type: "'default' | 'compact' | 'large'", default: "'default'", description: '`compact` = smaller marker (16px), tighter spacing, xs body text; `large` = 32px marker, roomier spacing, larger text. Unknown values fall back to `default`.' },
    { name: 'variant', type: "'default' | 'outline' | 'solid'", default: "'default'", description: 'Marker look shared with every item: `default` tinted bubble, `outline` ring in the status tone with a plain centre, `solid` marker filled with the status tone. Unknown values fall back to `default`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the list (`aria-label`). Required for `horizontal` (a focusable scroll region); recommended otherwise.' },
    { name: 'as', type: "'ol' | 'ul'", default: "'ol'", description: 'List element; `ol` when order matters.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: '`TimelineItem` children.' }],
  parts: [
    {
      name: 'TimelineItem',
      description: 'One event. Slots: `icon`, `title`, `time`, default (body).',
      props: [
        { name: 'status', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'neutral'", description: 'Marker tone.' },
        { name: 'title', type: 'string', description: 'Event title. An item needs a `title` or a `time` (or the matching slot).' },
        { name: 'time', type: 'string', description: 'Human-readable time text.' },
        { name: 'datetime', type: 'string', description: 'Machine-readable value for `<time datetime>`.' },
        { name: 'icon', type: 'IconDefinition', description: 'FontAwesome icon inside the marker; a dot is used when omitted.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
      ],
    },
  ],
  examples: [
    {
      title: 'Basic',
      description: 'Sample data.',
      code: `<Timeline class="max-w-md" label="Sample data: order steps">
  <TimelineItem title="Order placed" time="Mon 09:12">Payment received.</TimelineItem>
  <TimelineItem title="Packed" time="Mon 14:03" />
  <TimelineItem title="Shipped" time="Tue 08:40" />
</Timeline>`,
    },
    {
      title: 'Status tones and icons',
      description: 'Non-neutral statuses are also spoken ("Success.", "Warning.") so the marker colour is not the only signal. Sample data.',
      code: `<Timeline class="max-w-md" label="Sample data: build log">
  <TimelineItem status="success" :icon="faCheck" title="Build passed" time="2 min ago" datetime="2026-03-01T10:00:00Z" />
  <TimelineItem status="warning" :icon="faTriangleExclamation" title="Slow step" time="1 min ago">Took 48s, limit 30s.</TimelineItem>
  <TimelineItem status="primary" :icon="faRocket" title="Deploying" time="now" />
</Timeline>`,
      state: () => ({ faCheck, faTriangleExclamation, faRocket }),
    },
    {
      title: 'Vertical (default)',
      description: 'Sample data.',
      code: `<Timeline class="max-w-md" label="Sample data: vertical timeline">
  <TimelineItem status="success" title="Deployed" time="2 min ago">The new version is live.</TimelineItem>
  <TimelineItem status="info" title="Build finished" time="9 min ago" />
  <TimelineItem title="Commit pushed" time="12 min ago" />
</Timeline>`,
    },
    {
      title: 'Horizontal',
      description: 'Steps in a row; the connector runs between markers. The list scrolls inside a focusable region when it overflows, so a phone never scrolls sideways. Sample data.',
      code: `<Timeline layout="horizontal" label="Sample data: delivery steps">
  <TimelineItem status="success" title="Ordered" time="Mon">Payment received.</TimelineItem>
  <TimelineItem status="success" title="Packed" time="Tue" />
  <TimelineItem status="primary" title="Shipped" time="Wed">On its way.</TimelineItem>
  <TimelineItem title="Delivered" time="Thu" />
</Timeline>`,
    },
    {
      title: 'Alternating',
      description: 'From `md` up the events alternate around a centre line; below it falls back to a vertical list. Sample data.',
      code: `<Timeline layout="alternating" class="max-w-3xl mx-auto" label="Sample data: alternating timeline">
  <TimelineItem status="primary" title="Step one" time="Phase 1">Describe the first step here.</TimelineItem>
  <TimelineItem status="success" title="Step two" time="Phase 2">Describe the second step here.</TimelineItem>
  <TimelineItem status="info" title="Step three" time="Phase 3">Describe the third step here.</TimelineItem>
  <TimelineItem status="warning" title="Step four" time="Phase 4">Describe the fourth step here.</TimelineItem>
</Timeline>`,
    },
    {
      title: 'Compact',
      description: '`size="compact"` for side panels and dense logs. Sample data.',
      code: `<Timeline size="compact" class="max-w-xs" label="Sample data: compact log">
  <TimelineItem status="success" title="Saved" time="1m" />
  <TimelineItem status="warning" title="Conflict resolved" time="4m">Kept local changes.</TimelineItem>
  <TimelineItem title="Opened" time="9m" />
</Timeline>`,
    },
    {
      title: 'Size gallery: compact, default, large',
      description: 'Marker, spacing and text scale together. Sample data.',
      code: `<div class="grid gap-6 sm:grid-cols-3">
  <Timeline size="compact" label="Compact sample log"><TimelineItem status="success" title="Saved" time="1m" /><TimelineItem title="Opened" time="9m" /></Timeline>
  <Timeline size="default" label="Default sample log"><TimelineItem status="success" title="Saved" time="1m" /><TimelineItem title="Opened" time="9m" /></Timeline>
  <Timeline size="large" label="Large sample log"><TimelineItem status="success" :icon="faCheck" title="Saved" time="1m" /><TimelineItem title="Opened" time="9m" /></Timeline>
</div>`,
      state: () => ({ faCheck }),
    },
    {
      title: 'Variant gallery: default, outline, solid',
      description: 'Marker looks for every status. The status word is spoken in all of them, and icons keep a foreground colour on the ring and on the solid fill. Sample data.',
      code: `<div class="grid gap-6 sm:grid-cols-3">
  <Timeline variant="default" label="Default markers">
    <TimelineItem status="success" :icon="faCheck" title="Passed" time="1m" />
    <TimelineItem status="warning" :icon="faTriangleExclamation" title="Slow" time="2m" />
    <TimelineItem status="danger" title="Failed" time="3m" />
    <TimelineItem title="Queued" time="4m" />
  </Timeline>
  <Timeline variant="outline" label="Outline markers">
    <TimelineItem status="success" :icon="faCheck" title="Passed" time="1m" />
    <TimelineItem status="warning" :icon="faTriangleExclamation" title="Slow" time="2m" />
    <TimelineItem status="danger" title="Failed" time="3m" />
    <TimelineItem title="Queued" time="4m" />
  </Timeline>
  <Timeline variant="solid" label="Solid markers">
    <TimelineItem status="success" :icon="faCheck" title="Passed" time="1m" />
    <TimelineItem status="warning" :icon="faTriangleExclamation" title="Slow" time="2m" />
    <TimelineItem status="danger" title="Failed" time="3m" />
    <TimelineItem title="Queued" time="4m" />
  </Timeline>
</div>`,
      state: () => ({ faCheck, faTriangleExclamation }),
    },
  ],
  a11y: [
    'Rendered as an ordered list with `role="list"`; markers and connector are `aria-hidden`. Name it with `label`.',
    'Times use `<time>` with tabular figures; pass `datetime` for machine-readable values.',
    'Status is spoken as well as coloured: non-neutral statuses add a visually hidden "Success.", "Warning.", "Error." or "Info." before the title.',
    '`variant` and `size` change markers and spacing only. Every variant keeps the visually hidden status word, so `outline` and `solid` markers do not rely on tone alone; the marker glyph is foreground on the ring and on-tone text on the solid fill (the pairs the contrast tests cover). The `outline` ring uses stroke tokens that are at least 3:1 against the page and card backgrounds in every theme, light and dark (WCAG 1.4.11; `warning` uses `warning-foreground` in light mode and `warning` in dark mode), and `contrast.test.ts` pins every status.',
    'The `horizontal` layout becomes a focusable scroll region (`tabindex="0"`, shared focus ring) so keyboard users can scroll it. Spacing and placement use logical properties, so RTL mirrors them. `alternating` is a plain vertical list below `md`.',
  ],
  related: ['List', 'Card'],
  requires: [
    'Throws a ContractError when a `TimelineItem` has neither a `title` nor a `time` (or the matching slot).',
    'Throws a ContractError when a `layout="horizontal"` timeline, which is a focusable scroll region, has no `label` (or `aria-label` / `aria-labelledby`).',
  ],
  llmNotes: [
    'Newest-first or oldest-first is up to you; keep it consistent and say which in surrounding copy.',
    'Put status words in the title/body too, colour alone is not enough.',
    'Pick the layout on Timeline (children adapt): `horizontal` for 3-5 short steps, `alternating` for history pages, `compact` for sidebars.',
    'Use `variant="outline"` or `"solid"` for stronger markers and `size="large"` for roomy history pages; they combine with every layout.',
    'Use `datetime` whenever `time` is relative text.',
  ],
  replaces: ['hand-rolled Timeline markup in app code'],
}
export default doc
