import { describe,expect,it } from "vitest";
import { createProject } from "../../src/features/project/createProject";
import { createFurnitureCandidate } from "../../src/features/furniture/commands";
import { getFurnitureRect,getNearestClearance,snapFurniture } from "../../src/lib/geometry";

describe("original acceptance fixed examples",()=>{
  it("AC-74 reports the specified 500 mm facing clearances for both rectangles",()=>{
    const room=createProject().room;
    const a={...createFurnitureCandidate("desk",{x:1500,y:1500},"a")!,widthMm:1000,depthMm:1000};
    const b={...createFurnitureCandidate("desk",{x:2750,y:1500},"b")!,widthMm:500,depthMm:1000};
    expect(getFurnitureRect(a)).toEqual({minX:1000,minY:1000,maxX:2000,maxY:2000});
    expect(getFurnitureRect(b)).toEqual({minX:2500,minY:1000,maxX:3000,maxY:2000});
    expect(getNearestClearance(room,[a,b],a).right).toBe(500);
    expect(getNearestClearance(room,[a,b],b).left).toBe(500);
  });
  it("AC-85 snaps an even 1000 mm footprint to minX100 and center600 exactly",()=>{
    const item={...createFurnitureCandidate("desk",{x:649,y:900},"even")!,widthMm:1000};
    const snapped=snapFurniture(item,100);
    expect(snapped.position.x).toBe(600);
    expect(Number.isInteger(snapped.position.x)).toBe(true);
    expect(getFurnitureRect(snapped).minX).toBe(100);
  });
});
