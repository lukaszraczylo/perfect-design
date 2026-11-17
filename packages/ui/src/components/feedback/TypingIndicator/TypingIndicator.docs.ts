import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'TypingIndicator',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Three softly pulsing dots in a compact bubble that show someone or something is writing, with the label announced once.',
  description:
    'Use `TypingIndicator` at the end of a conversation while a person or an assistant is composing a reply. It is a polite `role="status"` whose visually hidden `label` ("Mira is typing") is the only thing a screen reader announces; the dots are decoration. `ChatThread` draws one for its `typing` prop. Use `Spinner` or `LoadingState` for a wait that is not a reply being written, and `Progress` when the amount done is known.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', default: "'Typing'", description: 'Visually hidden text announced politely once. Name who is typing when it is known. Empty or blank falls back to `Typing`.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Dot size and padding: 4px or 6px dots. Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'variant', type: "'bubble' | 'plain'", default: "'bubble'", description: '`bubble` is a muted rounded chip; `plain` is the dots only, in the surrounding text colour. Unknown values fall back to `bubble`. Non-default values add `data-variant`.' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'Hide it from assistive tech (no role, no label text). Use when a parent region already announces the state, as `ChatThread` does.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    { title: 'Default', description: 'A bubble with the default label.', code: `<TypingIndicator />` },
    {
      title: 'Named, sizes and looks',
      description: 'Name who is typing in the label; `plain` sits inline in a line of text.',
      code: `<div class="flex flex-col items-start gap-3">
  <TypingIndicator label="Mira is typing" />
  <TypingIndicator size="sm" label="Sample assistant is writing" />
  <p class="flex items-center gap-2 text-sm text-muted-foreground">Sample assistant <TypingIndicator variant="plain" size="sm" label="Sample assistant is typing" /></p>
</div>`,
    },
  ],
  a11y: [
    '`role="status"` (polite live region) with a visually hidden label; the three dots are `aria-hidden`, so the label is announced once and the animation is never read.',
    'Under `prefers-reduced-motion` the dots are static and slightly faded: nothing moves.',
    'The dots use `currentColor` on the muted token pair, so contrast follows the theme. State is never colour alone: the label carries the meaning.',
    'With `decorative` it has no role and no text; give the surrounding region the announcement.',
  ],
  related: ['ChatThread', 'ChatMessage', 'Spinner', 'LoadingState'],
  llmNotes: [
    'Put one at the end of a conversation while a reply is being written; in `ChatThread` set `typing` instead of placing it by hand.',
    'Set `label` to say who is typing ("Mira is typing"); do not leave generic text when the name is known.',
    'Use `decorative` only when a parent already announces the state.',
    'Use `Spinner` or `LoadingState` for waits that are not a reply being composed.',
  ],
  replaces: ['hand-rolled bouncing dots', 'chat typing bubble markup'],
}
export default doc
