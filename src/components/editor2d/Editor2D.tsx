import {
  saveOpening,
  savePartition,
  saveZone,
} from "../../features/architecture/commands";
import {
  getOpeningHost,
  validateArchitecture,
} from "../../features/architecture/geometry";
import { projectSchema } from "../../types/schema";
import type { Opening, Partition, Zone, Room } from "../../types/model";
import {
  MeasurementControls,
  MeasurementLayer,
  type MeasurementPoint,
} from "./MeasurementLayer";
import { resolveShortcut } from "../../config/shortcuts";
import {
  describeFurnitureIssues,
  handleFurnitureShortcut,
} from "./furnitureShortcuts";
import { exportJson } from "../../features/project/exportJson";
import { useDuplicatePlacement } from "./useDuplicatePlacement";
import { FurnitureLayer } from "./FurnitureLayer";
import { OpeningLayer, ZonePartitionLayer } from "./ArchitectureLayer";
import { OperationOverlay } from "./OperationOverlay";
import { useCatalogDrop } from "./useCatalogDrop";
import { useEffect, useRef, useState } from "react";
import { clamp, useViewport } from "./useViewport";
import { Layer, Line, Stage, Text } from "./konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  addNotch,
  getBBox,
  getFurnitureRect,
  getNearestClearance,
  validateAllPlacements,
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
type ArchitectureItem =
  | { kind: "zone"; item: Zone }
  | { kind: "partition"; item: Partition }
  | { kind: "opening"; item: Opening };
type Gesture =
  | {
      kind: "architecture";
      original: ArchitectureItem;
      start: Point;
      current: ArchitectureItem;
      valid: boolean;
      moved: boolean;
    }
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
  const [architecturePreview, setArchitecturePreview] =
    useState<ArchitectureItem | null>(null);
  const [measurement, setMeasurement] = useState<MeasurementPoint[]>([]);
  const activeView = useUIStore((s) => s.view);
  const [altDown, setAltDown] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<{
    kind: "wall" | "furniture";
    id: string;
  } | null>(null);
  const project = useProjectStore((s) => s.project);
  useEffect(() => {
    setHoverTarget(null);
  }, [selected?.id, view]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.isComposing || document.querySelector('[aria-modal="true"]'))
        return;
      if (e.key === "Alt" && document.activeElement === ref.current)
        setAltDown(true);
      if (
        resolveShortcut(e) === "cancel" &&
        document.activeElement === ref.current
      ) {
        const ui = useUIStore.getState();
        const hadDraft =
          !!gesture.current ||
          !!ui.preview ||
          !!ui.furniturePreview ||
          !!ui.duplicatePlacementId ||
          !!ui.draggedCatalogId ||
          measurement.length > 0;
        gesture.current = null;
        space.current = false;
        setPreview(null);
        setMessage("");
        setMeasurement([]);
        setArchitecturePreview(null);
        ui.setDuplicatePlacementId(null);
        ui.setFurniturePreview(null);
        ui.setDraggedCatalogId(null);
        window.dispatchEvent(new Event("roomfit-cancel-drag"));
        if (!hadDraft) ui.setSelected(null);
        e.preventDefault();
        return;
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
        else if (action === "fitSelection" && selected?.kind === "furniture") {
          const ids = useUIStore.getState().selectedFurnitureIds;
          const items = useProjectStore
            .getState()
            .project.furniture.filter((f) => ids.includes(f.id));
          if (items.length) {
            const bounds = items.map(getFurnitureRect);
            const r = {
                minX: Math.min(...bounds.map((b) => b.minX)),
                maxX: Math.max(...bounds.map((b) => b.maxX)),
                minY: Math.min(...bounds.map((b) => b.minY)),
                maxY: Math.max(...bounds.map((b) => b.maxY)),
              },
              width = r.maxX - r.minX,
              height = r.maxY - r.minY;
            const zoom = clamp(
              Math.min(
                (size.width - 100) / width,
                (size.height - 100) / height,
              ),
              0.02,
              1.5,
            );
            setView({
              zoom,
              panX: size.width / 2 - ((r.minX + r.maxX) / 2) * zoom,
              panY: size.height / 2 - ((r.minY + r.maxY) / 2) * zoom,
            });
          }
        } else if (action === "fitSelection" && selected?.kind === "wall") {
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
          action === "protrude" ||
          action === "measure"
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
        else if (action === "view2d" || action === "view3d") {
          window.dispatchEvent(new Event("roomfit-cancel-drag"));
          useUIStore.getState().setView(action === "view3d" ? "3d" : "2d");
        }
      }
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
      if (e.key === "Alt") setAltDown(false);
    };
    const cancel = () => {
      gesture.current = null;
      setPreview(null);
      space.current = false;
      setAltDown(false);
      setMeasurement([]);
      setArchitecturePreview(null);
      setHoverTarget(null);
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
  }, [
    fit,
    setPreview,
    size,
    selected,
    room.polygon,
    ref,
    setView,
    measurement,
  ]);
  useEffect(() => {
    gesture.current = null;
    setArchitecturePreview(null);
    setPreview(null);
    useUIStore.getState().setFurnitureMessage("");
    window.dispatchEvent(new Event("roomfit-cancel-drag"));
  }, [tool, project, activeView, setPreview]);
  useEffect(() => {
    setMeasurement([]);
  }, [tool, projectId, activeView]);
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
  function roomWithArchitecture(base: Room, draft: ArchitectureItem): Room {
    if (draft.kind === "zone")
      return {
        ...base,
        zones: base.zones?.map((i) =>
          i.id === draft.item.id ? draft.item : i,
        ),
      };
    if (draft.kind === "partition")
      return {
        ...base,
        partitions: base.partitions?.map((i) =>
          i.id === draft.item.id ? draft.item : i,
        ),
      };
    return {
      ...base,
      openings: base.openings?.map((i) =>
        i.id === draft.item.id ? draft.item : i,
      ),
    };
  }
  function downArchitecture(
    e: KonvaEventObject<MouseEvent>,
    kind: "zone" | "partition" | "opening",
    id: string,
  ) {
    if (tool !== "architectureMove" || e.evt.button !== 0 || space.current)
      return;
    const p = pointer(e);
    if (!p) return;
    const item =
      kind === "zone"
        ? room.zones?.find((i) => i.id === id)
        : kind === "partition"
          ? room.partitions?.find((i) => i.id === id)
          : room.openings?.find((i) => i.id === id);
    if (!item) return;
    e.cancelBubble = true;
    ref.current?.focus();
    setSelected({ kind, id });
    const original = { kind, item } as ArchitectureItem;
    gesture.current = {
      kind: "architecture",
      original,
      start: p,
      current: original,
      valid: true,
      moved: false,
    };
  }
  function downEdge(e: KonvaEventObject<MouseEvent>, id: string) {
    ref.current?.focus();
    if (
      e.evt.button === 1 ||
      space.current ||
      tool === "measure" ||
      tool === "architectureMove"
    )
      return;
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
    if (g.kind === "architecture") {
      if (Math.hypot(p.x - g.start.x, p.y - g.start.y) * view.zoom < 3) {
        g.current = g.original;
        g.moved = false;
        g.valid = true;
        setArchitecturePreview(null);
        setMessage("");
        return;
      }
      const dx = snap(p.x - g.start.x),
        dy = snap(p.y - g.start.y);
      let next: ArchitectureItem;
      if (g.original.kind === "zone") {
        const item = g.original.item;
        next = {
          kind: "zone",
          item: { ...item, x: item.x + dx, y: item.y + dy },
        };
      } else if (g.original.kind === "partition") {
        const item = g.original.item;
        next = {
          kind: "partition",
          item: {
            ...item,
            start: { x: item.start.x + dx, y: item.start.y + dy },
            end: { x: item.end.x + dx, y: item.end.y + dy },
          },
        };
      } else {
        const item = g.original.item,
          host = getOpeningHost(room, item);
        if (!host) return;
        const shift =
          (p.x - g.start.x) * host.tangent.x +
          (p.y - g.start.y) * host.tangent.y;
        next = {
          kind: "opening",
          item: { ...item, offsetMm: snap(item.offsetMm + shift) },
        };
      }
      const nextRoom = roomWithArchitecture(room, next);
      const errors = validateArchitecture(nextRoom).filter(
        (i) => i.itemId === next.item.id,
      );
      const parsed = projectSchema.safeParse({ ...project, room: nextRoom });
      g.current = next;
      g.moved = JSON.stringify(next.item) !== JSON.stringify(g.original.item);
      g.valid = parsed.success && errors.length === 0;
      setArchitecturePreview(next);
      setMessage(
        g.valid
          ? ""
          : errors.map((i) => i.message).join(" ") || "유효한 위치가 아닙니다.",
      );
      return;
    }
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
    if (g.kind === "architecture") {
      if (g.valid && g.moved) {
        const result =
          g.current.kind === "zone"
            ? saveZone(g.current.item)
            : g.current.kind === "partition"
              ? savePartition(g.current.item)
              : saveOpening(g.current.item);
        setMessage(
          result.ok ? "" : result.issues.map((i) => i.message).join(" "),
        );
      }
      gesture.current = null;
      setArchitecturePreview(null);
      return;
    }
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
    if (tool === "measure") {
      const p = pointer(e);
      if (p) {
        const point = {
          x: settings.snapEnabled ? snap(p.x) : Math.round(p.x * 2) / 2,
          y: settings.snapEnabled ? snap(p.y) : Math.round(p.y * 2) / 2,
        };
        setMeasurement((current) =>
          current.length === 1 ? [...current, point] : [point],
        );
      }
      return;
    }
    if (useUIStore.getState().duplicatePlacementId) {
      duplicate.commit();
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
        <button
          title="방 전체가 캔버스 안에 들어오도록 화면을 맞춥니다. 도면 데이터는 바뀌지 않습니다."
          onClick={fit}
        >
          전체 보기
        </button>
        <button
          onClick={() => useUIStore.getState().setTool("architectureMove")}
          aria-pressed={tool === "architectureMove"}
        >
          구조 편집
        </button>
        <button
          aria-label="축소"
          title="캔버스 중심을 기준으로 화면을 축소합니다."
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
          title="캔버스 중심을 기준으로 화면을 확대합니다."
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
          title="휠을 줌에 사용할지 화면 이동에 사용할지 전환합니다. Space·중간 버튼 드래그로도 이동할 수 있습니다."
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
        data-architecture-preview-valid={
          gesture.current?.kind === "architecture" && architecturePreview
            ? String(gesture.current.valid)
            : undefined
        }
        aria-label="2D 편집 영역"
        onPointerLeave={() => {
          gesture.current = null;
          setPreview(null);
          setMessage("");
          setHoverTarget(null);
          setArchitecturePreview(null);
          window.dispatchEvent(new Event("roomfit-cancel-drag"));
          duplicate.cancel();
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setPreview(null);
          space.current = false;
          setAltDown(false);
          setMeasurement([]);
          setHoverTarget(null);
          setArchitecturePreview(null);
          window.dispatchEvent(new Event("roomfit-cancel-drag"));
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
            <ZonePartitionLayer
              room={
                architecturePreview
                  ? roomWithArchitecture(room, architecturePreview)
                  : room
              }
              zoom={view.zoom}
              interactive={tool === "architectureMove"}
              selectedId={selected?.id}
              invalidId={
                gesture.current?.kind === "architecture" &&
                !gesture.current.valid
                  ? gesture.current.current.item.id
                  : undefined
              }
              onDown={downArchitecture}
            />
            <MeasurementLayer points={measurement} zoom={view.zoom} />
            {selected?.kind === "furniture" &&
              (() => {
                const item = project.furniture.find(
                  (f) => f.id === selected.id,
                );
                return item ? (
                  <OperationOverlay
                    item={item}
                    room={room}
                    items={project.furniture}
                  />
                ) : null;
              })()}
            <FurnitureLayer
              zoom={view.zoom}
              isPan={(event) => event.button === 1 || space.current}
              onHover={(id) =>
                setHoverTarget(id ? { kind: "furniture", id } : null)
              }
            />
            {room.polygon.map((a, i) => {
              const b = room.polygon[(i + 1) % room.polygon.length];
              return (
                <Line
                  key={a.id}
                  points={[a.x, a.y, b.x, b.y]}
                  stroke={selected?.id === a.id ? "#1a9a8d" : "#263d50"}
                  strokeWidth={(selected?.id === a.id ? 6 : 3) / view.zoom}
                  hitStrokeWidth={12 / view.zoom}
                  onMouseEnter={() =>
                    setHoverTarget({ kind: "wall", id: a.id })
                  }
                  onMouseLeave={() => setHoverTarget(null)}
                  onMouseDown={(e) => downEdge(e, a.id)}
                />
              );
            })}
            <OpeningLayer
              room={
                architecturePreview
                  ? roomWithArchitecture(room, architecturePreview)
                  : room
              }
              items={project.furniture}
              zoom={view.zoom}
              interactive={tool === "architectureMove"}
              selectedId={selected?.id}
              invalidId={
                gesture.current?.kind === "architecture" &&
                !gesture.current.valid
                  ? gesture.current.current.item.id
                  : undefined
              }
              onDown={downArchitecture}
            />
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
      {tool === "measure" && (
        <MeasurementControls points={measurement} onChange={setMeasurement} />
      )}
      {altDown &&
        hoverTarget &&
        selected?.kind === "furniture" &&
        (() => {
          const item = project.furniture.find((f) => f.id === selected.id);
          if (
            !item ||
            (hoverTarget.kind === "furniture" && hoverTarget.id === item.id)
          )
            return null;
          const target =
            hoverTarget.kind === "wall"
              ? "벽"
              : project.furniture.find((f) => f.id === hoverTarget.id)?.name;
          if (!target) return null;
          const validity = validateAllPlacements(
            project.room,
            project.furniture,
          )[item.id];
          const d = validity?.valid
            ? getNearestClearance(project.room, project.furniture, item)
            : null;
          return (
            <div role="status" aria-label="거리 측정">
              {item.name} → {target}:{" "}
              {d
                ? `도면상 최단거리: ←${d.left} →${d.right} ↑${d.up} ↓${d.down} mm`
                : `먼저 배치 오류를 해결하세요: ${describeFurnitureIssues(validity?.issues ?? [], project.furniture)}`}
            </div>
          );
        })()}
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
