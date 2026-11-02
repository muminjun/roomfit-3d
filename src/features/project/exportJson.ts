import type { ProjectDataV2 } from "../../types/model";
export function exportJson(project: ProjectDataV2) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "roomfit-project.json";
  link.click();
  URL.revokeObjectURL(url);
}
