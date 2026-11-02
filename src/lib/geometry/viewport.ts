export type Vec = { x: number; y: number };
export type Viewport = { zoom: number; panX: number; panY: number };
export function worldToScreen(point: Vec, v: Viewport): Vec {
  return { x: point.x * v.zoom + v.panX, y: point.y * v.zoom + v.panY };
}
export function screenToWorld(point: Vec, v: Viewport): Vec {
  if (!Number.isFinite(v.zoom) || v.zoom <= 0) throw new Error("Invalid zoom");
  return { x: (point.x - v.panX) / v.zoom, y: (point.y - v.panY) / v.zoom };
}
export function zoomAtPointer(
  v: Viewport,
  pointer: Vec,
  zoom: number,
): Viewport {
  if (!Number.isFinite(zoom) || zoom <= 0) throw new Error("Invalid zoom");
  const q = screenToWorld(pointer, v);
  return { zoom, panX: pointer.x - q.x * zoom, panY: pointer.y - q.y * zoom };
}
