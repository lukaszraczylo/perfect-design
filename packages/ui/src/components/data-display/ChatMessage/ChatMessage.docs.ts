import { faCopy, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

/** Three backticks, kept out of the template literals below so the examples can contain code fences. */
const FENCE = '```'
const richText = ['Rotate the key in **two steps**:', '', '1. Create the new key', '2. Remove the old key after one deploy', '', `${FENCE}sh`, 'pnpm run rotate --env staging', FENCE, '', 'See [the runbook](/guides/llm) for the full list.'].join('\n')
const hostileText = ['<script>alert(1)</script>', '', '<img src=x onerror=alert(1)> [click me](javascript:alert(1))', '', '![tracker](https://example.com/pixel.png)', '', 'Plain text is still **shown**.'].join('\n')

const doc: ComponentDoc = {
  name: 'ChatMessage',
  group: 'data-display',
  subgroup: 'Chat',
  summary: 'One chat message with a role, a bubble, plain or card surface, an avatar, a header, a status written as text and hover or focus actions.',
  description:
    'Use `ChatMessage` for each turn in a conversation: a person writing, a reply, a system notice or a tool result. It knows nothing about who the participants are (no vendor or model is baked in) and renders whatever you put in the default slot, or a `markdown` string through the library `Markdown` component. Put messages in a `ChatThread` for the scrolling log, follow behaviour and announcements.\n\n' +
    '**Role** (`user`, `assistant`, `system`, `tool`) picks the colours and the default side (`user` sits at the end, the rest at the start). Role is also spoken: a visually hidden phrase ("You said", "Assistant said", "System message", "Tool result") is placed before the content, so it is not carried by alignment or colour alone. Set `role-label` to name the speaker ("Ada said").\n\n' +
    '**Status** is text with an icon where one fits: `sending`, `sent`, `error` (failed to send) and `streaming` (responding). The text is not a live region by default, because a thread of fifty messages would announce all of them; let `ChatThread` summarise, or set `live` for a single stand-alone message.\n\n' +
    '**Actions** (copy, retry) sit in the `actions` slot. They fade in on hover and when anything inside the message has focus, they are always visible on touch screens and in forced-colors mode, and they stay in the tab order and the accessibility tree while faded, so a keyboard or screen reader user never loses them.\n\n' +
    '**Markdown** goes through the same sanitising renderer as `Markdown`: raw HTML is never parsed, `javascript:` links and unsafe image sources are dropped, external links open in a new tab with `rel="noopener noreferrer"`. Remote images are shown as links, not loaded, unless you set `show-images`. Inline `data:` pictures are shown.',
  status: 'stable',
  props: [
    { name: 'role', type: "'user' | 'assistant' | 'system' | 'tool'", default: "'assistant'", description: 'Author kind. Sets the surface colours, the default side and the hidden speaker phrase. Unknown values fall back to `assistant`.' },
    { name: 'variant', type: "'bubble' | 'plain' | 'card'", default: "'bubble'", description: '`bubble` is a tinted box, `plain` has no box (transcripts, wide text), `card` is a bordered panel. Unknown values fall back to `bubble`.' },
    { name: 'align', type: "'start' | 'end'", description: 'Side of the thread. Defaults to `end` for `user` and `start` otherwise; sets `data-align`. The row uses logical direction, so it mirrors in right-to-left. Unknown values use the default.' },
    { name: 'name', type: 'string', description: 'Participant or tool name shown in the header.' },
    { name: 'datetime', type: 'string | number | Date', description: 'When the message was sent. A valid value renders `<time datetime>` with the ISO string; an invalid value is ignored.' },
    { name: 'timeLabel', type: 'string', description: 'Visible time text that replaces the formatted time ("Just now"). Shown as plain text when `datetime` is missing or invalid.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for the formatted time. A bad value falls back to the runtime default.' },
    { name: 'timeZone', type: 'string', description: 'IANA time zone for the formatted time, for example `UTC`. Set it when the page is server-rendered so both renders print the same text. A bad value falls back to local time.' },
    { name: 'roleLabel', type: 'string', description: 'Visually hidden speaker phrase read before the content ("Ada said"). A trailing colon is added for you. Defaults to a phrase for the role.' },
    { name: 'status', type: "'sending' | 'sent' | 'error' | 'streaming'", description: 'Delivery or generation state, written as text ("Sending", "Sent", "Failed to send", "Responding"). `sending` and `streaming` set `aria-busy` on the message. Unknown values show nothing.' },
    { name: 'statusLabel', type: 'string', description: 'Status text that replaces the default, for translation or a more specific message ("Could not reach the server").' },
    { name: 'live', type: 'boolean', default: 'false', description: 'Make the status text a polite `role="status"` region. Leave off inside a `ChatThread`.' },
    { name: 'markdown', type: 'string', description: 'Markdown source rendered with `Markdown` (size sm, streaming-aware while `status="streaming"`). Wins over the default slot, an empty string renders an empty body.' },
    { name: 'showImages', type: 'boolean', default: 'false', description: 'Load http(s) images found in `markdown`. Off by default: they become links.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element, for example `li` inside a list or `article`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Message content. Ignored when `markdown` is set.' },
    { name: 'avatar', description: 'Avatar or icon beside the message. Decorative unless it carries text; the hidden role phrase already names the speaker.' },
    { name: 'header', props: '{ author?: string; datetime: Date | null }', description: 'Replaces the default header (name and time).' },
    { name: 'actions', description: 'Copy, retry or other buttons. Every control needs an accessible name.' },
  ],
  examples: [
    {
      title: 'A short exchange',
      description: 'Two messages in the default bubble look. The user message sits at the end.',
      code: `<div class="flex flex-col gap-3">
  <ChatMessage role="user">Which environment did the last deploy go to?</ChatMessage>
  <ChatMessage role="assistant">Staging. Production still runs the previous release.</ChatMessage>
</div>`,
    },
    {
      title: 'Roles',
      description: 'Each role has its own surface and a hidden speaker phrase ("You said", "Assistant said", "System message", "Tool result").',
      code: `<div class="flex flex-col gap-3">
  <ChatMessage role="user">Show the queue depth for Kestrel Freight.</ChatMessage>
  <ChatMessage role="assistant">Checking the queue now.</ChatMessage>
  <ChatMessage role="tool" name="queue_depth">{ "queue": "kestrel-freight", "depth": 0 }</ChatMessage>
  <ChatMessage role="system">The session moved to the staging workspace.</ChatMessage>
</div>`,
    },
    {
      title: 'Variants',
      description: '`bubble` (default), `plain` and `card`.',
      code: `<div class="flex flex-col gap-4">
  <ChatMessage variant="bubble" role="assistant">Bubble: a tinted box.</ChatMessage>
  <ChatMessage variant="plain" role="assistant">Plain: no box, for transcripts and long text that should use the full width.</ChatMessage>
  <ChatMessage variant="card" role="assistant">Card: a bordered panel.</ChatMessage>
</div>`,
    },
    {
      title: 'Alignment',
      description: '`align` overrides the side the role would pick. Both rows flip in right-to-left layouts.',
      code: `<div class="flex flex-col gap-3">
  <ChatMessage role="assistant" align="end">An assistant message pushed to the end.</ChatMessage>
  <ChatMessage role="user" align="start">A user message kept at the start.</ChatMessage>
</div>`,
    },
    {
      title: 'Avatar, name and time',
      description: 'A valid `datetime` renders a real `time` element. Set `time-zone` so a server render and the browser print the same text.',
      code: `<div class="flex flex-col gap-3">
  <ChatMessage role="assistant" name="Orchard Mill support" datetime="2026-03-02T09:41:00Z" time-zone="UTC" locale="en">
    <template #avatar><Avatar name="Orchard Mill support" size="sm" /></template>
    The invoice export finished. Download it from the reports page.
  </ChatMessage>
  <ChatMessage role="user" name="You" time-label="Just now" role-label="You wrote">Thanks, that is what I needed.</ChatMessage>
</div>`,
    },
    {
      title: 'Copy and retry actions',
      description: 'Hover or focus anywhere in the message to reveal the buttons. On touch screens they are always visible; keyboard users reach them with Tab.',
      code: `<div class="flex flex-col gap-3">
  <ChatMessage role="assistant">The retry window is five minutes.
    <template #actions>
      <IconButton label="Copy message" :icon="faCopy" size="sm" />
      <IconButton label="Retry reply" :icon="faRotateRight" size="sm" />
    </template>
  </ChatMessage>
</div>`,
      script: `import { faCopy, faRotateRight } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCopy, faRotateRight }),
    },
    {
      title: 'Status as text',
      description: 'Every status is written out, never colour alone. `statusLabel` replaces the default words.',
      code: `<div class="flex flex-col gap-3">
  <ChatMessage role="user" status="sending">Uploading the report.</ChatMessage>
  <ChatMessage role="user" status="sent">Report uploaded.</ChatMessage>
  <ChatMessage role="user" status="error" status-label="Could not reach the server">Please re-run the import.</ChatMessage>
  <ChatMessage role="assistant" status="streaming" markdown="Working through the first three rows" />
</div>`,
    },
    {
      title: 'Markdown',
      description: 'Rich text through the library Markdown renderer. Lists, code fences and links work; links to other sites open in a new tab.',
      code: `<ChatMessage role="assistant" :markdown="text" />`,
      script: `const text = 'Rotate the key in **two steps**: ...'`,
      state: () => ({ text: richText }),
    },
    {
      title: 'Hostile text stays text',
      description: 'Raw HTML is never parsed, `javascript:` links are dropped and remote images become links, so nothing runs and nothing is fetched.',
      code: `<ChatMessage role="assistant" :markdown="text" />`,
      script: `const text = '<script>alert(1)</script> [click me](javascript:alert(1)) ...'`,
      state: () => ({ text: hostileText }),
    },
    {
      title: 'Right to left',
      description: 'The row, the header and the actions use logical direction, so a right-to-left page mirrors the layout.',
      code: `<div dir="rtl" class="flex flex-col gap-3">
  <ChatMessage role="user" role-label="قلت">مرحبا، هل اكتمل النشر؟</ChatMessage>
  <ChatMessage role="assistant" role-label="قال المساعد">نعم، اكتمل النشر على بيئة الاختبار.</ChatMessage>
</div>`,
    },
  ],
  a11y: [
    'The speaker is named in text, not by side or colour: a visually hidden phrase ("You said", "Assistant said", "System message", "Tool result", or `role-label`) comes first in the content.',
    'A valid `datetime` renders a native `<time datetime>`; the visible text can be changed with `time-label`.',
    'Status is visible text (plus an icon for `error` and `sent`). It is not a live region unless `live` is set, so a thread does not announce every message; `ChatThread` owns one polite summary region. `sending` and `streaming` set `aria-busy`.',
    'Actions are ordinary buttons that fade in on `:hover` and `:focus-within`. They are never `display: none` or `visibility: hidden`, so they keep their place in the tab order and the accessibility tree; touch (coarse pointer) and forced-colors modes show them all the time. Every control needs an accessible name.',
    'Markdown output uses real lists, headings, links and code; external links announce that they open in a new tab. Long words and URLs wrap; code scrolls inside its own region, so the message reflows at 320px.',
    'The row uses logical properties and a reversed flex direction, so `dir="rtl"` mirrors it. Bubble surfaces get a transparent border that forced-colors mode draws. Colour pairs are the ones the contrast test covers.',
  ],
  requires: [
    'Throws a ContractError when a button, link or `role="button"` element in the `actions` slot has no accessible name (give icon-only buttons an `aria-label`).',
  ],
  llmNotes: [
    'Use `role` for who wrote it and keep the default `role-label` unless a name reads better ("Ada said"); never rely on alignment or colour to say who spoke.',
    'Give every icon-only control in the `actions` slot an `aria-label`; use `IconButton` with `label`.',
    'Pass streamed Markdown through `markdown` with `status="streaming"`; do not build HTML strings and never use `v-html`.',
    'Leave `live` off inside a `ChatThread`; the thread announces a short summary instead of each status.',
    'Set `time-zone` (and `locale`) when the page is server-rendered; a `time` element needs a valid `datetime`.',
    'Do not name a vendor or a model in the component; pass names through `name` and `role-label`.',
  ],
  related: ['ChatThread', 'Markdown', 'Avatar', 'IconButton'],
}
export default doc
