import { useState } from "react";
import { catalog } from "../../data/catalog";
import {
  addFurniture,
  createFurnitureCandidate,
  findValidPlacement,
} from "../../features/furniture/commands";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";
import { CatalogThumbnail } from "./CatalogThumbnail";
export function CatalogPanel() {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("전체"),
    [error, setError] = useState("");
  const setSelected = useUIStore((s) => s.setSelected),
    setTool = useUIStore((s) => s.setTool),
    setDragged = useUIStore((s) => s.setDraggedCatalogId);
  const categories = ["전체", ...new Set(catalog.map((item) => item.category))];
  function add(id: string) {
    const project = useProjectStore.getState().project,
      origin = useUIStore.getState().viewportCenter;
    const candidate = origin && createFurnitureCandidate(id, origin, undefined, project.room.wallHeightMm);
    const position =
      candidate && origin
        ? findValidPlacement(project.room, project.furniture, candidate, origin)
        : null;
    const result = position
      ? addFurniture({ catalogId: id, position })
      : addFurniture({ catalogId: id });
    if (!result.ok) {
      setError(result.issues.map((i) => i.message).join(" "));
      return;
    }
    setError("");
    if (result.kind === "Committed") {
      setTool("select");
      setSelected({ kind: "furniture", id: result.affectedIds[0] });
    }
  }
  return (
    <section>
      <h3>가구 카탈로그</h3>
      <label className={styles.field}>
        가구 검색
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 검색"
        />
      </label>
      <label className={styles.field}>
        카테고리
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className={styles.catalog}>
        {catalog
          .filter(
            (i) =>
              (category === "전체" || i.category === category) &&
              i.name.includes(query.trim()),
          )
          .map((item) => (
            <button
              key={item.id}
              title={`${item.name} 추가 · ${item.widthMm} × ${item.depthMm} × ${item.heightMm} mm. 클릭하거나 도면으로 끌어 놓으세요.`}
              draggable
              onDragStart={(e) => {
                setTool("select");
                setDragged(item.id);
                e.dataTransfer.setData("text/plain", item.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onDragEnd={() => {
                setDragged(null);
                useUIStore.getState().setFurniturePreview(null);
              }}
              onClick={() => add(item.id)}
            >
              <span className={styles.thumbnail} aria-hidden="true">
                <CatalogThumbnail item={item} />
              </span>
              <span>
                <b>{item.name}</b>
                <small>
                  {item.widthMm} × {item.depthMm} × {item.heightMm} mm
                </small>
              </span>
            </button>
          ))}
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  );
}
