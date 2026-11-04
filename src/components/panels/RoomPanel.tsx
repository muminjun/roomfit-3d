import { useEffect, useId, useRef, useState } from "react";
import { LIMITS } from "../../config/limits";
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
  const nameErrorId = useId(), draftId = useId(), cancelNameBlur = useRef(false);
  type DraftKey = "offset" | "start" | "width" | "depth";
  const [draftErrors, setDraftErrors] = useState<Partial<Record<DraftKey, string>>>({});
  const draftBaseline = useRef<Partial<Record<DraftKey, string>>>({});
  const [nameError, setNameError] = useState("");
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
  function result(result: CommandResult, field = false): CommandResult {
    if (!result.ok) { if (!field) setError(result.issues.map((i) => i.message).join(" ")); }
    else {
      setError("");
      if (result.kind === "Committed" && result.selectedEdgeId)
        setSelected({ kind: "wall", id: result.selectedEdgeId });
    }
    return result;
  }
  function numeric(value: string) {
    return /^-?\d+$/.test(value.replace(/[\s,]/g, ""))
      ? Number(value.replace(/[\s,]/g, ""))
      : NaN;
  }
  function draftField(key: DraftKey, label: string, value: string, setValue: (value: string) => void) {
    const error = draftErrors[key], hint = `${draftId}-${key}-hint`, errorId = `${draftId}-${key}-error`;
    return <label className={styles.field}>{label}
      <input aria-label={label} value={value} aria-invalid={error ? true : undefined} aria-describedby={`${hint}${error ? ` ${errorId}` : ""}`}
        onFocus={() => { if (!error) draftBaseline.current[key] = value; }}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape" && (value !== draftBaseline.current[key] || error)) { e.preventDefault(); e.stopPropagation(); setValue(draftBaseline.current[key] ?? value); setDraftErrors(current => ({...current,[key]:undefined})); e.currentTarget.blur(); } }} />
      <small id={hint}>정수 mm 단위</small>
      {error && <small id={errorId} role="alert" className={styles.error}>{error}</small>}
    </label>;
  }
  function applyWall() {
    const distance = numeric(offset);
    if (!Number.isSafeInteger(distance)) { setDraftErrors({offset:"정수 치수를 입력해 주세요."}); return; }
    if (!a) return;
    const r = moveWallSegment({startVertexId:a.id, offsetMm:distance});
    setDraftErrors(r.ok ? {} : {offset:r.issues.map(i => i.message).join(" ")});
    result(r, true);
  }
  function applyNotch(type: "indent" | "protrude") {
    if (!a) return;
    const values = {start:numeric(start), width:numeric(width), depth:numeric(depth)};
    const field = (["start", "width", "depth"] as const).find(key => !Number.isSafeInteger(values[key]));
    if (field) { setDraftErrors({[field]:"정수 치수를 입력해 주세요."}); return; }
    const short = (["start", "width", "depth"] as const).find(key => values[key] < LIMITS.minWallLength);
    if (short) { setDraftErrors({[short]:`최소 ${LIMITS.minWallLength} mm 이상 입력해 주세요.`}); return; }
    if (values.start + values.width > length - LIMITS.minWallLength) { setDraftErrors({width:`선택한 벽 양 끝에 ${LIMITS.minWallLength} mm 이상 남겨 주세요.`}); return; }
    const r = addRoomNotch({startVertexId:a.id,startOffsetMm:values.start,widthMm:values.width,depthMm:values.depth,type});
    setDraftErrors(r.ok ? {} : {depth:r.issues.map(i => i.message).join(" ")});
    result(r, true);
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
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          onBlur={(e) => {
            if (cancelNameBlur.current) { cancelNameBlur.current = false; return; }
            const r = renameProject({ title: e.target.value });
            setNameError(r.ok ? "" : r.issues.map(i => i.message).join(" "));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape" && (e.currentTarget.value !== project.title || nameError)) {
              e.preventDefault(); e.stopPropagation(); e.currentTarget.value = project.title; setNameError(""); cancelNameBlur.current = true; e.currentTarget.blur();
            }
          }}
        />
        {nameError && <small id={nameErrorId} role="alert" className={styles.error}>{nameError}</small>}
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
                setRectangleDimensions({ widthMm: value, depthMm: box.depth }), true,
              )
            }
          />
          <NumberField
            label="전체 세로 (mm)"
            value={box.depth}
            onCommit={(value) =>
              result(
                setRectangleDimensions({ widthMm: box.width, depthMm: value }), true,
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
        onCommit={(value) => result(updateRoomHeight({ wallHeightMm: value }), true)}
      />
      <NumberField
        label="벽 두께 (mm)"
        value={project.room.wallThicknessMm}
        onCommit={(value) =>
          result(updateWallThickness({ wallThicknessMm: value }), true)
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
          {draftField("offset", "벽 이동 거리 (mm)", offset, setOffset)}
          <button onClick={applyWall}>벽 이동 적용</button>
          <hr />
          {draftField("start", "시작 위치 (mm)", start, setStart)}
          {draftField("width", "폭 (mm)", width, setWidth)}
          {draftField("depth", "깊이 (mm)", depth, setDepth)}
          <div className={styles.actions}>
            <button onClick={() => applyNotch("indent")}>함몰 적용</button>
            <button onClick={() => applyNotch("protrude")}>돌출 적용</button>
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
