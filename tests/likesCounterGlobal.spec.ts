import { test, expect } from "@playwright/test";

// s8-ch70 | 70. Global Setup and Teardown

test("Like counter increase", async ({ page }) => {
  // 1. Navigation and switching tabs
  await page.goto("https://conduit.bondaracademy.com/");
  await page.getByText("Global Feed").click();

  // 2. Locate the like button inside the first article preview
  const firstLikeButton = page.locator("app-article-preview").first().locator("button");

  // 3. Interact and assert that the like counter increments
  await expect(firstLikeButton).toContainText("0");
  await firstLikeButton.click();
  await expect(firstLikeButton).toContainText("1");
});
