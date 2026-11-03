import { test as base, expect } from "@playwright/test";

/** Editor regressions start after the introduction; no project or autosave is seeded. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      for (const basePath of ["/", "/roomfit-3d/"]) {
        localStorage.setItem(`roomfit3d:v2:${basePath}:welcome`, "dismissed");
      }
    });
    await use(page);
  },
});

export { expect };

export type { Page } from "@playwright/test";
