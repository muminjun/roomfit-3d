# Deployment configuration check — 2026-11-03

Reviewed `.github/workflows/deploy.yml`, `vite.config.ts`, `scripts/check-dist.mjs`, `playwright.subpath.config.ts`, the subpath browser scenario, `package.json` and `package-lock.json`. Source reference at this review: `319f6c092127da0b184b1e0fa9449880e1addbec`, with release documentation and acceptance tests still changing in the shared workspace. This review did not change deployment configuration, install dependencies, rebuild, or repeat other workers' test suites.

## Configuration readiness

No deployment configuration blocker was found.

- The Pages workflow runs on pushes to `main` and manual dispatch. It uses Node **22.15.0**, `npm ci`, typecheck, lint and unit tests before the production build.
- There is exactly one production build in the workflow. `node scripts/check-dist.mjs` checks that output; `actions/upload-pages-artifact` uploads the same `dist` directory; `actions/deploy-pages` deploys that artifact. There is no second build or alternate upload path between verification and deployment.
- Vite and `check-dist.mjs` use the same base calculation. In this repository, `GITHUB_REPOSITORY=muminjun/roomfit-3d` produces **`/roomfit-3d/`**. An explicit `VITE_BASE_PATH` overrides the repository-derived value in both places. Leading/trailing slashes are normalized consistently.
- The current local `dist/index.html` references the favicon, entry JavaScript, CSS and preload chunks under `/roomfit-3d/`. This read confirms the configured base in the existing artifact; it does not certify that artifact as the final release build.
- `check-dist.mjs` checks HTML references, static and literal dynamic JavaScript imports, and Vite preload asset literals. It verifies files exist under `dist` and rejects local references outside the selected base or artifact directory.
- The subpath browser configuration serves an already built `dist` and does not rebuild it. Its Chromium and Firefox scenario checks `/roomfit-3d/`, favicon loading, initial 2D assets, lazy 3D JavaScript, switching back and reloading, with failed requests/page errors collected.
- Pages deployment permissions and environment are declared: `contents: read`, `pages: write`, `id-token: write`, environment `github-pages`. The shared Pages concurrency group queues deployments (`cancel-in-progress: false`).

## Node and lockfile compatibility

The review ran under Node **v22.15.0**. Comparing every package's declared `engines.node` range in the lockfile with 22.15.0 found **zero mismatches**. This is a declared-engine compatibility check, not a substitute for the CI commands.

| Package | Locked version | Declared Node range | Node 22.15.0 |
| --- | --- | --- | --- |
| jsdom | 27.4.0 | `^20.19.0 || ^22.12.0 || >=24.0.0` | Satisfies |
| Vite | 8.3.5 | `^20.19.0 || >=22.12.0` | Satisfies |
| Vitest | 5.0.5 | `^22.12.0 || ^24.0.0 || >=26.0.0` | Satisfies |
| React Vite plugin | 6.2.1 | `^20.19.0 || >=22.12.0` | Satisfies |
| ESLint | 10.14.0 | `^20.19.0 || ^22.13.0 || >=24` | Satisfies |
| `@exodus/bytes` | 1.16.0 | `^20.19.0 || ^22.12.0 || >=24.0.0` | Satisfies |

The lockfile uses version 3. Its root runtime and development dependency entries match `package.json` by package name and version. No forced upgrade, override, or lockfile change was needed for this check. The separate dependency audit records the unresolved development-only minimatch advisory; this review does not reclassify it or claim a fresh vulnerability scan.

## Release gates and monitoring

At the time of this configuration review, the coordinator reported the latest 154-case browser run as **153 passed, 1 failed**: the first Chromium architecture-editor scenario was under investigation. This document therefore does not mark that run or the release as passing. The coordinator owns the final corrected test evidence, commit, main integration and push.

After the final push:

1. Locate the push-triggered Pages run for the exact pushed SHA and verify its `head_sha`, event and branch.
2. Check the complete deployment job result, including install, typecheck, lint, unit tests, build, artifact checking, upload and Pages deployment.
3. Record the run URL, final conclusion and reported deployment URL. If deployment is queued or requires an environment decision, report that state rather than calling it deployed.
4. Verify the live Pages URL and its static/lazy assets separately against the deployed revision; a successful job alone does not establish the live browser result.

The connected `github_fetch_commit_workflow_runs` wrapper documents that it filters pull-request-triggered runs, so an empty result from it must not be treated as absence or failure of this push deployment. Use the connected generic GitHub GET endpoint for `/repos/muminjun/roomfit-3d/actions/runs?head_sha=<SHA>&event=push`, or the workflow run collection, and inspect the resulting jobs. No rerun, workflow dispatch, force push or repository setting change is part of this read-only monitoring task.

**Current monitoring state:** awaiting the final pushed SHA; no current release deployment result is asserted here.
