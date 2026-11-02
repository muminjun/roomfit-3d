import type { ProjectDataV2 } from "../../types/model";
import { projectFilename, serializeProjectJson } from "./json";
export function exportJson(project: ProjectDataV2) {
  const url = URL.createObjectURL(
    new Blob([serializeProjectJson(project)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = projectFilename(project.title);
  link.click();
  URL.revokeObjectURL(url);
}
