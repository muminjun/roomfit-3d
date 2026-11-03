import { CatalogPanel } from "./CatalogPanel";
import { roomPresets } from "../../data/presets";
import { createId } from "../../features/project/createProject";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import styles from "../../styles/App.module.css";
export function ToolsPanel() {
  const furniture = useProjectStore((s) => s.project.furniture);
  const tool = useUIStore((s) => s.tool),
    setTool = useUIStore((s) => s.setTool),
    setSelected = useUIStore((s) => s.setSelected),
    load = useProjectStore((s) => s.loadProject),
    project = useProjectStore((s) => s.project);
  function preset(presetId: string) {
    const preset = roomPresets.find((p) => p.id === presetId);
    if (!preset) return;
    if (
      !window.confirm(
        "현재 프로젝트를 이 예제로 교체할까요? 필요한 경우 먼저 JSON으로 백업해 주세요.",
      )
    )
      return;
    load({
      ...project,
      id: createId(),
      room: {
        id: project.room.id,
        name: project.room.name,
        wallHeightMm: project.room.wallHeightMm,
        wallThicknessMm: project.room.wallThicknessMm,
        polygon: preset.points.map(([x, y]) => ({ id: createId(), x, y })),
      },
      furniture: [],
      updatedAt: new Date().toISOString(),
    });
    setSelected(null);
    setTool("select");
  }
  return (
    <aside className={styles.panel}>
      <p className={styles.eyebrow}>ROOM TOOLS</p>
      <h2>방 편집</h2>
      <p className={styles.muted}>벽을 선택하고 편집 방법을 선택하세요.</p>
      <div className={styles.toolList}>
        {(
          [
            ["select", "선택"],
            ["wallMove", "벽 이동"],
            ["indent", "함몰 만들기"],
            ["protrude", "돌출 만들기"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            title={{select:"가구와 벽을 선택합니다. Space를 누른 채 드래그하면 화면만 이동합니다.",wallMove:"벽을 선택하고 벽에 수직으로 드래그합니다. 양수 수치 이동은 바깥쪽입니다.",indent:"벽 위에서 구간을 드래그한 뒤 실내 쪽 깊이를 지정해 함몰을 만듭니다.",protrude:"벽 위에서 구간을 드래그한 뒤 바깥쪽 깊이를 지정해 돌출을 만듭니다."}[id]}
            aria-pressed={tool === id}
            onClick={() => setTool(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className={styles.muted}>
        벽 이동은 선택한 벽을 수직으로 움직입니다. 함몰과 돌출은 벽에서 폭을
        드래그한 뒤 깊이를 선택합니다.
      </p>
      <h3>방 예제</h3>
      <div className={styles.toolList}>
        {roomPresets.map((p) => (
          <button key={p.id} title="현재 도면을 이 예제로 교체합니다. 교체 전 JSON 백업 여부를 확인하세요." onClick={() => preset(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <h3>배치된 가구</h3>
      <div className={styles.toolList}>
        {furniture.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setTool("select");
              setSelected({ kind: "furniture", id: item.id });
            }}
          >
            {item.name} 선택
          </button>
        ))}
      </div>
      <CatalogPanel />
      <p className={styles.note}>
        예제 크기는 참고용입니다. 실제 현장 치수를 확인해 주세요.
      </p>
    </aside>
  );
}
