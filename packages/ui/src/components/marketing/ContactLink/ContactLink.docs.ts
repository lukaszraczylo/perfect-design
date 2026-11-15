import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ContactLink',
  group: 'marketing',
  subgroup: 'Contact',
  summary: 'mailto: or tel: link with a leading icon, as an inline link, a button (filled, outline or ghost) or a card.',
  description:
    'Use for email addresses and phone numbers in headers, footers and contact sections. For `tel` the display text keeps your formatting while the href is reduced to dialable characters. A missing value renders plain text instead of a dead link. `variant` picks the look: `inline` (text link), `button` (filled button), `outline` (bordered button), `ghost` (borderless button with a fill on hover) or `card` (bordered block with a bare icon, the `label` as headline and the raw `value` beneath it); `size` scales text, icon and padding; `tone` picks the colour (primary, neutral or muted) and `shape` the corners (rounded, pill or square). Tone and shape never change the accessible name or the `mailto:` / `tel:` target.',
  status: 'stable',
  props: [
    { name: 'type', type: "'email' | 'tel'", default: "'email'", description: 'Link scheme. Unknown values behave as email.' },
    { name: 'value', type: 'string', description: 'Address or number. Empty renders a non-link span.' },
    { name: 'label', type: 'string', description: 'Visible text; defaults to `value`. In the `card` variant it is the headline and `value` is shown as the secondary line when they differ.' },
    { name: 'subject', type: 'string', description: 'mailto subject (email only), URL-encoded automatically.' },
    { name: 'icon', type: 'IconDefinition', description: 'Override the default envelope/phone icon.' },
    { name: 'noIcon', type: 'boolean', default: 'false', description: 'Hide the icon (and the icon tile in `card`).' },
    { name: 'variant', type: "'inline' | 'button' | 'outline' | 'ghost' | 'card'", default: "'inline'", description: 'Look. `button` is filled, `outline` has a border and a hover fill, `ghost` has no border and a hover fill (a border appears in forced-colors mode). Unknown values fall back to `inline`. Reflected as `data-variant`.' },
    { name: 'tone', type: "'primary' | 'neutral' | 'muted'", default: "'primary'", description: 'Colour. `inline` and `ghost`: text in primary, foreground or muted-foreground. `button`: primary fill, foreground fill with background text, or secondary fill. `outline`: border and text in primary, foreground (input border) or muted-foreground. `card`: icon colour. Neutral and muted inline links are underlined so colour is not the only cue. Applies to real links only; a non-link span keeps the surrounding colour. Unknown values fall back to `primary`. Reflected as `data-tone`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners: the original radius of the variant (`rounded-sm` inline, `rounded-md` buttons, `rounded-lg` card), `rounded-full`, or none. Also shapes the focus ring. Unknown values fall back to `rounded`. Reflected as `data-shape`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text, icon and padding scale (button minimum heights 2 / 2.25 / 2.75rem). Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces the visible text (the headline in the `card` variant).' }],
  examples: [
    { title: 'Basic: email', code: `<ContactLink value="hello@example.com" subject="Question about pricing" />` },
    { title: 'Realistic: phone with label', code: `<ContactLink type="tel" value="+1 555 0100" label="Call us: 555 0100" />` },
    {
      title: 'Inline variant, small',
      description: 'Compact text link for footers and captions.',
      code: `<ContactLink variant="inline" size="sm" value="support@example.com" />`,
    },
    {
      title: 'Button variant',
      description: 'A filled call to action that opens the mail client.',
      code: `<ContactLink variant="button" value="sales@example.com" label="Email sales" subject="Pricing question" />`,
    },
    {
      title: 'Button variant, large phone',
      code: `<ContactLink variant="button" size="lg" type="tel" value="+1 555 0100" label="Call +1 555 0100" />`,
    },
    {
      title: 'Card variant',
      description: 'Bordered block with a bare icon; label as headline, value beneath. Stack in a contact grid. The addresses are samples.',
      code: `<div class="grid max-w-2xl gap-3 sm:grid-cols-2">
  <ContactLink variant="card" value="hello@example.com" label="Email us" />
  <ContactLink variant="card" type="tel" value="+1 555 0100" label="Call us" />
</div>`,
    },
    {
      title: 'Card variant, large without icon',
      code: `<ContactLink variant="card" size="lg" no-icon class="max-w-sm" value="press@example.com" label="Press enquiries" />`,
    },
    {
      title: 'Outline and ghost variants',
      description: 'Bordered and borderless buttons for secondary contact actions. The addresses are samples.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <ContactLink variant="outline" value="sales@example.com" label="Email sales" />
  <ContactLink variant="ghost" value="support@example.com" label="Email support" />
  <ContactLink variant="outline" type="tel" value="+1 555 0100" label="Call +1 555 0100" />
</div>`,
    },
    {
      title: 'Tones',
      description: 'Gallery of `tone` across the variants: primary (default), neutral and muted.',
      code: `<div class="grid max-w-3xl gap-4 sm:grid-cols-3">
  <div v-for="t in ['primary', 'neutral', 'muted']" :key="t" class="flex flex-col items-start gap-3">
    <ContactLink :tone="t" value="name@example.com" :label="'Inline ' + t" />
    <ContactLink variant="button" :tone="t" value="name@example.com" :label="'Button ' + t" />
    <ContactLink variant="outline" :tone="t" value="name@example.com" :label="'Outline ' + t" />
    <ContactLink variant="ghost" :tone="t" value="name@example.com" :label="'Ghost ' + t" />
    <ContactLink variant="card" :tone="t" value="name@example.com" :label="'Card ' + t" />
  </div>
</div>`,
    },
    {
      title: 'Shapes',
      description: 'Gallery of `shape`: rounded (default), pill and square on the button and card variants.',
      code: `<div class="grid max-w-3xl gap-4 sm:grid-cols-3">
  <div v-for="s in ['rounded', 'pill', 'square']" :key="s" class="flex flex-col items-start gap-3">
    <ContactLink variant="button" :shape="s" value="name@example.com" :label="'Button ' + s" />
    <ContactLink variant="outline" :shape="s" value="name@example.com" :label="'Outline ' + s" />
    <ContactLink variant="card" :shape="s" value="name@example.com" :label="'Card ' + s" />
  </div>
</div>`,
    },
    {
      title: 'Combined: muted pill ghost, large',
      code: `<ContactLink variant="ghost" size="lg" tone="muted" shape="pill" type="tel" value="+1 555 0100" label="Call +1 555 0100" />`,
    },
  ],
  a11y: [
    'A real anchor (`mailto:` or `tel:`) whose name is its visible text; the icon is decorative (aria-hidden). Use `label` when the raw value is not meaningful to read aloud; keep the visible text inside the accessible name.',
    '`variant`, `tone` and `shape` change the look only: the element, the `href`, the visible text (the accessible name) and the aria-hidden icon are identical in every combination. Text colours use checked pairs: primary, foreground and muted-foreground on the page background, primary-foreground on primary, background on foreground, secondary-foreground on secondary, accent-foreground on the hover fill. `ghost` and `outline` keep a border in forced-colors mode so the target stays visible.',
    'Keyboard: Tab to focus, Enter to follow. Visible focus ring. A missing value renders a plain span, not a dead link.',
    'Targets are at least 24px tall (button and card more) and 44px on coarse pointers; the button grows with its text instead of clipping at 200% zoom, and long labels wrap (`break-words`) so the card reflows at 320px.',
  ],
  requires: [
    'Throws a ContractError when the link has no text: no `value`, no `label` and no default slot content.',
  ],
  related: ['SocialLinks', 'SiteFooter'],
  llmNotes: ['Choose `variant`: inline inside text or footers, button for a primary contact call to action, outline or ghost for a secondary one next to it, card for a contact section with several channels (give each a `label` such as "Email us").', 'Keep `tone="primary"` unless the page already has a stronger accent; `neutral` and `muted` suit footers. Use `shape="pill"` only when the neighbouring buttons are pills too.', 'Use ContactLink instead of hand-writing mailto:/tel: anchors.', 'Never embed unvalidated user input as `value`.', 'Use only addresses and numbers that exist; the docs samples are placeholders.', 'Do not set `href` yourself; it is derived from `value`.'],
  replaces: ['hand-rolled ContactLink markup in app code'],
}
export default doc
