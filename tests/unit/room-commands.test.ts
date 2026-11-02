import { beforeEach, describe, expect, it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { useProjectStore } from "../../src/store/useProjectStore";
import {
  getBBox,
  getRoomArea,
  validateAllPlacements,
} from "../../src/lib/geometry";
import {
  moveWallSegment,
  addRoomNotch,
  setRectangleDimensions,
  updateRoomHeight,
  updateWallThickness,
  renameProject,
} from "../../src/features/room/commands";
import type { FurnitureItem } from "../../src/types/model";
const sequence = () => {
  let i = 0;
  return () => `id-${++i}`;
};
const reset = () => {
  useProjectStore.setState({
    project: createProject(4200, 3400, 2400, 120, sequence()),
    past: [],
    future: [],
  });
};
const project = () => useProjectStore.getState().project;
const area = () => getRoomArea(project().room.polygon);
const start = (i = 0) => project().room.polygon[i].id;
beforeEach(reset);
describe("room commands", () => {
  it("moves walls outward in one history commit", () => {
    expect(
      moveWallSegment({ startVertexId: start(), offsetMm: 200 }),
    ).toMatchObject({ ok: true, kind: "Committed" });
    expect(area()).toBe(15120000);
    expect(useProjectStore.getState().past).toHaveLength(1);
    reset();
    expect(moveWallSegment({ startVertexId: start(1), offsetMm: 150 }).ok).toBe(
      true,
    );
    expect(area()).toBe(14790000);
  });
  it("adds indent and both protrusion sizes", () => {
    expect(
      addRoomNotch({
        startVertexId: start(),
        startOffsetMm: 1700,
        widthMm: 800,
        depthMm: 500,
        type: "indent",
      }).ok,
    ).toBe(true);
    expect(area()).toBe(13880000);
    reset();
    expect(
      addRoomNotch({
        startVertexId: start(),
        startOffsetMm: 1700,
        widthMm: 800,
        depthMm: 500,
        type: "protrude",
      }).ok,
    ).toBe(true);
    expect(area()).toBe(14680000);
    reset();
    expect(
      addRoomNotch({
        startVertexId: start(),
        startOffsetMm: 1600,
        widthMm: 1000,
        depthMm: 600,
        type: "protrude",
      }).ok,
    ).toBe(true);
    expect(area()).toBe(14880000);
  });
  it("collapses notch and returns merged selection", () => {
    const original = start();
    addRoomNotch({
      startVertexId: original,
      startOffsetMm: 1700,
      widthMm: 800,
      depthMm: 500,
      type: "indent",
    });
    const result = moveWallSegment({ startVertexId: start(2), offsetMm: 500 });
    expect(result).toMatchObject({
      ok: true,
      kind: "Committed",
      selectedEdgeId: original,
    });
    expect(area()).toBe(14280000);
    expect(project().room.polygon).toHaveLength(4);
  });
  it("resizes rectangle anchored at current min", () => {
    moveWallSegment({ startVertexId: start(), offsetMm: 200 });
    expect(setRectangleDimensions({ widthMm: 5000, depthMm: 4000 }).ok).toBe(
      true,
    );
    expect(getBBox(project().room.polygon)).toMatchObject({
      minX: 0,
      minY: -200,
      maxX: 5000,
      maxY: 3800,
    });
  });
  it("rejects invalid edits without changing project or history", () => {
    const before = project(),
      past = useProjectStore.getState().past;
    expect(
      addRoomNotch({
        startVertexId: start(),
        startOffsetMm: 50,
        widthMm: 800,
        depthMm: 500,
        type: "indent",
      }),
    ).toMatchObject({ ok: false, kind: "Invalid" });
    expect(project()).toBe(before);
    expect(useProjectStore.getState().past).toBe(past);
    expect(updateRoomHeight({ wallHeightMm: NaN })).toMatchObject({
      ok: false,
      kind: "Invalid",
    });
    expect(
      setRectangleDimensions({ widthMm: Infinity, depthMm: 1000 }).ok,
    ).toBe(false);
    expect(project()).toBe(before);
  });
  it("retains furniture when the room height makes it too tall", () => {
    const item: FurnitureItem = {
      id: "f",
      catalogId: "f",
      kind: "other",
      name: "f",
      position: { x: 1000, y: 1000 },
      widthMm: 500,
      depthMm: 500,
      heightMm: 2300,
      rotationDeg: 0,
    };
    useProjectStore.setState({ project: { ...project(), furniture: [item] } });
    const furniture = project().furniture;
    expect(updateRoomHeight({ wallHeightMm: 2000 })).toMatchObject({
      ok: true,
      kind: "Committed",
    });
    expect(project().furniture).toBe(furniture);
    expect(
      validateAllPlacements(project().room, furniture).f.issues,
    ).toContainEqual(expect.objectContaining({ code: "TOO_TALL" }));
  });
  it("recognizes no changes and validates title and wall thickness", () => {
    const before = project(),
      past = useProjectStore.getState().past;
    expect(moveWallSegment({ startVertexId: start(), offsetMm: 0 })).toEqual({
      ok: true,
      kind: "NoChange",
    });
    expect(updateWallThickness({ wallThicknessMm: 120 })).toEqual({
      ok: true,
      kind: "NoChange",
    });
    expect(renameProject({ title: "  " }).ok).toBe(false);
    expect(project()).toBe(before);
    expect(useProjectStore.getState().past).toBe(past);
    expect(renameProject({ title: "  내 방  " })).toMatchObject({
      ok: true,
      kind: "Committed",
    });
    expect(project().title).toBe("내 방");
    expect(renameProject({ title: "방\u0085이름" }).ok).toBe(true);
    expect(project().title).toBe("방이름");
    expect(updateWallThickness({ wallThicknessMm: 501 }).ok).toBe(false);
  });
});
