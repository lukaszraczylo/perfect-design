import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Link',
  group: 'primitives',
  subgroup: 'Links',
  summary: 'Inline text link with variants, safe external handling and RouterLink support.',
  description:
    'Use `Link` for navigation inside or between text. `external` opens a new tab with `rel="noopener noreferrer"`, adds an arrow icon and an sr-only "(opens in new tab)" hint. For router navigation pass `as` (or `as-child`) with a RouterLink and give it its `to` as an attribute. For link-looking buttons use `Button variant="link"`; for button-looking links use `Button as="a"`.\n\nVariations:\n\n- `variant`: `default` (primary, underline on hover), `underline` (primary, always underlined), `muted`, `subtle` (foreground colour, always underlined), `plain` (inherits the surrounding text colour, always underlined, for links inside tinted or coloured text) and `destructive` (destructive colour, always underlined, for links to irreversible actions such as a delete page).\n- `size`: `inherit` (default, keeps the surrounding text size), `sm` (14px), `md` (16px), `lg` (18px).\n\nInline links are exempt from the 24px minimum target size (WCAG 2.5.8); a standalone link in a toolbar or list should sit in a row with at least 24px of height.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'underline' | 'muted' | 'subtle' | 'plain' | 'destructive'", default: "'default'", description: 'default = primary, underline on hover; underline = always underlined; muted = grey; subtle = foreground colour with underline; plain = inherits the text colour, underlined; destructive = destructive colour, underlined. Unknown values fall back to default.' },
    { name: 'size', type: "'inherit' | 'sm' | 'md' | 'lg'", default: "'inherit'", description: 'inherit keeps the size of the surrounding text; sm, md, lg set text-sm, text-base, text-lg. Unknown values fall back to inherit.' },
    { name: 'href', type: 'string', description: 'Destination. Omitted while `disabled`.' },
    { name: 'external', type: 'boolean', default: 'false', description: 'target="_blank", rel="noopener noreferrer", trailing icon and sr-only hint.' },
    { name: 'externalLabel', type: 'string', default: "'(opens in new tab)'", description: 'Visually hidden hint read after an external link. Use it to translate the text; a `ConfigProvider` label `link.externalHint` sets it for a whole subtree and this prop wins.' },
    { name: 'externalIcon', type: 'boolean', default: 'true', description: 'Show the trailing arrow icon on external links.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'aria-disabled, tabindex -1, no href, clicks blocked.' },
    { name: 'as', type: 'string | Component', default: "'a'", description: 'Element or component (e.g. RouterLink) to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (no icon or sr-only hint is added).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Link text.' }],
  examples: [
    {
      title: 'Variants',
      code: `<p class="text-sm">
  Read the <Link href="/guides/getting-started">guide</Link>, the <Link href="/components" variant="underline">component list</Link>,
  the <Link href="/foundations/accessibility" variant="muted">accessibility notes</Link> or the <Link href="/guides/customisation" variant="subtle">customisation guide</Link>.
</p>`,
    },
    {
      title: 'External and disabled',
      code: `<div class="flex flex-col gap-2 text-sm">
  <Link href="https://vuejs.org" external>Vue.js</Link>
  <Link href="https://vuejs.org" external :external-icon="false">Vue.js without icon</Link>
  <Link href="/guides/testing" disabled>Disabled link</Link>
</div>`,
    },
    {
      title: 'Plain and destructive variants',
      description: '`plain` takes the colour of the text around it; `destructive` marks a link to an irreversible action. Both stay underlined so they do not rely on colour.',
      code: `<div class="flex flex-col gap-2 text-sm">
  <p class="rounded-md bg-muted px-3 py-2 text-muted-foreground">Sample note with a <Link href="/guides/testing" variant="plain">plain link</Link> that keeps the note colour.</p>
  <p>Sample warning: <Link href="/guides/customisation" variant="destructive">delete the sample project</Link> cannot be undone.</p>
</div>`,
    },
    {
      title: 'Sizes',
      description: '`inherit` follows the paragraph; the other sizes set the text size on the link itself.',
      code: `<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
  <Link href="/components">inherit</Link>
  <Link href="/components" size="sm">sm</Link>
  <Link href="/components" size="md">md</Link>
  <Link href="/components" size="lg">lg</Link>
</div>`,
    },
  ],
  a11y: [
    'External links announce "(opens in new tab)" via an sr-only span.',
    'Disabled links use role="link" with aria-disabled="true", drop href and leave the tab order (an `<a>` without `href` would otherwise lose its role).',
    'Links are distinguishable without colour: `default` and `muted` underline on hover and focus, `underline` and `subtle` are always underlined; use one of those inside running text.',
    '`plain` and `destructive` are underlined at rest, so the link is not marked by colour alone. `plain` inherits its colour: check contrast against the surface it sits on. `destructive` uses text-destructive on the page background, a tested pair.',
    'Visible focus ring on keyboard focus.',
  ],
  related: ['Button'],
  requires: [
    'Throws a ContractError when a plain Link (`as="a"`, not disabled) has no `href`, or an `asChild` Link wraps an element without `href`.',
    'Throws a ContractError when a Link has no accessible name (an icon-only link needs `aria-label` or `aria-labelledby`).',
  ],
  llmNotes: [
    'Use `size` only for standalone links; inside a paragraph leave it on `inherit`.',
    'Use `external` for off-site URLs; never write target="_blank" manually.',
    'For RouterLink use `as` / `as-child`, not onClick + router.push.',
    'Do not use Link for actions that do not navigate; use Button.',
  ],
  replaces: ['plain <a class="text-primary"> links', 'shadcn-vue style link buttons for text links'],
}
export default doc
