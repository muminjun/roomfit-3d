import { catalog } from "../../data/catalog";
import { COLORS } from "../../config/limits";
import {
  getFurnitureRect,
  getNearestClearance,
  validateAllPlacements,
} from "../../lib/geometry";
import {
  deleteFurniture,
  duplicateFurniture,
  moveFurniture,
  renameFurniture,
  resetFurnitureSize,
  resizeFurniture,
  rotateFurniture,
  setFurnitureColor,
  setFurnitureOperation,
} from "../../features/furniture/commands";
import { getOperationWarnings } from "../../features/furniture/operation";
import type { CommandResult } from "../../features/room/commands";
import type { FurnitureItem, RotationDeg } from "../../types/model";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import { NumberField } from "../common/NumberField";
import styles from "../../styles/App.module.css";
import { useId, useRef, useState } from "react";
export function FurniturePanel({ item }: { item: FurnitureItem }) {
  const project = useProjectStore((s) => s.project),
    setSelected = useUIStore((s) => s.setSelected);
  const nameErrorId = useId(), cancelNameBlur = useRef(false);
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");
  const validation = validateAllPlacements(project.room, project.furniture)[
      item.id
    ],
    rect = getFurnitureRect(item),
    clearance = validation.valid
      ? getNearestClearance(project.room, project.furniture, item)
      : null;
  function issueText(issue: { message: string; targetId?: string }) {
    const other = project.furniture.find(
      (f) => f.id === issue.targetId && f.id !== item.id,
    );
    return other ? `${issue.message}（${other.name}）` : issue.message;
  }
  function result(r: CommandResult, field = false): CommandResult {
    if (!r.ok) { if (!field) setError(r.issues.map(issueText).join(" ")); }
    else {
      setError("");
      if (
        r.kind === "Committed" &&
        r.affectedIds[0] &&
        r.affectedIds[0] !== item.id
      )
        setSelected({ kind: "furniture", id: r.affectedIds[0] });
    }
    return r;
  }
  function resize(key: "widthMm" | "depthMm" | "heightMm", value: number) {
    return result(
      resizeFurniture({
        itemId: item.id,
        widthMm: key === "widthMm" ? value : item.widthMm,
        depthMm: key === "depthMm" ? value : item.depthMm,
        heightMm: key === "heightMm" ? value : item.heightMm,
      }), true,
    );
  }
  return (
    <aside className={styles.panel}>
      <p className={styles.eyebrow}>FURNITURE</p>
      <h2>{item.name}</h2>
      <p className={styles.muted}>
        {rect.maxX - rect.minX} × {rect.maxY - rect.minY} mm
      </p>
      {!validation.valid && (
        <p role="alert" className={styles.error}>
          배치 경고: {validation.issues.map(issueText).join(" ")} 이동하거나
          크기를 조정하여 복구해 주세요.
        </p>
      )}
      <label className={styles.field}>
        가구 이름
        <input
          key={item.name}
          defaultValue={item.name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          onBlur={(e) => {
            if (cancelNameBlur.current) { cancelNameBlur.current = false; return; }
            const r = renameFurniture({ itemId: item.id, name: e.target.value });
            setNameError(r.ok ? "" : r.issues.map(issueText).join(" "));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape" && (e.currentTarget.value !== item.name || nameError)) {
              e.preventDefault(); e.stopPropagation(); e.currentTarget.value = item.name; setNameError(""); cancelNameBlur.current = true; e.currentTarget.blur();
            }
          }}
        />
        {nameError && <small id={nameErrorId} role="alert" className={styles.error}>{nameError}</small>}
      </label>
      <NumberField
        half
        label="위치 X (mm)"
        value={item.position.x}
        onCommit={(value) =>
          result(
            moveFurniture({
              itemId: item.id,
              position: { ...item.position, x: value },
            }), true,
          )
        }
      />
      <NumberField
        half
        label="위치 Y (mm)"
        value={item.position.y}
        onCommit={(value) =>
          result(
            moveFurniture({
              itemId: item.id,
              position: { ...item.position, y: value },
            }), true,
          )
        }
      />
      <NumberField
        label="가로 W (mm)"
        value={item.widthMm}
        onCommit={(value) => resize("widthMm", value)}
      />
      <NumberField
        label="깊이 D (mm)"
        value={item.depthMm}
        onCommit={(value) => resize("depthMm", value)}
      />
      <NumberField
        label="높이 H (mm)"
        value={item.heightMm}
        onCommit={(value) => resize("heightMm", value)}
      />
      <label className={styles.field}>
        색상
        <select
          value={item.color ?? COLORS[0]}
          onChange={(e) =>
            result(
              setFurnitureColor({ itemId: item.id, color: e.target.value }),
            )
          }
        >
          {COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.toolList}>
        <button
          title="중심을 유지하며 90° 회전합니다. 공간이 부족해도 회전하고 배치 경고를 표시합니다."
          onClick={() =>
            result(
              rotateFurniture({
                itemId: item.id,
                rotationDeg: ((item.rotationDeg + 90) % 360) as RotationDeg,
              }),
            )
          }
        >
          90° 회전
        </button>
        <button
          title="가로·깊이·높이를 카탈로그의 원래 치수로 되돌립니다. 배치할 수 없는 크기면 사유를 안내합니다."
          disabled={!catalog.some((entry) => entry.id === item.catalogId)}
          onClick={() => result(resetFurnitureSize({ itemId: item.id }))}
        >
          원래 크기로
        </button>
        <button
          title="원본 주변의 빈자리에 복제합니다. 빈자리를 찾지 못하면 도면에서 복제 위치를 지정하세요."
          onClick={() => {
            const r = duplicateFurniture({ itemId: item.id });
            if (!r.ok && r.issues.some((i) => i.code === "NO_PLACEMENT")) {
              useUIStore.getState().setDuplicatePlacementId(item.id);
              setError("복제 위치 선택: 캔버스에서 위치를 지정하세요.");
            } else result(r);
          }}
        >
          복제
        </button>
        <button
          title="선택한 가구를 삭제합니다. 실행 취소로 복원할 수 있습니다."
          onClick={() => {
            const r = deleteFurniture({ itemId: item.id });
            result(r);
            if (r.ok) setSelected(null);
          }}
        >
          삭제
        </button>
      </div>
      {!validation.valid && (
        <p className={styles.muted}>먼저 배치 오류를 해결하세요.</p>
      )}
      {item.operation && <div className={styles.controlGroup}>
        <b>여는 공간 계획 여유</b>
        <small>앞면 전체를 기준으로 한 보수적인 계획 여유입니다. 실제 제품의 문 궤적이나 설치 기준은 아닙니다.</small>
        <label><input type="checkbox" checked={item.operation.enabled} onChange={e => result(setFurnitureOperation({itemId:item.id, operation:{...item.operation!, enabled:e.target.checked}}))} /> 여는 공간 표시</label>
        <NumberField label="여는 공간 여유 (mm)" value={item.operation.clearanceMm} min={0} max={3000}
          onCommit={value => result(setFurnitureOperation({itemId:item.id, operation:{...item.operation!, clearanceMm:value}}), true)} />
        {item.operation.enabled && item.operation.clearanceMm > 0 && <p role="status">{(() => { const warnings = getOperationWarnings(project.room, project.furniture, item); return warnings.length ? `여는 공간에 장애물: ${warnings.map(w => w.name).join(", ")}` : "여는 공간에 장애물이 없습니다."; })()}</p>}
      </div>}
      {clearance && (
        <div className={styles.controlGroup}>
          <b>도면상 최단거리</b>
          <small>
            왼쪽 {clearance.left} · 오른쪽 {clearance.right} · 위 {clearance.up}{" "}
            · 아래 {clearance.down} mm
          </small>
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
