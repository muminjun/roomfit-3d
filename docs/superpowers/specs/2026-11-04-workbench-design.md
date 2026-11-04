# RoomFit workbench expansion

User request: complete remaining requirements, add the useful missing features, and deploy. Preserve all prior user data and the explicit prohibition on downloading/running Edge. Existing main baseline is495c7df. Original requirements remain unchanged; this requested expansion authorizes their P1 features.

## Approach

Extend the existing free static React/Konva/R3F application. Keep one active ProjectDataV2, strict nested optional extensions and mm/half-mm geometry; retain old-v2 exact roundtrips when extensions are absent. A local project library stores additional independently validated v2 snapshots separately from the existing autosave. Independent room/floor topology and external-service features would require separate model/service design. The user has an optional scope question pending for login/collaboration/cloud AI; server-free work is independent and proceeds.

Alternative approaches considered: rebuild the app with a new multi-floor/server schema (breaks existing contracts and needs services); add isolated toolbar buttons with separate data (would desynchronize views/history); extend existing commands and derived views (selected coordinator default, using the user's instruction to proceed). No external backend, paid API or browser installation is needed for this stage.

## Deliverables

1. Repair original field-associated numeric/name errors and integer hints. Add exact missing P0 geometry/storage/view assertions where automatable, retaining honest unavailable physical-environment statuses.
2. Local project library: save/list/rename/clone/switch/delete saved projects, protect active unsaved project, preserve corrupt/quota-failed storage, and keep manual JSON backup available. Existing autosave key and its conflict/corruption protection remain in place. Failed/cancelled library operations do not change active project/history/selection/autosave.
3. Full-plan SVG/PNG/print, independent of the current pan/zoom; include room, zones, partitions/openings, furniture, dimensions and title. Escape user text and bound raster dimensions. Native 3D PNG capture after actual rendering; read/export actions do not alter project/history/autosave.
4. Multi-select furniture, Ctrl/Cmd+A, single-history batch move/delete/duplicate, align/distribute, copy/paste and lock. Preserve relative positions; validate the complete resulting set rather than colliding against their old positions. Locked geometry cannot be dragged/nudged/resized/rotated/deleted until unlocked; name/color remain editable. Selection and clipboard are UI state; optional locked property persists only when used.
5. Split2D/3D view, top/front/side/isometric views and wall visibility, canvas3D selection and opt-in floor-plane dragging with shared validation/preview/Undo. Orbit navigation remains separate from editing. Numeric properties remain available on mobile/keyboard.
6. Column presets, configurable front-use-clearance advisories and a UI-only two-point ruler. Advisories are derived, never persisted warnings or legal safety claims. Existing getNearestClearance four-direction definition remains unchanged; the manual ruler is separately named point-to-point measurement.
7. Select and move architectural elements on canvas with numeric panel parity, drafts outside committed data, host-aware opening offsets and one valid-drop history entry. Cancel/blur/pointercancel/tool/project/view changes clear drafts.

## Architecture and ownership

- Coordinator: model/schema/serialization changes, UI-store interfaces and App integration, 3D/split/columns/clearance/ruler as needed, final integration/deploy. Shared source changes are communicated before dependants implement.
- Editor worker: furniture batch commands in a new module, Editor2D/FurnitureLayer integration and a separate selection toolbar; existing scalar command module changes coordinated with root.
- Product worker: new local-library/export modules and standalone dialogs/toolbar; avoid App/model/Viewer3D until root integration. Architecture canvas improvements become a later owned task.
- Audit worker: original forms/errors in NumberField/NewProjectDialog/RoomPanel/FurniturePanel, focused regressions and original AC completion tests. Do not edit shared editor/App/model files.

## Binding checks

Structural schema errors remain atomic. No room geometry rewrite, no corner-only concave containment, no silent deleting/moving invalid existing items. View/selection/export/draft/cancel/NoChange do not commit. Undo excludes grid/snap/settings as before. Source units stay mm;3D converts to metres with yaw=-rotationDeg. Keep instance IDs unique, dependencies stable and browser contexts isolated from user's data.

Regression tests precede behavior changes; tests directly check failed/cancelled-state invariants and actual UI exports/3D/keyboard flows. No timeout/retry weakening to hide failures. At release run typecheck/lint/unit/full single-worker browser suite, then one final subpath build and check that same dist/subpath tests. Use independent review, commit, main fast-forward/push, Actions and live service regression. No blanket100% claim from test counts.
