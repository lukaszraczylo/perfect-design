# Component audit, 2026-11-17

Procedure: `.claude/skills/auditing-components/SKILL.md`. Rules: `.claude/rules/consumers.md`.

## Summary

- Scope: all 221 components in `packages/ui/src/components`.
- Baseline: the guard tests in `src/__tests__` pass (19 files, 8,387 tests). `KNOWN_NOOP` in `variants-matrix.test.ts` is empty.
- No findings for layout, reka-ui behaviour (no other component uses `forceMount`) or docs props. A scripted comparison of the `*Props` interfaces against each `props` list in the docs files found no missing prop.
- All findings are text that an app cannot translate. A string in this list reaches the screen or a screen reader, and no prop, `labels` key or `ConfigProvider` label can replace it.
- 55 components have findings: 7 in forms and feedback, 17 in marketing, navigation, overlays and primitives, 31 in data-display.
- The coordinator read the cited line for 31 findings, across every group. Each one matched the code.

## Recommended order

The order puts the widest reach first. Visible text comes before screen-reader text, and shared code comes before single components.

| Rank | Change | Components | Why first |
|---|---|---|---|
| 1 | One plural helper for placeholder strings with `one` and `other` forms, chosen with `Intl.PluralRules` and the component `locale`. It replaces `plural(n, one, many)` in `_chart/chartKit.ts:181` and the `=== 1` branches | 15 charts, Breadcrumb, Command, MultiSelect, CodeViewer, DiffViewer, DataGrid, LogViewer, FlowCanvas, UptimeBar, FileDropzone | Every later plural fix needs it |
| 2 | `labels.close` for the close button, shared by Dialog and Sheet | DialogContent, SheetContent | Every app with an overlay announces "Close" in English |
| 3 | Visible control text | DataTable pager and selection, ThemeToggle mode names, the five pickers (option names), CodeBlock and CodeViewer copy text | Visible English on translated pages |
| 4 | Announcements and screen-reader names in common widgets | Toaster (and pass `dismissLabel` to ToastItem), Command, Chip, Breadcrumb, AvatarGroup, Carousel, StatGrid, KpiTile, TrendBadge, Gauge, Rating, Slider, PinInput, TimeInput, MultiSelect, Lightbox, ImageGrid, Testimonial, ShortcutsDialog | Screen-reader users on translated pages hear English |
| 5 | One shared `useConfigLabels('chart')` object read by `_chart/ChartDataTable.vue` and every chart summary | BarChart, BulletChart, CalendarHeatmap, DonutChart, FunnelChart, Heatmap, LineChart, NetworkGraph, RadarChart, Sankey, ScatterChart, Sparkline, Treemap, UptimeBar, WaterfallChart | One labels object fixes many components |
| 6 | Large single components | DataGrid, FlowCanvas, LogViewer, DiffViewer, MermaidDiagram, JsonViewer, ActivityFeed, BoardColumn, DescriptionList | Many strings each, fewer apps |

A guard test can stop new fixed strings. It fails when a `.vue` file passes a string literal with a space to `aria-label`, `announce(`, `label=` or `copied-label=`. Existing hits go into an allow-list that shrinks with each fix.

## Forms and feedback

| Component | file:line | Rule | What an app cannot do | Proposed opt-in fix |
|---|---|---|---|---|
| MultiSelect | forms/MultiSelect/MultiSelect.vue:166, :430 | translation, plural | Translate the announcement "{n} option(s) available" and the counter "{n} / {limit} selected". The plural has two fixed English forms | Add `available` (one and other) and `selectedOfLimit` to the existing `useConfigLabels('multiSelect')` keys |
| PinInput | forms/PinInput/PinInput.vue:109, :153 | translation | `cellLabel` replaces only "Digit" or "Character". The "of" in "{label} {i} of {count}" stays English | `labels.cell` with `{label}`, `{index}`, `{count}` via `useConfigLabels('pinInput')` |
| Rating | forms/Rating/Rating.vue:177, :180 | translation | Translate `aria-valuetext` "{value} out of {count}" and the fallback name "Rating" | `labels.valueText`, `labels.name` via `useConfigLabels('rating')` |
| Slider | forms/Slider/Slider.vue:150 | translation | Translate "of" in the range thumb name "{label} {i} of {n}" | `labels.thumb` via `useConfigLabels('slider')` |
| TimeInput | forms/TimeInput/TimeInput.vue:291, :307, :323, :327 | translation | Translate `aria-valuetext` "Empty" and the visible "AM" and "PM" | `labels.empty`, `labels.am`, `labels.pm` via `useConfigLabels('timeInput')` |
| Toaster, ToastItem | feedback/Toaster/Toaster.vue:119; feedback/ToastItem/ToastItem.vue:49 | translation | Translate ". Actions available" in the live region. Toaster does not pass `dismissLabel`, so every close button says "Dismiss notification" | `labels.actionsAvailable`, `labels.dismiss` via `useConfigLabels('toaster')`; Toaster passes `dismissLabel` |
| FileDropzone | forms/FileDropzone/FileDropzone.vue:83, :258 | plural | `maxFiles=1` renders "Max 1 files" | Add `maxFilesOne` to the existing labels |

## Marketing, navigation, overlays, layout, primitives, typography

| Component | file:line | Rule | What an app cannot do | Proposed opt-in fix |
|---|---|---|---|---|
| Lightbox | marketing/Lightbox/Lightbox.vue:221-222 | translation | Translate "Image unavailable" (visible text and `role="img"` name) | `labels.unavailable` via `useConfigLabels('lightbox')` |
| ImageGrid | marketing/ImageGrid/ImageGrid.vue:158 | translation | Translate "Image unavailable" | Same key as Lightbox |
| ThemeToggle | navigation/ThemeToggle/ThemeToggle.vue:37-47, 56-57 | translation | Translate "Light", "Dark", "System", "Theme: {mode}. Switch to {next}.", "Dark mode", "Theme". `label` replaces only the group and switch names | `labels.*` via `useConfigLabels('themeToggle')` with `{mode}`, `{next}` |
| StylePicker, FontPicker, CodeThemePicker, AccentPicker, PalettePicker | navigation/StylePicker/StylePicker.vue:19-20 (and the same `NAMES` map in each) | translation | Translate option names ("Quiet", "Workbench", "Default"). In AccentPicker they are also the `aria-label` and `title` | `names?: Record<string, string>` prop, or `labels` per picker |
| Breadcrumb | navigation/Breadcrumb/Breadcrumb.vue:80 | translation, plural | Translate "Show {n} hidden item(s)". The plural has one English `=== 1` branch | `labels.showHidden` (one and other) via `useConfigLabels('breadcrumb')` |
| Chip | primitives/Chip/Chip.vue:51, :111 | translation | Translate "Remove {label}" and "Remove" | `labels.remove` with `{label}` via `useConfigLabels('chip')` |
| Command | overlays/Command/Command.vue:43 | translation, plural | Translate the status "No results found." and "{n} result(s) available" | `labels.noResults`, `labels.results` (one and other) via `useConfigLabels('command')` |
| Dialog, Sheet | overlays/Dialog/DialogContent.vue:73; overlays/Sheet/SheetContent.vue:83 | translation | Translate the close button name "Close" | `labels.close` via `useConfigLabels('dialog')`, shared with Sheet |
| StatGrid | marketing/StatGrid/StatGrid.vue:82, :136 | translation | Translate screen-reader trend text "Up", "Down", "No change" | `labels.up`, `labels.down`, `labels.flat` via `useConfigLabels('statGrid')` |
| AvatarGroup | primitives/AvatarGroup/AvatarGroup.vue:67 | translation | Translate the overflow name "{hidden} more" | `labels.more` with `{count}` via `useConfigLabels('avatarGroup')` |
| Testimonial | marketing/Testimonial/Testimonial.vue:96 | translation | Translate the rating name "{n} out of 5" | `labels.rating` with `{value}`, `{max}` via `useConfigLabels('testimonial')` |
| ShortcutsDialog | overlays/ShortcutsDialog/ShortcutsDialog.vue:86, :109 | translation | Translate the default group heading "General" | `labels.general` via `useConfigLabels('shortcutsDialog')` |

## Data display

| Component | file:line | Rule | What an app cannot do | Proposed opt-in fix |
|---|---|---|---|---|
| All charts | _chart/chartKit.ts:181; _chart/ChartDataTable.vue:35, :46 | translation, plural | Translate the chart summaries, table captions, "Category" header and "n/a" cells. `plural()` builds English "n category/categories", "n point/points" | Shared `useConfigLabels('chart')` and the plural helper from rank 1 |
| BarChart | BarChart/BarChart.vue:250, :334, :337 | translation | Summary, caption, bar titles | Shared chart labels |
| BulletChart | BulletChart/BulletChart.vue:107, 286-300, 383-389 | translation | "n/a", summary, legend names, notes, table headers | `labels.*` via `useConfigLabels('bulletChart')` |
| CalendarHeatmap | CalendarHeatmap/CalendarHeatmap.vue:206, 227, 232-233, 299-306 | translation | "no data", summary, notes, caption, table rows | Extend the existing `useConfigLabels('heatmap')` |
| DonutChart | DonutChart/DonutChart.vue:123, :132 | translation | Summary and segment title | Shared chart labels |
| FunnelChart | FunnelChart/FunnelChart.vue:246, 257-259, 267-274 | translation | Chart type names, summary, legend and table names | Shared chart labels |
| Heatmap | Heatmap/Heatmap.vue:178-179, 184, 194-195 | translation | "Row n", "Column n", "no data", summary | Extend `useConfigLabels('heatmap')` |
| LineChart | LineChart/LineChart.vue:157, 204, 215 | translation | Summary, caption, point titles | Shared chart labels |
| NetworkGraph | NetworkGraph/NetworkGraph.vue:174, 214, 221, 234, 239, 244-245, 403-422 | translation | Node text, "No group", summary, table captions and headers | Shared chart labels |
| RadarChart | RadarChart/RadarChart.vue:185, 221, 232 | translation | Summary, caption, point titles | Shared chart labels |
| Sankey | Sankey/Sankey.vue:121, 149-168, 218-220 | translation | "{a} to {b}", summary, notes, headers | Shared chart labels |
| ScatterChart | ScatterChart/ScatterChart.vue:181, 274-287, 300-310 | translation | Summary, "Linear trend", notes, headers | Shared chart labels |
| Sparkline | Sparkline/Sparkline.vue:166, :169 | translation | Win and loss and trend summaries | Shared chart labels |
| Treemap | Treemap/Treemap.vue:117, 207, 221-235 | translation | Item text, summary, caption, notes | Shared chart labels |
| UptimeBar | UptimeBar/UptimeBar.vue:74 | plural | "{n} check/checks" (state names are already labels) | `labels.checks` with one and other forms |
| WaterfallChart | WaterfallChart/WaterfallChart.vue:253, 346, 359-366 | translation | Bar text, summary, table names | Shared chart labels |
| ActivityFeed | ActivityFeed/ActivityFeed.vue:307 | translation | "Show details", "Hide details", " for {summary}" | `labels.*` via `useConfigLabels('activityFeed')` |
| BoardColumn | BoardColumn/BoardColumn.vue:157 | translation | Drop announcement "Moved {name} to {title}, position {n}" | `labels.moved` via `useConfigLabels('boardColumn')` |
| Carousel | Carousel/CarouselItem.vue:20 | translation | Slide name "{n} of {count}" | `labels.slide` via `useConfigLabels('carousel')` |
| CodeBlock | CodeBlock/CodeBlock.vue:124, :166 | translation | Region name "Code" / "{language} code", copy text "Copy code" / "Code copied" | `labels.code`, `labels.copy`, `labels.copied` via `useConfigLabels('codeBlock')` |
| CodeViewer | CodeViewer/CodeViewer.vue:72, 122-125, 134, 162 | translation, plural | Fold and unfold names, "n lines hidden", "Highlighted line", "{language} source", copy text | `labels.*` via `useConfigLabels('codeViewer')` |
| DataGrid | DataGrid/DataGrid.vue:219, 241, 251, 326, 337, 384, 681; DataGridHeaderCell.vue:154 | translation, plural | Loading, sort, resize, edit, copy announcements; "Edit X"; "Resize X column"; "Copied n cells" | `labels.*` via `useConfigLabels('dataGrid')` |
| DataTable | DataTable/DataTable.vue:195, 290, 363, 417, 454, 458-460 | translation | Pager text ("Showing a–b of n", "Previous", "Next", "Page n of m"), selection names, sort status | `labels.*` via `useConfigLabels('dataTable')`; the pager can reuse `Pagination` labels |
| DescriptionList | DescriptionItem.vue:54; DetailField.vue:37; _shared/CopyButton.vue:26 | translation | "Copy {term}", "Copy value", "Copy {label}", copied text | `labels.*` via `useConfigLabels('descriptionList')` |
| DiffViewer | DiffViewer/DiffViewer.vue:317-355, 378, 422, 435 | translation, plural | Change navigation, expand and collapse text, notes, sr-only change marks | `labels.*` via `useConfigLabels('diffViewer')` |
| FlowCanvas | FlowCanvas/FlowCanvas.vue:274-806, 977, 1044-1054, 1249, 1263 | translation, plural | Toolbar names, list toggle, every live announcement | `labels.*` via `useConfigLabels('flowCanvas')` |
| Gauge | Gauge/Gauge.vue:117-118 | translation | Fallback name "Gauge", ": No data" | `labels.gauge`, `labels.noData` via `useConfigLabels('gauge')` |
| JsonViewer | JsonViewer/JsonViewer.vue:234, 249-250; jsonTree.ts:273 | translation | "Copy path {path}", "Show N more", "(N left)", truncation note; the number is fixed to en-US | `labels.*` via `useConfigLabels('jsonViewer')`, format numbers with `locale` |
| KpiTile | KpiTile/KpiTile.vue:97, 122, 135, 152 | translation | "Increase", "Decrease", "No change", "Loading", "{label} progress" | `labels.*` via `useConfigLabels('kpiTile')` |
| LogViewer | LogViewer/LogViewer.vue:160-161, 306, 318, 390-414 | translation, plural | Control names, match counts, copy text, live "n new lines" | `labels.*` via `useConfigLabels('logViewer')` |
| MermaidDiagram | MermaidDiagram/MermaidDiagram.vue:157-160, 195, 205, 244, 251 | translation | Error titles, source and text-version toggles | `labels.*` via `useConfigLabels('mermaidDiagram')` |
| TrendBadge | TrendBadge/TrendBadge.vue:94-97 | translation | "No data", "No change", "Increase of X", "Decrease of X" | `labels.*` via `useConfigLabels('trendBadge')` |
