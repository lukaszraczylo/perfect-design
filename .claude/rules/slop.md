# No LLM slop

The user asked that the design system and everything it produces avoid the patterns that mark a UI as machine-made. `LLMSlop.md` is the rulebook (severity P0/P1/P2, with a self-check); `DESIGN.md` states the deliberate direction (petrol accent, IBM Plex, radius scale, content policy) and section 7 lists the only allowed exceptions.

## Enforced by tests (`packages/ui/src/__tests__/slop.test.ts`)
No indigo/violet/purple utilities; no gradients or gradient-clipped text; no glows, coloured shadows, `backdrop-blur`, `rounded-2xl`+, edge stripes (`border-l-4`), hover scale/lift, bounce, scroll-reveal triggers; no emoji; no sparkles/shield-check/zap default icons; no tracked all-caps labels; no Inter/Space Grotesk/Geist; no hard-coded colours; no `z-9999`/`100vw`; no buzzwords, stock CTAs ("Get started", "Learn more") or "not just X, it's Y"; no dead `href="#"`, lorem, placeholder people or companies; hero content does not fade in by default; the theme honours reduced motion.

## Judgement rules the tests cannot see
- Lead with the product's real content, not a centred hero + pill badge + two buttons + logo row + three identical cards. Unequal emphasis; vary the form of each section.
- Copy: say what it does, for whom. No headline that fits any company. No em dashes as connectives, no rule-of-three taglines, no hedges, no emoji bullets. Sentence case. Section headings state a claim.
- Content honesty (P0): no invented metrics, ratings, testimonials, customer names, logos or prices anywhere, including docs examples. The one exception is labelled sample rates in pricing examples (DESIGN.md section 6). Use obviously generic sample text ("Sample plan", "Customer name") or real facts about this repository (component counts, token names). Missing content is marked `TODO(content)`, never filled with plausible text.
- Docs examples are what people and LLMs copy: they must model the system's own rules.
- Do not "fix" slop by moving to the next most probable look (cream and terracotta, near-black with acid green, faux-brutalist). An aesthetic is acceptable only if `DESIGN.md` explains why this product needs it.

## Exceptions
Never loosen a pattern to pass. If a hit is deliberate, add the path to the allow-list in `slop.test.ts` AND a row with the reason to `DESIGN.md` section 7. Current exceptions: `themes/indigo.css` (existing apps' brand), `themes/lime.css` (example brand), `Eyebrow`, `Text` uppercase option, `SectionReveal` and state-change animations, colour-as-data components (`ColorPicker`, `AccentPicker`, charts), the `Marquee` edge mask, and the style packs `editorial` (N1/N3), `raw` (N4) and `tactile` (press feedback) in `styles/packs/`, which are opt-in looks justified in `DESIGN.md` section 8.

## Do not name the owner's real projects or companies

No file in this repo (docs, examples, `replaces`, tests, comments, rules, generated LLM files) names the owner's own projects, products, brands or employers. `replaces` entries name public things (`shadcn-vue Button`) or a pattern (`hand-rolled Button markup in app code`). When an example needs a company or product name, invent an obviously fictional one that is not a real business (for example Kestrel Freight, Orchard Mill, Brightwater Co, Tallow and Finch, Quarry Row, Halden Optics) and never present it as a customer. Brand presets get neutral names (`lime`), not real brands.
