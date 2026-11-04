import { describe,expect,it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { createFurnitureCandidate } from "../../src/features/furniture/commands";
import { getFrontClearanceWarnings } from "../../src/features/furniture/frontClearance";

describe("configurable use clearance",()=>{
  it("is off for old projects and checks only the rotated front without altering data",()=>{
    const project=createProject();
    const item=createFurnitureCandidate("desk",{x:2100,y:700},"desk")!;
    project.furniture=[item];
    expect(getFrontClearanceWarnings(project)).toEqual([]);
    project.settings.minimumClearanceMm=600;
    const before=JSON.stringify(project);
    expect(getFrontClearanceWarnings(project)).toEqual([expect.objectContaining({itemId:"desk",availableMm:400,minimumMm:600})]);
    project.furniture=[{...item,rotationDeg:90}];
    expect(getFrontClearanceWarnings(project)).toEqual([]);
    project.furniture=[item];
    expect(JSON.stringify(project)).toBe(before);
  });
  it("includes named furniture and partitions as nearest obstacles and suppresses invalid items",()=>{
    const project=createProject();
    project.settings.minimumClearanceMm=600;
    project.furniture=[createFurnitureCandidate("desk",{x:2100,y:1600},"desk")!,createFurnitureCandidate("nightstand",{x:2100,y:850},"cabinet")!];
    expect(getFrontClearanceWarnings(project)).toContainEqual(expect.objectContaining({itemId:"desk",availableMm:250,obstacleNames:["협탁"]}));
    project.furniture[0].position.x=-1000;
    expect(getFrontClearanceWarnings(project).some(w=>w.itemId==="desk")).toBe(false);
  });
});
