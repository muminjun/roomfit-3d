import { describe, it, expect } from "vitest";
import { projectSchema } from "../../src/types/schema";
import { createProject } from "../../src/features/project/createProject";
import { createFurnitureCandidate } from "../../src/features/furniture/commands";
import {
  parseProjectJson,
  serializeProjectJson,
  projectFilename,
} from "../../src/features/project/json";
import type { ProjectDataV2, PointMm } from "../../src/types/model";
const seq = () => {
  let i = 0;
  return () => `id-${++i}`;
};
const initial = () => createProject(4200, 3400, 2400, 120, seq());
const parse = (x: unknown) => parseProjectJson(JSON.stringify(x));
const points = (coords: number[][]): PointMm[] =>
  coords.map(([x, y], i) => ({ id: `v${i}`, x, y }));
const item = (id: string) =>
  createFurnitureCandidate("nightstand", { x: 500, y: 500 }, id)!;
describe("strict JSON import and export", () => {
  it("UT-ST-01 rejects untrusted keys, duplicate IDs, invalid version, position and bytes", () => {
    const p = initial();
    const unknown = { ...p, rogue: true };
    const injected = JSON.stringify(p).replace(
      '"schemaVersion":2',
      '"__proto__":{},"schemaVersion":2',
    );
    expect(parse(unknown).ok).toBe(false);
    expect(parseProjectJson(injected).ok).toBe(false);
    expect(projectSchema.safeParse(JSON.parse(injected)).success).toBe(false);
    expect(
      parse({
        ...p,
        room: {
          ...p.room,
          polygon: p.room.polygon.map((v, i) =>
            i === 1 ? { ...v, id: p.room.polygon[0].id } : v,
          ),
        },
      }).ok,
    ).toBe(false);
    for (const version of [0, 3, 999, undefined])
      expect(parse({ ...p, schemaVersion: version }).ok).toBe(false);
    expect(
      parse({
        ...p,
        furniture: [{ ...item("f"), position: { x: 500.3, y: 500 } }],
      }).ok,
    ).toBe(false);
    expect(parseProjectJson("한".repeat(700000)).ok).toBe(false);
    expect(
      parse({ ...p, furniture: [{ ...item("f"), color: "#123456" }] }).ok,
    ).toBe(false);
    expect(parse({ ...p, title: "x".repeat(61) }).ok).toBe(false);
    expect(parse({ ...p, title: "room\u0085name" }).ok).toBe(false);
  });
  it("rejects deeply nested malformed JSON without throwing", () => {
    const raw =
      '{"schemaVersion":2,"extra":' +
      "[".repeat(20000) +
      "0" +
      "]".repeat(20000) +
      "}";
    expect(() => parseProjectJson(raw)).not.toThrow();
    expect(parseProjectJson(raw).ok).toBe(false);
    const prototypePayload =
      '{"schemaVersion":2,"extra":' +
      "[".repeat(20000) +
      '{"__proto__":{}}' +
      "]".repeat(20000) +
      "}";
    expect(() => parseProjectJson(prototypePayload)).not.toThrow();
    expect(parseProjectJson(prototypePayload).ok).toBe(false);
  });
  it("UT-ST-02 preserves metadata, all fields, IDs and settings", () => {
    const p = {
      ...initial(),
      title: "내 방",
      furniture: [item("f")],
      settings: {
        gridSizeMm: 10 as const,
        snapEnabled: false,
        gridVisible: false,
      },
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2021-01-01T00:00:00.000Z",
    };
    const result = parseProjectJson(serializeProjectJson(p));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.project).toEqual(p);
  });
  it("UT-ST-04 sanitizes Unicode filenames and uses UTC date", () => {
    expect(
      projectFilename("내 방: 침실/1?", new Date("2026-11-03T00:00:00Z")),
    ).toBe("roomfit-내-방-침실1-20261103.json");
    expect(projectFilename("???", new Date("2026-11-03T00:00:00Z"))).toBe(
      "roomfit-project-20261103.json",
    );
  });
  it("reverses counterclockwise preserving vertex IDs with change summary", () => {
    const p = initial(),
      polygon = [...p.room.polygon].reverse();
    const result = parse({ ...p, room: { ...p.room, polygon } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.room.polygon).toEqual(p.room.polygon);
      expect(result.changes.length).toBeGreaterThan(0);
    }
  });
  it("normalizes legitimate collinear midpoints but rejects malformed raw geometry", () => {
    const p = initial();
    const mid = points([
      [0, 0],
      [2100, 0],
      [4200, 0],
      [4200, 3400],
      [0, 3400],
    ]);
    const r = parse({ ...p, room: { ...p.room, polygon: mid } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.project.room.polygon).toHaveLength(4);
      expect(r.changes.length).toBeGreaterThan(0);
    }
    const invalid = [
      [
        [0, 0],
        [4200, 0],
        [4200, 3400],
        [0, 3400],
        [0, 0],
      ],
      [
        [0, 0],
        [4200, 0],
        [4200, 3400],
        [0, 3400],
        [4200, 0],
      ],
      [
        [0, 0],
        [2000, 0],
        [1000, 0],
        [4200, 0],
        [4200, 3400],
        [0, 3400],
      ],
      [
        [0, 0],
        [4200, 0],
        [4200, 3400],
        [2100, 3400],
        [2100, -500],
        [1000, -500],
        [1000, 2400],
        [0, 2400],
      ],
      [
        [0, 0],
        [4200, 0],
        [4200, 3400],
        [2500, 3400],
        [2500, 0],
        [1500, 0],
        [1500, 2500],
        [0, 2500],
      ],
    ];
    for (const coords of invalid)
      expect(
        parse({ ...p, room: { ...p.room, polygon: points(coords) } }).ok,
      ).toBe(false);
  });
  it("removes a short collinear midpoint but rejects a remaining short wall", () => {
    const p = initial();
    const safe = points([
      [0, 0],
      [50, 0],
      [4200, 0],
      [4200, 3400],
      [0, 3400],
    ]);
    const result = parse({ ...p, room: { ...p.room, polygon: safe } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.room.polygon).toHaveLength(4);
      expect(result.changes.length).toBeGreaterThan(0);
    }
    const short = points([
      [0, 0],
      [99, 0],
      [99, 100],
      [4200, 100],
      [4200, 3400],
      [0, 3400],
    ]);
    expect(parse({ ...p, room: { ...p.room, polygon: short } }).ok).toBe(false);
  });
  it("preserves safe outside-room furniture centers beyond polygon coordinate bounds", () => {
    const p = initial();
    const far = { ...item("far"), position: { x: 31000, y: 500 } };
    const result = parse({ ...p, furniture: [far] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.furniture[0]).toEqual(far);
      expect(result.warnings.join(" ")).toContain("방 바닥 밖");
    }
    expect(
      parse({
        ...p,
        furniture: [
          { ...far, position: { x: Number.MAX_SAFE_INTEGER, y: 500 } },
        ],
      }).ok,
    ).toBe(false);
    expect(
      parse({
        ...p,
        furniture: [{ ...far, position: { x: Infinity, y: 500 } }],
      }).ok,
    ).toBe(false);
  });
  it("preserves invalid placements as warnings and maps unknown catalog to other", () => {
    const p = initial(),
      f = {
        ...item("f"),
        catalogId: "unknown",
        kind: "bed" as const,
        position: { x: 5000, y: 500 },
      };
    const result = parse({ ...p, furniture: [f] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.furniture[0]).toMatchObject({
        id: "f",
        kind: "other",
        position: f.position,
      });
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });
  it("rejects overlimits and permits 64 vertices and 100 furniture", () => {
    const p = initial();
    const coords: number[][] = [[0, 0]];
    for (let i = 0; i < 15; i++) {
      const x = 100 + i * 200;
      coords.push([x, 0], [x, 100], [x + 100, 100], [x + 100, 0]);
    }
    coords.push([4200, 0], [4200, 3400], [0, 3400]);
    expect(coords).toHaveLength(64);
    const polygon = points(coords),
      furniture = Array.from({ length: 100 }, (_, i) => item(`f${i}`));
    expect(parse({ ...p, room: { ...p.room, polygon }, furniture }).ok).toBe(
      true,
    );
    expect(
      parse({
        ...p,
        room: {
          ...p.room,
          polygon: [...polygon, { id: "extra", x: 0, y: 1700 }],
        },
      }).ok,
    ).toBe(false);
    expect(parse({ ...p, furniture: [...furniture, item("extra")] }).ok).toBe(
      false,
    );
  });
  it("serializes whitelist only and never extra properties", () => {
    const p = initial();
    const dirty = {
      ...p,
      extra: "secret",
      room: { ...p.room, extra: 1 },
      furniture: [{ ...item("f"), extra: 2 }],
    } as unknown as ProjectDataV2;
    const json = serializeProjectJson(dirty);
    expect(json).not.toContain("extra");
    expect(parseProjectJson(json).ok).toBe(true);
  });
});
