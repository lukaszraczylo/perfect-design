import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SkipLink',
  group: 'navigation',
  subgroup: 'Accessibility',
  summary: 'Visually hidden "Skip to main content" link that appears on keyboard focus.',
  description:
    'Render it as the very first focusable element of the page and give your main landmark `id="main-content"` (or change `href`). It is invisible until focused with Tab, then shows as a fixed button. Activating it moves focus to the target (adding `tabindex="-1"` when needed) so the skip also works with screen readers in single-page apps. If the target is missing the browser handles the fragment natively.',
  status: 'stable',
  props: [
    { name: 'href', type: 'string', default: "'#main-content'", description: 'Fragment link to the main landmark. Non-fragment values are left to the browser.' },
    { name: 'variant', type: "'solid' | 'outline' | 'inverted'", default: "'solid'", description: 'Look of the link while it is focused: primary fill, bordered page surface or foreground fill. Unknown values fall back to `solid`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size while focused. Unknown values fall back to `md`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  slots: [{ name: 'default', description: 'Link text. Defaults to "Skip to main content".' }],
  examples: [
    {
      title: 'Default',
      description: 'The target is a plain `div` here because the docs page already has a `main` landmark; in an app point it at your `main` element.',
      code: `<div class="relative rounded-lg border p-4">
  <SkipLink href="#skip-demo-target" class="focus:absolute" />
  <p class="text-sm text-muted-foreground">Press Tab to reveal the link.</p>
  <div id="skip-demo-target" class="mt-3 text-sm">Target content</div>
</div>`,
    },
    {
      title: 'Custom text and target',
      code: `<div class="relative rounded-lg border p-4">
  <SkipLink href="#skip-demo-docs" class="focus:absolute">Skip to documentation</SkipLink>
  <div id="skip-demo-docs" class="text-sm">Documentation body</div>
</div>`,
    },
    {
      title: 'Variants and sizes',
      description: 'Tab through the three links to see each focused look; every one targets the block below it.',
      code: `<div class="relative grid gap-3 rounded-lg border p-4">
  <SkipLink href="#skip-demo-solid" variant="solid" class="focus:absolute">Skip to the solid example</SkipLink>
  <SkipLink href="#skip-demo-outline" variant="outline" size="sm" class="focus:absolute">Skip to the outline example</SkipLink>
  <SkipLink href="#skip-demo-inverted" variant="inverted" size="lg" class="focus:absolute">Skip to the inverted example</SkipLink>
  <p class="text-sm text-muted-foreground">Press Tab to reveal each link in turn.</p>
  <div id="skip-demo-solid" class="text-sm">Solid target</div>
  <div id="skip-demo-outline" class="text-sm">Outline target</div>
  <div id="skip-demo-inverted" class="text-sm">Inverted target</div>
</div>`,
    },
  ],
  a11y: [
    'Meets WCAG 2.4.1 Bypass Blocks.',
    'Hidden with sr-only so it stays in the tab order; on focus it appears at the start edge of the viewport (`start-3`, RTL-safe) with the focus ring and a surface chosen by `variant` (primary fill, bordered page surface or foreground fill, all token pairs that pass AA). `size` only changes the padding and text size of that focused state; the smallest is 24px high.',
    'Enter on it moves focus to the target (tabindex="-1" is added when missing), rather than only the scroll position.',
    'Use one SkipLink per page and one `main` landmark as its target; a second `main` or a `main` nested in another landmark fails axe.',
  ],
  related: ['AppHeader', 'BackToTop'],
  requires: [
    'Throws a ContractError when `href` is a fragment (`#main-content`) and no element with that id exists in the document after mount.',
    'Throws a ContractError when `href` is blank, or the link has no text.',
  ],
  llmNotes: ['Place it first inside <body>/#app, before the header.', 'Ensure the main element has the matching id and is rendered in the same layout: the id is checked shortly after the link mounts.', 'Do not hide it with display:none or visibility:hidden.'],
  replaces: ['hand-rolled SkipLink markup in app code'],
}
export default doc
