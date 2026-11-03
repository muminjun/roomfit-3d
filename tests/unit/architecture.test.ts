import { beforeEach, describe, expect, it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { createFurnitureCandidate } from "../../src/features/furniture/commands";
import { savePartition, saveOpening, saveZone, deleteArchitecture } from "../../src/features/architecture/commands";
import { getOpeningSegment, getPartitionSolidRects, validateArchitecture } from "../../src/features/architecture/geometry";
import { validatePlacement } from "../../src/lib/geometry";
import { useProjectStore } from "../../src/store/useProjectStore";
import type { Partition, Opening } from "../../src/types/model";
const wall: Partition = { id: "partition-1", name: "욕실 벽", start: { x: 2000, y: 0 }, end: { x: 2000, y: 3300 }, thicknessMm: 100, heightMm: 2400 };
const door: Opening = { id: "door-1", name: "욕실 문", kind: "door", hostId: wall.id, offsetMm: 1100, widthMm: 800, heightMm: 2100, sillMm: 0, hinge: "start", swing: "inward" };
beforeEach(() => useProjectStore.getState().loadProject(createProject()));
describe("architectural planning", () => {
  it("creates partition/opening/zone atomically and supports Undo", () => {
    expect(savePartition(wall).ok).toBe(true);
    expect(saveOpening(door).ok).toBe(true);
    expect(saveZone({ id: "zone-1", name: "화장실", kind: "bathroom", x: 0, y: 0, widthMm: 1900, depthMm: 2000 }).ok).toBe(true);
    expect(useProjectStore.getState().past).toHaveLength(3);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.room.zones).toBeUndefined();
    expect(useProjectStore.getState().project.room.openings).toEqual([door]);
  });
  it("rejects overlapping or out-of-range openings without altering history or project", () => {
    savePartition(wall); saveOpening(door);
    const before = useProjectStore.getState();
    expect(saveOpening({ ...door, id: "other", offsetMm: 1400 }).ok).toBe(false);
    expect(saveOpening({ ...door, id: "other", offsetMm: 3000 }).ok).toBe(false);
    expect(saveOpening({ ...door, id: "other", heightMm: 2401 }).ok).toBe(false);
    expect(useProjectStore.getState().project).toBe(before.project);
    expect(useProjectStore.getState().past).toBe(before.past);
    expect(deleteArchitecture("partition", wall.id).ok).toBe(false);
    expect(deleteArchitecture("opening", door.id).ok).toBe(true);
    expect(deleteArchitecture("partition", wall.id).ok).toBe(true);
  });
  it("blocks furniture in solid partitions, allows doorway fit and exact boundary contact", () => {
    const room = { ...createProject().room, partitions: [wall], openings: [door] };
    const item = createFurnitureCandidate("nightstand", { x: 2000, y: 1500 }, "test-item")!;
    expect(validatePlacement(room, [], item).valid).toBe(true);
    expect(validatePlacement(room, [], { ...item, position: { x: 2000, y: 600 } }).issues).toContainEqual(expect.objectContaining({ code: "PARTITION_OVERLAP" }));
    expect(validatePlacement(room, [], { ...item, position: { x: 1725, y: 600 } }).valid).toBe(true);
    expect(validatePlacement(room, [], { ...item, heightMm: 2200 }).valid).toBe(false);
    expect(getPartitionSolidRects(room, wall, 500)).toHaveLength(2);
  });
  it("maps offset along reversed exterior edges and preserves orphaned openings as derived warnings", () => {
    const room = createProject().room;
    const opening = { ...door, hostId: room.polygon[2].id, offsetMm: 500 };
    expect(getOpeningSegment(room, opening)).toMatchObject({ start: { x: 3700, y: 3400 }, end: { x: 2900, y: 3400 } });
    expect(validateArchitecture({ ...room, openings: [{ ...opening, hostId: "missing" }] })).toContainEqual(expect.objectContaining({ itemId: door.id, code: "MISSING_HOST" }));
  });
  it("retains solid collision for openings invalidated by room height or host length edits", () => {
    const room={...createProject().room,wallHeightMm:1800,partitions:[wall],openings:[door]};
    const item=createFurnitureCandidate("nightstand",{x:2000,y:1500},"small-item")!;
    expect(validatePlacement(room,[],item).valid).toBe(false);
    const short={...wall,end:{x:2000,y:1600}};
    expect(getPartitionSolidRects({...room,wallHeightMm:2400,partitions:[short]},short,500)).toHaveLength(1);
  });
});
