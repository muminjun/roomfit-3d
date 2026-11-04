import { create } from "zustand";
import type { FurnitureItem, PointMm } from "../types/model";
type Tool = "select" | "wallMove" | "indent" | "protrude" | "measure" | "architectureMove";
type UIStore = {
  selected: { kind: "room" | "wall" | "furniture" | "partition" | "opening" | "zone"; id: string } | null;
  setSelected: (selected: UIStore["selected"]) => void;
  selectedFurnitureIds: string[];
  setFurnitureSelection: (ids: string[]) => void;
  view: "2d" | "3d" | "split";
  setView: (view: "2d" | "3d" | "split") => void;
  tool: Tool;
  setTool: (tool: Tool) => void;
  preview: { polygon: PointMm[]; valid: boolean; message: string } | null;
  setPreview: (preview: UIStore["preview"]) => void;
  furnitureMessage: string;
  setFurnitureMessage: (message: string) => void;
  furniturePreview: {
    item: FurnitureItem;
    valid: boolean;
    message: string;
  } | null;
  setFurniturePreview: (preview: UIStore["furniturePreview"]) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  viewportCenter: { x: number; y: number } | null;
  setViewportCenter: (point: { x: number; y: number }) => void;
  duplicatePlacementId: string | null;
  setDuplicatePlacementId: (id: string | null) => void;
  draggedCatalogId: string | null;
  setDraggedCatalogId: (id: string | null) => void;
  saveDetail: "" | "corrupt" | "storage" | "conflict";
  setSaveDetail: (detail: UIStore["saveDetail"]) => void;
  lastSavedAt: string | null;
  setLastSavedAt: (time: string | null) => void;
  saveStatus: "clean" | "pending" | "saved" | "failed" | "conflict";
  setSaveStatus: (status: UIStore["saveStatus"]) => void;
};
export const useUIStore = create<UIStore>((set) => ({
  selected: null,
  selectedFurnitureIds: [],
  setSelected: (selected) =>
    set({ selected, selectedFurnitureIds: selected?.kind === "furniture" ? [selected.id] : [], preview: null, furniturePreview: null }),
  setFurnitureSelection: (ids) => {
    const unique = [...new Set(ids)];
    set({ selectedFurnitureIds: unique, selected: unique.length ? {kind:"furniture",id:unique[unique.length-1]} : null, preview:null, furniturePreview:null });
  },
  view: "2d",
  setView: (view) =>
    set({
      view,
      tool: "select",
      preview: null,
      furniturePreview: null,
      draggedCatalogId: null,
      duplicatePlacementId: null,
    }),
  tool: "select",
  setTool: (tool) =>
    set({
      tool,
      preview: null,
      furniturePreview: null,
      duplicatePlacementId: null,
      draggedCatalogId: null,
    }),
  preview: null,
  setPreview: (preview) => set({ preview }),
  furnitureMessage: "",
  setFurnitureMessage: (furnitureMessage) => set({ furnitureMessage }),
  furniturePreview: null,
  setFurniturePreview: (furniturePreview) => set({ furniturePreview }),
  helpOpen: false,
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  viewportCenter: null,
  setViewportCenter: (viewportCenter) => set({ viewportCenter }),
  duplicatePlacementId: null,
  setDuplicatePlacementId: (duplicatePlacementId) =>
    set({ duplicatePlacementId }),
  draggedCatalogId: null,
  setDraggedCatalogId: (draggedCatalogId) => set({ draggedCatalogId }),
  saveDetail: "",
  setSaveDetail: (saveDetail) => set({ saveDetail }),
  lastSavedAt: null,
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  saveStatus: "clean",
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}));
