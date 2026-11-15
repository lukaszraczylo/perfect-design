import type { ComponentDoc } from '../../../docs-types'

const form = `<form class="space-y-4" @submit.prevent="onSubmit">
      <Field label="Name"><Input name="name" autocomplete="name" /></Field>
      <Field label="Email"><Input name="email" type="email" autocomplete="email" /></Field>
      <Field label="Message"><Textarea name="message" /></Field>
      <Button type="submit">Send message</Button>
    </form>`

/** Demo handler: reads the fields and stops there. Replace with your own request. */
const demo = () => ({ onSubmit: (event: Event) => void new FormData(event.target as HTMLFormElement) })
const script = `async function onSubmit(event) {
  await fetch('/api/contact', { method: 'POST', body: new FormData(event.target) })
}`

const small = `<form class="space-y-3" @submit.prevent="onSubmit">
        <Field label="Email"><Input name="email" type="email" autocomplete="email" /></Field>
        <Button type="submit">Send the question</Button>
      </form>`

const doc: ComponentDoc = {
  name: 'ContactSection',
  group: 'marketing',
  subgroup: 'Contact',
  summary: 'Contact page section: heading plus a `form` slot and a `details` slot in split, centered, card or inline layouts.',
  description:
    'Layout shell for contact pages. It owns the heading and arrangement only; put your own form (Field/Input/Textarea/Button) in the `form` slot and addresses, phone numbers or ContactLinks in the `details` slot. It does no validation and no network access. `split` shows heading and details beside the form on large screens, `centered` stacks heading, form and details in one column, `card` is `split` inside a bordered surface, `inline` is a compact one-row strip (heading and description left, form and details right) for a short form such as a single question. `size` scales gaps and surface padding, `tone="muted"` gives the section a secondary surface and `align="center"` centres the text of `split` and `card`. Works with any subset of slots.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'split' | 'centered' | 'card' | 'inline'", default: "'split'", description: 'Layout. `inline` is compact: heading and description on the left, form and details in one block on the right from `lg` (one column below). Unknown values fall back to `split`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Gaps, padding of a surface (`card` or a muted tone), heading scale and details text. `md` is the original. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'default' | 'muted'", default: "'default'", description: '`default` has no fill (`card` keeps `bg-card`). `muted` gives every layout a bordered secondary surface with secondary-foreground text. Unknown values fall back to `default`.' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: '`center` centres the heading and details of `split` and `card`. `centered` is always centred and `inline` always start-aligned. Unknown values fall back to `start`. Reflected as `data-align`.' },
    { name: 'eyebrow', type: 'string', description: 'Short label above the title. Plain text; use only when it adds information the title lacks.' },
    { name: 'title', type: 'string', description: 'Section title. State what the section is for ("Ask about the library"), not a generic "Contact".' },
    { name: 'description', type: 'string', description: 'Supporting paragraph under the title.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Heading element level of the title; invalid values fall back to 2.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'form', description: 'The contact form (any content).' },
    { name: 'details', description: 'Contact details: addresses, phone, email, hours, ContactLink/SocialLinks. Sits under the heading (split, card) or below the form (centered).' },
  ],
  examples: [
    {
      title: 'Minimal (heading only, no slots)',
      code: `<ContactSection title="Ask about the library" description="Add your own contact details in the details slot." />`,
    },
    {
      title: 'Split layout',
      description: 'Default. Heading and details on the left, form on the right from `lg`. The demo handler only reads the fields and sends nothing; replace it with your own request and report errors next to the fields.',
      code: `<ContactSection variant="split" title="Ask about the library" description="Write to the maintainers with a question about a component.">
  <template #details>
    <ContactLink type="email" value="name@example.com" />
    <ContactLink type="tel" value="+15550100" label="+1 555 0100" />
  </template>
  <template #form>
    ${form}
  </template>
</ContactSection>`,
      script,
      state: demo,
    },
    {
      title: 'Centered layout',
      description: 'Single column: heading, form, then details.',
      code: `<ContactSection variant="centered" title="Send a short note" description="One field per question keeps the form short.">
  <template #form>
    ${form}
  </template>
  <template #details>
    <p class="text-muted-foreground">Opening hours go here.</p>
  </template>
</ContactSection>`,
      script,
      state: demo,
    },
    {
      title: 'Card layout',
      description: 'Split layout inside a bordered surface, for pages with a plain background.',
      code: `<ContactSection variant="card" title="Report a problem with a component" description="Name the component and the page where you saw it.">
  <template #details>
    <p class="text-muted-foreground">Postal address goes here.</p>
    <ContactLink type="email" value="name@example.com" />
  </template>
  <template #form>
    ${form}
  </template>
</ContactSection>`,
      script,
      state: demo,
    },
    {
      title: 'Inline layout',
      description: 'Compact one-row strip: heading and description left, form and details right from `lg`.',
      code: `<ContactSection variant="inline" size="sm" title="Ask a short question" description="One field, one reply.">
  <template #form>
    ${small}
  </template>
  <template #details>
    <ContactLink type="email" value="name@example.com" />
  </template>
</ContactSection>`,
      script,
      state: demo,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size`: sm, md (default) and lg on the card layout (padding and gaps follow).',
      code: `<div class="grid gap-8">
  <ContactSection v-for="s in ['sm', 'md', 'lg']" :key="s" variant="card" :size="s" :title="'Size ' + s" description="Sample description for the size gallery.">
    <template #form>
      ${small}
    </template>
  </ContactSection>
</div>`,
      script,
      state: demo,
    },
    {
      title: 'Muted tone',
      description: 'Gallery of `tone` on the split layout: default has no surface, muted adds a bordered secondary surface.',
      code: `<div class="grid gap-8">
  <ContactSection v-for="t in ['default', 'muted']" :key="t" :tone="t" :title="'Tone ' + t" description="Sample description for the tone gallery.">
    <template #form>
      ${small}
    </template>
  </ContactSection>
</div>`,
      script,
      state: demo,
    },
    {
      title: 'Centred text',
      description: '`align="center"` on the split layout: the heading and details centre above the form column.',
      code: `<ContactSection align="center" title="Ask about the library" description="Write to the maintainers with a question about a component.">
  <template #details>
    <ContactLink type="email" value="name@example.com" />
  </template>
  <template #form>
    ${small}
  </template>
</ContactSection>`,
      script,
      state: demo,
    },
  ],
  a11y: [
    'Renders a plain `<section>` with no landmark name: labelling every section would make each a `region` landmark, which dilutes navigation and fails landmark-unique when repeated. Add your own `aria-label` or `aria-labelledby` only if the section deserves to be a landmark.',
    'The title renders at `level` (default h2); keep heading levels sequential on the page.',
    'The form is yours: give every field a visible label (use `Field`), `autocomplete` tokens, `aria-invalid` plus a described error, and a live status for the result. The component does no validation and no network access.',
    'Every layout, `size`, `tone` and `align` keeps the same DOM order (heading, form, details) so the reading order and tab order do not change; `inline` only places the form and the details in one block on the right. A muted surface carries a border so it is still outlined in forced-colors mode. Text on it uses secondary-foreground (and muted-foreground for the description) on the secondary surface.',
    'Reflows at 320px: the grid is one column below `lg`, content uses `min-w-0`, and the layouts use no left/right offsets, so RTL mirrors.',
  ],
  requires: [
    'Throws a ContractError when a `<form>` inside the component has no submit handler (`@submit` / `@submit.prevent`) and no `action`, because it would submit nowhere.',
  ],
  related: ['SectionHeading', 'ContactLink', 'SocialLinks', 'Field', 'Input', 'NewsletterSignup'],
  llmNotes: [
    'Put the form in the `form` slot and contact info in the `details` slot; this component does not validate or submit.',
    'Use `split` by default, `centered` for short forms, `card` when the page background is plain and the block needs a surface.',
    'Use `inline` for a one-question strip, `tone="muted"` when the section needs to stand out from the page, `size="sm"` in dense pages and `align="center"` only for short headings with few details.',
    'Use NewsletterSignup, not this, for a single email field.',
    'A form with no `@submit` handler submits nowhere; always wire one or remove the form.',
    'Wrap form fields in `Field`.',
  ],
}
export default doc
