import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'CountBadge',
  group: 'primitives',
  subgroup: 'Status',
  summary: 'Numeric count pill or small dot for unread items and pending work, with a required accessible label.',
  description:
    'Use `CountBadge` for a number that sits next to or on top of another element: unread messages, open tasks, items in a cart. A count of 0 renders nothing, a large count is capped (`99+`), and the visible number is hidden from assistive technology in favour of a `label` such as `3 unread messages`. For a status word (`Paid`, `Draft`) use `Badge`; for a status light without a number use `StatusDot`.\n\nVariations:\n\n- `tone`: `neutral | primary | success | warning | danger | info`.\n- `appearance`: `solid` (default), `soft` (tinted) or `outline` (border on the page background, readable over other elements).\n- `size`: `sm` 16px, `md` 20px (default), `lg` 24px tall.\n- `shape`: `pill` (grows with the text), `circle` (round for one or two digits), `square` (control radius).\n- `dot`: a marker without a number. With `count` it hides at 0, without `count` it always shows.\n- `max` and `showZero`: the cap before `max+`, and whether `0` is rendered.\n\nPlacement: wrap the target and the badge in `CountBadgeAnchor` and put the badge in its `badge` slot. `placement` is `top-end` (default), `top-start`, `bottom-end` or `bottom-start`; start and end flip in right-to-left text. `countBadgePlacement` exposes the same classes for custom wrappers.\n\nBad input is handled, not thrown: a count that is not a number or is NaN or negative counts as 0, a fraction is truncated, `Infinity` shows `max+`, and an invalid `max` falls back to 99. Wrap `countBadgeVariants(...)` in `cn()` when you use it on a plain element, because a few classes override each other.',
  status: 'stable',
  parts: [
    {
      name: 'CountBadgeAnchor',
      description: 'Relative wrapper that places a `CountBadge` (in its `badge` slot) on a corner of the default-slot content, using logical start and end offsets.',
      props: [
        { name: 'placement', type: "'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'", default: "'top-end'", description: 'Corner of the target the badge is centred on. Unknown values fall back to top-end.' },
        { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
      ],
    },
  ],
  props: [
    { name: 'count', type: 'number', description: 'Number to show. Not a number, NaN and negative values count as 0, fractions are truncated, Infinity shows `max+`. In `dot` mode, omit it for an always-visible dot.' },
    { name: 'max', type: 'number', default: '99', description: 'Largest number printed; above it the badge shows `max+`. A whole number from 1; anything else falls back to 99.' },
    { name: 'showZero', type: 'boolean', default: 'false', description: 'Render the badge when the count is 0. By default a 0 renders nothing.' },
    { name: 'dot', type: 'boolean', default: 'false', description: 'Small marker without a number. Still needs `label`. With `count` it hides at 0 (unless `showZero`).' },
    { name: 'label', type: 'string', description: 'Accessible text, read instead of the visible number (visually hidden). Required whenever the badge renders. Example: `3 unread messages`.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: 'Semantic colour. Unknown values fall back to primary.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and text size (16px, 20px, 24px); a 6px, 8px or 10px dot in `dot` mode. Unknown values fall back to md.' },
    { name: 'shape', type: "'pill' | 'circle' | 'square'", default: "'pill'", description: 'Corner shape. `circle` stays round up to two digits and widens for `99+`. Unknown values fall back to pill.' },
    { name: 'appearance', type: "'solid' | 'soft' | 'outline'", default: "'solid'", description: 'Fill style. `outline` has a page-background fill so it stays readable over other elements. Unknown values fall back to solid.' },
    { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'badge', description: 'On `CountBadgeAnchor`: the badge to place on the corner (usually a `CountBadge`).' },
  ],
  examples: [
    {
      title: 'Count with an accessible label',
      description: 'The number is hidden from assistive technology; the label is read instead.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <span class="text-sm">Inbox</span>
  <CountBadge :count="3" label="3 unread messages" />
</div>`,
    },
    {
      title: 'Overflow and zero',
      description: 'Above `max` the badge shows `max+`; a count of 0 renders nothing unless `show-zero` is set.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <CountBadge :count="7" label="7 open tasks" />
  <CountBadge :count="250" label="More than 99 open tasks" />
  <CountBadge :count="250" :max="9" label="More than 9 open tasks" />
  <CountBadge :count="0" show-zero label="0 open tasks" />
  <CountBadge :count="0" label="No open tasks" />
</div>`,
    },
    {
      title: 'Tones',
      code: `<div class="flex flex-wrap items-center gap-2">
  <CountBadge :count="4" tone="neutral" label="4 drafts" />
  <CountBadge :count="4" tone="primary" label="4 mentions" />
  <CountBadge :count="4" tone="success" label="4 approved" />
  <CountBadge :count="4" tone="warning" label="4 pending" />
  <CountBadge :count="4" tone="danger" label="4 failed" />
  <CountBadge :count="4" tone="info" label="4 notes" />
</div>`,
    },
    {
      title: 'Appearances',
      description: '`solid` for the strongest signal, `soft` inside lists, `outline` when the badge overlaps other content.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <CountBadge :count="12" label="12 alerts" />
  <CountBadge :count="12" appearance="soft" label="12 alerts" />
  <CountBadge :count="12" appearance="outline" label="12 alerts" />
  <CountBadge :count="12" tone="danger" appearance="soft" label="12 failed jobs" />
  <CountBadge :count="12" tone="danger" appearance="outline" label="12 failed jobs" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="flex flex-wrap items-center gap-2">
  <CountBadge :count="8" size="sm" label="8 items, small" />
  <CountBadge :count="8" label="8 items, medium" />
  <CountBadge :count="8" size="lg" label="8 items, large" />
</div>`,
    },
    {
      title: 'Shapes',
      description: '`circle` is round for one or two digits and widens for `99+`.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <CountBadge :count="5" shape="pill" label="5 items, pill" />
  <CountBadge :count="5" shape="circle" label="5 items, circle" />
  <CountBadge :count="42" shape="circle" label="42 items, circle" />
  <CountBadge :count="500" shape="circle" label="More than 99 items, circle" />
  <CountBadge :count="5" shape="square" label="5 items, square" />
</div>`,
    },
    {
      title: 'Dot',
      description: 'A marker without a number; the label still names it. With a `count` the dot hides at 0.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <span class="inline-flex items-center gap-1.5 text-sm"><CountBadge dot label="New activity" /> Activity</span>
  <span class="inline-flex items-center gap-1.5 text-sm"><CountBadge dot tone="danger" appearance="soft" size="lg" label="Needs attention" /> Billing</span>
  <span class="inline-flex items-center gap-1.5 text-sm"><CountBadge dot tone="success" appearance="outline" shape="square" label="Synced" /> Sync</span>
  <span class="inline-flex items-center gap-1.5 text-sm"><CountBadge dot :count="0" label="No new replies" /> Replies (hidden at 0)</span>
</div>`,
    },
    {
      title: 'Anchored on a button',
      description: '`CountBadgeAnchor` centres the badge on a corner of its content. The button keeps its own visible name.',
      code: `<div class="flex flex-wrap items-center gap-6 p-3">
  <CountBadgeAnchor>
    <Button variant="outline">Inbox</Button>
    <template #badge><CountBadge :count="3" size="sm" label="3 unread messages" /></template>
  </CountBadgeAnchor>
  <CountBadgeAnchor placement="bottom-start">
    <Button variant="outline">Queue</Button>
    <template #badge><CountBadge :count="120" size="sm" tone="danger" label="More than 99 queued jobs" /></template>
  </CountBadgeAnchor>
  <CountBadgeAnchor placement="top-start">
    <Button variant="outline">Alerts</Button>
    <template #badge><CountBadge dot tone="warning" label="New alerts" /></template>
  </CountBadgeAnchor>
  <CountBadgeAnchor placement="bottom-end">
    <Button variant="outline">Tasks</Button>
    <template #badge><CountBadge :count="2" size="sm" appearance="outline" label="2 overdue tasks" /></template>
  </CountBadgeAnchor>
</div>`,
    },
    {
      title: 'Right-to-left',
      description: 'Start and end placement flip with the text direction.',
      code: `<div dir="rtl" class="flex flex-wrap items-center gap-6 p-3">
  <CountBadgeAnchor>
    <Button variant="outline">Inbox</Button>
    <template #badge><CountBadge :count="3" size="sm" label="3 unread messages" /></template>
  </CountBadgeAnchor>
  <CountBadgeAnchor placement="bottom-start">
    <Button variant="outline">Queue</Button>
    <template #badge><CountBadge :count="9" size="sm" label="9 queued jobs" /></template>
  </CountBadgeAnchor>
</div>`,
    },
  ],
  a11y: [
    'Not interactive and has no role. The visible number is `aria-hidden`; a visually hidden `label` (for example `3 unread messages`) carries the meaning, so the count is never colour alone and is read in flow with the element next to it.',
    'A rendered badge without `label` text throws a ContractError in strict mode. A badge that renders nothing (count 0) is not checked.',
    'The label does not update itself: when `count` changes, pass a matching `label`. A change is not announced; for live updates keep an existing polite `role="status"` region elsewhere in the page.',
    'Numbers use tabular figures. Tone colours are Badge token pairs covered by the contrast tests (light and dark). In forced-colors mode the border stays visible.',
    'Placement uses logical `start` and `end` insets and flips the shift for right-to-left text. The anchor wrapper has `pointer-events-none` on the badge so clicks reach the element underneath.',
    'The badge is small by design and is not a target. Put the interaction on the element it is attached to.',
  ],
  requires: [
    'Throws a ContractError when a rendered badge (a count above 0, `show-zero`, or a dot) has no non-empty `label`.',
  ],
  llmNotes: [
    'Always pass `label` with the full phrase a screen reader should hear ("3 unread messages"), not just the number; keep it in sync with `count`.',
    'Do not guard with `v-if="count > 0"`: `CountBadge` already renders nothing at 0 unless `show-zero` is set.',
    'Use `max` for a cap (`99+`); do not format the number yourself.',
    'To attach a badge to another element use `CountBadgeAnchor` with the `badge` slot and `placement`; never position it with physical left/right classes.',
    'Use `dot` for presence without a number and `Badge` for words. Do not signal state by colour alone: the label or neighbouring text must say it.',
    'Use `appearance="outline"` when the badge overlaps other content so it keeps its own background.',
  ],
  related: ['Badge', 'StatusDot', 'StatusBadge', 'Chip', 'Avatar'],
  replaces: ['hand-rolled notification count bubbles with absolute left/right offsets', 'shadcn-vue Badge used as a count'],
}
export default doc
