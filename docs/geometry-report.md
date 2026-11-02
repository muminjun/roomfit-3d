# Geometry implementation report

The pure geometry package exports room polygon editing and validation, placement and clearance checks, footprint snapping, and viewport transforms from `src/lib/geometry/index.ts`. It imports only model types and has no DOM, React, or Three.js dependency. Geometry errors include Korean descriptions and stable codes.

The fixed UT-GEO-01–12, UT-PLC-01–08 and UT-VIEW-01–02 cases are in `tests/unit/geometry.test.ts`, along with rectangle anchoring and odd-width snapping checks. The polygon catalog also exercises T-contact, duplicate closing points and IDs, and sub-100 mm segments.

Verification on 2026-11-02:

- `npm test -- --run tests/unit/geometry.test.ts`: 25 tests passed.
- `npm test`: 2 files, 28 tests passed.
- `npx tsc --noEmit`: exit 0.
- `npm run lint`: exit 0.
- Backtracking regression was observed failing before its fix and passing afterward.
- Tests were written before implementation, but the initial run could not execute: first `package.json`, then the Vitest executable, was missing while the scaffold was being installed. After installation, temporarily removing the geometry barrel exports made all 24 geometry tests fail with missing-function errors; restoring them made all 24 pass. This is a retrospective regression check, not a successful pre-implementation red run.

Editing functions return an immutable candidate and ID/selection map, or a structured failure; callers must commit only successful results. `normalizeEditCandidate` reverses negative winding only when passed an empty previous polygon (import-style normalization), while rejecting winding reversal during an edit. External import must reject duplicate points, bad coordinates, and crossings before invoking normalization, as required by the import pipeline. `getNearestClearance` assumes a valid, non-overlapping placement; callers should display placement errors instead of clearance for invalid items.
