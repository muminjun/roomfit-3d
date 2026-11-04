import {
  arrangeFurniture,
  deleteFurnitureBatch,
  duplicateFurnitureBatch,
  setFurnitureLocked,
  type Arrangement,
} from "../../features/furniture/batchCommands";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import type { FurnitureItem } from "../../types/model";
import type { CommandResult } from "../../features/room/commands";
let clipboard: FurnitureItem[] = [];
export function copySelectedFurniture() {
  const ids = useUIStore.getState().selectedFurnitureIds;
  clipboard = structuredClone(
    useProjectStore
      .getState()
      .project.furniture.filter((i) => ids.includes(i.id)),
  );
}
export function pasteFurniture() {
  return duplicateFurnitureBatch([], clipboard);
}
export function applyBatchResult(result: CommandResult, selectResult = false) {
  const ui = useUIStore.getState();
  ui.setFurnitureMessage(
    result.ok ? "" : result.issues.map((i) => i.message).join(" "),
  );
  if (result.ok && result.kind === "Committed" && selectResult)
    ui.setFurnitureSelection(result.affectedIds);
}
export function SelectionToolbar() {
  const ids = useUIStore((s) => s.selectedFurnitureIds),
    items = useProjectStore((s) => s.project.furniture);
  if (!ids.length) return null;
  const arrange = (mode: Arrangement) =>
    applyBatchResult(arrangeFurniture(ids, mode));
  const selected = items.filter((i) => ids.includes(i.id));
  return (
    <div
      role="toolbar"
      aria-label="가구 일괄 편집"
      style={{
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span>가구 {ids.length}개 선택</span>
      <details style={{ position: "relative" }}>
        <summary>선택 목록</summary>
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            top: "100%",
            left: 0,
            width: 200,
            maxHeight: 200,
            overflowY: "auto",
            background: "white",
            padding: 8,
            boxShadow: "0 2px 8px #0003",
          }}
        >
          {items.map((item) => (
            <label key={item.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={ids.includes(item.id)}
                onChange={(e) =>
                  useUIStore
                    .getState()
                    .setFurnitureSelection(
                      e.target.checked
                        ? [...ids, item.id]
                        : ids.filter((id) => id !== item.id),
                    )
                }
              />
              {item.name}
            </label>
          ))}
        </div>
      </details>
      <button onClick={() => applyBatchResult(setFurnitureLocked(ids, true))}>
        선택 잠금
      </button>
      <button onClick={() => applyBatchResult(setFurnitureLocked(ids, false))}>
        잠금 해제
      </button>
      <button
        onClick={() => {
          copySelectedFurniture();
        }}
      >
        복사
      </button>
      <button onClick={() => applyBatchResult(pasteFurniture(), true)}>
        붙여넣기
      </button>
      <button
        onClick={() => applyBatchResult(duplicateFurnitureBatch(ids), true)}
      >
        선택 복제
      </button>
      <button
        onClick={() => {
          const r = deleteFurnitureBatch(ids);
          applyBatchResult(r);
          if (r.ok) useUIStore.getState().setFurnitureSelection([]);
        }}
      >
        선택 삭제
      </button>
      {(
        [
          ["left", "왼쪽 정렬"],
          ["right", "오른쪽 정렬"],
          ["top", "위 정렬"],
          ["bottom", "아래 정렬"],
          ["centerX", "가로 중심 정렬"],
          ["centerY", "세로 중심 정렬"],
          ["distributeX", "가로 간격 분배"],
          ["distributeY", "세로 간격 분배"],
        ] as [Arrangement, string][]
      ).map(([mode, label]) => (
        <button
          key={mode}
          disabled={selected.length < (mode.startsWith("distribute") ? 3 : 2)}
          onClick={() => arrange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
