---
name: releasing-components
description: Publishes a new @perfect-design/ui version from a signed tag, confirms it reached npm, and updates a consuming app to it. Use when the user asks to release, tag, publish or ship Perfect Design, or to bump an app to a new Perfect Design version. Not for writing or checking the change (use developing-components and validating-components).
---

# Releasing components

Release only when the user asks. A release is public: npm keeps every published version.

## How a release works
- The version comes from the tag. `packages/ui/package.json` stays at `0.1.0` in git. `.github/workflows/release.yml` runs `npm version "${GITHUB_REF_NAME#v}"` in CI.
- A pushed `v*` tag starts the `Release` workflow: `verify` (typecheck and tests), then `release` (build, pack, GitHub release with the tarball, `npm publish --provenance`).
- The npm publish step has `continue-on-error: true`. A green workflow does not prove that npm has the version. Always check npm yourself.

## 1. Before you tag
- Main is clean and pushed, and the change passed `validating-components` at level 2 or higher.
- Pick the version from the latest tag (`git tag --sort=-creatordate | head -3`). Before 1.0: a patch bump for fixes and opt-in additions, a minor bump for a change that breaks a consumer.

## 2. Tag and push
```sh
git tag -s vX.Y.Z -m vX.Y.Z
git push origin main vX.Y.Z
```
Signing and push use 1Password. If they fail with a signing or publickey error, ask the user to unlock 1Password, then run the same command again.

## 3. Watch the workflow
```sh
gh run list -R lukaszraczylo/perfect-design -L 3
gh run watch <release-run-id> -R lukaszraczylo/perfect-design --exit-status
```

## 4. Confirm npm
The registry shows the version metadata first. The tarball can return `ERR_PNPM_FETCH_404` for some minutes after that. Retry; do not change the version.
```sh
for i in $(seq 1 30); do [ "$(pnpm view @perfect-design/ui@X.Y.Z version 2>/dev/null)" = "X.Y.Z" ] && break; sleep 15; done
```
If the version never appears, read the npm publish step in the run log. It is the step that can fail while the run stays green.

## 5. Update a consuming app
Run in the app (in its worktree when it has one):
```sh
for i in $(seq 1 20); do pnpm add @perfect-design/ui@X.Y.Z && break; sleep 20; done
pnpm exec prettier --write pnpm-lock.yaml
git diff --stat package.json pnpm-lock.yaml
```
- Expect a lockfile diff of a few lines. A diff of thousands of lines is quote-style churn: run the prettier step.
- Use the new option in the app code, run the app's type check, tests and production build, then check the page as `validating-components` step I says.
- Commit the version bump with the code that uses it. The commit body names the Perfect Design version and the reason.

## Report
Give the tag, the workflow run, the confirmed npm version, and for each app the commit, the checks run and the pages checked.
