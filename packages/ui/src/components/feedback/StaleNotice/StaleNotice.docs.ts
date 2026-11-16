import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StaleNotice',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Shows when data was last updated, turns into a warning once it is stale, with optional refresh button.',
  description:
    'Use `StaleNotice` on dashboards and cached views. Pass the time of the last successful fetch; the relative time ("5 minutes ago") re-renders on an interval and the notice switches to the warning style after `staleAfter`. A missing or unparsable timestamp is a mistake: it throws a ContractError (see `requires`); in production it renders "unknown" and counts as stale. The pure helper `formatRelativeTime(date, now?, locale?)` is exported too.',
  status: 'stable',
  props: [
    { name: 'timestamp', type: 'Date | number | string', required: true, description: 'Last update time (Date, epoch ms or parsable date string). Missing or invalid values throw a ContractError.' },
    { name: 'variant', type: "'default' | 'inline' | 'banner' | 'pill'", default: "'default'", description: 'Look. `default` is a bordered box; `inline` is icon and text only; `banner` a full-width strip with top and bottom borders; `pill` a small rounded chip. Unknown values fall back to `default`. Non-default values add `data-variant`.' },
    { name: 'tone', type: "'auto' | 'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'auto'", description: '`auto` is `warning` once stale and `neutral` while fresh. Any other value forces that colour in both states; the stale wording still appears when stale. Unknown values fall back to `auto`. An explicit tone adds `data-tone`.' },
    { name: 'staleAfter', type: 'number', default: '300000', description: 'Age in ms after which the data is stale (strictly greater than).' },
    { name: 'interval', type: 'number', default: '30000', description: 'Re-render interval in ms. 0 disables ticking.' },
    { name: 'label', type: 'string', default: "'Last updated'", description: 'Text before the relative time.' },
    { name: 'staleLabel', type: 'string', default: "'Data may be out of date.'", description: 'Text shown while stale.' },
    { name: 'hideWhenFresh', type: 'boolean', default: 'false', description: 'Render nothing until the data is stale.' },
    { name: 'refreshable', type: 'boolean', default: 'false', description: 'Show a refresh button.' },
    { name: 'refreshLabel', type: 'string', default: "'Refresh'", description: 'Refresh button text.' },
    { name: 'refreshing', type: 'boolean', default: 'false', description: 'Spinner + disabled refresh button.' },
    { name: 'locale', type: 'string', default: 'ConfigProvider locale, then `en`', description: 'BCP 47 tag for Intl.RelativeTimeFormat. Invalid tags fall back to `en`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [{ name: 'refresh', payload: '[]', description: 'Refresh button clicked (not emitted while `refreshing`).' }],
  examples: [
    {
      title: 'Fresh',
      script: `const updated = Date.now() - 90_000`,
      code: `<StaleNotice :timestamp="updated" />`,
      state: () => ({ updated: Date.now() - 90_000 }),
    },
    {
      title: 'Stale with refresh',
      script: `const updated = Date.now() - 20 * 60_000\nconst busy = ref(false)\nfunction refresh() { busy.value = true; setTimeout(() => (busy.value = false), 1000) }`,
      code: `<StaleNotice :timestamp="updated" refreshable :refreshing="busy" @refresh="refresh" />`,
      state: () => {
        const busy = ref(false)
        return { updated: Date.now() - 20 * 60_000, busy, refresh: () => { busy.value = true; setTimeout(() => (busy.value = false), 1000) } }
      },
    },
    {
      title: 'Variants and tone',
      description: 'Each look keeps the clock icon and the words, so freshness is never shown by colour alone.',
      script: `const updated = Date.now() - 20 * 60_000\nconst fresh = Date.now() - 60_000`,
      code: `<div class="grid justify-items-start gap-3">
  <StaleNotice :timestamp="updated" variant="banner" class="justify-self-stretch" refreshable />
  <StaleNotice :timestamp="fresh" variant="pill" tone="success" label="Synced" />
  <StaleNotice :timestamp="updated" variant="inline" />
  <StaleNotice :timestamp="fresh" tone="info" />
  <StaleNotice :timestamp="updated" tone="danger" stale-label="Data could not be refreshed." />
</div>`,
      state: () => ({ updated: Date.now() - 20 * 60_000, fresh: Date.now() - 60_000 }),
    },
  ],
  a11y: [
    'role="status" (polite). The text only changes when the relative time rolls over, not on every tick.',
    'The time is a <time datetime> element with the absolute time as title, set in tabular figures.',
    'Every variant and tone keeps the icon and the same text. `default`, `banner` and `pill` keep a border for forced-colors mode; `inline` relies on the icon and the words. Tinted surfaces use `text-foreground`.',
    'The stale state is conveyed by text, not colour alone. The refresh button is a labelled <button> and is disabled while refreshing.',
  ],
  related: ['OfflineIndicator', 'Alert'],
  requires: [
    'Throws a ContractError when a `StaleNotice` has a missing or unparsable `timestamp`.',
  ],
  llmNotes: ['Leave `tone` on `auto` unless the product has a reason to force a colour; use `variant="banner"` for a page-level strip and `pill` for a header.', 'Pass the timestamp of the last SUCCESSFUL fetch, not of the last attempt.', 'Handle @refresh and drive `refreshing` from the request state.', 'The interval timer is cleaned up on unmount.'],
  replaces: ['hand-rolled StaleNotice markup in app code'],
}
export default doc
