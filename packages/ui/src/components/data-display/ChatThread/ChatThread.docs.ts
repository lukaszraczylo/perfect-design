import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

interface Sample {
  id: number
  role: 'user' | 'assistant'
  text: string
  at: string
}
const seed = (): Sample[] => [
  { id: 1, role: 'user', text: 'Did the Orchard Mill export finish?', at: '2026-03-01T16:20:00Z' },
  { id: 2, role: 'assistant', text: 'Yes. The file is on the reports page.', at: '2026-03-01T16:21:00Z' },
  { id: 3, role: 'user', text: 'Please run it again for February.', at: '2026-03-02T09:05:00Z' },
  { id: 4, role: 'assistant', text: 'Started. It takes about two minutes.', at: '2026-03-02T09:05:30Z' },
]
const many = (count: number): Sample[] => Array.from({ length: count }, (_, i) => ({ id: i + 1, role: i % 2 ? 'assistant' : 'user', text: `Sample message ${i + 1}`, at: '2026-03-02T09:05:00Z' }))

const messageTemplate = `<template #message="{ message }">
      <ChatMessage :role="message.role" :datetime="message.at" time-zone="UTC" locale="en">{{ message.text }}</ChatMessage>
    </template>`

const doc: ComponentDoc = {
  name: 'ChatThread',
  group: 'data-display',
  subgroup: 'Chat',
  summary: 'Scrolling conversation log that follows the latest message, with day separators, a typing indicator, a jump button, older-message loading and one polite announcement region.',
  description:
    'Use `ChatThread` around `ChatMessage` items. It is a labelled, focusable `role="log"` scroll region. Give the root a height (`class="h-96"`, or let a flex parent size it); the log fills it and scrolls.\n\n' +
    '**Two ways to fill it.** Pass `messages` and draw each one in the `message` slot (day separators, unread count and announcements need the data), or put `ChatMessage` elements in the default slot for a short, static transcript.\n\n' +
    '**Follow.** While the reader is at the bottom, new and growing messages keep the view at the bottom. Scrolling up stops following and shows a "Jump to latest" button (with the number of messages that arrived meanwhile). The button is a normal focusable button; using it scrolls down, resumes following and moves focus back to the log. `follow-change` reports the state.\n\n' +
    '**Announcements.** The log is `aria-live="off"`, so assistive technology never reads a streamed reply token by token. A single sibling `role="status"` region carries a short summary ("2 new messages", or the typing label when it appears), collected for one second so a burst is one sentence, and cleared after a few seconds. Set `announcement` to supply your own text. Nothing is announced for the first render or for older messages added at the top.\n\n' +
    '**Days.** `item-date` (a property name or a function) groups messages by calendar day in `time-zone`; labels use `Intl` in `locale` and say "Today" and "Yesterday" once mounted. All rows are rendered, which is fine for thousands of simple messages; for very large histories load older pages with `load-older` instead of rendering everything.\n\n' +
    'Attributes you pass (`aria-label`, `aria-labelledby`, `id`, `data-*`) land on the log element; `class` and `style` land on the root.',
  status: 'stable',
  props: [
    { name: 'messages', type: 'readonly T[]', description: 'Messages as data, each drawn by the `message` slot. `null` counts as empty. Omit it to use the default slot.' },
    { name: 'itemKey', type: 'string | ((item: T, index: number) => string | number)', description: 'Stable key per message (property name or function). Needed to tell appended from prepended messages and for stable DOM. Defaults to the index.' },
    { name: 'itemDate', type: 'string | ((item: T, index: number) => string | number | Date)', description: 'When a message was sent, for day separators (property name or function). Items without a valid date join the day before them. Without it there are no separators.' },
    { name: 'label', type: 'string', description: 'Accessible name of the log. Required: set `label`, `aria-label` or `aria-labelledby`.' },
    { name: 'follow', type: 'boolean', default: 'true', description: 'Stay at the bottom while the reader is at the bottom; scrolling up stops it and shows the jump button. Off makes a plain scrolling list with no button.' },
    { name: 'typing', type: 'boolean', default: 'false', description: 'Show the typing or streaming indicator (text plus a dot that pulses only without reduced motion). Sets `aria-busy` and announces once when it appears.' },
    { name: 'density', type: "'compact' | 'default' | 'relaxed'", default: "'default'", description: 'Spacing between messages and around the thread. Unknown values fall back to `default`.' },
    { name: 'canLoadOlder', type: 'boolean', default: 'false', description: 'More history exists: shows the load-older control above the first message.' },
    { name: 'loadingOlder', type: 'boolean', default: 'false', description: 'A load is running: disables the control and blocks repeated requests.' },
    { name: 'autoLoadOlder', type: 'boolean', default: 'false', description: 'Also emit `load-older` once when the reader scrolls to the top. It fires again only after `loadingOlder` ends or `canLoadOlder` changes, so it cannot loop.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for day labels. Falls back to `ConfigProvider`, then `en` (not the runtime locale), so server and client print the same text.' },
    { name: 'timeZone', type: 'string', description: 'IANA time zone that decides which day a message belongs to (Falls back to `ConfigProvider`, then `UTC` (not the runtime zone).).' },
    { name: 'now', type: 'string | number | Date', description: 'The current time, for "Today" and "Yesterday". Defaults to the clock after mount (so a server render prints plain dates); pass it for tests or server rendering.' },
    { name: 'announcement', type: 'string', description: 'Text to announce politely (collected for one second) instead of the automatic "N new messages". Use it with the default slot, which cannot be counted.' },
    { name: 'labels', type: 'Partial<ChatThreadLabels>', description: 'Replace any built-in text: `jump`, `unread(count)`, `loadOlder`, `loadingOlder`, `typing`, `empty`, `newMessages(count)`. Use it to translate.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge on the root; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Static `ChatMessage` elements, used when `messages` is not set.' },
    { name: 'message', props: '{ message: T; index: number; id: string | number }', description: 'Draws one message from `messages`. Required when `messages` is set.' },
    { name: 'empty', description: 'Shown when there are no messages (default "No messages yet").' },
    { name: 'typing', description: 'Replaces the typing indicator content.' },
    { name: 'load-older', props: '{ loading: boolean; load: () => void }', description: 'Replaces the load-older button. Call `load` to emit `load-older`.' },
    { name: 'day', props: '{ label: string; date: string }', description: 'Replaces the text of a day separator. `date` is `YYYY-MM-DD`.' },
  ],
  emits: [
    { name: 'load-older', description: 'More history is wanted: the button was pressed, or the top was reached with `autoLoadOlder`.' },
    { name: 'follow-change', payload: '[following: boolean]', description: 'The reader started or stopped following the latest message.' },
  ],
  examples: [
    {
      title: 'A short transcript in the default slot',
      description: 'Static messages. The log is labelled and keyboard scrollable.',
      code: `<ChatThread label="Export questions" class="h-64 rounded-md border">
  <ChatMessage role="user">Did the Orchard Mill export finish?</ChatMessage>
  <ChatMessage role="assistant">Yes. The file is on the reports page.</ChatMessage>
  <ChatMessage role="user">Thanks.</ChatMessage>
</ChatThread>`,
    },
    {
      title: 'Messages as data with day separators',
      description: '`messages` plus the `message` slot. `item-date` groups by day in `time-zone`; "Today" and "Yesterday" follow `now`.',
      code: `<ChatThread :messages="messages" item-key="id" item-date="at" label="Export conversation" time-zone="UTC" locale="en" now="2026-03-02T12:00:00Z" class="h-72 rounded-md border">
    ${messageTemplate}
</ChatThread>`,
      script: `const messages = [
  { id: 1, role: 'user', text: 'Did the Orchard Mill export finish?', at: '2026-03-01T16:20:00Z' },
  // ...
]`,
      state: () => ({ messages: seed() }),
    },
    {
      title: 'Follow the latest message',
      description: 'Add messages at the bottom to follow them. Scroll up first and the "Jump to latest" button appears with a count of what you missed.',
      code: `<div class="flex flex-col gap-2">
  <Button size="sm" variant="outline" class="self-start" @click="add">Add a message</Button>
  <ChatThread :messages="messages" item-key="id" label="Live conversation" class="h-48 rounded-md border">
    ${messageTemplate}
  </ChatThread>
</div>`,
      script: `const messages = ref(many(12))
const add = () => { messages.value = [...messages.value, { id: messages.value.length + 1, role: 'assistant', text: 'Sample message', at: '2026-03-02T09:05:00Z' }] }`,
      state: () => {
        const messages = ref(many(12))
        return { messages, add: () => (messages.value = [...messages.value, { id: messages.value.length + 1, role: 'assistant', text: `Sample message ${messages.value.length + 1}`, at: '2026-03-02T09:05:00Z' }]) }
      },
    },
    {
      title: 'Typing and streaming',
      description: '`typing` shows a text indicator at the end. A streaming reply is a `ChatMessage` with `status="streaming"` and `markdown`; its text is never read out piece by piece.',
      code: `<ChatThread label="Streaming reply" typing class="h-64 rounded-md border">
  <ChatMessage role="user">List the open invoices for Brightwater Co.</ChatMessage>
  <ChatMessage role="assistant" status="streaming" markdown="There are **three** open invoices:" />
</ChatThread>`,
    },
    {
      title: 'Load older messages',
      description: 'The button emits `load-older`. `loading-older` disables it until the page arrives; the reader keeps their place when messages are added above.',
      code: `<ChatThread :messages="messages" item-key="id" label="History" can-load-older :loading-older="loading" class="h-64 rounded-md border" @load-older="older">
    ${messageTemplate}
</ChatThread>`,
      script: `const messages = ref(seed())
const loading = ref(false)
const older = () => { /* fetch, then prepend with new ids */ }`,
      state: () => {
        const messages = ref(seed().map((m) => ({ ...m, id: m.id + 3 })))
        const loading = ref(false)
        return {
          messages,
          loading,
          older: () => {
            loading.value = true
            setTimeout(() => {
              messages.value = [{ id: 1, role: 'user', text: 'An earlier question.', at: '2026-02-27T10:00:00Z' }, { id: 2, role: 'assistant', text: 'An earlier answer.', at: '2026-02-27T10:01:00Z' }, { id: 3, role: 'user', text: 'Another earlier question.', at: '2026-02-27T10:02:00Z' }, ...messages.value]
              loading.value = false
            }, 300)
          },
        }
      },
    },
    {
      title: 'Empty state',
      description: 'The `empty` slot replaces the default text.',
      code: `<ChatThread :messages="[]" label="New conversation" class="h-40 rounded-md border">
  <template #empty>Ask a question about the Kestrel Freight queue to begin.</template>
  <template #message="{ message }">{{ message }}</template>
</ChatThread>`,
    },
    {
      title: 'Density',
      description: '`compact`, `default` and `relaxed` change the gap between messages and the padding around the thread.',
      code: `<div class="grid gap-3 sm:grid-cols-3">
  <ChatThread density="compact" label="Compact thread" class="h-40 rounded-md border"><ChatMessage role="user">One</ChatMessage><ChatMessage>Two</ChatMessage></ChatThread>
  <ChatThread density="default" label="Default thread" class="h-40 rounded-md border"><ChatMessage role="user">One</ChatMessage><ChatMessage>Two</ChatMessage></ChatThread>
  <ChatThread density="relaxed" label="Relaxed thread" class="h-40 rounded-md border"><ChatMessage role="user">One</ChatMessage><ChatMessage>Two</ChatMessage></ChatThread>
</div>`,
    },
    {
      title: 'Locale, time zone and right to left',
      description: 'Day labels use `Intl` in the given locale. In a right-to-left page the rows and separators mirror.',
      code: `<div dir="rtl">
  <ChatThread :messages="messages" item-key="id" item-date="at" label="محادثة التصدير" time-zone="UTC" locale="ar" now="2026-03-02T12:00:00Z" class="h-64 rounded-md border">
    ${messageTemplate}
  </ChatThread>
</div>`,
      state: () => ({ messages: seed() }),
    },
    {
      title: 'Translated texts and custom announcement',
      description: '`labels` replaces the built-in words. `announcement` is spoken politely once, after a short pause.',
      code: `<ChatThread label="Conversation" :typing="true" :labels="{ typing: 'Writing a reply', jump: 'Go to the newest message' }" announcement="Reply received" class="h-40 rounded-md border">
  <ChatMessage role="user">Hello</ChatMessage>
</ChatThread>`,
    },
  ],
  a11y: [
    'The log is one element with `role="log"`, `tabindex="0"` and a required accessible name, so keyboard users can scroll it: arrow keys, Page Up and Page Down scroll natively; Home and End jump to the first and last message (and End resumes following).',
    '`aria-live="off"` keeps screen readers from reading the log as it grows. One sibling `role="status"` region announces a short summary at most once per second ("2 new messages", the typing label, or `announcement`), is cleared after a few seconds, and never contains message text.',
    'The jump button is an ordinary focusable button after the log. Pressing it scrolls to the latest message, resumes following and returns focus to the log, so focus is never lost when the button disappears.',
    'Day separators are text (`<time datetime>` with a localised label) between two rules drawn as borders, so they survive forced-colors mode. The typing indicator is text; its dot pulses only under `prefers-reduced-motion: no-preference` and only while the indicator is shown.',
    'Scrolling is instant, with no smooth-scroll animation. The thread is `min-w-0` and wraps, so it reflows at 320px; spacing uses logical properties and mirrors in right-to-left.',
    'Message actions inside the log are ordinary buttons in the tab order; the log does not trap focus.',
  ],
  requires: [
    'Throws a ContractError when the log has no accessible name (`label`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when `messages` is set but there is no `message` slot to draw each item.',
  ],
  llmNotes: [
    'Always name the thread with `label` and give the root a height (`class="h-96"`), otherwise nothing scrolls.',
    'Use `messages` with a `message` slot and set `item-key` to a stable id, so appended and prepended messages are told apart; set `item-date` for day separators.',
    'Do not add your own live region and never put streamed text in `announcement`; the thread announces counts only.',
    'Use `follow-change` to show your own state; do not scroll the log by hand (call the exposed `scrollToBottom()` if you must).',
    'Emit-driven history: set `can-load-older`, handle `load-older`, toggle `loading-older`, then prepend items with keys that are not reused.',
    'Pass `time-zone` and `now` when server rendering, so the first client render matches the server render.',
  ],
  related: ['ChatMessage', 'Markdown', 'VirtualList', 'ScrollArea'],
}
export default doc
