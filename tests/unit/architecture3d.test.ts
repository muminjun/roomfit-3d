import { describe, it, expect } from "vitest";
import { Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import { createProject } from "../../src/features/project/createProject";
import { buildArchitecturalWallGeometry } from "../../src/components/viewer3d/architecture";
import type { Opening, Room } from "../../src/types/model";

function opening(overrides: Partial<Opening>): Opening {
  return {
    id: "opening",
    name: "문",
    kind: "door",
    hostId: "p0",
    offsetMm: 1000,
    widthMm: 800,
    heightMm: 2000,
    sillMm: 0,
    hinge: "start",
    swing: "inward",
    ...overrides,
  };
}
function room(): Room {
  const r = createProject(4000, 3000, 2400).room;
  r.polygon.forEach((p, i) => (p.id = `p${i}`));
  return r;
}
function hits(
  r: Room,
  origin: [number, number, number],
  direction: [number, number, number],
  distance: number,
) {
  const mesh = new Mesh(
    buildArchitecturalWallGeometry(r),
    new MeshBasicMaterial({ side: DoubleSide }),
  );
  mesh.updateMatrixWorld();
  return new Raycaster(
    new Vector3(...origin),
    new Vector3(...direction),
    0,
    distance,
  ).intersectObject(mesh).length;
}
describe("architectural wall volume", () => {
  it("cuts a door through the exterior wall but retains its lintel", () => {
    const r = room();
    r.openings = [opening({})];
    expect(hits(r, [1.4, 1, -0.5], [0, 0, 1], 0.8)).toBe(0);
    expect(hits(r, [1.4, 2.2, -0.5], [0, 0, 1], 0.8)).toBeGreaterThan(0);
  });
  it("cuts a window above its sill and retains wall below and above", () => {
    const r = room();
    r.openings = [opening({ kind: "window", sillMm: 900, heightMm: 1000 })];
    expect(hits(r, [1.4, 1.4, -0.5], [0, 0, 1], 0.8)).toBe(0);
    expect(hits(r, [1.4, 0.5, -0.5], [0, 0, 1], 0.8)).toBeGreaterThan(0);
    expect(hits(r, [1.4, 2.1, -0.5], [0, 0, 1], 0.8)).toBeGreaterThan(0);
  });
  it("cuts a partition doorway without adding internal faces at union overlaps", () => {
    const r = room();
    r.partitions = [
      {
        id: "partition",
        name: "벽",
        start: { x: 0, y: 1500 },
        end: { x: 3000, y: 1500 },
        thicknessMm: 100,
        heightMm: 2400,
      },
    ];
    r.openings = [opening({ hostId: "partition" })];
    expect(hits(r, [1.4, 1, 1], [0, 0, 1], 1)).toBe(0);
    expect(hits(r, [2.3, 1, 1], [0, 0, 1], 1)).toBe(2);
  });
  it("removes internal faces where a partition joins an exterior wall", () => {
    const r = room();
    r.partitions = [
      {
        id: "partition",
        name: "벽",
        start: { x: 0, y: 1500 },
        end: { x: 3000, y: 1500 },
        thicknessMm: 100,
        heightMm: 2400,
      },
    ];
    expect(hits(r, [-0.5, 1, 1.51], [1, 0, 0], 0.8)).toBe(1);
  });
  it("ignores an orphan opening", () => {
    const r = room();
    r.openings = [opening({ hostId: "missing" })];
    expect(hits(r, [1.4, 1, -0.5], [0, 0, 1], 0.8)).toBeGreaterThan(0);
  });
});

it("keeps a crossing partition solid within a door hosted by another partition", () => {
  const r = room();
  r.partitions = [
    {
      id: "host",
      name: "host",
      start: { x: 0, y: 1500 },
      end: { x: 4000, y: 1500 },
      thicknessMm: 100,
      heightMm: 2400,
    },
    {
      id: "cross",
      name: "cross",
      start: { x: 1400, y: 500 },
      end: { x: 1400, y: 2500 },
      thicknessMm: 100,
      heightMm: 2400,
    },
  ];
  r.openings = [opening({ hostId: "host" })];
  expect(hits(r, [1.2, 1, 1.51], [1, 0, 0], 0.4)).toBe(2);
});

it("constructs a large valid plan without a global three-dimensional grid", () => {
  const r = createProject(20000, 20000, 5000).room;
  r.partitions = Array.from({ length: 64 }, (_, i) => ({
    id: `p${i}`,
    name: `p${i}`,
    start: { x: 200 + i * 300, y: 100 },
    end: { x: 200 + i * 300, y: 19900 },
    thicknessMm: 100,
    heightMm: 4800,
  }));
  r.openings = Array.from({ length: 100 }, (_, i) =>
    opening({
      id: `o${i}`,
      kind: "window",
      hostId: `p${i % 64}`,
      offsetMm: 300 + Math.floor(i / 64) * 4000 + i * 3,
      widthMm: 200,
      heightMm: 500 + i * 7,
      sillMm: 500 + i * 5,
    }),
  );
  const start = performance.now();
  const geometry = buildArchitecturalWallGeometry(r);
  expect(geometry.getAttribute("position").count).toBeGreaterThan(0);
  expect(performance.now() - start).toBeLessThan(10000);
});

it("builds the schema-limit stress fixture with bounded output", async () => {
  const { readFile } = await import("node:fs/promises");
  const project = JSON.parse(
    await readFile(
      new URL(
        "../fixtures/architecture-64partitions-100openings.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const { projectSchema } = await import("../../src/types/schema");
  const { validateArchitecture } =
    await import("../../src/features/architecture/geometry");
  expect(projectSchema.safeParse(project).success).toBe(true);
  expect(validateArchitecture(project.room)).toEqual([]);
  const start = performance.now();
  const geometry = buildArchitecturalWallGeometry(project.room);
  expect(geometry.getAttribute("position").count).toBeLessThan(1_000_000);
  expect(performance.now() - start).toBeLessThan(10_000);
});

it("keeps thick exterior walls out of the floor beside a narrow concave notch", () => {
  const r = room();
  r.polygon = [
    [0, 0],
    [1900, 0],
    [1900, 1000],
    [2000, 1000],
    [2000, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ].map(([x, y], i) => ({ id: `n${i}`, x, y }));
  r.wallThicknessMm = 500;
  r.openings = [
    opening({
      hostId: "n0",
      kind: "window",
      offsetMm: 300,
      widthMm: 500,
      heightMm: 1000,
      sillMm: 900,
    }),
  ];
  expect(hits(r, [2.1, 3, 0.51], [0, -1, 0], 2.8)).toBe(0);
});
