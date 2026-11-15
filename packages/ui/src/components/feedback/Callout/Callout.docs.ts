import { faBell } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Callout',
  group: 'feedback',
  subgroup: 'Messages',
  summary: 'Documentation-style note, tip, important, warning, caution, danger, success, quote or example block with a tinted surface and a status icon.',
  description:
    'Use `Callout` inside long-form content (docs, articles, settings help) to highlight information. Pick the type by intent: `note` (neutral extra information), `tip` (helpful advice), `important` (must-know information), `warning` (risk of problems), `caution` and `danger` (risk of data loss or breakage; `caution` is a softer-looking icon, same tone), `success` (positive outcome or best practice), `quote` (cited text, rendered in italics) and `example` (worked sample). `appearance` sets the surface (`soft` tinted by default, `solid` filled, `outline` border only, `minimal` icon and text only) and `size` the padding and type scale (`sm`, `md`, `lg`). `dismissible` adds a close button and the `actions` slot puts buttons or links under the text. It is static content, not a status message; it does not announce itself. Use `Alert` for dynamic status messages.',
  status: 'stable',
  props: [
    { name: 'type', type: "'note' | 'tip' | 'important' | 'warning' | 'caution' | 'danger' | 'success' | 'quote' | 'example'", default: "'note'", description: 'Semantic kind; picks colour and default icon. Unknown values fall back to `note`. `data-type` reflects the resolved type.' },
    { name: 'title', type: 'string', description: 'Heading line. Use the `title` slot for rich content.' },
    { name: 'icon', type: 'IconDefinition', description: 'Replaces the default icon of the type.' },
    { name: 'hideIcon', type: 'boolean', default: 'false', description: 'Hides the icon.' },
    { name: 'appearance', type: "'soft' | 'solid' | 'outline' | 'minimal'", default: "'soft'", description: 'Surface, independent of `type`. `solid` fills with the type colour and its foreground; `outline` keeps a coloured border on a transparent surface; `minimal` removes border, fill and side padding. Unknown values fall back to `soft`. Non-default values add `data-appearance`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap, type scale and icon size. Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Shows a dismiss (X) button. Dismissing hides the callout and emits `dismiss` once.' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss'", description: 'Accessible name of the dismiss button. A blank value throws a ContractError when `dismissible`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Body content (text, paragraphs, lists, code).' },
    { name: 'title', description: 'Rich title; overrides the `title` prop.' },
    { name: 'actions', description: 'Buttons or links shown under the text (for example a `Button` with `size="xs"`).' },
  ],
  emits: [{ name: 'dismiss', payload: '[]', description: 'The dismiss button was used. Fires once; the callout then removes itself.' }],
  examples: [
    {
      title: 'Types',
      code: `<div class="grid gap-3">
  <Callout title="Note">Tokens are defined in theme.css.</Callout>
  <Callout type="tip" title="Tip">Use the <code>class</code> prop to override anything.</Callout>
  <Callout type="warning" title="Warning">Changing the accent preset affects every component.</Callout>
  <Callout type="danger" title="Danger">Deleting a workspace cannot be undone.</Callout>
</div>`,
    },
    {
      title: 'Type: important',
      description: 'Must-know information; uses the chart-4 accent token.',
      code: `<Callout type="important" title="Important">Rotate API keys before the migration window.</Callout>`,
    },
    {
      title: 'Type: caution',
      description: 'Risk of breakage with a stop icon; same destructive tone as danger.',
      code: `<Callout type="caution" title="Caution">Running this migration locks the table for several minutes.</Callout>`,
    },
    {
      title: 'Type: success',
      description: 'Positive outcome or recommended practice.',
      code: `<Callout type="success" title="Best practice">Pin dependency versions in production builds.</Callout>`,
    },
    {
      title: 'Type: quote',
      description: 'Cited text in italics on a neutral surface.',
      code: `<Callout type="quote" title="Sample source">Quoted text from the source goes here.</Callout>`,
    },
    {
      title: 'Type: example',
      description: 'Worked sample or sample output.',
      code: `<Callout type="example" title="Example">Calling <code>retry(3)</code> retries the request up to three times.</Callout>`,
    },
    {
      title: 'Custom icon, no title',
      code: `<div class="grid gap-3">
  <Callout :icon="faBell">Notifications are batched every 5 minutes.</Callout>
  <Callout type="tip" hide-icon>Compact variant without an icon.</Callout>
</div>`,
      script: `import { faBell } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faBell }),
    },
    {
      title: 'Appearance',
      description: 'The same type in the four surfaces. `solid` uses the status colour with its foreground token.',
      code: `<div class="grid gap-3">
  <Callout type="note" appearance="soft" title="Soft">Tinted surface, the default.</Callout>
  <Callout type="note" appearance="solid" title="Solid">Filled with the type colour.</Callout>
  <Callout type="warning" appearance="outline" title="Outline">Border only, for busy backgrounds.</Callout>
  <Callout type="tip" appearance="minimal" title="Minimal">Icon and text with no surface.</Callout>
</div>`,
    },
    {
      title: 'Size',
      description: '`sm` for dense settings panels, `lg` for the lead note of an article.',
      code: `<div class="grid gap-3">
  <Callout size="sm" title="Small">Dense notes beside form fields.</Callout>
  <Callout size="md" title="Medium">The default scale.</Callout>
  <Callout size="lg" title="Large">Lead note at the top of a page.</Callout>
</div>`,
    },
    {
      title: 'Dismissible with actions',
      description: 'The dismiss button hides the callout and emits `dismiss`. The `actions` slot sits under the text.',
      code: `<Callout type="important" title="Plan limit reached" dismissible dismiss-label="Hide plan notice">
  New projects are blocked until a plan is chosen.
  <template #actions>
    <Button size="xs">Choose a plan</Button>
    <Button size="xs" variant="outline">Remind me later</Button>
  </template>
</Callout>`,
    },
  ],
  a11y: [
    'Rendered with role="note" so assistive tech identifies it as supplementary content.',
    'The type is conveyed by the icon and the title text, not by colour. The surface keeps a full border for forced-colors mode.',
    'Long words wrap (`break-words`); the body has `min-w-0`.',
    'Every appearance keeps a border or a filled surface, so the callout stays visible in forced-colors mode; `minimal` relies on the icon and the title text.',
    'The dismiss button is a native button named by `dismissLabel` (24px, 40px on coarse pointers) with a visible focus ring; the actions slot content stays in the tab order after the text.',
  ],
  related: ['Alert', 'Banner'],
  requires: [
    'Throws a ContractError when a `Callout` is empty (no `title` and no content).',
    'Throws a ContractError when a `dismissible` `Callout` has a blank `dismissLabel`.',
  ],
  llmNotes: ['Choose `type` by intent: note, tip, important, warning, caution, danger, success, quote, example.', 'Use Callout for static documentation notes; use Alert for runtime status.', 'Give warning/danger callouts a title that names the consequence.', 'Pick `appearance` for emphasis: soft (default), solid (must not be missed), outline (busy backgrounds), minimal (inline hint).', 'Use `dismissible` only for notes the reader can safely hide; give the `dismissLabel` a specific name.'],
  replaces: ['hand-rolled Callout markup in app code'],
}
export default doc
