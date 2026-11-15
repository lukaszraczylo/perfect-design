import { faBell } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'InlineMessage',
  group: 'feedback',
  subgroup: 'Messages',
  summary: 'One-line, field-level message with a tone-coloured icon.',
  description:
    'Use `InlineMessage` for short validation or helper feedback directly under a field or next to a control ("Username is taken", "Looks good"). Give it an `id` and reference it from the control with `aria-describedby`. For longer or section-level messages use `Alert`.',
  status: 'stable',
  props: [
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Colour and default icon. Unknown values fall back to `neutral`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text and icon size (text-xs, text-sm, text-base). Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'variant', type: "'plain' | 'soft' | 'outline'", default: "'plain'", description: '`plain` is coloured text with an icon; `soft` adds a tinted box; `outline` adds a bordered box. Use the boxed forms for a message that stands alone (above a form, beside a toolbar). Unknown values fall back to `plain`. Non-default values add `data-variant`.' },
    { name: 'icon', type: 'IconDefinition', description: 'Replaces the tone icon.' },
    { name: 'hideIcon', type: 'boolean', default: 'false', description: 'Hides the icon.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Message text.' }],
  examples: [
    {
      title: 'Tones',
      code: `<div class="grid gap-2">
  <InlineMessage>Use at least 8 characters.</InlineMessage>
  <InlineMessage tone="info">We will never share your email.</InlineMessage>
  <InlineMessage tone="success">Username is available.</InlineMessage>
  <InlineMessage tone="warning">This password is easy to guess.</InlineMessage>
  <InlineMessage tone="danger">Username is already taken.</InlineMessage>
</div>`,
    },
    {
      title: 'Variant and size',
      description: 'Boxed forms keep the icon and the text, so the tone is never colour alone.',
      code: `<div class="grid justify-items-start gap-2">
  <InlineMessage tone="success" variant="soft">Saved to the draft folder.</InlineMessage>
  <InlineMessage tone="warning" variant="soft" size="sm">Two fields were trimmed.</InlineMessage>
  <InlineMessage tone="danger" variant="outline">The key could not be verified.</InlineMessage>
  <InlineMessage tone="info" variant="outline" size="lg">Changes apply on the next sign in.</InlineMessage>
</div>`,
    },
    {
      title: 'Small, custom icon, wired to a field',
      code: `<div class="grid max-w-xs gap-1.5">
  <label for="docs-im-email" class="text-sm font-medium">Email</label>
  <input id="docs-im-email" class="h-9 rounded-md border bg-transparent px-3 text-sm" aria-invalid="true" aria-describedby="docs-im-email-msg" />
  <InlineMessage id="docs-im-email-msg" size="sm" tone="danger" :icon="faBell">Enter a valid address.</InlineMessage>
</div>`,
      script: `import { faBell } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faBell }),
    },
  ],
  a11y: [
    'role="alert" for danger (announced immediately), role="status" otherwise.',
    'Pair it with `aria-describedby` on the control. The icon is decorative.',
    'The tone is carried by the icon and the message text in every variant. `outline` keeps a border for forced-colors mode; `soft` is tinted text on a tinted fill (the same pairs as a soft Badge).',
    'The box variants shrink to the text (`w-fit`) and wrap at `max-w-full`, so long messages reflow at 320px.',
  ],
  related: ['Alert', 'Field'],
  llmNotes: ['Use `variant="soft"` or `"outline"` only for a message that stands alone; under a field use the plain default.', 'Always give the message an id and link it with aria-describedby.', 'Keep it to a single short sentence.'],
  replaces: ['hand-rolled InlineMessage markup in app code'],
}
export default doc
