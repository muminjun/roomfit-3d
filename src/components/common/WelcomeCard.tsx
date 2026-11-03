import { createProject, createId } from "../../features/project/createProject";
import { createFurnitureCandidate } from "../../features/furniture/commands";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";
export function WelcomeCard({ onNew, onEnter, canContinue }: { onNew: () => void; onEnter: () => void; canContinue: boolean }) {
  function example() {
    if (
      !window.confirm(
        "현재 프로젝트를 예제로 교체할까요? 필요한 경우 먼저 JSON으로 백업해 주세요.",
      )
    )
      return;
    const project = createProject();
    project.title = "내 첫 원룸";
    const bed = createFurnitureCandidate(
        "bed-queen",
        { x: 1050, y: 1250 },
        createId(),
      ),
      desk = createFurnitureCandidate("desk", { x: 2950, y: 2800 }, createId());
    if (!bed || !desk) return;
    project.furniture = [bed, desk];
    if (useProjectStore.getState().loadProject(project)) {
      useUIStore.getState().setSelected(null);
      useUIStore.getState().setTool("select");
      onEnter();
    }
  }
  return (
    <main className={styles.welcome}>
      <h1>RoomFit 3D에 오신 것을 환영합니다</h1>
      <p>① 방 치수 입력 → ② 벽과 가구 배치 → ③ 3D 확인과 JSON 백업</p>
      <small>
        배치 시뮬레이션이며 실제 제품과 현장 치수를 다시 확인해 주세요. 자동
        저장은 이 브라우저에만 보관됩니다.
      </small>
      <div className={styles.actions}>
        <button onClick={onNew}>방 새로 만들기</button>
        <button onClick={example}>예제 보기</button>
        {canContinue && <button onClick={onEnter}>계속 편집</button>}
      </div>
    </main>
  );
}
