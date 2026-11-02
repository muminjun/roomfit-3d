import { useEffect, useState } from "react";
import { NumberField } from "../common/NumberField";
import {
  addRoomNotch,
  moveWallSegment,
  renameProject,
  setRectangleDimensions,
  updateRoomHeight,
  updateWallThickness,
  type CommandResult,
} from "../../features/room/commands";
import { getBBox, getRoomArea } from "../../lib/geometry";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";

export function RoomPanel() {
  const project = useProjectStore((s) => s.project),
    selected = useUIStore((s) => s.selected),
    setSelected = useUIStore((s) => s.setSelected),
    setSettings = useProjectStore((s) => s.setSettings);
  const [error, setError] = useState(""),
    [offset, setOffset] = useState("200"),
    [start, setStart] = useState("1700"),
    [width, setWidth] = useState("800"),
    [depth, setDepth] = useState("500");
  const polygon = project.room.polygon,
    box = getBBox(polygon),
    index =
      selected?.kind === "wall"
        ? polygon.findIndex((p) => p.id === selected.id)
        : -1;
  const a = index >= 0 ? polygon[index] : null,
    b = index >= 0 ? polygon[(index + 1) % polygon.length] : null;
  const length = a && b ? Math.abs(a.x - b.x) + Math.abs(a.y - b.y) : 0;
  useEffect(() => {
    if (a && b) setStart(String(Math.floor((length - Number(width)) / 2)));
  }, [a?.id, b?.id, length]); // Selected wall changes reset the suggested start.
  useEffect(() => {
    if (selected?.kind === "wall" && index < 0) setSelected(null);
  }, [index, selected, setSelected]);
  function result(result: CommandResult) {
    if (!result.ok) setError(result.issues.map((i) => i.message).join(" "));
    else {
      setError("");
      if (result.kind === "Committed" && result.selectedEdgeId)
        setSelected({ kind: "wall", id: result.selectedEdgeId });
    }
  }
  function numeric(value: string) {
    return /^-?\d+$/.test(value.replace(/[\s,]/g, ""))
      ? Number(value.replace(/[\s,]/g, ""))
      : NaN;
  }
  return (
    <aside className={styles.panel}>
      <p className={styles.eyebrow}>PROPERTIES</p>
      <h2>방 정보</h2>
      <label className={styles.field}>
        프로젝트 이름
        <input
          defaultValue={project.title}
          key={project.title}
          onBlur={(e) => result(renameProject({ title: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </label>
      <div className={styles.info}>
        <span>바닥 면적</span>
        <b>{(getRoomArea(polygon) / 1e6).toFixed(2)} ㎡</b>
      </div>
      {polygon.length === 4 ? (
        <>
          <NumberField
            label="전체 가로 (mm)"
            value={box.width}
            onCommit={(value) =>
              result(
                setRectangleDimensions({ widthMm: value, depthMm: box.depth }),
              )
            }
          />
          <NumberField
            label="전체 세로 (mm)"
            value={box.depth}
            onCommit={(value) =>
              result(
                setRectangleDimensions({ widthMm: box.width, depthMm: value }),
              )
            }
          />
        </>
      ) : (
        <div className={styles.info}>
          <span>전체 경계 크기</span>
          <b>
            {box.width} × {box.depth} mm
          </b>
        </div>
      )}
      <NumberField
        label="벽 높이 (mm)"
        value={project.room.wallHeightMm}
        onCommit={(value) => result(updateRoomHeight({ wallHeightMm: value }))}
      />
      <NumberField
        label="벽 두께 (mm)"
        value={project.room.wallThicknessMm}
        onCommit={(value) =>
          result(updateWallThickness({ wallThicknessMm: value }))
        }
      />
      <div className={styles.controlGroup}>
        <label>
          <input
            type="checkbox"
            checked={project.settings.gridVisible}
            onChange={(e) => setSettings({ gridVisible: e.target.checked })}
          />{" "}
          격자 표시
        </label>
        <label>
          <input
            type="checkbox"
            checked={project.settings.snapEnabled}
            onChange={(e) => setSettings({ snapEnabled: e.target.checked })}
          />{" "}
          스냅
        </label>
        <label>
          격자 간격{" "}
          <select
            value={project.settings.gridSizeMm}
            onChange={(e) =>
              setSettings({
                gridSizeMm: Number(e.target.value) as 10 | 50 | 100 | 500,
              })
            }
          >
            {[10, 50, 100, 500].map((n) => (
              <option key={n} value={n}>
                {n} mm
              </option>
            ))}
          </select>
        </label>
      </div>
      <h3>벽 선택</h3>
      <div className={styles.wallList}>
        {polygon.map((p, i) => (
          <button
            key={p.id}
            aria-pressed={selected?.id === p.id}
            onClick={() => setSelected({ kind: "wall", id: p.id })}
          >
            벽 {i + 1} 선택
          </button>
        ))}
      </div>
      {a && b && (
        <div className={styles.controlGroup}>
          <b>선택한 벽 · {length} mm</b>
          <small>
            ({a.x}, {a.y}) → ({b.x}, {b.y})
          </small>
          <p>바깥쪽 + / 안쪽 −</p>
          <label className={styles.field}>
            벽 이동 거리 (mm)
            <input value={offset} onChange={(e) => setOffset(e.target.value)} />
          </label>
          <button
            onClick={() =>
              result(
                moveWallSegment({
                  startVertexId: a.id,
                  offsetMm: numeric(offset),
                }),
              )
            }
          >
            벽 이동 적용
          </button>
          <hr />
          <label className={styles.field}>
            시작 위치 (mm)
            <input value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className={styles.field}>
            폭 (mm)
            <input value={width} onChange={(e) => setWidth(e.target.value)} />
          </label>
          <label className={styles.field}>
            깊이 (mm)
            <input value={depth} onChange={(e) => setDepth(e.target.value)} />
          </label>
          <div className={styles.actions}>
            <button
              onClick={() =>
                result(
                  addRoomNotch({
                    startVertexId: a.id,
                    startOffsetMm: numeric(start),
                    widthMm: numeric(width),
                    depthMm: numeric(depth),
                    type: "indent",
                  }),
                )
              }
            >
              함몰 적용
            </button>
            <button
              onClick={() =>
                result(
                  addRoomNotch({
                    startVertexId: a.id,
                    startOffsetMm: numeric(start),
                    widthMm: numeric(width),
                    depthMm: numeric(depth),
                    type: "protrude",
                  }),
                )
              }
            >
              돌출 적용
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </aside>
  );
}
