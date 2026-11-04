# Workbench implementation plan

**Goal:** Complete automatable P0 gaps and deliver the requested free static workbench extensions.
**Spec:** ../specs/2026-11-04-workbench-design.md
**Baseline:** cleanmain495c7df; branchfeat/roomfit-workbench. Existing126unit/154browser results are historical until rerun.

## Tasks

- [x] 1. Forms accessibility: failing numeric/name association tests, repair field-local errors/hints, verify unit/browser; audit worker owns common numeric/new-dialog and scalar property panels.
- [x] 2. Multi-select/batch commands: add failure tests for whole-group collisions/atomicity/locks, implement new batch module and editor/selection toolbar integration, verify pan/Shift/cancel contracts; editor worker owns Editor2D/FurnitureLayer and new batch/toolbar files.
- [x] 3. Local library and 2D export: storage preservation tests, implement independent local snapshots and SVG/PNG/print dialogs with full-plan bounds and escaped content, verify browser downloads and restore; product worker owns new modules/components only.
- [x] 4. Shared interfaces: coordinator adds optional locked field, serialized only when present, selection-set UI helpers, split view enum, export callbacks; communicate exact interfaces before integration.
- [x] 5. 3D/split: coordinator implements camera presets, read-only wall visibility, PNG capture and opt-in direct dragging with preview/cancel/history invariants; meaningful independent geometry/browser tests first.
- [x] 6. Columns/clearance/ruler and architecture canvas manipulation: implement after preceding ownership handoff; preserve explicit subject/target and host semantics, test rotated/negative/offgrid/cancel cases.
- [x] 7. Complete grouped original AC test gaps and re-audit exact assertions, leave unavailable physical checks as unverified.
- [ ] 8. Fresh independent code review, full gates, one final same-base dist inspection, docs/commit/main push/Actions/live verification.

## Review focus

- Batch operations must ignore selected members' old positions but detect all final mutual collisions and locked targets.
- Library quota/corruption/cancel must preserve existing library and active autosave and selection/history.
- Export must include off-screen/negative-coordinate geometry, escape text, contain genuine image data, and not commit.
- Split view and3D pointer capture must release Orbit editing state on all cancel/unmount paths.
- New optional persisted properties preserve exact old-v2 files and strict rejection of unknown keys.
