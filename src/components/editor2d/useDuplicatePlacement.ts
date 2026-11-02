import { useRef } from "react";
import { duplicateFurniture } from "../../features/furniture/commands";
import { createId } from "../../features/project/createProject";
import { snapFurniture, validatePlacement } from "../../lib/geometry";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
export function useDuplicatePlacement() {
  const id = useRef(createId());
  function move(point: { x: number; y: number }) {
    const ui = useUIStore.getState(),
      project = useProjectStore.getState().project,
      source = project.furniture.find(
        (item) => item.id === ui.duplicatePlacementId,
      );
    if (!source) return;
    let item = {
      ...source,
      id: id.current,
      position: {
        x: Math.round(point.x * 2) / 2,
        y: Math.round(point.y * 2) / 2,
      },
    };
    if (project.settings.snapEnabled)
      item = snapFurniture(item, project.settings.gridSizeMm);
    const validation = validatePlacement(project.room, project.furniture, item);
    ui.setFurniturePreview({
      item,
      valid: validation.valid,
      message: validation.issues.map((i) => i.message).join(" "),
    });
  }
  function commit() {
    const ui = useUIStore.getState();
    if (!ui.duplicatePlacementId || !ui.furniturePreview?.valid) return;
    const result = duplicateFurniture({
      itemId: ui.duplicatePlacementId,
      position: ui.furniturePreview.item.position,
    });
    if (result.ok && result.kind === "Committed")
      ui.setSelected({ kind: "furniture", id: result.affectedIds[0] });
    ui.setDuplicatePlacementId(null);
    ui.setFurniturePreview(null);
    id.current = createId();
  }
  function cancel() {
    const ui = useUIStore.getState();
    ui.setDuplicatePlacementId(null);
    ui.setFurniturePreview(null);
  }
  return { move, commit, cancel };
}
