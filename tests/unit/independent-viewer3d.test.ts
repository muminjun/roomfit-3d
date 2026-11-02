import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraForRoom } from '../../src/components/viewer3d/camera';
import { buildFloorGeometry } from '../../src/components/viewer3d/geometry';
import { createProject } from '../../src/features/project/createProject';

describe('independent 3D coordinate and camera acceptance', () => {
  it.each([1.6, 1, 0.8, 0.6])('fits the room at the minimum projection distance for aspect %s', (aspect) => {
    const result = cameraForRoom(createProject().room, aspect);
    expect(result.target.toArray()).toEqual([2.1, 1.2, 1.7]);
    const direction = new Vector3(0.6, 0.7, 0.8).normalize();
    expect(result.position.clone().sub(result.target).normalize().distanceTo(direction)).toBeLessThan(1e-12);
    const corners: Vector3[] = [];
    for (const x of [0, 4.2]) for (const y of [0, 2.4]) for (const z of [0, 3.4]) corners.push(new Vector3(x, y, z));
    const camera = new PerspectiveCamera(45, aspect, 0.1, 200);
    const fits = (distance: number) => {
      camera.position.set(2.1, 1.2, 1.7).addScaledVector(direction, distance);
      camera.lookAt(2.1, 1.2, 1.7);
      camera.updateMatrixWorld();
      return corners.every((corner) => {
        const projected = corner.clone().project(camera);
        return Math.abs(projected.x) <= 0.95 && Math.abs(projected.y) <= 0.95 && projected.z >= -1 && projected.z <= 1;
      });
    };
    // Independent numeric projection search, rather than the production formula.
    let low = 0.1, high = 100;
    for (let step = 0; step < 60; step++) {
      const middle = (low + high) / 2;
      if (fits(middle)) high = middle;
      else low = middle;
    }
    expect(Math.abs(result.distance - Math.max(1.2 * Math.hypot(4.2, 3.4), high))).toBeLessThan(1e-6);
  });

  it('the actual concave floor buffers preserve negative coordinates and upward normals', () => {
    const coordinates = [[0, 0], [1600, 0], [1600, -600], [2600, -600], [2600, 0], [4200, 0], [4200, 3400], [0, 3400]];
    const polygon = coordinates.map(([x, y], index) => ({ id: `vertex-${index}`, x, y }));
    const geometry = buildFloorGeometry(polygon);
    try {
      const positions = geometry.getAttribute('position'), indices = geometry.getIndex();
      expect(positions.count).toBe(coordinates.length);
      for (let i = 0; i < positions.count; i++) {
        expect(Math.abs(positions.getY(i))).toBeLessThan(1e-6);
        expect(coordinates.some(([x, y]) => Math.abs(positions.getX(i) - x / 1000) < 1e-6 && Math.abs(positions.getZ(i) - y / 1000) < 1e-6)).toBe(true);
      }
      let area = 0;
      const count = indices?.count ?? positions.count;
      for (let index = 0; index < count; index += 3) {
        const points = [0, 1, 2].map((offset) => new Vector3().fromBufferAttribute(positions, indices ? indices.getX(index + offset) : index + offset));
        const normal = points[1].sub(points[0]).cross(points[2].sub(points[0]));
        expect(normal.y).toBeGreaterThan(0);
        area += normal.length() / 2;
      }
      expect(Math.abs(area - 14.88)).toBeLessThan(1e-6);
    } finally {
      geometry.dispose();
    }
  });
});
