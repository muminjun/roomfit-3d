import { z } from "zod";
import { COLORS, LIMITS } from "../config/limits";
import { validateRoomPolygon } from "../lib/geometry/polygon";
const text = (max: number) =>
  z
    .string()
    .refine(
      (s) =>
        s === s.trim() &&
        !/\p{Cc}/u.test(s) &&
        [...s].length >= 1 &&
        [...s].length <= max,
      "문자열 길이나 문자가 올바르지 않습니다",
    );
const id = text(200);
const integer = (min: number, max: number) =>
  z.number().int().min(min).max(max);
const coordinate = integer(-LIMITS.roomMax, LIMITS.roomMax);
const point = z.object({ id, x: coordinate, y: coordinate }).strict();
const half = z
  .number()
  .finite()
  .refine((n) => Number.isSafeInteger(n * 2));
const furniture = z
  .object({
    id,
    catalogId: id,
    kind: z.enum([
      "bed",
      "sofa",
      "table",
      "desk",
      "wardrobe",
      "storage",
      "refrigerator",
      "washingMachine",
      "chair",
      "other",
    ]),
    name: text(40),
    position: z.object({ x: half, y: half }).strict(),
    widthMm: integer(100, 10000),
    depthMm: integer(100, 10000),
    heightMm: integer(50, 5000),
    rotationDeg: z.union([
      z.literal(0),
      z.literal(90),
      z.literal(180),
      z.literal(270),
    ]),
    color: z.enum(COLORS).optional(),
  })
  .strict();
export const rawProjectSchema = z
  .object({
    schemaVersion: z.literal(2),
    id,
    title: text(60),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    unit: z.literal("mm"),
    room: z
      .object({
        id,
        name: text(60),
        polygon: z.array(point).min(4).max(LIMITS.maxVertices),
        wallHeightMm: integer(1800, 5000),
        wallThicknessMm: integer(50, 500),
      })
      .strict(),
    furniture: z.array(furniture).max(LIMITS.maxFurniture),
    settings: z
      .object({
        gridSizeMm: z.union([
          z.literal(10),
          z.literal(50),
          z.literal(100),
          z.literal(500),
        ]),
        snapEnabled: z.boolean(),
        gridVisible: z.boolean(),
      })
      .strict(),
  })
  .strict();
export const projectSchema = rawProjectSchema.superRefine((p, ctx) => {
  const ids = [
    p.id,
    p.room.id,
    ...p.room.polygon.map((v) => v.id),
    ...p.furniture.map((f) => f.id),
  ];
  if (new Set(ids).size !== ids.length)
    ctx.addIssue({ code: "custom", message: "중복 ID" });
  const validation = validateRoomPolygon(p.room.polygon);
  if (!validation.ok)
    ctx.addIssue({ code: "custom", message: validation.message });
  const pts = p.room.polygon;
  const xs = pts.map((v) => v.x),
    ys = pts.map((v) => v.y);
  const w = Math.max(...xs) - Math.min(...xs),
    d = Math.max(...ys) - Math.min(...ys);
  if (w < 500 || d < 500 || w > 30000 || d > 30000)
    ctx.addIssue({ code: "custom", message: "방 크기가 범위를 벗어납니다" });
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    if (
      (a.x !== b.x && a.y !== b.y) ||
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 100
    )
      ctx.addIssue({
        code: "custom",
        message: "벽은 100mm 이상의 직각 선분이어야 합니다",
      });
  }
});
