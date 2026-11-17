import { faUser } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

/** Offline sample portrait (head and shoulders, no text); `%23` is an encoded `#` so the data URI stays valid. */
const samplePortrait = () =>
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23e4e4e7'/><circle cx='40' cy='31' r='14' fill='%23a1a1aa'/><path d='M12 80c2-17 14-26 28-26s26 9 28 26z' fill='%23a1a1aa'/></svg>"

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
    { name: 'blurred', type: 'boolean', description: 'Privacy blur for screen sharing, demos and sensitive uploads. Blurs the image and the initials (they identify the person too); the status dot stays sharp. Wins over `ConfigProvider blurMedia` and over an AvatarGroup, true or false. Undefined (default) inherits, then falls back to false. There is no reveal control: the avatar is too small.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Custom fallback content (icon, text) shown when there is no image. Replaces initials.' }],
  examples: [
    {
      title: 'Image, initials and sizes',
      description: 'The first and fourth avatars load a generated sample portrait; the others show initials; the last has a broken `src` and falls back to initials.',
      script: 'const portrait = samplePortrait()',
      code: `<div class="flex flex-wrap items-center gap-3">
  <Avatar :src="portrait" name="Author One" size="xs" />
  <Avatar name="Author Two" size="sm" />
  <Avatar name="Author Five" />
  <Avatar :src="portrait" name="Author Three" size="lg" />
  <Avatar name="Author Four" size="xl" shape="square" />
  <Avatar src="data:," name="Broken Image" />
</div>`,
      state: () => ({ portrait: samplePortrait() }),
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
    {
      title: 'Privacy blur',
      description: 'The image and the initials are blurred, the status dot stays sharp. The accessible name is unchanged. Use it while sharing a screen, not as decoration.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <Avatar :src="portrait" name="Author One" blurred />
  <Avatar name="Author Two" status="success" blurred />
  <Avatar :src="portrait" name="Author Three" />
</div>`,
      script: 'const portrait = samplePortrait()',
      state: () => ({ portrait: samplePortrait() }),
    },
  ],
  a11y: [
    'Blur is visual only: the `alt`, the accessible name and the status text are unchanged, and the root gets `data-blurred` as a styling and test hook. Do not rely on it to hide a name from assistive technology; pass `alt=""` or omit `name` where the person must not be named.',
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
    'Use `blurred` (or `ConfigProvider blurMedia`) for privacy, never as decoration. It blurs the initials as well as the image.',
    'Always pass `name` (even with `src`) so the fallback and label work.',
    'Do not hard-code size via width/height classes; use the `size` prop.',
    'Use `statusPosition` and `ring` instead of absolutely positioning your own dots or ring classes.',
    'Do not nest Avatars manually for stacks; use AvatarGroup.',
  ],
  replaces: ['shadcn-vue Avatar/AvatarImage/AvatarFallback', 'ad-hoc user initials circles'],
}
export default doc
