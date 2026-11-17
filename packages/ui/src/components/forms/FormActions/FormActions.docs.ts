import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'FormActions',
  group: 'forms',
  subgroup: 'Actions',
  summary: 'Aligned row of form actions (submit and cancel) with an optional sticky bottom bar and stacking on small screens.',
  description:
    'Place `FormActions` at the end of a form. For the common case pass `submitLabel` (and `cancelLabel`) and it renders a primary `type="submit"` Button plus an outline cancel Button; the native form submit still fires, and `submit` / `cancel` are emitted on click. For anything else (extra buttons, links, destructive actions) fill the default slot, which replaces the built-in buttons. `sticky` pins the bar to the bottom of the scroll container for long forms, on an opaque background.',
  status: 'stable',
  props: [
    { name: 'layout', type: "'stacked' | 'inline' | 'split'", default: "'stacked'", description: '`stacked`: full-width buttons in a column below `sm`, a row from `sm`. `inline`: a wrapping row at every width. `split`: as `stacked`, but from `sm` the first action sits at the start and the others at the end (a secondary or destructive action apart from the primary one). Every layout keeps DOM order. Unknown values fall back to `stacked`.' },
    { name: 'align', type: "'start' | 'center' | 'end' | 'between'", default: "'end'", description: 'Horizontal alignment (applies from `sm` up when stacked). Ignored by `layout="split"`. Invalid values fall back to `end`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Gap between actions (6 / 8 / 12 px), padding of a `bar`, `boxed` or `sticky` surface, and the size of the built-in buttons. Buttons you put in the default slot keep their own size. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'plain' | 'bar' | 'boxed'", default: "'plain'", description: '`plain`: no surface. `bar`: a full-width footer with a top border on an opaque background. `boxed`: a bordered, rounded panel on an opaque background. Unknown values fall back to `plain`.' },
    { name: 'sticky', type: 'boolean', default: 'false', description: 'Stick to the bottom of the scroll container. A `plain` sticky bar gets the `bar` surface (top border, opaque background) so content never shows through.' },
    { name: 'stacked', type: 'boolean', default: 'true', description: 'Kept for compatibility: `false` is the same as `layout="inline"` and applies to the default layout only.' },
    { name: 'submitLabel', type: 'string', description: 'Renders the primary `type="submit"` Button with this label.' },
    { name: 'cancelLabel', type: 'string', description: 'Renders an outline Button with this label that emits `cancel`.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Spinner + aria-busy on the submit button, blocks submit clicks.' },
    { name: 'submitDisabled', type: 'boolean', default: 'false', description: 'Disables the submit button.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Custom actions; replaces the `submitLabel` / `cancelLabel` buttons.' }],
  emits: [
    { name: 'submit', payload: '[event: MouseEvent]', description: 'Click on the built-in submit button (the native form submit still happens).' },
    { name: 'cancel', payload: '[event: MouseEvent]', description: 'Click on the built-in cancel button.' },
  ],
  examples: [
    {
      title: 'Submit and cancel',
      script: `const last = ref('')`,
      code: `<form class="grid max-w-md gap-3" @submit.prevent="last = 'Saved'">
  <Field label="Project name"><Input name="project" /></Field>
  <FormActions submit-label="Save changes" cancel-label="Cancel" @cancel="last = 'Cancelled'" />
  <p role="status" class="text-sm text-muted-foreground">Last action: {{ last || 'none' }}</p>
</form>`,
      state: () => ({ last: ref('') }),
    },
    {
      title: 'Custom slot, spread layout, loading',
      script: `const saving = ref(false)\nconst result = ref('')\nfunction publish() {\n  saving.value = true\n  result.value = 'Publishing'\n  setTimeout(() => { saving.value = false; result.value = 'Published' }, 600)\n}`,
      code: `<form @submit.prevent="publish">
  <FormActions align="between" aria-label="Publish actions">
    <Button variant="outline" class="text-destructive" type="button" @click="result = 'Draft deleted'">Delete draft</Button>
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" type="button" @click="result = 'Draft saved'">Save draft</Button>
      <Button type="submit" :loading="saving">Publish</Button>
    </div>
  </FormActions>
  <p role="status" class="mt-2 text-sm text-muted-foreground">{{ result }}</p>
</form>`,
      state: () => {
        const saving = ref(false)
        const result = ref('')
        return {
          saving,
          result,
          publish: () => {
            saving.value = true
            result.value = 'Publishing'
            setTimeout(() => {
              saving.value = false
              result.value = 'Published'
            }, 600)
          },
        }
      },
    },
    {
      title: 'Layouts',
      description: 'Stacked (default), inline and split. Resize the window below 640px to see stacked and split stack their buttons.',
      code: `<div class="grid gap-4">
  <FormActions aria-label="Stacked actions" submit-label="Save" cancel-label="Cancel" />
  <FormActions aria-label="Inline actions" layout="inline" submit-label="Save" cancel-label="Cancel" />
  <FormActions aria-label="Split actions" layout="split" submit-label="Save" cancel-label="Cancel" />
</div>`,
    },
    {
      title: 'Surfaces and sizes',
      description: 'Plain, bar and boxed surfaces, then the small and large sizes. The bar and the box have an opaque background.',
      code: `<div class="grid gap-4">
  <FormActions aria-label="Plain actions" submit-label="Save" />
  <FormActions aria-label="Bar actions" variant="bar" submit-label="Save" cancel-label="Cancel" />
  <FormActions aria-label="Boxed actions" variant="boxed" submit-label="Save" cancel-label="Cancel" />
  <FormActions aria-label="Small actions" size="sm" variant="boxed" submit-label="Save" cancel-label="Cancel" />
  <FormActions aria-label="Large actions" size="lg" variant="boxed" submit-label="Save" cancel-label="Cancel" />
</div>`,
    },
  ],
  a11y: [
    'The wrapper is a plain container. Pass `aria-label` or `aria-labelledby` and it becomes a named `role="group"`; an unnamed group would only add noise.',
    'Built-in cancel is `type="button"` so it never submits; submit is `type="submit"`. Tab visits Cancel then Submit, the same order they appear.',
    'Stacked layout keeps DOM order (no `flex-col-reverse`), so focus order always matches the visual order. Buttons are full width below `sm` and wrap at 320px.',
    '`sticky` uses an opaque `bg-background` and a top border (no blur, no transparency), so text behind it never reduces contrast. A sticky bar can cover a focused field: give the scroll container `scroll-pb-20` or similar.',
    '`layout` and `variant` change only layout and surface, never DOM order, roles or labels. `split` moves the first action to the start with a margin, not `order`, so focus order still matches the visual order. `bar` and `boxed` use an opaque `bg-background` and a border (no blur, no transparency).',
    'Loading uses Button `aria-busy` and blocks activation. Buttons are 44px tall on touch pointers.',
  ],
  related: ['Button', 'FieldGroup', 'Fieldset'],
  requires: [
    'Throws a ContractError when it renders no actions: no default slot content and neither `submitLabel` nor `cancelLabel`.',
  ],
  llmNotes: [
    'Put FormActions last in the <form> so the submit button submits it.',
    'Exactly one primary (default variant) button per form.',
    'Do not use flex order utilities on the buttons; keep DOM order equal to visual order.',
    'Use `layout="split"` to keep a destructive or secondary action (first in DOM order) apart from the primary one; `variant="bar"` for a footer inside a card or dialog.',
    'Use the default slot for custom/extra actions; then `submitLabel` / `cancelLabel` are ignored.',
  ],
  replaces: ['hand-written `flex justify-end gap-2` button rows'],
}
export default doc
