# Home planning additions — 2026-11-03

The user's new request extends the original single-room MVP with rotation even when the resulting placement is invalid, appliance/cabinet opening space, windows, doors, bathroom/kitchen/entry planning and more items. The original requirements file is preserved. These extensions are explicitly requested; this document records implementation choices, not an assertion that the user approved details they have not seen.

## Approach and decisions

Keep one exterior orthogonal polygon and add interior partitions, named rectangular zones and wall-hosted openings to the existing `room`. This supports bathroom/kitchen/entry on the same floor without replacing the geometry/storage engine. Independent connected room polygons and separate floors would require a new topology model and migration; treating doors/windows as ordinary furniture would fail to produce real wall openings. The selected implementation is additive single-plan architecture. This is the coordinator's default while the optional user clarification remains unanswered, following the source prompt's instruction to continue using safe defaults.

Retain `schemaVersion:2`. Add optional `room.partitions`, `room.openings`, `room.zones` and optional `FurnitureItem.operation`. Old files remain accepted and are serialized without new empty fields. All new entries have globally unique IDs and strict fields. New persisted fields participate in Undo/Redo and autosave; derived errors and opening previews do not.

## Rotation

`rotateFurniture` validates structural data but commits a 90-degree rotation even when placement is outside or overlapping. No automatic moving/deleting. The user sees the actual rotated geometry and derived placement warning and can move/resize/rotate back or Undo once. New furniture placement, move and resize retain existing valid-final-placement requirements. Invalid rotation angles and malformed data are still rejected. Record this intentional override to original FR-022/024/025 in DECISIONS and AC reporting.

## Architectural data and UI

- Partition: `{id,name,start:{x,y},end:{x,y},thicknessMm,heightMm}`. Axis aligned, integer mm endpoints, length >=100mm, thickness 50–500mm, height 1800–5000mm. Rectangular wall strip centered on line, inside floor when newly created. New furniture placement checks the solid partition volume. Interior wall openings remove their span only at relevant heights.
- Opening: `{id,name,kind:'door'|'entrance'|'window',hostId,offsetMm,widthMm,heightMm,sillMm,hinge:'start'|'end',swing:'inward'|'outward'}`. `hostId` identifies an exterior edge's start vertex or partition. Offsets follow host start→end. Defaults door 800×2100, entrance 900×2100, window 1200×1200/sill900. Door sill=0. Validate fit along host, vertical height and positive-area overlap with other openings. Derived warnings retain orphaned/invalid openings after room edits. Delete partition with hosted openings is rejected with guidance to remove openings first.
- Zone: `{id,name,kind:'bathroom'|'kitchen'|'entry'|'living'|'bedroom',x,y,widthMm,depthMm}`. Integer rectangular annotation inside floor, no floor holes and no collision obstacle. Areas are planning labels, not a claim of plumbing/structural feasibility. Zone edits do not automatically add or move walls/furniture.
- Dedicated accessible architecture panel: add/edit/delete lists and numeric forms for every field. Room-properties navigation remains available. Selected room edge is offered as default host; all exterior edges and partitions are selectable by name. Numeric controls work without canvas gestures.
- 2D: zones fill lightly behind furniture; partitions draw actual thickness; doors/windows overwrite the host span, with door leaf/swing sector and window double line. 3D: real voids in the wall volume for doors/windows, frames/glass/leaves inside declared opening volume, partition walls and subtle zone floor tint. Same mm model in both views.

## Operational opening space

`operation?: {kind:'swing'|'doubleSwing'|'drawer'|'sliding'|'top',clearanceMm:number,enabled:boolean}`. Catalog presets supply sensible illustrative defaults. Front is north at rotation0, east at90, south at180, west at270. Opening space is a conservative full-front rectangular operating envelope, distinctly labeled as a configurable planning allowance rather than precise manufacturer door geometry or a legal installation standard. 2D shows the allowance and door cue for selected/opening-capable items; panel reports wall/partition/furniture obstructions with names. Sliding and top lids require no front allowance unless the user sets one. Opening-space interference is a derived advisory and does not reject placement or become stale persisted warning data. Doors also have a derived swing-envelope check against furniture/partitions.

## Catalog

Keep all 20 existing IDs and dimensions. Add bathroom fixtures (toilet, basin, shower, bathtub), kitchen fixtures (sink/counter/hob/dishwasher), entry storage (shoe cabinet/bench), more seating/storage/beds and appliances (dryer/freezer/oven). Use recognizable local vector thumbnails and distinct simple 3D forms for fixtures. No external image service or paid dependency.

## Acceptance and safeguards

Tests before code: invalid-placement rotation commit+Undo+warning; all four front directions and boundary-touch opening envelopes; partition collision and doorway void; opening fit/overlap/sill/height validation; old v2 and expanded JSON roundtrip, duplicate IDs, malformed extra fields; composite changes create one history step. Browser journey creates zone→partition→door/window→fixture, edits numeric dimensions, shows obstructed opening warning, resolves it, exports/imports JSON, switches2D/3D and Undo. Original pan/Shift/cancel/storage tests remain required. Actual Edge/Safari/screenreader/physical-input limits stay explicit; renderer measurements distinguish CPU submission from GPU completion and browser cadence.

## Deferred scope

S6 collaboration, login/server, AI, GLB and independent floors are not requested here. Interior partitions and named zones are included; independent room topology remains an open optional clarification, never silently counted as implemented.
