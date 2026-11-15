import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const links = [
  { label: 'Components', href: '/components' },
  { label: 'Guides', href: '/guides/getting-started' },
  { label: 'Foundations', href: '/foundations/colors' },
]
const linkGroups = [
  { title: 'Reference', links: [{ label: 'Components', href: '/components' }, { label: 'Foundations', href: '/foundations/colors' }] },
  { title: 'Guides', links: [{ label: 'Getting started', href: '/guides/getting-started' }, { label: 'Migration', href: '/guides/migration' }] },
]

const doc: ComponentDoc = {
  name: 'SiteHeader',
  group: 'marketing',
  subgroup: 'Site chrome',
  summary: 'Marketing header in 7 variants (default, centered, minimal, transparent, floating, with-announcement, stacked) with sizes, tones, borders, link groups and a mobile menu.',
  description: [
    'Use at the top of marketing, docs and product sites. Links are plain anchors (`href`) so it works with any router: listen to `navigate` or place RouterLinks in the `links` slot. Below `md` the links collapse behind a menu button; Escape closes the menu and returns focus to the button. The active link gets `aria-current="page"` and an underline, so the state is not colour alone. This is not the app shell top bar; use navigation components for in-app chrome. Unknown `variant` values fall back to `default`.',
    '',
    'All surfaces are opaque: no backdrop blur, no translucent fills, no shadows. The bar is separated from the page by a border.',
    '',
    'Variants and when to use them:',
    '- `default`: logo left, links, actions right, sticky bar. Works everywhere.',
    '- `centered`: logo in the middle, links left, actions right. Brand-led sites with few links.',
    '- `minimal`: slim bar, links always behind the menu button. Landing pages and checkout flows with few distractions.',
    '- `transparent`: overlays the top of the page (fixed, or absolute when `sticky` is false) with no fill, and becomes opaque after scrolling more than 8px or when the menu opens. Only place it over a hero whose surface keeps the link text at 4.5:1 (the default Hero surface does); over a photo use `default` instead.',
    '- `floating`: a bordered `rounded-lg` panel inset from the edges (`w-11/12`, `max-w-5xl`). Product sites that want a detached bar.',
    '- `with-announcement`: default bar plus a primary-colour top bar (`announcement` + optional `announcementHref`, or the `announcement` slot). Only for real news.',
    '- `stacked`: brand and actions on the first row, the navigation on a second row under a rule (links from `md`; below that the menu button opens the usual panel). Sites with many links.',
    '',
    'Look dimensions, all independent of the variant:',
    '- `size` (`sm`, `md`, `lg`): minimum bar height 3rem, 4rem or 5rem (`minimal` and `floating` are one step slimmer), brand text and link text. Targets stay at least 24px (44px on coarse pointers).',
    '- `tone` (`default`, `muted`, `inverted`): page surface, muted surface, or the ink surface with page-coloured text. The `transparent` variant stays transparent over the page until it turns solid, then takes the tone.',
    '- `appearance` (`bordered`, `flat`, `elevated`): the original hairline, no border, or a 2px stronger border. Nothing casts a shadow.',
    '',
    'Simple link groups: pass `linkGroups` (`{ title, links }[]`) for sectioned navigation without dropdowns. Groups sit inline on desktop (separated by a rule, labelled for assistive tech) and appear as headed sections in the mobile menu.',
    '',
    'Sticky behaviour: while `sticky`, the component keeps the page `scroll-padding-top` equal to the header height (restored on unmount) so a focused element is never scrolled underneath it (WCAG 2.4.11). Link only pages that exist; a generic Features/Pricing/Blog row with dead targets is a stock look.',
  ].join('\n'),
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'centered' | 'minimal' | 'transparent' | 'floating' | 'with-announcement' | 'stacked'", default: "'default'", description: 'Look and layout. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Bar minimum height (3rem, 4rem, 5rem; `minimal` and `floating` one step slimmer), brand text and link text. Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'tone', type: "'default' | 'muted' | 'inverted'", default: "'default'", description: 'Surface: the page, the muted surface, or the foreground colour with page-coloured text. `transparent` applies it only once solid. Unknown values fall back to `default`. Reflected as `data-tone`.' },
    { name: 'appearance', type: "'bordered' | 'flat' | 'elevated'", default: "'bordered'", description: 'Edge: hairline border (default), no border, or a stronger 2px border. No shadow in any value. Unknown values fall back to `bordered`. Reflected as `data-appearance`.' },
    { name: 'brand', type: 'string', description: 'Brand text link, used when the `logo` slot is empty.' },
    { name: 'brandHref', type: 'string', default: "'/'", description: 'Brand link target.' },
    { name: 'links', type: 'SiteLink[]', default: '[]', description: '`{ label, href, active?, external? }`.' },
    { name: 'linkGroups', type: 'SiteLinkGroup[]', default: '[]', description: '`{ title, links }` groups shown after `links`; no dropdowns. Malformed or empty groups are skipped.' },
    { name: 'activeHref', type: 'string', description: 'Current path; matching link gets aria-current="page".' },
    { name: 'sticky', type: 'boolean', default: 'true', description: 'Stay in view while scrolling. `transparent`: fixed (true) or absolute (false). While true the page `scroll-padding-top` follows the header height.' },
    { name: 'announcement', type: 'string', description: '`with-announcement`: top bar text.' },
    { name: 'announcementHref', type: 'string', description: '`with-announcement`: makes the top bar text a link.' },
    { name: 'modelValue', type: 'boolean', description: 'v-model for the mobile menu (uncontrolled when omitted).' },
    { name: 'navLabel', type: 'string', default: "'Main'", description: 'Accessible name of the navigation landmark. Give each header on a page a distinct name (the mobile list is named `<navLabel> (mobile)`).' },
    { name: 'menuLabel', type: 'string', default: "'Menu'", description: 'Name of the mobile menu button. Constant while open or closed; `aria-expanded` carries the state (localise here).' },
    { name: 'openLabel', type: 'string', description: 'Optional. Name while closed. Setting it or `closeLabel` switches back to a name that changes with state; prefer `menuLabel`.' },
    { name: 'closeLabel', type: 'string', description: 'Optional. Name while open. See `openLabel`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'logo', description: 'Brand/logo; replaces `brand` text.' },
    { name: 'links', description: 'Custom nav items (e.g. RouterLinks). Rendered in both desktop and mobile navs; replaces `links` and `linkGroups`.' },
    { name: 'cta', description: 'Right-aligned actions (buttons). Shown in the bar from `sm` and inside the mobile panel below `sm`; when there are no links it is always shown in the bar.' },
    { name: 'announcement', description: '`with-announcement`: replaces the top bar text.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[open: boolean]', description: 'Mobile menu opened or closed.' },
    { name: 'navigate', payload: '[link: SiteLink]', description: 'A built-in link was clicked.' },
  ],
  examples: [
    {
      title: 'Default',
      description: 'Each example on this page has its own `nav-label`, so the landmarks stay distinguishable.',
      code: `<SiteHeader brand="Perfect Design" nav-label="Default header" active-href="/components" :sticky="false" :links="links">
  <template #cta><Button size="sm">Open the catalogue</Button></template>
</SiteHeader>`,
      script: `const links = [{ label: 'Components', href: '/components' }, { label: 'Guides', href: '/guides/getting-started' }, ...]`,
      state: () => ({ links }),
    },
    {
      title: 'Controlled menu with custom logo',
      code: `<SiteHeader v-model="open" nav-label="Controlled header" :sticky="false" :links="links">
  <template #logo><span class="text-lg font-semibold">Perfect Design <Badge variant="secondary">beta</Badge></span></template>
</SiteHeader>
<p class="mt-2 text-sm text-muted-foreground">Menu open: {{ open }}</p>`,
      script: `const open = ref(false)\nconst links = [{ label: 'Components', href: '/components' }, { label: 'Source notes', href: '/guides/getting-started', external: true }]`,
      state: () => ({ open: ref(false), links: [{ label: 'Components', href: '/components' }, { label: 'Source notes', href: '/guides/getting-started', external: true }] }),
    },
    {
      title: 'Centered logo',
      code: `<SiteHeader variant="centered" brand="Perfect Design" nav-label="Centered header" :sticky="false" :links="links">
  <template #cta><Button size="sm" variant="outline">Open the catalogue</Button></template>
</SiteHeader>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Minimal',
      code: `<SiteHeader variant="minimal" brand="Perfect Design" nav-label="Minimal header" :sticky="false" :links="links">
  <template #cta><Button size="sm">Open the catalogue</Button></template>
</SiteHeader>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Transparent over a hero',
      description: 'Absolute here (`sticky` false) so it stays inside the demo box; in a real page leave `sticky` on to get a fixed header that turns opaque after scrolling. The hero keeps the default surface so the link text stays readable.',
      code: `<div class="relative overflow-hidden rounded-lg border">
  <SiteHeader variant="transparent" brand="Perfect Design" nav-label="Transparent header" :sticky="false" :links="links">
    <template #cta><Button size="sm">Open the catalogue</Button></template>
  </SiteHeader>
  <Hero :level="3" size="lg" title="The header sits on top of this hero" subtitle="It becomes opaque once the page scrolls." class="pt-32" />
</div>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Floating panel',
      code: `<div class="bg-muted pb-4">
  <SiteHeader variant="floating" brand="Perfect Design" nav-label="Floating header" :sticky="false" :links="links">
    <template #cta><Button size="sm">Open the catalogue</Button></template>
  </SiteHeader>
</div>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'With announcement bar',
      description: 'Only for real news that links somewhere.',
      code: `<SiteHeader variant="with-announcement" announcement="The component catalogue is updated" announcement-href="/components" brand="Perfect Design" nav-label="Announcement header" :sticky="false" :links="links">
  <template #cta><Button size="sm">Open the catalogue</Button></template>
</SiteHeader>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Stacked: brand row above the navigation',
      description: 'Brand and actions on the first row, links on a second row from `md`.',
      code: `<SiteHeader variant="stacked" brand="Perfect Design" nav-label="Stacked header" :sticky="false" :links="links">
  <template #cta><Button size="sm">Open the catalogue</Button></template>
</SiteHeader>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Minimum bar height, brand and link text. Each header has its own `nav-label`.',
      code: `<div class="flex flex-col gap-4">
  <SiteHeader size="sm" brand="Perfect Design" nav-label="Small header" :sticky="false" :links="links" />
  <SiteHeader size="md" brand="Perfect Design" nav-label="Medium header" :sticky="false" :links="links" />
  <SiteHeader size="lg" brand="Perfect Design" nav-label="Large header" :sticky="false" :links="links" />
</div>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Tone gallery: default, muted, inverted',
      description: 'Surface colours. The inverted tone uses the ink surface with page-coloured text and an outline focus indicator in the page colour.',
      code: `<div class="flex flex-col gap-4">
  <SiteHeader tone="default" brand="Perfect Design" nav-label="Default tone header" active-href="/components" :sticky="false" :links="links" />
  <SiteHeader tone="muted" brand="Perfect Design" nav-label="Muted tone header" active-href="/components" :sticky="false" :links="links" />
  <SiteHeader tone="inverted" brand="Perfect Design" nav-label="Inverted tone header" active-href="/components" :sticky="false" :links="links" />
</div>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Appearance gallery: bordered, flat, elevated',
      description: 'The edge under the bar: hairline, none (the surface alone separates it) or a stronger 2px border.',
      code: `<div class="flex flex-col gap-4">
  <SiteHeader appearance="bordered" brand="Perfect Design" nav-label="Bordered header" :sticky="false" :links="links" />
  <SiteHeader appearance="flat" tone="muted" brand="Perfect Design" nav-label="Flat header" :sticky="false" :links="links" />
  <SiteHeader appearance="elevated" brand="Perfect Design" nav-label="Elevated header" :sticky="false" :links="links" />
</div>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Combined: floating, muted, large',
      code: `<div class="bg-background pb-4">
  <SiteHeader variant="floating" tone="muted" appearance="elevated" size="lg" brand="Perfect Design" nav-label="Combined header" :sticky="false" :links="links">
    <template #cta><Button size="sm">Open the catalogue</Button></template>
  </SiteHeader>
</div>`,
      script: `const links = [...]`,
      state: () => ({ links }),
    },
    {
      title: 'Link groups (no dropdowns)',
      code: `<SiteHeader brand="Perfect Design" nav-label="Grouped header" :sticky="false" :link-groups="groups">
  <template #cta><Button size="sm">Open the catalogue</Button></template>
</SiteHeader>`,
      script: `const groups = [{ title: 'Reference', links: [{ label: 'Components', href: '/components' }, ...] }, { title: 'Guides', links: [...] }]`,
      state: () => ({ groups: linkGroups }),
    },
  ],
  requires: [
    'Throws a ContractError when a link has an empty `label` or `href`, or a link group has an empty `title` (the first one is named by location).',
    'Throws a ContractError when the navigation is shown and `navLabel` is empty.',
    'Throws a ContractError when the navigation is shown and the menu button has no name (`menuLabel` emptied; not checked while `openLabel` / `closeLabel` are in use).',
  ],
  a11y: [
    'The root is a `header` (banner) with a labelled `nav` (`navLabel`). Several headers on one page need distinct `navLabel`s, or axe reports landmark-unique.',
    'The menu button is a real button with a constant name (`menuLabel`, default "Menu"), `aria-expanded` and `aria-controls` pointing at the panel. Focus stays on the button when the panel opens, so the next Tab enters the panel. Escape closes the panel and returns focus to the button.',
    'Keyboard: Tab / Shift+Tab move through links and actions in DOM order; Enter activates links; there is no arrow-key menu model because this is site navigation, not an application menu.',
    'The current page uses `aria-current="page"` and an underline (not colour alone, and visible in forced-colors mode). External links use `target="_blank"` with `rel="noopener noreferrer"`.',
    'Link groups are `role="group"` named by the group title (desktop) with a visible heading (mobile).',
    'Sticky header: `scroll-padding-top` follows the header height so focus is not obscured (WCAG 2.4.11).',
    'Targets are at least 24px (44px on coarse pointers). The bar has a minimum, not fixed, height and the desktop nav wraps, so it reflows at 320px and with 200% text. Logical properties (`ms-`, `ps-`, `border-s`) keep RTL correct.',
    '`size`, `tone`, `appearance` and the `stacked` variant change looks and layout only: landmark, names, keyboard map, `aria-expanded` and Escape behave the same. The inverted tone draws focus as a 2px outline in the page colour (the shared ring colour is too close to the ink surface); the current page stays underlined in every tone. `stacked` keeps DOM order brand, links, actions, so Tab order is unchanged.',
    'All surfaces are opaque (no blur), so text contrast is the tested token pair. The only scroll listener is passive and toggles a colour; nothing animates beyond a short colour transition that stops under prefers-reduced-motion.',
  ],
  related: ['SiteFooter', 'Hero', 'Button', 'ScrollProgress'],
  llmNotes: [
    'Use one SiteHeader per page. If a page shows several (docs, demos), give each a distinct `nav-label`.',
    'Pick by need: default for most sites, centered for brand-led, minimal for focused flows, transparent over a plain Hero, floating for a detached bar, with-announcement for real news, stacked for many links.',
    'Use `size` for density, `tone="inverted"` for a dark bar on a light page, `appearance="flat"` only with a tone that differs from the page surface.',
    'Use `transparent` only directly above full-width hero content with a solid surface; keep `sticky` true in real pages (fixed) and add top padding to the Hero. There is no blur variant.',
    'Link only pages that exist.',
    'Pass router paths as `href` and set `active-href` from the current route.',
    'Put at most one primary Button in `cta`.',
    'Use the `links` slot with RouterLink when client-side routing is required; use `linkGroups` for sectioned links instead of building dropdowns.',
    'The announcement props/slot only render in `with-announcement`.',
  ],
  replaces: ['hand-rolled SiteHeader markup in app code'],
}
export default doc
