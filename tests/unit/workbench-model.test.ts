import { describe,expect,it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { createFurnitureCandidate } from "../../src/features/furniture/commands";
import { projectSchema } from "../../src/types/schema";
import { parseProjectJson,serializeProjectJson } from "../../src/features/project/json";

describe("optional workbench data",()=>{
  it("roundtrips explicit furniture locks and front-clearance settings",()=>{
    const project=createProject();
    const candidate={...project,furniture:[{...createFurnitureCandidate("desk",{x:2100,y:1700},"locked-desk")!,locked:true}],settings:{...project.settings,minimumClearanceMm:700}};
    const parsed=projectSchema.safeParse(candidate);
    expect(parsed.success).toBe(true);
    if(!parsed.success)return;
    expect(parseProjectJson(serializeProjectJson(parsed.data))).toMatchObject({ok:true,project:parsed.data});
    expect(projectSchema.safeParse({...candidate,settings:{...candidate.settings,minimumClearanceMm:-1}}).success).toBe(false);
  });
  it("does not add workbench optional properties to old v2 documents",()=>{
    const project=createProject();
    project.furniture=[createFurnitureCandidate("desk",{x:2100,y:1700},"old-desk")!];
    const json=JSON.parse(serializeProjectJson(project));
    expect(json.furniture[0]).not.toHaveProperty("locked");
    expect(json.settings).not.toHaveProperty("minimumClearanceMm");
  });
});
