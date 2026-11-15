# LLMSlop.md

Rules for any agent or human building web UI in this project. They list the patterns that mark a site as LLM-generated and say what to do instead.

## 0. How to use this file

- Read it before writing or restyling any page, component or marketing copy.
- Run the self-check in section 12 before calling UI work done.
- Severity: **P0** = recognisable in under a second, never ship. **P1** = strong tell, needs a written reason to keep. **P2** = weak alone, damning in clusters.
- No single item below is wrong by itself. The tell is the *unchosen default*, and the cluster. One empirical scan treated 4 or more co-occurring patterns as the "heavy slop" threshold [KR]. Treat that as the budget: a page may trip at most one P1 and two P2 items, each on purpose.
- A deliberate, documented choice beats this file. If the brand colour really is indigo, write that in `DESIGN.md` and use it.
- Source tags in brackets point to section 13. `[OBS]` marks a rule that comes from practice and is not backed by a cited source.

## 1. Why it happens (so the fix is the right one)

- A model given an open design choice returns the most probable one. Anthropic calls the result converging on "on distribution" output [AN]. The centre of "modern web UI" in training data is Tailwind defaults, shadcn components, Inter and gradients [TW][KR].
- The purple has a traceable origin: Tailwind UI's demo components used `bg-indigo-500`, tutorials copied them, models learned it, and generated sites now feed the next round of training [TW].
- Banning the defaults does not create originality. The model moves to the next most probable look (section 9) [CC].
- **Therefore the fix is always a decision made before generation**: a written direction (palette with roles, 1 to 2 typefaces, one lead element, real content) taken from the product, not a longer ban list [CC][AN].

## 2. Direction first (P0 if missing)

Before writing markup, `DESIGN.md` (or the task brief) must state:

1. Who the page is for and the one thing it must make them do or understand.
2. 4 to 6 named colours, each with a role (surface, ink, accent, signal, etc.) [CC].
3. One or two type families, a type scale, and which weights are in use.
4. Radius, spacing and elevation scales, with what each step is for.
5. The single most characteristic element of this product, which leads the page [CC].
6. What real content exists: screenshots, numbers, customer names, quotes. Anything not on this list may not appear on the page.

If these are absent, stop and ask, or propose them and get agreement. Do not freestyle.

## 3. Colour

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| C1 | P0 | Indigo/violet/purple as primary (`indigo-500 #6366F1`, `violet-500 #8B5CF6`, `purple-500 #A855F7`) with no brand reason [TW][UT] | Accent taken from the product, its domain or its existing brand |
| C2 | P0 | Blue-to-purple or purple-to-pink gradient on hero, buttons or icons [UT][HM] | Flat colour. If a gradient stays, it has one job and one location |
| C3 | P0 | Gradient-clipped headline text (`background-clip: text`) [HM][CC] | Solid ink. Use size and weight for emphasis |
| C4 | P1 | Blurred aurora glows, floating orbs, blob backgrounds behind the hero [HM][FI] | A background that carries content: product, photo, data, texture tied to the subject |
| C5 | P1 | Coloured glows and coloured box-shadows on cards and buttons [KR] | Neutral shadow or none; elevation only where layering is real |
| C6 | P1 | Permanent dark mode with mid-grey body text that barely passes contrast [KR] | Pick the theme for the audience; body text at WCAG AA (4.5:1) or better |
| C7 | P1 | Dark background plus neon accent and glow, unprompted [CC] | See section 9 |
| C8 | P2 | Pure `#000` / `#fff` surfaces with stock slate greys [HM] | Tinted neutrals that belong to the palette |
| C9 | P2 | Timid palette: every colour used in equal small amounts [AN] | One dominant colour, one sharp accent, used unevenly |
| C10 | P2 | A different accent colour per feature card (blue, green, purple, orange icons) [OBS] | One accent; differentiate by content |

## 4. Typography

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| T1 | P0 | Inter (or Roboto, Arial, system stack) for everything, including display [AN][KR][UT] | A display face with character, or one family used with a real scale and weight contrast |
| T2 | P1 | The "escape" fonts: Space Grotesk, Geist, Instrument Serif [KR][AN] | Choose from the brief. These are the second most probable answer, not a choice |
| T3 | P1 | One word of the headline set in serif italic, bold or accent colour [KR][CC] | Emphasis through the sentence itself |
| T4 | P1 | Tracked all-caps eyebrow label above every section heading [KR][HM][CC] | A label only where it adds information the heading lacks |
| T5 | P2 | All-caps headings and section labels throughout [KR] | Sentence case |
| T6 | P2 | Monospace micro-labels and "A · B · C" meta strings as decoration [CC] | Mono only for code or data |
| T7 | P2 | 01 / 02 / 03 markers on things that are not a sequence [CC] | Numbers only for ordered steps |
| T8 | P2 | Flat hierarchy: headings at medium weight, small size steps [OBS] | Clear jumps in size and weight between levels |
| T9 | P2 | Figures in tables and stats without `tabular-nums` [HM] | `font-variant-numeric: tabular-nums` |
| T10 | P2 | Straight quotes, `--` for dashes, `...` for ellipsis in display copy [HM] | Proper typographic characters |

## 5. Layout and page structure

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| L1 | P0 | The stock order: centred hero, pill badge, two buttons, logo row, three feature cards, pricing, CTA band [CC] | Order follows the argument for this product; lead with its most characteristic element |
| L2 | P0 | Centred full-viewport hero with a headline that fits any company [UT][HM] | Show the product above the fold; headline names what it does |
| L3 | P0 | Row of three (or six) identical cards: icon on top, heading, two lines of text [KR][UT][HM] | Unequal emphasis. The feature that matters gets more room; minor ones become a list |
| L4 | P1 | Pill badge directly above the H1 ("New", "Beta", "Now with AI") [KR] | Remove unless it is real news with a link |
| L5 | P1 | Stat banner: three or four big numbers with small labels [KR] | Only sourced numbers, placed next to the claim they support |
| L6 | P1 | Numbered "1, 2, 3" how-it-works row [KR] | Show the actual steps in the actual product |
| L7 | P1 | Everything centred [HM] | Left-aligned text columns; centre only short display lines |
| L8 | P1 | Bento grid used because it is fashionable, with filler tiles [OBS] | A grid whose cell sizes reflect content importance |
| L9 | P2 | Uniform vertical padding on every section [HM] | Spacing that groups related sections and separates unrelated ones |
| L10 | P2 | Generic nav (Features, Pricing, About, Blog) and four-column footer full of links to pages that do not exist [HM] | Link only what exists |
| L11 | P2 | Alternating image-left / image-right feature rows with identical structure [OBS] | Vary the form to suit each feature's evidence |

## 6. Components and surface treatment

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| S1 | P0 | Untouched shadcn/ui and Tailwind defaults: slate cards, default radius, default accent [KR][CC] | Keep the library, override the tokens. Stock defaults are the giveaway, not the library |
| S2 | P1 | `rounded-2xl` on everything, one soft `rgba(0,0,0,.1)` shadow everywhere [CC] | Radius and elevation scales assigned by role |
| S3 | P1 | Cards inside cards [HM][CC] | Flat hierarchy; whitespace and rules carry structure. Tabular content goes in a table |
| S4 | P1 | Glassmorphism and `backdrop-blur` with no layering reason, typically on the nav [KR][HM] | Opaque surfaces; one glass element at most, where depth means something |
| S5 | P1 | Coloured stripe on the top or left edge of cards and callouts [KR][HM] | Plain container, or a real status indicator |
| S6 | P1 | Emoji as icons, bullets, nav items or heading decoration [KR][HM][UT] | One consistent icon set, or no icon |
| S7 | P1 | Default Lucide trio on feature cards: zap, shield-check, sparkles; sparkles to mean "AI" [DV] | Icons that depict the specific feature, or drop them |
| S8 | P2 | Icon in a tinted rounded square above every card title [HM] | Icons only where they aid scanning |
| S9 | P2 | Mixed icon sets and stroke weights [HM] | One set, one weight |
| S10 | P2 | UI chrome redrawn in CSS (fake browser frames, fake dashboards with invented data) [HM] | Real screenshots of the real product |
| S11 | P2 | Arrow on every link and button [CC] | Arrows only for navigation that leaves the context |
| S12 | P2 | Two hero buttons, "Get Started" and "Learn More" [CC][OBS] | One primary action, labelled with what happens |

## 7. Motion

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| M1 | P1 | The same fade-up on scroll for every section [CC][HM][UT] | One orchestrated moment, usually page load [AN]; otherwise still |
| M2 | P1 | Bounce or elastic easing, lift and scale on every card hover [HM] | Short ease-out transitions, tied to user action |
| M3 | P1 | Count-up animation on statistics [CC] | Static numbers |
| M4 | P2 | Floating particles, animated gradient backgrounds, cursor glows [OBS] | Remove |
| M5 | P2 | Lottie or Three.js for something that could be a still image [HM] | The still image |
| M6 | P2 | No `prefers-reduced-motion` handling [OBS] | Honour it |

## 8. Copy

Generated copy is the tell that survives a redesign. Density and clustering matter more than any one word; em dashes in particular are common in human prose too, so judge the pattern, not the character [WP][SE].

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| W1 | P0 | Headline that fits any product: "Build faster with AI", "The future of work" [UT] | Say what it does, for whom, in words a competitor could not reuse |
| W2 | P0 | Buzzwords: seamless, robust, cutting-edge, powerful, effortless, supercharge, unlock, elevate, leverage, streamline, empower, revolutionise, next-generation [UT][WP] | A concrete noun and a number or example |
| W3 | P1 | "It's not just X, it's Y" and other stock contrast frames [NC] | State Y |
| W4 | P1 | Rule-of-three everywhere: "Fast. Simple. Secure." and triple adjective lists [OBS] | As many items as there are things to say |
| W5 | P1 | Em dash in most sentences as connective filler [UT][NC] | Full stops and commas; restructure |
| W6 | P1 | Stock openers and closers: "In today's fast-paced world", "Ready to transform your workflow?" [UT] | Start with the point; end when done |
| W7 | P1 | Hedged claims: "may help you", "can potentially" [UT] | Commit, or cut the claim |
| W8 | P1 | Emoji-led bullet lists and emoji in headings [UT] | Plain lists |
| W9 | P2 | Title Case On Every Heading And Button [WP] | Sentence case |
| W10 | P2 | Section headings that are generic labels: "Features", "Why choose us", "How it works", "Trusted by teams everywhere" [OBS] | Headings that state the section's claim |
| W11 | P2 | FAQ answering questions nobody asked, written to restate features [OBS] | Real support questions, or no FAQ |
| W12 | P2 | Startup-cliché invented product names (Flowbase, Nexus, Synapse) and placeholder people (John Doe, Sarah Chen at Acme) [HM] | Real names or none |

## 9. The second wave: "tasteful" defaults

Asked to look "less AI", an agent lands on the next most probable look. These are tells too [CC].

| ID | Sev | Tell |
|---|---|---|
| N1 | P1 | Warm editorial: cream background (around `#F4F1EA`), high-contrast serif, terracotta or clay accent (around `#D97757`), sometimes sage |
| N2 | P1 | Dark signal: near-black with a single acid-green or vermilion accent |
| N3 | P1 | Broadsheet cosplay: hairline rules, zero radius, newspaper columns on non-editorial content |
| N4 | P1 | Faux-brutalist: thick black borders, hard offset shadows, mono everywhere, chosen as an escape and not from the brief [OBS] |
| N5 | P2 | Template chrome: eyebrows, mono labels, numbered markers, dot-separated meta strings (see T4, T6, T7) |

Rule: an aesthetic is acceptable only if section 2 can explain why this product needs it. "It does not look like AI" is not a reason.

## 10. Content honesty (P0, no exceptions)

No visual rule catches a made-up statistic [CC]. These damage trust more than any gradient.

- No invented metrics, ratings, user counts, uptime figures or ROI claims [HM][CC].
- No invented testimonials, customer names, avatars or "as seen in" logos.
- No fake logo wall. No "Trusted by 10,000+ teams" without a source.
- No AI-generated team photos, plastic 3D blobs or synthetic illustrations standing in for proof. Use real screenshots, real people, real numbers, or leave the section out [UT].
- No lorem ipsum or placeholder that could ship. If content is missing, mark it `TODO(content)` visibly and list it in the hand-off.
- Every claim on the page must trace to something in the section 2 content list.

## 11. Code, metadata and hygiene

| ID | Sev | Tell | Do instead |
|---|---|---|---|
| H1 | P1 | Duplicated or generic meta descriptions; missing or default OG image; default framework favicon and title [UT] | Per-page title and description; real OG image and favicon |
| H2 | P1 | Missing or generic alt text ("image", "hero image") [UT] | Alt text that describes the content, empty for decoration |
| H3 | P1 | Dead links: `href="#"`, nav and footer items that go nowhere, social icons with no target [OBS] | Remove what is not wired up |
| H4 | P1 | Hover-only affordances; no visible focus state; divs as buttons [HM][UT] | Keyboard-reachable controls with focus styles |
| H5 | P1 | Lazy-loaded LCP image; autoplaying media with sound [HM] | Eager, sized hero image; no autoplay sound |
| H6 | P2 | Arbitrary inline values (`mt-[37px]`, one-off hex codes) next to a token system [HM] | Tokens only |
| H7 | P2 | `z-index: 9999`, `width: 100vw`, dead utility classes, copy-pasted near-identical components [HM][UT] | Layering scale; `100%`; delete unused; extract components |
| H8 | P2 | Forms that submit nowhere, newsletter boxes with no backend, buttons with no handler [OBS] | Wire it or remove it |
| H9 | P2 | Only the happy path: no empty, loading, error or long-content states; breaks below 380px [OBS] | Design the states; test narrow and wide |
| H10 | P2 | Copyright year hard-coded or wrong; "Made with love" footer line; leftover framework boilerplate [OBS] | Clean it |

## 12. Self-check before delivery

Quick scan (adapt paths):

```sh
# colour and gradient defaults
grep -rnE "(indigo|violet|purple)-[4-7]00|from-(indigo|purple|violet)|bg-clip-text|text-transparent" src/
# surface defaults
grep -rnE "backdrop-blur|rounded-(2xl|3xl)|blur-3xl|shadow-(indigo|purple|violet)|border-(l|t)-4" src/
# type defaults
grep -rnEi "Inter|Space.Grotesk|Geist|Instrument.Serif|uppercase tracking-" src/
# motion defaults
grep -rnE "animate-bounce|whileInView|hover:scale-|hover:-translate-y" src/
# icons and emoji
grep -rnE "Sparkles|ShieldCheck|<Zap|[✨🚀⚡🎉💡🔥✅]" src/
# copy
grep -rnEi "seamless|robust|cutting-edge|supercharge|unlock|elevate|leverage|streamline|empower|effortless|next-gen|get started|learn more|not just" src/
# dead ends
grep -rnE "href=\"#\"|lorem|John Doe|Acme" src/
```

A grep hit is a prompt to justify, not an automatic failure.

Then answer each of these with yes:

1. Could I name the product from a screenshot with the logo and headline removed?
2. Does every colour, typeface, radius and animation trace to `DESIGN.md`?
3. Is every number, name, logo and quote on the page real and sourced?
4. Is there visible hierarchy, with one thing clearly most important per screen?
5. Does the page trip fewer than 4 items from sections 3 to 9, each deliberate?
6. Does it avoid section 9 as well as sections 3 to 7?
7. Do all links, buttons and forms do something?
8. Keyboard, contrast, reduced motion, narrow viewport: all checked in a browser, not assumed?
9. Has the copy been read aloud once, and would a competitor be unable to reuse it?

## 13. Sources

- **[AN]** Anthropic, "Prompting for frontend aesthetics" (Claude Cookbooks): https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb
- **[KR]** Adrian Krebs, "Scoring Show HN submissions for AI design patterns". Deterministic DOM/CSS checks over 1,590 Show HN landing pages; 22% triggered 4+ patterns, 32% 2 to 3, 46% 0 to 1; author estimates 5 to 10% false positives: https://adriankrebs.ch/blog/design-slop/
- **[TW]** Origin of the indigo default: https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website and https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
- **[CC]** Capital & Compute, "How to Fix AI Slop in Web Design, Tell by Tell" (first and second wave, invented numbers): https://capitalandcompute.net/blog/fix-ai-slop-design/
- **[HM]** Hallmark anti-pattern catalogue (Critical / Major / Minor tiers): https://instagit.com/Nutlope/hallmark/hallmark-anti-patterns-detected.md
- **[UT]** Utsubo, "The 'Built with AI' Tell: 12 Signals That Drop Trust in 2026": https://www.utsubo.com/blog/built-with-ai-trust-signals-2026
- **[FI]** The Fountain Institute, "7 Signs a UI Has Been Vibe Coded": https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui
- **[DV]** "I got sick of my Claude Code UI slop" (Lucide icon and badge patterns): https://dev.to/alexander_mia_9/i-got-sick-of-my-claude-code-ui-slop-so-i-crystallized-it-into-a-go-cli-2hni
- **[WP]** Wikipedia, WikiProject AI Cleanup, "Signs of AI writing" (via https://flowingdata.com/2025/10/20/signs-of-ai-writing-on-wikipedia/). It states the list is not a ban on words or punctuation.
- **[NC]** NCC Group, "Unmasking Techno Sophists" (em dash density, "not just X, it's Y"): https://www.nccgroup.com/media/l5cjcey2/unmasking_techno_sophists.pdf
- **[SE]** Search Engine Land, AI writing tics engagement study (caution on treating em dashes as proof): https://searchengineland.com/ai-writing-tics-engagement-study-470051
- **[OBS]** Practitioner observation; not independently sourced. Weigh accordingly.

Caveat on evidence: only [KR] is a measured study, and it measures pattern frequency, not authorship. The rest are practitioner catalogues that agree with each other. Treat this file as a list of defaults to question, not a detector.
