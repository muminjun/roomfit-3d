import { useRef } from "react";
import type { DragEvent, RefObject } from "react";
import {
  createFurnitureCandidate,
  addFurniture,
} from "../../features/furniture/commands";
import { createId } from "../../features/project/createProject";
import {
  screenToWorld,
  snapFurniture,
  validatePlacement,
  type Viewport,
} from "../../lib/geometry";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
export function useCatalogDrop(
  ref: RefObject<HTMLDivElement | null>,
  view: Viewport,
) {
  const previewId = useRef(createId());
  function candidate(event: DragEvent) {
    const id = useUIStore.getState().draggedCatalogId,
      node = ref.current;
    if (!id || !node) return null;
    const rect = node.getBoundingClientRect();
    const world = screenToWorld(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      view,
    );
    const project = useProjectStore.getState().project;
    let item = createFurnitureCandidate(
      id,
      { x: Math.round(world.x * 2) / 2, y: Math.round(world.y * 2) / 2 },
      previewId.current,
    );
    if (!item) return null;
    if (project.settings.snapEnabled)
      item = snapFurniture(item, project.settings.gridSizeMm);
    return {
      item,
      validation: validatePlacement(project.room, project.furniture, item),
    };
  }
  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    const result = candidate(event);
    if (result)
      useUIStore.getState().setFurniturePreview({
        item: result.item,
        valid: result.validation.valid,
        message: result.validation.issues.map((i) => i.message).join(" "),
      });
  }
  function onDrop(event: DragEvent) {
    event.preventDefault();
    const result = candidate(event);
    if (result && !result.validation.valid)
      useUIStore
        .getState()
        .setFurnitureMessage(
          result.validation.issues.map((i) => i.message).join(" "),
        );
    if (result?.validation.valid) {
      useUIStore.getState().setFurnitureMessage("");
      const command = addFurniture({
        catalogId: result.item.catalogId,
        position: result.item.position,
      });
      if (command.ok && command.kind === "Committed")
        useUIStore
          .getState()
          .setSelected({ kind: "furniture", id: command.affectedIds[0] });
    }
    useUIStore.getState().setFurniturePreview(null);
    useUIStore.getState().setDraggedCatalogId(null);
    previewId.current = createId();
  }
  return {
    onDragOver,
    onDrop,
    onDragLeave: (event: DragEvent) => {
      if (
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      )
        return;
      useUIStore.getState().setFurniturePreview(null);
      useUIStore.getState().setDraggedCatalogId(null);
    },
  };
}
