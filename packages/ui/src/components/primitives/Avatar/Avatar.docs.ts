import { faUser } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Avatar',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Shows a user or entity as an image with an initials fallback and an optional status dot.',
  description:
    'Use `Avatar` wherever a person, team or workspace is identified visually. Pass `src` and `name`: if the image is missing or fails to load, initials derived from `name` are shown instead. Variations: `shape` (`circle`, `rounded`, `square`), `size` (`xs` to `2xl`), `status` presence dot with `statusPosition` (any of the four corners) and a decorative `ring` (e.g. the current user or a story). To stack several avatars use `AvatarGroup`. Do not use it for arbitrary thumbnails (use a plain `<img>`).',
  status: 'stable',
  props: [
    { name: 'src', type: 'string', description: 'Image URL. Load failure falls back to initials; changing `src` retries.' },
    { name: 'alt', type: 'string', description: 'Alternative text. Defaults to `name`. Required unless `name` is set; `alt=""` marks the avatar decorative (the person is named in text beside it).' },
    { name: 'name', type: 'string', description: 'Full name. First letter of the first and last word become the initials, and it labels the avatar.' },
    { name: 'fallback', type: 'string', description: 'Text shown instead of derived initials (e.g. `+3`).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md' (or the AvatarGroup size)", description: 'size-6 / 8 / 10 / 12 / 16 / 24. Unknown values fall back to md.' },
    { name: 'shape', type: "'circle' | 'rounded' | 'square'", default: "'circle' (or the AvatarGroup shape)", description: 'rounded-full, rounded-xl or rounded-md. Unknown values fall back to circle.' },
    { name: 'ring', type: "'none' | 'border' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | boolean", default: "'none'", description: 'Decorative 2px ring with an offset gap. `true` = primary. Unknown values draw no ring. Inside an AvatarGroup the group ring styling takes precedence visually; set `ring` on standalone avatars.' },
    { name: 'status', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", description: 'Draws a small status dot (bottom-right by default). Unknown values draw nothing.' },
    { name: 'statusPosition', type: "'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'", default: "'bottom-right'", description: 'Corner of the status dot. Unknown values fall back to bottom-right.' },
    { name: 'statusLabel', type: 'string', description: 'Accessible label of the dot; defaults to the status name.' },
    { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Custom fallback content (icon, text) shown when there is no image. Replaces initials.' }],
  examples: [
    {
      title: 'Image, initials and sizes',
      code: `<div class="flex flex-wrap items-center gap-3">
  <Avatar name="Author One" size="xs" />
  <Avatar name="Author Two" size="sm" />
  <Avatar name="Author Five" />
  <Avatar name="Author Three" size="lg" />
  <Avatar name="Author Four" size="xl" shape="square" />
  <Avatar src="data:," name="Broken Image" />
</div>`,
    },
    {
      title: 'Shapes',
      code: `<div class="flex flex-wrap items-center gap-3">
  <Avatar name="Author One" shape="circle" />
  <Avatar name="Author Two" shape="rounded" />
  <Avatar name="Author Five" shape="square" />
</div>`,
    },
    {
      title: 'All sizes',
      code: `<div class="flex flex-wrap items-end gap-3">
  <Avatar name="Author One" size="xs" />
  <Avatar name="Author One" size="sm" />
  <Avatar name="Author One" size="md" />
  <Avatar name="Author One" size="lg" />
  <Avatar name="Author One" size="xl" />
  <Avatar name="Author One" size="2xl" status="success" />
</div>`,
    },
    {
      title: 'Status position',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Avatar name="Author One" status="success" status-position="bottom-right" />
  <Avatar name="Author Two" status="warning" status-position="bottom-left" />
  <Avatar name="Author Five" status="danger" status-position="top-right" />
  <Avatar name="Author Three" status="info" status-position="top-left" shape="rounded" />
</div>`,
    },
    {
      title: 'Ring',
      description: 'An offset ring marks the current user or an active item.',
      code: `<div class="flex flex-wrap items-center gap-4 p-1">
  <Avatar name="Author One" ring />
  <Avatar name="Author Two" ring="success" />
  <Avatar name="Author Five" ring="warning" shape="rounded" />
  <Avatar name="Author Three" ring="danger" />
  <Avatar name="Author Four" ring="info" size="lg" status="success" />
  <Avatar name="Bot" ring="border" shape="square" />
</div>`,
    },
    {
      title: 'Status and custom fallback',
      code: `<div class="flex flex-wrap items-center gap-3">
  <Avatar name="Author One" status="success" status-label="Online" />
  <Avatar name="Author Two" status="warning" />
  <Avatar name="Author Five" status="danger" />
  <Avatar name="Bot" status="info"><Icon :icon="faUser" /></Avatar>
</div>`,
      state: () => ({ faUser }),
    },
  ],
  a11y: [
    'With an image: renders `<img alt>` (alt falls back to name).',
    'Without an image the root gets role="img" with aria-label = alt or name; the initials are aria-hidden so they are not read as letters.',
    'The status dot is decorative (aria-hidden). Because role="img" hides its children from assistive tech, the status text is folded into the avatar\'s own name ("Author One, online"; override the text with `statusLabel`), so colour is never the only signal.',
    'The avatar is not interactive. Wrap it in a Button or Link (with its own name) when it should be clickable; do not rely on the avatar for the control name.',
  ],
  related: ['AvatarGroup', 'Badge', 'Icon'],
  requires: [
    'Throws a ContractError when an Avatar has neither `name` nor `alt` (`alt=""` marks it decorative and is accepted).',
  ],
  llmNotes: [
    'Always pass `name` (even with `src`) so the fallback and label work.',
    'Do not hard-code size via width/height classes; use the `size` prop.',
    'Use `statusPosition` and `ring` instead of absolutely positioning your own dots or ring classes.',
    'Do not nest Avatars manually for stacks; use AvatarGroup.',
  ],
  replaces: ['shadcn-vue Avatar/AvatarImage/AvatarFallback', 'ad-hoc user initials circles'],
}
export default doc
