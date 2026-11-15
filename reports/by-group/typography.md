# Audit result: typography (Blockquote, Eyebrow, Heading, InlineCode, Lead, Prose, Text)

Sweep (`/components/typography/`, 7 routes x 3 widths x 2 schemes): 0 axe violations, 0 overflow, 0 console errors, 0 navigation errors.

Fixed in components
- Text `tone="subtle"` was `text-muted-foreground/70` (4:1, failed AA): now the same colour as `muted`. Text and Heading `tone="warning"` used `text-warning` on light backgrounds (2.2:1): now `text-warning-foreground dark:text-warning`.
- Prose: overflowing `pre` blocks get `tabindex="0"` automatically (and a focus ring) via `useFocusableScrollers`; lists, quotes and table headers use logical properties (`ps-6`, `border-s-2`, `text-start`); `max-w-prose` instead of `max-w-[65ch]`; no arbitrary `text-[0.875em]`.
- Blockquote: logical border/padding; tinted variant no longer has a `border-l-4` stripe; card is `rounded-lg` without shadow; decorative CSS quote glyph and the generated em dash before citations removed.
- InlineCode: tokens (`px-1 py-0.5 text-sm`) instead of arbitrary em values.
- Heading: `after:ms-auto` for the underline bar; docs examples use levels that do not skip (h1 to h3 jumps removed).

Slop removed
- Heading `gradient` variant removed (falls back to default; test added).
- Eyebrow default is now `text-sm font-medium` (no uppercase, no tracking); docs say "use only when it adds information the heading lacks".
- Text `overline` variant is plain case (no uppercase, no tracking); `transform` kept and marked discouraged.
- Docs: invented authors, quotes and roles, `href="#"`, marketing headings and taglines replaced with generic sample text.

Not fixable here
- Prose cannot know the accessible name of a scrolling `pre`; consumers who need a name add `role="region"` and `aria-label` themselves.
