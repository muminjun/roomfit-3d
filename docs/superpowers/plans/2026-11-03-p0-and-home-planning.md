# P0 interactions and home planning implementation plan

**Goal:** Repair the audited original MVP requirements, then extend home planning for the user's added rotation, opening clearance, doors/windows, bathroom/kitchen/entry and catalog requirements.
**Architecture:** Preserve React/TypeScript, Konva, R3F, Zustand, strict Zod and ProjectDataV2. Keep previews/UI and derived warnings separate from committed data. Extend persisted structures additively with defaults for old v2 documents; never clear user storage.
**Spec:** `docs/requirements/RoomFit3D_PROMPT.md`, user audit and subsequent 2026-11-03 scope expansion. Original requirements are unchanged; approved behavioral overrides go into DECISIONS.

## Global constraints
- Integer room dimensions and vertices; half-mm furniture centers. Only 3D converts mm to metres.
- Invalid previews, cancellations, NoChange and view changes do not commit project/history/autosave.
- Preserve polygon containment, boundary contact and positive-area overlap geometry.
- Shared workspace file ownership: interaction worker exclusively owns Editor2D/FurnitureLayer/shortcuts; UI worker owns app/common/styles; coordinator owns model/commands/new planning modules/catalog/3D until explicitly reassigned.
- Work on `fix/interaction-and-home-planning`; merge/push main only after final validation, already authorized by user.

## Review focus
- Pan initiated over furniture, resize handles or walls must never create an edit, including blur/Esc/pointercancel.
- Shift snapping must preserve off-grid and half-mm frozen coordinates after 90-degree rotation.
- Old v2 backup roundtrips and corrupt/conflicting autosaves must remain protected with new optional structures.
- Opening-space warnings must follow furniture rotation and identify obstacles without conflating them with footprint overlap.
- Added architectural elements must survive Undo, JSON and view switching; invalid room edits preserve them with warnings.

## Task 1: P0 editor interactions and shortcuts (interaction worker)
- [x] Add and run failing browser regression tests for Space/middle pan over furniture and Shift off-grid constrained drag before fixes.
- [x] Fix gesture priority/lifecycle, preserve the frozen axis after snap, handle small drag jitter.
- [x] Implement furniture fit-selection, idle Esc deselection, registry-backed Esc and Korean command failure feedback.
- [x] Complete selected-subject Alt measurement for furniture/wall hover with cleanup and invalid-subject guidance.
- [x] Verify focused unit/browser tests, record exact red/green evidence and changed files; do not touch model or commands.

## Task 2: Original UI/accessibility gaps (UI worker)
- [x] Review original welcome/editor/help and implement real first-entry flow with validated saved-project continuation.
- [x] Status bar: mode/grid/snap/mm/derived warnings/save status. Add room-properties navigation independent of canvas.
- [x] Add meaningful numeric bounds and tooltip explanations; check 390px and 768–1023px layouts.
- [x] Add keyboard-only journey and entry-flow tests; preserve import/storage contracts and interaction worker ownership.

## Task 3: Expanded planning design (coordinator)
- [x] Communicate default rotation-invalid policy and single-plan zones; optional clarification unanswered. Defaults are coordinator decisions following the user’s request to start and source prompt’s continuous execution instruction.
- [x] Write concrete additive-data/UI design, alternatives and acceptance tests before implementing added scope.
- [x] Implement approved design with tests first, backward compatible JSON, Undo and 2D/3D parity.
- [x] Expand catalog with recognizable code-rendered thumbnails and bathroom/kitchen/entry/appliance items.

## Task 4: Verification and AC audit
- [x] Read each original P0 AC-01–51/61–90 and map exact source/test evidence, marking partial/unavailable honestly.
- [x] Recheck dependency audit with compatible fixes only. Measure actual renderer frame/draw-call data independently of rAF cadence (GPU timing unavailable).
- [x] Run typecheck/lint/test/full single-worker E2E, one subpath build, check same dist, subpath E2E.
- [x] Fresh-context final code review, fix material findings, update reports/README/DECISIONS/PROGRESS.
- [ ] Commit, integrate main without deleting user work, push, verify Actions and live URL regressions.

## Baseline
2026-11-03: clean main at a088b54. New branch `fix/interaction-and-home-planning`. `npm run test`: exit 0, 97 tests / 10 files. No claim about current browser suite yet.

Final additions: welcome JSON import red→green; pan→tool-switch native draggable restoration red→green. Edge verification withdrawn and downloaded artifacts removed at explicit user request. No further product changes after final build.
