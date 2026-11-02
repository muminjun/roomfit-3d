import { LIMITS } from "../../config/limits";
import {
  addNotch,
  moveWall,
  resizeRectangle,
  type EditResult,
} from "../../lib/geometry";
import { useProjectStore } from "../../store/useProjectStore";
import type { ProjectDataV2 } from "../../types/model";
import { projectSchema } from "../../types/schema";
import { createId } from "../project/createProject";

export type CommandIssue = { code: string; message: string; targetId?: string };
export type CommandResult =
  | {
      ok: true;
      kind: "Committed";
      project: ProjectDataV2;
      affectedIds: string[];
      selectedEdgeId?: string | null;
    }
  | { ok: true; kind: "NoChange" }
  | { ok: false; kind: "Invalid"; issues: CommandIssue[] };

const invalid = (
  code: string,
  message: string,
  targetId?: string,
): CommandResult => ({
  ok: false,
  kind: "Invalid",
  issues: [{ code, message, ...(targetId ? { targetId } : {}) }],
});
const inRange = (n: number, min: number, max: number) =>
  Number.isSafeInteger(n) && n >= min && n <= max;

function commit(
  candidate: ProjectDataV2,
  affectedIds: string[],
  selectedEdgeId?: string | null,
): CommandResult {
  const store = useProjectStore.getState();
  const parsed = projectSchema.safeParse(candidate);
  if (!parsed.success)
    return {
      ok: false,
      kind: "Invalid",
      issues: parsed.error.issues.map((issue) => ({
        code: "INVALID_PROJECT",
        message: issue.message,
      })),
    };
  if (
    JSON.stringify({
      title: candidate.title,
      room: candidate.room,
      furniture: candidate.furniture,
    }) ===
    JSON.stringify({
      title: store.project.title,
      room: store.project.room,
      furniture: store.project.furniture,
    })
  )
    return { ok: true, kind: "NoChange" };
  if (!store.commit(candidate))
    return invalid("COMMIT_FAILED", "변경 사항을 저장할 수 없습니다.");
  return {
    ok: true,
    kind: "Committed",
    project: useProjectStore.getState().project,
    affectedIds,
    ...(selectedEdgeId !== undefined ? { selectedEdgeId } : {}),
  };
}
function commitPolygon(result: EditResult): CommandResult {
  if (!result.ok)
    return invalid(result.code, result.message, result.offenderIds[0]);
  const project = useProjectStore.getState().project;
  return commit(
    { ...project, room: { ...project.room, polygon: result.polygon } },
    [project.room.id, ...result.polygon.map((point) => point.id)],
    result.selectedEdgeId,
  );
}
export function moveWallSegment({
  startVertexId,
  offsetMm,
}: {
  startVertexId: string;
  offsetMm: number;
}): CommandResult {
  return commitPolygon(
    moveWall(
      useProjectStore.getState().project.room.polygon,
      startVertexId,
      offsetMm,
    ),
  );
}
export function addRoomNotch(options: {
  startVertexId: string;
  startOffsetMm: number;
  widthMm: number;
  depthMm: number;
  type: "indent" | "protrude";
}): CommandResult {
  return commitPolygon(
    addNotch(
      useProjectStore.getState().project.room.polygon,
      options,
      createId,
    ),
  );
}
export function setRectangleDimensions({
  widthMm,
  depthMm,
}: {
  widthMm: number;
  depthMm: number;
}): CommandResult {
  return commitPolygon(
    resizeRectangle(
      useProjectStore.getState().project.room.polygon,
      widthMm,
      depthMm,
    ),
  );
}
export function updateRoomHeight({
  wallHeightMm,
}: {
  wallHeightMm: number;
}): CommandResult {
  if (!inRange(wallHeightMm, LIMITS.heightMin, LIMITS.heightMax))
    return invalid(
      "INVALID_HEIGHT",
      `방 높이는 ${LIMITS.heightMin}~${LIMITS.heightMax}mm 정수여야 합니다.`,
    );
  const project = useProjectStore.getState().project;
  return commit({ ...project, room: { ...project.room, wallHeightMm } }, [
    project.room.id,
  ]);
}
export function updateWallThickness({
  wallThicknessMm,
}: {
  wallThicknessMm: number;
}): CommandResult {
  if (!inRange(wallThicknessMm, LIMITS.wallMin, LIMITS.wallMax))
    return invalid(
      "INVALID_WALL_THICKNESS",
      `벽 두께는 ${LIMITS.wallMin}~${LIMITS.wallMax}mm 정수여야 합니다.`,
    );
  const project = useProjectStore.getState().project;
  return commit({ ...project, room: { ...project.room, wallThicknessMm } }, [
    project.room.id,
  ]);
}
export function renameProject({ title }: { title: string }): CommandResult {
  if (typeof title !== "string")
    return invalid("INVALID_TITLE", "프로젝트 이름을 입력해 주세요.");
  const clean = title.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if ([...clean].length < 1 || [...clean].length > 60)
    return invalid("INVALID_TITLE", "프로젝트 이름은 1~60자여야 합니다.");
  const project = useProjectStore.getState().project;
  return commit({ ...project, title: clean }, [project.id]);
}
