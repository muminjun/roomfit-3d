import { resolveShortcut } from "../../config/shortcuts";
import { handleFurnitureShortcut } from "./furnitureShortcuts";
import { exportJson } from "../../features/project/exportJson";
import { useDuplicatePlacement } from "./useDuplicatePlacement";
import { FurnitureLayer } from "./FurnitureLayer";
import { useCatalogDrop } from "./useCatalogDrop";
import { useEffect, useRef, useState } from "react";
import { clamp, useViewport } from "./useViewport";
import { Layer, Line, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  addNotch,
  getBBox,
  moveWall,
  screenToWorld,
  zoomAtPointer,
} from "../../lib/geometry";
import { createId } from "../../features/project/createProject";
import { addRoomNotch, moveWallSegment } from "../../features/room/commands";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";
type Point = { x: number; y: number };
type Gesture =
  | { kind: "move"; id: string; start: Point; offset: number }
  | { kind: "span"; id: string; start: Point; end: Point }
  | {
      kind: "depth";
      id: string;
      start: Point;
      end: Point;
      depth: number;
      active: boolean;
    }
  | { kind: "pan"; start: Point; panX: number; panY: number };
export function Editor2D() {
  const room = useProjectStore((s) => s.project.room),
    projectId = useProjectStore((s) => s.project.id),
    settings = useProjectStore((s) => s.project.settings);
  const {
    tool,
    selected,
    setSelected,
    preview,
    setPreview,
    furniturePreview,
    furnitureMessage,
  } = useUIStore();
  const { ref, size, view, setView, mode, setMode, fit } = useViewport(
    room.polygon,
    projectId,
  );
  const drop = useCatalogDrop(ref, view);
  const duplicate = useDuplicatePlacement();
  const gesture = useRef<Gesture | null>(null),
    space = useRef(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.isComposing || document.querySelector('[aria-modal="true"]'))
        return;
      if (e.key === "Escape") {
        gesture.current = null;
        setPreview(null);
        setMessage("");
        useUIStore.getState().setDuplicatePlacementId(null);
        useUIStore.getState().setFurniturePreview(null);
        useUIStore.getState().setDraggedCatalogId(null);
      }
      if (e.code === "Space" && document.activeElement === ref.current) {
        e.preventDefault();
        space.current = true;
      }
      if (document.activeElement === ref.current) {
        const action = resolveShortcut(e);
        if (!action) return;
        e.preventDefault();
        if (handleFurnitureShortcut(action, e)) return;
        if (action === "save") exportJson(useProjectStore.getState().project);
        else if (action === "help") useUIStore.getState().setHelpOpen(true);
        else if (action === "undo") useProjectStore.getState().undo();
        else if (action === "redo") useProjectStore.getState().redo();
        else if (action === "fit") fit();
        else if (action === "actualSize")
          setView((v) =>
            zoomAtPointer(v, { x: size.width / 2, y: size.height / 2 }, 1),
          );
        else if (action === "fitSelection" && selected?.kind === "wall") {
          const i = room.polygon.findIndex((p) => p.id === selected.id);
          if (i >= 0) {
            const a = room.polygon[i],
              b = room.polygon[(i + 1) % room.polygon.length],
              length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            const zoom = clamp(
              Math.min(
                (size.width - 100) /
                  Math.max(Math.abs(a.x - b.x), length * 0.2),
                (size.height - 100) /
                  Math.max(Math.abs(a.y - b.y), length * 0.2),
              ),
              0.02,
              1.5,
            );
            setView({
              zoom,
              panX: size.width / 2 - ((a.x + b.x) / 2) * zoom,
              panY: size.height / 2 - ((a.y + b.y) / 2) * zoom,
            });
          }
        } else if (
          action === "select" ||
          action === "wallMove" ||
          action === "indent" ||
          action === "protrude"
        )
          useUIStore.getState().setTool(action);
        else if (action === "zoomIn" || action === "zoomOut")
          setView((v) =>
            zoomAtPointer(
              v,
              { x: size.width / 2, y: size.height / 2 },
              clamp(v.zoom * (action === "zoomOut" ? 1 / 1.2 : 1.2), 0.02, 1.5),
            ),
          );
        else if (action === "view2d" || action === "view3d")
          setMessage(
            action === "view3d"
              ? "3D 보기는 준비 중입니다. 2D에서 계속 편집할 수 있습니다."
              : "2D 편집",
          );
      }
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
    };
    const cancel = () => {
      gesture.current = null;
      setPreview(null);
      space.current = false;
      useUIStore.getState().setDuplicatePlacementId(null);
      useUIStore.getState().setFurniturePreview(null);
      useUIStore.getState().setDraggedCatalogId(null);
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", cancel);
    };
  }, [fit, setPreview, size, selected, room.polygon, ref, setView]);
  useEffect(() => {
    gesture.current = null;
    setPreview(null);
    window.dispatchEvent(new Event("roomfit-cancel-drag"));
  }, [tool, setPreview]);
  function pointer(e: KonvaEventObject<MouseEvent>): Point | null {
    const pos = e.target.getStage()?.getPointerPosition();
    return pos ? screenToWorld(pos, view) : null;
  }
  function snap(n: number) {
    return settings.snapEnabled
      ? Math.round(n / settings.gridSizeMm) * settings.gridSizeMm
      : Math.round(n);
  }
  function edge(id: string) {
    const i = room.polygon.findIndex((p) => p.id === id);
    return i < 0
      ? null
      : ([
          room.polygon[i],
          room.polygon[(i + 1) % room.polygon.length],
        ] as const);
  }
  function moveOffset(id: string, start: Point, end: Point) {
    const points = edge(id);
    if (!points) return 0;
    const [a, b] = points;
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    return snap(
      ((end.x - start.x) * (b.y - a.y)) / len -
        ((end.y - start.y) * (b.x - a.x)) / len,
    );
  }
  function notchValues(g: Extract<Gesture, { kind: "span" | "depth" }>) {
    const points = edge(g.id);
    if (!points) return null;
    const [a, b] = points;
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y),
      tx = (b.x - a.x) / len,
      ty = (b.y - a.y) / len;
    const one = snap((g.start.x - a.x) * tx + (g.start.y - a.y) * ty),
      two = snap((g.end.x - a.x) * tx + (g.end.y - a.y) * ty);
    return {
      startVertexId: g.id,
      startOffsetMm: Math.min(one, two),
      widthMm: Math.abs(two - one),
      depthMm: g.kind === "depth" ? g.depth : 0,
      type: tool === "protrude" ? ("protrude" as const) : ("indent" as const),
    };
  }
  function downEdge(e: KonvaEventObject<MouseEvent>, id: string) {
    ref.current?.focus();
    if (e.evt.button === 1 || space.current) return;
    e.cancelBubble = true;
    const p = pointer(e);
    if (!p) return;
    setSelected({ kind: "wall", id });
    if (tool === "wallMove")
      gesture.current = { kind: "move", id, start: p, offset: 0 };
    else if (tool === "indent" || tool === "protrude") {
      if (gesture.current?.kind === "depth") return;
      gesture.current = { kind: "span", id, start: p, end: p };
    }
  }
  function move(e: KonvaEventObject<MouseEvent>) {
    const g = gesture.current;
    if (useUIStore.getState().duplicatePlacementId) {
      const p = pointer(e);
      if (p) duplicate.move(p);
      return;
    }
    if (!g) return;
    const screen = e.target.getStage()?.getPointerPosition();
    if (!screen) return;
    if (g.kind === "pan") {
      setView((v) => ({
        ...v,
        panX: g.panX + screen.x - g.start.x,
        panY: g.panY + screen.y - g.start.y,
      }));
      return;
    }
    const p = pointer(e);
    if (!p) return;
    if (g.kind === "move") {
      g.offset = moveOffset(g.id, g.start, p);
      const result = moveWall(room.polygon, g.id, g.offset);
      setPreview(
        result.ok
          ? { polygon: result.polygon, valid: true, message: `${g.offset} mm` }
          : {
              polygon: room.polygon.map((point, i) => {
                const edgeIndex = room.polygon.findIndex((q) => q.id === g.id);
                if (
                  i !== edgeIndex &&
                  i !== (edgeIndex + 1) % room.polygon.length
                )
                  return point;
                const pair = edge(g.id);
                if (!pair) return point;
                const [a, b] = pair;
                const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
                return {
                  ...point,
                  x: point.x + (g.offset * (b.y - a.y)) / len,
                  y: point.y - (g.offset * (b.x - a.x)) / len,
                };
              }),
              valid: false,
              message: result.message,
            },
      );
    } else if (g.kind === "span") {
      g.end = p;
      setMessage(
        `폭 ${Math.abs(snap(Math.hypot(g.end.x - g.start.x, g.end.y - g.start.y)))} mm`,
      );
    } else {
      const points = edge(g.id);
      if (!points) return;
      const [a, b] = points;
      const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      const sign = tool === "indent" ? -1 : 1;
      g.depth = Math.max(
        0,
        snap(
          sign *
            (((p.x - g.end.x) * (b.y - a.y)) / len -
              ((p.y - g.end.y) * (b.x - a.x)) / len),
        ),
      );
      const options = notchValues(g);
      if (!options) return;
      const result = addNotch(room.polygon, options, createId);
      setPreview(
        result.ok
          ? {
              polygon: result.polygon,
              valid: true,
              message: `${options.widthMm} × ${g.depth} mm`,
            }
          : { polygon: room.polygon, valid: false, message: result.message },
      );
    }
  }
  function up() {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "move") {
      if (g.offset) {
        const result = moveWallSegment({
          startVertexId: g.id,
          offsetMm: g.offset,
        });
        if (!result.ok) setMessage(result.issues[0].message);
        else if (result.kind === "Committed" && result.selectedEdgeId)
          setSelected({ kind: "wall", id: result.selectedEdgeId });
      }
      gesture.current = null;
      setPreview(null);
    } else if (g.kind === "span") {
      gesture.current = { ...g, kind: "depth", depth: 0, active: false };
      setMessage("깊이 방향으로 이동한 후 클릭하세요.");
    } else if (g.kind === "depth" && g.active) {
      const options = notchValues(g);
      if (options) {
        const result = addRoomNotch(options);
        if (!result.ok) setMessage(result.issues[0].message);
        else {
          setMessage("");
          if (result.kind === "Committed" && result.selectedEdgeId)
            setSelected({ kind: "wall", id: result.selectedEdgeId });
        }
      }
      gesture.current = null;
      setPreview(null);
    } else if (g.kind === "pan") gesture.current = null;
  }
  function downStage(e: KonvaEventObject<MouseEvent>) {
    ref.current?.focus();
    if (useUIStore.getState().duplicatePlacementId) {
      duplicate.commit();
      return;
    }
    const screen = e.target.getStage()?.getPointerPosition();
    if (!screen) return;
    if (e.evt.button === 1 || space.current) {
      gesture.current = {
        kind: "pan",
        start: screen,
        panX: view.panX,
        panY: view.panY,
      };
      return;
    }
    const g = gesture.current;
    if (g?.kind === "depth") g.active = true;
  }
  const shown = preview?.polygon ?? room.polygon;
  const box = getBBox(room.polygon);
  const grid: number[] = [];
  if (settings.gridVisible && settings.gridSizeMm * view.zoom >= 6) {
    for (
      let x =
        Math.floor((0 - view.panX) / view.zoom / settings.gridSizeMm) *
        settings.gridSizeMm;
      x < (size.width - view.panX) / view.zoom;
      x += settings.gridSizeMm
    )
      grid.push(x);
  }
  const gridY: number[] = [];
  if (settings.gridVisible && settings.gridSizeMm * view.zoom >= 6) {
    for (
      let y =
        Math.floor((0 - view.panY) / view.zoom / settings.gridSizeMm) *
        settings.gridSizeMm;
      y < (size.height - view.panY) / view.zoom;
      y += settings.gridSizeMm
    )
      gridY.push(y);
  }
  return (
    <div className={styles.editor}>
      <div className={styles.viewControls}>
        <button onClick={fit}>전체 보기</button>
        <button
          aria-label="축소"
          onClick={() =>
            setView((v) =>
              zoomAtPointer(
                v,
                { x: size.width / 2, y: size.height / 2 },
                clamp(v.zoom / 1.2, 0.02, 1.5),
              ),
            )
          }
        >
          −
        </button>
        <span>{Math.round(view.zoom * 1000) / 10}%</span>
        <button
          aria-label="확대"
          onClick={() =>
            setView((v) =>
              zoomAtPointer(
                v,
                { x: size.width / 2, y: size.height / 2 },
                clamp(v.zoom * 1.2, 0.02, 1.5),
              ),
            )
          }
        >
          +
        </button>
        <button
          onClick={() =>
            setMode((m) => {
              const next = m === "zoom" ? "pan" : "zoom";
              return next;
            })
          }
        >
          {mode === "zoom" ? "휠 = 줌" : "Figma 방식"}
        </button>
        <span>
          {box.width} × {box.depth} mm
        </span>
      </div>
      <div
        className={styles.canvas}
        ref={ref}
        tabIndex={0}
        {...drop}
        data-zoom={view.zoom}
        data-pan-x={view.panX}
        data-pan-y={view.panY}
        aria-label="2D 편집 영역"
        onPointerLeave={() => {
          gesture.current = null;
          setPreview(null);
          setMessage("");
          window.dispatchEvent(new Event("roomfit-cancel-drag"));
          duplicate.cancel();
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setPreview(null);
        }}
      >
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={downStage}
          onMouseMove={move}
          onMouseUp={up}
        >
          <Layer
            x={view.panX}
            y={view.panY}
            scaleX={view.zoom}
            scaleY={view.zoom}
          >
            {grid.map((x) => (
              <Line
                key={`x${x}`}
                points={[
                  x,
                  (0 - view.panY) / view.zoom,
                  x,
                  (size.height - view.panY) / view.zoom,
                ]}
                stroke="#dce7e7"
                strokeWidth={1 / view.zoom}
                listening={false}
              />
            ))}
            {gridY.map((y) => (
              <Line
                key={`y${y}`}
                points={[
                  (0 - view.panX) / view.zoom,
                  y,
                  (size.width - view.panX) / view.zoom,
                  y,
                ]}
                stroke="#dce7e7"
                strokeWidth={1 / view.zoom}
                listening={false}
              />
            ))}
            <Line
              points={shown.flatMap((p) => [p.x, p.y])}
              closed
              fill="#fff"
              stroke={preview && !preview.valid ? "#d34b4b" : "#263d50"}
              strokeWidth={5 / view.zoom}
              listening={false}
            />
            <FurnitureLayer zoom={view.zoom} />
            {room.polygon.map((a, i) => {
              const b = room.polygon[(i + 1) % room.polygon.length];
              return (
                <Line
                  key={a.id}
                  points={[a.x, a.y, b.x, b.y]}
                  stroke={selected?.id === a.id ? "#1a9a8d" : "#263d50"}
                  strokeWidth={(selected?.id === a.id ? 6 : 3) / view.zoom}
                  hitStrokeWidth={12 / view.zoom}
                  onMouseDown={(e) => downEdge(e, a.id)}
                />
              );
            })}
            {room.polygon.map((a, i) => {
              const b = room.polygon[(i + 1) % room.polygon.length];
              const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
              return length * view.zoom > 55 ? (
                <Text
                  key={`label-${a.id}`}
                  x={(a.x + b.x) / 2 - 20 / view.zoom}
                  y={(a.y + b.y) / 2 - 18 / view.zoom}
                  text={`${length} mm`}
                  fontSize={11 / view.zoom}
                  fill="#526b77"
                  listening={false}
                />
              ) : null;
            })}
            <Text
              x={box.minX + box.width / 2 - 300}
              y={box.minY + box.depth / 2}
              text={`${box.width} × ${box.depth} mm`}
              fontSize={14 / view.zoom}
              fill="#657685"
              listening={false}
            />
          </Layer>
        </Stage>
      </div>
      {(message ||
        preview?.message ||
        furniturePreview?.message ||
        furnitureMessage) && (
        <div
          role={preview || furniturePreview ? undefined : "status"}
          className={styles.canvasMessage}
        >
          {preview?.message ||
            furniturePreview?.message ||
            message ||
            furnitureMessage}
        </div>
      )}
    </div>
  );
}
