import { useState, type ChangeEvent } from "react";
import { LIMITS } from "../../config/limits";
import { parseProjectJson } from "../../features/project/json";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";
export function ImportProject() {
  const [error, setError] = useState("");
  async function load(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > LIMITS.maxJsonBytes) {
      setError("파일 크기는 2MiB 이하여야 합니다.");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError("파일을 읽을 수 없습니다.");
      return;
    }
    const parsed = parseProjectJson(text);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    const summary = [
      `프로젝트 “${parsed.project.title}”`,
      ...parsed.changes,
      ...parsed.warnings,
    ].join("\n");
    if (
      !window.confirm(
        `${summary}\n\n현재 프로젝트를 교체할까요? 필요하면 먼저 JSON으로 백업해 주세요.`,
      )
    )
      return;
    if (!useProjectStore.getState().loadProject(parsed.project)) {
      setError("프로젝트를 불러오지 못했습니다.");
      return;
    }
    useUIStore.getState().setSelected(null);
    useUIStore.getState().setTool("select");
    setError("");
  }
  return (
    <>
      <label className={styles.fileButton}>
        JSON 불러오기
        <input
          aria-label="JSON 불러오기"
          type="file"
          accept=".json,application/json"
          onChange={load}
        />
      </label>
      {error && (
        <div className={styles.importError} role="alert">
          {error}
        </div>
      )}
    </>
  );
}
