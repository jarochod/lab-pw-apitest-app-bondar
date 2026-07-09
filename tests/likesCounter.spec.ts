import { test, expect } from "@playwright/test";

// s8-ch69 | 69. Project Setup and Teardown

test("Like counter increase", async ({ page }) => {
  await page.goto("https://conduit.bondaracademy.com/");
  await page.getByText("Global Feed").click();

  // Locate the like button inside the first article preview
  const firstLikeButton = page.locator("app-article-preview").first().locator("button");

  // Assert counter increments correctly on click
  await expect(firstLikeButton).toContainText('0');
  await firstLikeButton.click();
  await expect(firstLikeButton).toContainText('1');
});
