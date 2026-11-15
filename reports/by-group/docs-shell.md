# Accessibility/responsive findings: docs-shell
(source: reports/a11y-sweep.json, old build; contrast tokens were since fixed — re-run to confirm)

- `/foundations/iconography` **scrollable-region-focusable** [serious] Scrollable region must have keyboard access — viewports ['phone-320', 'tablet-768'], schemes ['dark', 'light']
    - target `pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
- `/foundations/themes` **scrollable-region-focusable** [serious] Scrollable region must have keyboard access — viewports ['phone-320', 'tablet-768'], schemes ['dark', 'light']
    - target `#accent-presets > .rounded-lg.bg-muted\/50.relative > pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed"><code>@import "@perfect-design/ui/themes/emerald.css";
/* 
    - target `#create-your-own > .rounded-lg.bg-muted\/50.relative > pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed"><code>:root[data-theme='brand'] { --primary: oklch(0.55 0.
- `/guides/customisation` **scrollable-region-focusable** [serious] Scrollable region must have keyboard access — viewports ['phone-320'], schemes ['dark', 'light']
    - target `pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
- `/guides/getting-started` **scrollable-region-focusable** [serious] Scrollable region must have keyboard access — viewports ['desktop-1280', 'phone-320', 'tablet-768'], schemes ['dark', 'light']
    - target `#\31 -install > .rounded-lg.bg-muted\/50.relative > pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
    - target `#\32 -wire-the-css > .rounded-lg.bg-muted\/50.relative > pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
- `/guides/llm` **scrollable-region-focusable** [serious] Scrollable region must have keyboard access — viewports ['desktop-1280', 'phone-320', 'tablet-768'], schemes ['dark', 'light']
    - target `pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
- `/guides/testing` **scrollable-region-focusable** [serious] Scrollable region must have keyboard access — viewports ['phone-320'], schemes ['dark', 'light']
    - target `pre` — Element should have focusable content html: <pre class="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
