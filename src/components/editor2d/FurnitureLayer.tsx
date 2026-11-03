import { describeFurnitureIssues } from "./furnitureShortcuts";
import { Circle, Group, Rect, Text } from "./konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  duplicateFurniture,
  moveFurniture,
  resizeFromCorner,
  resizeFurniture,
} from "../../features/furniture/commands";
import {
  getFurnitureRect,
  snapFurniture,
  validateAllPlacements,
  validatePlacement,
} from "../../lib/geometry";
import type { FurnitureItem } from "../../types/model";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import { useEffect, useRef } from "react";
import type Konva from "konva";
type Corner = "nw" | "ne" | "sw" | "se";
export function FurnitureLayer({
  zoom,
  isPan,
  onHover,
}: {
  zoom: number;
  isPan: (event: MouseEvent) => boolean;
  onHover: (id: string | null) => void;
}) {
  const project = useProjectStore((s) => s.project),
    selected = useUIStore((s) => s.selected),
    preview = useUIStore((s) => s.furniturePreview),
    setPreview = useUIStore((s) => s.setFurniturePreview),
    setSelected = useUIStore((s) => s.setSelected),
    tool = useUIStore((s) => s.tool);
  const original = useRef<FurnitureItem | null>(null),
    resize = useRef<{ item: FurnitureItem; corner: Corner } | null>(null),
    alt = useRef(false),
    activeNode = useRef<Konva.Node | null>(null),
    activeStart = useRef({ x: 0, y: 0 }),
    cancelled = useRef(false);
  useEffect(() => {
    const cancel = () => {
      cancelled.current = true;
      const node = activeNode.current;
      if (node) {
        node.position(activeStart.current);
        node.stopDrag();
        activeNode.current = null;
      }
      original.current = null;
      resize.current = null;
      setPreview(null);
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("roomfit-cancel-drag", cancel);
    return () => {
      cancel();
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("roomfit-cancel-drag", cancel);
    };
  }, [setPreview]);
  const validity = validateAllPlacements(project.room, project.furniture);
  function candidate(
    item: FurnitureItem,
    position: { x: number; y: number },
    shift: boolean,
  ) {
    let dx = position.x - item.position.x,
      dy = position.y - item.position.y;
    const horizontal = shift && Math.abs(dx) > Math.abs(dy);
    const vertical = shift && !horizontal;
    if (horizontal) dy = 0;
    if (vertical) dx = 0;
    let next = {
      ...item,
      position: {
        x: Math.round((item.position.x + dx) * 2) / 2,
        y: Math.round((item.position.y + dy) * 2) / 2,
      },
    };
    if (project.settings.snapEnabled)
      next = snapFurniture(next, project.settings.gridSizeMm);
    if (horizontal) next.position.y = item.position.y;
    if (vertical) next.position.x = item.position.x;
    return next;
  }
  function update(item: FurnitureItem) {
    const validation = validatePlacement(
      project.room,
      project.furniture,
      item,
      { ignoreId: alt.current ? undefined : item.id },
    );
    setPreview({
      item,
      valid: validation.valid,
      message: describeFurnitureIssues(validation.issues, project.furniture),
    });
  }
  function begin(e: KonvaEventObject<DragEvent>, item: FurnitureItem) {
    e.cancelBubble = true;
    if (useUIStore.getState().tool !== "select") {
      e.target.position(item.position);
      e.target.stopDrag();
      return;
    }
    original.current = item;
    cancelled.current = false;
    activeNode.current = e.target;
    activeStart.current = e.target.position();
    alt.current = e.evt.altKey;
    setSelected({ kind: "furniture", id: item.id });
  }
  function move(e: KonvaEventObject<DragEvent>) {
    if (!original.current) return;
    update(
      candidate(
        original.current,
        { x: e.target.x(), y: e.target.y() },
        e.evt.shiftKey,
      ),
    );
  }
  function end(e: KonvaEventObject<DragEvent>) {
    if (!original.current || cancelled.current) return;
    activeNode.current = null;
    if (
      Math.hypot(
        e.target.x() - original.current.position.x,
        e.target.y() - original.current.position.y,
      ) *
        zoom <
      3
    ) {
      e.target.position(original.current.position);
      original.current = null;
      setPreview(null);
      return;
    }
    const next = candidate(
      original.current,
      { x: e.target.x(), y: e.target.y() },
      e.evt.shiftKey,
    );
    e.target.position(original.current.position);
    const validation = validatePlacement(
      project.room,
      project.furniture,
      next,
      { ignoreId: alt.current ? undefined : next.id },
    );
    if (!validation.valid)
      useUIStore
        .getState()
        .setFurnitureMessage(
          describeFurnitureIssues(validation.issues, project.furniture),
        );
    else useUIStore.getState().setFurnitureMessage("");
    if (validation.valid) {
      const result = alt.current
        ? duplicateFurniture({ itemId: next.id, position: next.position })
        : moveFurniture({ itemId: next.id, position: next.position });
      if (result.ok && result.kind === "Committed")
        setSelected({ kind: "furniture", id: result.affectedIds[0] });
      else if (!result.ok)
        useUIStore
          .getState()
          .setFurnitureMessage(
            describeFurnitureIssues(result.issues, project.furniture),
          );
    }
    original.current = null;
    setPreview(null);
  }
  return (
    <>
      {original.current &&
        alt.current &&
        (() => {
          const r = getFurnitureRect(original.current);
          return (
            <Rect
              x={r.minX}
              y={r.minY}
              width={r.maxX - r.minX}
              height={r.maxY - r.minY}
              fill={original.current.color ?? "#81C784"}
              opacity={0.8}
              stroke="#317d74"
              strokeWidth={1 / zoom}
              listening={false}
            />
          );
        })()}
      {project.furniture.map((item) => {
        const shown =
            preview?.item.id === item.id && !original.current
              ? preview.item
              : item,
          r = getFurnitureRect(shown),
          base = getFurnitureRect(item),
          isSelected =
            selected?.kind === "furniture" && selected.id === item.id,
          valid =
            preview?.item.id === item.id
              ? preview.valid
              : validity[item.id]?.valid;
        const w = r.maxX - r.minX,
          h = r.maxY - r.minY;
        return (
          <Group
            key={item.id}
            x={item.position.x}
            y={item.position.y}
            draggable={tool === "select"}
            onMouseEnter={() => onHover(item.id)}
            onMouseLeave={() => onHover(null)}
            onMouseDown={(e) => {
              if (!isPan(e.evt)) return;
              const group = e.currentTarget;
              const target = e.target;
              const groupDraggable = group.draggable();
              const targetDraggable = target.draggable();
              group.draggable(false);
              target.draggable(false);
              const restore = () => {
                const canEdit = useUIStore.getState().tool === "select";
                group.draggable(groupDraggable && canEdit);
                target.draggable(targetDraggable && canEdit);
                window.removeEventListener("mouseup", restore);
                window.removeEventListener("blur", restore);
                window.removeEventListener("pointercancel", restore);
                window.removeEventListener("roomfit-cancel-drag", restore);
              };
              window.addEventListener("mouseup", restore);
              window.addEventListener("blur", restore);
              window.addEventListener("pointercancel", restore);
              window.addEventListener("roomfit-cancel-drag", restore);
            }}
            onClick={(e) => {
              if (isPan(e.evt)) return;
              e.cancelBubble = true;
              setSelected({ kind: "furniture", id: item.id });
            }}
            onDragStart={(e) => begin(e, item)}
            onDragMove={move}
            onDragEnd={end}
          >
            <Rect
              x={r.minX - item.position.x}
              y={r.minY - item.position.y}
              width={w}
              height={h}
              fill={item.color ?? "#81C784"}
              opacity={0.8}
              stroke={valid ? "#317d74" : "#d54646"}
              strokeWidth={(isSelected ? 3 : 1) / zoom}
            />
            <Text
              x={r.minX - item.position.x + 8 / zoom}
              y={r.minY - item.position.y + 8 / zoom}
              text={`${item.name}\n${w} × ${h} mm  ${{ 0: "↑", 90: "→", 180: "↓", 270: "←" }[item.rotationDeg]}`}
              fontSize={12 / zoom}
              fill="#163c3b"
              listening={false}
            />
            {isSelected &&
              (["nw", "ne", "sw", "se"] as Corner[]).map((c) => {
                const x = c.includes("w") ? base.minX : base.maxX,
                  y = c.includes("n") ? base.minY : base.maxY;
                return (
                  <Circle
                    key={c}
                    x={x - item.position.x}
                    y={y - item.position.y}
                    radius={6 / zoom}
                    fill="white"
                    stroke="#168b81"
                    strokeWidth={2 / zoom}
                    draggable={tool === "select"}
                    onDragStart={(e) => {
                      e.cancelBubble = true;
                      resize.current = { item, corner: c };
                      cancelled.current = false;
                      activeNode.current = e.target;
                      activeStart.current = e.target.position();
                    }}
                    onDragMove={(e) => {
                      e.cancelBubble = true;
                      if (!resize.current || cancelled.current) return;
                      const point = {
                        x: item.position.x + e.target.x(),
                        y: item.position.y + e.target.y(),
                      };
                      const grid = project.settings.gridSizeMm;
                      if (project.settings.snapEnabled) {
                        point.x = Math.round(point.x / grid) * grid;
                        point.y = Math.round(point.y / grid) * grid;
                      }
                      const next = resizeFromCorner(item, c, point);
                      update(next);
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      if (!resize.current || cancelled.current) return;
                      const point = {
                        x: item.position.x + e.target.x(),
                        y: item.position.y + e.target.y(),
                      };
                      const grid = project.settings.gridSizeMm;
                      if (project.settings.snapEnabled) {
                        point.x = Math.round(point.x / grid) * grid;
                        point.y = Math.round(point.y / grid) * grid;
                      }
                      const next = resizeFromCorner(item, c, point);
                      e.target.position(activeStart.current);
                      activeNode.current = null;
                      const result = resizeFurniture({
                        itemId: item.id,
                        widthMm: next.widthMm,
                        depthMm: next.depthMm,
                        heightMm: next.heightMm,
                        position: next.position,
                      });
                      useUIStore
                        .getState()
                        .setFurnitureMessage(
                          result.ok
                            ? ""
                            : describeFurnitureIssues(
                                result.issues,
                                project.furniture,
                              ),
                        );
                      resize.current = null;
                      setPreview(null);
                    }}
                  />
                );
              })}
          </Group>
        );
      })}
      {preview &&
        !project.furniture.some((i) => i.id === preview.item.id) &&
        (() => {
          const r = getFurnitureRect(preview.item);
          return (
            <Rect
              x={r.minX}
              y={r.minY}
              width={r.maxX - r.minX}
              height={r.maxY - r.minY}
              fill={preview.valid ? "#55b6a9" : "#dc6262"}
              opacity={0.55}
              stroke={preview.valid ? "#168b81" : "#bf3030"}
              strokeWidth={2 / zoom}
              listening={false}
            />
          );
        })()}
    </>
  );
}
