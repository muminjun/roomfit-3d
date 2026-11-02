import { useState } from "react";
import {
  corruptAutosaveRaw,
  loadOtherAutosave,
  overwriteAutosave,
} from "../../features/project/autosave";
import { exportJson } from "../../features/project/exportJson";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";
export function StorageNotice() {
  const status = useUIStore((s) => s.saveStatus),
    detail = useUIStore((s) => s.saveDetail),
    project = useProjectStore((s) => s.project),
    [error, setError] = useState("");
  if (status !== "failed" && status !== "conflict") return null;
  function downloadRaw() {
    const raw = corruptAutosaveRaw();
    if (raw === null) {
      setError(
        "손상 원본을 읽을 수 없습니다. 브라우저 저장 설정을 확인해 주세요.",
      );
      return;
    }
    const url = URL.createObjectURL(
        new Blob([raw], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "roomfit-손상-자동저장.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function overwrite() {
    if (
      !window.confirm(
        "브라우저 자동 저장을 이 탭의 현재 프로젝트로 덮어쓸까요? 필요한 경우 먼저 파일을 백업해 주세요.",
      )
    )
      return;
    if (!overwriteAutosave())
      setError("저장하지 못했습니다. JSON 파일로 백업해 주세요.");
    else setError("");
  }
  function loadOther() {
    if (
      !window.confirm(
        "다른 탭의 저장 내용을 불러와 현재 프로젝트를 교체할까요? 먼저 이 탭 내용을 JSON으로 백업할 수 있습니다.",
      )
    )
      return;
    if (!loadOtherAutosave())
      setError("다른 탭의 유효한 저장 내용을 불러오지 못했습니다.");
    else setError("");
  }
  return (
    <div className={styles.storageNotice} role="alert">
      <strong>
        {status === "conflict"
          ? "다른 탭에서 수정됨 — 자동 저장 일시 중지"
          : detail === "corrupt"
            ? "자동 저장 데이터가 손상되어 저장을 일시 중지했습니다"
            : "자동 저장에 실패했습니다"}
      </strong>
      <p>
        현재 탭의 내용은 메모리에 유지됩니다. 동시 편집은 지원하지 않으며, JSON
        파일을 백업해 주세요.
      </p>
      <div className={styles.actions}>
        <button onClick={() => exportJson(project)}>이 탭 내용 내보내기</button>
        {status === "conflict" && (
          <button onClick={loadOther}>다른 탭 불러오기</button>
        )}
        {detail === "corrupt" && (
          <button onClick={downloadRaw}>손상 데이터 다운로드</button>
        )}
        {(status === "conflict" || detail === "corrupt") && (
          <button onClick={overwrite}>
            {detail === "corrupt" ? "새 저장 시작" : "이 탭으로 덮어쓰기"}
          </button>
        )}
      </div>
      {error && <p>{error}</p>}
    </div>
  );
}
