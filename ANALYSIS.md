# Source analysis: what the design system was extracted from

Method: scanned the `package.json` files of a local set of Vue projects, then read the UI sources of the main web apps. Counts are package.json files, so repeated checkouts of one product inflate the totals; treat them as "how consistent the stack is", not as 69 distinct products.

## Stack consistency (package.json files containing the dependency)
| Dependency | Files | Note |
|---|---|---|
| vue | 69 | react in 8 (out of scope) |
| tailwindcss | 71 | 64 Vue projects on Tailwind **v4** (`@tailwindcss/vite`) |
| pinia | 57 | |
| vue-router | 49 | |
| @fortawesome/vue-fontawesome | 50 | |
| reka-ui | 38 | headless primitives (1 project still on its predecessor radix-vue) |
| class-variance-authority + tailwind-merge | 40 / 39 | shadcn-style `cn()` + `cva()` |
| @vueuse/core | 41 | |
| vitest | 65 | |
| chart.js | 31 | replaced by dependency-free SVG charts in the library |

Reference apps read in detail: about a dozen admin consoles, dashboards and marketing sites.

## Findings that shaped the system
1. **One de-facto standard already exists**: shadcn-vue-style `components/ui/*` (Button, Badge, Card, Dialog, Sheet, Select, Table, Tabs, Tooltip, DropdownMenu, Command, …) on reka-ui, with oklch tokens named `--background/--foreground/--primary/--border/--ring…`. The design system adopts that exact token contract so migrations are import swaps.
2. **Each app re-implements the same app-level components**: DataTable, KpiTile/StatCard, EmptyState/ErrorState/LoadingState, StatusBadge, SidebarNav/AppSidebar, ThemeToggle, ConfirmDialog, CodeBlock, Sparkline, CommandPalette, PaginationFooter, SearchInput → all built once in the library.
3. **Marketing sites duplicate sections**: Hero, FeatureGrid, CtaBand, FaqList, StatGrid, SiteHeader/Footer, Lightbox, BeforeAfter, InstallTabs, ScrollProgress, SectionReveal, StatCounter → library `marketing` group, each with several variations.
4. **Theme diversity is real**: an indigo-neutral app theme, an acid-lime brand, warm marketing palettes. Result: one core theme plus a small set of brand presets (indigo and lime kept as migration and brand exceptions) selected with `data-theme`.
5. **Density**: app UIs use 14px base text with 44px touch targets on mobile → `text-base` = 14px, `pointer-coarse:` sizing.
6. **Dependency sprawl** (clsx, cva, vueuse, FontAwesome runtime, chart.js per app) → the library keeps only `reka-ui` + `tailwind-merge` at runtime (+ optional `pinia`), enforced by a test.

## Coverage map (existing component → library)
See the *Migrating existing apps* guide on the docs site: each component page lists what it `replaces`.
