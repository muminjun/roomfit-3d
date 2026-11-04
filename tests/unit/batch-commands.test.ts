import { beforeEach, describe, expect, it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import {
  createFurnitureCandidate,
  deleteFurniture,
  duplicateFurniture,
  moveFurniture,
  resizeFurniture,
  rotateFurniture,
} from "../../src/features/furniture/commands";
import {
  moveFurnitureBatch,
  setFurnitureLocked,
} from "../../src/features/furniture/batchCommands";
import { useProjectStore } from "../../src/store/useProjectStore";
const item = (id: string, x: number) =>
  createFurnitureCandidate("nightstand", { x, y: 1000 }, id)!;
beforeEach(() =>
  useProjectStore.getState().loadProject({
    ...createProject(),
    furniture: [item("a", 800), item("b", 1250)],
  }),
);
describe("atomic furniture editing", () => {
  it("moves both items through their previous positions with one undo", () => {
    expect(
      moveFurnitureBatch([
        { id: "a", position: { x: 1250, y: 1000 } },
        { id: "b", position: { x: 1700, y: 1000 } },
      ]).ok,
    ).toBe(true);
    expect(useProjectStore.getState().past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(
      useProjectStore.getState().project.furniture.map((i) => i.position.x),
    ).toEqual([800, 1250]);
  });
  it("rejects a partial invalid group without history", () => {
    expect(
      moveFurnitureBatch([
        { id: "a", position: { x: 1250, y: 1000 } },
        { id: "b", position: { x: 1250, y: 1000 } },
      ]).ok,
    ).toBe(false);
    expect(useProjectStore.getState().past).toHaveLength(0);
  });
  it("blocks locked geometry and allows an unlocked duplicate", () => {
    setFurnitureLocked(["a"], true);
    expect(
      moveFurniture({ itemId: "a", position: { x: 1600, y: 1000 } }).ok,
    ).toBe(false);
    expect(
      resizeFurniture({
        itemId: "a",
        widthMm: 500,
        depthMm: 400,
        heightMm: 500,
      }).ok,
    ).toBe(false);
    expect(rotateFurniture({ itemId: "a", rotationDeg: 90 }).ok).toBe(false);
    expect(deleteFurniture({ itemId: "a" }).ok).toBe(false);
    const result = duplicateFurniture({ itemId: "a" });
    expect(result.ok).toBe(true);
    expect(
      useProjectStore.getState().project.furniture.at(-1)?.locked,
    ).toBeFalsy();
  });
});

it("batch duplication preserves offsets and unlocks copies", async () => {
  const { duplicateFurnitureBatch } =
    await import("../../src/features/furniture/batchCommands");
  setFurnitureLocked(["a"], true);
  const result = duplicateFurnitureBatch(["a", "b"]);
  expect(result.ok).toBe(true);
  const items = useProjectStore.getState().project.furniture;
  expect(items).toHaveLength(4);
  expect(items[3].position.x - items[2].position.x).toBe(450);
  expect(items.slice(2).every((i) => !i.locked)).toBe(true);
});
it("rejects an overlapping alignment without a partial commit", async () => {
  const { arrangeFurniture } =
    await import("../../src/features/furniture/batchCommands");
  const before = structuredClone(useProjectStore.getState().project);
  expect(arrangeFurniture(["a", "b"], "left").ok).toBe(false);
  expect(useProjectStore.getState().project).toEqual(before);
  expect(useProjectStore.getState().past).toHaveLength(0);
});
it("distributes three objects in one undo step", async () => {
  const { arrangeFurniture } =
    await import("../../src/features/furniture/batchCommands");
  useProjectStore.getState().loadProject({
    ...createProject(),
    furniture: [item("a", 800), item("b", 1400), item("c", 2300)],
  });
  expect(arrangeFurniture(["a", "b", "c"], "distributeX").ok).toBe(true);
  expect(
    useProjectStore.getState().project.furniture.map((i) => i.position.x),
  ).toEqual([800, 1550, 2300]);
  expect(useProjectStore.getState().past).toHaveLength(1);
  useProjectStore.getState().undo();
  expect(
    useProjectStore.getState().project.furniture.map((i) => i.position.x),
  ).toEqual([800, 1400, 2300]);
});

describe("batch layout and protected existing items", () => {
  it.each([
    ["left", "minX"],
    ["right", "maxX"],
    ["centerX", "centerX"],
    ["top", "minY"],
    ["bottom", "maxY"],
    ["centerY", "centerY"],
  ] as const)("aligns %s using rotated footprints", async (mode, edge) => {
    const { arrangeFurniture } =
      await import("../../src/features/furniture/batchCommands");
    const { getFurnitureRect } = await import("../../src/lib/geometry");
    const a = {
      ...item("a", 900),
      position: { x: 900, y: 700 },
      widthMm: 451,
      rotationDeg: 90 as const,
    };
    const b = {
      ...item("b", 2200),
      position: { x: 2200, y: 2200 },
      depthMm: 501,
    };
    useProjectStore
      .getState()
      .loadProject({ ...createProject(), furniture: [a, b] });
    expect(arrangeFurniture(["a", "b"], mode).ok).toBe(true);
    const [ra, rb] = useProjectStore
      .getState()
      .project.furniture.map(getFurnitureRect);
    const value = (r: typeof ra) =>
      edge === "centerX"
        ? (r.minX + r.maxX) / 2
        : edge === "centerY"
          ? (r.minY + r.maxY) / 2
          : r[edge];
    expect(value(ra)).toBe(value(rb));
    expect(useProjectStore.getState().past).toHaveLength(1);
  });
  it("distributes vertical footprint gaps equally", async () => {
    const { arrangeFurniture } =
      await import("../../src/features/furniture/batchCommands");
    const { getFurnitureRect } = await import("../../src/lib/geometry");
    const list = [700, 1400, 2600].map((y, i) => ({
      ...item(String(i), 1000),
      position: { x: 1000, y },
      depthMm: 400 + i * 100,
    }));
    useProjectStore
      .getState()
      .loadProject({ ...createProject(), furniture: list });
    expect(
      arrangeFurniture(
        list.map((i) => i.id),
        "distributeY",
      ).ok,
    ).toBe(true);
    const [a, b, c] = useProjectStore
      .getState()
      .project.furniture.map(getFurnitureRect);
    expect(b.minY - a.maxY).toBeCloseTo(c.minY - b.maxY, 0);
    expect(useProjectStore.getState().past).toHaveLength(1);
  });
  it("allows valid batch moves alongside an unchanged locked invalid item", () => {
    const original = { ...item("locked", -100), locked: true };
    useProjectStore
      .getState()
      .loadProject({
        ...createProject(),
        furniture: [original, item("a", 1000), item("b", 1450)],
      });
    expect(
      moveFurnitureBatch([
        { id: "a", position: { x: 1100, y: 1000 } },
        { id: "b", position: { x: 1550, y: 1000 } },
      ]).ok,
    ).toBe(true);
    expect(useProjectStore.getState().project.furniture[0]).toEqual(original);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.furniture[0]).toEqual(original);
  });
  it("rejects a group containing locked furniture without a partial update", () => {
    setFurnitureLocked(["a"], true);
    const before = structuredClone(useProjectStore.getState().project);
    const history = useProjectStore.getState().past.length;
    expect(
      moveFurnitureBatch([
        { id: "a", position: { x: 900, y: 1000 } },
        { id: "b", position: { x: 1350, y: 1000 } },
      ]).ok,
    ).toBe(false);
    expect(useProjectStore.getState().project).toEqual(before);
    expect(useProjectStore.getState().past).toHaveLength(history);
  });
});
