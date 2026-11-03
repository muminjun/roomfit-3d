import { BufferGeometry, Float32BufferAttribute } from "three";
import type { Room } from "../../types/model";
import { getEdgeNormals } from "../../lib/geometry";
import {
  getOpeningCutRect,
  getPartitionRect,
  validateArchitecture,
} from "../../features/architecture/geometry";
import { buildWallCells, buildWallGeometry } from "./geometry";

type Box = {
  lo: [number, number, number];
  hi: [number, number, number];
  host: string | null;
};
type Face = { box: Box; axis: number; at: number; u: number; v: number };
/** Build exposed local surface cells of the union, subtracting each opening only from its host. */
export function buildArchitecturalWallGeometry(room: Room): BufferGeometry {
  if (!(room.partitions?.length || room.openings?.length))
    return buildWallGeometry(room);
  const box = (
    r: { minX: number; maxX: number; minY: number; maxY: number },
    bottom: number,
    top: number,
    host: string | null,
  ): Box => ({ lo: [r.minX, bottom, r.minY], hi: [r.maxX, top, r.maxY], host });
  const exteriorStrips: Box[] = room.polygon.map((a, i) => {
    const b = room.polygon[(i + 1) % room.polygon.length],
      n = getEdgeNormals(a, b).nOut,
      t = room.wallThicknessMm;
    return box(
      {
        minX: Math.min(a.x, b.x + n.x * t),
        maxX: Math.max(a.x, b.x + n.x * t),
        minY: Math.min(a.y, b.y + n.y * t),
        maxY: Math.max(a.y, b.y + n.y * t),
      },
      0,
      room.wallHeightMm,
      a.id,
    );
  });
  const { cells, cornerPatches } = buildWallCells(
    room.polygon,
    room.wallThicknessMm,
  );
  const exteriorSources = [
    ...exteriorStrips,
    ...cornerPatches.map((r) => box(r, 0, room.wallHeightMm, null)),
  ];
  const solids: Box[] = cells.flatMap((cell) => {
    const x = (cell.minX + cell.maxX) / 2;
    const z = (cell.minY + cell.maxY) / 2;
    return exteriorSources
      .filter(
        (source) =>
          x > source.lo[0] &&
          x < source.hi[0] &&
          z > source.lo[2] &&
          z < source.hi[2],
      )
      .map((source) => box(cell, 0, room.wallHeightMm, source.host));
  });
  solids.push(
    ...(room.partitions ?? []).map((p) =>
      box(getPartitionRect(p), 0, p.heightMm, p.id),
    ),
  );
  const invalid = new Set(validateArchitecture(room).map((i) => i.itemId));
  const cuts: Box[] = (room.openings ?? []).flatMap((o) => {
    const r = !invalid.has(o.id) && getOpeningCutRect(room, o);
    return r ? [box(r, o.sillMm, o.sillMm + o.heightMm, o.hostId)] : [];
  });
  const boxes = [...solids, ...cuts];
  const faces: Face[] = [];
  for (const b of boxes)
    for (let axis = 0; axis < 3; axis++) {
      const u = (axis + 1) % 3,
        v = (axis + 2) % 3;
      faces.push(
        { box: b, axis, at: b.lo[axis], u, v },
        { box: b, axis, at: b.hi[axis], u, v },
      );
    }
  const positions: number[] = [];
  const inside = (b: Box, p: number[]) =>
    p[0] > b.lo[0] &&
    p[0] < b.hi[0] &&
    p[1] > b.lo[1] &&
    p[1] < b.hi[1] &&
    p[2] > b.lo[2] &&
    p[2] < b.hi[2];
  const occupied = (p: number[], nearby: Box[]) =>
    nearby.some(
      (b) =>
        solidsSet.has(b) &&
        inside(b, p) &&
        !cuts.some((c) => c.host === b.host && inside(c, p)),
    );
  const solidsSet = new Set(solids);
  for (let fIndex = 0; fIndex < faces.length; fIndex++) {
    const f = faces[fIndex],
      { box: b, axis, at, u, v } = f;
    const nearby = boxes.filter(
      (q) =>
        q.lo[axis] <= at &&
        q.hi[axis] >= at &&
        q.lo[u] < b.hi[u] &&
        q.hi[u] > b.lo[u] &&
        q.lo[v] < b.hi[v] &&
        q.hi[v] > b.lo[v],
    );
    const relevantFaces = faces.filter(
      (q) =>
        q.axis === axis &&
        q.at === at &&
        q.box.lo[u] < b.hi[u] &&
        q.box.hi[u] > b.lo[u] &&
        q.box.lo[v] < b.hi[v] &&
        q.box.hi[v] > b.lo[v],
    );
    const split = (dim: number) =>
      [
        ...new Set([
          b.lo[dim],
          b.hi[dim],
          ...nearby.flatMap((q) => [
            Math.max(b.lo[dim], q.lo[dim]),
            Math.min(b.hi[dim], q.hi[dim]),
          ]),
        ]),
      ].sort((x, y) => x - y);
    const us = split(u),
      vs = split(v);
    for (let i = 0; i < us.length - 1; i++)
      for (let j = 0; j < vs.length - 1; j++) {
        const um = (us[i] + us[i + 1]) / 2,
          vm = (vs[j] + vs[j + 1]) / 2;
        if (
          relevantFaces.some(
            (q) =>
              faces.indexOf(q) < fIndex &&
              um > q.box.lo[u] &&
              um < q.box.hi[u] &&
              vm > q.box.lo[v] &&
              vm < q.box.hi[v],
          )
        )
          continue;
        const p = [0, 0, 0];
        p[axis] = at - 0.125;
        p[u] = um;
        p[v] = vm;
        const minus = occupied(p, nearby);
        p[axis] = at + 0.125;
        const plus = occupied(p, nearby);
        if (minus === plus) continue;
        const vertex = (uu: number, vv: number) => {
          const a = [0, 0, 0];
          a[axis] = at / 1000;
          a[u] = uu / 1000;
          a[v] = vv / 1000;
          return a;
        };
        const a = vertex(us[i], vs[j]),
          c = vertex(us[i + 1], vs[j + 1]);
        const b1 = vertex(us[i + 1], vs[j]),
          d = vertex(us[i], vs[j + 1]);
        // (u,v) follows cyclic axes, so its cross product points in the positive axis direction.
        if (minus) positions.push(...a, ...b1, ...c, ...a, ...c, ...d);
        else positions.push(...a, ...c, ...b1, ...a, ...d, ...c);
      }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
