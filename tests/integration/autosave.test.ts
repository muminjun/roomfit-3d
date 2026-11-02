// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  autosaveKey,
  startAutosave,
  overwriteAutosave,
  loadOtherAutosave,
} from "../../src/features/project/autosave";
import { createProject } from "../../src/features/project/createProject";
import { useProjectStore } from "../../src/store/useProjectStore";
import { useUIStore } from "../../src/store/useUIStore";

describe("autosave preserves committed data", () => {
  let stop: (() => void) | undefined;
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useProjectStore.getState().loadProject(createProject());
  });
  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  it("cancels a pending write when another tab clears storage", () => {
    stop = startAutosave();
    const initial = useProjectStore.getState().project;
    useProjectStore.getState().commit({ ...initial, title: "내 변경" });
    window.dispatchEvent(
      new StorageEvent("storage", { key: null, storageArea: localStorage }),
    );
    vi.advanceTimersByTime(600);
    expect(localStorage.getItem(autosaveKey)).toBeNull();
    expect(useUIStore.getState().saveStatus).toBe("conflict");
  });
  it.each(["QuotaExceededError", "SecurityError"])(
    "retains prior autosave and in-memory project on %s",
    (reason) => {
      const original = createProject();
      localStorage.setItem(autosaveKey, JSON.stringify(original));
      stop = startAutosave();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("write blocked", reason);
      });
      useProjectStore
        .getState()
        .commit({ ...useProjectStore.getState().project, title: "수정" });
      vi.advanceTimersByTime(600);
      expect(JSON.parse(localStorage.getItem(autosaveKey)!).title).toBe(
        original.title,
      );
      expect(useProjectStore.getState().project.title).toBe("수정");
      expect(useUIStore.getState().saveStatus).toBe("failed");
    },
  );
  it("preserves damaged raw autosave even when backup also fails", () => {
    localStorage.setItem(autosaveKey, "{bad");
    const real = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key !== autosaveKey)
        throw new DOMException("full", "QuotaExceededError");
      return real.call(this, key, value);
    });
    stop = startAutosave();
    const p = useProjectStore.getState().project;
    useProjectStore.getState().commit({ ...p, title: "바뀐 이름" });
    vi.advanceTimersByTime(600);
    expect(localStorage.getItem(autosaveKey)).toBe("{bad");
    expect(useUIStore.getState().saveStatus).toBe("failed");
  });
  it("does not save previews or no-change commands", () => {
    stop = startAutosave();
    const p = useProjectStore.getState().project;
    useUIStore
      .getState()
      .setPreview({ polygon: p.room.polygon, valid: true, message: "" });
    useProjectStore.getState().commit(p);
    vi.advanceTimersByTime(600);
    expect(localStorage.getItem(autosaveKey)).toBeNull();
  });
  it("requires explicit resolution after conflict and blocks pagehide writes", () => {
    stop = startAutosave();
    const original = useProjectStore.getState().project;
    useProjectStore.getState().commit({ ...original, title: "local" });
    const remote = { ...original, title: "remote" };
    localStorage.setItem(autosaveKey, JSON.stringify(remote));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: autosaveKey,
        storageArea: localStorage,
      }),
    );
    window.dispatchEvent(new Event("pagehide"));
    vi.advanceTimersByTime(600);
    expect(JSON.parse(localStorage.getItem(autosaveKey)!).title).toBe("remote");
    expect(useProjectStore.getState().project.title).toBe("local");
    expect(loadOtherAutosave()).toBe(true);
    expect(useProjectStore.getState().project.title).toBe("remote");
  });
  it("keeps conflict blocked when explicit overwrite fails", () => {
    stop = startAutosave();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: autosaveKey,
        storageArea: localStorage,
      }),
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(overwriteAutosave()).toBe(false);
    expect(useUIStore.getState().saveStatus).toBe("conflict");
    expect(useUIStore.getState().saveDetail).toBe("conflict");
  });
  it("restores historical metadata without reporting it as a save time", () => {
    const project = {
      ...createProject(),
      updatedAt: "2021-01-01T00:00:00.000Z",
    };
    localStorage.setItem(autosaveKey, JSON.stringify(project));
    stop = startAutosave();
    expect(useProjectStore.getState().project.updatedAt).toBe(
      project.updatedAt,
    );
    expect(useUIStore.getState().lastSavedAt).toBeNull();
  });
});
