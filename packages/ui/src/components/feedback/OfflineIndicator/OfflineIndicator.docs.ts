import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'OfflineIndicator',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Shows a warning message while the browser is offline; renders nothing visible when online.',
  description:
    'Place `OfflineIndicator` once near the top of the layout. It uses `useOnline()` from the library helpers (navigator.onLine plus online/offline events). The live-region wrapper is always mounted so screen readers announce the message when it appears. Use the `offline` prop to drive it from your own connectivity check.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'banner' | 'pill' | 'inline'", default: "'default'", description: 'Look while offline. `default` is a bordered, tinted box; `banner` a full-width filled strip for the top of a layout; `pill` a small chip for headers and toolbars; `inline` icon and text only. Unknown values fall back to `default`. Non-default values add `data-variant`.' },
    { name: 'label', type: 'string', default: "'You are offline. Changes may not be saved.'", description: 'Message while offline. The default slot overrides it.' },
    { name: 'icon', type: 'IconDefinition', default: 'faWifi', description: 'Leading icon.' },
    { name: 'offline', type: 'boolean', description: 'Force the state instead of reading the browser. Leave undefined for automatic detection.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces the label text.' }],
  examples: [
    { title: 'Forced offline (preview)', code: `<OfflineIndicator offline />` },
    {
      title: 'Custom message',
      code: `<OfflineIndicator offline label="No connection. We will retry automatically." />`,
    },
    {
      title: 'Variants',
      description: 'The same message in the four looks. Every look keeps the icon and the text.',
      code: `<div class="grid justify-items-start gap-3">
  <OfflineIndicator offline variant="banner" class="justify-self-stretch" />
  <OfflineIndicator offline variant="default" />
  <OfflineIndicator offline variant="pill" label="Offline" />
  <OfflineIndicator offline variant="inline" label="You are offline. Edits are kept on this device." />
</div>`,
    },
    { title: 'Automatic (hidden while online)', code: `<OfflineIndicator />` },
  ],
  a11y: [
    'role="status" with aria-live="polite" on an always-mounted wrapper, so the message is announced when it appears.',
    'The message is text with an icon, never colour alone. The text wraps and has `min-w-0`.',
    'Every variant keeps the same live region. `default` and `pill` keep a border and `banner` a filled strip, so they stay visible in forced-colors mode; `inline` relies on the icon and the words. The banner uses the warning fill with its foreground token.',
  ],
  related: ['Banner', 'StaleNotice', 'Alert'],
  llmNotes: ['Pick `variant="banner"` for the top of a layout, `pill` for a header or toolbar, `inline` inside a form footer.', 'Mount once in the app shell.', 'Use the `offline` prop only for previews or custom connectivity checks.'],
  replaces: ['ad-hoc navigator.onLine banners'],
}
export default doc
