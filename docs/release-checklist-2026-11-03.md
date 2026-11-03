# Release checklist — 2026-11-03

- [x] Production source comparison: no tracked or untracked files under `src` differ from commit `319f6c092127da0b184b1e0fa9449880e1addbec`; tracked `index.html`, package manifests and Vite config also match that commit. Documentation and the separate `tests/unit/ac-examples.test.ts` are pending outside that source comparison.
- [x] Production artifact integrity: all 10 current `dist` files match `/tmp/roomfit-final-dist-before.json` by SHA-256, with no missing or additional files. This establishes equality to the saved baseline, not an independent rebuild or deployment.
- [x] Local production rehearsal: `/tmp/roomfit-local-live-check.json` records Chromium 156 and Firefox 157 passing the `/roomfit-3d/` flow on localhost port 4175, including 3D, JSON and reload. This is a local rehearsal, not a hosted-site verification.
- [x] Previous full browser suite: `/tmp/roomfit-final-154-e2e.log` reports **153 passed, 1 failed** in 9.9 minutes. Chromium `architecture-editor.spec.ts` timed out after 5 seconds waiting for the 3D canvas; the failure snapshot still showed “3D 보기를 준비하고 있습니다.” This result does not establish a WebGL failure or a fully passing suite. An unchanged focused rerun passed (see below); a subsequent complete serial rerun passed as recorded below.
- [x] Browser removal spot check: no Microsoft Edge process was visible in the process listing, and the standard `/Applications/Microsoft Edge.app`, `~/Applications/Microsoft Edge.app`, `~/Library/Application Support/Microsoft Edge` and `~/Library/Preferences/com.microsoft.Edge.plist` paths were absent at inspection. This spot check is not a complete filesystem inventory.

The final browser result and artifact hashes were inspected independently; no duplicate full browser run, browser installation, build, deployment or product mutation was performed for this checklist.

## Focused recheck

`npx playwright test tests/e2e/architecture-editor.spec.ts --project=chromium --workers=1 -g 'architecture can be created' --output=/tmp/roomfit-architecture-recheck` passed 1/1: test duration 9.8 seconds; run duration 12.1 seconds. The original test, its canvas assertion, and default 5-second assertion timeout were unchanged. The earlier timeout occurred while the lazy 3D view showed its loading state. The focused pass is consistent with a transient load delay but does not establish its cause or replace a clean full-suite result. The rerun emitted the Node `NO_COLOR`/`FORCE_COLOR` environment warning and no reported test errors.

## Final serial full-suite rerun

`npm run test:e2e -- --workers=1 > /tmp/roomfit-final-serial-e2e.log 2>&1` ran alone with unchanged product code, tests, assertions, timeouts and retry settings. The completed Playwright log reports **154 passed (2.0m)** across Chromium and Firefox. The process session's numeric exit code was not retained when its final poll was consumed, so this record relies on the completed test summary and does not claim an independently observed numeric exit code. The prior 153/154 run and focused recheck remain recorded above; the cause of the prior delay is not established.
