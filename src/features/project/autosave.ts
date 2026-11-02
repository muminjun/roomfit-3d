import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import { serializeProjectJson } from "./json";
import { projectSchema } from "../../types/schema";
export const autosaveKey = `roomfit3d:v2:${import.meta.env.BASE_URL}:autosave`;
type Block = "corrupt" | "conflict" | null;
type Service = {
  overwrite: () => boolean;
  loadOther: () => boolean;
  raw: () => string | null;
};
let service: Service | null = null;
export const overwriteAutosave = () => service?.overwrite() ?? false;
export const loadOtherAutosave = () => service?.loadOther() ?? false;
export const corruptAutosaveRaw = () => service?.raw() ?? null;
export function startAutosave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined,
    blocked: Block = null,
    rawCorrupt: string | null = null,
    suppress = false;
  const ui = () => useUIStore.getState();
  ui().setLastSavedAt(null);
  ui().setSaveDetail("");
  ui().setSaveStatus("clean");
  function failed() {
    ui().setSaveDetail("storage");
    ui().setSaveStatus("failed");
  }
  function write() {
    if (blocked) return false;
    try {
      localStorage.setItem(
        autosaveKey,
        serializeProjectJson(useProjectStore.getState().project),
      );
      ui().setLastSavedAt(new Date().toISOString());
      ui().setSaveDetail("");
      ui().setSaveStatus("saved");
      return true;
    } catch {
      failed();
      return false;
    }
  }
  try {
    const raw = localStorage.getItem(autosaveKey);
    if (raw !== null) {
      try {
        const parsed = projectSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) throw new Error("invalid");
        useProjectStore.getState().loadProject(parsed.data);
        ui().setLastSavedAt(null);
        ui().setSaveStatus("saved");
      } catch {
        blocked = "corrupt";
        rawCorrupt = raw;
        ui().setSaveDetail("corrupt");
        ui().setSaveStatus("failed");
        try {
          localStorage.setItem(`${autosaveKey}-corrupt:${Date.now()}`, raw);
        } catch {
          /* Original remains untouched. */
        }
      }
    }
  } catch {
    blocked = "corrupt";
    ui().setSaveDetail("storage");
    ui().setSaveStatus("failed");
  }
  const unsubscribe = useProjectStore.subscribe((state, prev) => {
    if (state.project === prev.project || blocked || suppress) return;
    clearTimeout(timer);
    ui().setSaveStatus("pending");
    timer = setTimeout(() => {
      timer = undefined;
      write();
    }, 500);
  });
  const onStorage = (event: StorageEvent) => {
    if (event.key !== autosaveKey && event.key !== null) return;
    if (event.storageArea && event.storageArea !== localStorage) return;
    clearTimeout(timer);
    blocked = "conflict";
    ui().setSaveDetail("conflict");
    ui().setSaveStatus("conflict");
  };
  const pagehide = () => {
    if (timer && !blocked) {
      clearTimeout(timer);
      timer = undefined;
      write();
    }
  };
  const current: Service = {
    raw: () => rawCorrupt,
    overwrite: () => {
      const previous = blocked;
      blocked = null;
      const ok = write();
      if (!ok) {
        blocked = previous;
        if (previous === "corrupt") ui().setSaveDetail("corrupt");
        if (previous === "conflict") {
          ui().setSaveDetail("conflict");
          ui().setSaveStatus("conflict");
        }
      } else rawCorrupt = null;
      return ok;
    },
    loadOther: () => {
      try {
        const raw = localStorage.getItem(autosaveKey);
        if (!raw) return false;
        const parsed = projectSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return false;
        suppress = true;
        const ok = useProjectStore.getState().loadProject(parsed.data);
        suppress = false;
        if (!ok) return false;
        blocked = null;
        rawCorrupt = null;
        ui().setSelected(null);
        ui().setSaveDetail("");
        ui().setLastSavedAt(null);
        ui().setSaveStatus("saved");
        return true;
      } catch {
        suppress = false;
        return false;
      }
    },
  };
  service = current;
  window.addEventListener("storage", onStorage);
  window.addEventListener("pagehide", pagehide);
  return () => {
    clearTimeout(timer);
    unsubscribe();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("pagehide", pagehide);
    if (service === current) service = null;
  };
}
