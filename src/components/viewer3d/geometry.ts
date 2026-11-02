import {
  BufferGeometry,
  Float32BufferAttribute,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import type { PointMm, Room } from "../../types/model";
import { getEdgeNormals, type Rect } from "../../lib/geometry";
export const toWorld3D = (
  point: { x: number; y: number },
  heightMm: number,
): [number, number, number] => [
  point.x / 1000,
  heightMm / 1000,
  point.y / 1000,
];
export function buildFloorGeometry(polygon: PointMm[]): ShapeGeometry {
  const shape = new Shape(
    polygon.map((p) => new Vector2(p.x / 1000, -p.y / 1000)),
  );
  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
function isInside(polygon: PointMm[], x: number, y: number) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      result = !result;
  }
  return result;
}
const rect = (x1: number, y1: number, x2: number, y2: number): Rect => ({
  minX: Math.min(x1, x2),
  minY: Math.min(y1, y2),
  maxX: Math.max(x1, x2),
  maxY: Math.max(y1, y2),
});
export function buildWallCells(
  polygon: PointMm[],
  thickness: number,
): { cells: Rect[]; cornerPatches: Rect[] } {
  const strips: Rect[] = [],
    cornerPatches: Rect[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % polygon.length],
      prev = polygon[(i + polygon.length - 1) % polygon.length];
    const n = getEdgeNormals(a, b).nOut;
    strips.push(rect(a.x, a.y, b.x + n.x * thickness, b.y + n.y * thickness));
    const before = getEdgeNormals(prev, a).nOut;
    const cross = (a.x - prev.x) * (b.y - a.y) - (a.y - prev.y) * (b.x - a.x);
    if (cross > 0)
      cornerPatches.push(
        rect(
          a.x,
          a.y,
          a.x + (before.x + n.x) * thickness,
          a.y + (before.y + n.y) * thickness,
        ),
      );
  }
  const all = [...strips, ...cornerPatches];
  const xs = [
      ...new Set([
        ...all.flatMap((r) => [r.minX, r.maxX]),
        ...polygon.map((p) => p.x),
      ]),
    ].sort((a, b) => a - b),
    ys = [
      ...new Set([
        ...all.flatMap((r) => [r.minY, r.maxY]),
        ...polygon.map((p) => p.y),
      ]),
    ].sort((a, b) => a - b);
  const cells: Rect[] = [];
  for (let i = 1; i < xs.length; i++)
    for (let j = 1; j < ys.length; j++) {
      const cell = rect(xs[i - 1], ys[j - 1], xs[i], ys[j]),
        x = (cell.minX + cell.maxX) / 2,
        y = (cell.minY + cell.maxY) / 2;
      if (
        !isInside(polygon, x, y) &&
        all.some((r) => x > r.minX && x < r.maxX && y > r.minY && y < r.maxY)
      )
        cells.push(cell);
    }
  return { cells, cornerPatches };
}
export function buildWallGeometry(room: Room): BufferGeometry {
  const { cells } = buildWallCells(room.polygon, room.wallThicknessMm),
    h = room.wallHeightMm / 1000;
  const positions: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  const cellKeys = new Set(
    cells.map((r) => `${r.minX},${r.minY},${r.maxX},${r.maxY}`),
  );
  const occupied = (x0: number, y0: number, x1: number, y1: number) =>
    cellKeys.has(`${x0},${y0},${x1},${y1}`);
  const xs = [...new Set(cells.flatMap((r) => [r.minX, r.maxX]))].sort(
      (a, b) => a - b,
    ),
    ys = [...new Set(cells.flatMap((r) => [r.minY, r.maxY]))].sort(
      (a, b) => a - b,
    );
  for (const cell of cells) {
    const { minX: x0, maxX: x1, minY: z0, maxY: z1 } = cell;
    const a = x0 / 1000,
      b = x1 / 1000,
      c = z0 / 1000,
      d = z1 / 1000;
    quad([a, h, c], [a, h, d], [b, h, d], [b, h, c]);
    // Find adjacent intervals from the grid boundaries, rather than sampling beyond a narrow neighbor.
    const xi = xs.indexOf(x0),
      xj = xs.indexOf(x1),
      yi = ys.indexOf(z0),
      yj = ys.indexOf(z1);
    if (xi === 0 || !occupied(xs[xi - 1], z0, x0, z1))
      quad([a, 0, c], [a, 0, d], [a, h, d], [a, h, c]);
    if (xj === xs.length - 1 || !occupied(x1, z0, xs[xj + 1], z1))
      quad([b, 0, d], [b, 0, c], [b, h, c], [b, h, d]);
    if (yi === 0 || !occupied(x0, ys[yi - 1], x1, z0))
      quad([b, 0, c], [a, 0, c], [a, h, c], [b, h, c]);
    if (yj === ys.length - 1 || !occupied(x0, z1, x1, ys[yj + 1]))
      quad([a, 0, d], [b, 0, d], [b, h, d], [a, h, d]);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
