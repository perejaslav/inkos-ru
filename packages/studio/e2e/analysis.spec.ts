import { test, expect } from "@playwright/test";
import { seedAnalysis, E2E_ANALYSIS_ID } from "./fixtures/seed-analysis";

test.beforeAll(async () => {
  await seedAnalysis();
});

test("analysis panel shows validation issues and both reachable ending paths", async ({ page }) => {
  // 1. Open the film wizard page and wait for the stepper to render.
  await page.goto(`/#/studio/film/${E2E_ANALYSIS_ID}`);
  await expect(page.getByTestId("film-wizard")).toBeVisible({ timeout: 20_000 });

  // 2. Click the validate step button.
  await page.getByTestId("wizard-step-validate").click();

  // 3. The validation panel must be visible and list the seeded GATED_UNREACHABLE issue.
  //    "locked" is edge-reachable from start but trust (default 0) is never written to >=9,
  //    so no runtime path reaches it → GATED_UNREACHABLE fires instead of the old ISOLATED_NODE.
  await expect(page.getByTestId("validation-panel")).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByTestId("validation-issue-GATED_UNREACHABLE").first(),
  ).toBeVisible({ timeout: 15_000 });

  // 4. The current analysis contract exposes validation + executable path distribution.
  //    The emotion arc was removed with the creative harness v2 migration.
  const distribution = page.getByTestId("path-distribution");
  await expect(distribution).toBeVisible({ timeout: 15_000 });
  await expect(distribution.locator('[title="eg1"]')).toBeVisible();
  await expect(distribution.locator('[title="eb1"]')).toBeVisible();

  // 5. Check real path counts; the guarded "locked" node contributes no route.
  const response = await page.request.get(`/api/v1/projects/${E2E_ANALYSIS_ID}/story-graph/analysis`);
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    distribution: {
      total: 2,
      truncated: false,
      byEnding: { eg1: 1, eb1: 1 },
      lengthHistogram: { 2: 2 },
    },
  });
});
