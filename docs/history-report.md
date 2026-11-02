# Project history report

History stores title, room and furniture references, with at most 50 past snapshots. Settings remain outside undo/redo. Commits preserve immutable project metadata; import validates strict project data and keeps its metadata. Undo and redo update `updatedAt`. Same-key commits within 500ms of the preceding commit share the first snapshot; a different key, ordinary commit, undo, redo, load, or settings change ends that sequence. No-op and invalid commits do not change project or history.

`tests/unit/history.test.ts` was written first: the initial run had 9 passing tests and one expected failure because coalescing produced two snapshots. After implementation all 10 passed. The full `npm test` run passed 46 tests in 4 files; `npm run lint` and `npm run typecheck` both exited 0.
