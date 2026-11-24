# Keep the website current

The docs website (`docs/`, live at https://perfect-design.raczylo.com) is where people and agents learn the library and copy examples from. The user asked that it never fall behind the library.

## Every visible change updates the website in the same change
- A new or changed component, prop, variant, slot, token, theme axis (`data-*` attribute on `<html>`), style pack, store action or exported CSS file must update its docs and examples in the same branch. A docs follow-up later does not count.
- Components: update `<Name>.docs.ts` (props, examples, `llmNotes`) as `docs-and-llm.md` describes. Each new prop value or variant gets its own example. A changed default updates every example that shows it.
- Theme-level features (tokens, theme axes, CSS files, stores): update the matching section of the Foundations page or a guide. Add a live demo, the picker if one exists, and a code sample in `docs/src/lib/snippets.ts`.
- A removed or renamed API: rewrite or delete every example that uses the old name. An example must never show something that no longer works.
- Run `pnpm generate:llms`, so `llms.txt`, `llms-full.txt` and the manifests match the site.
- Look at the new examples in a browser before you call the work done: `pnpm --filter docs build` then `pnpm --filter docs preview`, or `scripts/a11y-sweep.mjs` with the matching flags.

## Deploying the website
- `.github/workflows/pages.yml` deploys the site on every push to `main`.
- Commits, merges and pushes still need the user's request (`workflow.md`). When the user asks to land work on `main`, push `main` in the same step. Then wait for the Pages run and check the changed page on the live site. The work is not done until the live site shows it.
- An npm release (`release.yml`, a `v*` tag) is a separate step and needs its own explicit yes.
