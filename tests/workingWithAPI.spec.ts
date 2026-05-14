import { test, expect } from "@playwright/test";
import tags from "../test-data/tags.json";

// s7-ch54 | 54. Setup New Project
// s7-ch55 | 55. Mocking API

test.beforeEach(async ({ page }) => {
  // 1. Set up the interceptor before navigating
  await page.route("*/**/api/tags", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tags),
    });
  });

  // 2. Navigate to the app
  await page.goto("https://conduit.bondaracademy.com/");
});

test("has title and mocked tags", async ({ page }) => {
  // Wait for the specific response to ensure the mock was hit
  const responsePromise = page.waitForResponse("*/**/api/tags");
  
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
  
  await responsePromise; // Verification of the network call
});