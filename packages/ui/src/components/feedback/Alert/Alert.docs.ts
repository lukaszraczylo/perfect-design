import { ref } from 'vue'
import { faCircleCheck, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Alert',
  group: 'feedback',
  subgroup: 'Messages',
  summary: 'Inline, in-flow status message with optional icon, title, description and dismiss button.',
  description:
    'Use `Alert` for a message that belongs to a section of the page (form-level errors, "saved" confirmations, notices above a table). Compose it with `AlertTitle` and `AlertDescription`. Tone (`variant`) and surface (`appearance`) are independent: `soft` (default, tinted) for most in-page messages, `solid` for high-emphasis notices that must not be missed, `outline` for low-key bordered notices on busy backgrounds, `minimal` for unobtrusive inline text with just an icon. `size` (`sm`, `md`, `lg`) scales padding and type. Use `Banner` for page-wide notices, `Toast` for transient confirmations, `InlineMessage` for one line under a field and `Callout` for documentation notes.',
  status: 'stable',
  parts: [
    { name: 'AlertTitle', description: 'Bold heading line of the alert.', props: [{ name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
    { name: 'AlertDescription', description: 'Muted body text of the alert.', props: [{ name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
  ],
  props: [
    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning' | 'destructive'", default: "'default'", description: 'Tone. Unknown values fall back to `default`.' },
    { name: 'appearance', type: "'soft' | 'solid' | 'outline' | 'minimal'", default: "'soft'", description: 'Surface treatment, independent of `variant`. Unknown values fall back to `soft`. Non-default values add a `data-appearance` attribute.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap and type scale. Unknown values fall back to `md`. Non-default values add a `data-size` attribute.' },
    { name: 'layout', type: "'default' | 'inline'", default: "'default'", description: 'Body layout. `default` stacks title, description and actions; `inline` puts title, description and the `actions` slot in one wrapping row with the actions pushed to the end. Unknown values fall back to `default`. Non-default values add `data-layout`.' },
    { name: 'icon', type: 'IconDefinition', description: 'Optional FontAwesome icon. Nothing is rendered when omitted.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Shows a dismiss (X) button. Dismissing hides the alert, moves focus to the next focusable sibling (else the parent region) and emits `dismiss` once. To show it again, change its `:key`.' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss'", description: 'Accessible label of the dismiss button.' },
    { name: 'role', type: "'alert' | 'status' | 'note'", description: 'Overrides the computed role: `alert` for warning/destructive, `status` otherwise.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Usually `AlertTitle` + `AlertDescription`, or plain text.' },
    { name: 'actions', description: 'Buttons or links for the next step. Placed under the text, or at the end of the row with `layout="inline"`.' },
  ],
  emits: [{ name: 'dismiss', payload: '[]', description: 'The dismiss button was used. Fires once; the alert then removes itself.' }],
  examples: [
    {
      title: 'Variants',
      code: `<div class="grid gap-3">
  <Alert>
    <AlertTitle>Changes are not saved</AlertTitle>
    <AlertDescription>Save the form before leaving this page.</AlertDescription>
  </Alert>
  <Alert variant="info" :icon="faCircleInfo">
    <AlertTitle>New version available</AlertTitle>
    <AlertDescription>Reload the page to load it.</AlertDescription>
  </Alert>
  <Alert variant="success" :icon="faCircleCheck">
    <AlertTitle>Saved</AlertTitle>
  </Alert>
  <Alert variant="destructive" :icon="faTriangleExclamation">
    <AlertTitle>Payment failed</AlertTitle>
    <AlertDescription>Your card was declined.</AlertDescription>
  </Alert>
</div>`,
      script: `import { faCircleCheck, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleCheck, faCircleInfo, faTriangleExclamation }),
    },
    {
      title: 'Soft appearance (default)',
      description: 'Tinted background and border. Best default for in-page messages.',
      code: `<div class="grid gap-3">
  <Alert variant="info" appearance="soft" :icon="faCircleInfo"><AlertTitle>Soft info</AlertTitle><AlertDescription>Tinted surface, readable body text.</AlertDescription></Alert>
  <Alert variant="warning" appearance="soft" :icon="faTriangleExclamation"><AlertTitle>Soft warning</AlertTitle></Alert>
</div>`,
      script: `import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleInfo, faTriangleExclamation }),
    },
    {
      title: 'Solid appearance',
      description: 'Filled with the tone colour. Use sparingly for notices that must not be missed.',
      code: `<div class="grid gap-3">
  <Alert appearance="solid"><AlertTitle>Solid default</AlertTitle><AlertDescription>Inverted foreground colours.</AlertDescription></Alert>
  <Alert appearance="solid" variant="info" :icon="faCircleInfo" dismissible><AlertTitle>Solid info</AlertTitle><AlertDescription>Icon and dismiss follow the text colour.</AlertDescription></Alert>
  <Alert appearance="solid" variant="success" :icon="faCircleCheck"><AlertTitle>Solid success</AlertTitle></Alert>
  <Alert appearance="solid" variant="warning" :icon="faTriangleExclamation"><AlertTitle>Solid warning</AlertTitle></Alert>
  <Alert appearance="solid" variant="destructive" :icon="faTriangleExclamation"><AlertTitle>Solid destructive</AlertTitle></Alert>
</div>`,
      script: `import { faCircleCheck, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleCheck, faCircleInfo, faTriangleExclamation }),
    },
    {
      title: 'Outline appearance',
      description: 'Transparent background with a full-strength tone border; sits well on cards and tinted sections.',
      code: `<div class="grid gap-3">
  <Alert appearance="outline"><AlertTitle>Outline default</AlertTitle></Alert>
  <Alert appearance="outline" variant="info" :icon="faCircleInfo"><AlertTitle>Outline info</AlertTitle><AlertDescription>Border carries the tone.</AlertDescription></Alert>
  <Alert appearance="outline" variant="destructive" :icon="faTriangleExclamation"><AlertTitle>Outline destructive</AlertTitle></Alert>
</div>`,
      script: `import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleInfo, faTriangleExclamation }),
    },
    {
      title: 'Minimal appearance',
      description: 'No surface: only the tone-coloured icon and text. Use inside cards or form sections.',
      code: `<div class="grid gap-3">
  <Alert appearance="minimal" variant="info" :icon="faCircleInfo"><AlertDescription>Changes apply to new sessions only.</AlertDescription></Alert>
  <Alert appearance="minimal" variant="destructive" :icon="faTriangleExclamation"><AlertDescription>This key will stop working immediately.</AlertDescription></Alert>
</div>`,
      script: `import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleInfo, faTriangleExclamation }),
    },
    {
      title: 'Sizes',
      description: '`sm` for dense toolbars and tables, `md` default, `lg` for page-level emphasis.',
      code: `<div class="grid gap-3">
  <Alert size="sm" variant="info" :icon="faCircleInfo"><AlertTitle>Small</AlertTitle><AlertDescription>Compact padding and type.</AlertDescription></Alert>
  <Alert size="md" variant="info" :icon="faCircleInfo"><AlertTitle>Medium</AlertTitle><AlertDescription>The default density.</AlertDescription></Alert>
  <Alert size="lg" variant="info" :icon="faCircleInfo"><AlertTitle>Large</AlertTitle><AlertDescription>Roomy, base-size text.</AlertDescription></Alert>
</div>`,
      script: `import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleInfo }),
    },
    {
      title: 'Layout and actions',
      description: '`layout="inline"` keeps a short message and its action on one row; the row wraps on narrow screens. Without an icon the alert is text only.',
      code: `<div class="grid gap-3">
  <Alert variant="info" :icon="faCircleInfo">
    <AlertTitle>Update ready</AlertTitle>
    <AlertDescription>Restart to apply it.</AlertDescription>
    <template #actions><Button size="xs" variant="outline">Restart now</Button></template>
  </Alert>
  <Alert layout="inline" variant="info" :icon="faCircleInfo" size="sm">
    <AlertTitle>Update ready</AlertTitle>
    <AlertDescription>Restart to apply it.</AlertDescription>
    <template #actions><Button size="xs" variant="outline">Restart now</Button></template>
  </Alert>
  <Alert layout="inline" appearance="outline"><AlertTitle>No icon</AlertTitle><AlertDescription>Text only, one row.</AlertDescription></Alert>
</div>`,
      script: `import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleInfo }),
    },
    {
      title: 'Dismissible',
      script: `import { ref } from 'vue'\nconst dismissed = ref(0)`,
      code: `<Alert variant="warning" dismissible :icon="faTriangleExclamation" @dismiss="dismissed++">
  <AlertTitle>Your trial ends in 3 days</AlertTitle>
  <AlertDescription>Add a payment method to keep your projects.</AlertDescription>
</Alert>
<p class="mt-2 text-sm text-muted-foreground">Dismissed {{ dismissed }} time(s)</p>`,
      state: () => ({ faTriangleExclamation, dismissed: ref(0) }),
    },
  ],
  a11y: [
    'Warning and destructive use role="alert" (assertive). Other variants use role="status" (polite). Override with `role`.',
    'The dismiss button is a real <button> with an aria-label (`dismissLabel`). It is 28px square, 40px on coarse pointers.',
    'Solid appearance pairs each tone with its `*-foreground` token for contrast. Icon and dismiss button follow the text colour.',
    'The icon is decorative (aria-hidden). Colour is never the only signal: always include text.',
    'Every appearance keeps a border, so the alert stays visible in forced-colors mode. Text wraps and the body has `min-w-0`, so nothing scrolls sideways at 320px.',
  ],
  related: ['Banner', 'Callout', 'InlineMessage', 'ToastItem'],
  requires: [
    'Throws a ContractError when an `Alert` is empty (no title or text) or is `dismissible` with a blank `dismissLabel`.',
  ],
  llmNotes: [
    'A dismissed Alert stays gone until its `:key` changes; bind `:key` to the message id to show a new message.',
    'Always give an Alert a title or text; do not render empty alerts.',
    'Use variant="destructive" for errors and "warning" for recoverable problems.',
    'Use Alert for in-page messages only; use Toaster for transient feedback.',
    'Choose the tone with `variant` and the surface with `appearance`; default to `soft`, use `solid` only for one critical notice per view.',
    'Use `appearance="minimal"` or `size="sm"` for messages inside cards, tables and forms.',
    'Pass FontAwesome IconDefinition objects to `icon`, never inline SVG.',
  ],
  replaces: ['hand-rolled Alert markup in app code'],
}
export default doc
