import { create } from "zustand";
import { LIMITS } from "../config/limits";
import { createProject } from "../features/project/createProject";
import type { ProjectDataV2 } from "../types/model";
import { projectSchema } from "../types/schema";

type Snapshot = Pick<ProjectDataV2, "title" | "room" | "furniture">;
const snapshot = (project: ProjectDataV2): Snapshot => ({
  title: project.title,
  room: project.room,
  furniture: project.furniture,
});
const now = () => new Date().toISOString();

/** Committed project state; previews and selection belong to the UI store. Settings are never part of undo history. */
export interface ProjectStore {
  project: ProjectDataV2;
  past: Snapshot[];
  future: Snapshot[];
  commit: (
    candidate: ProjectDataV2,
    label?: string,
    coalesceKey?: string,
  ) => boolean;
  loadProject: (project: ProjectDataV2) => boolean;
  undo: () => void;
  redo: () => void;
  setSettings: (settings: Partial<ProjectDataV2["settings"]>) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => {
  let lastEdit: { key: string; time: number } | undefined;
  return {
    project: createProject(),
    past: [],
    future: [],
    commit: (candidate, _label, coalesceKey) => {
      if (!projectSchema.safeParse(candidate).success) return false;
      const { project: current, past } = get();
      if (
        JSON.stringify(snapshot(current)) ===
        JSON.stringify(snapshot(candidate))
      )
        return false;
      const committed = {
        ...current,
        ...snapshot(candidate),
        updatedAt: now(),
      };
      if (!projectSchema.safeParse(committed).success) return false;
      const time = Date.now();
      const elapsed = lastEdit ? time - lastEdit.time : Infinity;
      const coalesce =
        coalesceKey !== undefined &&
        lastEdit?.key === coalesceKey &&
        elapsed >= 0 &&
        elapsed <= 500 &&
        past.length > 0;
      lastEdit =
        coalesceKey === undefined ? undefined : { key: coalesceKey, time };
      set({
        project: committed,
        past: coalesce
          ? past
          : [...past, snapshot(current)].slice(-LIMITS.history),
        future: [],
      });
      return true;
    },
    loadProject: (project) => {
      const result = projectSchema.safeParse(project);
      if (!result.success) return false;
      lastEdit = undefined;
      set({ project: result.data, past: [], future: [] });
      return true;
    },
    undo: () => {
      lastEdit = undefined;
      const { past, future, project } = get();
      const previous = past.at(-1);
      if (!previous) return;
      set({
        project: { ...project, ...previous, updatedAt: now() },
        past: past.slice(0, -1),
        future: [snapshot(project), ...future],
      });
    },
    redo: () => {
      lastEdit = undefined;
      const { past, future, project } = get();
      const next = future[0];
      if (!next) return;
      set({
        project: { ...project, ...next, updatedAt: now() },
        past: [...past, snapshot(project)].slice(-LIMITS.history),
        future: future.slice(1),
      });
    },
    setSettings: (settings) => {
      const project = get().project;
      const next = { ...project.settings, ...settings };
      if (JSON.stringify(next) === JSON.stringify(project.settings)) return;
      const candidate = { ...project, settings: next, updatedAt: now() };
      if (projectSchema.safeParse(candidate).success) {
        lastEdit = undefined;
        set({ project: candidate });
      }
    },
  };
});
