import { ref } from 'vue'
import { faRocket } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

/** Sample events. Actors are generic roles, times are fixed so the output never changes. */
const events = [
  { id: 'e1', actor: 'Deploy bot', action: 'deployed', target: 'Orchard Mill web 1.4', time: '2026-03-04T11:42:00Z', tone: 'success', details: 'Rolled out to 3 of 3 instances.' },
  { id: 'e2', actor: 'Reviewer 1', action: 'approved', target: 'Change 128', time: '2026-03-04T10:05:00Z' },
  { id: 'e3', actor: 'Scheduler', action: 'skipped the nightly export for', target: 'Kestrel Freight', time: '2026-03-04T03:00:00Z', tone: 'warning', details: 'The previous run was still active.' },
  { id: 'e4', actor: 'Reviewer 2', action: 'requested changes on', target: 'Change 127', time: '2026-03-03T16:20:00Z', tone: 'danger' },
  { id: 'e5', actor: 'Deploy bot', action: 'opened', target: 'Change 129', time: '2026-03-03T09:15:00Z', tone: 'info' },
  { id: 'e6', action: 'Maintenance window ended', time: '2026-02-20T22:00:00Z' },
]
const eventsScript = `const now = '2026-03-04T12:00:00Z'
const events = [
  { id: 'e1', actor: 'Deploy bot', action: 'deployed', target: 'Orchard Mill web 1.4', time: '2026-03-04T11:42:00Z', tone: 'success', details: 'Rolled out to 3 of 3 instances.' },
  { id: 'e2', actor: 'Reviewer 1', action: 'approved', target: 'Change 128', time: '2026-03-04T10:05:00Z' },
  { id: 'e3', actor: 'Scheduler', action: 'skipped the nightly export for', target: 'Kestrel Freight', time: '2026-03-04T03:00:00Z', tone: 'warning', details: 'The previous run was still active.' },
  { id: 'e4', actor: 'Reviewer 2', action: 'requested changes on', target: 'Change 127', time: '2026-03-03T16:20:00Z', tone: 'danger' },
  { id: 'e5', actor: 'Deploy bot', action: 'opened', target: 'Change 129', time: '2026-03-03T09:15:00Z', tone: 'info' },
  { id: 'e6', action: 'Maintenance window ended', time: '2026-02-20T22:00:00Z' },
]`
const NOW = '2026-03-04T12:00:00Z'
const base = () => ({ events, now: NOW })

const doc: ComponentDoc = {
  name: 'ActivityFeed',
  group: 'data-display',
  subgroup: 'Lists',
  summary: 'Chronological list of who did what to which thing and when, with relative times, day groups, expandable details and a load more button.',
  description:
    'Use `ActivityFeed` for audit trails, deploy history and "what changed" panels where each event has an actor, an action, an optional target and a time. `variant` sets the layout: `list` (default, ruled rows with initials avatars), `timeline` (round markers joined by a line), `compact` (one tight line per event, no avatars) and `grouped` (the list under a heading per calendar day, or per `group` you set). `size` sets the text size and `density` the row spacing. Times render with `Intl`: relative ("2 hours ago") up to a week old, absolute after that, with the full date in the `title`. Pass `now` for output that is identical on the server and the client; without it the first render shows absolute times and the relative text appears after mount. Events with `details` get a "Show details" button (controlled with `v-model:expanded` or left uncontrolled). All text is rendered as text, never as HTML. For a single process log use `LogViewer`; for a plain sequence of steps use `Timeline`.',
  status: 'stable',
  props: [
    { name: 'events', type: 'ActivityEvent[]', default: '[]', description: 'The events in display order. Each has `id`, `action` and `time`; `actor`, `target`, `icon`, `tone`, `group` and `details` are optional. `null` is treated as empty.' },
    { name: 'label', type: 'string', description: 'Accessible name of the feed. Required (or pass `aria-label` / `aria-labelledby`).' },
    { name: 'variant', type: "'list' | 'timeline' | 'compact' | 'grouped'", default: "'list'", description: '`list` ruled rows with avatars, `timeline` markers joined by a line, `compact` one tight line per event, `grouped` list under a heading per day or `group`. Unknown values fall back to `list`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size, marker and avatar size. Unknown values fall back to `md`.' },
    { name: 'density', type: "'comfortable' | 'compact'", default: "'comfortable'", description: 'Row spacing. Unknown values fall back to `comfortable`.' },
    { name: 'showAvatars', type: 'boolean', default: 'true', description: 'Initials avatar for events with an `actor` in `list` and `grouped`. Other variants always use the marker.' },
    { name: 'now', type: 'Date | string | number', description: 'Reference time for relative text. Set it for server-safe output; without it the current time is read after mount and refreshed every minute.' },
    { name: 'relative', type: 'boolean', default: 'true', description: 'Show relative text for events up to a week from `now`. Off: always the absolute date and time.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for dates and relative text. Unknown values fall back to the runtime default.' },
    { name: 'timeZone', type: 'string', description: 'IANA time zone for dates and day groups, for example `UTC`. Unknown values fall back to the runtime zone.' },
    { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of the group headings in `grouped`.' },
    { name: 'hasMore', type: 'boolean', default: 'false', description: 'More events exist: shows the load more button or the `load-more` slot.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'The next page is loading: the button is disabled, the feed is `aria-busy` and a polite status says so.' },
    { name: 'loadMoreLabel', type: 'string', default: "'Load more activity'", description: 'Text of the load more button.' },
    { name: 'expanded', type: '(string | number)[]', description: 'Ids of the events whose details are open (`v-model:expanded`). Leave it unset for uncontrolled use.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'empty', description: 'Shown instead of the list when there are no events. Default: "No activity yet."' },
    { name: 'load-more', props: '{ loading: boolean }', description: 'Replaces the load more button. Shown while `hasMore` is true.' },
    { name: 'details', props: '{ event: ActivityEvent }', description: 'Content of the details panel. With this slot every event gets a "Show details" button.' },
  ],
  emits: [
    { name: 'load-more', description: 'The load more button was pressed.' },
    { name: 'toggle', payload: '[event: { id: string | number; expanded: boolean }]', description: 'An event\'s details were opened or closed.' },
    { name: 'update:expanded', payload: '[ids: (string | number)[]]', description: 'New list of open ids, for `v-model:expanded`.' },
  ],
  examples: [
    {
      title: 'Basic list',
      description: 'Sample data. `now` is fixed so the relative times never change.',
      script: eventsScript,
      code: `<ActivityFeed class="max-w-xl" label="Sample data: project activity" :events="events.slice(0, 4)" :now="now" time-zone="UTC" locale="en" />`,
      state: base,
    },
    {
      title: 'Timeline',
      description: 'Round markers joined by a line. Tones add an icon and a spoken word ("Success.", "Warning."), so colour is not the only signal. Sample data.',
      script: eventsScript,
      code: `<ActivityFeed variant="timeline" class="max-w-xl" label="Sample data: timeline of events" :events="events.slice(0, 5)" :now="now" time-zone="UTC" locale="en" />`,
      state: base,
    },
    {
      title: 'Compact',
      description: 'One tight line per event for side panels. No avatars. Sample data.',
      script: eventsScript,
      code: `<ActivityFeed variant="compact" class="max-w-md" label="Sample data: compact activity" :events="events" :now="now" time-zone="UTC" locale="en" />`,
      state: base,
    },
    {
      title: 'Grouped by day',
      description: 'Each calendar day gets a heading, formatted with `Intl.DateTimeFormat`. Set `group` on an event to use your own heading instead. Sample data.',
      script: eventsScript,
      code: `<ActivityFeed variant="grouped" class="max-w-xl" label="Sample data: activity by day" :events="events" :now="now" time-zone="UTC" locale="en" />`,
      state: base,
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Text, markers and avatars scale together. Sample data.',
      script: eventsScript,
      code: `<div class="grid gap-6 md:grid-cols-3">
  <ActivityFeed size="sm" label="Small sample feed" :events="events.slice(0, 2)" :now="now" time-zone="UTC" locale="en" />
  <ActivityFeed size="md" label="Medium sample feed" :events="events.slice(0, 2)" :now="now" time-zone="UTC" locale="en" />
  <ActivityFeed size="lg" label="Large sample feed" :events="events.slice(0, 2)" :now="now" time-zone="UTC" locale="en" />
</div>`,
      state: base,
    },
    {
      title: 'Density gallery: comfortable and compact',
      description: '`density` tightens the row padding in every variant. Sample data.',
      script: eventsScript,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <ActivityFeed density="comfortable" label="Comfortable sample feed" :events="events.slice(0, 3)" :now="now" time-zone="UTC" locale="en" />
  <ActivityFeed density="compact" label="Compact sample feed" :events="events.slice(0, 3)" :now="now" time-zone="UTC" locale="en" />
</div>`,
      state: base,
    },
    {
      title: 'Expandable details',
      description: 'Events with `details` get a "Show details" button with `aria-expanded`. `v-model:expanded` holds the open ids. Sample data.',
      script: `${eventsScript}\nconst open = ref(['e1'])`,
      code: `<ActivityFeed v-model:expanded="open" class="max-w-xl" label="Sample data: activity with details" :events="events.slice(0, 3)" :now="now" time-zone="UTC" locale="en" />`,
      state: () => ({ ...base(), open: ref(['e1']) }),
    },
    {
      title: 'Load more',
      description: 'Listen for `load-more`, append events and set `loading` while you fetch. The button is disabled while loading and a polite status announces it. Sample data.',
      script: `${eventsScript}
const shown = ref(events.slice(0, 3))
const hasMore = ref(true)
function more() {
  shown.value = events
  hasMore.value = false
}`,
      code: `<ActivityFeed class="max-w-xl" label="Sample data: paged activity" :events="shown" :has-more="hasMore" :now="now" time-zone="UTC" locale="en" @load-more="more" />`,
      state: () => {
        const shown = ref(events.slice(0, 3))
        const hasMore = ref(true)
        return {
          ...base(),
          shown,
          hasMore,
          more() {
            shown.value = events
            hasMore.value = false
          },
        }
      },
    },
    {
      title: 'Custom icon, absolute times and empty state',
      description: '`icon` overrides the tone icon, `:relative="false"` always shows the absolute date and time, and the `empty` slot replaces the default text. Sample data.',
      script: `import { faRocket } from '@fortawesome/free-solid-svg-icons'\nconst release = [{ id: 'r1', actor: 'Deploy bot', action: 'released', target: 'Brightwater Co app 2.0', time: '2026-03-04T08:00:00Z', icon: faRocket, tone: 'primary' }]`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <ActivityFeed variant="timeline" label="Sample data: releases" :events="release" :relative="false" time-zone="UTC" locale="en" />
  <ActivityFeed label="Sample data: empty feed" :events="[]"><template #empty>Nothing has happened in this project yet.</template></ActivityFeed>
</div>`,
      state: () => ({ release: [{ id: 'r1', actor: 'Deploy bot', action: 'released', target: 'Brightwater Co app 2.0', time: '2026-03-04T08:00:00Z', icon: faRocket, tone: 'primary' }] }),
    },
    {
      title: 'Right-to-left',
      description: 'Spacing, the marker side and the text use logical properties, so `dir="rtl"` mirrors the feed. Sample text.',
      script: `const arabic = [{ id: 'a1', actor: 'Reviewer 1', action: 'تمت الموافقة على', target: 'التغيير 128', time: '2026-03-04T10:05:00Z', details: 'نص تفصيلي تجريبي.' }, { id: 'a2', actor: 'Deploy bot', action: 'نشر', target: 'الإصدار 1.4', time: '2026-03-04T11:42:00Z', tone: 'success' }]`,
      code: `<div dir="rtl" lang="ar"><ActivityFeed variant="timeline" class="max-w-xl" label="نشاط تجريبي" :events="arabic" now="2026-03-04T12:00:00Z" time-zone="UTC" locale="ar" /></div>`,
      state: () => ({
        arabic: [
          { id: 'a1', actor: 'Reviewer 1', action: 'تمت الموافقة على', target: 'التغيير 128', time: '2026-03-04T10:05:00Z', details: 'نص تفصيلي تجريبي.' },
          { id: 'a2', actor: 'Deploy bot', action: 'نشر', target: 'الإصدار 1.4', time: '2026-03-04T11:42:00Z', tone: 'success' },
        ],
      }),
    },
  ],
  a11y: [
    'The root is `role="group"` named by `label` (required). Events are one ordered list (`ol` / `li`); in `grouped` each day is a `role="group"` named by its heading, and the heading level is `headingLevel`.',
    'Times use `<time datetime>` with the ISO value; relative text carries the full absolute date and time in `title`. A value that is not a date is shown as given, without `datetime`.',
    'Tone is never colour alone: non-neutral tones add an icon and a visually hidden word ("Success.", "Warning.", "Error.", "Info.") before the text.',
    'Avatars are decorative (`alt=""`) because the actor is named in the text. Initials are derived from the generic actor name.',
    'Details: a real `button` ("Show details" / "Hide details" plus the event as hidden text) with `aria-expanded` and `aria-controls` while open. Enter and Space toggle it. 24px minimum height, 44px on coarse pointers, shared focus ring.',
    '`loading` sets `aria-busy` and a polite `role="status"` says "Loading more activity." The feed never announces new items by itself. Layout uses logical properties and wraps at 320px, so RTL mirrors it.',
  ],
  related: ['Timeline', 'List', 'LogViewer', 'Avatar'],
  requires: [
    'Throws a ContractError when the feed has no accessible name (`label`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when an event has no `id` (a non-empty string or a number) or two events share an id.',
    'Throws a ContractError when an event has a blank `action`.',
  ],
  llmNotes: [
    'Always set `label`; give every event a unique, stable `id` and a non-blank `action`.',
    'Pass `now` (and `time-zone`) for server-rendered pages so the output matches on the client.',
    'Use generic actors ("Deploy bot", "Reviewer 1"); never invent real people. Put the outcome in `action` or `tone`, not only in colour.',
    'Use `variant="grouped"` for long histories, `compact` for side panels, `timeline` when order is the point. Use `hasMore` with `@load-more` for paging.',
    'Details and `empty` text are plain text. Use the `details` slot for richer content you have already made safe.',
  ],
  replaces: ['hand-rolled activity feed markup in app code'],
}
export default doc
