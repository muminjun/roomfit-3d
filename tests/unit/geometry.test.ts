import { describe, it, expect } from "vitest";
import {
  getRoomArea,
  getBBox,
  getEdgeNormals,
  normalizeEditCandidate,
  validateRoomPolygon,
  moveWall,
  addNotch,
  resizeRectangle,
  getFurnitureRect,
  containsRectInRoom,
  intersectRects,
  validatePlacement,
  validateAllPlacements,
  getNearestClearance,
  snapFurniture,
  worldToScreen,
  screenToWorld,
  zoomAtPointer,
} from "../../src/lib/geometry";
import type { PointMm, Room, FurnitureItem } from "../../src/types/model";
const poly = (a: number[][]): PointMm[] =>
  a.map(([x, y], i) => ({ id: `v${i}`, x, y }));
const R = poly([
    [0, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ]),
  L = poly([
    [0, 0],
    [4200, 0],
    [4200, 3400],
    [1600, 3400],
    [1600, 2200],
    [0, 2200],
  ]),
  U = poly([
    [0, 0],
    [1200, 0],
    [1200, 1000],
    [2400, 1000],
    [2400, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ]),
  P = poly([
    [0, 0],
    [4200, 0],
    [4200, 3400],
    [1000, 3400],
    [1000, 4000],
    [0, 4000],
  ]);
const room: Room = {
  id: "room",
  name: "room",
  polygon: R,
  wallHeightMm: 2400,
  wallThicknessMm: 120,
};
const bed: FurnitureItem = {
  id: "bed",
  catalogId: "bed",
  kind: "bed",
  name: "bed",
  position: { x: 1050, y: 1250 },
  widthMm: 1500,
  depthMm: 2000,
  heightMm: 500,
  rotationDeg: 0,
};
const desk: FurnitureItem = {
  ...bed,
  id: "desk",
  position: { x: 2950, y: 2800 },
  widthMm: 1200,
  depthMm: 600,
};
const seq = () => {
  let i = 0;
  return () => `seq-${++i}`;
};
const notch = (
  type: "indent" | "protrude" = "indent",
  startOffsetMm = 1700,
  widthMm = 800,
  depthMm = 500,
) =>
  addNotch(
    R,
    { startVertexId: "v0", startOffsetMm, widthMm, depthMm, type },
    seq(),
  );
const coords = (p: PointMm[]) => p.map(({ x, y }) => [x, y]);
const rect = (minX: number, minY: number, maxX: number, maxY: number) => ({
  minX,
  minY,
  maxX,
  maxY,
});
describe("fixed geometry catalog", () => {
  it("UT-GEO-01 preset area", () =>
    expect([R, L, U, P].map(getRoomArea)).toEqual([
      14280000, 12360000, 13080000, 14880000,
    ]));
  it("UT-GEO-02 indent", () => {
    const x = notch();
    expect(x.ok).toBe(true);
    if (x.ok) {
      expect(coords(x.polygon)).toEqual([
        [0, 0],
        [1700, 0],
        [1700, 500],
        [2500, 500],
        [2500, 0],
        [4200, 0],
        [4200, 3400],
        [0, 3400],
      ]);
      expect(getRoomArea(x.polygon)).toBe(13880000);
    }
  });
  it("UT-GEO-03 protrude", () => {
    const x = notch("protrude", 1600, 1000, 600);
    expect(x.ok).toBe(true);
    if (x.ok) {
      expect(coords(x.polygon)).toEqual([
        [0, 0],
        [1600, 0],
        [1600, -600],
        [2600, -600],
        [2600, 0],
        [4200, 0],
        [4200, 3400],
        [0, 3400],
      ]);
      expect(getRoomArea(x.polygon)).toBe(14880000);
    }
  });
  it("UT-GEO-04 top wall", () => {
    const x = moveWall(R, "v0", 200);
    expect(x.ok).toBe(true);
    if (x.ok) {
      expect(coords(x.polygon)).toEqual([
        [0, -200],
        [4200, -200],
        [4200, 3400],
        [0, 3400],
      ]);
      expect(getRoomArea(x.polygon)).toBe(15120000);
      expect(getBBox(x.polygon)).toMatchObject({ width: 4200, depth: 3600 });
    }
  });
  it("UT-GEO-05 right wall", () => {
    const x = moveWall(R, "v1", 150);
    expect(x.ok).toBe(true);
    if (x.ok) expect(getRoomArea(x.polygon)).toBe(14790000);
  });
  it("UT-GEO-06 collapse notch and map selection", () => {
    const n = notch();
    if (!n.ok) throw Error("notch");
    const x = moveWall(n.polygon, n.polygon[2].id, 500);
    expect(x.ok).toBe(true);
    if (x.ok) {
      expect(coords(x.polygon)).toEqual(coords(R));
      expect(x.selectedEdgeId).toBe("v0");
    }
  });
  it("UT-GEO-07 rejects 50mm edges atomically", () => {
    const n = notch();
    if (!n.ok) throw Error("notch");
    const before = JSON.stringify(n.polygon);
    expect(moveWall(n.polygon, n.polygon[2].id, 450)).toMatchObject({
      ok: false,
      code: "SEGMENT_TOO_SHORT",
    });
    expect(JSON.stringify(n.polygon)).toBe(before);
  });
  it("UT-GEO-08 rejects invalid margins and touching wall", () => {
    expect(notch("indent", 50)).toMatchObject({
      ok: false,
      code: "INVALID_PARAMS",
    });
    expect(notch("indent", 100, 4050)).toMatchObject({
      ok: false,
      code: "INVALID_PARAMS",
    });
    expect(notch("indent", 1700, 800, 3400)).toMatchObject({
      ok: false,
      code: "SELF_TOUCH",
    });
  });
  it("UT-GEO-09 rejects invalid polygons and normalizes duplicate points", () => {
    expect(
      validateRoomPolygon(
        poly([
          [0, 0],
          [4200, 1],
          [4200, 3400],
          [0, 3400],
        ]),
      ),
    ).toMatchObject({ ok: false, code: "NOT_ORTHOGONAL" });
    expect(validateRoomPolygon([...R, R[0]])).toMatchObject({
      ok: false,
      code: "DUPLICATE_CLOSING_POINT",
    });
    expect(validateRoomPolygon([])).toMatchObject({
      ok: false,
      code: "TOO_FEW_POINTS",
    });
    const d = [R[0], { ...R[0], id: "new" }, ...R.slice(1)];
    const n = normalizeEditCandidate(d, R, "new");
    expect(n.ok && validateRoomPolygon(n.polygon).ok).toBe(true);
    expect(
      validateRoomPolygon(
        poly([
          [0, 0],
          [4200, 0],
          [4200, 3400],
          [2100, 3400],
          [2100, -500],
          [1000, -500],
          [1000, 2400],
          [0, 2400],
        ]),
      ),
    ).toMatchObject({ ok: false, code: "SELF_INTERSECTION" });
    expect(
      validateRoomPolygon(
        poly([
          [0, 0],
          [4200, 0],
          [4200, 3400],
          [2500, 3400],
          [2500, 0],
          [1500, 0],
          [1500, 2500],
          [0, 2500],
        ]),
      ),
    ).toMatchObject({ ok: false, code: "SELF_TOUCH" });
    expect(
      validateRoomPolygon(
        poly([
          [0, 0],
          [99, 0],
          [99, 3400],
          [0, 3400],
        ]),
      ),
    ).toMatchObject({ ok: false, code: "SEGMENT_TOO_SHORT" });
    expect(
      validateRoomPolygon([R[0], { ...R[1], id: "v0" }, ...R.slice(2)]),
    ).toMatchObject({ ok: false, code: "DUPLICATE_ID" });
  });
  it("UT-GEO-10 normals", () => {
    expect(getEdgeNormals(R[0], R[1])).toEqual({
      nIn: { x: 0, y: 1 },
      nOut: { x: 0, y: -1 },
    });
    expect(getEdgeNormals(R[1], R[2])).toEqual({
      nIn: { x: -1, y: 0 },
      nOut: { x: 1, y: 0 },
    });
  });
  it("UT-GEO-11 rotated footprints", () => {
    const item = { ...bed, position: { x: 2100, y: 1700 } };
    expect(getFurnitureRect(item)).toEqual(rect(1350, 700, 2850, 2700));
    expect(getFurnitureRect({ ...item, rotationDeg: 90 })).toEqual(
      rect(1100, 950, 3100, 2450),
    );
  });
  it("UT-GEO-12 clearance", () =>
    expect(getNearestClearance(room, [], bed)).toEqual({
      left: 300,
      up: 250,
      right: 2400,
      down: 1150,
    }));
  it("rectangle resize anchors minimum", () => {
    const x = resizeRectangle(
      poly([
        [0, -200],
        [4200, -200],
        [4200, 3400],
        [0, 3400],
      ]),
      5000,
      4000,
    );
    expect(x.ok && getBBox(x.polygon)).toMatchObject({
      minX: 0,
      minY: -200,
      maxX: 5000,
      maxY: 3800,
    });
  });
});
it("rejects collinear backtracking instead of erasing overlap", () => {
  const candidate = poly([
    [0, 0],
    [2000, 0],
    [1000, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ]);
  expect(normalizeEditCandidate(candidate, R, null)).toMatchObject({
    ok: false,
    code: "SELF_TOUCH",
  });
});

it("generates deterministic notch IDs with an injected sequence", () => {
  const first = notch();
  const second = notch();
  expect(first).toEqual(second);
  if (!first.ok) throw Error("notch failed");
  expect(first.polygon.slice(1, 5).map((point) => point.id)).toEqual([
    "seq-1",
    "seq-2",
    "seq-3",
    "seq-4",
  ]);
});
describe("fixed placement catalog", () => {
  it("UT-PLC-01 U notch crossing", () =>
    expect(containsRectInRoom(U, rect(800, 0, 2800, 600))).toBe(false));
  it("UT-PLC-02 L cutout crossing", () =>
    expect(containsRectInRoom(L, rect(1000, 1800, 2000, 2600))).toBe(false));
  it("UT-PLC-03 contained", () =>
    expect(containsRectInRoom(U, rect(100, 100, 1100, 900))).toBe(true));
  it("UT-PLC-04 touching vs overlap", () => {
    expect(
      intersectRects(rect(0, 0, 1000, 1000), rect(1000, 0, 2000, 1000)),
    ).toBe(false);
    expect(
      intersectRects(rect(0, 0, 1000, 1000), rect(999, 0, 1999, 1000)),
    ).toBe(true);
  });
  it("UT-PLC-05 half millimeter center", () => {
    const item = { ...bed, widthMm: 1001, position: { x: 500.5, y: 1000 } };
    expect(validatePlacement(room, [], item).valid).toBe(true);
    expect(
      validatePlacement(room, [], { ...item, position: { x: 500, y: 1000 } })
        .issues[0].code,
    ).toBe("OUTSIDE_ROOM");
  });
  it("UT-PLC-06 height", () =>
    expect(
      validatePlacement(room, [], { ...bed, heightMm: 2401 }).issues[0].code,
    ).toBe("TOO_TALL"));
  it("UT-PLC-07 example", () => {
    expect(validatePlacement(room, [desk], bed).valid).toBe(true);
    expect(validatePlacement(room, [bed], desk).valid).toBe(true);
  });
  it("UT-PLC-08 room edit leaves furniture and warns", () => {
    const x = moveWall(R, "v1", -1200);
    if (!x.ok) throw Error("move");
    const items = [bed, desk];
    const all = validateAllPlacements({ ...room, polygon: x.polygon }, items);
    expect(all.bed.valid).toBe(true);
    expect(all.desk.issues[0].code).toBe("OUTSIDE_ROOM");
    expect(items).toHaveLength(2);
  });
  it("snaps footprint edge for odd widths", () =>
    expect(
      snapFurniture(
        { ...bed, widthMm: 1001, position: { x: 610, y: 1000 } },
        100,
      ).position.x,
    ).toBe(600.5));
});
describe("viewport", () => {
  it("UT-VIEW-01 conversions", () => {
    const v = { zoom: 0.5, panX: 100, panY: 50 };
    expect(worldToScreen({ x: 1000, y: 2000 }, v)).toEqual({ x: 600, y: 1050 });
    expect(screenToWorld({ x: 600, y: 1050 }, v)).toEqual({ x: 1000, y: 2000 });
    expect(screenToWorld({ x: 480, y: 320 }, v)).toEqual({ x: 760, y: 540 });
  });
  it("UT-VIEW-02 pointer anchored repeated zoom", () => {
    let v = { zoom: 0.5, panX: 100, panY: 50 };
    const pointer = { x: 480, y: 320 },
      before = screenToWorld(pointer, v);
    for (let i = 0; i < 100; i++) v = zoomAtPointer(v, pointer, v.zoom * 1.01);
    for (let i = 0; i < 100; i++) v = zoomAtPointer(v, pointer, v.zoom / 1.01);
    expect(screenToWorld(pointer, v).x).toBeCloseTo(before.x, 6);
    expect(screenToWorld(pointer, v).y).toBeCloseTo(before.y, 6);
  });
});
