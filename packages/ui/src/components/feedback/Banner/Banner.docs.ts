import { ref } from 'vue'
import { faBullhorn, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Banner',
  group: 'feedback',
  subgroup: 'Messages',
  summary: 'Full-width, page-level notice with optional sticky position, action slot and remembered dismissal.',
  description:
    'Use `Banner` at the very top of a page or layout for global announcements: maintenance windows, upgrade prompts, degraded service. Set `storageKey` so a dismissed banner stays dismissed across visits. Use `Alert` for messages inside the page content.\n\nPlacements: `top` (default strip at the top of a layout), `bottom` (strip at the bottom, e.g. cookie notices), `floating` (fixed, centred rounded card near the bottom of the viewport for announcements that should not shift layout) and `inline` (rounded block inside the content flow, e.g. above a table). Appearance: `solid` (filled, loud) or `soft` (tinted, calmer). Add a call to action with `actionLabel` (+ `actionHref` for a link) or the `action` slot.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning' | 'destructive'", default: "'default'", description: 'Solid tone. Unknown values fall back to `default`.' },
    { name: 'placement', type: "'top' | 'bottom' | 'floating' | 'inline'", default: "'top'", description: 'Where the banner sits. `floating` is `position: fixed` (centred, bottom of the viewport); `inline` is a rounded in-flow block. Unknown values fall back to `top`. Non-default values add `data-placement`.' },
    { name: 'appearance', type: "'solid' | 'soft'", default: "'solid'", description: 'Filled tone or tinted background with a tone border. Unknown values fall back to `solid`. `soft` adds `data-appearance`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap and type scale. Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'layout', type: "'default' | 'centered'", default: "'default'", description: '`centered` centres the message and the actions (announcement strips). Unknown values fall back to `default`. Non-default values add `data-layout`.' },
    { name: 'sticky', type: 'boolean', default: 'false', description: 'Sticks to the top of the scroll container (z-sticky); with `placement="bottom"` it sticks to the bottom. Ignored for `floating` and `inline`.' },
    { name: 'actionLabel', type: 'string', description: 'Built-in call-to-action label (small outlined button, or a link with `actionHref`). Blank values render nothing. The `action` slot overrides it.' },
    { name: 'actionHref', type: 'string', description: 'Turns the built-in call-to-action into a link.' },
    { name: 'icon', type: 'IconDefinition', description: 'Optional leading FontAwesome icon.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Shows a dismiss button.' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss'", description: 'Accessible label of the dismiss button.' },
    { name: 'storageKey', type: 'string', description: 'Remember dismissal in localStorage under `pd-banner:<storageKey>`; the banner is not rendered next time. Storage errors are ignored.' },
    { name: 'role', type: "'alert' | 'status' | 'note'", description: 'Overrides the computed role: `alert` for warning/destructive, `status` otherwise.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Message text.' },
    { name: 'action', description: 'Right-aligned actions, usually a small Button or link. Overrides `actionLabel`.' },
  ],
  emits: [
    { name: 'dismiss', payload: '[]', description: 'The dismiss button was used (fires once).' },
    { name: 'action', payload: '[]', description: 'The built-in call-to-action (`actionLabel`) was clicked. Not emitted for content in the `action` slot.' },
  ],
  examples: [
    {
      title: 'Announcement',
      code: `<Banner variant="info" :icon="faBullhorn">Scheduled maintenance on Saturday 02:00-04:00 UTC.</Banner>`,
      script: `import { ref } from 'vue'
import { faBullhorn, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faBullhorn }),
    },
    {
      title: 'Action, dismissible and remembered',
      code: `<Banner variant="default" dismissible storage-key="docs-demo-upgrade">
  The workspace storage is almost full.
  <template #action><Button size="xs" variant="secondary">Upgrade</Button></template>
</Banner>`,
    },
    {
      title: 'Size and layout',
      description: '`sm` for dense admin shells, `lg` for a prominent site-wide strip, `centered` for announcements with one action.',
      code: `<div class="grid gap-3">
  <Banner variant="info" size="sm" placement="inline">Small strip with one line of text.</Banner>
  <Banner variant="info" size="lg" placement="inline">Large strip with room for longer text.</Banner>
  <Banner variant="warning" layout="centered" placement="inline" action-label="View status" action-href="#status">Some builds are delayed.</Banner>
</div>`,
    },
    {
      title: 'Placement: bottom',
      description: 'Strip at the bottom edge of a layout or scroll container; `sticky` anchors it to the bottom.',
      code: `<div class="flex h-40 flex-col overflow-auto rounded-md border">
  <div class="min-h-24 flex-1 p-4 text-sm">Page content.</div>
  <Banner placement="bottom" variant="info" sticky>This site stores one cookie to remember your theme.</Banner>
</div>`,
    },
    {
      title: 'Placement: floating',
      description: 'Fixed, centred card near the bottom of the viewport. (Wrapped in a transformed box here so it stays inside the demo.)',
      code: `<div class="relative h-40 overflow-hidden rounded-md border transform-gpu">
  <p class="p-4 text-sm text-muted-foreground">App content behind the banner.</p>
  <Banner placement="floating" variant="default" action-label="Open appearance settings" action-href="/foundations/themes">Dark mode is available.</Banner>
</div>`,
    },
    {
      title: 'Placement: inline',
      description: 'Rounded block inside the content flow, e.g. above a table.',
      code: `<div class="grid gap-3">
  <Banner placement="inline" variant="warning" :icon="faTriangleExclamation">Showing cached data from 10 minutes ago.</Banner>
  <div class="rounded-md border p-4 text-sm">Table content</div>
</div>`,
      script: `import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faTriangleExclamation }),
    },
    {
      title: 'Soft tones',
      description: 'Tinted appearance for calmer notices; every tone is available.',
      code: `<div class="grid gap-2">
  <Banner appearance="soft" placement="inline">Default</Banner>
  <Banner appearance="soft" placement="inline" variant="info">Info</Banner>
  <Banner appearance="soft" placement="inline" variant="success">Success</Banner>
  <Banner appearance="soft" placement="inline" variant="warning">Warning</Banner>
  <Banner appearance="soft" placement="inline" variant="destructive">Destructive</Banner>
</div>`,
    },
    {
      title: 'Call to action',
      description: '`actionLabel` renders a button and emits `action`; add `actionHref` for a link.',
      script: `import { ref } from 'vue'\nconst clicks = ref(0)`,
      code: `<div class="grid gap-2">
  <Banner variant="info" action-label="Upgrade plan" dismissible @action="clicks++">Storage is almost full.</Banner>
  <Banner variant="success" appearance="soft" action-label="Read the migration guide" action-href="/guides/migration">A new major version is available.</Banner>
  <p class="text-sm text-muted-foreground">CTA clicked {{ clicks }} time(s)</p>
</div>`,
      state: () => ({ clicks: ref(0) }),
    },
    {
      title: 'Sticky warning',
      code: `<div class="h-24 overflow-auto rounded-md border">
  <Banner variant="warning" sticky>Service is degraded.</Banner>
  <div class="h-64 p-4 text-sm">Scroll me; the banner stays on top.</div>
</div>`,
    },
  ],
  a11y: [
    'role="status" (polite) by default. Warning and destructive use role="alert".',
    'Dismiss is a labelled <button> with a visible focus ring (28px square, 40px on coarse pointers). The call to action is a real button or link.',
    'Every size and layout keeps the 24px dismiss target (40px on coarse pointers); the centred layout still wraps at 320px.',
    'Colour pairs use the *-foreground tokens for contrast in light and dark mode.',
    'Content wraps (`break-words`, `min-w-0`), the floating placement is capped at the viewport width minus 2rem, so it reflows at 320px.',
  ],
  related: ['Alert', 'Callout', 'OfflineIndicator'],
  requires: [
    'Throws a ContractError when a `Banner` is empty (no text) or is `dismissible` with a blank `dismissLabel`. A dismissible banner without `storageKey` is allowed: it comes back on the next page load.',
  ],
  llmNotes: [
    'Place one Banner at the top of the layout, outside the main content.',
    'Always set `storageKey` on dismissible marketing/upgrade banners so they do not reappear.',
    'Pick the placement by context: `top`/`bottom` for layout-level strips, `floating` for announcements, `inline` inside content.',
    'Prefer `actionLabel`/`actionHref` for a single call to action; use the `action` slot only for custom controls.',
    'Use `size="sm"` for dense app shells and `layout="centered"` for short announcements with a single action.',
    'Keep banner text to one or two lines; put actions in the `action` slot.',
  ],
  replaces: ['hand-rolled Banner markup in app code'],
}
export default doc
