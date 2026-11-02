import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";
import type { FurnitureItem } from "../../types/model";

/** Builds one low-poly representation, in local coordinates, with an exact W × H × D envelope. */
export function buildFurnitureObject(item: FurnitureItem): Group {
  const group = new Group();
  group.position.set(item.position.x / 1000, 0, item.position.y / 1000);
  group.rotation.y = (-item.rotationDeg * Math.PI) / 180;
  const w = item.widthMm / 1000,
    h = item.heightMm / 1000,
    d = item.depthMm / 1000;
  const body = new MeshStandardMaterial({ color: item.color ?? "#81a4b2" }),
    accent = new MeshStandardMaterial({ color: "#4d6270" }),
    light = new MeshStandardMaterial({ color: "#edf3f1" });
  const box = (
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material = body,
    front = false,
  ) => {
    const faceMaterials = front
      ? [material, material, material, material, material, light]
      : material;
    const mesh = new Mesh(new BoxGeometry(width, height, depth), faceMaterials);
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
  const legs = () => {
    const lx = w * 0.08,
      lz = d * 0.08,
      lh = h * 0.78;
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        box(lx, lh, lz, (x * (w - lx)) / 2, lh / 2, (z * (d - lz)) / 2, accent);
  };
  switch (item.kind) {
    case "table":
    case "desk":
      legs();
      box(w, h * 0.22, d, 0, h * 0.89, 0, body, true);
      break;
    case "bed":
      box(w, h * 0.35, d, 0, h * 0.175, 0, accent, true);
      box(w, h * 0.45, d, 0, h * 0.575, 0, light);
      box(w, h * 0.2, d * 0.1, 0, h * 0.9, d * 0.45, body);
      break;
    case "sofa":
      box(w, h * 0.4, d, 0, h * 0.2, 0, accent, true);
      box(w, h * 0.3, d * 0.8, 0, h * 0.55, -d * 0.1, body);
      box(w, h * 0.3, d * 0.2, 0, h * 0.85, d * 0.4, body);
      for (const side of [-1, 1])
        box(
          w * 0.1,
          h * 0.36,
          d * 0.68,
          side * w * 0.44,
          h * 0.58,
          -d * 0.08,
          body,
        );
      break;
    case "chair":
      legs();
      box(w, h * 0.16, d, 0, h * 0.6, 0, body, true);
      box(w, h * 0.32, d * 0.12, 0, h * 0.84, d * 0.44, body);
      break;
    case "washingMachine": {
      box(w, h, d * 0.92, 0, h / 2, d * 0.04, body);
      const radius = Math.min(w, h) * 0.32;
      const door = new Mesh(
        new CylinderGeometry(radius, radius, d * 0.07, 32),
        accent,
      );
      door.rotation.x = Math.PI / 2;
      door.position.set(0, h * 0.52, -d * 0.465);
      group.add(door);
      break;
    }
    case "refrigerator":
    case "wardrobe":
    case "storage": {
      // The body front is recessed; panels and handles occupy disjoint depth layers.
      box(w, h, d * 0.92, 0, h / 2, d * 0.04, body);
      if (
        item.catalogId === "bookshelf" ||
        item.catalogId === "storage-shelf"
      ) {
        for (const y of [0.15, 0.4, 0.65, 0.9])
          box(w * 0.88, h * 0.035, d * 0.08, 0, h * y, -d * 0.46, accent);
      } else if (item.kind === "refrigerator") {
        box(w * 0.94, h * 0.63, d * 0.06, 0, h * 0.66, -d * 0.45, light);
        box(w * 0.94, h * 0.28, d * 0.06, 0, h * 0.165, -d * 0.45, light);
        box(
          w * 0.05,
          h * 0.14,
          d * 0.02,
          -w * 0.32,
          h * 0.7,
          -d * 0.49,
          accent,
        );
      } else if (item.kind === "wardrobe") {
        for (const x of [-1, 1]) {
          box(
            w * 0.46,
            h * 0.94,
            d * 0.06,
            x * w * 0.24,
            h * 0.5,
            -d * 0.45,
            light,
          );
          box(
            w * 0.025,
            h * 0.12,
            d * 0.02,
            x * w * 0.05,
            h * 0.55,
            -d * 0.49,
            accent,
          );
        }
      } else {
        for (const y of [0.19, 0.5, 0.81]) {
          box(w * 0.92, h * 0.27, d * 0.06, 0, h * y, -d * 0.45, light);
          box(w * 0.14, h * 0.025, d * 0.02, 0, h * y, -d * 0.49, accent);
        }
      }
      break;
    }
    default:
      box(w, h, d, 0, h / 2, 0, body, true);
      break;
  }
  return group;
}
export function disposeFurnitureObject(group: Group): void {
  const materials = new Set<MeshStandardMaterial>();
  group.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of list)
        if (material instanceof MeshStandardMaterial) materials.add(material);
    }
  });
  materials.forEach((material) => material.dispose());
}
