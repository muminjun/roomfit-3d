import { exportJson } from "../features/project/exportJson";
import { shortcutHelp } from "../config/shortcuts";
import { FurniturePanel } from "../components/panels/FurniturePanel";
import { useCallback, useEffect, useState } from "react";
import { Editor2D } from "../components/editor2d/Editor2D";
import { ToolsPanel } from "../components/panels/ToolsPanel";
import { RoomPanel } from "../components/panels/RoomPanel";
import { NewProjectDialog } from "../components/common/NewProjectDialog";
import { startAutosave } from "../features/project/autosave";
import { useProjectStore } from "../store/useProjectStore";
import { useUIStore } from "../store/useUIStore";
import styles from "../styles/App.module.css";

export function App() {
  const project = useProjectStore((s) => s.project);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const past = useProjectStore((s) => s.past);
  const future = useProjectStore((s) => s.future);
  const selection = useUIStore((s) => s.selected);
  const selectedFurniture =
    selection?.kind === "furniture"
      ? project.furniture.find((item) => item.id === selection.id)
      : undefined;
  const helpOpen = useUIStore((s) => s.helpOpen);
  const setHelpOpen = useUIStore((s) => s.setHelpOpen);
  const save = useUIStore((s) => s.saveStatus);
  const [modal, setModal] = useState(false);
  const closeModal = useCallback(() => setModal(false), []);
  useEffect(() => startAutosave(), []);
  useEffect(() => {
    if (
      selection?.kind === "furniture" &&
      !project.furniture.some((item) => item.id === selection.id)
    )
      useUIStore.getState().setSelected(null);
  }, [selection, project.furniture]);
  useEffect(() => {
    if (!helpOpen) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [helpOpen, setHelpOpen]);

  const saveLabel =
    save === "failed"
      ? "자동 저장 실패: JSON으로 백업해 주세요"
      : save === "conflict"
        ? "다른 탭에서 수정됨: 자동 저장 일시 중지"
        : save === "pending"
          ? "저장 중"
          : "이 브라우저에 저장";
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <strong>
            RoomFit <span>3D</span>
          </strong>
          <small>실측 기반 공간 플래너</small>
        </div>
        <div className={styles.actions}>
          <button onClick={() => setModal(true)}>새 프로젝트</button>
          <button onClick={undo} disabled={!past.length}>
            실행 취소
          </button>
          <button onClick={redo} disabled={!future.length}>
            다시 실행
          </button>
          <button onClick={() => exportJson(project)}>JSON 내보내기</button>
          <button onClick={() => setHelpOpen(true)}>단축키 도움말</button>
        </div>
      </header>
      <main className={styles.layout}>
        <ToolsPanel />
        <section className={styles.workspace}>
          <div className={styles.toolbar}>
            <div>
              <b>2D 평면도</b>
              <span className={styles.subtle}> · mm 단위</span>
            </div>
            <span className={styles.subtle}>내 방을 위에서 바라본 모습</span>
          </div>
          <Editor2D />
          <div className={styles.status}>
            <span>
              {project.title} · {project.room.wallHeightMm} mm 높이
            </span>
            <span>{saveLabel}</span>
          </div>
        </section>
        {selectedFurniture ? (
          <FurniturePanel item={selectedFurniture} />
        ) : (
          <RoomPanel />
        )}
      </main>
      {modal && <NewProjectDialog onClose={closeModal} />}
      {helpOpen && (
        <div className={styles.overlay}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="단축키 도움말"
          >
            <h2>단축키 도움말</h2>
            {shortcutHelp.map(({ label: key, description }) => (
              <div className={styles.info} key={key}>
                <span>{key}</span>
                <b>{description}</b>
              </div>
            ))}
            <button onClick={() => setHelpOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
