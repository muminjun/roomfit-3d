import { exportJson } from "../features/project/exportJson";
import { shortcutHelp } from "../config/shortcuts";
import { FurniturePanel } from "../components/panels/FurniturePanel";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Editor2D } from "../components/editor2d/Editor2D";
import { ToolsPanel } from "../components/panels/ToolsPanel";
import { RoomPanel } from "../components/panels/RoomPanel";
import { NewProjectDialog } from "../components/common/NewProjectDialog";
import { startAutosave } from "../features/project/autosave";
import { useProjectStore } from "../store/useProjectStore";
import { useUIStore } from "../store/useUIStore";
import styles from "../styles/App.module.css";
const Viewer3D = lazy(() => import("../components/viewer3d/Viewer3D"));

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
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const changeView = useCallback(
    (next: "2d" | "3d") => {
      window.dispatchEvent(new Event("roomfit-cancel-drag"));
      setView(next);
    },
    [setView],
  );
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

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        view !== "3d" ||
        event.isComposing ||
        modal ||
        helpOpen ||
        !event.altKey ||
        !["Digit1", "Digit2"].includes(event.code)
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input,textarea,select") || target.isContentEditable)
      )
        return;
      event.preventDefault();
      changeView(event.code === "Digit1" ? "2d" : "3d");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [view, modal, helpOpen, changeView]);
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
      <main className={view === "2d" ? styles.layout : styles.layout3d}>
        {view === "2d" && <ToolsPanel />}
        <section className={styles.workspace}>
          <div className={styles.toolbar}>
            <div className={styles.actions}>
              <button
                aria-pressed={view === "2d"}
                onClick={() => changeView("2d")}
              >
                2D 편집
              </button>
              <button
                aria-pressed={view === "3d"}
                onClick={() => changeView("3d")}
              >
                3D 보기
              </button>
            </div>
            <span className={styles.subtle}>
              {view === "2d"
                ? "내 방을 위에서 바라본 모습"
                : "동일한 방과 가구를 입체로 확인하세요"}
            </span>
          </div>
          {view === "2d" ? (
            <Editor2D />
          ) : (
            <>
              <div className={styles.view3dNote}>
                방과 가구는 2D에서 편집할 수 있습니다.{" "}
                <button onClick={() => changeView("2d")}>2D에서 편집</button>
              </div>
              <Suspense
                fallback={
                  <div className={styles.view3dLoading}>
                    3D 보기를 준비하고 있습니다.
                  </div>
                }
              >
                <Viewer3D />
              </Suspense>
            </>
          )}
          <div className={styles.status}>
            <span>
              {project.title} · {project.room.wallHeightMm} mm 높이
            </span>
            <span>{saveLabel}</span>
          </div>
        </section>
        {view === "2d" &&
          (selectedFurniture ? (
            <FurniturePanel item={selectedFurniture} />
          ) : (
            <RoomPanel />
          ))}
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
