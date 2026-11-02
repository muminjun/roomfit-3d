import { describe, it, expect } from "vitest";
import { Box3, PerspectiveCamera, Vector3 } from "three";
import {
  buildFloorGeometry,
  buildWallCells,
  buildWallGeometry,
  toWorld3D,
} from "../../src/components/viewer3d/geometry";
import { cameraForRoom } from "../../src/components/viewer3d/camera";
import {
  buildFurnitureObject,
  disposeFurnitureObject,
} from "../../src/components/viewer3d/furniture";
import { containsRectInRoom, getRoomArea } from "../../src/lib/geometry";
import { createProject } from "../../src/features/project/createProject";
import { catalog } from "../../src/data/catalog";
import { createFurnitureCandidate } from "../../src/features/furniture/commands";
import type { PointMm } from "../../src/types/model";
const poly = (points: number[][]): PointMm[] =>
  points.map(([x, y], i) => ({ id: `v${i}`, x, y }));
const R = poly([
    [0, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ]),
  U = poly([
    [0, 0],
    [1200, 0],
    [1200, 1000],
    [2400, 1000],
    [2400, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ]),
  L = poly([
    [0, 0],
    [4200, 0],
    [4200, 3400],
    [1600, 3400],
    [1600, 2200],
    [0, 2200],
  ]),
  P = poly([
    [0, 0],
    [4200, 0],
    [4200, 3400],
    [1000, 3400],
    [1000, 4000],
    [0, 4000],
  ]),
  N = poly([
    [0, 0],
    [1900, 0],
    [1900, 1000],
    [2000, 1000],
    [2000, 0],
    [4200, 0],
    [4200, 3400],
    [0, 3400],
  ]);
const room = (polygon: PointMm[], wallThicknessMm = 120) => ({
  ...createProject().room,
  polygon,
  wallThicknessMm,
});
function triangles(geometry: ReturnType<typeof buildFloorGeometry>) {
  const pos = geometry.getAttribute("position"),
    indices = geometry.getIndex();
  const n = indices ? indices.count : pos.count;
  let area = 0;
  for (let i = 0; i < n; i += 3) {
    const pt = (j: number) =>
      new Vector3().fromBufferAttribute(
        pos,
        indices ? indices.getX(i + j) : i + j,
      );
    const a = pt(0),
      b = pt(1),
      c = pt(2);
    const cross = b.sub(a).cross(c.sub(a));
    expect(cross.y).toBeGreaterThan(0);
    area += cross.length() / 2;
  }
  return { area, count: n / 3 };
}
describe("3D geometry", () => {
  it("UT-3D-01,02 floor triangulates rectangle, concavity and protrusion with upward normals", () => {
    for (const p of [R, U, P]) {
      const geometry = buildFloorGeometry(p),
        result = triangles(geometry);
      expect(result.area).toBeCloseTo(getRoomArea(p) / 1e6, 6);
      if (p === R) expect(result.count).toBe(2);
      geometry.dispose();
    }
  });
  it("UT-3D-03 maps millimeters to 3D meters", () =>
    expect(toWorld3D({ x: 4200, y: 3400 }, 2400)).toEqual([4.2, 2.4, 3.4]));
  it("UT-3D-04 convex patches and narrow notch wall union stay exterior with no overlapping cells", () => {
    for (const p of [
      R,
      U,
      L,
      N,
      poly([
        [0, 0],
        [1900, 0],
        [1900, 1000],
        [2100, 1000],
        [2100, 0],
        [4200, 0],
        [4200, 3400],
        [0, 3400],
      ]),
    ]) {
      const result = buildWallCells(p, p === R ? 120 : 500);
      if (p === R) expect(result.cornerPatches).toHaveLength(4);
      for (let i = 0; i < result.cells.length; i++) {
        const a = result.cells[i];
        expect(containsRectInRoom(p, a)).toBe(false);
        for (const b of result.cells.slice(i + 1))
          expect(
            Math.min(a.maxX, b.maxX) > Math.max(a.minX, b.minX) &&
              Math.min(a.maxY, b.maxY) > Math.max(a.minY, b.minY),
          ).toBe(false);
      }
      const geometry = buildWallGeometry(room(p, p === R ? 120 : 500));
      expect(geometry.getAttribute("position").count).toBeGreaterThan(0);
      geometry.dispose();
    }
  });
  it("emits no wall sides on shared cell boundaries in a narrow notch", () => {
    const cells = buildWallCells(N, 500).cells;
    const geometry = buildWallGeometry(room(N, 500));
    const positions = geometry.getAttribute("position");
    const occupied = (x: number, z: number) =>
      cells.some((c) => x > c.minX && x < c.maxX && z > c.minY && z < c.maxY);
    const unique = new Set<string>();
    for (let i = 0; i < positions.count; i += 3) {
      const a = new Vector3().fromBufferAttribute(positions, i),
        b = new Vector3().fromBufferAttribute(positions, i + 1),
        c = new Vector3().fromBufferAttribute(positions, i + 2);
      const key = [a, b, c]
        .map((p) => p.toArray().join(","))
        .sort()
        .join("|");
      expect(unique.has(key)).toBe(false);
      unique.add(key);
      const normal = b.clone().sub(a).cross(c.clone().sub(a));
      if (Math.abs(normal.y) > 1e-8) continue;
      const center = a
        .clone()
        .add(b)
        .add(c)
        .multiplyScalar(1000 / 3);
      const dx = Math.abs(normal.x) > 1e-8 ? 0.001 : 0,
        dz = Math.abs(normal.z) > 1e-8 ? 0.001 : 0;
      expect(
        occupied(center.x - dx, center.z - dz) &&
          occupied(center.x + dx, center.z + dz),
      ).toBe(false);
    }
    geometry.dispose();
  });
  it("all 20 catalog meshes have exact local bounds and sit on floor", () => {
    for (const preset of catalog) {
      const item = createFurnitureCandidate(preset.id, { x: 0, y: 0 }, "test")!;
      const group = buildFurnitureObject(item);
      group.updateMatrixWorld(true);
      const box = new Box3().setFromObject(group),
        size = box.getSize(new Vector3());
      expect(size.x).toBeCloseTo(item.widthMm / 1000, 6);
      expect(size.z).toBeCloseTo(item.depthMm / 1000, 6);
      expect(size.y).toBeCloseTo(item.heightMm / 1000, 6);
      expect(box.min.y).toBeCloseTo(0, 6);
      disposeFurnitureObject(group);
    }
  });
  it("rotates clockwise in 2D as negative Y yaw", () => {
    const item = {
      ...createFurnitureCandidate("bed-queen", { x: 2100, y: 1700 }, "bed")!,
      rotationDeg: 90 as const,
    };
    const group = buildFurnitureObject(item);
    expect(group.rotation.y).toBeCloseTo(-Math.PI / 2);
    expect(group.position.toArray()).toEqual([2.1, 0, 1.7]);
    disposeFurnitureObject(group);
  });
  it("allows camera distance needed for a very tall, narrow room", () => {
    const tiny = {
      ...room(
        poly([
          [0, 0],
          [500, 0],
          [500, 500],
          [0, 500],
        ]),
      ),
      wallHeightMm: 5000,
    };
    const view = cameraForRoom(tiny, 0.6);
    expect(view.distance).toBeGreaterThan(view.diagonal * 6);
    expect(view.maxDistance).toBeGreaterThanOrEqual(view.distance);
    expect(cameraForRoom(room(R), 1).maxDistance).toBeCloseTo(
      cameraForRoom(room(R), 1).diagonal * 6,
    );
  });
  it("camera fits all corners for wide and tall aspects", () => {
    for (const [aspect, reference] of [
      [1.6, 7.775],
      [1, 7.775],
      [0.8, 9.347],
      [0.6, 12.206],
    ]) {
      const r = room(R),
        v = cameraForRoom(r, aspect);
      expect(v.distance).toBeCloseTo(reference, 2);
      const camera = new PerspectiveCamera(45, aspect, 0.1, 200);
      camera.position.copy(v.position);
      camera.lookAt(v.target);
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      for (const x of [0, 4.2])
        for (const y of [0, 2.4])
          for (const z of [0, 3.4]) {
            const pt = new Vector3(x, y, z).project(camera);
            expect(Math.abs(pt.x)).toBeLessThanOrEqual(0.95000001);
            expect(Math.abs(pt.y)).toBeLessThanOrEqual(0.95000001);
          }
    }
  });
});
