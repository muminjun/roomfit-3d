import { beforeEach, describe, expect, it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { createFurnitureCandidate, rotateFurniture } from "../../src/features/furniture/commands";
import { useProjectStore } from "../../src/store/useProjectStore";
import { projectSchema } from "../../src/types/schema";
import { parseProjectJson, serializeProjectJson } from "../../src/features/project/json";
import { validateAllPlacements } from "../../src/lib/geometry";
import { getOpeningSegment } from "../../src/features/architecture/geometry";

beforeEach(() => useProjectStore.getState().loadProject(createProject()));
describe("requested home planning extensions", () => {
  it("commits a rotation near a wall, retains the warning and undoes exactly once", () => {
    const project = createProject();
    const bed = createFurnitureCandidate("bed-queen", { x: 750, y: 1700 }, "rotation-bed")!;
    useProjectStore.getState().loadProject({ ...project, furniture: [bed] });
    expect(rotateFurniture({ itemId: bed.id, rotationDeg: 90 })).toMatchObject({ ok: true, kind: "Committed" });
    const state = useProjectStore.getState();
    expect(state.project.furniture[0].position).toEqual(bed.position);
    expect(state.project.furniture[0].rotationDeg).toBe(90);
    expect(validateAllPlacements(state.project.room, state.project.furniture)[bed.id].issues).toContainEqual(expect.objectContaining({ code: "OUTSIDE_ROOM" }));
    expect(state.past).toHaveLength(1);
    state.undo();
    expect(useProjectStore.getState().project.furniture).toEqual([bed]);
  });

  it("accepts additive v2 planning data and rejects duplicate architectural IDs", () => {
    const project = createProject();
    const room = { ...project.room,
      partitions: [{ id: "partition", name: "욕실 벽", start: { x: 2000, y: 0 }, end: { x: 2000, y: 2000 }, thicknessMm: 100, heightMm: 2400 }],
      openings: [{ id: "door", name: "욕실 문", kind: "door", hostId: "partition", offsetMm: 600, widthMm: 800, heightMm: 2100, sillMm: 0, hinge: "start", swing: "inward" }],
      zones: [{ id: "zone", name: "화장실", kind: "bathroom", x: 0, y: 0, widthMm: 1900, depthMm: 2000 }],
    };
    const parsed = projectSchema.safeParse({ ...project, room });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const backup = parseProjectJson(serializeProjectJson(parsed.data));
    expect(backup).toMatchObject({ ok: true, project: parsed.data });
    expect(projectSchema.safeParse({ ...project, room: { ...room, zones: [{ ...room.zones[0], id: "door" }] } }).success).toBe(false);
  });

  it("roundtrips old v2 data without adding empty fields", () => {
    const project = createProject();
    expect(parseProjectJson(serializeProjectJson(project))).toMatchObject({ ok: true, project });
    expect(JSON.parse(serializeProjectJson(project)).room).not.toHaveProperty("partitions");
  });

  it("preserves the physical opening span and hinge when normalizing a counterclockwise polygon", () => {
    const project = createProject();
    const input = { ...project, room: { ...project.room,
      polygon: [{id:"a",x:0,y:0},{id:"b",x:0,y:3000},{id:"c",x:4000,y:3000},{id:"d",x:4000,y:0}],
      openings:[{ id:"ccw-door", name:"왼쪽 출입문",kind:"door" as const,hostId:"a",offsetMm:1000,widthMm:800,heightMm:2000,sillMm:0,hinge:"start" as const,swing:"inward" as const }],
    }};
    const result = parseProjectJson(JSON.stringify(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const opening = result.project.room.openings![0];
    const s = getOpeningSegment(result.project.room,opening)!;
    expect([s.start,s.end]).toEqual(expect.arrayContaining([{x:0,y:1000},{x:0,y:1800}]));
    expect(opening.hinge === "start" ? s.start:s.end).toEqual({x:0,y:1000});
    expect(result.changes.join(" ")).toContain("문·창문");
  });
});
