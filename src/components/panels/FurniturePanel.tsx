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
} from "../../features/furniture/commands";
import type { CommandResult } from "../../features/room/commands";
import type { FurnitureItem, RotationDeg } from "../../types/model";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import { NumberField } from "../common/NumberField";
import styles from "../../styles/App.module.css";
import { useState } from "react";
export function FurniturePanel({ item }: { item: FurnitureItem }) {
  const project = useProjectStore((s) => s.project),
    setSelected = useUIStore((s) => s.setSelected);
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
  function result(r: CommandResult) {
    if (!r.ok) setError(r.issues.map(issueText).join(" "));
    else {
      setError("");
      if (
        r.kind === "Committed" &&
        r.affectedIds[0] &&
        r.affectedIds[0] !== item.id
      )
        setSelected({ kind: "furniture", id: r.affectedIds[0] });
    }
  }
  function resize(key: "widthMm" | "depthMm" | "heightMm", value: number) {
    result(
      resizeFurniture({
        itemId: item.id,
        widthMm: key === "widthMm" ? value : item.widthMm,
        depthMm: key === "depthMm" ? value : item.depthMm,
        heightMm: key === "heightMm" ? value : item.heightMm,
      }),
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
          onBlur={(e) =>
            result(renameFurniture({ itemId: item.id, name: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
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
            }),
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
            }),
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
          disabled={!catalog.some((entry) => entry.id === item.catalogId)}
          onClick={() => result(resetFurnitureSize({ itemId: item.id }))}
        >
          원래 크기로
        </button>
        <button
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
