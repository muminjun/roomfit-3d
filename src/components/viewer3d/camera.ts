import { Vector3 } from "three";
import { getBBox } from "../../lib/geometry";
import type { Room } from "../../types/model";
export function cameraForRoom(room: Room, aspect: number) {
  if (!Number.isFinite(aspect) || aspect <= 0)
    throw new Error("Invalid camera aspect");
  const bbox = getBBox(room.polygon),
    diagonal = Math.hypot(bbox.width, bbox.depth) / 1000,
    target = new Vector3(
      (bbox.minX + bbox.maxX) / 2000,
      room.wallHeightMm / 2000,
      (bbox.minY + bbox.maxY) / 2000,
    ),
    dir = new Vector3(0.6, 0.7, 0.8).normalize(),
    right = new Vector3(dir.z, 0, -dir.x).normalize(),
    up = new Vector3().crossVectors(dir, right),
    tan = Math.tan(Math.PI / 8);
  let distance = 1.2 * diagonal;
  for (const x of [bbox.minX / 1000, bbox.maxX / 1000])
    for (const y of [0, room.wallHeightMm / 1000])
      for (const z of [bbox.minY / 1000, bbox.maxY / 1000]) {
        const q = new Vector3(x, y, z).sub(target);
        distance = Math.max(
          distance,
          dir.dot(q) +
            Math.max(
              Math.abs(right.dot(q)) / (0.95 * tan * aspect),
              Math.abs(up.dot(q)) / (0.95 * tan),
            ),
        );
      }
  return {
    target,
    position: target.clone().addScaledVector(dir, distance),
    distance,
    diagonal,
    maxDistance: Math.max(6 * diagonal, distance),
  };
}
