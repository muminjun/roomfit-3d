import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateAllPlacements } from '../../src/lib/geometry';
import { projectSchema } from '../../src/types/schema';
import { useProjectStore } from '../../src/store/useProjectStore';

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));
}

describe('independent required input boundaries', () => {
  it.each([
    ['performance-30walls-50furniture', 30, 50],
    ['boundary-64vertices-100furniture', 64, 100],
  ])('accepts legal %s without placement warnings', (name, vertices, furniture) => {
    const result = projectSchema.safeParse(fixture(String(name)));
    expect(result.success).toBe(true);
    if (!result.success) throw result.error;
    expect(result.data.room.polygon).toHaveLength(Number(vertices));
    expect(result.data.furniture).toHaveLength(Number(furniture));
    expect(Object.values(validateAllPlacements(result.data.room, result.data.furniture))
      .every((placement) => placement.valid)).toBe(true);
  });

  it.each(['invalid-65vertices', 'invalid-101furniture'])('rejects %s atomically', (name) => {
    const before = useProjectStore.getState();
    const parsed = projectSchema.safeParse(fixture(name));
    expect(parsed.success).toBe(false);
    // Also exercise the replacement entry point against actual excess input.
    expect(useProjectStore.getState().loadProject(fixture(name) as typeof before.project)).toBe(false);
    expect(useProjectStore.getState()).toBe(before);
  });
});
