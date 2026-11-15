# Audit result: layout (Affix, AppShell, CenteredLayout, Container, Grid, InfiniteScroll, PageHeader, ResizablePanels, Section, Spacer, SplitLayout, Stack)

Sweep (`/components/layout/`, 12 routes x 3 widths x 2 schemes): 0 axe violations, 0 overflow, 0 console errors, 0 navigation errors. The open AppShell drawer was also checked with axe at 320px: 0 violations.

Fixed in components
- AppShell: open drawer is a modal dialog (`role=dialog`, `aria-modal`, rendered as a `div` because `aside` cannot take that role), header, content and the other sidebar are `inert`, focus moves in and returns on close, Escape/backdrop close. New slot props `sidebarId`, `expanded`, `triggerProps` (`aria-controls`/`aria-expanded`). New `main` prop (`false` renders a `div`, so embedded demos have no nested `main`). Drawer capped with `max-w-full`. `z-(--z-*)` instead of `z-[var(...)]`.
- PageHeader: the tabs row is a focusable labelled region only while it overflows (`tabsLabel`); hero description/back link no longer use `/80` opacity (contrast 4.48:1); `rounded-lg`; sticky background is opaque.
- ResizablePanels: handle has an accessible name (`label`, default "Resize panels"), 24px hit area, `outline-hidden`.
- InfiniteScroll: retry button 24px (44px coarse) with the shared focus ring.
- Grid and SplitLayout: no arbitrary grid-template classes; they use `grid-cols-(--grid-template)` / `grid-cols-(--split-cols)` with CSS variables set inline.
- Affix: border for the stuck `elevated` variant in forced-colors mode.
- CenteredLayout card: no shadow, `rounded-lg`.
- Docs examples: scroll containers are focusable labelled regions with unique names, heading levels do not jump, sidebars/asides have unique labels, nested `main` removed.

Slop removed
- Section `gradient` and `pattern` tones removed (fall back to `none`; test added).
- PageHeader hero `gradient` background removed (default is now `muted`; `gradient` falls back to `muted`; sticky `backdrop-blur` removed).
- Docs: invented product names, pricing/marketing copy, `href="#..."`, `h-[28rem]` style arbitrary values replaced.

Not fixable here
- ResizablePanels stays side by side at 320px (it is a pointer/keyboard splitter, not a responsive layout); use SplitLayout when panes must stack.
