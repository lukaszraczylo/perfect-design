# Audit result: primitives (Avatar, AvatarGroup, AspectRatio, Badge, Button, Chip, Icon, IconButton, Kbd, Link, Progress, ProgressRing, ScrollArea, Separator, Skeleton, Spinner, StatusBadge, StatusDot, Toggle, ToggleGroup, VisuallyHidden)

Sweep (`/components/primitives/`, 19 routes x 3 widths x 2 schemes): 0 axe violations, 0 overflow, 0 console errors, 0 navigation errors.

Fixed in components
- Avatar: the status dot was a `role=img` nested in a `role=img` (label lost). Dot is now aria-hidden and the status text is folded into the avatar name ("Name, online"), also when an image is shown.
- Chip: remove button was 16px, now 24px (`size-6`, negative logical margins). Removable chip is a named `group` with `aria-keyshortcuts="Delete Backspace"`.
- Progress: always has a name ("Progress", or `label`, or the consumer's `aria-labelledby`/`aria-label`); `ms-auto`/`text-end`, `text-2xs`, `min-w-8` instead of arbitrary values; forced-colors borders on track and fill.
- ProgressRing: `label` prop (name was hard-coded "Progress").
- ScrollArea: `label` prop; viewport is a named `region` (reka already makes it a tab stop). New `scrollable.ts` helpers (`useScrollable`, `useFocusableScrollers`).
- Spinner: `role=progressbar` + name (native `<progress>` semantics, as in the spinner guidance) instead of `role=status` on an svg; `decorative` prop; `motion-reduce:animate-pulse`.
- StatusDot: labelled dot is `role=img` (was a live `status` region).
- Link: disabled link keeps `role=link`; `ms-1`.
- Icon: spin falls back to pulse under reduced motion.
- Toggle / ToggleGroup: 40/44px targets on coarse pointers, forced-colors border on the pressed item, logical corner classes (`first:rounded-s-md`).
- AvatarGroup: `tabular-nums` on the +N bubble.
- Button.test.ts: frozen class snapshot updated for the shared `outline-hidden` focus ring (not a Button change).

Slop removed
- Progress `striped` (gradient stripes) is a deprecated no-op; `animated` now pulses. Skeleton `shimmer` (gradient) is a deprecated alias of the pulse.
- Docs: invented/real people (Linus Torvalds, "Rear Admiral..."), `href="#..."`, fixed-width demos (`w-72`, `w-80`), `⌘` glyph, `uppercase tracking-wide` demo, invented metrics (CPU, quota, api-1) replaced with plainly generic sample text.

Not fixable here
- None in primitives. The docs shell `landmark-unique` ("Component props" region on pages with parts) seen in the first run no longer reproduces.
