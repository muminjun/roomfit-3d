// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveShortcut, shortcutHelp } from "../../src/config/shortcuts";

describe("escape shortcut", () => {
  it("is executed and documented by the same registry", () => {
    expect(
      resolveShortcut(
        new KeyboardEvent("keydown", { code: "Escape", key: "Escape" }),
      ),
    ).toBe("cancel");
    expect(shortcutHelp.filter((item) => item.label === "Esc")).toHaveLength(1);
  });
});

it("includes the obstacle name in a collision reason", async () => {
  const { describeFurnitureIssues } =
    await import("../../src/components/editor2d/furnitureShortcuts");
  expect(
    describeFurnitureIssues(
      [{ message: "가구와 겹칩니다.", targetId: "other" }],
      [{ id: "other", name: "소파" }],
    ),
  ).toContain("소파");
});
