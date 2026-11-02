import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { useProjectStore } from "../../src/store/useProjectStore";
import type { FurnitureItem, ProjectDataV2 } from "../../src/types/model";
const sequence = () => {
  let i = 0;
  return () => `id-${++i}`;
};
const current = () => useProjectStore.getState().project;
const commit = (p: ProjectDataV2, key?: string) =>
  useProjectStore.getState().commit(p, undefined, key);
const title = (value: string, key?: string) =>
  commit({ ...current(), title: value }, key);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  useProjectStore
    .getState()
    .loadProject(createProject(4200, 3400, 2400, 120, sequence()));
});
afterEach(() => vi.useRealTimers());
describe("project history", () => {
  it("keeps only 50 snapshots after 60 title commits", () => {
    for (let i = 0; i < 60; i++) expect(title(`title ${i}`)).toBe(true);
    expect(useProjectStore.getState().past).toHaveLength(50);
    for (let i = 0; i < 50; i++) useProjectStore.getState().undo();
    expect(current().title).toBe("title 9");
  });
  it("undoes and redoes title, room and furniture without cloning references", () => {
    const original = current(),
      room = { ...original.room, wallHeightMm: 2500 },
      item: FurnitureItem = {
        id: "f",
        catalogId: "f",
        kind: "other",
        name: "f",
        position: { x: 500, y: 500 },
        widthMm: 500,
        depthMm: 500,
        heightMm: 500,
        rotationDeg: 0,
      },
      furniture = [item];
    expect(commit({ ...original, title: "changed", room, furniture })).toBe(
      true,
    );
    expect(useProjectStore.getState().past[0].room).toBe(original.room);
    expect(useProjectStore.getState().past[0].furniture).toBe(
      original.furniture,
    );
    useProjectStore.getState().undo();
    expect(current().title).toBe(original.title);
    expect(current().room).toBe(original.room);
    expect(current().furniture).toBe(original.furniture);
    useProjectStore.getState().redo();
    expect(current().title).toBe("changed");
    expect(current().room).toBe(room);
    expect(current().furniture).toBe(furniture);
  });
  it("settings are excluded from history and remain across undo and redo", () => {
    title("changed");
    useProjectStore
      .getState()
      .setSettings({ gridSizeMm: 10, snapEnabled: false });
    expect(useProjectStore.getState().past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(current().settings).toMatchObject({
      gridSizeMm: 10,
      snapEnabled: false,
    });
    useProjectStore.getState().redo();
    expect(current().settings).toMatchObject({
      gridSizeMm: 10,
      snapEnabled: false,
    });
  });
  it("preserves id and createdAt when candidate tries to change metadata", () => {
    const before = current();
    expect(
      commit({
        ...before,
        id: "other-id",
        createdAt: "2020-01-01T00:00:00.000Z",
        title: "changed",
      }),
    ).toBe(true);
    expect(current().id).toBe(before.id);
    expect(current().createdAt).toBe(before.createdAt);
  });
  it("rejects duplicate IDs introduced by preserving current metadata", () => {
    const before = current();
    const polygon = before.room.polygon.map((point, i) =>
      i === 0 ? { ...point, id: before.id } : point,
    );
    const candidate = {
      ...before,
      id: "different-id",
      title: "changed",
      room: { ...before.room, polygon },
    };
    const past = useProjectStore.getState().past;
    expect(commit(candidate)).toBe(false);
    expect(current()).toBe(before);
    expect(useProjectStore.getState().past).toBe(past);
  });
  it("updates updatedAt on undo and redo", () => {
    title("changed");
    vi.advanceTimersByTime(1000);
    useProjectStore.getState().undo();
    expect(current().updatedAt).toBe("2026-01-01T00:00:01.000Z");
    vi.advanceTimersByTime(1000);
    useProjectStore.getState().redo();
    expect(current().updatedAt).toBe("2026-01-01T00:00:02.000Z");
  });
  it("no-op domain and settings-only commits retain object, history and timestamp", () => {
    const before = current(),
      past = useProjectStore.getState().past;
    vi.advanceTimersByTime(1000);
    expect(
      commit({
        ...before,
        settings: { ...before.settings, snapEnabled: false },
      }),
    ).toBe(false);
    expect(commit({ ...before })).toBe(false);
    expect(current()).toBe(before);
    expect(useProjectStore.getState().past).toBe(past);
  });
  it("new edit after undo clears redo", () => {
    title("a");
    title("b");
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().future).toHaveLength(1);
    title("c");
    expect(useProjectStore.getState().future).toHaveLength(0);
    useProjectStore.getState().redo();
    expect(current().title).toBe("c");
  });
  it("coalesces same key at most 500ms from previous commit into initial snapshot", () => {
    const original = current().title;
    title("a", "keys");
    vi.advanceTimersByTime(500);
    title("b", "keys");
    expect(useProjectStore.getState().past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(current().title).toBe(original);
    useProjectStore.getState().redo();
    expect(current().title).toBe("b");
  });
  it("separates expired keys, different keys, ordinary commits and undo", () => {
    title("a", "x");
    vi.advanceTimersByTime(501);
    title("b", "x");
    title("c", "y");
    title("d");
    title("e", "y");
    expect(useProjectStore.getState().past).toHaveLength(5);
    useProjectStore.getState().undo();
    title("f", "y");
    expect(useProjectStore.getState().past).toHaveLength(5);
    useProjectStore.getState().undo();
    expect(current().title).toBe("d");
  });
  it("load validates strict data, preserves imported metadata and resets coalescing", () => {
    title("a", "x");
    const imported = {
      ...createProject(4200, 3400, 2400, 120, sequence()),
      title: "imported",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2021-01-01T00:00:00.000Z",
    };
    expect(
      useProjectStore
        .getState()
        .loadProject({ ...imported, extra: true } as ProjectDataV2),
    ).toBe(false);
    expect(current().title).toBe("a");
    expect(useProjectStore.getState().loadProject(imported)).toBe(true);
    expect(current().createdAt).toBe(imported.createdAt);
    expect(current().updatedAt).toBe(imported.updatedAt);
    title("new", "x");
    expect(useProjectStore.getState().past).toHaveLength(1);
    useProjectStore.getState().undo();
    expect(current().title).toBe("imported");
  });
});
