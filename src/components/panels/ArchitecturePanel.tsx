import { useEffect, useRef, useState } from "react";
import { createId } from "../../features/project/createProject";
import {
  savePartition,
  saveOpening,
  saveZone,
  deleteArchitecture,
} from "../../features/architecture/commands";
import {
  validateArchitecture,
  getDoorWarnings,
  getOpeningHost,
} from "../../features/architecture/geometry";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import type { Opening, Partition, Zone } from "../../types/model";
import type { CommandResult } from "../../features/room/commands";
import styles from "../../styles/App.module.css";

type Kind = "partition" | "opening" | "zone";
type Draft = { kind: Kind; id?: string; values: Record<string, string> };
const strings = (o: Record<string, string | number>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));

export function ArchitecturePanel() {
  const room = useProjectStore((s) => s.project.room);
  const furniture = useProjectStore((s) => s.project.furniture);
  const selected = useUIStore((s) => s.selected);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const lastSelection = useRef("");
  const lastItem = useRef("");
  const dirty = useRef(false);
  useEffect(() => {
    const validKind =
      selected && ["partition", "opening", "zone"].includes(selected.kind);
    const key = validKind ? `${selected.kind}:${selected.id}` : "";
    const selectionChanged = lastSelection.current !== key;
    lastSelection.current = key;
    const all = [
      ...(room.partitions ?? []),
      ...(room.openings ?? []),
      ...(room.zones ?? []),
    ];
    if (!validKind || !selected) {
      if (draft?.id && !all.some((i) => i.id === draft.id)) {
        setDraft(null);
        setError("");
      }
      return;
    }
    const list =
      selected.kind === "partition"
        ? room.partitions
        : selected.kind === "opening"
          ? room.openings
          : room.zones;
    const item = list?.find((i) => i.id === selected.id);
    if (!item) {
      if (draft?.id === selected.id) {
        setDraft(null);
        setError("");
      }
      if (useUIStore.getState().selected?.id === selected.id)
        useUIStore.getState().setSelected(null);
      lastItem.current = "";
      return;
    }
    const serialized = JSON.stringify(item);
    if (
      selectionChanged ||
      (draft?.id === item.id &&
        !dirty.current &&
        lastItem.current !== serialized)
    ) {
      edit(selected.kind as Kind, item);
      if (detailsRef.current) detailsRef.current.open = true;
    }
    lastItem.current = serialized;
  }, [selected?.kind, selected?.id, room]);
  const warnings = [
    ...validateArchitecture(room),
    ...getDoorWarnings(room, furniture),
  ];
  const hosts = [
    ...room.polygon.map((p, i) => ({ id: p.id, name: `외벽 ${i + 1}` })),
    ...(room.partitions ?? []).map((p) => ({
      id: p.id,
      name: `칸막이: ${p.name}`,
    })),
  ];
  const defaultHost =
    selected?.kind === "wall" && hosts.some((h) => h.id === selected.id)
      ? selected.id
      : (hosts[0]?.id ?? "");
  const xs = room.polygon.map((p) => p.x),
    ys = room.polygon.map((p) => p.y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys),
    width = Math.max(...xs) - minX,
    depth = Math.max(...ys) - minY;
  function newDraft(kind: Kind, openingKind: Opening["kind"] = "door") {
    dirty.current = false;
    setError("");
    if (kind === "partition")
      setDraft({
        kind,
        values: strings({
          name: "새 칸막이",
          startX: minX + 100,
          startY: minY + 100,
          endX: minX + Math.min(1100, width - 100),
          endY: minY + 100,
          thicknessMm: 100,
          heightMm: Math.min(2400, room.wallHeightMm),
        }),
      });
    if (kind === "opening") {
      const host = getOpeningHost(room, { hostId: defaultHost });
      const hostHeight = Math.min(
        host?.heightMm ?? room.wallHeightMm,
        room.wallHeightMm,
      );
      const height = Math.min(
        openingKind === "window" ? 1200 : 2100,
        hostHeight,
      );
      setDraft({
        kind,
        values: strings({
          name:
            openingKind === "window"
              ? "새 창문"
              : openingKind === "entrance"
                ? "새 현관문"
                : "새 문",
          kind: openingKind,
          hostId: defaultHost,
          offsetMm: 0,
          widthMm: Math.min(
            openingKind === "window"
              ? 1200
              : openingKind === "entrance"
                ? 900
                : 800,
            host?.length ?? 800,
          ),
          heightMm: height,
          sillMm:
            openingKind === "window" ? Math.min(900, hostHeight - height) : 0,
          hinge: "start",
          swing: "inward",
        }),
      });
    }
    if (kind === "zone")
      setDraft({
        kind,
        values: strings({
          name: "새 구역",
          kind: "living",
          x: minX + 100,
          y: minY + 100,
          widthMm: Math.min(1000, width - 200),
          depthMm: Math.min(1000, depth - 200),
        }),
      });
  }
  function edit(kind: Kind, item: Partition | Opening | Zone) {
    dirty.current = false;
    setError("");
    if (kind === "partition") {
      const p = item as Partition;
      setDraft({
        kind,
        id: p.id,
        values: strings({
          name: p.name,
          startX: p.start.x,
          startY: p.start.y,
          endX: p.end.x,
          endY: p.end.y,
          thicknessMm: p.thicknessMm,
          heightMm: p.heightMm,
        }),
      });
    }
    if (kind === "opening") {
      const p = item as Opening;
      setDraft({ kind, id: p.id, values: strings({ ...p }) });
    }
    if (kind === "zone") {
      const p = item as Zone;
      setDraft({ kind, id: p.id, values: strings({ ...p }) });
    }
  }
  function result(r: CommandResult) {
    if (!r.ok) {
      setError(r.issues.map((i) => i.message).join(" "));
      return false;
    }
    setError("");
    return true;
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const v = draft.values;
    const numeric =
      draft.kind === "partition"
        ? ["startX", "startY", "endX", "endY", "thicknessMm", "heightMm"]
        : draft.kind === "opening"
          ? ["offsetMm", "widthMm", "heightMm", "sillMm"]
          : ["x", "y", "widthMm", "depthMm"];
    if (
      !v.name.trim() ||
      numeric.some(
        (k) =>
          !/^-?\d+$/.test(v[k]?.trim() ?? "") ||
          !Number.isSafeInteger(Number(v[k])),
      )
    ) {
      setError("이름과 정수 치수를 입력해 주세요.");
      return;
    }
    const n = (key: string) => Number(v[key]);
    const id = draft.id ?? createId();
    let r: CommandResult;
    if (draft.kind === "partition")
      r = savePartition({
        id,
        name: v.name.trim(),
        start: { x: n("startX"), y: n("startY") },
        end: { x: n("endX"), y: n("endY") },
        thicknessMm: n("thicknessMm"),
        heightMm: n("heightMm"),
      });
    else if (draft.kind === "opening")
      r = saveOpening({
        id,
        name: v.name.trim(),
        kind: v.kind as Opening["kind"],
        hostId: v.hostId,
        offsetMm: n("offsetMm"),
        widthMm: n("widthMm"),
        heightMm: n("heightMm"),
        sillMm: n("sillMm"),
        hinge: v.hinge as Opening["hinge"],
        swing: v.swing as Opening["swing"],
      });
    else
      r = saveZone({
        id,
        name: v.name.trim(),
        kind: v.kind as Zone["kind"],
        x: n("x"),
        y: n("y"),
        widthMm: n("widthMm"),
        depthMm: n("depthMm"),
      });
    if (result(r)) setDraft(null);
  }
  const input = (key: string, label: string, numeric = true) => (
    <label className={styles.field}>
      {label}
      <input
        value={draft?.values[key] ?? ""}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(e) => {
          dirty.current = true;
          setDraft(
            (d) =>
              d && { ...d, values: { ...d.values, [key]: e.target.value } },
          );
        }}
      />
    </label>
  );
  const select = (
    key: string,
    label: string,
    choices: Array<[string, string]>,
  ) => (
    <label className={styles.field}>
      {label}
      <select
        value={draft?.values[key] ?? ""}
        onChange={(e) => {
          dirty.current = true;
          setDraft(
            (d) =>
              d && {
                ...d,
                values: {
                  ...d.values,
                  [key]: e.target.value,
                  ...(key === "kind" &&
                  d.kind === "opening" &&
                  e.target.value !== "window"
                    ? { sillMm: "0" }
                    : {}),
                },
              },
          );
        }}
      >
        {choices.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  const list = (kind: Kind, items: (Partition | Opening | Zone)[]) =>
    items.map((item) => (
      <div key={item.id} className={styles.actions}>
        <button type="button" onClick={() => edit(kind, item)}>
          {item.name} 편집
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(`${item.name} 항목을 삭제할까요?`) &&
              result(deleteArchitecture(kind, item.id)) &&
              draft?.id === item.id
            )
              setDraft(null);
          }}
        >
          {item.name} 삭제
        </button>
      </div>
    ));
  return (
    <details ref={detailsRef}>
      <summary>문·창문·구역</summary>
      <p className={styles.muted}>
        구역은 계획용 표시입니다. 배관 및 구조 가능성은 별도로 확인해 주세요.
      </p>
      {warnings.map((warning, i) => (
        <p
          key={`${warning.itemId}-${warning.code}-${i}`}
          className={styles.error}
        >
          {warning.message}
        </p>
      ))}
      <div className={styles.toolList}>
        <button onClick={() => newDraft("partition")}>새 칸막이</button>
        {list("partition", room.partitions ?? [])}
        <button onClick={() => newDraft("opening", "door")}>새 문</button>
        <button onClick={() => newDraft("opening", "entrance")}>
          새 현관문
        </button>
        <button onClick={() => newDraft("opening", "window")}>새 창문</button>
        {list("opening", room.openings ?? [])}
        <button onClick={() => newDraft("zone")}>새 구역</button>
        {list("zone", room.zones ?? [])}
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {draft && (
        <form onSubmit={submit}>
          <fieldset>
            <legend>
              {draft.kind === "partition"
                ? "칸막이 편집"
                : draft.kind === "opening"
                  ? "개구부 편집"
                  : "구역 편집"}
            </legend>
            {draft.kind === "partition" && (
              <>
                {input("name", "칸막이 이름", false)}
                {input("startX", "칸막이 시작 X (mm)")}
                {input("startY", "칸막이 시작 Y (mm)")}
                {input("endX", "칸막이 끝 X (mm)")}
                {input("endY", "칸막이 끝 Y (mm)")}
                {input("thicknessMm", "칸막이 두께 (mm)")}
                {input("heightMm", "칸막이 높이 (mm)")}
              </>
            )}
            {draft.kind === "opening" && (
              <>
                {input("name", "개구부 이름", false)}
                {select("kind", "개구부 종류", [
                  ["door", "문"],
                  ["entrance", "현관문"],
                  ["window", "창문"],
                ])}
                {select(
                  "hostId",
                  "개구부 벽",
                  hosts.map((h) => [h.id, h.name]),
                )}
                {input("offsetMm", "개구부 시작 위치 (mm)")}
                {input("widthMm", "개구부 폭 (mm)")}
                {input("heightMm", "개구부 높이 (mm)")}
                {input("sillMm", "개구부 하단 높이 (mm)")}
                {select("hinge", "개구부 경첩", [
                  ["start", "시작"],
                  ["end", "끝"],
                ])}
                {select("swing", "개구부 열림 방향", [
                  ["inward", "안쪽"],
                  ["outward", "바깥쪽"],
                ])}
              </>
            )}
            {draft.kind === "zone" && (
              <>
                {input("name", "구역 이름", false)}
                {select("kind", "구역 종류", [
                  ["bathroom", "욕실"],
                  ["kitchen", "주방"],
                  ["entry", "현관"],
                  ["living", "거실"],
                  ["bedroom", "침실"],
                ])}
                {input("x", "구역 X (mm)")}
                {input("y", "구역 Y (mm)")}
                {input("widthMm", "구역 가로 (mm)")}
                {input("depthMm", "구역 세로 (mm)")}
              </>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
              >
                취소
              </button>
              <button type="submit">
                {draft.kind === "partition"
                  ? "칸막이"
                  : draft.kind === "opening"
                    ? "개구부"
                    : "구역"}{" "}
                저장
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </details>
  );
}
