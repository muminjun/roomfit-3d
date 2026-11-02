# RoomFit 3D Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Build and verify full S0–S5 RoomFit 3D MVP locally.
**Architecture:** Pure integer orthogonal geometry feeds one validated Zustand project store. Konva and R3F are derived views; previews/UI/history are separated. Strict import and autosave protect data.
**Tech Stack:** React19, TS strict, Vite, react-konva19, Three/R3F9/drei10, Zustand, Zod, Vitest, Playwright, CSS Modules.
**Spec:** docs/requirements/RoomFit3D_PROMPT.md
## Global Constraints
- mm integer vertices/dimensions; furniture centers half-mm; schemaVersion:2.
- 한국어 UI; no server/login/DB/AI/collaboration; dependencies limited to PRD §13.
- Geometry→room UI→placement→3D→hardening→deploy gates. No push.
- All ID generation uses injectable IdGenerator. Invalid previews never commit/save/history.
## Review Focus
- Concave inclusion crossing notch, half-mm snapping, self-touch and collapse normalization.
- Corrupt autosave and pending multi-tab writes preserve original.
- Opposite resize corner/90-degree dimension mapping.
- Floor +Y normals and nonoverlapping external wall union.
- DOM drop after pan/zoom and cancel preserve committed model.
## Task 1: S0 foundation and independent geometry (disjoint parallel ownership)
- [ ] Scaffold config/scripts, strict model/schema, catalog, presets, minimal app/store/2D/autosave.
- [ ] Write failing geometry tests UT-GEO01–12/PLC01–08/VIEW01–02; run red; implement pure geometry and run green.
- [ ] Run ci/typecheck/lint/test/build, intentional type-error negative check; commit S0.
## Task 2: S1 room editing
- [ ] Wire wall move/normal form, indent/protrude numeric+two-stage gesture, presets, dimensions, grid, zoom/pan/cancel, history50.
- [ ] Verify exact areas, collapse/IDs, invalid rollback with unit+browser tests; run gates and commit.
## Task 3: S2 furniture
- [ ] Shared placement-validated commands; catalog click/DnD; move/rotate/resize/property/duplicate/delete; keyboard registry and clearance.
- [ ] Test odd dimensions/collision/recovery/cancel/coalescing; run gates and commit.
## Task 4: S3 real 3D
- [ ] Build floor + external wall grid-union geometry tests first, fit camera and furniture primitives; lazy viewer/OrbitControls/WebGL fallback.
- [ ] Verify normals/areas/camera/sync/fallback in unit/browser; run gates and commit.
## Task 5: S4 hardening
- [ ] Test and implement strict atomic JSON, autosave errors/corruption/conflicts, focus/keyboard/accessibility/responsive flows.
- [ ] Run full browser journeys in available Chrome/Firefox/Edge, record performance and unsupported environments; run gates and commit.
## Task 6: S5 delivery
- [ ] Validate repo-derived base and same-dist assets/dynamic chunks in local subpath preview; official Actions workflow.
- [ ] Reconcile all 90 AC with honest evidence, README/reports; full npm ci/typecheck/lint/test/build/e2e, commit. Do not push.
