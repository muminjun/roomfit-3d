import {
  deleteFurniture,
  duplicateFurniture,
  moveFurniture,
  rotateFurniture,
} from "../../features/furniture/commands";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import type { RotationDeg } from "../../types/model";
import type { ShortcutAction } from "../../config/shortcuts";
export function handleFurnitureShortcut(
  action: ShortcutAction | undefined,
  event: KeyboardEvent,
): boolean {
  const ui = useUIStore.getState(),
    project = useProjectStore.getState().project,
    item =
      ui.selected?.kind === "furniture"
        ? project.furniture.find((f) => f.id === ui.selected?.id)
        : null;
  if (!item) return false;
  if (action === "delete") {
    const result = deleteFurniture({ itemId: item.id });
    if (result.ok) ui.setSelected(null);
    return true;
  }
  if (action === "rotate" || action === "rotateBack") {
    rotateFurniture({
      itemId: item.id,
      rotationDeg: ((item.rotationDeg + (action === "rotateBack" ? 270 : 90)) %
        360) as RotationDeg,
    });
    return true;
  }
  if (action === "duplicate") {
    const result = duplicateFurniture({ itemId: item.id });
    if (result.ok && result.kind === "Committed")
      ui.setSelected({ kind: "furniture", id: result.affectedIds[0] });
    else if (!result.ok && result.issues.some((i) => i.code === "NO_PLACEMENT"))
      ui.setDuplicatePlacementId(item.id);
    return true;
  }
  const directions: Partial<Record<ShortcutAction, [number, number]>> = {
    nudgeLeft: [-1, 0],
    nudgeRight: [1, 0],
    nudgeUp: [0, -1],
    nudgeDown: [0, 1],
  };
  const direction = action && directions[action];
  if (direction) {
    const step = event.altKey
      ? 1
      : project.settings.gridSizeMm * (event.shiftKey ? 5 : 1);
    moveFurniture(
      {
        itemId: item.id,
        position: {
          x: item.position.x + direction[0] * step,
          y: item.position.y + direction[1] * step,
        },
      },
      `nudge:${item.id}`,
    );
    return true;
  }
  return false;
}
