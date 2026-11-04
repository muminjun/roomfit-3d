import { ImportProject } from "../components/common/ImportProject";
import { StorageNotice } from "../components/common/StorageNotice";
import { exportJson } from "../features/project/exportJson";
import { HelpDialog } from "../components/common/HelpDialog";
import { WelcomeCard } from "../components/common/WelcomeCard";
import { ClearancePanel } from "../components/panels/ClearancePanel";
import { FurniturePanel } from "../components/panels/FurniturePanel";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Editor2D } from "../components/editor2d/Editor2D";
import { ToolsPanel } from "../components/panels/ToolsPanel";
import { RoomPanel } from "../components/panels/RoomPanel";
import { ArchitecturePanel } from "../components/panels/ArchitecturePanel";
import { ProjectLibraryDialog } from "../components/common/ProjectLibraryDialog";
import { ExportTools } from "../components/common/ExportTools";
import { SelectionToolbar } from "../components/editor2d/SelectionToolbar";
import { NewProjectDialog } from "../components/common/NewProjectDialog";
import { autosaveKey, startAutosave } from "../features/project/autosave";
import { projectSchema } from "../types/schema";
import { validateAllPlacements } from "../lib/geometry/placement";
import { useProjectStore } from "../store/useProjectStore";
import { useUIStore } from "../store/useUIStore";
import styles from "../styles/App.module.css";
const Viewer3D = lazy(() => import("../components/viewer3d/Viewer3D"));
const welcomeKey = `roomfit3d:v2:${import.meta.env.BASE_URL}:welcome`;
function hasSavedProject() {
  try {
    const raw = localStorage.getItem(autosaveKey);
    return raw !== null && projectSchema.safeParse(JSON.parse(raw)).success;
  } catch { return false; }
}

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
  const saveDetail = useUIStore((s) => s.saveDetail);
  const lastSavedAt = useUIStore((s) => s.lastSavedAt);
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const tool = useUIStore((s) => s.tool);
  const warningCount = Object.values(validateAllPlacements(project.room, project.furniture)).filter((result) => !result.valid).length;
  const [welcome, setWelcome] = useState(() => {
    try { return localStorage.getItem(welcomeKey) !== "dismissed"; } catch { return true; }
  });
  const [canContinue] = useState(hasSavedProject);
  const enterEditor = useCallback(() => {
    try { localStorage.setItem(welcomeKey, "dismissed"); } catch { /* optional preference */ }
    setWelcome(false);
  }, []);
  const changeView = useCallback(
    (next: "2d" | "3d" | "split") => {
      window.dispatchEvent(new Event("roomfit-cancel-drag"));
      setView(next);
    },
    [setView],
  );
  const [modal, setModal] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const closeLibrary = useCallback(() => setLibraryOpen(false), []);
  const selectedLibraryProject = useCallback(() => {
    window.dispatchEvent(new Event("roomfit-cancel-drag"));
    useUIStore.getState().setSelected(null);
    setView("2d");
    enterEditor();
    setLibraryOpen(false);
  }, [enterEditor, setView]);
  const closeModal = useCallback(() => setModal(false), []);
  const closeHelp = useCallback(() => setHelpOpen(false), [setHelpOpen]);
  useEffect(() => startAutosave(), []);
  useEffect(() => {
    const ui = useUIStore.getState();
    const surviving = ui.selectedFurnitureIds.filter(id => project.furniture.some(item => item.id === id));
    if (surviving.length !== ui.selectedFurnitureIds.length) ui.setFurnitureSelection(surviving);
    else if (selection?.kind === "furniture" && !project.furniture.some(item => item.id === selection.id)) ui.setSelected(null);
  }, [selection, project.furniture]);

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
          : save === "saved"
            ? lastSavedAt
              ? `저장됨 · ${new Date(lastSavedAt).toLocaleTimeString("ko-KR")}`
              : "저장본 복구됨"
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
          <button title="실측 치수로 새 도면을 만듭니다. 기존 도면을 교체하기 전에 확인합니다." onClick={() => setModal(true)}>새 프로젝트</button>
          <button title="마지막 편집을 되돌립니다" onClick={undo} disabled={!past.length}>
            실행 취소
          </button>
          <button title="되돌린 편집을 다시 적용합니다" onClick={redo} disabled={!future.length}>
            다시 실행
          </button>
          <ImportProject onImported={enterEditor} />
          <button onClick={() => { window.dispatchEvent(new Event("roomfit-cancel-drag")); setLibraryOpen(true); }}>프로젝트 보관함</button>
          <ExportTools />
          <button title="현재 도면을 JSON 파일로 내려받습니다. 브라우저 자동 저장과 별도로 보관하세요." onClick={() => exportJson(project)}>JSON 내보내기</button>
          <button onClick={() => setHelpOpen(true)}>단축키 도움말</button>
        </div>
      </header>
      <StorageNotice />
      {welcome ? <WelcomeCard onNew={() => setModal(true)} onEnter={enterEditor} canContinue={canContinue && saveDetail !== "conflict" && hasSavedProject()} /> : <main className={view === "3d" ? styles.layout3d : styles.layout}>
        {view !== "3d" && <details open className={styles.panelSlot}><summary>도구와 가구 카탈로그</summary><ToolsPanel /></details>}
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
              <button aria-pressed={view === "split"} onClick={() => changeView("split")}>분할 보기</button>
            </div>
            <button title="가구 선택을 해제하고 방 속성을 엽니다" onClick={() => useUIStore.getState().setSelected(null)}>방 속성</button>
            <span className={styles.subtle}>
              {view === "2d"
                ? "내 방을 위에서 바라본 모습"
                : "동일한 방과 가구를 입체로 확인하세요"}
            </span>
          </div>
          <SelectionToolbar />
          {view === "2d" ? <Editor2D /> : view === "split" ? (
            <div className={styles.splitWorkspace}>
              <Editor2D />
              <Suspense fallback={<div className={styles.view3dLoading}>3D 보기를 준비하고 있습니다.</div>}><Viewer3D /></Suspense>
            </div>
          ) : (
            <>
              <div className={styles.view3dNote}>
                3D 이동 모드와 속성 입력으로 가구를 편집할 수 있습니다.{" "}
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
          <div className={styles.status} role="status" aria-live="polite">
            <span>
              {project.title} · {project.room.wallHeightMm} mm 높이
            </span>
            <span>모드: {view === "3d" ? "3D" : ({ select: "선택", wallMove: "벽 이동", indent: "함몰", protrude: "돌출", measure: "두 점 실측", architectureMove: "구조 편집" }[tool])} · 격자 {project.settings.gridVisible ? `${project.settings.gridSizeMm} mm` : "숨김"} · 스냅 {project.settings.snapEnabled ? "켜짐" : "꺼짐"} · 단위 mm · 배치 오류 {warningCount}개</span>
            <span>{saveLabel}</span>
          </div>
        </section>
        <details open className={styles.panelSlot}><summary>속성</summary><div className={styles.propertyStack}>
          {selectedFurniture ? (
            <FurniturePanel key={selectedFurniture.id} item={selectedFurniture} />
          ) : (
            <><RoomPanel /><ArchitecturePanel /></>
          )}<ClearancePanel /></div></details>
      </main>}
      {libraryOpen && <ProjectLibraryDialog onClose={closeLibrary} onSelectedProject={selectedLibraryProject} />}
      {modal && <NewProjectDialog onClose={closeModal} onCreated={enterEditor} />}
      {helpOpen && <HelpDialog onClose={closeHelp} />}
    </div>
  );
}
