import { faEnvelope, faRss, faGlobe } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const demoLinks = () => [
  { label: 'Email', href: 'mailto:name@example.com', icon: faEnvelope },
  { label: 'RSS feed', href: '/rss.xml', icon: faRss },
  { label: 'Website', href: '/', icon: faGlobe },
]

const doc: ComponentDoc = {
  name: 'SocialLinks',
  group: 'marketing',
  subgroup: 'Contact',
  summary: 'Row or column of icon-only links to social/profile pages in plain, outline, filled or ghost styles, each with an aria-label.',
  description:
    'Use in footers, author boxes and contact sections. Pass FontAwesome `IconDefinition`s (brand icons require `@fortawesome/free-brands-svg-icons` in your app; the library itself only ships solid icons). Entries without a label or href are skipped because icon-only links without a name are inaccessible. `variant` picks the look (`ghost` is the original style), `size` the hit area, `align` the position along the main axis and `orientation` row or column.',
  status: 'stable',
  props: [
    { name: 'links', type: 'SocialLink[]', default: '[]', description: '`{ label, href, icon }`; label becomes the aria-label. Entries without a `label` or `href` are a contract violation, not skipped silently.' },
    { name: 'variant', type: "'ghost' | 'plain' | 'outline' | 'filled'", default: "'ghost'", description: 'Look. `ghost`: muted icon with an accent background on hover (the original style). `plain`: no background, colour change only. `outline`: bordered square with rounded corners. `filled`: solid primary. Unknown values fall back to `ghost`. Reflected as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Hit area (2 / 2.5 / 3rem, at least 2.75rem on coarse pointers) and icon size; unknown falls back to md.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Position along the main axis (justify in a row, items in a column). Unknown values fall back to `start`.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: '`horizontal` wraps in a row, `vertical` stacks in a column. Unknown values fall back to `horizontal`. Reflected as `data-orientation`.' },
    { name: 'newTab', type: 'boolean', default: 'true', description: 'target="_blank" with rel="noopener noreferrer".' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root `<ul>`; wins over internal classes.' },
  ],
  examples: [
    { title: 'Basic: icon links', code: `<SocialLinks :links="links" />`, state: () => ({ links: [{ label: 'Email', href: 'mailto:name@example.com', icon: faEnvelope }, { label: 'RSS feed', href: '/rss.xml', icon: faRss }] }) },
    { title: 'Realistic: large, same tab', code: `<SocialLinks size="lg" :new-tab="false" :links="links" />`, state: () => ({ links: [{ label: 'Website', href: '/', icon: faGlobe }] }) },
    {
      title: 'Ghost variant (default)',
      code: `<SocialLinks variant="ghost" :links="links" />`,
      state: () => ({ links: demoLinks() }),
    },
    {
      title: 'Plain variant',
      description: 'Bare icons; only the colour changes on hover. Good for dense footers.',
      code: `<SocialLinks variant="plain" size="sm" :links="links" />`,
      state: () => ({ links: demoLinks() }),
    },
    {
      title: 'Outline variant',
      code: `<SocialLinks variant="outline" :links="links" />`,
      state: () => ({ links: demoLinks() }),
    },
    {
      title: 'Filled variant, large',
      description: 'Solid primary; strongest call to follow.',
      code: `<SocialLinks variant="filled" size="lg" :links="links" />`,
      state: () => ({ links: demoLinks() }),
    },
    {
      title: 'Centered row',
      code: `<SocialLinks variant="outline" align="center" :links="links" />`,
      state: () => ({ links: demoLinks() }),
    },
    {
      title: 'Vertical column, aligned to the end',
      description: 'A rail of icons for a sidebar or a sticky share bar.',
      code: `<SocialLinks orientation="vertical" align="end" variant="filled" size="sm" class="w-12" :links="links" />`,
      state: () => ({ links: demoLinks() }),
    },
  ],
  a11y: [
    'A native `ul` of links. Each link is named by its `label` (aria-label) because it is icon-only; icons are aria-hidden. Entries without a label or href are skipped.',
    'Keyboard: Tab / Shift+Tab through the links, Enter to follow. Visible focus ring that also shows as an outline in forced-colors mode.',
    'Hit areas are 32/40/48px, raised to at least 44px on coarse pointers, and the row wraps so it reflows at 320px.',
    'Links open in a new tab by default (`target="_blank"` with `rel="noopener noreferrer"`); set `newTab` to false for same-tab navigation.',
  ],
  requires: [
    'Throws a ContractError when an entry of `links` has no non-empty `label` (the link is icon-only) or no non-empty `href`. The message names the first failing index.',
  ],
  related: ['SiteFooter', 'ContactLink'],
  llmNotes: ['Choose `variant`: ghost or plain in footers, outline on light content sections, filled for a prominent block. Use `orientation="vertical"` only for rails/sidebars.', 'Always provide a human label ("GitHub"), never rely on the icon alone.', 'Only link profiles that exist; an icon with no target is a dead end.', 'Install a brand icon package in the app for brand icons.'],
  replaces: ['hand-rolled SocialLinks markup in app code'],
}
export default doc
