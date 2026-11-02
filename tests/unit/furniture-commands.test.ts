import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { useProjectStore } from "../../src/store/useProjectStore";
import { getFurnitureRect, snapFurniture } from "../../src/lib/geometry";
import {
  addFurniture,
  moveFurniture,
  resizeFurniture,
  rotateFurniture,
  duplicateFurniture,
  deleteFurniture,
  renameFurniture,
  setFurnitureColor,
  resetFurnitureSize,
  createFurnitureCandidate,
  findValidPlacement,
  resizeFromCorner,
} from "../../src/features/furniture/commands";
import type { FurnitureItem } from "../../src/types/model";
const seq = () => {
  let i = 0;
  return () => `id-${++i}`;
};
const project = () => useProjectStore.getState().project;
const item = (id: string, position = { x: 1000, y: 1000 }): FurnitureItem => ({
  ...createFurnitureCandidate("nightstand", position, id)!,
});
const load = (items: FurnitureItem[] = []) =>
  useProjectStore.getState().loadProject({
    ...createProject(4200, 3400, 2400, 120, seq()),
    furniture: items,
  });
beforeEach(() => load());
afterEach(() => vi.useRealTimers());
describe("furniture commands", () => {
  it("adds a candidate and rejects overlap while allowing contact", () => {
    expect(
      addFurniture({ catalogId: "nightstand", position: { x: 500, y: 500 } }),
    ).toMatchObject({ ok: true, kind: "Committed" });
    expect(
      addFurniture({ catalogId: "nightstand", position: { x: 949, y: 500 } }),
    ).toMatchObject({
      ok: false,
      kind: "Invalid",
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "FURNITURE_OVERLAP" }),
      ]),
    });
    expect(
      addFurniture({ catalogId: "nightstand", position: { x: 950, y: 500 } })
        .ok,
    ).toBe(true);
  });
  it("rejects crossing a U notch despite corner inclusion", () => {
    const p = project();
    useProjectStore.setState({
      project: {
        ...p,
        room: {
          ...p.room,
          polygon: [
            [0, 0],
            [1200, 0],
            [1200, 1000],
            [2400, 1000],
            [2400, 0],
            [4200, 0],
            [4200, 3400],
            [0, 3400],
          ].map(([x, y], i) => ({ id: `u${i}`, x, y })),
        },
      },
    });
    expect(
      addFurniture({ catalogId: "sofa-2", position: { x: 1800, y: 1000 } }),
    ).toMatchObject({
      ok: false,
      kind: "Invalid",
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "OUTSIDE_ROOM" }),
      ]),
    });
  });
  it("snaps odd 1001 width footprint exactly to zero", () => {
    const x = snapFurniture(
      { ...item("a"), widthMm: 1001, position: { x: 502, y: 1000 } },
      100,
    );
    expect(getFurnitureRect(x).minX).toBe(0);
    expect(x.position.x).toBe(500.5);
  });
  it("rotates queen footprint and keeps local dimensions", () => {
    expect(
      addFurniture({ catalogId: "bed-queen", position: { x: 2100, y: 1700 } })
        .ok,
    ).toBe(true);
    const id = project().furniture[0].id;
    expect(rotateFurniture({ itemId: id, rotationDeg: 90 }).ok).toBe(true);
    expect(getFurnitureRect(project().furniture[0])).toEqual({
      minX: 1100,
      maxX: 3100,
      minY: 950,
      maxY: 2450,
    });
    expect(project().furniture[0].widthMm).toBe(1500);
  });
  it("resizes from opposite fixed corner for rotation and odd widths", () => {
    const x = {
      ...item("a"),
      widthMm: 1001,
      depthMm: 400,
      rotationDeg: 90 as const,
    };
    const before = getFurnitureRect(x);
    const next = resizeFromCorner(x, "se", {
      x: before.minX + 601.4,
      y: before.minY + 1700.4,
    });
    expect(getFurnitureRect(next).minX).toBe(before.minX);
    expect(getFurnitureRect(next).minY).toBe(before.minY);
    expect(next.widthMm).toBe(1700);
    expect(next.depthMm).toBe(601);
    expect((next.position.x * 2) % 1).toBe(0);
  });
  it("validates resize dimensions, height and recovers invalid placement", () => {
    const x = item("a", { x: 4100, y: 1000 });
    load([x]);
    const before = project();
    expect(
      resizeFurniture({
        itemId: "a",
        widthMm: 1700,
        depthMm: 400,
        heightMm: 2401,
      }),
    ).toMatchObject({ ok: false, kind: "Invalid" });
    expect(project()).toBe(before);
    expect(
      moveFurniture({ itemId: "a", position: { x: 1000, y: 1000 } }).ok,
    ).toBe(true);
    expect(
      resizeFurniture({
        itemId: "a",
        widthMm: 1700,
        depthMm: 400,
        heightMm: 500,
      }).ok,
    ).toBe(true);
  });
  it("resets size using catalog and rejects unknown catalog", () => {
    const x = { ...item("a"), widthMm: 800, name: "사용자" };
    load([x]);
    expect(resetFurnitureSize({ itemId: "a" }).ok).toBe(true);
    expect(project().furniture[0]).toMatchObject({
      widthMm: 450,
      name: "사용자",
    });
    load([{ ...x, catalogId: "unknown", kind: "other" }]);
    expect(resetFurnitureSize({ itemId: "a" })).toMatchObject({
      ok: false,
      kind: "Invalid",
    });
  });
  it("allows name, palette and deletion even for invalid placement", () => {
    load([item("a", { x: 5000, y: 1000 })]);
    expect(renameFurniture({ itemId: "a", name: "  가구\u0000  " }).ok).toBe(
      true,
    );
    expect(project().furniture[0].name).toBe("가구");
    expect(renameFurniture({ itemId: "a", name: "가\u0085구" }).ok).toBe(true);
    expect(project().furniture[0].name).toBe("가구");
    expect(setFurnitureColor({ itemId: "a", color: "#E57373" }).ok).toBe(true);
    expect(setFurnitureColor({ itemId: "a", color: "#123456" }).ok).toBe(false);
    expect(renameFurniture({ itemId: "a", name: " ".repeat(2) }).ok).toBe(
      false,
    );
    expect(deleteFurniture({ itemId: "a" }).ok).toBe(true);
    expect(project().furniture).toHaveLength(0);
  });
  it("duplicates nearby without moving or overlapping source", () => {
    const x = item("a");
    load([x]);
    expect(duplicateFurniture({ itemId: "a" })).toMatchObject({
      ok: true,
      kind: "Committed",
    });
    expect(project().furniture).toHaveLength(2);
    expect(project().furniture[0]).toEqual(x);
    expect(project().furniture[1].position).not.toEqual(x.position);
  });
  it("reports no placement after bounded search and rejects 101st item", () => {
    const giant = { ...item("a"), widthMm: 10000, depthMm: 10000 };
    expect(findValidPlacement(project().room, [], giant)).toBeNull();
    const items = Array.from({ length: 100 }, (_, i) => item(`f${i}`));
    load(items);
    expect(addFurniture({ catalogId: "nightstand" })).toMatchObject({
      ok: false,
      kind: "Invalid",
      issues: [expect.objectContaining({ code: "MAX_FURNITURE" })],
    });
    expect(project().furniture).toHaveLength(100);
  });
  it("quantizes automatic search origin and rejects nonfinite coordinates", () => {
    const candidate = item("candidate");
    expect(
      findValidPlacement(project().room, [], candidate, {
        x: 2100.123,
        y: 1700.377,
      }),
    ).toEqual({ x: 2100, y: 1700.5 });
    expect(
      findValidPlacement(project().room, [], candidate, {
        x: Infinity,
        y: 1700,
      }),
    ).toBeNull();
    expect(
      addFurniture({
        catalogId: "nightstand",
        position: { x: 2100.123, y: 1700 },
      }),
    ).toMatchObject({ ok: false, kind: "Invalid" });
  });
  it("stops search after the nearest 1000 lattice candidates", () => {
    const tiny = createProject(500, 500, 2400, 120, seq()).room;
    const candidate = item("candidate", { x: 2250, y: 250 });
    expect(findValidPlacement(tiny, [], candidate, { x: 250, y: 250 })).toEqual(
      { x: 250, y: 250 },
    );
    expect(
      findValidPlacement(tiny, [], candidate, { x: 2250, y: 250 }),
    ).toBeNull();
  });
  it("coalesces repeated moves only with same key", () => {
    vi.useFakeTimers();
    load([item("a")]);
    expect(
      moveFurniture({ itemId: "a", position: { x: 1100, y: 1000 } }, "a-move")
        .ok,
    ).toBe(true);
    vi.advanceTimersByTime(200);
    expect(
      moveFurniture({ itemId: "a", position: { x: 1200, y: 1000 } }, "a-move")
        .ok,
    ).toBe(true);
    expect(useProjectStore.getState().past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(project().furniture[0].position.x).toBe(1000);
  });
});
